import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Weekly visitor-overview audit — the data behind the Sunday email. Reads
 * `site_events` (anon key is enough) for the last 7 days vs the prior 7 days,
 * excluding owner/internal traffic, and renders a self-contained HTML report.
 *
 * Kept dependency-free (plain aggregation in JS, inline-styled HTML) so it runs
 * inside the cron route with no template/build step. Mirrors the ad-hoc
 * scratchpad/audit-pull.mjs analysis, scheduled.
 */

const NOT_INTERNAL = "metadata->>internal.is.null,metadata->>internal.neq.true";
const DAY = 864e5;

interface EventRow {
  metadata: Record<string, unknown> | null;
  ip_hash: string | null;
  created_at: string;
}

function metaStr(m: Record<string, unknown> | null, key: string): string {
  const v = m?.[key];
  return typeof v === "string" && v.length > 0 ? v : "(none)";
}

async function countEvents(
  sb: SupabaseClient,
  eventType: string,
  gteISO: string,
  ltISO?: string,
): Promise<number> {
  let q = sb
    .from("site_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType)
    .gte("created_at", gteISO)
    .or(NOT_INTERNAL);
  if (ltISO) q = q.lt("created_at", ltISO);
  const { count } = await q;
  return count ?? 0;
}

async function pullEvents(
  sb: SupabaseClient,
  eventType: string,
  gteISO: string,
  cap = 50000,
): Promise<EventRow[]> {
  const rows: EventRow[] = [];
  for (let from = 0; from < cap; from += 1000) {
    const { data, error } = await sb
      .from("site_events")
      .select("metadata, ip_hash, created_at")
      .eq("event_type", eventType)
      .gte("created_at", gteISO)
      .or(NOT_INTERNAL)
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error || !data) break;
    rows.push(...(data as EventRow[]));
    if (data.length < 1000) break;
  }
  return rows;
}

