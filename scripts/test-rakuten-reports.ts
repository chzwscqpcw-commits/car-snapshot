/**
 * The Rakuten report pull (src/lib/rakuten-reports.ts, src/lib/partner-orders.ts):
 * both parsers, the rule that the customer's registration and car never leave
 * the parser, what a later pull does to a stored order, the summary the
 * Friday email shows, and the click reconciliation.
 *
 * Every fixture is invented. The `SKU` and `Product Name` cells hold marker
 * words, not registrations or cars, and the amounts are round made-up numbers.
 */
import {
  LOCK_DROPPED_HEADERS,
  LOCK_HEADERS,
  RAKUTEN_ENV,
  REVENUE_HEADERS,
  RakutenReportError,
  detectSlashOrder,
  fetchReportCsv,
  ordersToCsv,
  parseCsv,
  parseLockStatus,
  parseRevenueByDay,
  rakutenConfig,
  revenueToCsv,
  withReportWindow,
  type RakutenOrder,
} from "../src/lib/rakuten-reports";
import {
  RECON,
  getPartnerOrders,
  mergeDuplicateOrders,
  planOrderUpserts,
  pullRakutenReports,
  reconcileClicks,
  reconciliationLine,
  renderPartnerOrdersHtml,
  samplePartnerOrders,
  summarisePartnerOrders,
  toDailyRow,
  type DailyRow,
  type OrderRow,
  type SiteClick,
} from "../src/lib/partner-orders";
import type { SupabaseClient } from "@supabase/supabase-js";

