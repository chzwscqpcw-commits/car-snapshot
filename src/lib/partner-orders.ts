import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServerRole } from "./supabaseServer";
import {
  LOCK_REPORT,
  REVENUE_REPORT,
  fetchReportCsv,
  isLocked,
  parseLockStatus,
  parseRevenueByDay,
  rakutenConfig,
  type RakutenConfig,
  type RakutenDay,
  type RakutenOrder,
} from "./rakuten-reports";

/**
 * Partner orders: what the We Buy Any Car clicks turned into, from the two
 * Rakuten reports pulled each day (rakuten-reports.ts).
 *
 * Our own `site_events` see clicks and never orders; an order exists only on
 * the network's side, tagged with the placement (`u1`) that sent it. This
 * module stores the reports, keeps an order's earlier commission when a later
 * pull changes it, and writes the "Partner orders" block for the Friday email
 * and /data-health, with a day-by-day check of the network's click count
 * against ours.
 *
 * STORAGE IS PRIVATE. `site_events` is readable with the public anon key, so
 * order rows do not go there: they live in `rakuten_daily` and
 * `rakuten_orders`, which have row-level security on and no policy, and are
 * read and written with the service-role key only
 * (docs/migrations/2026-11-13-rakuten-reports.sql).
 *
 * Nothing here emails anyone. Not connected, no table yet, a failed pull:
 * each is a state the email and the dashboard show in one quiet line.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const DAILY_TABLE = "rakuten_daily";
export const ORDERS_TABLE = "rakuten_orders";
/** `partner_id` on our own partner_click rows. */
export const SITE_PARTNER_ID = "weBuyAnyCar";

const NOT_INTERNAL = "metadata->>internal.is.null,metadata->>internal.neq.true";

const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const cents = (n: number) => Math.round(n * 100);
const money = (n: number) => cents(n) / 100;

// ─── Stored rows ─────────────────────────────────────────────────────────────

export interface DailyRow {
  day: string;
  impressions: number;
  clicks: number;
  orders: number;
  sales: number;
  baseline_commission: number;
  adjusted_commission: number;
  total_commission: number;
  updated_at: string;
}

/** One entry per pull that changed an order's commission or lock status. */
export interface OrderChange {
  at: string;
  commission?: [from: number, to: number];
  status?: [from: string, to: string];
}

export interface OrderRow {
  transaction_id: string;
  mid: string;
  advertiser: string;
  order_id: string;
  transaction_date: string;
  transaction_time: string;
  items: number;
  sales: number;
  commission: number;
  process_date: string | null;
  process_time: string;
  placement: string;
  lock_status: string;
  auto_lock_date: string | null;
  auto_lock_time: string;
  locked_date: string | null;
  locked_time: string;
  last_update_date: string | null;
  last_update_time: string;
  /** The commission before the last change; null if it has never changed. */
  previous_commission: number | null;
  commission_changed_at: string | null;
  changes: OrderChange[];
  first_seen_at: string;
  updated_at: string;
}

const MAX_CHANGES = 20;

export function toDailyRow(d: RakutenDay, nowISO: string): DailyRow {
  return {
    day: d.day,
    impressions: d.impressions,
    clicks: d.clicks,
    orders: d.orders,
    sales: d.sales,
    baseline_commission: d.baselineCommission,
    adjusted_commission: d.adjustedCommission,
    total_commission: d.totalCommission,
    updated_at: nowISO,
  };
}

/**
 * One row per Transaction ID. The report can list an order on more than one
 * line (an item each, or an adjustment under the original ID); their items,
 * sales and commission are added up and the rest is taken from the last line.
 */
export function mergeDuplicateOrders(orders: RakutenOrder[]): RakutenOrder[] {
  const byId = new Map<string, RakutenOrder>();
  for (const o of orders) {
    const seen = byId.get(o.transactionId);
    byId.set(
      o.transactionId,
      seen
        ? { ...o, items: seen.items + o.items, sales: money(seen.sales + o.sales), commission: money(seen.commission + o.commission) }
        : o,
    );
  }
  return [...byId.values()];
}

