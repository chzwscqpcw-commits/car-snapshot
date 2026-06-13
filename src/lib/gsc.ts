import { getGoogleAccessToken, loadGoogleServiceKey } from "@/lib/google-auth";
import { supabaseServerRole } from "@/lib/supabaseServer";

/**
 * The commercial query cluster we actually care about — the "free car valuation
 * without email" family that drives /car-valuation + /value-my-car, our breakout
 * organic entry pages. Site-wide "average position" is a vanity metric dominated
 * by low-ranking long-tail/blog impressions; THESE are the rankings that convert.
 *
 * Edit this list to add/remove tracked terms — the dashboard + weekly snapshot
 * follow it automatically.
 */
export const KEY_QUERIES: string[] = [
  "free car valuation without email",
  "free car valuation without email uk",
  "car valuation without email",
  "car valuation without personal details",
  "free car valuation without personal details",
  "how much is my car worth uk without email",
  "car valuation no email required",
  "value my car no sign up",
  "free car valuation",
  "free plate check",
  "freeplatecheck",
];

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

/**
 * GSC property. URL-prefix property by default; for a Domain property set
 * GSC_SITE_URL="sc-domain:freeplatecheck.co.uk".
 */
function siteUrl(): string {
  return process.env.GSC_SITE_URL || "https://www.freeplatecheck.co.uk/";
}

export interface QueryPosition {
  query: string;
  position: number; // rounded to 1dp; 0 = not in the result set for the window
  clicks: number;
  impressions: number;
  ctr: number; // 0..1
}

export interface GscSnapshot {
  date: string; // YYYY-MM-DD the snapshot was taken
  startDate: string;
  endDate: string;
  queries: QueryPosition[]; // the tracked KEY_QUERIES (0-position when no data)
  totals: { clicks: number; impressions: number; position: number };
}

export type GscResult =
  | { status: "ok"; snapshot: GscSnapshot }
  | { status: "not_configured"; reason: string }
  | { status: "error"; reason: string };

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Pull last-28-day Search Analytics for our key queries from the Search Console
 * API. GSC data lags ~2-3 days, so the window ends 3 days back to avoid a
 * partial tail. Never throws — returns a graceful status object so the cron and
 * dashboard degrade cleanly when creds/permission aren't set up.
 */
export async function fetchKeyQueryPositions(): Promise<GscResult> {
  const key = loadGoogleServiceKey();
  if (!key) {
    return { status: "not_configured", reason: "GOOGLE_INDEXING_KEY not set" };
  }

  let token: string;
  try {
    token = await getGoogleAccessToken(key, SCOPE);
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }

  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 28);

  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl(),
  )}/searchAnalytics/query`;

  let rows: GscRow[];
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: ymd(start),
        endDate: ymd(end),
        dimensions: ["query"],
        rowLimit: 2000,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 403) {
        return {
          status: "not_configured",
          reason: `403 — service account not added to the GSC property (or Search Console API not enabled). ${body.slice(0, 180)}`,
        };
      }
      return { status: "error", reason: `Search Analytics ${res.status}: ${body.slice(0, 180)}` };
    }
    const json = (await res.json()) as { rows?: GscRow[] };
    rows = json.rows ?? [];
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }

  const byQuery = new Map<string, GscRow>();
  for (const r of rows) {
    byQuery.set((r.keys[0] || "").toLowerCase(), r);
  }

  const queries: QueryPosition[] = KEY_QUERIES.map((q) => {
    const r = byQuery.get(q.toLowerCase());
    return {
      query: q,
      position: r ? Math.round(r.position * 10) / 10 : 0,
      clicks: r ? r.clicks : 0,
      impressions: r ? r.impressions : 0,
      ctr: r ? r.ctr : 0,
    };
  });

  // Site-wide totals across ALL queries in the window (context, not the headline).
  let clicks = 0;
  let impressions = 0;
  let weightedPos = 0;
  for (const r of rows) {
    clicks += r.clicks;
    impressions += r.impressions;
    weightedPos += r.position * r.impressions;
  }
  const totals = {
    clicks,
    impressions,
    position: impressions ? Math.round((weightedPos / impressions) * 10) / 10 : 0,
  };

  return {
    status: "ok",
    snapshot: {
      date: ymd(new Date()),
      startDate: ymd(start),
      endDate: ymd(end),
      queries,
      totals,
    },
  };
}

// ── Snapshot cache (Supabase `data_cache`, key `gsc_positions`) ──────────────

const CACHE_KEY = "gsc_positions";
const MAX_HISTORY = 26; // ~6 months of weekly snapshots

export interface GscCachePayload {
  latest: GscSnapshot | null;
  history: GscSnapshot[]; // oldest → newest; each weekly run appends one
  updatedAt: string;
  status: "ok" | "not_configured" | "error";
  reason?: string;
}

/** Read the stored snapshot history (service-role: data_cache is RLS-locked). */
export async function readGscCache(): Promise<GscCachePayload | null> {
  const sb = supabaseServerRole();
  const { data } = await sb
    .from("data_cache")
    .select("data")
    .eq("key", CACHE_KEY)
    .maybeSingle();
  return (data?.data as GscCachePayload | undefined) ?? null;
}

/**
 * Pull a fresh snapshot and persist it: append to history on success (replacing
 * a same-day re-run), or record the non-ok status without losing prior history.
 * Shared by the weekly cron and the dashboard's manual refresh.
 */
export async function refreshGscSnapshot(): Promise<GscCachePayload> {
  const result = await fetchKeyQueryPositions();
  const sb = supabaseServerRole();
  const now = new Date().toISOString();
  const prev = (await readGscCache()) ?? {
    latest: null,
    history: [],
    updatedAt: now,
    status: "ok" as const,
  };

  let payload: GscCachePayload;
  if (result.status !== "ok") {
    payload = { ...prev, updatedAt: now, status: result.status, reason: result.reason };
  } else {
    const history = (prev.history ?? []).filter((s) => s.date !== result.snapshot.date);
    history.push(result.snapshot);
    while (history.length > MAX_HISTORY) history.shift();
    payload = { latest: result.snapshot, history, updatedAt: now, status: "ok" };
  }

  await sb
    .from("data_cache")
    .upsert({ key: CACHE_KEY, data: payload, updated_at: now }, { onConflict: "key" });
  return payload;
}
