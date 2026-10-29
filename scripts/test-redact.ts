/**
 * Assertions for src/lib/redact.ts — what keeps plates and emails out of
 * logs, Google Analytics and stored analytics rows.
 */
import { maskPlate, maskEmail, plateInPath, stripPlateFromUrl, withoutPlate } from "../src/lib/redact";

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
check("plate typed into a path removed", stripPlateFromUrl("/reg/AB12CDE"), "/reg/:plate");
check("plate path in a full URL removed", stripPlateFromUrl("https://www.freeplatecheck.co.uk/car/ab12%20cde/mot?x=1"), "https://www.freeplatecheck.co.uk/car/:plate/mot?x=1");
check("model page untouched", stripPlateFromUrl("/cars/volvo/s90"), "/cars/volvo/s90");

console.log("\nPlates typed into a 404 path:");
check("current format", plateInPath("/reg/KY19KVK"), "KY19KVK");
check("lower case with a space", plateInPath("/check/ky19%20kvk"), "KY19KVK");
check("prefix format", plateInPath("/vehicle/A123BCD"), "A123BCD");
check("suffix format", plateInPath("/ABC123D"), "ABC123D");
check("model name isn't a plate", plateInPath("/cars/bmw/x5"), null);
check("blog slug isn't a plate", plateInPath("/blog/best-cars-2026"), null);

console.log("\nAnalytics payloads:");
const p = withoutPlate({ vrm: "AB12CDE", flow: "hero" });
check("plate dropped for Google", "vrm" in p, false);
check("rest kept", (p as { flow?: string }).flow, "hero");

if (failures > 0) {
  console.error(`\n${failures} redact check(s) failed`);
  process.exit(1);
}
console.log("\nAll redact checks passed");