export interface OrderUpsertPlan {
  rows: OrderRow[];
  added: number;
  commissionChanged: number;
  /** Orders that were paying and now pay nothing. */
  wentToZero: number;
  statusChanged: number;
}

/**
 * What to write for this pull's orders, given what is stored. A later pull
 * overwrites an order's status and amounts; when the commission differs, the
 * earlier figure moves to `previous_commission` (and the change is added to
 * `changes`), so an order that was paying and drops to zero stays visible as
 * exactly that. An unchanged order keeps whatever history it has.
 */
export function planOrderUpserts(existing: OrderRow[], incoming: RakutenOrder[], nowISO: string): OrderUpsertPlan {
  const stored = new Map(existing.map((r) => [r.transaction_id, r]));
  const plan: OrderUpsertPlan = { rows: [], added: 0, commissionChanged: 0, wentToZero: 0, statusChanged: 0 };

  for (const o of mergeDuplicateOrders(incoming)) {
    const was = stored.get(o.transactionId);
    let previous = was ? was.previous_commission : null;
    let changedAt = was ? was.commission_changed_at : null;
    const changes = was && Array.isArray(was.changes) ? [...was.changes] : [];

    if (!was) {
      plan.added++;
    } else {
      const change: OrderChange = { at: nowISO };
      const before = Number(was.commission);
      if (cents(before) !== cents(o.commission)) {
        previous = money(before);
        changedAt = nowISO;
        change.commission = [money(before), money(o.commission)];
        plan.commissionChanged++;
        if (before > 0 && o.commission <= 0) plan.wentToZero++;
      }
      if (was.lock_status.trim().toLowerCase() !== o.lockStatus.trim().toLowerCase()) {
        change.status = [was.lock_status, o.lockStatus];
        plan.statusChanged++;
      }
      if (change.commission || change.status) changes.push(change);
    }

    plan.rows.push({
      transaction_id: o.transactionId,
      mid: o.mid,
      advertiser: o.advertiser,
      order_id: o.orderId,
      transaction_date: o.transactionDate,
      transaction_time: o.transactionTime,
      items: o.items,
      sales: o.sales,
      commission: money(o.commission),
      process_date: o.processDate,
      process_time: o.processTime,
      placement: o.placement,
      lock_status: o.lockStatus,
      auto_lock_date: o.autoLockDate,
      auto_lock_time: o.autoLockTime,
      locked_date: o.lockedDate,
      locked_time: o.lockedTime,
      last_update_date: o.lastUpdateDate,
      last_update_time: o.lastUpdateTime,
      previous_commission: previous === null ? null : Number(previous),
      commission_changed_at: changedAt,
      changes: changes.slice(-MAX_CHANGES),
      first_seen_at: was ? was.first_seen_at : nowISO,
      updated_at: nowISO,
    });
  }
  return plan;
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export interface OrderTotals {
  /** The network's click count (day report); null when it has no days here. */
  clicks: number | null;
  orders: number;
  /** Orders with a commission above zero. */
  paying: number;
  atZero: number;
  /** Commission on every order, as the network reports it today. */
  commission: number;
  /** The part on orders not locked yet, which can still change. */
  provisional: number;
  lockedCount: number;
  lockedCommission: number;
}

export interface PlacementOrders {
  placement: string;
  /** Our own clicks for this placement in the week (site_events). */
  siteClicksWeek: number;
  week: OrderTotals;
  sinceLaunch: OrderTotals;
}

export interface ZeroedOrder {
  transactionId: string;
  transactionDate: string;
  placement: string;
  previousCommission: number;
  changedAt: string;
  lockStatus: string;
}

export type ReconState = "match" | "flag" | "incomplete" | "no_report";

export interface ReconDay {
  day: string;
  /** The network's clicks; null when the report does not reach this day. */
  rakuten: number | null;
  site: number;
  state: ReconState;
}

export type PartnerOrdersState =
  /** Rows are stored and shown. */
  | "ok"
  /** The links are set and the tables exist; no pull has stored anything yet. */
  | "empty"
  /** The two report links are not set. */
  | "not_connected"
  /** No service-role key on this deployment, so the private tables can't be read. */
  | "no_store"
  /** The migration has not been run. */
  | "no_table"
  /** /data-health only: this deployment has no ADMIN_PIN of its own. */
  | "locked"
  | "error";

export interface PartnerOrdersSummary {
  state: PartnerOrdersState;
  /** One plain sentence for the states that are not "ok". */
  note: string;
  /** True for the made-up figures behind ?partner-orders=sample. */
  sample: boolean;
  lastPulledAt: string | null;
  /** The last pull is more than a day and a half old. */
  stale: boolean;
  /** First and last day the stored day report covers. */
  coverage: { from: string; to: string } | null;
  week: OrderTotals;
  sinceLaunch: OrderTotals;
  placements: PlacementOrders[];
  /** Orders that were paying and now pay nothing, newest change first. */
  wentToZero: ZeroedOrder[];
  wentToZeroThisWeek: number;
  /** The network's clicks against ours, a row per day, oldest first. */
  reconciliation: ReconDay[];
  flaggedDays: number;
}

/**
 * How far apart the two click counts may be before a day is flagged. They
 * normally agree to within a click or two; a busy day gets a tenth of its
 * count. A day is only judged once the network's figure for it was pulled a
 * couple of hours after it ended: today is always part-way through.
 */
export const RECON = { DAYS: 14, ABS: 3, SHARE: 0.1, SETTLE_HOURS: 2 } as const;
const STALE_AFTER_HOURS = 36;

export interface SiteClick {
  created_at: string;
  context: string;
}

function emptyTotals(clicks: number | null = null): OrderTotals {
  return { clicks, orders: 0, paying: 0, atZero: 0, commission: 0, provisional: 0, lockedCount: 0, lockedCommission: 0 };
}

function totalsOf(orders: OrderRow[], clicks: number | null): OrderTotals {
  const t = emptyTotals(clicks);
  for (const o of orders) {
    const c = Number(o.commission) || 0;
    t.orders++;
    if (c > 0) t.paying++;
    else t.atZero++;
    t.commission += c;
    if (isLocked(o.lock_status)) {
      t.lockedCount++;
      t.lockedCommission += c;
    } else {
      t.provisional += c;
    }
  }
  t.commission = money(t.commission);
  t.provisional = money(t.provisional);
  t.lockedCommission = money(t.lockedCommission);
  return t;
}

/**
 * The network's clicks per day against our own partner_click rows. Days are
 * UTC on both sides (the saved report's time zone); if the report were ever
 * switched to UK time, summer evenings would move a few clicks across
 * midnight, which the tolerance absorbs on most days.
 */
export function reconcileClicks(
  daily: Pick<DailyRow, "day" | "clicks" | "updated_at">[],
  siteClicks: SiteClick[],
  nowMs: number,
): ReconDay[] {
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const days = daily.map((d) => d.day).sort();
  const firstDay = days[0];
  const lastPullMs = daily.reduce((max, d) => Math.max(max, Date.parse(d.updated_at) || 0), 0);
  const site = new Map<string, number>();
  for (const c of siteClicks) {
    const day = c.created_at.slice(0, 10);
    site.set(day, (site.get(day) ?? 0) + 1);
  }

  const out: ReconDay[] = [];
  for (let i = RECON.DAYS - 1; i >= 0; i--) {
    const day = dayOf(nowMs - i * DAY);
    const ours = site.get(day) ?? 0;
    if (!firstDay || day < firstDay) {
      out.push({ day, rakuten: null, site: ours, state: "no_report" });
      continue;
    }
    const row = byDay.get(day);
    // A day with no clicks has no line in the report, so a missing day inside
    // (or after) the days it covers is a zero, as of the last pull.
    const theirs = row ? Number(row.clicks) || 0 : 0;
    const pulledMs = row ? Date.parse(row.updated_at) || 0 : lastPullMs;
    const settledMs = Date.parse(`${day}T00:00:00Z`) + DAY + RECON.SETTLE_HOURS * HOUR;
    if (pulledMs < settledMs) {
      out.push({ day, rakuten: theirs, site: ours, state: "incomplete" });
      continue;
    }
    const allowed = Math.max(RECON.ABS, RECON.SHARE * Math.max(theirs, ours));
    out.push({ day, rakuten: theirs, site: ours, state: Math.abs(theirs - ours) > allowed ? "flag" : "match" });
  }
  return out;
}

export function blankPartnerOrders(state: PartnerOrdersState, note: string): PartnerOrdersSummary {
  return {
    state,
    note,
    sample: false,
    lastPulledAt: null,
    stale: false,
    coverage: null,
    week: emptyTotals(),
    sinceLaunch: emptyTotals(),
    placements: [],
    wentToZero: [],
    wentToZeroThisWeek: 0,
    reconciliation: [],
    flaggedDays: 0,
  };
}

const NOTES = {
  not_connected: "Not connected. Add the two report links (RAKUTEN_REVENUE_REPORT_URL and RAKUTEN_LOCK_REPORT_URL) in Vercel.",
  no_store: "This deployment has no service-role key, so the private order tables can't be read.",
  no_table: "The report links are set but the tables are missing. Run docs/migrations/2026-11-13-rakuten-reports.sql in Supabase.",
  empty: "Connected. Nothing stored yet: the first pull runs with the next daily job.",
} as const;

export function summarisePartnerOrders(input: {
  daily: DailyRow[];
  orders: OrderRow[];
  siteClicks: SiteClick[];
  nowMs: number;
}): PartnerOrdersSummary {
  const { daily, orders, siteClicks, nowMs } = input;
  // The week is the last seven calendar days, today included.
  const weekStart = dayOf(nowMs - 6 * DAY);
  const inWeek = (day: string) => day >= weekStart;

  const days = daily.map((d) => d.day).sort();
  const clicksIn = (rows: DailyRow[]) => (daily.length === 0 ? null : rows.reduce((n, d) => n + (Number(d.clicks) || 0), 0));
  const weekOrders = orders.filter((o) => inWeek(o.transaction_date));

  const lastPulledMs = [...daily, ...orders].reduce((max, r) => Math.max(max, Date.parse(r.updated_at) || 0), 0);

  const placementNames = new Set(orders.map((o) => o.placement || "(none)"));
  const siteWeek = new Map<string, number>();
  for (const c of siteClicks) {
    if (!inWeek(c.created_at.slice(0, 10))) continue;
    siteWeek.set(c.context, (siteWeek.get(c.context) ?? 0) + 1);
    placementNames.add(c.context);
  }
  const placements: PlacementOrders[] = [...placementNames]
    .map((placement) => ({
      placement,
      siteClicksWeek: siteWeek.get(placement) ?? 0,
      week: totalsOf(weekOrders.filter((o) => (o.placement || "(none)") === placement), null),
      sinceLaunch: totalsOf(orders.filter((o) => (o.placement || "(none)") === placement), null),
    }))
    .sort((a, b) => b.sinceLaunch.orders - a.sinceLaunch.orders || b.siteClicksWeek - a.siteClicksWeek || a.placement.localeCompare(b.placement));

  const zeroed = orders
    .filter((o) => o.previous_commission !== null && Number(o.previous_commission) > 0 && Number(o.commission) <= 0 && o.commission_changed_at)
    .sort((a, b) => (b.commission_changed_at ?? "").localeCompare(a.commission_changed_at ?? ""));
  const weekAgoMs = nowMs - 7 * DAY;

  const reconciliation = reconcileClicks(daily, siteClicks, nowMs);

  return {
    state: "ok",
    note: "",
    sample: false,
    lastPulledAt: lastPulledMs > 0 ? new Date(lastPulledMs).toISOString() : null,
    stale: lastPulledMs > 0 && nowMs - lastPulledMs > STALE_AFTER_HOURS * HOUR,
    coverage: days.length > 0 ? { from: days[0], to: days[days.length - 1] } : null,
    week: totalsOf(weekOrders, clicksIn(daily.filter((d) => inWeek(d.day)))),
    sinceLaunch: totalsOf(orders, clicksIn(daily)),
    placements,
    wentToZero: zeroed.slice(0, 20).map((o) => ({
      transactionId: o.transaction_id,
      transactionDate: o.transaction_date,
      placement: o.placement || "(none)",
      previousCommission: Number(o.previous_commission),
      changedAt: o.commission_changed_at!,
      lockStatus: o.lock_status,
    })),
    wentToZeroThisWeek: zeroed.filter((o) => Date.parse(o.commission_changed_at!) >= weekAgoMs).length,
    reconciliation,
    flaggedDays: reconciliation.filter((d) => d.state === "flag").length,
  };
}

// ─── Store ───────────────────────────────────────────────────────────────────

class StoreError extends Error {
  constructor(
    message: string,
    readonly code: string | undefined,
  ) {
    super(message);
  }
  /** Postgres "undefined table", or PostgREST not finding it in its schema. */
  get tableMissing(): boolean {
    return this.code === "42P01" || this.code === "PGRST205";
  }
}

async function readAll<T>(sb: SupabaseClient, table: string, orderBy: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < 100_000; from += 1000) {
    const { data, error } = await sb.from(table).select("*").order(orderBy, { ascending: true }).range(from, from + 999);
    if (error) throw new StoreError(error.message, error.code);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function upsertAll(sb: SupabaseClient, table: string, rows: object[], onConflict: string): Promise<void> {
  for (let from = 0; from < rows.length; from += 500) {
    const { error } = await sb.from(table).upsert(rows.slice(from, from + 500), { onConflict });
    if (error) throw new StoreError(error.message, error.code);
  }
}

/** Our own We Buy Any Car clicks since `sinceISO`, owner traffic left out. */
async function pullSiteClicks(sb: SupabaseClient, sinceISO: string): Promise<SiteClick[]> {
  const out: SiteClick[] = [];
  for (let from = 0; from < 50_000; from += 1000) {
    const { data, error } = await sb
      .from("site_events")
      .select("created_at, metadata")
      .eq("event_type", "partner_click")
      .eq("metadata->>partner_id", SITE_PARTNER_ID)
      .gte("created_at", sinceISO)
      .or(NOT_INTERNAL)
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error || !data) break;
    for (const r of data as { created_at: string; metadata: Record<string, unknown> | null }[]) {
      const ctx = r.metadata?.click_context;
      out.push({ created_at: r.created_at, context: typeof ctx === "string" && ctx ? ctx : "(none)" });
    }
    if (data.length < 1000) break;
  }
  return out;
}

function serviceRole(): SupabaseClient | null {
  try {
    return supabaseServerRole();
  } catch {
    return null;
  }
}

/**
 * The summary for the Friday email and /data-health. Never throws: every way
 * this can be unavailable is a state with a sentence.
 *
 * `sbEvents` reads `site_events` (the anon client is enough); the private
 * tables are read with the service role, made here.
 */
export async function getPartnerOrders(
  sbEvents: SupabaseClient,
  nowMs: number,
  deps: { store?: SupabaseClient | null; config?: RakutenConfig } = {},
): Promise<PartnerOrdersSummary> {
  const connected = (deps.config ?? rakutenConfig()).missing.length === 0;
  const store = deps.store === undefined ? serviceRole() : deps.store;
  if (!store) {
    return connected ? blankPartnerOrders("no_store", NOTES.no_store) : blankPartnerOrders("not_connected", NOTES.not_connected);
  }

  let daily: DailyRow[];
  let orders: OrderRow[];
  try {
    [daily, orders] = await Promise.all([
      readAll<DailyRow>(store, DAILY_TABLE, "day"),
      readAll<OrderRow>(store, ORDERS_TABLE, "transaction_date"),
    ]);
  } catch (err: unknown) {
    if (err instanceof StoreError && err.tableMissing) {
      return connected ? blankPartnerOrders("no_table", NOTES.no_table) : blankPartnerOrders("not_connected", NOTES.not_connected);
    }
    return blankPartnerOrders("error", `Could not read the order tables: ${err instanceof Error ? err.message : "unknown error"}`);
  }
  if (daily.length === 0 && orders.length === 0) {
    return connected ? blankPartnerOrders("empty", NOTES.empty) : blankPartnerOrders("not_connected", NOTES.not_connected);
  }

  const since = `${dayOf(nowMs - (RECON.DAYS - 1) * DAY)}T00:00:00Z`;
  const siteClicks = await pullSiteClicks(sbEvents, since).catch(() => [] as SiteClick[]);
  return summarisePartnerOrders({ daily, orders, siteClicks, nowMs });
}

// ─── The daily pull ──────────────────────────────────────────────────────────

export interface PullReportResult {
  report: "revenue" | "lock";
  ok: boolean;
  /** Rows read from the report. */
  rows: number;
  error?: string;
  /** The failure is only that the migration has not been run. */
  tableMissing?: boolean;
  added?: number;
  commissionChanged?: number;
  wentToZero?: number;
  statusChanged?: number;
}

function failed(report: PullReportResult["report"], err: unknown): PullReportResult {
  const tableMissing = err instanceof StoreError && err.tableMissing;
  return { report, ok: false, rows: 0, error: err instanceof Error ? err.message : "unknown error", ...(tableMissing ? { tableMissing } : {}) };
}

/**
 * Fetch both reports and store them. Each report stands alone: one failing
 * does not stop the other. `dry` reads and counts without writing. The
 * results hold counts and messages only, so they are safe to return and log.
 */
export async function pullRakutenReports(
  store: SupabaseClient,
  config: RakutenConfig,
  nowMs: number,
  opts: { dry?: boolean; fetchImpl?: typeof fetch } = {},
): Promise<PullReportResult[]> {
  const nowISO = new Date(nowMs).toISOString();
  const fetchImpl = opts.fetchImpl ?? fetch;

  const revenue = async (): Promise<PullReportResult> => {
    try {
      const days = parseRevenueByDay(await fetchReportCsv(REVENUE_REPORT, config.revenueUrl ?? "", nowMs, fetchImpl));
      if (!opts.dry) await upsertAll(store, DAILY_TABLE, days.map((d) => toDailyRow(d, nowISO)), "day");
      return { report: "revenue", ok: true, rows: days.length };
    } catch (err: unknown) {
      return failed("revenue", err);
    }
  };

  const lock = async (): Promise<PullReportResult> => {
    try {
      const orders = parseLockStatus(await fetchReportCsv(LOCK_REPORT, config.lockUrl ?? "", nowMs, fetchImpl));
      const existing = await readAll<OrderRow>(store, ORDERS_TABLE, "transaction_date");
      const plan = planOrderUpserts(existing, orders, nowISO);
      if (!opts.dry) await upsertAll(store, ORDERS_TABLE, plan.rows, "transaction_id");
      return {
        report: "lock",
        ok: true,
        rows: orders.length,
        added: plan.added,
        commissionChanged: plan.commissionChanged,
        wentToZero: plan.wentToZero,
        statusChanged: plan.statusChanged,
      };
    } catch (err: unknown) {
      return failed("lock", err);
    }
  };

  return Promise.all([revenue(), lock()]);
}

// ─── Rendering (Friday email) ────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function gbp(n: number): string {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function shortDay(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** "14 days checked, all within tolerance." or which days were out. */
export function reconciliationLine(s: PartnerOrdersSummary): string {
  const judged = s.reconciliation.filter((d) => d.state === "match" || d.state === "flag");
  if (judged.length === 0) return "No complete day to compare yet.";
  const flagged = judged.filter((d) => d.state === "flag");
  if (flagged.length === 0) {
    return `${judged.length} complete day${judged.length === 1 ? "" : "s"} compared, every one within ${RECON.ABS} clicks (or ${Math.round(RECON.SHARE * 100)}%).`;
  }
  const list = flagged.map((d) => `${shortDay(d.day)}: Rakuten ${d.rakuten}, ours ${d.site}`).join("; ");
  return `${flagged.length} of ${judged.length} complete days differ by more than ${RECON.ABS} clicks (or ${Math.round(RECON.SHARE * 100)}%). ${list}.`;
}

const TD = "padding:6px 10px;border:1px solid #e2e8f0";
const TDR = `${TD};text-align:right;font-variant-numeric:tabular-nums`;

/** The "Partner orders" block for the Friday audit email. Always present. */
export function renderPartnerOrdersHtml(s: PartnerOrdersSummary): string {
  const title = `<h3 style="margin:28px 0 6px;font-size:16px">Partner orders <span style="color:#94a3b8;font-weight:400">(We Buy Any Car, from Rakuten's reports)</span></h3>`;
  if (s.state !== "ok") {
    return `${title}
  <p style="margin:0 0 18px;font-size:14px;color:#64748b">${esc(s.note)}</p>`;
  }

  const n = (v: number | null) => (v === null ? "—" : v.toLocaleString("en-GB"));
  const totalsRow = (label: string, t: OrderTotals) =>
    `<tr><td style="${TD}">${label}</td><td style="${TDR}">${n(t.clicks)}</td><td style="${TDR}">${n(t.orders)}</td><td style="${TDR}">${n(t.paying)}</td><td style="${TDR}">${n(t.atZero)}</td><td style="${TDR}">${gbp(t.provisional)}</td><td style="${TDR}">${n(t.lockedCount)} · ${gbp(t.lockedCommission)}</td></tr>`;

  const zeroed =
    s.wentToZeroThisWeek > 0
      ? `<p style="margin:0 0 12px;font-size:14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px">
    <strong style="color:#b91c1c">${s.wentToZeroThisWeek} order${s.wentToZeroThisWeek === 1 ? "" : "s"} that ${s.wentToZeroThisWeek === 1 ? "was" : "were"} paying dropped to zero this week.</strong>
    ${s.wentToZero
      .slice(0, s.wentToZeroThisWeek)
      .map((z) => `<br><span style="font-size:13px">Order of ${shortDay(z.transactionDate)}, <code>${esc(z.placement)}</code>: was ${gbp(z.previousCommission)}, changed ${shortDay(z.changedAt)} (transaction <code>${esc(z.transactionId)}</code>)</span>`)
      .join("")}
  </p>`
      : "";

  const placementRows =
    s.placements.length === 0
      ? `<tr><td style="${TD};color:#94a3b8" colspan="6">no orders or clicks yet</td></tr>`
      : s.placements
          .map(
            (p) =>
              `<tr><td style="${TD};white-space:nowrap"><code>${esc(p.placement)}</code></td><td style="${TDR}">${n(p.siteClicksWeek)}</td><td style="${TDR}">${n(p.week.orders)}</td><td style="${TDR}">${n(p.sinceLaunch.orders)}</td><td style="${TDR}">${n(p.sinceLaunch.paying)} / ${n(p.sinceLaunch.atZero)}</td><td style="${TDR}">${gbp(p.sinceLaunch.commission)}</td></tr>`,
          )
          .join("");

  const flagged = s.flaggedDays > 0;
  const freshness = s.stale
    ? `<br><strong style="color:#b91c1c">The last successful pull was ${s.lastPulledAt ? shortDay(s.lastPulledAt) : "never"}: check /api/cron/rakuten-reports in the Vercel logs (a link's token may have expired).</strong>`
    : "";

  return `${title}
  ${zeroed}
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 8px">
    <tr style="background:#f1f5f9"><th style="${TD};text-align:left"></th><th style="${TDR}">Clicks</th><th style="${TDR}">Orders</th><th style="${TDR}">Paying</th><th style="${TDR}">At zero</th><th style="${TDR}">Provisional</th><th style="${TDR}">Locked</th></tr>
    ${totalsRow("This week", s.week)}
    ${totalsRow(`Since launch${s.coverage ? ` <span style="color:#94a3b8">(from ${shortDay(s.coverage.from)})</span>` : ""}`, s.sinceLaunch)}
  </table>
  <p style="margin:0 0 12px;font-size:13px;color:#64748b">Clicks are Rakuten's count. Provisional = commission on orders not locked yet, which can still change; locked is final. Orders are placed by transaction date.</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 8px">
    <tr style="background:#f1f5f9"><th style="${TD};text-align:left">Placement (u1)</th><th style="${TDR}">Our clicks, week</th><th style="${TDR}">Orders, week</th><th style="${TDR}">Orders, all</th><th style="${TDR}">Paying / zero</th><th style="${TDR}">Commission, all</th></tr>
    ${placementRows}
  </table>
  <p style="margin:0 0 18px;font-size:13px;${flagged ? "background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:8px 10px;color:#0f172a" : "color:#64748b"}">
    <strong${flagged ? ' style="color:#b91c1c"' : ""}>Clicks, Rakuten against ours:</strong> ${esc(reconciliationLine(s))}${freshness}
  </p>`;
}

// ─── Sample ──────────────────────────────────────────────────────────────────

/**
 * A made-up week, for seeing the email block and the /data-health panel before
 * the real reports are connected (?partner-orders=sample). Every figure is
 * invented and bears no relation to the real programme.
 */
export function samplePartnerOrders(nowMs: number): PartnerOrdersSummary {
  const pulled = new Date(nowMs - 3 * HOUR).toISOString();
  const day = (ago: number) => dayOf(nowMs - ago * DAY);
  const clicks = [11, 14, 9, 12, 16, 8, 13, 10, 15, 12, 9, 14, 11, 4];
  const daily: DailyRow[] = clicks.map((c, i) => ({
    day: day(13 - i),
    impressions: 0,
    clicks: c,
    orders: 0,
    sales: 0,
    baseline_commission: 0,
    adjusted_commission: 0,
    total_commission: 0,
    updated_at: pulled,
  }));
  const order = (id: number, ago: number, placement: string, commission: number, locked: boolean, previous: number | null = null): OrderRow => ({
    transaction_id: `SAMPLE-${id}`,
    mid: "0",
    advertiser: "Sample advertiser",
    order_id: `S${id}`,
    transaction_date: day(ago),
    transaction_time: "12:00:00",
    items: 1,
    sales: 0,
    commission,
    process_date: day(ago),
    process_time: "",
    placement,
    lock_status: locked ? "Locked" : "Unlocked",
    auto_lock_date: null,
    auto_lock_time: "",
    locked_date: locked ? day(Math.max(0, ago - 5)) : null,
    locked_time: "",
    last_update_date: day(Math.max(0, ago - 1)),
    last_update_time: "",
    previous_commission: previous,
    commission_changed_at: previous === null ? null : new Date(nowMs - 2 * DAY).toISOString(),
    changes: [],
    first_seen_at: pulled,
    updated_at: pulled,
  });
  const orders = [
    order(1, 12, "valuation-result-wbac", 10, true),
    order(2, 9, "valuation-result-wbac", 10, true),
    order(3, 8, "money-wbac", 0, true),
    order(4, 5, "valuation-result-wbac", 10, false),
    order(5, 4, "valuation-result-wbac", 0, false, 10),
    order(6, 2, "money-wbac", 10, false),
    order(7, 1, "valuation-result-wbac", 10, false),
  ];
  const siteClicks: SiteClick[] = [];
  clicks.forEach((c, i) => {
    // One day is made to disagree so the flag can be seen.
    const ours = i === 9 ? c + 7 : i === 4 ? c - 1 : c;
    for (let k = 0; k < ours; k++) {
      siteClicks.push({ created_at: `${day(13 - i)}T12:00:00Z`, context: k % 4 === 0 ? "money-wbac" : "valuation-result-wbac" });
    }
  });
  return { ...summarisePartnerOrders({ daily, orders, siteClicks, nowMs }), sample: true };
}
