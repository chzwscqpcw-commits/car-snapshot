/**
 * valuation_wbac_top_v1: is the We Buy Any Car offer in the wrong place?
 *
 * The valuation tool shows our figure, then (two panels down) a "selling or
 * keeping?" chip and the offer card. 1–14 Nov 2026: about two thirds of
 * valuers ever had the card on screen and about 1 in 20 clicked it. The test
 * puts the same offer at the foot of the valuation card instead (arm "top",
 * SellCarStrip) and compares it with today's layout (arm "control").
 *
 * This file is the test's arithmetic, kept apart from the page and from the
 * email so it can be checked on its own (scripts/test-wbac-top-test.ts):
 * how many valuers the test needs, how the events add up per arm, and what
 * the Friday email is allowed to say about them and when.
 *
 * What is counted, per arm:
 *   seen     experiment_impression: our figure was on screen (once a session)
 *   clicked  experiment_click: the We Buy Any Car button (once a session)
 *   guards   car_saved and seller_intent from the valuation result, and
 *            pdf_download, each carrying exp_<id> (once a session each)
 * Orders are not here: they are in the partner's report, split by arm under
 * each arm's own placement (WBAC_TOP_PLACEMENTS), in "Partner orders".
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXPERIMENTS } from "@/lib/tracking";

export const WBAC_TOP_TEST_ID = EXPERIMENTS.WBAC_TOP;
export const WBAC_TOP_ARMS = ["control", "top"] as const;
export type WbacTopArm = (typeof WBAC_TOP_ARMS)[number];

/** The /go context each arm's button carries, which is the placement the
 *  partner's order report files its orders under. */
export const WBAC_TOP_PLACEMENTS: Record<WbacTopArm, string> = {
  control: "valuation-result-wbac",
  top: "valuation-result-wbac-top",
};

/** No event of this test exists before the day it was built. */
export const WBAC_TOP_TEST_FLOOR = "2026-11-15T00:00:00Z";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Valuers needed in EACH arm to tell `baseline` from `target` (two-sided 5%,
 * and a chance of `power` of seeing a lift that is really there).
 */
export function valuersNeededPerArm(baseline: number, target: number, power: 0.8 | 0.9 = 0.8): number {
  const zAlpha = 1.959964; // two-sided 5%
  const zBeta = power === 0.9 ? 1.281552 : 0.841621;
  const mean = (baseline + target) / 2;
  const a = zAlpha * Math.sqrt(2 * mean * (1 - mean));
  const b = zBeta * Math.sqrt(baseline * (1 - baseline) + target * (1 - target));
  return Math.ceil((a + b) ** 2 / (target - baseline) ** 2);
}

/**
 * The plan, fixed before the first visitor was counted so the result can't
 * choose its own stopping day. About 1 in 20 exposed valuers click today;
 * the test is sized to see a rise to 8 in 100. With about 135 valuers a day
 * on this surface, split two ways, the smaller number takes 16 days; three
 * whole weeks counts every weekday three times and gets close to the larger.
 * Read it when BOTH are true: `minDays` have passed and each arm has
 * `perArm` valuers. Not before, however good a week looks.
 */
export const WBAC_TOP_PLAN = {
  baseline: 0.05,
  target: 0.08,
  perArm: valuersNeededPerArm(0.05, 0.08, 0.8),
  perArmAt90: valuersNeededPerArm(0.05, 0.08, 0.9),
  valuersPerDay: 135,
  minDays: 21,
} as const;

/** Days to fill both arms at a given number of valuers a day. */
export function daysToFill(perArm: number, valuersPerDay: number): number {
  return Math.ceil((2 * perArm) / valuersPerDay);
}

export interface WbacTopArmStat {
  arm: WbacTopArm;
  /** Sessions that had our figure on screen. The denominator of everything. */
  seen: number;
  clicked: number;
  /** Guards: cars saved from the valuation result, PDF reports, chip answers. */
  saved: number;
  pdf: number;
  chip: number;
}

export interface WbacTopTestSummary {
  /** ISO time of the first counted valuer, or null before there is one. */
  startedAt: string | null;
  /** Whole days since then. */
  days: number;
  arms: [WbacTopArmStat, WbacTopArmStat]; // control, top
  /** Clicked ÷ seen, top against control; positive = the strip is ahead. */
  z: number | null;
  /** Each guard, top against control; negative = the strip arm does less of it. */
  guardZ: { saved: number | null; pdf: number | null; chip: number | null };
  /** The plan's length and size have both been reached. */
  ready: boolean;
}

/** Two-proportion z-score, b against a; null while either side is under 100. */
export function proportionZ(a: { n: number; x: number }, b: { n: number; x: number }): number | null {
  if (a.n < 100 || b.n < 100) return null;
  const p = (a.x + b.x) / (a.n + b.n);
  const se = Math.sqrt(p * (1 - p) * (1 / a.n + 1 / b.n));
  return se > 0 ? (b.x / b.n - a.x / a.n) / se : null;
}

