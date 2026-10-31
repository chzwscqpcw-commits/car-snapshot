/**
 * Checks on the postcode-area MOT statistics behind /mot-prices/[town]
 * (src/lib/mot-areas.ts over src/data/mot-areas.json): every town resolves
 * to real data, the combined figures are internally consistent, and the
 * numbers that go into prose are shaped the way the page expects.
 *
 *   npx tsx scripts/test-mot-areas.ts
 */
import { areaStats, nationalStats, roundTests, areaLabel, MOT_AREAS_YEAR } from "../src/lib/mot-areas";
import { MOT_TOWNS } from "../src/data/mot-locations";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok || detail === undefined ? "" : ` — ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

console.log(`MOT areas (${MOT_AREAS_YEAR})`);
const uk = nationalStats();
check("national tests look like a full year", uk.tests > 25_000_000 && uk.tests < 45_000_000, uk.tests);
check("national first-time pass rate is plausible", uk.passRate > 65 && uk.passRate < 80, uk.passRate);
check("national busiest month is a plate-change neighbour", [2, 8, 9].includes(uk.busiestMonth.index), uk.busiestMonth);

console.log("towns");
const missing = MOT_TOWNS.filter((t) => areaStats(t.postcodeAreas) === null).map((t) => t.slug);
check("every town resolves to area data", missing.length === 0, missing);

const b = areaStats(["B"]);
check("Birmingham is a single area", b?.areas.join() === "B", b?.areas);
check("Birmingham has a big year of tests", (b?.tests ?? 0) > 500_000, b?.tests);
check("pass rate vs UK is the difference of the two", b != null && Math.abs(b.passRate - uk.passRate - b.passRateVsUk) < 0.11, b && [b.passRate, uk.passRate, b.passRateVsUk]);
check("three failure areas with shares under 100", b != null && b.topFailures.length === 3 && b.topFailures.every((f) => f.share > 0 && f.share < 100), b?.topFailures);
check("three makes, title-cased", b != null && b.topMakes.length === 3 && b.topMakes.every((m) => /^[A-Z]/.test(m.name) && !/^[A-Z]{3,}$/.test(m.name.replace("BMW", ""))), b?.topMakes);
check("fuel shares add up to less than 100", b != null && b.evShare + b.hybridShare + b.dieselShare < 100, b && [b.evShare, b.hybridShare, b.dieselShare]);
check("medians are rounded for prose", b != null && b.mileageMedian % 100 === 0 && Number.isFinite(b.ageMedian), b && [b.mileageMedian, b.ageMedian]);

const london = areaStats(["E", "EC", "N", "NW", "SE", "SW", "W", "WC"]);
check("London drops the areas the data lacks and keeps the rest", london != null && london.areas.length >= 5 && !london.areas.includes("XX"), london?.areas);
check("London combines more tests than any one of its areas", london != null && london.tests > (areaStats(["SW"])?.tests ?? 0) * 2, london?.tests);
check("unknown area is null, not zeros", areaStats(["ZZ"]) === null);

console.log("formatting");
check("roundTests: millions", roundTests(1_023_021) === "1.02 million", roundTests(1_023_021));
check("roundTests: hundreds of thousands", roundTests(363_607) === "364,000", roundTests(363_607));
check("roundTests: tens of thousands", roundTests(52_345) === "52,300", roundTests(52_345));
check("areaLabel: one", areaLabel(["B"]) === "the B postcode area");
check("areaLabel: several", areaLabel(["E", "N", "SW"]) === "the E, N and SW postcode areas", areaLabel(["E", "N", "SW"]));

if (failed) {
  console.error(`\n${failed} MOT-area check(s) failed`);
  process.exit(1);
}
console.log("\nAll MOT-area checks passed");
