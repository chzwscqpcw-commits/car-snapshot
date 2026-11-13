/**
 * Rakuten Advertising publisher reports: fetch, parse, clean.
 *
 * Two saved reports are pulled once a day (/api/cron/rakuten-reports) so
 * nobody has to export them by hand: "Revenue Report by Day" (clicks and
 * orders per day) and "Lock Status Report" (one row per order, with the
 * placement that sent it and whether it is locked yet).
 *
 * Each report has its own link, from the dashboard's View Report → "Get API".
 * The link carries a secret token, so it lives in an environment variable and
 * is never logged, returned or put in an error message: every error raised
 * here is written from scratch and carries column names and row numbers only.
 *
 * PRIVACY. In the Lock Status report the `SKU` column is the customer's
 * vehicle registration and `Product Name` describes their car. Neither is
 * kept: the parser reads an allow-list of columns and returns nothing else,
 * so the two never reach a database row, a log line, an API response or a
 * file. A kept text cell that repeats the SKU is blanked as well.
 * `scripts/test-rakuten-reports.ts` fails if either survives.
 */

/** Environment variable names. The first two hold the "Get API" links. */
export const RAKUTEN_ENV = {
  revenue: "RAKUTEN_REVENUE_REPORT_URL",
  lock: "RAKUTEN_LOCK_REPORT_URL",
  /** Local `npm run rakuten:pull` only: where the cleaned CSVs are written. */
  exportDir: "RAKUTEN_EXPORT_DIR",
} as const;

export interface RakutenConfig {
  revenueUrl: string | null;
  lockUrl: string | null;
  /** Names of the variables that are not set. Empty = connected. */
  missing: string[];
}

export function rakutenConfig(env: Record<string, string | undefined> = process.env): RakutenConfig {
  const revenueUrl = env[RAKUTEN_ENV.revenue]?.trim() || null;
  const lockUrl = env[RAKUTEN_ENV.lock]?.trim() || null;
  const missing: string[] = [];
  if (!revenueUrl) missing.push(RAKUTEN_ENV.revenue);
  if (!lockUrl) missing.push(RAKUTEN_ENV.lock);
  return { revenueUrl, lockUrl, missing };
}

/** A report that could not be fetched or read. The message is safe to log. */
export class RakutenReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RakutenReportError";
  }
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

/**
 * RFC 4180 reader: quoted cells, doubled quotes, commas and line breaks inside
 * quotes, CRLF or LF, a leading byte-order mark. A quote only opens a quoted
 * cell at the start of the cell, so a stray one mid-cell stays a character.
 */