let failures = 0;
function check(label: string, ok: boolean, detail = ""): void {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  — ${detail}`}`);
}
function throwsWith(fn: () => unknown, pattern: RegExp): { ok: boolean; message: string } {
  try {
    fn();
    return { ok: false, message: "(did not throw)" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: err instanceof RakutenReportError && pattern.test(message), message };
  }
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BOM = "﻿";
/** Stand-ins for the two private columns. If either string is ever found in
 *  parsed output, a cleaned CSV or an error message, the privacy rule broke. */
const SKU_MARK = "SKUMARKER";
const PRODUCT_MARK = "PRODUCT MARKER, WITH A COMMA";
const leaks = (s: string) => s.includes(SKU_MARK) || s.includes("PRODUCT MARKER");

const REVENUE_HAND_EXPORT =
  BOM +
  [
    "Report Name,Revenue Report by Day",
    "Date Run,11/13/26",
    'Filters,"Date Range: Custom, Network: All"',
    "",
    REVENUE_HEADERS.join(","),
    '11/1/26,0,12,0.00%,1,8.33%,0.83,"1,234.50","1,234.50",10.00,0.00,10.00',
    "11/2/26,0,9,0.00%,0,0.00%,0.00,0.00,0.00,0.00,0.00,0.00",
    '11/3/26,"2,000","1,015",50.75%,2,0.20%,0.02,300.00,150.00,20.00,-5.00,15.00',
    "",
  ].join("\r\n");

/** The same report as the API might send it: no preamble, ISO dates, the
 *  columns in another order, one we have never seen, and a total line. */
const REVENUE_API_SHAPE = [
  ["# of Clicks", "Transaction Date", "New Column", ...REVENUE_HEADERS.filter((h) => h !== "# of Clicks" && h !== "Transaction Date")].join(","),
  "12,2026-11-01,x,0,0.00%,1,8.33%,0.83,1234.50,1234.50,10.00,0.00,10.00",
  "9,2026-11-02,x,0,0.00%,0,0.00%,0.00,0.00,0.00,0.00,0.00,0.00",
  "Total,,,0,,1,,,1234.50,,10.00,0.00,10.00",
].join("\n");

const LOCK_ALL_HEADERS = [
  "MID",
  "Advertiser Name",
  "Transaction ID",
  "Order ID",
  "Transaction Date",
  "Transaction Time",
  "SKU",
  "# of Items",
  "Sales",
  "Total Commission",
  "Process Date",
  "Process Time",
  "Product Name",
  "Member ID (U1)",
  "Lock Status",
  "Order Auto Lock Date",
  "Order Auto Lock Time",
  "Order Locked Date",
  "Order Locked Time",
  "Last Update Date",
  "Last Update Time",
];

function lockLine(o: {
  tx: string;
  order?: string;
  date?: string;
  sku?: string;
  commission?: string;
  product?: string;
  u1?: string;
  status?: string;
  locked?: string;
}): string {
  const product = o.product ?? PRODUCT_MARK;
  return [
    "50001",
    "Example Advertiser",
    o.tx,
    o.order ?? `ORD-${o.tx}`,
    o.date ?? "11/1/26",
    "14:05:09",
    o.sku ?? SKU_MARK,
    "1",
    '"1,500.00"',
    o.commission ?? "10.00",
    o.date ?? "11/1/26",
    "14:06:00",
    `"${product.replace(/"/g, '""')}"`,
    o.u1 ?? "valuation-result-wbac",
    o.status ?? "Unlocked",
    "12/1/26",
    "00:00:00",
    o.locked ?? "",
    o.locked ? "09:00:00" : "",
    "11/2/26",
    "08:00:00",
  ].join(",");
}

const lockReport = (lines: string[], header = LOCK_ALL_HEADERS) =>
  BOM + ["Report Name,Lock Status Report", "Date Run,11/13/26", 'Filters,"Lock Status in (Unlocked, Locked)"', "", header.join(","), ...lines, ""].join("\r\n");

const LOCK_HAND_EXPORT = lockReport([
  lockLine({ tx: "TX-1001" }),
  lockLine({ tx: "TX-1002", order: `ORD ${SKU_MARK.toLowerCase()} 7`, u1: "money-wbac", status: "Locked", locked: "11/9/26", commission: "0.00" }),
  lockLine({ tx: "TX-1003", u1: "", date: "11/3/26" }),
  lockLine({ tx: "TX-1004", u1: "<b>not a tag</b>", date: "11/4/26" }),
  lockLine({ tx: "TX-1005", u1: SKU_MARK, date: "11/5/26" }),
]);

// ─── CSV reader ──────────────────────────────────────────────────────────────

console.log("\nCSV reader");
{
  const rows = parseCsv(`${BOM}a,"b, with comma","say ""hi"""\r\n1,"two\nlines",3\n4,5" inch,6`);
  check("BOM stripped, quoted comma kept in one cell", rows[0][0] === "a" && rows[0][1] === "b, with comma");
  check("doubled quotes become one", rows[0][2] === 'say "hi"');
  check("line break inside quotes stays in the cell", rows[1][1] === "two\nlines" && rows[1].length === 3);
  check("a stray quote mid-cell is a character, not a quoted cell", rows[2][1] === '5" inch' && rows[2][2] === "6");
  check("three rows", rows.length === 3, String(rows.length));
}

// ─── Revenue Report by Day ───────────────────────────────────────────────────

console.log("\nRevenue Report by Day");
{
  const days = parseRevenueByDay(REVENUE_HAND_EXPORT);
  check("three days read past the preamble", days.length === 3, String(days.length));
  check("M/D/YY becomes an ISO date", days[0].day === "2026-11-01" && days[2].day === "2026-11-03");
  check("clicks and orders", days[0].clicks === 12 && days[0].orders === 1);
  check("quoted thousands commas", days[0].sales === 1234.5 && days[2].clicks === 1015 && days[2].impressions === 2000);
  check("percent sign and negative amount", days[2].ctr === 50.75 && days[2].adjustedCommission === -5);
  check("commission columns", days[2].baselineCommission === 20 && days[2].totalCommission === 15);

  const api = parseRevenueByDay(REVENUE_API_SHAPE);
  check("API shape: columns found by name in any order", api.length === 2 && api[0].clicks === 12 && api[0].day === "2026-11-01");
  check("API shape: the total line is not a day", !api.some((d) => Number.isNaN(Date.parse(d.day))));

  const noOrders = REVENUE_HAND_EXPORT.replace("# of Orders,", "Order Count,");
  const missing = throwsWith(() => parseRevenueByDay(noOrders), /missing column: # of Orders/);
  check("a missing column fails, naming it", missing.ok, missing.message);

  const html = throwsWith(() => parseRevenueByDay("<!doctype html><html><body>Sign in</body></html>"), /no header row found/);
  check("a page that is not the report fails", html.ok, html.message);

  const badNumber = throwsWith(() => parseRevenueByDay(REVENUE_HAND_EXPORT.replace("11/2/26,0,9,", "11/2/26,0,nine,")), /row 7, column "# of Clicks" is not a number/);
  check("a cell that is not a number fails with its row and column", badNumber.ok, badNumber.message);

  const badDate = throwsWith(() => parseRevenueByDay(REVENUE_HAND_EXPORT.replace("11/2/26,", "soon,")), /column "Transaction Date" is not a date/);
  check("a cell that is not a date fails", badDate.ok, badDate.message);

  const roundTrip = parseRevenueByDay(revenueToCsv(days));
  check("the cleaned CSV reads back the same", JSON.stringify(roundTrip) === JSON.stringify(days));
  check("the cleaned CSV starts at the header", revenueToCsv(days).startsWith("Transaction Date,"));
}

console.log("\nDate order");
{
  check("month first by default", detectSlashOrder(["11/1/26", "11/12/26"]) === "mdy");
  check("day first when a first number is over 12", detectSlashOrder(["25/11/26", "1/11/26"]) === "dmy");
  let mixed = false;
  try {
    detectSlashOrder(["25/11/26", "11/25/26"]);
  } catch {
    mixed = true;
  }
  check("both orders in one report is an error", mixed);
  const dayFirst = parseRevenueByDay(REVENUE_HAND_EXPORT.replace("11/1/26,", "1/11/26,").replace("11/2/26,", "2/11/26,").replace("11/3/26,", "25/11/26,"));
  check("a day-first report is read as day first throughout", dayFirst.map((d) => d.day).join() === "2026-11-01,2026-11-02,2026-11-25", dayFirst.map((d) => d.day).join());
}

// ─── Lock Status Report ──────────────────────────────────────────────────────

console.log("\nLock Status Report");
const parsedOrders = parseLockStatus(LOCK_HAND_EXPORT);
{
  const o = parsedOrders[0];
  check("five orders", parsedOrders.length === 5, String(parsedOrders.length));
  check("IDs, date and time", o.transactionId === "TX-1001" && o.orderId === "ORD-TX-1001" && o.transactionDate === "2026-11-01" && o.transactionTime === "14:05:09");
  check("amounts with thousands commas", o.sales === 1500 && o.commission === 10 && o.items === 1);
  check("placement is Member ID (U1)", o.placement === "valuation-result-wbac" && parsedOrders[1].placement === "money-wbac");
  check("lock status and dates", o.lockStatus === "Unlocked" && o.lockedDate === null && parsedOrders[1].lockStatus === "Locked" && parsedOrders[1].lockedDate === "2026-11-09");
  check("auto-lock and last-update dates", o.autoLockDate === "2026-12-01" && o.lastUpdateDate === "2026-11-02");
  check("an empty placement is (none)", parsedOrders[2].placement === "(none)");
  check("a placement that is not one of our tags is (other)", parsedOrders[3].placement === "(other)");

  const missing = throwsWith(() => parseLockStatus(lockReport([lockLine({ tx: "TX-1" })], LOCK_ALL_HEADERS.map((h) => (h === "Lock Status" ? "Status" : h)))), /missing column: Lock Status/);
  check("a missing column fails, naming it", missing.ok, missing.message);

  const noId = throwsWith(() => parseLockStatus(lockReport([lockLine({ tx: "" })])), /column "Transaction ID" is empty or not an ID/);
  check("an order with no Transaction ID fails", noId.ok, noId.message);
}

console.log("\nPrivacy: the registration and the car are never kept");
{
  // The fixture really does carry both markers, so the checks below mean something.
  check("the fixture holds both private columns", LOCK_HAND_EXPORT.includes(SKU_MARK) && LOCK_HAND_EXPORT.includes(PRODUCT_MARK));
  check("neither column is on the keep list", !LOCK_HEADERS.some((h) => (LOCK_DROPPED_HEADERS as readonly string[]).includes(h)));

  const keys = new Set(parsedOrders.flatMap((o) => Object.keys(o)));
  const forbiddenKey = [...keys].find((k) => /sku|product|reg|vrm|plate|vehicle|car/i.test(k));
  check("no parsed row has a field for the SKU or the product", forbiddenKey === undefined, String(forbiddenKey));
  check("no parsed row carries either value", !leaks(JSON.stringify(parsedOrders)));
  check("an Order ID that repeats the SKU is blanked", parsedOrders[1].orderId === "");
  check("a placement that repeats the SKU is not kept", parsedOrders[4].placement === "(other)");

  const cleaned = ordersToCsv(parsedOrders);
  const cleanedHeader = parseCsv(cleaned)[0];
  check("the cleaned CSV has no SKU or Product Name column", !cleanedHeader.includes("SKU") && !cleanedHeader.includes("Product Name") && cleanedHeader.length === LOCK_HEADERS.length);
  check("the cleaned CSV carries neither value", !leaks(cleaned));
  check("the cleaned CSV reads back the same orders", JSON.stringify(parseLockStatus(cleaned)) === JSON.stringify(parsedOrders));

  const stored = planOrderUpserts([], parsedOrders, "2026-11-13T06:15:00.000Z").rows;
  const storedKey = stored.flatMap((r) => Object.keys(r)).find((k) => /sku|product|reg|vrm|plate|vehicle|car/i.test(k));
  check("no stored row has a column for either", storedKey === undefined, String(storedKey));
  check("no stored row carries either value", !leaks(JSON.stringify(stored)));

  // Errors are written for logs. One raised on a row must not quote the row.
  const shifted = LOCK_HAND_EXPORT.replace(`"${PRODUCT_MARK}"`, PRODUCT_MARK); // unquoted: the comma adds a cell
  const shiftErr = throwsWith(() => parseLockStatus(shifted), /row 6 has 22 cells, the header has 21/);
  check("a shifted row is refused, not guessed at", shiftErr.ok, shiftErr.message);
  check("…and the error quotes nothing from the row", !leaks(shiftErr.message));

  const idIsSku = throwsWith(() => parseLockStatus(lockReport([lockLine({ tx: SKU_MARK })])), /the Transaction ID is the SKU; not stored/);
  check("a Transaction ID that is the SKU is refused", idIsSku.ok && !leaks(idIsSku.message), idIsSku.message);

  const badAmount = throwsWith(() => parseLockStatus(lockReport([lockLine({ tx: "TX-9", commission: SKU_MARK })])), /column "Total Commission" is not a number/);
  check("a bad cell's error names the column, not the content", badAmount.ok && !leaks(badAmount.message), badAmount.message);

  // A report without the two columns is fine: there is nothing to drop.
  const without = LOCK_ALL_HEADERS.filter((h) => !(LOCK_DROPPED_HEADERS as readonly string[]).includes(h));
  const line = lockLine({ tx: "TX-2001" }).split(",");
  const slim = lockReport([[...line.slice(0, 6), ...line.slice(7, 12), ...line.slice(14)].join(",")], without);
  check("a report that already lacks both columns still parses", parseLockStatus(slim)[0]?.transactionId === "TX-2001");
}

// ─── Upserts ─────────────────────────────────────────────────────────────────

console.log("\nStoring orders: a later pull overwrites, and the earlier commission is kept");
const order = (tx: string, over: Partial<RakutenOrder> = {}): RakutenOrder => ({
  mid: "50001",
  advertiser: "Example Advertiser",
  transactionId: tx,
  orderId: `ORD-${tx}`,
  transactionDate: "2026-11-01",
  transactionTime: "14:05:09",
  items: 1,
  sales: 1500,
  commission: 10,
  processDate: "2026-11-01",
  processTime: "",
  placement: "valuation-result-wbac",
  lockStatus: "Unlocked",
  autoLockDate: "2026-12-01",
  autoLockTime: "",
  lockedDate: null,
  lockedTime: "",
  lastUpdateDate: "2026-11-02",
  lastUpdateTime: "",
  ...over,
});
const T1 = "2026-11-02T06:15:00.000Z";
const T2 = "2026-11-03T06:15:00.000Z";
const T3 = "2026-11-04T06:15:00.000Z";
{
  const first = planOrderUpserts([], [order("A"), order("B")], T1);
  check("first sight: both added, nothing changed", first.added === 2 && first.commissionChanged === 0 && first.wentToZero === 0);
  check("first sight: no previous commission", first.rows.every((r) => r.previous_commission === null && r.commission_changed_at === null && r.changes.length === 0));
  check("first sight: first_seen_at and updated_at are the pull time", first.rows.every((r) => r.first_seen_at === T1 && r.updated_at === T1));

  const same = planOrderUpserts(first.rows, [order("A"), order("B")], T2);
  check("same again: nothing added or changed", same.added === 0 && same.commissionChanged === 0 && same.statusChanged === 0);
  check("same again: first_seen_at kept, updated_at moved", same.rows.every((r) => r.first_seen_at === T1 && r.updated_at === T2));

  const dropped = planOrderUpserts(same.rows, [order("A", { commission: 0 }), order("B", { lockStatus: "Locked", lockedDate: "2026-11-03" })], T3);
  const a = dropped.rows.find((r) => r.transaction_id === "A")!;
  const b = dropped.rows.find((r) => r.transaction_id === "B")!;
  check("a paying order dropping to zero is counted", dropped.commissionChanged === 1 && dropped.wentToZero === 1);
  check("…the row now says zero and keeps what it was", a.commission === 0 && a.previous_commission === 10 && a.commission_changed_at === T3);
  check("…and the change is logged", a.changes.length === 1 && a.changes[0].at === T3 && a.changes[0].commission?.[0] === 10 && a.changes[0].commission?.[1] === 0);
  check("a status change overwrites and is logged", dropped.statusChanged === 1 && b.lock_status === "Locked" && b.locked_date === "2026-11-03" && b.changes[0].status?.join(">") === "Unlocked>Locked");
  check("…without touching the commission history", b.previous_commission === null && b.commission === 10);

  const later = planOrderUpserts(dropped.rows, [order("A", { commission: 0 })], "2026-11-05T06:15:00.000Z");
  check("an unchanged pull keeps the earlier commission", later.rows[0].previous_commission === 10 && later.rows[0].commission_changed_at === T3 && later.commissionChanged === 0);

  const back = planOrderUpserts(later.rows, [order("A", { commission: 7.5 })], "2026-11-06T06:15:00.000Z");
  check("a second change moves previous on and logs both", back.rows[0].previous_commission === 0 && back.rows[0].commission === 7.5 && back.rows[0].changes.length === 2 && back.wentToZero === 0);

  const rounding = planOrderUpserts(first.rows, [order("A", { commission: 10.0000001 })], T2);
  check("a rounding hair is not a change", rounding.commissionChanged === 0);

  // PostgREST can hand numerics back as strings.
  const asStrings = first.rows.map((r) => ({ ...r, commission: "10.00" as unknown as number }));
  check("a stored amount read back as text still compares", planOrderUpserts(asStrings, [order("A")], T2).commissionChanged === 0);

  const merged = mergeDuplicateOrders([order("D", { commission: 10 }), order("D", { commission: -10, lockStatus: "Locked" }), order("E")]);
  check("two lines for one Transaction ID become one order", merged.length === 2 && merged[0].commission === 0 && merged[0].items === 2 && merged[0].lockStatus === "Locked");
  check("…so the upsert never writes an ID twice", new Set(planOrderUpserts([], [order("D"), order("D")], T1).rows.map((r) => r.transaction_id)).size === 1);
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log("\nSummary: week and since launch, paying and at zero, provisional and locked, by placement");
const NOW = Date.parse("2026-11-13T16:00:00Z"); // a Friday, when the email goes
const PULLED = "2026-11-13T06:15:00.000Z";
const storedOrder = (tx: string, date: string, over: Partial<OrderRow> = {}): OrderRow => ({
  ...planOrderUpserts([], [order(tx, { transactionDate: date })], PULLED).rows[0],
  ...over,
});
const dailyRow = (day: string, clicks: number, updated = PULLED): DailyRow => ({
  ...toDailyRow({ day, impressions: 0, clicks, ctr: 0, orders: 0, ordersPerClick: 0, epc: 0, sales: 0, averageOrderValue: 0, baselineCommission: 0, adjustedCommission: 0, totalCommission: 0 }, updated),
});
const siteClicksOn = (day: string, n: number, context = "valuation-result-wbac"): SiteClick[] =>
  Array.from({ length: n }, () => ({ created_at: `${day}T10:00:00.000Z`, context }));
{
  const orders: OrderRow[] = [
    storedOrder("S1", "2026-10-30", { lock_status: "Locked", commission: 10 }),
    storedOrder("S2", "2026-11-02", { lock_status: "Locked", commission: 0, placement: "money-wbac" }),
    storedOrder("S3", "2026-11-08", { commission: 10 }),
    storedOrder("S4", "2026-11-10", { commission: 0, previous_commission: 10, commission_changed_at: "2026-11-12T06:15:00.000Z" }),
    storedOrder("S5", "2026-11-12", { commission: 7.5, placement: "money-wbac" }),
    storedOrder("S6", "2026-10-29", { commission: 0, previous_commission: 10, commission_changed_at: "2026-11-01T06:15:00.000Z" }),
  ];
  const daily = [dailyRow("2026-10-29", 20), dailyRow("2026-11-06", 9), dailyRow("2026-11-07", 11), dailyRow("2026-11-12", 14), dailyRow("2026-11-13", 3)];
  const site = [...siteClicksOn("2026-11-12", 10), ...siteClicksOn("2026-11-12", 4, "money-wbac"), ...siteClicksOn("2026-11-06", 9)];
  const s = summarisePartnerOrders({ daily, orders, siteClicks: site, nowMs: NOW });

  check("state ok, not stale, pulled time is the newest row's", s.state === "ok" && !s.stale && s.lastPulledAt === PULLED);
  check("coverage is the day report's first and last day", s.coverage?.from === "2026-10-29" && s.coverage?.to === "2026-11-13");
  check("week = the last seven calendar days (7–13 Nov)", s.week.orders === 3 && s.week.clicks === 11 + 14 + 3, `${s.week.orders} orders, ${s.week.clicks} clicks`);
  check("week: paying vs at zero", s.week.paying === 2 && s.week.atZero === 1);
  check("week: all unlocked, so all provisional", s.week.provisional === 17.5 && s.week.lockedCount === 0 && s.week.lockedCommission === 0);
  check("since launch: every order and every click", s.sinceLaunch.orders === 6 && s.sinceLaunch.clicks === 57);
  check("since launch: paying vs at zero", s.sinceLaunch.paying === 3 && s.sinceLaunch.atZero === 3);
  check("since launch: locked count and amount apart from provisional", s.sinceLaunch.lockedCount === 2 && s.sinceLaunch.lockedCommission === 10 && s.sinceLaunch.provisional === 17.5 && s.sinceLaunch.commission === 27.5);

  const val = s.placements.find((p) => p.placement === "valuation-result-wbac")!;
  const mon = s.placements.find((p) => p.placement === "money-wbac")!;
  check("placement split: orders since launch", val.sinceLaunch.orders === 4 && mon.sinceLaunch.orders === 2);
  check("placement split: orders and our clicks this week", val.week.orders === 2 && mon.week.orders === 1 && val.siteClicksWeek === 10 && mon.siteClicksWeek === 4);
  check("placement split: paying vs zero", val.sinceLaunch.paying === 2 && val.sinceLaunch.atZero === 2 && mon.sinceLaunch.paying === 1 && mon.sinceLaunch.atZero === 1);

  check("went to zero: both listed, newest change first", s.wentToZero.length === 2 && s.wentToZero[0].transactionId === "S4" && s.wentToZero[0].previousCommission === 10);
  check("went to zero this week: only the recent one", s.wentToZeroThisWeek === 1);
  check("an order that arrived at zero is not 'went to zero'", !s.wentToZero.some((z) => z.transactionId === "S2"));

  const html = renderPartnerOrdersHtml(s);
  check("email block: heading and both rows", html.includes("Partner orders") && html.includes("This week") && html.includes("Since launch"));
  check("email block: the drop to zero is called out", html.includes("1 order that was paying dropped to zero this week") && html.includes("S4"));
  check("email block: placements listed", html.includes("valuation-result-wbac") && html.includes("money-wbac"));

  const stale = summarisePartnerOrders({ daily, orders, siteClicks: site, nowMs: NOW + 3 * 864e5 });
  check("three days without a pull is stale, and the email says so", stale.stale && renderPartnerOrdersHtml(stale).includes("last successful pull"));
}

// ─── Reconciliation ──────────────────────────────────────────────────────────

console.log("\nClicks: Rakuten against ours");
{
  const daily = [
    dailyRow("2026-11-05", 10),
    dailyRow("2026-11-06", 12),
    dailyRow("2026-11-07", 30),
    dailyRow("2026-11-08", 100),
    dailyRow("2026-11-09", 100),
    // no line for the 10th: a day with no clicks is left out of the report
    dailyRow("2026-11-11", 8),
    dailyRow("2026-11-12", 14, "2026-11-12T06:15:00.000Z"), // only pulled part-way through that day
    dailyRow("2026-11-13", 3),
  ];
  const site = [
    ...siteClicksOn("2026-11-01", 6),
    ...siteClicksOn("2026-11-05", 10),
    ...siteClicksOn("2026-11-06", 15), // 3 out: within tolerance
    ...siteClicksOn("2026-11-07", 22), // 8 out: flagged
    ...siteClicksOn("2026-11-08", 91), // 9 out of 100: within a tenth
    ...siteClicksOn("2026-11-09", 88), // 12 out of 100: flagged
    ...siteClicksOn("2026-11-10", 5), // the report says none, we say 5: flagged
    ...siteClicksOn("2026-11-11", 8),
    ...siteClicksOn("2026-11-12", 30),
    ...siteClicksOn("2026-11-13", 9),
  ];
  const days = reconcileClicks(daily, site, NOW);
  const at = (day: string) => days.find((d) => d.day === day)!;
  check(`${RECON.DAYS} days, oldest first, ending today`, days.length === RECON.DAYS && days[0].day === "2026-10-31" && days[days.length - 1].day === "2026-11-13");
  check("a day before the report starts is not judged", at("2026-11-01").state === "no_report" && at("2026-11-01").rakuten === null && at("2026-11-01").site === 6);
  check("equal counts match", at("2026-11-05").state === "match");
  check("three clicks apart still matches", at("2026-11-06").state === "match");
  check("eight apart on a quiet day is flagged", at("2026-11-07").state === "flag" && at("2026-11-07").rakuten === 30 && at("2026-11-07").site === 22);
  check("nine apart on a 100-click day is within a tenth", at("2026-11-08").state === "match");
  check("twelve apart on a 100-click day is flagged", at("2026-11-09").state === "flag");
  check("a day the report leaves out counts as zero", at("2026-11-10").rakuten === 0 && at("2026-11-10").state === "flag");
  check("a day last pulled before it ended is not judged", at("2026-11-12").state === "incomplete");
  check("today is never judged", at("2026-11-13").state === "incomplete");

  const s = summarisePartnerOrders({ daily, orders: [], siteClicks: site, nowMs: NOW });
  check("the summary counts the flagged days", s.flaggedDays === 3, String(s.flaggedDays));
  const line = reconciliationLine(s);
  check("the line names each flagged day with both counts", line.includes("7 Nov: Rakuten 30, ours 22") && line.includes("10 Nov: Rakuten 0, ours 5"), line);
  const clean = summarisePartnerOrders({ daily: [dailyRow("2026-11-11", 8)], orders: [], siteClicks: siteClicksOn("2026-11-11", 8), nowMs: NOW });
  check("with nothing out, the line says so", /every one within/.test(reconciliationLine(clean)), reconciliationLine(clean));
  check("with no day report, nothing is judged", reconcileClicks([], site, NOW).every((d) => d.state === "no_report"));
}

// ─── Not connected, and the other quiet states ───────────────────────────────

console.log("\nNot connected: quiet everywhere");
type Table = { rows: object[]; error?: { message: string; code: string } };
/** The few supabase-js calls partner-orders.ts makes, over in-memory tables. */
function fakeStore(tables: Record<string, Table>, writes: { table: string; rows: object[] }[] = []): SupabaseClient {
  const query = (name: string) => {
    const t = tables[name] ?? { rows: [], error: { message: `Could not find the table 'public.${name}'`, code: "PGRST205" } };
    const result = { data: t.error ? null : t.rows, error: t.error ?? null };
    const q: Record<string, unknown> = {};
    for (const m of ["select", "order", "eq", "gte", "or"]) q[m] = () => q;
    q.range = async () => result;
    q.upsert = async (rows: object[]) => {
      if (t.error) return { error: t.error };
      writes.push({ table: name, rows });
      return { error: null };
    };
    return q;
  };
  return { from: query } as unknown as SupabaseClient;
}
const CONNECTED = { revenueUrl: "https://reports.example/revenue?token=TOKENMARKER", lockUrl: "https://reports.example/lock?token=TOKENMARKER", missing: [] };
const UNSET = rakutenConfig({});

async function asyncChecks(): Promise<void> {
  check("no variables: both named as missing", UNSET.missing.join() === `${RAKUTEN_ENV.revenue},${RAKUTEN_ENV.lock}` && UNSET.revenueUrl === null);
  check("one variable is not enough", rakutenConfig({ [RAKUTEN_ENV.revenue]: "https://reports.example/a" }).missing.join() === RAKUTEN_ENV.lock);
  check("blank counts as unset", rakutenConfig({ [RAKUTEN_ENV.revenue]: "  ", [RAKUTEN_ENV.lock]: "" }).missing.length === 2);

  const events = fakeStore({ site_events: { rows: [] } });
  const notConnected = await getPartnerOrders(events, NOW, { store: null, config: UNSET });
  check("no links, no key: not_connected", notConnected.state === "not_connected" && notConnected.week.orders === 0);
  check("no links, tables missing: still just not_connected", (await getPartnerOrders(events, NOW, { store: fakeStore({}), config: UNSET })).state === "not_connected");
  check("links set, no service key: no_store", (await getPartnerOrders(events, NOW, { store: null, config: CONNECTED })).state === "no_store");
  check("links set, migration not run: no_table", (await getPartnerOrders(events, NOW, { store: fakeStore({}), config: CONNECTED })).state === "no_table");
  check(
    "links set, tables empty: empty",
    (await getPartnerOrders(events, NOW, { store: fakeStore({ rakuten_daily: { rows: [] }, rakuten_orders: { rows: [] } }), config: CONNECTED })).state === "empty",
  );
  const broken = await getPartnerOrders(events, NOW, { store: fakeStore({ rakuten_daily: { rows: [], error: { message: "timeout", code: "57014" } }, rakuten_orders: { rows: [] } }), config: CONNECTED });
  check("a read error is a state, not a throw", broken.state === "error" && broken.note.includes("timeout"));

  const html = renderPartnerOrdersHtml(notConnected);
  check("email block when not connected: one plain line, no table, no red", html.includes("Not connected") && !html.includes("<table") && !html.includes("#b91c1c"));

  const withRows = await getPartnerOrders(
    fakeStore({ site_events: { rows: [{ created_at: "2026-11-12T10:00:00Z", metadata: { click_context: "money-wbac" } }] } }),
    NOW,
    { store: fakeStore({ rakuten_daily: { rows: [dailyRow("2026-11-12", 1)] }, rakuten_orders: { rows: [storedOrder("R1", "2026-11-12")] } }), config: UNSET },
  );
  check("stored rows are shown even where the links are not set", withRows.state === "ok" && withRows.week.orders === 1 && withRows.placements.some((p) => p.placement === "money-wbac" && p.siteClicksWeek === 1));

  const sample = samplePartnerOrders(NOW);
  check("the sample is marked as one and has something of everything", sample.sample && sample.state === "ok" && sample.wentToZeroThisWeek === 1 && sample.flaggedDays >= 1 && sample.placements.length === 2);

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  console.log("\nFetching: the link is never repeated");
  const seen: string[] = [];
  const respond = (body: string, status = 200): typeof fetch =>
    (async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return new Response(body, { status });
    }) as typeof fetch;
  const failWith = async (label: string, url: string, impl: typeof fetch): Promise<string> => {
    try {
      await fetchReportCsv(label, url, NOW, impl);
      return "(did not throw)";
    } catch (err) {
      return err instanceof RakutenReportError ? err.message : `(wrong error type) ${String(err)}`;
    }
  };
  const SECRET_URL = "https://reports.example/en/reports/some-report/filters?start_date=2026-10-28&end_date=2026-11-01&tz=GMT&token=TOKENMARKER";
  const silent = (m: string) => !m.includes("TOKENMARKER") && !m.includes("reports.example");

  // (Response.text() drops the byte-order mark, so compare what it parses to.)
  check("a CSV comes back and parses", parseRevenueByDay(await fetchReportCsv("Report", SECRET_URL, NOW, respond(REVENUE_HAND_EXPORT))).length === 3);
  check("a fixed end date is moved to today, the start left alone", seen[0].includes("end_date=2026-11-13") && seen[0].includes("start_date=2026-10-28") && seen[0].includes("token=TOKENMARKER"), seen[0].replace("TOKENMARKER", "…"));
  const windowed = new URL(withReportWindow("https://reports.example/r?date_range=this-year&tz=GMT&token=x", NOW));
  check(
    "a relative range becomes explicit dates: the last 120 days, ending today",
    !windowed.searchParams.has("date_range") && windowed.searchParams.get("start_date") === "2026-07-16" && windowed.searchParams.get("end_date") === "2026-11-13",
    `${windowed.searchParams.get("start_date")} → ${windowed.searchParams.get("end_date")}`,
  );
  check("…and the rest of the link is kept", windowed.searchParams.get("tz") === "GMT" && windowed.searchParams.get("token") === "x");
  check("a link with no dates at all is left as it is", withReportWindow("https://reports.example/r?token=x", NOW) === "https://reports.example/r?token=x");

  const denied = await failWith("Lock Status Report", SECRET_URL, respond("Forbidden: token=TOKENMARKER", 403));
  check("a 403 says the token may have expired", /Lock Status Report: Rakuten answered 403 \(the link's token may have expired\)/.test(denied), denied);
  check("…without the link or the response body", silent(denied));
  const signIn = await failWith("Report", SECRET_URL, respond("<!doctype html><title>Sign in</title>"));
  check("a sign-in page is not a CSV", /not a CSV/.test(signIn) && silent(signIn), signIn);
  const offline = await failWith("Report", SECRET_URL, (async () => {
    throw new TypeError(`fetch failed for ${SECRET_URL}`);
  }) as typeof fetch);
  check("a network error gives the error's type only", offline === "Report: could not reach Rakuten (TypeError)", offline);
  const notHttps = await failWith("Report", SECRET_URL.replace("https:", "http:"), respond("x"));
  check("a link that is not https is refused before any request", /not a valid https address/.test(notHttps) && silent(notHttps), notHttps);
  const garbage = await failWith("Report", "TOKENMARKER not a url", respond("x"));
  check("a value that is not a link is refused without echoing it", /not a valid https address/.test(garbage) && silent(garbage), garbage);

  // ─── The pull, end to end over the fake store ──────────────────────────────

  console.log("\nThe daily pull");
  const writes: { table: string; rows: object[] }[] = [];
  const tables: Record<string, Table> = { rakuten_daily: { rows: [] }, rakuten_orders: { rows: [] } };
  const serve: typeof fetch = (async (input: RequestInfo | URL) =>
    new Response(String(input).includes("/revenue") ? REVENUE_HAND_EXPORT : LOCK_HAND_EXPORT, { status: 200 })) as typeof fetch;

  const dry = await pullRakutenReports(fakeStore(tables, writes), CONNECTED, NOW, { dry: true, fetchImpl: serve });
  check("dry run: both read, nothing written", dry.every((r) => r.ok) && writes.length === 0 && dry.find((r) => r.report === "lock")?.rows === 5);

  const real = await pullRakutenReports(fakeStore(tables, writes), CONNECTED, NOW, { fetchImpl: serve });
  const lockWrite = writes.find((w) => w.table === "rakuten_orders");
  check("real run: three days and five orders written", real.every((r) => r.ok) && writes.find((w) => w.table === "rakuten_daily")?.rows.length === 3 && lockWrite?.rows.length === 5);
  check("what is written carries no SKU or product", !leaks(JSON.stringify(writes)));
  check("what the pull returns carries no SKU, product or link", !leaks(JSON.stringify(real)) && silent(JSON.stringify(real)));

  // The next day one order drops to zero.
  tables.rakuten_orders.rows = lockWrite!.rows;
  const next: typeof fetch = (async (input: RequestInfo | URL) =>
    new Response(String(input).includes("/revenue") ? REVENUE_HAND_EXPORT : lockReport([lockLine({ tx: "TX-1001", commission: "0.00" })]), { status: 200 })) as typeof fetch;
  const second = (await pullRakutenReports(fakeStore(tables, writes), CONNECTED, NOW + 864e5, { fetchImpl: next })).find((r) => r.report === "lock")!;
  check("next pull: the drop to zero is reported", second.added === 0 && second.commissionChanged === 1 && second.wentToZero === 1);
  const rewritten = writes[writes.length - 1].rows[0] as OrderRow;
  check("…and stored with the earlier commission", rewritten.commission === 0 && rewritten.previous_commission === 10);

  const oneDown: typeof fetch = (async (input: RequestInfo | URL) =>
    String(input).includes("/revenue") ? new Response("nope", { status: 500 }) : new Response(LOCK_HAND_EXPORT, { status: 200 })) as typeof fetch;
  const partial = await pullRakutenReports(fakeStore(tables, []), CONNECTED, NOW, { fetchImpl: oneDown });
  check("one report failing does not stop the other", partial.find((r) => r.report === "revenue")?.ok === false && partial.find((r) => r.report === "lock")?.ok === true);
  check("the failure's message is safe to log", silent(JSON.stringify(partial)));

  const noTables = await pullRakutenReports(fakeStore({}), CONNECTED, NOW, { fetchImpl: serve });
  check("before the migration: each report says the table is missing", noTables.every((r) => !r.ok && r.tableMissing === true));
}

asyncChecks()
  .catch((err) => {
    failures++;
    console.error("  ✗ unexpected error:", err instanceof Error ? err.message : err);
  })
  .finally(() => {
    console.log(failures === 0 ? "\nAll Rakuten report checks passed.\n" : `\n${failures} check${failures === 1 ? "" : "s"} failed.\n`);
    process.exit(failures === 0 ? 0 : 1);
  });
