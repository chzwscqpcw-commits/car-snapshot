export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer, supabaseServerRole } from "@/lib/supabaseServer";

// ── Response shape ──────────────────────────────────────────────────────────

type InsightsResponse =
  | { status: "ok"; summary: string; generatedAt: string; cached: boolean }
  | { status: "no_key"; summary: null }
  | { status: "error"; summary: null };

// 15-minute cache TTL. Bounds Anthropic cost to ~1 call / 15 min no matter how
// often the (unauthenticated) endpoint is hit, so it can't run up a bill.
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_KEY = "ai_insights_summary";

// Internal/admin paths excluded from the page-view digest (owner's own visits).
const INTERNAL_PATH_PREFIXES = ["/data-health", "/preview", "/demo"];
function isInternalPath(path: unknown): boolean {
  return (
    typeof path === "string" &&
    INTERNAL_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

// ── Cached-summary read/write via the existing data_cache table ─────────────

type CachedSummary = { summary: string; generatedAt: string };

async function readCachedSummary(): Promise<CachedSummary | null> {
  try {
    const sb = supabaseServerRole();
    const { data, error } = await sb
      .from("data_cache")
      .select("data, updated_at")
      .eq("key", CACHE_KEY)
      .single();
    if (error || !data) return null;
    const updatedAt = new Date(data.updated_at as string).getTime();
    if (!Number.isFinite(updatedAt)) return null;
    if (Date.now() - updatedAt > CACHE_TTL_MS) return null; // stale
    const payload = data.data as { summary?: unknown } | null;
    if (!payload || typeof payload.summary !== "string") return null;
    return { summary: payload.summary, generatedAt: data.updated_at as string };
  } catch {
    return null;
  }
}

async function writeCachedSummary(summary: string, generatedAt: string): Promise<void> {
  try {
    const sb = supabaseServerRole();
    await sb
      .from("data_cache")
      .upsert(
        { key: CACHE_KEY, data: { summary, generatedAt }, updated_at: generatedAt },
        { onConflict: "key" },
      );
  } catch {
    // Caching is best-effort — never let a cache-write failure break the route.
  }
}

// ── Digest gathering ────────────────────────────────────────────────────────

type Digest = {
  uniqueVisitors24h: number;
  uniqueVisitors7d: number;
  pageViews24h: number;
  pageViews7d: number;
  topPages: { path: string; views: number }[];
  trafficSources: { source: string; visits24h: number; visits7d: number }[];
  partnerClicksToday: number;
  partnerClicks7d: number;
  partnerByContext7d: { context: string; count: number }[];
  reminderViews7d: number;
  reminderSignups7d: number;
};

async function countEvents(
  sb: ReturnType<typeof supabaseServer>,
  eventType: string,
  since: Date,
): Promise<number> {
  const { count, error } = await sb
    .from("site_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType)
    .gte("created_at", since.toISOString());
  if (error) return 0;
  return count ?? 0;
}

async function countUniqueVisitors(
  sb: ReturnType<typeof supabaseServer>,
  since: Date,
): Promise<number> {
  const { data, error } = await sb.rpc("count_unique_visitors", {
    since: since.toISOString(),
  });
  if (error) return 0;
  return (data as number | null) ?? 0;
}

function classifySource(metadata: Record<string, unknown> | null): string {
  const utm = metadata?.utm_source;
  if (typeof utm === "string" && utm.trim().length > 0) {
    const s = utm.trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const referrer = metadata?.referrer;
  if (typeof referrer !== "string" || referrer.trim().length === 0) return "Direct";
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "Direct";
  }
  if (!host) return "Direct";
  if (host === "freeplatecheck.co.uk" || host === "www.freeplatecheck.co.uk") return "Internal";
  if (host.includes("google.")) return "Google";
  if (host.includes("bing.")) return "Bing";
  if (host.includes("duckduckgo")) return "DuckDuckGo";
  if (host.includes("linkedin") || host.includes("lnkd.in")) return "LinkedIn";
  if (host.includes("facebook") || host.includes("fb.")) return "Facebook";
  if (host === "t.co" || host.includes("twitter") || host.includes("x.com")) return "X/Twitter";
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("reddit")) return "Reddit";
  return host.replace(/^www\./, "");
}

async function gatherDigest(): Promise<Digest> {
  const sb = supabaseServer();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const [
    uniqueVisitors24h,
    uniqueVisitors7d,
    pageViews24h,
    pageViews7d,
    partnerClicksToday,
    partnerClicks7d,
    reminderViews7d,
    reminderSignups7d,
    pvRows,
    partnerRows,
  ] = await Promise.all([
    countUniqueVisitors(sb, oneDayAgo),
    countUniqueVisitors(sb, sevenDaysAgo),
    countEvents(sb, "page_view", oneDayAgo),
    countEvents(sb, "page_view", sevenDaysAgo),
    countEvents(sb, "partner_click", todayStart),
    countEvents(sb, "partner_click", sevenDaysAgo),
    countEvents(sb, "mot_reminder_view", sevenDaysAgo),
    countEvents(sb, "mot_reminder", sevenDaysAgo),
    sb
      .from("site_events")
      .select("metadata, created_at")
      .eq("event_type", "page_view")
      .gte("created_at", sevenDaysAgo.toISOString())
      .limit(50000),
    sb
      .from("site_events")
      .select("metadata")
      .eq("event_type", "partner_click")
      .gte("created_at", sevenDaysAgo.toISOString())
      .limit(5000),
  ]);

  // Aggregate top pages + traffic sources from the page_view rows, excluding
  // internal/admin paths (owner's own visits).
  const oneDayMs = oneDayAgo.getTime();
  const pathCounts = new Map<string, number>();
  const source7d = new Map<string, number>();
  const source24h = new Map<string, number>();
  for (const row of pvRows.data ?? []) {
    const metadata = (row.metadata as Record<string, unknown> | null) ?? null;
    const path = metadata?.path;
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

  const partnerCtx = new Map<string, number>();
  for (const row of partnerRows.data ?? []) {
    const ctx = (row.metadata as Record<string, unknown> | null)?.click_context;
    if (typeof ctx !== "string" || ctx.length === 0) continue;
    partnerCtx.set(ctx, (partnerCtx.get(ctx) ?? 0) + 1);
  }

  const topPages = Array.from(pathCounts.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const trafficSources = Array.from(source7d.entries())
    .map(([source, visits7d]) => ({ source, visits7d, visits24h: source24h.get(source) ?? 0 }))
    .sort((a, b) => b.visits7d - a.visits7d);

  const partnerByContext7d = Array.from(partnerCtx.entries())
    .map(([context, count]) => ({ context, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    uniqueVisitors24h,
    uniqueVisitors7d,
    pageViews24h,
    pageViews7d,
    topPages,
    trafficSources,
    partnerClicksToday,
    partnerClicks7d,
    partnerByContext7d,
    reminderViews7d,
    reminderSignups7d,
  };
}

// ── Prompt building ─────────────────────────────────────────────────────────

function buildPrompt(d: Digest): string {
  const digestLines = [
    `Unique visitors — last 24h: ${d.uniqueVisitors24h}, last 7 days: ${d.uniqueVisitors7d}`,
    `Page views — last 24h: ${d.pageViews24h}, last 7 days: ${d.pageViews7d}`,
    "",
    "Top pages (last 7 days, by views):",
    ...(d.topPages.length
      ? d.topPages.map((p) => `  - ${p.path}: ${p.views} views`)
      : ["  - (no page views recorded yet)"]),
    "",
    "Traffic sources (how visitors arrived):",
    ...(d.trafficSources.length
      ? d.trafficSources.map((s) => `  - ${s.source}: ${s.visits24h} in 24h, ${s.visits7d} in 7 days`)
      : ["  - (no external sources recorded yet)"]),
    "",
    `Partner-link clicks (these earn affiliate revenue) — today: ${d.partnerClicksToday}, last 7 days: ${d.partnerClicks7d}`,
    "Partner clicks by placement (last 7 days):",
    ...(d.partnerByContext7d.length
      ? d.partnerByContext7d.map((c) => `  - ${c.context}: ${c.count}`)
      : ["  - (no partner clicks recorded yet)"]),
    "",
    `MOT-reminder form — views (last 7 days): ${d.reminderViews7d}, sign-ups (last 7 days): ${d.reminderSignups7d}`,
  ].join("\n");

  return [
    "You are a friendly analytics assistant explaining a website's recent activity to its owner.",
    "The owner is a new developer with NO technical or analytics background, so write in plain, warm,",
    "everyday English. NO jargon (avoid words like 'conversion', 'CTR', 'sessions', 'metrics', 'funnel').",
    "Use the concrete numbers from the data below — do NOT invent any numbers that aren't there.",
    "",
    "Write about 3 short paragraphs covering, in this order:",
    "1. How many people visited (frame the 24-hour and 7-day numbers simply).",
    "2. What visitors focused on — describe the top pages in human terms (e.g. 'the MOT history page').",
    "3. How they arrived — call out things like LinkedIn, Google search, or coming directly.",
    "4. How they engaged with the money-making parts — partner-link clicks and the MOT-reminder",
    "   sign-up form, mentioning the specific counts.",
    "Then finish with ONE simple, encouraging insight or gentle suggestion.",
    "",
    "Here is the data:",
    "",
    digestLines,
  ].join("\n");
}

// ── LLM call (free-first: Groq if its key is set, else Anthropic) ────────────
// Both via direct fetch, no SDK. Groq's API is OpenAI-compatible and free (no
// card) — the default. Anthropic is an optional paid fallback if its key is set.

async function generateSummary(prompt: string): Promise<string | null> {
  if (process.env.GROQ_API_KEY) return generateViaGroq(prompt);
  if (process.env.ANTHROPIC_API_KEY) return generateViaAnthropic(prompt);
  return null;
}

// Groq — free, OpenAI-compatible chat completions. Llama 3.3 70B is plenty for
// a short plain-English summary.
async function generateViaGroq(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 500,
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error("[insights] Groq API non-OK:", res.status);
      return null;
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) return null;
    return text.trim();
  } catch (err) {
    console.error(
      "[insights] Groq call failed:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

async function generateViaAnthropic(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error("[insights] Anthropic API non-OK:", res.status);
      return null;
    }
    const json = (await res.json()) as {
      content?: { type?: string; text?: string }[];
    };
    const text = json.content?.[0]?.text;
    if (typeof text !== "string" || text.trim().length === 0) return null;
    return text.trim();
  } catch (err) {
    console.error(
      "[insights] Anthropic call failed:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

// ── GET handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request): Promise<NextResponse<InsightsResponse>> {
  try {
    if (!process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ status: "no_key", summary: null });
    }

    const force = new URL(req.url).searchParams.get("force") === "1";

    // Serve from cache unless forced. Bounds LLM usage to ~1 call/15 min.
    if (!force) {
      const cached = await readCachedSummary();
      if (cached) {
        return NextResponse.json({
          status: "ok",
          summary: cached.summary,
          generatedAt: cached.generatedAt,
          cached: true,
        });
      }
    }

    const digest = await gatherDigest();
    const summary = await generateSummary(buildPrompt(digest));
    if (!summary) {
      return NextResponse.json({ status: "error", summary: null });
    }

    const generatedAt = new Date().toISOString();
    // Always write the fresh result to cache (even on a forced refresh).
    await writeCachedSummary(summary, generatedAt);

    return NextResponse.json({ status: "ok", summary, generatedAt, cached: false });
  } catch (err) {
    console.error(
      "[insights] route threw:",
      err instanceof Error ? err.message : String(err),
    );
    return NextResponse.json({ status: "error", summary: null });
  }
}