export function parseCsv(text: string): string[][] {
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let atCellStart = true;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
      continue;
    }
    if (c === '"' && atCellStart) {
      inQuotes = true;
      atCellStart = false;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
      atCellStart = true;
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      atCellStart = true;
    } else {
      cell += c;
      atCellStart = false;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function csvCell(v: string | number | null): string {
  const s = v === null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(header: readonly string[], rows: (string | number | null)[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}

// ─── Reading a report's table ────────────────────────────────────────────────

const norm = (h: string) => h.replace(/﻿/g, "").trim().replace(/\s+/g, " ").toLowerCase();

interface RawTable {
  /** Normalised header → column index. */
  index: Map<string, number>;
  /** Data rows with their line number in the file (1-based), for messages. */
  rows: { n: number; cells: string[] }[];
}

/**
 * Find the header and the rows under it. The hand export leads with three
 * lines (Report Name, Date Run, Filters) and a blank one; the API response
 * may not, so the header is found by its column names rather than a position.
 */
function readTable(report: string, text: string, required: readonly string[]): RawTable {
  const all = parseCsv(text);
  const wanted = required.map(norm);
  let headerAt = -1;
  let best = 0;
  all.forEach((cells, i) => {
    const present = new Set(cells.map(norm));
    const hits = wanted.filter((w) => present.has(w)).length;
    if (hits > best) {
      best = hits;
      headerAt = i;
    }
  });
  if (headerAt < 0 || best < 2) {
    throw new RakutenReportError(`${report}: no header row found (${all.length} lines read). Is the link still valid?`);
  }
  const header = all[headerAt].map(norm);
  const index = new Map<string, number>();
  header.forEach((h, i) => {
    if (!index.has(h)) index.set(h, i);
  });
  const missing = required.filter((r) => !index.has(norm(r)));
  if (missing.length > 0) {
    throw new RakutenReportError(`${report}: missing column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
  }

  const rows: RawTable["rows"] = [];
  for (let i = headerAt + 1; i < all.length; i++) {
    const cells = all[i];
    const first = cells.find((c) => c.trim() !== "");
    if (first === undefined) continue; // blank line
    if (/^(grand\s+)?totals?\b/i.test(first.trim())) continue; // summary row
    if (cells.length !== header.length) {
      // A shifted row would put one column's text under another's name. Never
      // guess: say which row, and nothing of what was in it.
      throw new RakutenReportError(`${report}: row ${i + 1} has ${cells.length} cells, the header has ${header.length}`);
    }
    rows.push({ n: i + 1, cells });
  }
  return { index, rows };
}

function numberCell(report: string, header: string, n: number, raw: string): number {
  let s = raw.trim();
  if (s === "" || s === "-" || /^n\/?a$/i.test(s)) return 0;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[£$€,%\s]/g, "").replace(/^(gbp|usd|eur)/i, "");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) {
    throw new RakutenReportError(`${report}: row ${n}, column "${header}" is not a number`);
  }
  const v = Number(s);
  return negative ? -v : v;
}

type SlashOrder = "mdy" | "dmy";

/**
 * The hand exports write dates as M/D/YY. If a response ever switches to day
 * first, a value like 25/11/26 gives it away; the two orders mixed in one
 * report is an error rather than a guess.
 */
export function detectSlashOrder(values: string[]): SlashOrder {
  let firstOver12 = false;
  let secondOver12 = false;
  for (const v of values) {
    const m = /^(\d{1,2})\/(\d{1,2})\/\d{2,4}/.exec(v.trim());
    if (!m) continue;
    if (Number(m[1]) > 12) firstOver12 = true;
    if (Number(m[2]) > 12) secondOver12 = true;
  }
  if (firstOver12 && secondOver12) throw new RakutenReportError("dates are written both month-first and day-first");
  return firstOver12 ? "dmy" : "mdy";
}

function dateCell(report: string, header: string, n: number, raw: string, order: SlashOrder, required: boolean): string | null {
  const s = raw.trim();
  if (!s) {
    if (required) throw new RakutenReportError(`${report}: row ${n}, column "${header}" is empty`);
    return null;
  }
  let y: number, mo: number, d: number;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s);
  if (m) {
    [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  } else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s.*)?$/.exec(s))) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    [mo, d] = order === "mdy" ? [a, b] : [b, a];
    y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  } else {
    throw new RakutenReportError(`${report}: row ${n}, column "${header}" is not a date`);
  }
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) {
    throw new RakutenReportError(`${report}: row ${n}, column "${header}" is not a date`);
  }
  return t.toISOString().slice(0, 10);
}

/** A clock time kept as written ("14:05:09", "2:05 PM"); anything else is dropped. */
function timeCell(raw: string): string {
  const s = raw.trim();
  return /^[0-9: .apmAPM]{1,15}$/.test(s) ? s : "";
}

// ─── Revenue Report by Day ───────────────────────────────────────────────────

export const REVENUE_REPORT = "Revenue Report by Day";

export const REVENUE_HEADERS = [
  "Transaction Date",
  "# of Impressions",
  "# of Clicks",
  "Click Through Rate (CTR)",
  "# of Orders",
  "Orders/Click",
  "Earnings Per Click (EPC)",
  "Sales",
  "Average Order Value",
  "Baseline Commission",
  "Adjusted Commission",
  "Total Commission",
] as const;

export interface RakutenDay {
  /** ISO date, yyyy-mm-dd. */
  day: string;
  impressions: number;
  clicks: number;
  ctr: number;
  orders: number;
  ordersPerClick: number;
  epc: number;
  sales: number;
  averageOrderValue: number;
  baselineCommission: number;
  adjustedCommission: number;
  totalCommission: number;
}

export function parseRevenueByDay(text: string): RakutenDay[] {
  const t = readTable(REVENUE_REPORT, text, REVENUE_HEADERS);
  const at = (h: (typeof REVENUE_HEADERS)[number]) => t.index.get(norm(h))!;
  const order = detectSlashOrder(t.rows.map((r) => r.cells[at("Transaction Date")]));
  const byDay = new Map<string, RakutenDay>();
  for (const r of t.rows) {
    const num = (h: (typeof REVENUE_HEADERS)[number]) => numberCell(REVENUE_REPORT, h, r.n, r.cells[at(h)]);
    const day = dateCell(REVENUE_REPORT, "Transaction Date", r.n, r.cells[at("Transaction Date")], order, true)!;
    byDay.set(day, {
      day,
      impressions: Math.round(num("# of Impressions")),
      clicks: Math.round(num("# of Clicks")),
      ctr: num("Click Through Rate (CTR)"),
      orders: Math.round(num("# of Orders")),
      ordersPerClick: num("Orders/Click"),
      epc: num("Earnings Per Click (EPC)"),
      sales: num("Sales"),
      averageOrderValue: num("Average Order Value"),
      baselineCommission: num("Baseline Commission"),
      adjustedCommission: num("Adjusted Commission"),
      totalCommission: num("Total Commission"),
    });
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

/** The day report as a plain CSV: no preamble, ISO dates, bare numbers. */
export function revenueToCsv(days: RakutenDay[]): string {
  return toCsv(
    REVENUE_HEADERS,
    days.map((d) => [
      d.day,
      d.impressions,
      d.clicks,
      d.ctr,
      d.orders,
      d.ordersPerClick,
      d.epc,
      d.sales,
      d.averageOrderValue,
      d.baselineCommission,
      d.adjustedCommission,
      d.totalCommission,
    ]),
  );
}

// ─── Lock Status Report ──────────────────────────────────────────────────────

export const LOCK_REPORT = "Lock Status Report";

/** Read when present, only to check nothing else repeats them. Never kept. */
export const LOCK_DROPPED_HEADERS = ["SKU", "Product Name"] as const;

/** Every column that is kept, in the report's own order. */
export const LOCK_HEADERS = [
  "MID",
  "Advertiser Name",
  "Transaction ID",
  "Order ID",
  "Transaction Date",
  "Transaction Time",
  "# of Items",
  "Sales",
  "Total Commission",
  "Process Date",
  "Process Time",
  "Member ID (U1)",
  "Lock Status",
  "Order Auto Lock Date",
  "Order Auto Lock Time",
  "Order Locked Date",
  "Order Locked Time",
  "Last Update Date",
  "Last Update Time",
] as const;

type LockHeader = (typeof LOCK_HEADERS)[number];

export interface RakutenOrder {
  mid: string;
  advertiser: string;
  transactionId: string;
  orderId: string;
  transactionDate: string;
  transactionTime: string;
  items: number;
  sales: number;
  commission: number;
  processDate: string | null;
  processTime: string;
  /** `Member ID (U1)`: the placement tag our /go link sent ("(none)" if empty). */
  placement: string;
  lockStatus: string;
  autoLockDate: string | null;
  autoLockTime: string;
  lockedDate: string | null;
  lockedTime: string;
  lastUpdateDate: string | null;
  lastUpdateTime: string;
}

export function isLocked(lockStatus: string): boolean {
  return lockStatus.trim().toLowerCase() === "locked";
}

const squash = (s: string) => s.replace(/[^a-z0-9]/gi, "").toUpperCase();

/** Our own placement tags look like `valuation-result-wbac`. `u1` is part of a
 *  URL, so anyone can put anything in it: what doesn't look like a tag is
 *  filed as "(other)" rather than stored. */
function placementCell(raw: string): string {
  const s = raw.trim();
  if (!s) return "(none)";
  return /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/.test(s) ? s : "(other)";
}

export function parseLockStatus(text: string): RakutenOrder[] {
  const t = readTable(LOCK_REPORT, text, LOCK_HEADERS);
  const at = (h: LockHeader) => t.index.get(norm(h))!;
  const droppedAt = LOCK_DROPPED_HEADERS.map((h) => t.index.get(norm(h))).filter((i): i is number => i !== undefined);
  const dateHeaders: LockHeader[] = ["Transaction Date", "Process Date", "Order Auto Lock Date", "Order Locked Date", "Last Update Date"];
  const order = detectSlashOrder(t.rows.flatMap((r) => dateHeaders.map((h) => r.cells[at(h)])));

  const orders: RakutenOrder[] = [];
  for (const r of t.rows) {
    // The registration and the car's description, held only for this loop.
    const secrets = droppedAt.map((i) => squash(r.cells[i])).filter((s) => s.length >= 4);
    const repeatsSecret = (v: string) => {
      const sq = squash(v);
      return sq.length > 0 && secrets.some((s) => sq.includes(s));
    };
    const text = (h: LockHeader, max = 80) => {
      const v = r.cells[at(h)].replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
      return repeatsSecret(v) ? "" : v;
    };
    const num = (h: LockHeader) => numberCell(LOCK_REPORT, h, r.n, r.cells[at(h)]);
    const date = (h: LockHeader, required = false) => dateCell(LOCK_REPORT, h, r.n, r.cells[at(h)], order, required);

    const transactionId = r.cells[at("Transaction ID")].trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/.test(transactionId)) {
      throw new RakutenReportError(`${LOCK_REPORT}: row ${r.n}, column "Transaction ID" is empty or not an ID`);
    }
    // Equality, not containment: a short SKU can sit inside a long ID by chance.
    if (secrets.includes(squash(transactionId))) {
      throw new RakutenReportError(`${LOCK_REPORT}: row ${r.n}, the Transaction ID is the SKU; not stored`);
    }
    const lockStatus = r.cells[at("Lock Status")].trim();
    if (!/^[A-Za-z ]{1,30}$/.test(lockStatus)) {
      throw new RakutenReportError(`${LOCK_REPORT}: row ${r.n}, column "Lock Status" is empty or not a status`);
    }
    const placementRaw = r.cells[at("Member ID (U1)")];

    orders.push({
      mid: text("MID", 20),
      advertiser: text("Advertiser Name"),
      transactionId,
      orderId: text("Order ID"),
      transactionDate: date("Transaction Date", true)!,
      transactionTime: timeCell(r.cells[at("Transaction Time")]),
      items: num("# of Items"),
      sales: num("Sales"),
      commission: num("Total Commission"),
      processDate: date("Process Date"),
      processTime: timeCell(r.cells[at("Process Time")]),
      placement: repeatsSecret(placementRaw) ? "(other)" : placementCell(placementRaw),
      lockStatus,
      autoLockDate: date("Order Auto Lock Date"),
      autoLockTime: timeCell(r.cells[at("Order Auto Lock Time")]),
      lockedDate: date("Order Locked Date"),
      lockedTime: timeCell(r.cells[at("Order Locked Time")]),
      lastUpdateDate: date("Last Update Date"),
      lastUpdateTime: timeCell(r.cells[at("Last Update Time")]),
    });
  }
  return orders;
}

/** The lock report as a plain CSV, without `SKU` and `Product Name`. */
export function ordersToCsv(orders: RakutenOrder[]): string {
  return toCsv(
    LOCK_HEADERS,
    orders.map((o) => [
      o.mid,
      o.advertiser,
      o.transactionId,
      o.orderId,
      o.transactionDate,
      o.transactionTime,
      o.items,
      o.sales,
      o.commission,
      o.processDate,
      o.processTime,
      o.placement === "(none)" ? "" : o.placement,
      o.lockStatus,
      o.autoLockDate,
      o.autoLockTime,
      o.lockedDate,
      o.lockedTime,
      o.lastUpdateDate,
      o.lastUpdateTime,
    ]),
  );
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

/**
 * Rakuten builds the report when asked, and is slow about it: the first real
 * fetch (13 Nov 2026) took 97 seconds to answer with a 22-line file. Thirty
 * seconds, the first value here, never got an answer at all.
 */
const FETCH_TIMEOUT_MS = 240_000;

/** How far back a link with a relative range is made to reach. Orders lock
 *  about a month after the sale, so this is four times what is needed. */
export const REPORT_WINDOW_DAYS = 120;

/**
 * The dates a pull asks for. A saved report's link carries the range it was
 * saved with, and neither kind can be left alone:
 *
 * - A relative one (`date_range=this-year`, what the first real links had)
 *   resets: on 1 January, December's orders would drop out of the report
 *   weeks before they lock, and stay "Unlocked" in our table for good. It is
 *   swapped for explicit dates: the last REPORT_WINDOW_DAYS, ending today.
 *   Rakuten accepts `start_date`/`end_date` in its place (checked against the
 *   real reports, 13 Nov 2026). Rows older than the window stay stored.
 * - Fixed `start_date` and `end_date` would stop at the day the link was
 *   made, so the end date is moved to today and the start is kept.
 *
 * A link with neither is used as it is.
 */
export function withReportWindow(rawUrl: string, nowMs: number): string {
  const u = new URL(rawUrl);
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const start = u.searchParams.get("start_date");
  const end = u.searchParams.get("end_date");
  if (u.searchParams.has("date_range")) {
    u.searchParams.delete("date_range");
    u.searchParams.set("start_date", day(nowMs - REPORT_WINDOW_DAYS * 86_400_000));
    u.searchParams.set("end_date", day(nowMs));
    return u.toString();
  }
  if (!(start && end && iso.test(start) && iso.test(end))) return rawUrl;
  u.searchParams.set("end_date", day(nowMs));
  return u.toString();
}

/**
 * Fetch one report's CSV. `label` names the report in errors; the link itself
 * never appears in one, because it holds the token.
 */
export async function fetchReportCsv(
  label: string,
  rawUrl: string,
  nowMs: number,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  let url: string;
  try {
    if (new URL(rawUrl).protocol !== "https:") throw new Error("not https");
    url = withReportWindow(rawUrl, nowMs);
  } catch {
    throw new RakutenReportError(`${label}: the saved link is not a valid https address`);
  }

  let res: Response;
  try {
    res = await fetchImpl(url, { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (err: unknown) {
    // Only the error's type: its message or cause can repeat the address.
    const kind = err instanceof Error ? err.name : "error";
    throw new RakutenReportError(`${label}: could not reach Rakuten (${kind})`);
  }
  if (!res.ok) {
    throw new RakutenReportError(`${label}: Rakuten answered ${res.status}${res.status === 401 || res.status === 403 ? " (the link's token may have expired)" : ""}`);
  }
  let body: string;
  try {
    body = await res.text();
  } catch {
    throw new RakutenReportError(`${label}: the response could not be read`);
  }
  const head = body.replace(/^﻿/, "").trimStart().slice(0, 1);
  if (head === "<" || head === "{" || head === "[") {
    throw new RakutenReportError(`${label}: the response is not a CSV (a sign-in page or an error; the link may have expired)`);
  }
  return body;
}
