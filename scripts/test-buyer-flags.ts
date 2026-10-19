/**
 * Assertions for the buyer check's red-flag scan (src/lib/buyer-flags.ts).
 * Fixed "now" so the date rules (MOT expiry window, recent V5C) are exercised
 * at their boundaries rather than on whatever day CI happens to run.
 */
import { buildBuyerFlags, recurringAdvisories, type BuyerFlagInput } from "../src/lib/buyer-flags";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

const NOW = new Date(2026, 9, 19); // 19 Oct 2026

const CLEAN: BuyerFlagInput = {
  motStatus: "Valid",
  motExpiryDate: "2027-06-01",
  taxStatus: "Taxed",
  yearOfManufacture: 2017,
  dateOfLastV5CIssued: "2021-03-02",
  motTests: [
    { completedDate: "2026-05-30", testResult: "PASSED" },
    { completedDate: "2025-05-28", testResult: "PASSED" },
  ],
  clockingFlags: [],
  recallCount: 0,
  theftRiskCategory: "low",
  ulezStatus: "compliant",
};
const ids = (input: Partial<BuyerFlagInput>) =>
  buildBuyerFlags({ ...CLEAN, ...input }, NOW).map((f) => f.id);
const has = (input: Partial<BuyerFlagInput>, id: string) => ids(input).includes(id);

console.log("\nClean car:");
check("no flags", ids({}).length, 0);

console.log("\nMileage:");
check("rollback is a stop",
  buildBuyerFlags({ ...CLEAN, clockingFlags: [{ kind: "rollback", message: "x" }] }, NOW)[0].severity, "stop");
check("jump is flagged", has({ clockingFlags: [{ kind: "implausible_jump", message: "x" }] }, "mileage-jump"), true);

console.log("\nMOT:");
check("expired MOT on a 9-year-old car", has({ motStatus: "Not valid" }, "mot-expired"), true);
check("new car with no MOT is fine", has({ motStatus: "No details held by DVLA", yearOfManufacture: 2025 }, "mot-expired"), false);
check("expiry in 60 days flags", has({ motExpiryDate: "2026-12-18" }, "mot-soon"), true);
check("expiry in 61 days doesn't", has({ motExpiryDate: "2026-12-19" }, "mot-soon"), false);
check("last test failed, no retest", has({
  motTests: [{ completedDate: "2026-05-30", testResult: "FAILED" }],
}, "last-mot-failed"), true);
check("fail then same-day pass is fine", has({
  motTests: [
    { completedDate: "2026-05-30T09:00:00", testResult: "FAILED" },
    { completedDate: "2026-05-30T15:00:00", testResult: "PASSED" },
  ],
}, "last-mot-failed"), false);

console.log("\nDVLA record:");
check("V5C 20 days ago", has({ dateOfLastV5CIssued: "2026-09-29" }, "recent-v5c"), true);
check("V5C 120 days ago", has({ dateOfLastV5CIssued: "2026-06-21" }, "recent-v5c"), false);
check("marked for export is a stop", has({ markedForExport: true }, "export"), true);
check("SORN", has({ taxStatus: "SORN" }, "sorn"), true);

console.log("\nModel-level:");
check("recalls", has({ recallCount: 2 }, "recalls"), true);
check("high theft model", has({ theftRiskCategory: "very-high" }, "theft-risk"), true);
check("non-ULEZ", has({ ulezStatus: "non-compliant" }, "ulez"), true);

console.log("\nRecurring advisories:");
const adv = (text: string) => ({ text, type: "ADVISORY" });
const rec = recurringAdvisories([
  { completedDate: "2026-05-30", testResult: "PASSED", rfrAndComments: [adv("Tyre worn close to legal limit"), adv("Tyre worn close to legal limit")] },
  { completedDate: "2025-05-30", testResult: "PASSED", rfrAndComments: [adv("tyre worn  close to legal limit"), adv("Oil leak")] },
]);
check("one recurring advisory", rec.length, 1);
check("counted once per test", rec[0]?.count, 2);

console.log("\nOrdering:");
const order = buildBuyerFlags({ ...CLEAN, ulezStatus: "non-compliant", recallCount: 1, markedForExport: true }, NOW)
  .map((f) => f.severity).join(",");
check("stop, ask, note", order, "stop,ask,note");

if (failures > 0) {
  console.error(`\n${failures} buyer-flag check(s) failed`);
  process.exit(1);
}
console.log("\nAll buyer-flag checks passed");