interface Row {
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function armOf(value: unknown): WbacTopArm | null {
  return (WBAC_TOP_ARMS as readonly unknown[]).includes(value) ? (value as WbacTopArm) : null;
}

/**
 * Add the test's events up per arm. `impressions` and `clicks` are
 * experiment_impression / experiment_click rows (any experiment: other
 * tests' rows are skipped here); the guards are rows of their event type,
 * of which only those carrying this test's `exp_<id>` tag count, and for
 * the two that also fire on the homepage only those from the valuation
 * result.
 */
export function summariseWbacTopTest(
  rows: { impressions: Row[]; clicks: Row[]; saved: Row[]; pdf: Row[]; chip: Row[] },
  nowMs: number,
): WbacTopTestSummary {
  const stat = (arm: WbacTopArm): WbacTopArmStat => ({ arm, seen: 0, clicked: 0, saved: 0, pdf: 0, chip: 0 });
  const byArm: Record<WbacTopArm, WbacTopArmStat> = { control: stat("control"), top: stat("top") };
  const tag = `exp_${WBAC_TOP_TEST_ID}`;
  let first: number | null = null;

  for (const r of rows.impressions) {
    if (r.metadata?.experiment_id !== WBAC_TOP_TEST_ID) continue;
    const arm = armOf(r.metadata?.variant);
    if (!arm) continue;
    byArm[arm].seen++;
    const at = Date.parse(r.created_at);
    if (Number.isFinite(at) && (first === null || at < first)) first = at;
  }
  for (const r of rows.clicks) {
    if (r.metadata?.experiment_id !== WBAC_TOP_TEST_ID) continue;
    const arm = armOf(r.metadata?.variant);
    if (arm) byArm[arm].clicked++;
  }
  const guard = (list: Row[], key: "saved" | "pdf" | "chip", surface?: string) => {
    for (const r of list) {
      const arm = armOf(r.metadata?.[tag]);
      if (!arm) continue;
      if (surface && r.metadata?.surface !== surface) continue;
      byArm[arm][key]++;
    }
  };
  guard(rows.saved, "saved", "valuation-result");
  guard(rows.pdf, "pdf");
  guard(rows.chip, "chip", "valuation-result");

  const { control, top } = byArm;
  const days = first === null ? 0 : Math.floor((nowMs - first) / DAY);
  const z = (key: "clicked" | "saved" | "pdf" | "chip") =>
    proportionZ({ n: control.seen, x: control[key] }, { n: top.seen, x: top[key] });
  return {
    startedAt: first === null ? null : new Date(first).toISOString(),
    days,
    arms: [control, top],
    z: z("clicked"),
    guardZ: { saved: z("saved"), pdf: z("pdf"), chip: z("chip") },
    ready:
      days >= WBAC_TOP_PLAN.minDays && control.seen >= WBAC_TOP_PLAN.perArm && top.seen >= WBAC_TOP_PLAN.perArm,
  };
}

const pct = (x: number, n: number) => (n > 0 ? `${((100 * x) / n).toFixed(1)}%` : "—");

/**
 * What the email says about the numbers, in plain words. Before the plan is
 * reached it reports progress and declines to name a leader as a result;
 * after, it says which way it went, or that nothing was shown.
 */
export function wbacTopVerdict(s: WbacTopTestSummary): string {
  const [control, top] = s.arms;
  if (s.startedAt === null) return "Not started: no valuer has been counted yet.";
  const need = WBAC_TOP_PLAN.perArm.toLocaleString("en-GB");
  if (!s.ready) {
    const fewest = Math.min(control.seen, top.seen).toLocaleString("en-GB");
    const sofar =
      s.z === null
        ? ""
        : ` So far the strip is at ${pct(top.clicked, top.seen)} and the card at ${pct(control.clicked, control.seen)}; a gap this early is often chance.`;
    return `Day ${s.days + 1} of ${WBAC_TOP_PLAN.minDays}, with ${fewest} of the ${need} valuers each arm needs. Too early to read.${sofar}`;
  }
  if (s.z === null) return "Planned length reached, but an arm has under 100 valuers. Check the test is still being served.";
  const zText = `z=${s.z.toFixed(2)}`;
  if (Math.abs(s.z) >= 1.96) {
    const leader = s.z > 0 ? "The strip inside the valuation card" : "The card further down (today's layout)";
    return `<strong>${leader} gets more valuers to click, and the gap is unlikely to be chance (${zText}).</strong> The planned length has been reached, so this is the reading. Check the guard columns and each arm's orders before acting on it.`;
  }
  return `Planned length reached and no clear difference (${zText}): ${pct(top.clicked, top.seen)} for the strip against ${pct(control.clicked, control.seen)} for the card. Treat it as no proven lift.`;
}

/** Guards where the strip arm does clearly less than control, by name. */
export function wbacTopGuardWarnings(s: WbacTopTestSummary): string[] {
  const names: Record<keyof WbacTopTestSummary["guardZ"], string> = {
    saved: "cars saved",
    pdf: "PDF downloads",
    chip: "chip answers",
  };
  return (Object.keys(names) as (keyof typeof names)[])
    .filter((k) => s.guardZ[k] !== null && s.guardZ[k]! <= -1.96)
    .map((k) => names[k]);
}

// ─── Reading it from site_events, and the Friday email block ────────────────

const NOT_INTERNAL = "metadata->>internal.is.null,metadata->>internal.neq.true";

/** Rows of one event type since the test began, owner traffic left out;
 *  with `tagged`, only rows carrying this test's exp_<id>. */
async function pull(sb: SupabaseClient, eventType: string, tagged: boolean): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    let q = sb
      .from("site_events")
      .select("metadata, created_at")
      .eq("event_type", eventType)
      .gte("created_at", WBAC_TOP_TEST_FLOOR)
      .or(NOT_INTERNAL);
    if (tagged) q = q.not(`metadata->>exp_${WBAC_TOP_TEST_ID}`, "is", null);
    const { data, error } = await q.order("created_at", { ascending: true }).range(from, from + 999);
    if (error || !data) break;
    rows.push(...(data as Row[]));
    if (data.length < 1000) break;
  }
  return rows;
}

