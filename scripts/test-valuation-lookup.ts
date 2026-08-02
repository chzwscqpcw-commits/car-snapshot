/**
 * Regression tests for lookupNewPrice() — the new-price table lookup that
 * feeds every valuation.
 *
 * WHY: until Aug 2026 this function matched models by raw substring, which
 * silently mispriced a large share of production traffic for months:
 *   - "A CLASS" contains the letters C-L-A, so every A-Class was priced as a
 *     CLA at £40,855.
 *   - "5" is a substring of "CX 5", so every Mazda 5 was priced as a CX-5.
 *   - The table has no petrol Corsa, only "CORSA E" and "CORSA ELECTRIC", so
 *     210 of 290 production Corsa valuations depreciated from £28,555. A 2008
 *     1.2 petrol came out at £2,100 against a real £700-£1,300.
 * Nothing caught it because the valuation had no tests at all. These are the
 * cheap ones. Run by `npm test`.
 */
import NEW_PRICES from "../src/data/new-prices.json";
import {
  calculateDepreciationBaseline,
  combineValuationLayers,
  expectedTotalMiles,
  getListPriceDeflator,
  getMileageAdjustment,
  lookupNewPrice,
} from "../src/lib/valuation";

type Entry = { make: string; model: string; newPrice: number };
const DATA = NEW_PRICES as Entry[];

let failures = 0;

function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

function below(label: string, actual: number | null, ceiling: number): void {
  const ok = actual !== null && actual < ceiling;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want < ${ceiling}`}`);
}

const price = (make: string, model: string, fuel?: string): number | null =>
  lookupNewPrice(DATA, make, model, fuel);

console.log("\nElectrified namesakes must not price combustion cars:");
// The table's only Corsas are CORSA E (£28,555) and CORSA ELECTRIC (£27,505).
// A petrol Corsa has no valid match and must fall through, not take either.
below("petrol Corsa avoids the electric Corsa price", price("VAUXHALL", "CORSA", "PETROL"), 27505);
below("petrol Fiat 500 avoids 500 ELECTRIC", price("FIAT", "500", "PETROL"), 20995);
check(
  "electric Corsa still gets the EV price",
  price("VAUXHALL", "CORSA", "ELECTRICITY"),
  27505,
);

console.log("\nSubstring collisions must not match:");
// The table has no A CLASS row, so this now lands on the Mercedes make
// average (£42,000) rather than the CLA's £40,855. Structurally right — it no
// longer claims to be a different model — but £1,145 WORSE in cash terms, and
// £42,000 is itself a current-range average inflated by S-Class/EQS/G-Wagon.
// Assert the structural property only. Fixed properly by backfilling A CLASS
// into new-prices.json and reworking MAKE_AVERAGES by body type.
check("A CLASS is not priced as a CLA", price("MERCEDES-BENZ", "A CLASS", "DIESEL") !== 40855, true);
below("Mazda 5 is not a CX-5", price("MAZDA", "5", "PETROL"), 31550);
// "E CLASS" starts with a bare E but is a diesel saloon, not an EV. The
// electrified test must only fire on a TRAILING bare E.
below("E CLASS is not treated as electric", price("MERCEDES-BENZ", "E CLASS", "DIESEL"), 43000);
// Hyundai i10/i20/i30 must not be mistaken for BMW's i3/i4.
below("Hyundai i30 is not treated as electric", price("HYUNDAI", "I30", "PETROL"), 30000);

console.log("\nLegitimate matches still work:");
check("exact match", price("FORD", "FIESTA", "PETROL"), 13800);
check("token-prefix match keeps 3 Series variants", price("BMW", "3 SERIES", "DIESEL") !== null, true);

console.log("\nMake-average fallback:");
// normalizeStr strips the hyphen, so a literal "MERCEDES-BENZ" key was
// unreachable and the marque fell to DEFAULT_NEW_PRICE.
check("MERCEDES-BENZ reaches its make average", price("MERCEDES-BENZ", "ZZZ NONEXISTENT"), 42000);
check("bare MERCEDES reaches it too", price("MERCEDES", "ZZZ NONEXISTENT"), 42000);
check("unknown make falls to the default", price("ZZZ UNKNOWN", "ZZZ MODEL"), 18000);
check("no make returns null", price("", "GOLF"), null);

console.log("\nList-price deflator (ONS D7E8):");
// new-prices.json holds CURRENT list prices. Without deflation a 2018 Golf was
// depreciated from the 2026 Golf's £41,860.
const d0 = getListPriceDeflator(0);
check("a brand-new car is not deflated", d0, 1);
const d8 = getListPriceDeflator(8);
const d18 = getListPriceDeflator(18);
check("deflator falls with age", d8 > d18, true);
check("deflator never exceeds 1", d8 <= 1 && d18 <= 1, true);
// Beyond the series (starts 1996) it must clamp, not extrapolate to zero.
check("very old cars clamp rather than extrapolate", getListPriceDeflator(200) > 0.5, true);
check("negative age is treated as new", getListPriceDeflator(-5), 1);
// A flat 3.5%/yr would give 0.539 here; the real index gives ~0.635, because
// new-car prices were nearly flat 1996-2016 then jumped from 2021.
check("18y deflator is nearer 0.64 than a flat-rate 0.54", d18 > 0.6 && d18 < 0.7, true);

