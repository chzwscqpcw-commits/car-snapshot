/**
 * Assertions for src/lib/ebay-comparables.ts — which eBay listings count as
 * comparables for a valuation. Synthetic listings, no network.
 */
import {
  buildComparables,
  ebaySearchModel,
  maxYearTolerance,
  titleTokenLadder,
  type EbayBundle,
} from "../src/lib/ebay-comparables";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
}

const NOW = new Date().getFullYear();

/** A bundle of listings, each `[title, price]`; year and fuel parsed as the
 *  live fetch does (smallest plausible year in the title). */
function bundle(listings: Array<[string, number]>): EbayBundle {
  return {
    items: listings.map(([title, price]) => {
      const years = (title.match(/\b(19[89]\d|20\d\d)\b/g) ?? []).map(Number);
      return { title: title.toUpperCase(), price, titleYear: years.length ? Math.min(...years) : null, titleFuel: null };
    }),
    totalReported: listings.length,
    dominantTransmission: null,
    dominantBodyType: null,
    query: "",
    rawCount: listings.length,
  };
}

console.log("\nSearch model (the family, not DVLA's trim string):");
check("MG trim dropped", ebaySearchModel("MG", "ZS TROPHY HEV AUTO"), "ZS");
check("Range Rover abbreviation expanded", ebaySearchModel("LAND ROVER", "R-ROVER VELAR DYN SE D MHEV A"), "RANGE ROVER VELAR");
check("BMW engine code to series", ebaySearchModel("BMW", "218I M SPORT AUTO"), "2 SERIES");
check("one-word model unchanged", ebaySearchModel("FORD", "FOCUS"), "FOCUS");

console.log("\nTitle-match ladder (most specific first, never below the family):");
check("Tesla stops at MODEL 3", titleTokenLadder("TESLA", "MODEL 3 LONG RANGE AWD").at(-1), ["MODEL", "3"]);
check("Range Rover never relaxes to R ROVER", titleTokenLadder("LAND ROVER", "R-ROVER VELAR DYN SE").map((t) => t.join(" ")),
  ["R ROVER VELAR DYN SE", "R ROVER VELAR DYN", "R ROVER VELAR", "RANGE ROVER VELAR"]);
check("one-word model is one rung", titleTokenLadder("FORD", "FOCUS"), [["FOCUS"]]);

console.log("\nYear tolerance (only as wide as the curve allows):");
check("1-year-old car: exact year only", maxYearTolerance(NOW - 1), 0);
check("3-year-old car: ±1", maxYearTolerance(NOW - 3), 1);
check("old car: ±5", maxYearTolerance(NOW - 25), 5);

console.log("\nComparables:");
{
  const y = NOW - 8;
  const r = buildComparables(bundle([
    [`${y} MG ZS EXCLUSIVE 1.0`, 8000],
    [`${y} MG ZS EXCITE`, 7600],
    [`${y} MG ZS 1.5 VTI`, 7800],
    [`${y} MG HS TROPHY`, 15000],
  ]), "MG", "ZS EXCLUSIVE VTI-TECH", y, null);
  check("trim not in titles: relaxes to the family", r?.matchedOn, "ZS");
  check("…and finds the three ZS listings, not the HS", r?.listingCount, 3);
}
{
  const y = NOW - 5;
  const r = buildComparables(bundle([
    [`${y} FORD PUMA ST 1.5 ECOBOOST`, 16000],
    [`${y} FORD PUMA ST PERFORMANCE`, 17000],
    [`${y} FORD PUMA ST X`, 16500],
    [`${y} FORD PUMA TITANIUM`, 11000],
  ]), "FORD", "PUMA ST", y, null);
  // Known limit: hyphens are word breaks (so "C" matches "C-MAX"), which also
  // lets "ST" match an "ST-LINE" title — as substring matching always did.
  check("enough exact matches: stays specific", r?.matchedOn, "PUMA ST");
  check("…and the Titanium is left out", r?.median, Math.round(16500 * 0.96));
}
{
  const y = NOW - 6;
  const r = buildComparables(bundle([
    [`${y} TESLA MODEL S 232KW 75KWH`, 20000],
    [`${y} TESLA MODEL S 100D`, 22000],
    [`${y} TESLA MODEL 3 LONG RANGE`, 17000],
  ]), "TESLA", "MODEL 3", y, null);
  check("whole words: MODEL 3 never matches a Model S 232KW", r, null);
}
{
  const y = NOW - 8;
  const r = buildComparables(bundle([
    [`${y} BMW 2 SERIES GRAN COUPE 1.5 218I`, 9000],
    [`${y} BMW 2 SERIES 1.5 216D`, 8800],
    [`${y} BMW 5 SERIES 520D SE`, 12000],
    [`${y} BMW 5 SERIES 530D M SPORT`, 15000],
  ]), "BMW", "5 SERIES", y, null);
  check("a decimal point isn't a word break (1.5 is not a 5)", r?.listingCount, 2);
}
{
  const y = NOW - 2;
  const r = buildComparables(bundle([
    [`${y - 5} VAUXHALL ASTRA SRI`, 6000],
    [`${y - 5} VAUXHALL ASTRA SE`, 5800],
    [`${y - 4} VAUXHALL ASTRA ELITE`, 7000],
  ]), "VAUXHALL", "ASTRA", y, null);
  check("young car is not priced off 4–5-year-older listings", r, null);
}
{
  const y = NOW - 20;
  const r = buildComparables(bundle([
    [`${y - 4} FORD FOCUS ZETEC`, 1500],
    [`${y + 3} FORD FOCUS STYLE`, 1700],
    [`${y + 5} FORD FOCUS TITANIUM`, 1600],
  ]), "FORD", "FOCUS", y, null);
  check("old car still widens to ±5", r?.listingCount, 3);
}

console.log(failures ? `\n${failures} failure(s)` : "\nAll eBay comparables checks passed");
process.exit(failures ? 1 : 0);
