/**
 * The rules a saved car ("My Cars" with alerts) is validated by, on both the
 * card and /api/saved-cars — src/lib/saved-cars.ts.
 */
import {
  alertsDescription,
  cleanEmail,
  cleanIntent,
  cleanIsoDate,
  cleanSurface,
  cleanVrm,
  isTestEmail,
  makeModelLabel,
} from "../src/lib/saved-cars";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
}

console.log("\nPlates:");
check("spaces and case", cleanVrm("ab12 cde"), "AB12CDE");
check("too short", cleanVrm("A"), null);
check("too long", cleanVrm("ABCD1234"), null);
check("not a string", cleanVrm(12), null);

console.log("\nEmail:");
check("trimmed and lowercased", cleanEmail("  Jane@Example.COM "), "jane@example.com");
check("no domain", cleanEmail("jane@"), null);
check("example.com is a test address", isTestEmail("jane@example.com"), true);
check("verify-test prefix is a test address", isTestEmail("verify-test+1@gmail.com"), true);
check("real address is not", isTestEmail("jane@gmail.com"), false);

console.log("\nIntent and surface:");
check("selling", cleanIntent("selling"), "selling");
check("thinking", cleanIntent("thinking"), "thinking");
check("keeping", cleanIntent("keeping"), "keeping");
check("anything else is null", cleanIntent("SELLING"), null);
check("results surface", cleanSurface("results"), "results");
check("unknown surface is null", cleanSurface("footer"), null);

console.log("\nDates:");
check("ISO date kept", cleanIsoDate("2027-03-14"), "2027-03-14");
check("timestamp rejected", cleanIsoDate("2027-03-14T00:00:00Z"), null);
check("impossible date rejected", cleanIsoDate("2027-13-45"), null);
check("empty is null", cleanIsoDate(""), null);
check("undefined is null", cleanIsoDate(undefined), null);

console.log("\nCopy:");
check("make + model", makeModelLabel("FORD", "FOCUS"), "FORD FOCUS");
check("make only", makeModelLabel("TESLA", undefined), "TESLA");
check("nothing known", makeModelLabel(null, "  "), "");
check("keeping gets no value check", alertsDescription("keeping").includes("worth"), false);
check("no intent gets no value check", alertsDescription(null).includes("worth"), false);
check("selling gets the value check", alertsDescription("selling").includes("worth"), true);
check("thinking gets the value check", alertsDescription("thinking").includes("worth"), true);

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll saved-car checks passed");
