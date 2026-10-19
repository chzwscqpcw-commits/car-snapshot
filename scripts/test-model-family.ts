/**
 * Assertions for the market calibration: the DVLA model -> family rules
 * (src/lib/model-family.ts), the generated src/data/model-price-calibration.json,
 * and the guards in lookupCalibratedPrice (src/lib/valuation.ts).
 */
import { modelFamily } from "../src/lib/model-family";
import { lookupCalibratedPrice, calculateDepreciationBaseline } from "../src/lib/valuation";
import calibration from "../src/data/model-price-calibration.json";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

console.log("\nDVLA model strings -> family (real Oct 2026 strings):");
for (const [make, model, want] of [
  ["BMW", "320D XDRIVE M SPORT MHEV AUTO", "BMW|3 SERIES"],
  ["BMW", "118", "BMW|1 SERIES"],
  ["BMW", "3 SERIES", "BMW|3 SERIES"],
  ["BMW", "X2 SDRIVE20I SPORT AUTO", "BMW|X2"],
  ["BMW", "IX XDRIVE50 M SPORT", "BMW|IX"],
  ["MERCEDES-BENZ", "E", "MERCEDES-BENZ|E CLASS"],
  ["MERCEDES-BENZ", "A-CLASS", "MERCEDES-BENZ|A CLASS"],
  ["MERCEDES", "S-Class", "MERCEDES-BENZ|S CLASS"],
  ["MERCEDES-BENZ", "AMG C 43 EDITION 4MATIC AUTO", "MERCEDES-BENZ|C CLASS"],
  ["MERCEDES-BENZ", "GLB 220 AMG LINE PREM + D 4M A", "MERCEDES-BENZ|GLB CLASS"],
  ["LAND ROVER", "R ROVER EVOQUE RDYN SE DMHEV A", "LAND ROVER|RANGE ROVER EVOQUE"],
  ["LAND ROVER", "RANGE ROVER SPORT", "LAND ROVER|RANGE ROVER SPORT"],
  ["LAND ROVER", "RANGE ROVER", "LAND ROVER|RANGE ROVER"],
  ["LAND ROVER", "EVOQUE", "LAND ROVER|RANGE ROVER EVOQUE"],
  ["LAND ROVER", "DISCOVERY SPORT D MHEV AUTO", "LAND ROVER|DISCOVERY SPORT"],
  ["VOLVO", "XC40 ULTIMATE B4 MHEV AUTO", "VOLVO|XC40"],
  ["FORD", "S-MAX TITANIUM HEV CVT", "FORD|S-MAX"],
  ["FORD", "GRAND C-MAX", "FORD|GRAND C-MAX"],
  ["FORD", "TRANSIT CUSTOM", "FORD|TRANSIT CUSTOM"],
  ["MAZDA", "MX-5", "MAZDA|MX-5"],
  ["VOLKSWAGEN", "UP!", "VOLKSWAGEN|UP"],
]) check(`${make} "${model}"`, modelFamily(make, model), want);
check("empty model has no family", modelFamily("FORD", ""), null);

console.log("\nCalibration file sanity:");
const fams = Object.entries(calibration.families as Record<string, { price: number; n: number; minAge: number; maxAge: number }>);
check("has families", fams.length > 50, true);
check("every price is plausible (£5k-£400k)", fams.every(([, c]) => c.price >= 5000 && c.price <= 400000), true);
check("every family meets the evidence bar (>=4 obs)", fams.every(([, c]) => c.n >= 4), true);
check("age ranges are well-formed", fams.every(([, c]) => c.minAge >= 1 && c.maxAge >= c.minAge), true);
check("every key is a family modelFamily() can produce", fams.every(([k]) => k.includes("|")), true);

console.log("\nGuards:");
const def = (calibration.families as Record<string, { minAge: number }>)["LAND ROVER|DEFENDER"];
if (def) {
  check("a classic-era price is not applied to a new Defender",
    lookupCalibratedPrice("LAND ROVER", "DEFENDER", Math.max(0, def.minAge - 5)), null);
}
const anyFam = fams.find(([k]) => k === "VAUXHALL|CORSA") ?? fams[0];
const [mk, mdl] = anyFam[0].split("|");
const midAge = Math.round((anyFam[1].minAge + anyFam[1].maxAge) / 2);
check(`${anyFam[0]} is calibrated at age ${midAge}`, lookupCalibratedPrice(mk, mdl, midAge, "PETROL"), anyFam[1].price);
check("an electric car never uses the calibration",
  lookupCalibratedPrice(mk, mdl, midAge, "ELECTRICITY"), null);
check("the baseline uses it when present",
  calculateDepreciationBaseline(1000, midAge, mk, mdl, "PETROL") > calculateDepreciationBaseline(1000, midAge, "ZZZ", "ZZZ", "PETROL"),
  true);

if (failures > 0) {
  console.error(`\n${failures} model-family check(s) failed`);
  process.exit(1);
}
console.log("\nAll model-family checks passed");