/** The whole test so far (not the week): it is read once, at its planned length. */
export async function getWbacTopTest(sb: SupabaseClient, nowMs: number): Promise<WbacTopTestSummary> {
  const [impressions, clicks, saved, pdf, chip] = await Promise.all([
    pull(sb, "experiment_impression", false),
    pull(sb, "experiment_click", false),
    pull(sb, "car_saved", true),
    pull(sb, "pdf_download", true),
    pull(sb, "seller_intent", true),
  ]);
  return summariseWbacTopTest({ impressions, clicks, saved, pdf, chip }, nowMs);
}

const TD = "padding:6px 10px;border:1px solid #e2e8f0";
const TDR = `${TD};text-align:right;font-variant-numeric:tabular-nums`;
const ARM_LABEL: Record<WbacTopArm, string> = {
  control: "Card under the chip (today)",
  top: "Strip inside the valuation card",
};

export function renderWbacTopTestHtml(s: WbacTopTestSummary): string {
  const n = (v: number) => v.toLocaleString("en-GB");
  const cell = (x: number, seen: number) =>
    `<td style="${TDR}">${n(x)} <span style="color:#94a3b8">${pct(x, seen)}</span></td>`;
  const rows = s.arms
    .map(
      (a) =>
        `<tr><td style="${TD}">${ARM_LABEL[a.arm]}<br><code style="font-size:12px;color:#64748b">${WBAC_TOP_PLACEMENTS[a.arm]}</code></td>` +
        `<td style="${TDR}">${n(a.seen)}</td>` +
        `<td style="${TDR}"><strong>${n(a.clicked)}</strong> <span style="color:#94a3b8">${pct(a.clicked, a.seen)}</span></td>` +
        `${cell(a.saved, a.seen)}${cell(a.pdf, a.seen)}${cell(a.chip, a.seen)}</tr>`,
    )
    .join("");
  const warnings = wbacTopGuardWarnings(s);
  const since = s.startedAt ? `since ${s.startedAt.slice(0, 10)}` : "not started";
  return `
  <h3 style="margin:24px 0 6px;font-size:15px">We Buy Any Car position test <span style="color:#94a3b8;font-weight:400">(${WBAC_TOP_TEST_ID}, the valuation tool only, ${since})</span></h3>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 8px">
    <tr style="background:#f1f5f9"><th style="${TD};text-align:left">Arm</th><th style="${TDR}">Saw their figure</th><th style="${TDR}">Clicked the offer</th><th style="${TDR}">Saved the car</th><th style="${TDR}">PDF report</th><th style="${TDR}">Answered the chip</th></tr>
    ${rows}
  </table>
  <p style="margin:0 0 6px;font-size:13px;color:#334155">${wbacTopVerdict(s)}</p>
  ${warnings.length ? `<p style="margin:0 0 6px;font-size:13px;color:#b45309"><strong>Guard:</strong> the strip arm has clearly fewer ${warnings.join(" and ")} than the card arm.</p>` : ""}
  <p style="margin:0 0 18px;font-size:13px;color:#64748b">Whole test to date, one count per visit. Every figure is a share of the valuers who saw their figure. What each arm's clicks became is in “Partner orders”, under the placement named in its row.</p>`;
}