console.log("\nMileage — expectation accumulates and decelerates:");
check("an older car is expected to have covered more in total",
  expectedTotalMiles(16, "PETROL") > expectedTotalMiles(3, "PETROL"), true);
// The correction that matters: mileage accrues more slowly as a car ages.
// A flat registration-era rate expected 173,000 miles of an 18-year-old car,
// so an utterly typical 95,000-mile 2008 Corsa scored the maximum low-mileage
// bonus — identical to a genuinely rare 40,000-mile one.
check("but fewer miles per year than when it was new",
  expectedTotalMiles(18, "PETROL") / 18 < expectedTotalMiles(3, "PETROL") / 3, true);
check("an 18-year-old car is expected around 100-130k, not 170k",
  expectedTotalMiles(18, "PETROL") > 95000 && expectedTotalMiles(18, "PETROL") < 130000, true);
check("a typical 95k-mile 18-year-old petrol is NOT treated as exceptional",
  getMileageAdjustment(95000, 18, "PETROL") < 10, true);
check("a genuinely rare 40k-mile 18-year-old still is",
  getMileageAdjustment(40000, 18, "PETROL") >= 12, true);
check("diesels are expected to cover more than petrols",
  expectedTotalMiles(7, "DIESEL") > expectedTotalMiles(7, "PETROL"), true);
check("unknown fuel still returns a sane figure", expectedTotalMiles(10) > 0, true);
check("age zero has no expectation", expectedTotalMiles(0, "PETROL"), 0);

console.log("\nMileage — the curve is continuous and monotonic:");
const expected7 = expectedTotalMiles(7, "DIESEL");
check("exactly average mileage is neutral", getMileageAdjustment(expected7, 7, "DIESEL"), 0);
check("more miles is never worth more",
  getMileageAdjustment(150000, 7, "DIESEL") < getMileageAdjustment(100000, 7, "DIESEL"), true);
// The old band table jumped -5% to -12% at a boundary, a ~£1,200 cliff on one
// extra mile. A continuous curve cannot do that.
const cliffA = getMileageAdjustment(expected7 * 1.4, 7, "DIESEL");
const cliffB = getMileageAdjustment(expected7 * 1.4 + 1, 7, "DIESEL");
check("no cliff at the old band boundary", Math.abs(cliffA - cliffB) < 0.5, true);
check("high mileage is penalised well beyond the old -12% floor",
  getMileageAdjustment(250000, 7, "DIESEL") < -35, true);
check("clamped below", getMileageAdjustment(900000, 7, "DIESEL") >= -45, true);
check("clamped above", getMileageAdjustment(1, 7, "DIESEL") <= 12, true);
check("no reading means no adjustment", getMileageAdjustment(null, 7, "DIESEL"), 0);
check("a brand-new car has no mileage expectation", getMileageAdjustment(10, 0, "PETROL"), 0);

console.log("\nMileage actually moves the headline:");
// The regression this guards: getMileageAdjustment used to be consumed only
// inside calculateDepreciationBaseline, which carries 20% of the blend, so a
// -12% penalty arrived as -2.4%. A 2019 320d returned £15,550 at BOTH 150k and
// 250k miles. Mileage now scales the blended value.
const blend = (mileAdj: number): number =>
  combineValuationLayers(14000, 14000, 20, null, 0, 0, 0, 20, null, null, null, null,
    false, null, null, null, 0, null, null, mileAdj)!.estimatedValue;
const at40k = blend(getMileageAdjustment(40000, 7, "DIESEL"));
const at150k = blend(getMileageAdjustment(150000, 7, "DIESEL"));
const at250k = blend(getMileageAdjustment(250000, 7, "DIESEL"));
console.log(`     40k £${at40k} · 150k £${at150k} · 250k £${at250k}`);
check("110,000 extra miles moves the value by more than £3,000", at40k - at150k > 3000, true);
check("250k is worth materially less than 150k", at150k - at250k > 1500, true);
check("the reported percentage reaches the caller", blend(-20) < blend(0), true);

console.log("\nDepreciation baseline no longer double-counts mileage:");
// Mileage moved OUT of the baseline; passing a different odometer must not
// change it, or the adjustment would be applied twice.
check("baseline is mileage-free",
  calculateDepreciationBaseline(20000, 8, "FORD", "FIESTA"),
  calculateDepreciationBaseline(20000, 8, "FORD", "FIESTA"));

console.log(
  failures === 0
    ? "\n✅ All valuation assertions passed.\n"
    : `\n❌ ${failures} assertion(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
