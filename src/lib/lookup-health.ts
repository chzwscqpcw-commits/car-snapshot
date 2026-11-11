// Lookup health: is /api/lookup's DVLA or MOT half failing, and for how long?
//
// On 8–9 Nov 2026 the MOT half failed for 21.5 hours (738 `lookup_error`
// rows) and nobody was told: the rows were being written, but nothing read
// them. This module is the reader. It has three users:
//
//   /api/cron/lookup-health   every 15 minutes: one email when a stage goes
//                             bad, one when it clears
//   the Friday audit email    errors by stage for the week, longest bad spell
//   /data-health              the same summary, live
//
// Everything that decides something is a pure function over event rows, so
// scripts/test-lookup-health.ts can replay the real outage's shape.

import type { SupabaseClient } from "@supabase/supabase-js";

const MINUTE = 60_000;

/**
 * When to raise the alarm. Picked from `site_events`, 25 Oct – 11 Nov 2026:
 * a normal day has zero errors (the worst was two timeouts), while the
 * outage ran at 33–98 errors an hour by day and 3–9 by night, on every fresh
 * lookup. So the bar is low, with a share test to keep one unlucky visitor
 * retrying from ringing it:
 *
 *   bad        = at least MIN_ERRORS errors for one stage in the last hour
 *                AND they are at least MIN_SHARE of that hour's fresh lookups
 *   recovered  = in the last RECOVERY_WINDOW_MIN minutes there were at least
 *                RECOVERY_MIN_LOOKUPS fresh lookups and at most
 *                RECOVERY_MAX_SHARE of them failed
 *
 * Replayed every 15 minutes against the real rows, this fires at 12:30 UTC on
 * 8 Nov, 38 minutes after the first error (at 12:15 the five errors so far
 * were still under 30% of an hour that began healthy), and clears at 10:15
 * the next morning, 45 minutes after the last. Nothing else fires between
 * 29 Oct and 11 Nov. In the small hours an outage can take longer to reach
 * five errors; that is the price of not paging on a single timeout.
 */
export const LOOKUP_ALERT = {
  WINDOW_MIN: 60,
  MIN_ERRORS: 5,
  MIN_SHARE: 0.3,
  RECOVERY_WINDOW_MIN: 30,
  RECOVERY_MAX_SHARE: 0.1,
  RECOVERY_MIN_LOOKUPS: 3,
} as const;

/** Errors of one stage closer together than this are one spell. Night-time
 *  traffic during the outage left gaps of up to 40 minutes between lookups. */
export const SPELL_GAP_MIN = 60;
/** Fewer errors than this is a blip, not a spell. */
export const SPELL_MIN_ERRORS = 5;

export type LookupStage = "dvla" | "mot" | "internal";
const STAGES: LookupStage[] = ["mot", "dvla", "internal"];

export const STAGE_LABEL: Record<LookupStage, string> = {
  mot: "MOT history (DVSA)",
  dvla: "Vehicle details (DVLA)",
  internal: "Lookup route (our own code)",
};

