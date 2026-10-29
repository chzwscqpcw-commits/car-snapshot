/**
 * Assertions for src/config/insurance.ts — which insurance partner each
 * placement shows: nothing while every partner is pending, RVU first when its
 * links arrive, GoCompare as the car-only fallback, Tempcover before Cuvva.
 */
import { PARTNER_LINKS, isGoContext } from "../src/config/partners";
import { insuranceOffer, tempCoverOffer } from "../src/config/insurance";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

console.log("\nToday (nothing approved):");
check("no car insurance offer", insuranceOffer("car"), null);
check("no van insurance offer", insuranceOffer("van"), null);
check("no bike insurance offer", insuranceOffer("motorbike"), null);
check("no temporary cover offer", tempCoverOffer(), null);

console.log("\nGoCompare approved first:");
PARTNER_LINKS.goCompare.pending = false;
check("car → GoCompare", insuranceOffer("car")?.go, "gocompare");
check("van → nothing (GoCompare is car-only)", insuranceOffer("van"), null);

console.log("\nRVU links pasted in:");
const rvu = PARTNER_LINKS.rvuCarInsurance;
rvu.url = "https://click.linksynergy.com/fs-bin/click?id=X&offerid=1.1&type=3&subid=0";
rvu.buildLink = (_reg, clickref) => `${rvu.url}${clickref ? `&u1=${clickref}` : ""}`;
rvu.pending = false;
check("car → RVU ahead of GoCompare", insuranceOffer("car")?.go, "rvu-car");
check("placement rides as u1", rvu.buildLink?.("", "money-insurance").endsWith("&u1=money-insurance"), true);

console.log("\nTemporary cover:");
PARTNER_LINKS.cuvva.url = "https://www.awin1.com/cread.php?awinmid=1&awinaffid=2729598";
PARTNER_LINKS.cuvva.pending = false;
check("Cuvva when Tempcover isn't live", tempCoverOffer()?.go, "cuvva");
PARTNER_LINKS.tempcover.url = "https://click.linksynergy.com/fs-bin/click?id=X&offerid=2.1&type=3&subid=0";
PARTNER_LINKS.tempcover.pending = false;
check("Tempcover ahead of Cuvva", tempCoverOffer()?.go, "tempcover");

console.log("\nPlacements /go will record:");
for (const ctx of ["money-insurance", "running-costs-insurance", "buyer-check-temp-cover", "car-check-temp-cover", "value-my-car-temp-cover"]) {
  check(ctx, isGoContext(ctx), true);
}

if (failures > 0) {
  console.error(`\n${failures} insurance check(s) failed`);
  process.exit(1);
}
console.log("\nAll insurance checks passed");
