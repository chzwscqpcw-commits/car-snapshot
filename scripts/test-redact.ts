/**
 * Assertions for src/lib/redact.ts — what keeps plates and emails out of
 * logs, Google Analytics and stored analytics rows.
 */
import { maskPlate, maskEmail, stripPlateFromUrl, withoutPlate } from "../src/lib/redact";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

console.log("\nMasking:");
check("plate", maskPlate("ab12 cde"), "AB***");
check("missing plate", maskPlate(undefined), "(none)");
check("email", maskEmail("jane.doe@example.com"), "j***@example.com");
check("not an email", maskEmail("nope"), "(none)");

console.log("\nURLs:");
check("query plate removed, other params kept",
  stripPlateFromUrl("https://www.freeplatecheck.co.uk/mot-check?vrm=AB12CDE&utm_source=x"),
  "https://www.freeplatecheck.co.uk/mot-check?utm_source=x");
check("legacy reg param removed", stripPlateFromUrl("https://www.freeplatecheck.co.uk/?reg=AB12CDE"), "https://www.freeplatecheck.co.uk/");
check("fragment plate removed", stripPlateFromUrl("https://www.freeplatecheck.co.uk/mot-check#vrm=AB12CDE"), "https://www.freeplatecheck.co.uk/mot-check");
check("relative path stays relative", stripPlateFromUrl("/mileage-check?vrm=AB12CDE"), "/mileage-check");
check("unrelated fragment kept", stripPlateFromUrl("/blog/x#the-test-drive"), "/blog/x#the-test-drive");
check("empty referrer untouched", stripPlateFromUrl(""), "");

console.log("\nAnalytics payloads:");
const p = withoutPlate({ vrm: "AB12CDE", flow: "hero" });
check("plate dropped for Google", "vrm" in p, false);
check("rest kept", (p as { flow?: string }).flow, "hero");

if (failures > 0) {
  console.error(`\n${failures} redact check(s) failed`);
  process.exit(1);
}
console.log("\nAll redact checks passed");