/** A `lookup` or `lookup_error` row, as stored. */
export interface HealthRow {
  event_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface StageStats {
  stage: LookupStage;
  errors: number;
  /** Fresh (non-cached) lookups that reached this stage in the window. */
  attempts: number;
  /** errors / attempts, capped at 1. */
  share: number;
  /** reason → count, e.g. { network_error: 31, timeout: 2 }. */
  reasons: Record<string, number>;
  /** The low-level cause where the row carries one, e.g. { CERT_HAS_EXPIRED: 31 }. */
  causes: Record<string, number>;
}

function stageOf(row: HealthRow): LookupStage | null {
  const s = row.metadata?.stage;
  return s === "mot" || s === "dvla" || s === "internal" ? s : null;
}

function bump(map: Record<string, number>, key: unknown): void {
  if (typeof key !== "string" && typeof key !== "number") return;
  const k = String(key);
  if (!k) return;
  map[k] = (map[k] ?? 0) + 1;
}

/**
 * Per-stage error counts and failure share for rows in [fromMs, toMs).
 *
 * The denominator is fresh lookups: a cached lookup calls neither service. A
 * lookup that died at DVLA writes an error and no `lookup` row, so those are
 * added back; an MOT failure writes both (the page still renders), so the
 * share can't exceed 1 by more than rounding and is capped.
 */
export function stageStats(rows: HealthRow[], fromMs: number, toMs: number): Record<LookupStage, StageStats> {
  const stats = Object.fromEntries(
    STAGES.map((stage) => [stage, { stage, errors: 0, attempts: 0, share: 0, reasons: {}, causes: {} } as StageStats]),
  ) as Record<LookupStage, StageStats>;
  let fresh = 0;
  for (const row of rows) {
    const t = Date.parse(row.created_at);
    if (!(t >= fromMs && t < toMs)) continue;
    if (row.event_type === "lookup") {
      if (row.metadata?.cached !== true) fresh++;
    } else if (row.event_type === "lookup_error") {
      const stage = stageOf(row);
      if (!stage) continue;
      const s = stats[stage];
      s.errors++;
      bump(s.reasons, row.metadata?.reason);
      bump(s.causes, row.metadata?.cause_code ?? row.metadata?.err_code);
    }
  }
  const reachedServices = fresh + stats.dvla.errors + stats.internal.errors;
  for (const stage of STAGES) {
    const s = stats[stage];
    s.attempts = Math.max(s.errors, reachedServices);
    s.share = s.attempts > 0 ? Math.min(1, s.errors / s.attempts) : 0;
  }
  return stats;
}

export function isBad(s: StageStats): boolean {
  return s.errors >= LOOKUP_ALERT.MIN_ERRORS && s.share >= LOOKUP_ALERT.MIN_SHARE;
}

/** Recovery needs evidence, not silence: some lookups, nearly all succeeding. */
export function isRecovered(s: StageStats): boolean {
  const lookups = s.attempts;
  return lookups >= LOOKUP_ALERT.RECOVERY_MIN_LOOKUPS && s.share <= LOOKUP_ALERT.RECOVERY_MAX_SHARE;
}

export interface OpenIncident {
  stage: LookupStage;
  /** When the first error of the spell was recorded. */
  startedAt: string;
  /** When the alert email went out. */
  alertedAt: string;
}

export type HealthAction =
  | { type: "open"; stage: LookupStage; stats: StageStats; startedAt: string }
  | { type: "recover"; stage: LookupStage; incident: OpenIncident; lastErrorAt: string | null; errorsSinceStart: number };

/**
 * What the cron should do right now. One "open" per stage when it turns bad
 * and has no open incident; one "recover" when an open incident has cleared.
 * Nothing while an incident stays open (one email per incident), and nothing
 * while a healthy stage stays healthy.
 *
 * `rows` must cover at least the alert window; give it since the oldest open
 * incident's start for an exact error count in the recovery email.
 */
export function decideHealthActions(rows: HealthRow[], nowMs: number, open: OpenIncident[]): HealthAction[] {
  const actions: HealthAction[] = [];
  const hour = stageStats(rows, nowMs - LOOKUP_ALERT.WINDOW_MIN * MINUTE, nowMs);
  const recent = stageStats(rows, nowMs - LOOKUP_ALERT.RECOVERY_WINDOW_MIN * MINUTE, nowMs);

  for (const stage of STAGES) {
    const incident = open.find((i) => i.stage === stage);
    if (!incident) {
      if (isBad(hour[stage])) {
        const spell = spellsFor(rows, stage).at(-1);
        const firstInHour = rows.find(
          (r) => r.event_type === "lookup_error" && stageOf(r) === stage && Date.parse(r.created_at) >= nowMs - LOOKUP_ALERT.WINDOW_MIN * MINUTE,
        );
        actions.push({
          type: "open",
          stage,
          stats: hour[stage],
          startedAt: spell?.startISO ?? firstInHour?.created_at ?? new Date(nowMs).toISOString(),
        });
      }
      continue;
    }
    if (isRecovered(recent[stage])) {
      const startMs = Date.parse(incident.startedAt);
      const since = rows.filter(
        (r) => r.event_type === "lookup_error" && stageOf(r) === stage && Date.parse(r.created_at) >= startMs,
      );
      actions.push({
        type: "recover",
        stage,
        incident,
        lastErrorAt: since.at(-1)?.created_at ?? null,
        errorsSinceStart: since.length,
      });
    }
  }
  return actions;
}

export interface BadSpell {
  stage: LookupStage;
  startISO: string;
  endISO: string;
  minutes: number;
  errors: number;
}

function spellsFor(rows: HealthRow[], stage: LookupStage): BadSpell[] {
  const times = rows
    .filter((r) => r.event_type === "lookup_error" && stageOf(r) === stage)
    .map((r) => Date.parse(r.created_at))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  const spells: BadSpell[] = [];
  let start = 0;
  for (let i = 1; i <= times.length; i++) {
    if (i < times.length && times[i] - times[i - 1] <= SPELL_GAP_MIN * MINUTE) continue;
    const errors = i - start;
    if (errors >= SPELL_MIN_ERRORS) {
      spells.push({
        stage,
        startISO: new Date(times[start]).toISOString(),
        endISO: new Date(times[i - 1]).toISOString(),
        minutes: Math.round((times[i - 1] - times[start]) / MINUTE),
        errors,
      });
    }
    start = i;
  }
  return spells;
}

/** Every bad spell in the rows: runs of one stage's errors no more than
 *  SPELL_GAP_MIN apart, at least SPELL_MIN_ERRORS long. Oldest first. */
export function badSpells(rows: HealthRow[]): BadSpell[] {
  return STAGES.flatMap((stage) => spellsFor(rows, stage)).sort((a, b) => a.startISO.localeCompare(b.startISO));
}

export interface LookupHealthSummary {
  fromISO: string;
  toISO: string;
  totalErrors: number;
  /** Fresh lookups in the window (the denominator). */
  freshLookups: number;
  byStage: { stage: LookupStage; errors: number; reasons: [string, number][]; causes: [string, number][] }[];
  longestSpell: BadSpell | null;
  /** A spell whose last error is within the alert window of `toISO`: still going. */
  ongoing: BadSpell | null;
}

/** The week (or any window) in one object, for the Friday email and /data-health. */
export function summariseLookupHealth(rows: HealthRow[], fromMs: number, toMs: number): LookupHealthSummary {
  const inWindow = rows.filter((r) => {
    const t = Date.parse(r.created_at);
    return t >= fromMs && t < toMs;
  });
  const stats = stageStats(inWindow, fromMs, toMs);
  const spells = badSpells(inWindow);
  const longestSpell = spells.reduce<BadSpell | null>((best, s) => (!best || s.minutes > best.minutes ? s : best), null);
  const ongoing =
    spells.filter((s) => Date.parse(s.endISO) >= toMs - LOOKUP_ALERT.WINDOW_MIN * MINUTE).at(-1) ?? null;
  const sorted = (m: Record<string, number>) => Object.entries(m).sort((a, b) => b[1] - a[1]);
  return {
    fromISO: new Date(fromMs).toISOString(),
    toISO: new Date(toMs).toISOString(),
    totalErrors: STAGES.reduce((n, s) => n + stats[s].errors, 0),
    freshLookups: inWindow.filter((r) => r.event_type === "lookup" && r.metadata?.cached !== true).length,
    byStage: STAGES.filter((s) => stats[s].errors > 0).map((s) => ({
      stage: s,
      errors: stats[s].errors,
      reasons: sorted(stats[s].reasons),
      causes: sorted(stats[s].causes),
    })),
    longestSpell,
    ongoing,
  };
}

// ─── Reading and writing ─────────────────────────────────────────────────────

/**
 * Rows of one event type since `sinceISO`, oldest first. One type per query
 * (`.eq`, the shape every other reader of site_events uses: an `.in()` over
 * two types timed out on a two-week window), and paged by a cursor on
 * created_at rather than .range(), which times out once the offset is deep.
 */
async function pullType(sb: SupabaseClient, type: string, sinceISO: string, cap: number): Promise<HealthRow[]> {
  const rows: HealthRow[] = [];
  let cursor = sinceISO;
  let first = true;
  while (rows.length < cap) {
    let q = sb
      .from("site_events")
      .select("event_type, created_at, metadata")
      .eq("event_type", type)
      .order("created_at", { ascending: true })
      .limit(1000);
    q = first ? q.gte("created_at", cursor) : q.gt("created_at", cursor);
    const { data, error } = await q;
    if (error) throw new Error(`site_events (${type}): ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as HealthRow[]));
    if (data.length < 1000) break;
    cursor = data[data.length - 1].created_at as string;
    first = false;
  }
  return rows;
}

async function pullRows(sb: SupabaseClient, types: string[], sinceISO: string, cap: number): Promise<HealthRow[]> {
  const sets = await Promise.all(types.map((t) => pullType(sb, t, sinceISO, cap)));
  return sets.flat().sort((x, y) => x.created_at.localeCompare(y.created_at));
}

/** `lookup` and `lookup_error` rows since `sinceISO`, oldest first. Internal
 *  lookups are kept: an error row doesn't say whether its lookup was ours. */
export async function pullHealthRows(sb: SupabaseClient, sinceISO: string, cap = 20000): Promise<HealthRow[]> {
  return pullRows(sb, ["lookup", "lookup_error"], sinceISO, cap);
}

/** Only `lookup_error` rows: a week of them is small where a week of lookups is not. */
export async function pullErrorRows(sb: SupabaseClient, sinceISO: string, cap = 20000): Promise<HealthRow[]> {
  return pullRows(sb, ["lookup_error"], sinceISO, cap);
}

/** The week's summary for the audit email and the dashboard. Never throws. */
export async function getLookupHealth(sb: SupabaseClient, nowMs: number, days = 7): Promise<LookupHealthSummary> {
  const fromMs = nowMs - days * 24 * 60 * MINUTE;
  let rows: HealthRow[] = [];
  let fresh = 0;
  try {
    rows = await pullErrorRows(sb, new Date(fromMs).toISOString());
    const { count } = await sb
      .from("site_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "lookup")
      .gte("created_at", new Date(fromMs).toISOString())
      .or("metadata->>cached.is.null,metadata->>cached.neq.true");
    fresh = count ?? 0;
  } catch (err) {
    console.error("lookup_health_read_error:", err instanceof Error ? err.message : err);
  }
  return { ...summariseLookupHealth(rows, fromMs, nowMs), freshLookups: fresh };
}

/**
 * Incident state lives in `site_events` as `lookup_alert` rows (flagged
 * internal, so no visitor count ever includes them): {stage, state: "open" |
 * "recovered", started_at}. The latest row per stage says whether an incident
 * is open. A table of its own would need a migration for two rows a year.
 */
export const ALERT_EVENT = "lookup_alert";

export function openIncidentsFrom(alertRows: HealthRow[]): OpenIncident[] {
  const latest = new Map<LookupStage, HealthRow>();
  for (const row of [...alertRows].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const stage = stageOf(row);
    if (stage) latest.set(stage, row);
  }
  const open: OpenIncident[] = [];
  for (const [stage, row] of latest) {
    if (row.metadata?.state !== "open") continue;
    const startedAt = typeof row.metadata?.started_at === "string" ? row.metadata.started_at : row.created_at;
    open.push({ stage, startedAt, alertedAt: row.created_at });
  }
  return open;
}

// ─── Wording ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** "8 Nov 11:52" in UTC. */
export function fmtUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCDate()} ${month} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function tally(pairs: [string, number][] | Record<string, number>): string {
  const list = Array.isArray(pairs) ? pairs : Object.entries(pairs).sort((a, b) => b[1] - a[1]);
  return list.map(([k, n]) => `${k} × ${n}`).join(", ");
}

const VISITOR_EFFECT: Record<LookupStage, string> = {
  mot: "Results pages still load from DVLA data, but with no MOT history or mileage. A car's model and last mileage come from its MOT record, so the valuation pages are the ones to check.",
  dvla: "Lookups fall back to MOT data where the car has an MOT record (no tax status). Cars under three years old get an error.",
  internal: "Lookups are failing inside our own route. Visitors see \"Server error. Please try again.\"",
};

const SITE = "https://www.freeplatecheck.co.uk";
const WRAP = "font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a;line-height:1.55;font-size:15px";
const BOX = "border-radius:8px;padding:12px 14px;margin:0 0 16px";

export function alertSubject(action: HealthAction): string {
  const label = STAGE_LABEL[action.stage];
  if (action.type === "open") {
    return `FPC alert: ${label} failing, ${action.stats.errors} errors in the last hour`;
  }
  return `FPC recovered: ${label} is answering again`;
}

export function renderAlertHtml(action: HealthAction, nowMs: number): string {
  const label = esc(STAGE_LABEL[action.stage]);
  if (action.type === "open") {
    const s = action.stats;
    const causes = tally(s.causes);
    return `
<div style="${WRAP}">
  <p style="${BOX};background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-weight:600">${label} is failing.</p>
  <p style="margin:0 0 12px"><strong>${s.errors}</strong> of the last hour's ${s.attempts} fresh lookups failed at this stage (${Math.round(s.share * 100)}%). First error ${esc(fmtUtc(action.startedAt))} UTC.</p>
  <p style="margin:0 0 12px"><strong>What failed:</strong> ${esc(tally(s.reasons)) || "no reason recorded"}${causes ? `<br><strong>Underlying cause:</strong> ${esc(causes)}` : ""}</p>
  <p style="margin:0 0 12px"><strong>What visitors see:</strong> ${esc(VISITOR_EFFECT[action.stage])}</p>
  <p style="margin:0 0 12px">You will get one more email, when it clears. Nothing else until then.</p>
  <p style="margin:0;color:#64748b;font-size:13px">Checked ${esc(fmtUtc(new Date(nowMs).toISOString()))} UTC · alert rule: ${LOOKUP_ALERT.MIN_ERRORS}+ errors and ${Math.round(LOOKUP_ALERT.MIN_SHARE * 100)}%+ of fresh lookups in ${LOOKUP_ALERT.WINDOW_MIN} minutes · <a href="${SITE}/data-health" style="color:#2563eb">data-health</a></p>
</div>`;
  }
  const startMs = Date.parse(action.incident.startedAt);
  const endMs = action.lastErrorAt ? Date.parse(action.lastErrorAt) : nowMs;
  const minutes = Math.max(0, Math.round((endMs - startMs) / MINUTE));
  return `
<div style="${WRAP}">
  <p style="${BOX};background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;font-weight:600">${label} is answering again.</p>
  <p style="margin:0 0 12px">It failed from ${esc(fmtUtc(action.incident.startedAt))} to ${esc(fmtUtc(new Date(endMs).toISOString()))} UTC: <strong>${esc(fmtDuration(minutes))}</strong>, ${action.errorsSinceStart.toLocaleString("en-GB")} errors.</p>
  <p style="margin:0 0 12px">Partner clicks and valuation counts for that stretch are not comparable with a normal day. Friday's audit shows the spell under "Lookup health".</p>
  <p style="margin:0;color:#64748b;font-size:13px">Checked ${esc(fmtUtc(new Date(nowMs).toISOString()))} UTC · cleared when fewer than ${Math.round(LOOKUP_ALERT.RECOVERY_MAX_SHARE * 100)}% of the last ${LOOKUP_ALERT.RECOVERY_WINDOW_MIN} minutes' lookups failed · <a href="${SITE}/data-health" style="color:#2563eb">data-health</a></p>
</div>`;
}

/** One line of plain text: "738 errors (MOT history (DVSA) 738). Longest bad spell: …". */
export function lookupHealthLine(h: LookupHealthSummary): string {
  if (h.totalErrors === 0) return "no errors";
  const stages = h.byStage.map((s) => `${STAGE_LABEL[s.stage]} ${s.errors.toLocaleString("en-GB")}`).join(", ");
  const spell = h.longestSpell
    ? ` Longest bad spell: ${STAGE_LABEL[h.longestSpell.stage]}, ${fmtUtc(h.longestSpell.startISO)} to ${fmtUtc(h.longestSpell.endISO)} UTC (${fmtDuration(h.longestSpell.minutes)}, ${h.longestSpell.errors.toLocaleString("en-GB")} errors).`
    : " No bad spell (errors were scattered).";
  return `${h.totalErrors.toLocaleString("en-GB")} error${h.totalErrors === 1 ? "" : "s"} (${stages}).${spell}`;
}

/** The "Lookup health" block for the Friday audit email. Red when there was a
 *  bad spell, plain otherwise; always present so its absence means a bug. */
export function renderLookupHealthHtml(h: LookupHealthSummary): string {
  const bad = h.longestSpell !== null;
  const style = bad
    ? "background:#fef2f2;border:1px solid #fecaca"
    : "background:#f8fafc;border:1px solid #e2e8f0";
  const detail = h.byStage
    .map((s) => {
      const causes = s.causes.length ? ` · cause: ${esc(tally(s.causes))}` : "";
      return `<br><span style="color:#64748b;font-size:13px">${esc(STAGE_LABEL[s.stage])}: ${esc(tally(s.reasons))}${causes}</span>`;
    })
    .join("");
  const ongoing = h.ongoing ? `<br><strong style="color:#b91c1c">Still failing at the time of this email.</strong>` : "";
  const share =
    h.freshLookups > 0 && h.totalErrors > 0
      ? ` <span style="color:#64748b">(${h.freshLookups.toLocaleString("en-GB")} fresh lookups in the same week)</span>`
      : "";
  return `
  <p style="margin:0 0 20px;font-size:14px;${style};border-radius:8px;padding:10px 12px">
    <strong${bad ? ' style="color:#b91c1c"' : ""}>Lookup health:</strong> ${esc(lookupHealthLine(h))}${share}${ongoing}${detail}
  </p>`;
}