function topN(map: Map<string, number>, n: number): [string, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export interface WeeklyAuditData {
  windowStart: string; // ISO date (yyyy-mm-dd) of the 7-day window start
  windowEnd: string; // ISO date (today)
  headline: { label: string; cur: number; prev: number }[];
  partnersByName: [string, number][];
  partnerContexts: [string, number][];
  regSearchSources: [string, number][];
  topPages: [string, number][];
  partnerPerResults: number | null; // partner_click / results_view, %
}

export async function buildWeeklyAuditData(
  sb: SupabaseClient,
  nowMs: number,
): Promise<WeeklyAuditData> {
  const d7 = new Date(nowMs - 7 * DAY).toISOString();
  const d14 = new Date(nowMs - 14 * DAY).toISOString();

  // Headline counts: this week vs prior week
  const HEADLINE_EVENTS: { key: string; label: string }[] = [
    { key: "page_view", label: "Page views" },
    { key: "reg_search", label: "Reg searches" },
    { key: "results_view", label: "Results views" },
    { key: "partner_click", label: "Partner clicks" },
    { key: "mot_reminder", label: "MOT signups" },
  ];

  const headlineCounts = await Promise.all(
    HEADLINE_EVENTS.map(async ({ key, label }) => {
      const [cur, prev] = await Promise.all([
        countEvents(sb, key, d7),
        countEvents(sb, key, d14, d7),
      ]);
      return { label, cur, prev };
    }),
  );

  // Unique visitors (by ip_hash) via a 14-day page_view pull, split into halves
  const pv = await pullEvents(sb, "page_view", d14);
  const uv = { cur: new Set<string>(), prev: new Set<string>() };
  const pathCur = new Map<string, number>();
  const d7ms = Date.parse(d7);
  for (const r of pv) {
    const isCur = Date.parse(r.created_at) >= d7ms;
    if (r.ip_hash) uv[isCur ? "cur" : "prev"].add(r.ip_hash);
    if (isCur) {
      const p = metaStr(r.metadata, "path");
      pathCur.set(p, (pathCur.get(p) ?? 0) + 1);
    }
  }
  const headline = [
    { label: "Unique visitors", cur: uv.cur.size, prev: uv.prev.size },
    ...headlineCounts,
  ];

  // Partner clicks (7d): by partner + by click_context
  const pc = await pullEvents(sb, "partner_click", d7);
  const byPartner = new Map<string, number>();
  const byContext = new Map<string, number>();
  for (const r of pc) {
    byPartner.set(
      metaStr(r.metadata, "partner_id"),
      (byPartner.get(metaStr(r.metadata, "partner_id")) ?? 0) + 1,
    );
    byContext.set(
      metaStr(r.metadata, "click_context"),
      (byContext.get(metaStr(r.metadata, "click_context")) ?? 0) + 1,
    );
  }

  // Reg searches (7d) by source — surfaces the bridge tags (blog-inline etc.)
  const rs = await pullEvents(sb, "reg_search", d7);
  const bySource = new Map<string, number>();
  for (const r of rs) {
    bySource.set(
      metaStr(r.metadata, "source"),
      (bySource.get(metaStr(r.metadata, "source")) ?? 0) + 1,
    );
  }

  const results = headlineCounts.find((h) => h.label === "Results views")?.cur ?? 0;
  const partnerClicks =
    headlineCounts.find((h) => h.label === "Partner clicks")?.cur ?? 0;

  return {
    windowStart: d7.slice(0, 10),
    windowEnd: new Date(nowMs).toISOString().slice(0, 10),
    headline,
    partnersByName: topN(byPartner, 10),
    partnerContexts: topN(byContext, 10),
    regSearchSources: topN(bySource, 8),
    topPages: topN(pathCur, 10),
    partnerPerResults: results > 0 ? (100 * partnerClicks) / results : null,
  };
}

// ─── HTML rendering ──────────────────────────────────────────────────────────

function pctChange(cur: number, prev: number): string {
  if (prev === 0) return cur > 0 ? "▲ new" : "—";
  const d = Math.round(((cur - prev) / prev) * 100);
  if (d === 0) return "— 0%";
  const arrow = d > 0 ? "▲" : "▼";
  const colour = d > 0 ? "#16a34a" : "#dc2626";
  return `<span style="color:${colour}">${arrow} ${Math.abs(d)}%</span>`;
}

function rows(pairs: [string, number][]): string {
  if (pairs.length === 0)
    return `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#94a3b8" colspan="2">none this week</td></tr>`;
  return pairs
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0"><code>${k}</code></td><td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums">${v.toLocaleString("en-GB")}</td></tr>`,
    )
    .join("");
}

export function renderWeeklyAuditHtml(d: WeeklyAuditData): string {
  const headlineRows = d.headline
    .map(
      (h) =>
        `<tr>
          <td style="padding:8px 10px;border:1px solid #e2e8f0">${h.label}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right;font-weight:700;font-variant-numeric:tabular-nums">${h.cur.toLocaleString("en-GB")}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right;color:#64748b;font-variant-numeric:tabular-nums">${h.prev.toLocaleString("en-GB")}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right;font-size:13px">${pctChange(h.cur, h.prev)}</td>
        </tr>`,
    )
    .join("");

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;line-height:1.5">
  <h2 style="margin:0 0 2px">Free Plate Check — weekly visitor audit</h2>
  <p style="color:#64748b;margin:0 0 20px;font-size:14px">${d.windowStart} → ${d.windowEnd} (last 7 days vs the 7 days before) · owner traffic excluded</p>

  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 24px">
    <tr style="background:#f1f5f9">
      <th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:left">Metric</th>
      <th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right">This week</th>
      <th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right">Prior week</th>
      <th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right">Change</th>
    </tr>
    ${headlineRows}
  </table>

  <p style="margin:0 0 20px;font-size:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px">
    <strong>Conversion:</strong> ${d.partnerPerResults != null ? `${d.partnerPerResults.toFixed(1)}% of results views led to a partner click` : "n/a"}.
    <span style="color:#94a3b8"> (Note: reg_search now includes repair-cost inline lookups with no results_view — compare partner clicks to results views, not reg searches.)</span>
  </p>

  <h3 style="margin:24px 0 6px;font-size:15px">Partner clicks by partner</h3>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 20px">${rows(d.partnersByName)}</table>

  <h3 style="margin:24px 0 6px;font-size:15px">Top partner-click placements <span style="color:#94a3b8;font-weight:400">(watch the bridge tags: model-carvertical, blog-carvertical, blog-inline)</span></h3>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 20px">${rows(d.partnerContexts)}</table>

  <h3 style="margin:24px 0 6px;font-size:15px">Reg searches by source</h3>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 20px">${rows(d.regSearchSources)}</table>

  <h3 style="margin:24px 0 6px;font-size:15px">Top pages by views</h3>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 20px">${rows(d.topPages)}</table>

  <p style="color:#94a3b8;font-size:12px;margin:28px 0 0;border-top:1px solid #e2e8f0;padding-top:12px">Automated weekly audit · Free Plate Check · source of truth is Supabase site_events (GA4 is sample-only).</p>
</div>`;
}

export function weeklyAuditSubject(d: WeeklyAuditData): string {
  const visitors = d.headline.find((h) => h.label === "Unique visitors")?.cur ?? 0;
  const clicks = d.headline.find((h) => h.label === "Partner clicks")?.cur ?? 0;
  return `FPC weekly: ${visitors.toLocaleString("en-GB")} visitors, ${clicks} partner clicks (${d.windowStart})`;
}
