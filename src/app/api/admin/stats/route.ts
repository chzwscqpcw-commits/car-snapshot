export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer, supabaseServerRole } from "@/lib/supabaseServer";

export type TopMake = { make: string; count: number };

export type CaptureTrigger = { trigger_variant: string; count: number };
export type PartnerContextCount = { context: string; count: number };
export type SectionReach = { section_id: string; count: number; pct: number };
export type BookingStepCount = { step: number; count: number };
export type BookingSource = { source: string; count: number };
export type ScrollThreshold = { threshold_pct: number; count: number };
export type ReminderTriggerFunnel = {
  trigger: string;
  views: number;
  attempts: number;
  signups: number;
};
export type TopPage = { path: string; views: number };
export type TrafficSource = { source: string; visits24h: number; visits7d: number };

export type StatsResponse = {
  lookups: {
    last1h: number;
    last24h: number;
    last7d: number;
    today: number;
    yesterday: number;
  };
  pageViews: {
    last24h: number;
    last7d: number;
    today: number;
    yesterday: number;
  };
  uniqueVisitors: {
    last24h: number;
    last7d: number;
    // UTC-day-aligned, so a meaningful day-over-day delta can be drawn.
    today: number;
    yesterday: number;
  };
  valuations: number;
  motReminders: number;
  // New for the richer dashboard
  contactMessages: { today: number; last7d: number; allTime: number };
  motRemindersLast7d: number;
  topMakesToday: TopMake[];
  // Funnel + capture metrics, sourced from mirrored gtag events in site_events
  funnel: {
    // searchesToday counts reg_search events (one per user-initiated search).
    // Distinct from the hero KPI's lookups.today which counts /api/lookup
    // calls — that number is inflated ~2x by tool-page re-fetches and so
    // makes for a misleading conversion-rate denominator.
    searchesToday: number;
    resultsViewsToday: number;
    reminderViewsToday: number;
    reminderSignupsToday: number;
  };
  funnel7d: {
    // Same shape as funnel above but with a 7-day window — smooths out
    // low-volume mornings where today's numbers haven't accumulated yet.
    searches: number;
    resultsViews: number;
    reminderViews: number;
    reminderSignups: number;
  };
  captureByTriggerLast7d: CaptureTrigger[];
  // Reminder funnel split by placement (trigger_variant) over the last 7 days.
  // Lets the owner see which placement actually converts (e.g. the high-intent
  // action-banner) vs which just collects passive impressions (homepage chip,
  // blog footer). Sorted by views desc.
  reminderByTrigger: ReminderTriggerFunnel[];
  partnerClicks: {
    today: number;
    last7d: number;
    byContextToday: PartnerContextCount[];
    // 7-day per-context attribution — the today-only view is too sparse
    // for many of the long-tail CTAs (servicing page, brake-pads page,
    // mot_cta placements). 7d gives a meaningful per-CTA picture.
    byContextLast7d: PartnerContextCount[];
  };
  // Per-affiliate roll-up (carVertical / BookMyGarage / ClickMechanic).
  affiliates: AffiliateStat[];
  // Non-affiliate partner clicks (the long tail not in the three cards).
  otherPartners: OtherPartnerStat[];
  sectionReachToday: {
    resultsViews: number;
    sections: SectionReach[];
  };
  reminderFormToday: {
    views: number;
    attempts: number;
    successes: number;
    validationErrors: number;
    submitErrors: { duplicate: number; server: number; network: number };
  };
  // Booking-wizard funnel — wizard_start → step_complete → BMG handoff.
  // The handoff count comes from partner_click events whose click_context
  // starts with "booking-flow-" (the Step4Review pattern).
  bookingWizardLast7d: {
    starts: number;
    stepCompletes: BookingStepCount[];
    handoffs: number;
    sources: BookingSource[];
  };
  // New events shipped May 2026 — surfacing them so we can see they're
  // actually firing in production rather than only in dev.
  newEventsLast7d: {
    pdfDownloads: number;
    pdfErrors: number;
    pdfChunkErrors: number;
    motHistoryExpands: number;
    vehiclesSaved: number;
    outboundClicks: number;
    scrollDepth: ScrollThreshold[];
  };
  // Top paths by page_view count over the last 7 days.
  topPages: TopPage[];
  // page_view events grouped by a classified traffic source, for 24h + 7d.
  // "Internal" (same-host) referrals are excluded — this is "how people got
  // here", not internal navigation.
  trafficSources: TrafficSource[];
};

