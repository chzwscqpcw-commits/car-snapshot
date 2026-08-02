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
import { getListPriceDeflator, lookupNewPrice } from "../src/lib/valuation";

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

console.log(
  failures === 0
    ? "\n✅ All valuation assertions passed.\n"
    : `\n❌ ${failures} assertion(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
