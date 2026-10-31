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

/** valuation_result rows in a window, optionally only long DVLA model names
 *  (3+ words) and/or only those that found eBay comparables. Count-only, so
 *  no paging through ~12k rows a week. */
async function countValuations(
  sb: SupabaseClient,
  gteISO: string,
  ltISO: string | undefined,
  opts: { long?: boolean; withMarket?: boolean },
): Promise<number> {
  let q = sb
    .from("site_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "valuation_result")
    .gte("created_at", gteISO)
    .or(NOT_INTERNAL);
  if (ltISO) q = q.lt("created_at", ltISO);
  if (opts.long) q = q.like("metadata->>model", "% % %");
  if (opts.withMarket) q = q.not("metadata->>ebayMedian", "is", null);
  const { count } = await q;
  return count ?? 0;
}

function topN(map: Map<string, number>, n: number): [string, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export interface PlacementStat {
  context: string;
  impressions: number;
  clicks: number; // human clicks only — see isHumanClick
}

export interface ArmStat {
  variant: string;
  impressions: number;
  clicks: number;
}

export interface CarVerticalAudit {
  logged: number; // every carVertical partner_click row
  human: number; // excluding /go clicks from IPs that never loaded a page
  cookieless: number; // /go clicks that ran our JS but refused the visit cookie
  placements: PlacementStat[];
  sellerTest: { arms: ArmStat[]; z: number | null };
}

/** We Buy Any Car (Rakuten, live 2026-10-28): seen vs clicked per placement. */
export interface WbacAudit {
  logged: number; // every weBuyAnyCar partner_click row
  human: number; // see isHumanClick
  placements: PlacementStat[];
}

/** The downloaded PDF report: its partner panels, scans of the QR vs taps on the link. */
export interface PdfReportAudit {
  downloads: number;
  partners: { name: string; scans: number; taps: number }[];
}

export interface BuyerJourneyAudit {
  pageViews: number; // /check-before-you-buy page views
  searchesBySource: [string, number][];
  homeLinkClicks: number;
  hmlLookups: number; // How Many Left lookups (7d)
  hmlFullCheckClicks: number; // "See the full check on this car" taps from How Many Left
  mismatches: number; // "doesn't match the advert" taps
  cvImpressions: number;
  cvClicks: number;
}

/** Valuations that found eBay comparables, as [with market data, total]. */
export interface MarketDataAudit {
  cur: { all: [number, number]; long: [number, number] };
  prev: { all: [number, number]; long: [number, number] };
}

/** "My Cars" with alerts (Move 3, live from 2026-11): saves, opt-ins, what was sent and opened. */
export interface SavedCarsAudit {
  saves: { cur: number; prev: number };
  cardViews: number;
  /** Per surface: card views and saves (the opt-in rate's two halves). */
  bySurface: { surface: string; views: number; saves: number }[];
  byChannel: [string, number][];
  byIntent: [string, number][];
  /** Per alert kind: sent and opened this week. */
  alerts: { kind: string; sent: number; opened: number }[];
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
  carVertical: CarVerticalAudit;
  weBuyAnyCar: WbacAudit;
  pdfReport: PdfReportAudit;
  buyerJourney: BuyerJourneyAudit;
  marketData: MarketDataAudit;
  savedCars: SavedCarsAudit;
}

/** The two arms of seller_trust_copy_v1 and the placements it runs on. */
const SELLER_TEST_CONTEXTS = new Set(["valuation-result-seller", "money-seller"]);
const SELLER_TEST_ARMS = ["seller", "seller-trust"];
/** When #166 went live. Before it every seller impression was "seller", so
 *  counting them would hand the current copy a head start of a whole week. */
const SELLER_TEST_START_MS = Date.parse("2026-10-19T20:30:00Z");
const BUYER_CHECK_PATH = "/check-before-you-buy";

/**
 * A carVertical click a person made. In Sep–Oct 2026, 175 of 406 logged
 * clicks came through /go from IPs that never fired a page_view — link
 * followers, not readers. #158 stopped most at the door; this keeps the
 * weekly number honest if any get through.
 */
function isHumanClick(r: EventRow, pageViewIps: Set<string>): boolean {
  if (r.metadata?.via !== "go_redirect") return true; // fired by our own JS
  return r.ip_hash != null && pageViewIps.has(r.ip_hash);
}

/** Two-proportion z-score; null when either arm is too small to say anything. */
function twoProportionZ(a: ArmStat, b: ArmStat): number | null {
  if (a.impressions < 100 || b.impressions < 100) return null;
  const pa = a.clicks / a.impressions;
  const pb = b.clicks / b.impressions;
  const p = (a.clicks + b.clicks) / (a.impressions + b.impressions);
  const se = Math.sqrt(p * (1 - p) * (1 / a.impressions + 1 / b.impressions));
  return se > 0 ? (pb - pa) / se : null;
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
    { key: "car_saved", label: "Cars saved (alerts on)" },
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

  // ── Valuations with market data (7d vs prior 7d) ─────────────────────────
  const marketWindow = async (gte: string, lt?: string) => {
    const [all, allM, long, longM] = await Promise.all([
      countValuations(sb, gte, lt, {}),
      countValuations(sb, gte, lt, { withMarket: true }),
      countValuations(sb, gte, lt, { long: true }),
      countValuations(sb, gte, lt, { long: true, withMarket: true }),
    ]);
    return { all: [allM, all] as [number, number], long: [longM, long] as [number, number] };
  };
  const [mdCur, mdPrev] = await Promise.all([marketWindow(d7), marketWindow(d14, d7)]);

  // ── carVertical + buyer journey (7d) ─────────────────────────────────────
  const pageViewIps = new Set(pv.map((r) => r.ip_hash).filter((h): h is string => !!h));
  const cvClicks = pc.filter((r) => r.metadata?.partner_id === "carVertical");
  const cvHuman = cvClicks.filter((r) => isHumanClick(r, pageViewIps));
  const allImps = await pullEvents(sb, "partner_impression", d7);
  const imps = allImps.filter((r) => r.metadata?.partner_id === "carVertical");

  const placementMap = new Map<string, PlacementStat>();
  const placement = (ctx: string) => {
    const existing = placementMap.get(ctx);
    if (existing) return existing;
    const created = { context: ctx, impressions: 0, clicks: 0 };
    placementMap.set(ctx, created);
    return created;
  };
  for (const r of imps) placement(metaStr(r.metadata, "click_context")).impressions++;
  for (const r of cvHuman) placement(metaStr(r.metadata, "click_context")).clicks++;

  const arms = new Map<string, ArmStat>(
    SELLER_TEST_ARMS.map((v) => [v, { variant: v, impressions: 0, clicks: 0 }]),
  );
  const inTest = (r: EventRow) =>
    Date.parse(r.created_at) >= SELLER_TEST_START_MS &&
    SELLER_TEST_CONTEXTS.has(metaStr(r.metadata, "click_context"));
  for (const r of imps) {
    if (!inTest(r)) continue;
    const arm = arms.get(metaStr(r.metadata, "variant"));
    if (arm) arm.impressions++;
  }
  for (const r of cvHuman) {
    if (!inTest(r)) continue;
    const arm = arms.get(metaStr(r.metadata, "variant"));
    if (arm) arm.clicks++;
  }
  const [control, trust] = SELLER_TEST_ARMS.map((v) => arms.get(v)!);

  const buyerSources = new Map<string, number>();
  for (const r of rs) {
    if (metaStr(r.metadata, "target_path") !== BUYER_CHECK_PATH) continue;
    const src = metaStr(r.metadata, "source");
    buyerSources.set(src, (buyerSources.get(src) ?? 0) + 1);
  }
  const [homeLinkClicks, mismatches, hmlLookups, hmlFullCheckClicks] = await Promise.all([
    countEvents(sb, "buyer_check_link_click", d7),
    countEvents(sb, "buyer_check_mismatch", d7),
    countEvents(sb, "hml_lookup", d7),
    countEvents(sb, "hml_full_check_click", d7),
  ]);
  const buyerBox = placementMap.get("buyer-check-carvertical");

  // ── We Buy Any Car (7d) ──────────────────────────────────────────────────
  const wbacClicks = pc.filter((r) => r.metadata?.partner_id === "weBuyAnyCar");
  const wbacHuman = wbacClicks.filter((r) => isHumanClick(r, pageViewIps));
  const wbacPlacements = new Map<string, PlacementStat>();
  const wbacPlacement = (ctx: string) => {
    const existing = wbacPlacements.get(ctx);
    if (existing) return existing;
    const created = { context: ctx, impressions: 0, clicks: 0 };
    wbacPlacements.set(ctx, created);
    return created;
  };
  for (const r of allImps) {
    if (r.metadata?.partner_id === "weBuyAnyCar") wbacPlacement(metaStr(r.metadata, "click_context")).impressions++;
  }
  for (const r of wbacHuman) wbacPlacement(metaStr(r.metadata, "click_context")).clicks++;

  // ── PDF report (7d) ──────────────────────────────────────────────────────
  // The QR codes encode v=<edition>-qr (from 29 Oct 2026); the tap links
  // don't. Reports downloaded before then have an unmarked QR, so for a while
  // a few scans will count as taps.
  const pdfDownloads = await countEvents(sb, "pdf_download", d7);
  const pdfSplit = (name: string, ctx: string, clicks: EventRow[]) => {
    const fromPdf = clicks.filter((r) => metaStr(r.metadata, "click_context") === ctx);
    const scans = fromPdf.filter((r) => metaStr(r.metadata, "variant").endsWith("-qr")).length;
    return { name, scans, taps: fromPdf.length - scans };
  };

  // ── My Cars with alerts (7d, saves vs prior 7d) ──────────────────────────
  const saved14 = await pullEvents(sb, "car_saved", d14);
  const savedCur = saved14.filter((r) => Date.parse(r.created_at) >= d7ms);
  const cardViews = await pullEvents(sb, "save_card_view", d7);
  const surfaces = new Map<string, { surface: string; views: number; saves: number }>();
  const surfaceOf = (ctx: string) => {
    const existing = surfaces.get(ctx);
    if (existing) return existing;
    const created = { surface: ctx, views: 0, saves: 0 };
    surfaces.set(ctx, created);
    return created;
  };
  for (const r of cardViews) surfaceOf(metaStr(r.metadata, "surface")).views++;
  const byChannel = new Map<string, number>();
  const byIntent = new Map<string, number>();
  for (const r of savedCur) {
    surfaceOf(metaStr(r.metadata, "surface")).saves++;
    byChannel.set(metaStr(r.metadata, "channel"), (byChannel.get(metaStr(r.metadata, "channel")) ?? 0) + 1);
    const intent = metaStr(r.metadata, "intent");
    byIntent.set(intent === "(none)" ? "not said" : intent, (byIntent.get(intent === "(none)" ? "not said" : intent) ?? 0) + 1);
  }
  const [alertsSent, alertsOpened] = await Promise.all([pullEvents(sb, "alert_sent", d7), pullEvents(sb, "alert_open", d7)]);
  const alertKinds = new Map<string, { kind: string; sent: number; opened: number }>();
  const kindOf = (k: string) => {
    const existing = alertKinds.get(k);
    if (existing) return existing;
    const created = { kind: k, sent: 0, opened: 0 };
    alertKinds.set(k, created);
    return created;
  };
  for (const r of alertsSent) kindOf(metaStr(r.metadata, "kind")).sent++;
  for (const r of alertsOpened) kindOf(metaStr(r.metadata, "kind")).opened++;

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
    carVertical: {
      logged: cvClicks.length,
      human: cvHuman.length,
      cookieless: cvClicks.filter((r) => r.metadata?.cookieless === true).length,
      placements: [...placementMap.values()]
        .filter((p) => p.impressions > 0 || p.clicks > 0)
        .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
        .slice(0, 10),
      sellerTest: { arms: [control, trust], z: twoProportionZ(control, trust) },
    },
    weBuyAnyCar: {
      logged: wbacClicks.length,
      human: wbacHuman.length,
      placements: [...wbacPlacements.values()].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions),
    },
    pdfReport: {
      downloads: pdfDownloads,
      partners: [pdfSplit("carVertical", "pdf-carvertical", cvHuman), pdfSplit("We Buy Any Car", "pdf-wbac", wbacHuman)],
    },
    buyerJourney: {
      pageViews: pathCur.get(BUYER_CHECK_PATH) ?? 0,
      searchesBySource: topN(buyerSources, 6),
      homeLinkClicks,
      hmlLookups,
      hmlFullCheckClicks,
      mismatches,
      cvImpressions: buyerBox?.impressions ?? 0,
      cvClicks: buyerBox?.clicks ?? 0,
    },
    marketData: { cur: mdCur, prev: mdPrev },
    savedCars: {
      saves: { cur: savedCur.length, prev: saved14.length - savedCur.length },
      cardViews: cardViews.length,
      bySurface: [...surfaces.values()].sort((a, b) => b.saves - a.saves || b.views - a.views),
      byChannel: topN(byChannel, 4),
      byIntent: topN(byIntent, 4),
      alerts: [...alertKinds.values()].sort((a, b) => b.sent - a.sent),
    },
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

const TD = "padding:6px 10px;border:1px solid #e2e8f0";
const TDR = `${TD};text-align:right;font-variant-numeric:tabular-nums`;

function ctr(clicks: number, impressions: number): string {
  return impressions > 0 ? `${((100 * clicks) / impressions).toFixed(1)}%` : "—";
}

/** Plain-English read of the seller copy test, so the email says what it means. */
function sellerTestVerdict(z: number | null, arms: ArmStat[]): string {
  if (z === null) return "Too early — fewer than 100 impressions in an arm.";
  const abs = Math.abs(z);
  const leader = z > 0 ? "the trust copy" : "the current copy";
  if (abs >= 1.96) return `<strong>${leader} is ahead, and the gap is unlikely to be chance (z=${z.toFixed(2)}).</strong> One week can mislead — check it holds for a second week before calling it.`;
  if (abs >= 1.0) return `${leader} is ahead, but not yet clearly (z=${z.toFixed(2)}). Keep running.`;
  const total = arms.reduce((n, a) => n + a.impressions, 0);
  return `No real difference yet (z=${z.toFixed(2)}, ${total.toLocaleString("en-GB")} impressions). Keep running.`;
}

function renderWbac(w: WbacAudit): string {
  const rows =
    w.placements.length === 0
      ? `<tr><td style="${TD};color:#94a3b8" colspan="4">none this week</td></tr>`
      : w.placements
          .map(
            (p) =>
              `<tr><td style="${TD}"><code>${p.context}</code></td><td style="${TDR}">${p.impressions.toLocaleString("en-GB")}</td><td style="${TDR}">${p.clicks}</td><td style="${TDR}">${ctr(p.clicks, p.impressions)}</td></tr>`,
          )
          .join("");
  return `
  <h3 style="margin:28px 0 6px;font-size:16px">We Buy Any Car</h3>
  <p style="margin:0 0 10px;font-size:14px">
    <strong>${w.human}</strong> clicks from real visitors
    <span style="color:#64748b">(${w.logged} logged${w.logged > w.human ? `, ${w.logged - w.human} from IPs that never loaded a page` : ""})</span>.
    £45 only when WBAC buys the car (booked within 24h of the click, bought within 4 days) — sales by placement (<code>u1</code>) are in Rakuten's transaction report.
  </p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 18px">
    <tr style="background:#f1f5f9"><th style="${TD};text-align:left">Placement</th><th style="${TDR}">Seen</th><th style="${TDR}">Clicks</th><th style="${TDR}">Rate</th></tr>
    ${rows}
  </table>`;
}

function renderPdfReport(r: PdfReportAudit): string {
  const rows = r.partners
    .map(
      (p) =>
        `<tr><td style="${TD}">${p.name}</td><td style="${TDR}">${p.scans}</td><td style="${TDR}">${p.taps}</td><td style="${TDR}">${ctr(p.scans + p.taps, r.downloads)}</td></tr>`,
    )
    .join("");
  return `
  <h3 style="margin:28px 0 6px;font-size:16px">Downloaded report</h3>
  <p style="margin:0 0 10px;font-size:14px">
    <strong>${r.downloads.toLocaleString("en-GB")}</strong> PDF downloads. Clicks from the report's partner panels, split by how:
    a <em>scan</em> is the QR code (a computer or a printout), a <em>tap</em> is the link (reading on a phone).
  </p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 18px">
    <tr style="background:#f1f5f9"><th style="${TD};text-align:left">Partner</th><th style="${TDR}">Scans</th><th style="${TDR}">Taps</th><th style="${TDR}">Per download</th></tr>
    ${rows}
  </table>`;
}

function renderCarVertical(cv: CarVerticalAudit, bj: BuyerJourneyAudit): string {
  const placementRows =
    cv.placements.length === 0
      ? `<tr><td style="${TD};color:#94a3b8" colspan="4">none this week</td></tr>`
      : cv.placements
          .map(
            (p) =>
              `<tr><td style="${TD}"><code>${p.context}</code></td><td style="${TDR}">${p.impressions.toLocaleString("en-GB")}</td><td style="${TDR}">${p.clicks}</td><td style="${TDR}">${ctr(p.clicks, p.impressions)}</td></tr>`,
          )
          .join("");
  const armRows = cv.sellerTest.arms
    .map(
      (a) =>
        `<tr><td style="${TD}">${a.variant === "seller" ? "Current — “See what a buyer will find”" : "Trust — “Have the history check ready for buyers”"}</td><td style="${TDR}">${a.impressions.toLocaleString("en-GB")}</td><td style="${TDR}">${a.clicks}</td><td style="${TDR}">${ctr(a.clicks, a.impressions)}</td></tr>`,
    )
    .join("");
  const head = (cols: string[]) =>
    `<tr style="background:#f1f5f9">${cols.map((c, i) => `<th style="${TD};text-align:${i === 0 ? "left" : "right"}">${c}</th>`).join("")}</tr>`;

  return `
  <h3 style="margin:28px 0 6px;font-size:16px">carVertical</h3>
  <p style="margin:0 0 10px;font-size:14px">
    <strong>${cv.human}</strong> clicks from real visitors
    <span style="color:#64748b">(${cv.logged} logged${cv.logged > cv.human ? `, ${cv.logged - cv.human} from IPs that never loaded a page` : ""}${cv.cookieless ? `, ${cv.cookieless} cookieless` : ""})</span>.
    Paid per sale, not per click — sales by placement are only in carVertical's dashboard.
  </p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 18px">
    ${head(["Placement", "Seen", "Clicks", "Rate"])}
    ${placementRows}
  </table>

  <h3 style="margin:24px 0 6px;font-size:15px">Seller copy test <span style="color:#94a3b8;font-weight:400">(seller_trust_copy_v1, both seller boxes)</span></h3>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 8px">
    ${head(["Version", "Seen", "Clicks", "Rate"])}
    ${armRows}
  </table>
  <p style="margin:0 0 18px;font-size:13px;color:#334155">${sellerTestVerdict(cv.sellerTest.z, cv.sellerTest.arms)}</p>

  <h3 style="margin:24px 0 6px;font-size:15px">Buyer's check <span style="color:#94a3b8;font-weight:400">(/check-before-you-buy)</span></h3>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 8px">
    <tr><td style="${TD}">Page views</td><td style="${TDR}">${bj.pageViews.toLocaleString("en-GB")}</td></tr>
    <tr><td style="${TD}">Homepage “Check it before you buy” clicks</td><td style="${TDR}">${bj.homeLinkClicks}</td></tr>
    <tr><td style="${TD}">“Doesn't match the advert” taps</td><td style="${TDR}">${bj.mismatches}</td></tr>
    <tr><td style="${TD}">carVertical box: seen / clicks / rate</td><td style="${TDR}">${bj.cvImpressions} / ${bj.cvClicks} / ${ctr(bj.cvClicks, bj.cvImpressions)}</td></tr>
  </table>
  <p style="margin:6px 0 4px;font-size:13px;color:#64748b">Reg searches into the buyer's check, by source:</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 20px">${rows(bj.searchesBySource)}</table>

  <h3 style="margin:24px 0 6px;font-size:15px">How Many Left → full check <span style="color:#94a3b8;font-weight:400">(/stats/how-many-left)</span></h3>
  <p style="margin:0 0 20px;font-size:14px">
    <strong>${bj.hmlFullCheckClicks}</strong> taps on “See the full check” from <strong>${bj.hmlLookups.toLocaleString("en-GB")}</strong> lookups
    (${ctr(bj.hmlFullCheckClicks, bj.hmlLookups)}). If this is high, the button earns a more prominent spot; the classic warranty offer there converts at ~0.3%.
  </p>`;
}

function share([n, total]: [number, number]): string {
  return total > 0
    ? `${((100 * n) / total).toFixed(1)}% <span style="color:#94a3b8">(${n.toLocaleString("en-GB")} / ${total.toLocaleString("en-GB")})</span>`
    : "—";
}

function renderMarketData(md: MarketDataAudit): string {
  const short = (w: MarketDataAudit["cur"]): [number, number] => [w.all[0] - w.long[0], w.all[1] - w.long[1]];
  const row = (label: string, cur: [number, number], prev: [number, number]) =>
    `<tr><td style="${TD}">${label}</td><td style="${TDR}">${share(cur)}</td><td style="${TDR}">${share(prev)}</td></tr>`;
  return `
  <h3 style="margin:28px 0 6px;font-size:16px">Valuations with market data</h3>
  <p style="margin:0 0 10px;font-size:14px">Share of valuations that found eBay comparables; the rest are priced on the depreciation curve alone.</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 8px">
    <tr style="background:#f1f5f9"><th style="${TD};text-align:left">Model name</th><th style="${TD};text-align:right">This week</th><th style="${TD};text-align:right">Prior week</th></tr>
    ${row("All valuations", md.cur.all, md.prev.all)}
    ${row("Short (1–2 words, e.g. “FOCUS”)", short(md.cur), short(md.prev))}
    ${row("Long (3+ words, e.g. “ZS TROPHY HEV AUTO”)", md.cur.long, md.prev.long)}
  </table>
  <p style="margin:0 0 20px;font-size:13px;color:#64748b">Long names found comparables 1.7% of the time until #176 (21 Oct 2026). Young cars stay low whatever we do — eBay UK lists few 1–3-year-old cars.</p>`;
}

function renderSavedCars(sc: SavedCarsAudit): string {
  const surfaceRows = sc.bySurface
    .map(
      (p) =>
        `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0">${p.surface}</td>
         <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${p.views.toLocaleString("en-GB")}</td>
         <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${p.saves.toLocaleString("en-GB")}</td>
         <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;font-weight:600">${ctr(p.saves, p.views)}</td></tr>`,
    )
    .join("");
  const alertRows = sc.alerts
    .map(
      (a) =>
        `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0">${a.kind}</td>
         <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${a.sent.toLocaleString("en-GB")}</td>
         <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${a.opened.toLocaleString("en-GB")}</td>
         <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;font-weight:600">${ctr(a.opened, a.sent)}</td></tr>`,
    )
    .join("");
  const pairs = (xs: [string, number][]) => xs.map(([k, n]) => `${k} ${n}`).join(" · ") || "none";
  return `
  <h3 style="margin:24px 0 6px;font-size:15px">My Cars with alerts</h3>
  <p style="margin:0 0 10px;font-size:14px">
    <strong>${sc.saves.cur.toLocaleString("en-GB")}</strong> cars saved with alerts on
    (prior week ${sc.saves.prev.toLocaleString("en-GB")}, ${pctChange(sc.saves.cur, sc.saves.prev)}) ·
    channel: ${pairs(sc.byChannel)} · plans: ${pairs(sc.byIntent)}
  </p>
  <table style="border-collapse:collapse;width:100%;font-size:13px;margin:0 0 12px">
    <tr style="background:#f1f5f9"><th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left">Surface</th><th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">Card seen</th><th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">Saved</th><th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">Opt-in</th></tr>
    ${surfaceRows || '<tr><td colspan="4" style="padding:6px 10px;border:1px solid #e2e8f0;color:#94a3b8">No card views yet</td></tr>'}
  </table>
  <table style="border-collapse:collapse;width:100%;font-size:13px;margin:0 0 6px">
    <tr style="background:#f1f5f9"><th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left">Alert</th><th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">Sent</th><th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">Opened</th><th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">Open rate</th></tr>
    ${alertRows || '<tr><td colspan="4" style="padding:6px 10px;border:1px solid #e2e8f0;color:#94a3b8">Nothing sent this week</td></tr>'}
  </table>
  <p style="color:#94a3b8;font-size:12px;margin:0 0 8px">Opt-in = car_saved ÷ save_card_view per surface. Opened = alert_open (the link's src=car-alert-…); push opens that only show the notification aren't counted. Go/no-go for a native app after 6–8 weeks: a few hundred opt-ins, or a clearly higher return rate among installs.</p>`;
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

  ${renderCarVertical(d.carVertical, d.buyerJourney)}
  ${renderWbac(d.weBuyAnyCar)}
  ${renderPdfReport(d.pdfReport)}

  ${renderSavedCars(d.savedCars)}

  ${renderMarketData(d.marketData)}

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