// Internal/admin path prefixes — the owner's own visits to /data-health,
// /preview and /demo. These are excluded from page-view analytics (both
// topPages and trafficSources) so historical owner traffic doesn't pollute
// the stats. Mirrors the capture-side guard in src/components/RouteAnalytics.tsx.
const INTERNAL_PATH_PREFIXES = ["/data-health", "/preview", "/demo"];

function isInternalPath(path: unknown): boolean {
  return (
    typeof path === "string" &&
    INTERNAL_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

// ── Traffic-source classification ───────────────────────────────────────────

// Our own hosts — referrers from these are internal navigation, not acquisition.
const OWN_HOSTS = new Set([
  "freeplatecheck.co.uk",
  "www.freeplatecheck.co.uk",
]);

function titleCase(s: string): string {
  return s
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Classify a page_view's traffic source from its metadata. Precedence:
 *   1. utm_source (Title-cased) wins if present.
 *   2. Otherwise classify the referrer hostname into a known channel, our own
 *      host ("Internal"), "Direct" (no referrer), or the bare referral domain.
 * Returns "Internal" for same-host referrers (caller filters these out).
 */
function classifySource(metadata: Record<string, unknown> | null): string {
  const utm = metadata?.utm_source;
  if (typeof utm === "string" && utm.trim().length > 0) {
    return titleCase(utm.trim());
  }

  const referrer = metadata?.referrer;
  if (typeof referrer !== "string" || referrer.trim().length === 0) {
    return "Direct";
  }

  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "Direct";
  }
  if (!host) return "Direct";

  if (OWN_HOSTS.has(host)) return "Internal";
  if (host.includes("google.")) return "Google";
  if (host.includes("bing.")) return "Bing";
  if (host.includes("duckduckgo")) return "DuckDuckGo";
  // Alternative / privacy / eco search engines (mostly Bing- or Google-powered).
  // Label them by name so they group as search rather than show as a bare
  // hostname (e.g. oceanhero.today — Bing-backed, removes ocean plastic).
  if (host.includes("ecosia.")) return "Ecosia";
  if (host.includes("oceanhero")) return "OceanHero";
  if (host.includes("startpage")) return "Startpage";
  if (host.includes("qwant")) return "Qwant";
  if (host.includes("brave")) return "Brave Search";
  if (host.includes("yahoo.")) return "Yahoo";
  if (host.includes("linkedin") || host.includes("lnkd.in")) return "LinkedIn";
  if (host.includes("facebook") || host.includes("fb.")) return "Facebook";
  if (host === "t.co" || host.includes("twitter") || host.includes("x.com")) return "X/Twitter";
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("reddit")) return "Reddit";

  // Unknown referral — surface the bare hostname (strip a leading www.).
  return host.replace(/^www\./, "");
}

async function countEvents(
  sb: ReturnType<typeof supabaseServer>,
  eventType: string,
  since: Date,
  until?: Date,
): Promise<number> {
  let query = sb
    .from("site_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType)
    .gte("created_at", since.toISOString());
  if (until) query = query.lt("created_at", until.toISOString());

  const { count, error } = await query;
  if (error) {
    console.error(`[STATS] Error counting ${eventType}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

// Count events of a type whose metadata JSON field equals a value (text
// comparison via the ->> operator). Used to split pdf_download_error into
// stale-chunk (benign — auto-recovers on reload) vs real faults.
async function countEventsWithMetaEq(
  sb: ReturnType<typeof supabaseServer>,
  eventType: string,
  jsonPath: string,
  value: string,
  since: Date,
): Promise<number> {
  const { count, error } = await sb
    .from("site_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType)
    .filter(jsonPath, "eq", value)
    .gte("created_at", since.toISOString());
  if (error) {
    console.error(`[STATS] Error counting ${eventType} ${jsonPath}=${value}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

async function countUniqueVisitors(
  sb: ReturnType<typeof supabaseServer>,
  since: Date,
): Promise<number> {
  const { data, error } = await sb.rpc("count_unique_visitors", {
    since: since.toISOString(),
  });

  if (error) {
    console.error("[STATS] Error counting unique visitors:", error.message);
    return 0;
  }
  return data ?? 0;
}

/**
 * Count distinct ip_hashes in a UTC-day-aligned window. Used for the
 * dashboard's day-over-day visitor delta — the RPC version only takes a
 * `since` parameter, so it can't bound a "yesterday only" count.
 */
async function countUniqueVisitorsBetween(
  sb: ReturnType<typeof supabaseServer>,
  since: Date,
  until: Date,
): Promise<number> {
  const { data, error } = await sb
    .from("site_events")
    .select("ip_hash")
    .eq("event_type", "page_view")
    .gte("created_at", since.toISOString())
    .lt("created_at", until.toISOString())
    .not("ip_hash", "is", null)
    .limit(10000);
  if (error || !data) {
    console.error("[STATS] Error counting unique visitors between:", error?.message);
    return 0;
  }
  return new Set(data.map((r) => r.ip_hash)).size;
}

/**
 * Count rows in `mot_reminders` while excluding test/verify emails so the
 * admin dashboard never includes our own QA traffic. Mirrors the patterns
 * filtered at the write path in /api/mot-reminder/route.ts and cleaned up
 * by scripts/cleanup-test-reminders.ts.
 */
async function countMotRemindersExcludingTests(
  sb: ReturnType<typeof supabaseServer>,
  filter?: { column: "active" | "created_at"; op: "eq" | "gte"; value: string | boolean },
): Promise<number> {
  let query = sb
    .from("mot_reminders")
    .select("*", { count: "exact", head: true })
    .not("email", "ilike", "verify-test+%")
    .not("email", "ilike", "%@example.com")
    .not("email", "ilike", "%@example.org")
    .not("email", "ilike", "%@example.net")
    .not("email", "ilike", "%@test.invalid");

  if (filter) {
    if (filter.op === "gte") query = query.gte(filter.column, filter.value as string);
    else query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`[STATS] Error counting mot_reminders:`, error.message);
    return 0;
  }
  return count ?? 0;
}

async function countTable(
  sb: ReturnType<typeof supabaseServer>,
  table: string,
  filter?: { column: string; op: "gte"; value: string } | { column: string; op: "eq"; value: string | boolean },
): Promise<number> {
  let query = sb.from(table).select("*", { count: "exact", head: true });
  if (filter) {
    if (filter.op === "gte") query = query.gte(filter.column, filter.value);
    else query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`[STATS] Error counting ${table}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Group `site_events` rows of a single event_type by a metadata field and
 * return the counts. Done client-side because the JS supabase client doesn't
 * expose a clean group-by; row volume per event_type stays manageable.
 */
async function groupByMetadataField(
  sb: ReturnType<typeof supabaseServer>,
  eventType: string,
  field: string,
  since: Date,
  limit = 5000,
): Promise<Map<string, number>> {
  const { data, error } = await sb
    .from("site_events")
    .select("metadata")
    .eq("event_type", eventType)
    .gte("created_at", since.toISOString())
    .limit(limit);
  if (error || !data) return new Map();

  const counts = new Map<string, number>();
  for (const row of data) {
    const value = (row.metadata as Record<string, unknown> | null)?.[field];
    if (typeof value !== "string" || value.length === 0) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

// ── Affiliate roll-up ────────────────────────────────────────────────────────
// Group partner_click events by AFFILIATE (carVertical / BookMyGarage /
// ClickMechanic), not just by placement context. BMG fires under three ids
// (bookMyGarage / bookMyGarageService / bookMyGarageRepair) so we prefix-match.
export type AffiliateStat = {
  key: string;
  name: string;
  today: number;
  last7d: number;
  topContexts: PartnerContextCount[];
};

// Non-affiliate partner clicks (We Buy Any Car, Warrantywise, Cuvva, …) — the
// long tail not covered by the three affiliate cards.
export type OtherPartnerStat = { partner: string; today: number; last7d: number };

const AFFILIATE_GROUPS: { key: string; name: string; match: (p: string) => boolean }[] = [
  { key: "carVertical", name: "carVertical", match: (p) => p.startsWith("carvertical") },
  { key: "bookMyGarage", name: "BookMyGarage", match: (p) => p.startsWith("bookmygarage") },
  { key: "clickMechanic", name: "ClickMechanic", match: (p) => p.startsWith("clickmechanic") },
];

/**
 * Per-affiliate click totals (today + 7d) and placement breakdown, plus the
 * non-affiliate long tail — all from one fetch. Returns the three affiliate
 * cards and an "other partners" list (by partner_id, excluding the affiliates).
 */
async function affiliateClickBreakdown(
  sb: ReturnType<typeof supabaseServer>,
  sevenDaysAgo: Date,
  todayStart: Date,
): Promise<{ affiliates: AffiliateStat[]; other: OtherPartnerStat[] }> {
  const { data, error } = await sb
    .from("site_events")
    .select("metadata, created_at")
    .eq("event_type", "partner_click")
    .gte("created_at", sevenDaysAgo.toISOString())
    .limit(20000);

  const acc = new Map<string, { today: number; last7d: number; contexts: Map<string, number> }>();
  for (const g of AFFILIATE_GROUPS) acc.set(g.key, { today: 0, last7d: 0, contexts: new Map() });
  const other = new Map<string, { today: number; last7d: number }>();

  if (!error && data) {
    for (const row of data) {
      const md = row.metadata as Record<string, unknown> | null;
      const raw = typeof md?.partner_id === "string" ? md.partner_id : "";
      const pid = raw.toLowerCase();
      const isToday = typeof row.created_at === "string" && new Date(row.created_at) >= todayStart;
      const group = AFFILIATE_GROUPS.find((g) => g.match(pid));
      if (group) {
        const a = acc.get(group.key)!;
        a.last7d += 1;
        if (isToday) a.today += 1;
        const ctx = typeof md?.click_context === "string" && md.click_context.length > 0 ? md.click_context : "(none)";
        a.contexts.set(ctx, (a.contexts.get(ctx) ?? 0) + 1);
      } else if (raw) {
        const o = other.get(raw) ?? { today: 0, last7d: 0 };
        o.last7d += 1;
        if (isToday) o.today += 1;
        other.set(raw, o);
      }
    }
  }

  const affiliates = AFFILIATE_GROUPS.map((g) => {
    const a = acc.get(g.key)!;
    return {
      key: g.key,
      name: g.name,
      today: a.today,
      last7d: a.last7d,
      topContexts: Array.from(a.contexts.entries())
        .map(([context, count]) => ({ context, count }))
        .sort((x, y) => y.count - x.count),
    };
  });

  const otherList: OtherPartnerStat[] = Array.from(other.entries())
    .map(([partner, v]) => ({ partner, today: v.today, last7d: v.last7d }))
    .sort((x, y) => y.last7d - x.last7d);

  return { affiliates, other: otherList };
}

/**
 * Like groupByMetadataField but bins null/empty/non-string field values into a
 * "(none)" bucket instead of dropping them — so the reminder-by-placement
 * funnel attributes untagged events rather than silently losing them.
 */
async function groupByMetadataFieldWithNone(
  sb: ReturnType<typeof supabaseServer>,
  eventType: string,
  field: string,
  since: Date,
  limit = 5000,
): Promise<Map<string, number>> {
  const { data, error } = await sb
    .from("site_events")
    .select("metadata")
    .eq("event_type", eventType)
    .gte("created_at", since.toISOString())
    .limit(limit);
  if (error || !data) return new Map();

  const counts = new Map<string, number>();
  for (const row of data) {
    const value = (row.metadata as Record<string, unknown> | null)?.[field];
    const key = typeof value === "string" && value.length > 0 ? value : "(none)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

async function topMakesSince(
  sb: ReturnType<typeof supabaseServer>,
  since: Date,
  limit = 5,
): Promise<TopMake[]> {
  // Group by metadata.make for lookup events since {since}.
  // We do this client-side because Supabase JS doesn't expose a clean
  // group-by; the row volume per day stays low so the cost is fine.
  const { data, error } = await sb
    .from("site_events")
    .select("metadata")
    .eq("event_type", "lookup")
    .gte("created_at", since.toISOString())
    .not("metadata->>make", "is", null)
    .limit(2000);
  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    const m = (row.metadata as Record<string, unknown> | null)?.make;
    if (typeof m !== "string" || m.length === 0) continue;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([make, count]) => ({ make, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Fetch page_view events in the last 7 days (metadata + created_at only, row-
 * capped) and aggregate two views in JS: top paths and classified traffic
 * sources (24h + 7d). Done in one pass to avoid a second scan of the same rows.
 * The 50k cap bounds memory/latency; at current volume (~3.4k sessions/mo) 7d
 * of page_views sits well under it.
 */
async function pageViewAnalytics(
  sb: ReturnType<typeof supabaseServer>,
  sevenDaysAgo: Date,
  oneDayAgo: Date,
): Promise<{ topPages: TopPage[]; trafficSources: TrafficSource[] }> {
  const { data, error } = await sb
    .from("site_events")
    .select("metadata, created_at")
    .eq("event_type", "page_view")
    .gte("created_at", sevenDaysAgo.toISOString())
    .limit(50000);

  if (error || !data) {
    if (error) console.error("[STATS] Error fetching page_view analytics:", error.message);
    return { topPages: [], trafficSources: [] };
  }

  const oneDayMs = oneDayAgo.getTime();
  const pathCounts = new Map<string, number>();
  const source7d = new Map<string, number>();
  const source24h = new Map<string, number>();

  for (const row of data) {
    const metadata = (row.metadata as Record<string, unknown> | null) ?? null;

    const path = metadata?.path;
    // Exclude internal/admin pages (owner's own visits) from BOTH topPages
    // and trafficSources aggregation.
    if (isInternalPath(path)) continue;

    if (typeof path === "string" && path.length > 0) {
      pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1);
    }

    const source = classifySource(metadata);
    if (source !== "Internal") {
      source7d.set(source, (source7d.get(source) ?? 0) + 1);
      if (typeof row.created_at === "string" && new Date(row.created_at).getTime() >= oneDayMs) {
        source24h.set(source, (source24h.get(source) ?? 0) + 1);
      }
    }
  }

  const topPages: TopPage[] = Array.from(pathCounts.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const trafficSources: TrafficSource[] = Array.from(source7d.entries())
    .map(([source, visits7d]) => ({ source, visits7d, visits24h: source24h.get(source) ?? 0 }))
    .sort((a, b) => b.visits7d - a.visits7d);

  return { topPages, trafficSources };
}

export async function GET(): Promise<NextResponse<StatsResponse>> {
  const sb = supabaseServer();
  // contact_messages has RLS enabled — the anon client returns empty result
  // sets silently, with no error. Use the service-role client for any count
  // against RLS-protected tables so the dashboard doesn't read 0s as truth.
  const sbRead = supabaseServerRole();

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayStart = startOfUtcDay(now);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

  const [
    lookups1h,
    lookups24h,
    lookups7d,
    lookupsToday,
    lookupsYesterday,
    pageViews24h,
    pageViews7d,
    pageViewsToday,
    pageViewsYesterday,
    uniqueVisitors24h,
    uniqueVisitors7d,
    uniqueVisitorsToday,
    uniqueVisitorsYesterday,
    valuations,
    motReminders,
    contactToday,
    contact7d,
    contactAllTime,
    motRemindersLast7d,
    _motRemindersToday,
    topMakesToday,
    // Funnel-stage event counts (today). The top-step uses reg_search
    // (per-user-action) not lookup (per-API-call) so the downstream
    // conversion ratios are meaningful.
    searchesToday,
    searches7d,
    resultsViewsToday,
    resultsViews7d,
    reminderViewsToday,
    reminderViews7d,
    reminderAttemptsToday,
    reminderSuccessesToday,
    reminderValidationErrorsToday,
    partnerClicksToday,
    partnerClicks7d,
    // Grouped breakdowns
    triggerCountsLast7d,
    partnerContextCountsToday,
    partnerContextCountsLast7d,
    sectionCountsToday,
    submitErrorMetaToday,
    // Reminder-success conversion events. Counting the `mot_reminder` event
    // in site_events (vs counting rows in the mot_reminders table) catches
    // reactivations — when a user submits the same (email, vrm) twice, the
    // API updates the existing row rather than inserting, so the table-row
    // count misses the second "successful conversion" even though the event
    // legitimately fired. Event count is closer to the funnel's intent.
    motReminderEventsToday,
    motReminderEvents7d,
    // Booking wizard funnel (last 7 days)
    bookingStarts7d,
    bookingStepCompletes7d,
    bookingHandoffsByContext7d,
    bookingSources7d,
    // New events (last 7 days)
    pdfDownloads7d,
    pdfErrors7d,
    vehiclesSaved7d,
    outboundClicks7d,
    scrollDepthCounts7d,
    motHistoryExpands7d,
    pdfChunkErrors7d,
    pageViewAggregates,
    // Per-placement reminder funnel (7d): views, submit-attempts, signups
    // grouped by metadata.trigger_variant. Three bounded fetches, aggregated
    // in JS below — no new RPC/migration.
    reminderViewsByTrigger7d,
    reminderAttemptsByTrigger7d,
    reminderSignupsByTrigger7d,
  ] = await Promise.all([
    countEvents(sb, "lookup", oneHourAgo),
    countEvents(sb, "lookup", oneDayAgo),
    countEvents(sb, "lookup", sevenDaysAgo),
    countEvents(sb, "lookup", todayStart),
    countEvents(sb, "lookup", yesterdayStart, todayStart),
    countEvents(sb, "page_view", oneDayAgo),
    countEvents(sb, "page_view", sevenDaysAgo),
    countEvents(sb, "page_view", todayStart),
    countEvents(sb, "page_view", yesterdayStart, todayStart),
    countUniqueVisitors(sb, oneDayAgo),
    countUniqueVisitors(sb, sevenDaysAgo),
    countUniqueVisitorsBetween(sb, todayStart, new Date(now.getTime() + 60_000)),
    countUniqueVisitorsBetween(sb, yesterdayStart, todayStart),
    countTable(sb, "vehicle_valuations"),
    countMotRemindersExcludingTests(sb, { column: "active", op: "eq", value: true }),
    countTable(sbRead, "contact_messages", { column: "created_at", op: "gte", value: todayStart.toISOString() }),
    countTable(sbRead, "contact_messages", { column: "created_at", op: "gte", value: sevenDaysAgo.toISOString() }),
    countTable(sbRead, "contact_messages"),
    countMotRemindersExcludingTests(sb, { column: "created_at", op: "gte", value: sevenDaysAgo.toISOString() }),
    countMotRemindersExcludingTests(sb, { column: "created_at", op: "gte", value: todayStart.toISOString() }),
    topMakesSince(sb, todayStart, 5),
    countEvents(sb, "reg_search", todayStart),
    countEvents(sb, "reg_search", sevenDaysAgo),
    countEvents(sb, "results_view", todayStart),
    countEvents(sb, "results_view", sevenDaysAgo),
    countEvents(sb, "mot_reminder_view", todayStart),
    countEvents(sb, "mot_reminder_view", sevenDaysAgo),
    countEvents(sb, "mot_reminder_submit_attempt", todayStart),
    countEvents(sb, "mot_reminder", todayStart),
    countEvents(sb, "mot_reminder_validation_error", todayStart),
    countEvents(sb, "partner_click", todayStart),
    countEvents(sb, "partner_click", sevenDaysAgo),
    groupByMetadataField(sb, "mot_reminder", "trigger_variant", sevenDaysAgo),
    groupByMetadataField(sb, "partner_click", "click_context", todayStart),
    groupByMetadataField(sb, "partner_click", "click_context", sevenDaysAgo),
    groupByMetadataField(sb, "results_section_view", "section_id", todayStart),
    groupByMetadataField(sb, "mot_reminder_submit_error", "error_type", todayStart),
    countEvents(sb, "mot_reminder", todayStart),
    countEvents(sb, "mot_reminder", sevenDaysAgo),
    countEvents(sb, "booking_wizard_start", sevenDaysAgo),
    // step_complete fires once per advance; we group by `step` so the
    // funnel shows 2 (entered Step 2) → 3 → 4 distinctly. Step 1 is
    // implicit in the wizard_start count.
    groupByMetadataField(sb, "booking_step_complete", "step", sevenDaysAgo),
    // BMG handoffs are partner_clicks where click_context starts with
    // "booking-flow-" (the Step4Review CTA pattern). We re-use the 7d
    // partner-context map and filter client-side below.
    groupByMetadataField(sb, "partner_click", "click_context", sevenDaysAgo),
    groupByMetadataField(sb, "booking_wizard_start", "source", sevenDaysAgo),
    countEvents(sb, "pdf_download", sevenDaysAgo),
    countEvents(sb, "pdf_download_error", sevenDaysAgo),
    countEvents(sb, "vehicle_saved", sevenDaysAgo),
    countEvents(sb, "outbound_click", sevenDaysAgo),
    groupByMetadataField(sb, "scroll_depth", "threshold_pct", sevenDaysAgo),
    // Phase 2 reveal telemetry: how often the collapsed MOT history is opened
    // (confirms tucking it away didn't kill engagement).
    countEvents(sb, "mot_history_expand", sevenDaysAgo),
    // Of the PDF errors, how many were the benign stale-chunk kind.
    countEventsWithMetaEq(sb, "pdf_download_error", "metadata->>chunk_error", "true", sevenDaysAgo),
    // Top pages + traffic sources (single page_view scan, JS-aggregated).
    pageViewAnalytics(sb, sevenDaysAgo, oneDayAgo),
    groupByMetadataFieldWithNone(sb, "mot_reminder_view", "trigger_variant", sevenDaysAgo),
    groupByMetadataFieldWithNone(sb, "mot_reminder_submit_attempt", "trigger_variant", sevenDaysAgo),
    groupByMetadataFieldWithNone(sb, "mot_reminder", "trigger_variant", sevenDaysAgo),
  ]);

  const captureByTriggerLast7d: CaptureTrigger[] = Array.from(triggerCountsLast7d.entries())
    .map(([trigger_variant, count]) => ({ trigger_variant, count }))
    .sort((a, b) => b.count - a.count);

  // Per-placement reminder funnel — merge the keys across the three event maps
  // so a placement that has views but no signups (or vice-versa) still appears.
  // groupByMetadataFieldWithNone bins untagged events into "(none)".
  const reminderTriggerKeys = new Set<string>([
    ...reminderViewsByTrigger7d.keys(),
    ...reminderAttemptsByTrigger7d.keys(),
    ...reminderSignupsByTrigger7d.keys(),
  ]);
  const reminderByTrigger: ReminderTriggerFunnel[] = Array.from(reminderTriggerKeys)
    .map((trigger) => ({
      trigger,
      views: reminderViewsByTrigger7d.get(trigger) ?? 0,
      attempts: reminderAttemptsByTrigger7d.get(trigger) ?? 0,
      signups: reminderSignupsByTrigger7d.get(trigger) ?? 0,
    }))
    .sort((a, b) => b.views - a.views);

  const partnerContextByCount: PartnerContextCount[] = Array.from(partnerContextCountsToday.entries())
    .map(([context, count]) => ({ context, count }))
    .sort((a, b) => b.count - a.count);

  const partnerContextByCountLast7d: PartnerContextCount[] = Array.from(partnerContextCountsLast7d.entries())
    .map(([context, count]) => ({ context, count }))
    .sort((a, b) => b.count - a.count);

  // Per-affiliate roll-up (carVertical / BookMyGarage / ClickMechanic) + the
  // non-affiliate long tail (We Buy Any Car, Warrantywise, Cuvva, …).
  const { affiliates, other: otherPartners } = await affiliateClickBreakdown(sb, sevenDaysAgo, todayStart);

  // Booking step completes: numeric step values converted from string keys
  const bookingStepCounts: BookingStepCount[] = Array.from(bookingStepCompletes7d.entries())
    .map(([stepStr, count]) => ({ step: Number(stepStr), count }))
    .filter((s) => Number.isFinite(s.step))
    .sort((a, b) => a.step - b.step);

  // BMG handoffs = sum of partner_clicks whose click_context starts with
  // "booking-flow-" (matches the wizard Step4Review clickref pattern).
  const bookingHandoffsCount = Array.from(bookingHandoffsByContext7d.entries())
    .filter(([ctx]) => ctx.startsWith("booking-flow-"))
    .reduce((sum, [, count]) => sum + count, 0);

  const bookingWizardSources: BookingSource[] = Array.from(bookingSources7d.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const scrollDepthBuckets: ScrollThreshold[] = Array.from(scrollDepthCounts7d.entries())
    .map(([thresholdStr, count]) => ({ threshold_pct: Number(thresholdStr), count }))
    .filter((s) => Number.isFinite(s.threshold_pct))
    .sort((a, b) => a.threshold_pct - b.threshold_pct);

  const sectionReachSections: SectionReach[] = Array.from(sectionCountsToday.entries())
    .map(([section_id, count]) => ({
      section_id,
      count,
      pct: resultsViewsToday > 0 ? Math.round((count / resultsViewsToday) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const submitErrors = {
    duplicate: submitErrorMetaToday.get("duplicate") ?? 0,
    server: submitErrorMetaToday.get("server") ?? 0,
    network: submitErrorMetaToday.get("network") ?? 0,
  };

  return NextResponse.json({
    lookups: {
      last1h: lookups1h,
      last24h: lookups24h,
      last7d: lookups7d,
      today: lookupsToday,
      yesterday: lookupsYesterday,
    },
    pageViews: {
      last24h: pageViews24h,
      last7d: pageViews7d,
      today: pageViewsToday,
      yesterday: pageViewsYesterday,
    },
    uniqueVisitors: {
      last24h: uniqueVisitors24h,
      last7d: uniqueVisitors7d,
      today: uniqueVisitorsToday,
      yesterday: uniqueVisitorsYesterday,
    },
    valuations,
    motReminders,
    contactMessages: {
      today: contactToday,
      last7d: contact7d,
      allTime: contactAllTime,
    },
    motRemindersLast7d,
    topMakesToday,
    funnel: {
      searchesToday,
      resultsViewsToday,
      reminderViewsToday,
      // Use the event count (catches reactivations) — see comment near the
      // motReminderEventsToday declaration above for why.
      reminderSignupsToday: motReminderEventsToday,
    },
    funnel7d: {
      searches: searches7d,
      resultsViews: resultsViews7d,
      reminderViews: reminderViews7d,
      reminderSignups: motReminderEvents7d,
    },
    captureByTriggerLast7d,
    reminderByTrigger,
    partnerClicks: {
      today: partnerClicksToday,
      last7d: partnerClicks7d,
      byContextToday: partnerContextByCount,
      byContextLast7d: partnerContextByCountLast7d,
    },
    affiliates,
    otherPartners,
    sectionReachToday: {
      resultsViews: resultsViewsToday,
      sections: sectionReachSections,
    },
    reminderFormToday: {
      views: reminderViewsToday,
      attempts: reminderAttemptsToday,
      successes: reminderSuccessesToday,
      validationErrors: reminderValidationErrorsToday,
      submitErrors,
    },
    bookingWizardLast7d: {
      starts: bookingStarts7d,
      stepCompletes: bookingStepCounts,
      handoffs: bookingHandoffsCount,
      sources: bookingWizardSources,
    },
    newEventsLast7d: {
      pdfDownloads: pdfDownloads7d,
      pdfErrors: pdfErrors7d,
      pdfChunkErrors: pdfChunkErrors7d,
      motHistoryExpands: motHistoryExpands7d,
      vehiclesSaved: vehiclesSaved7d,
      outboundClicks: outboundClicks7d,
      scrollDepth: scrollDepthBuckets,
    },
    topPages: pageViewAggregates.topPages,
    trafficSources: pageViewAggregates.trafficSources,
  });
}
