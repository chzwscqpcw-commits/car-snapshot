/**
 * Booking savings assertions.
 *
 * The figures these functions produce are claims we make to users in pounds —
 * "the legal maximum is £54.85", "£120 between the cheapest and dearest". If
 * the price data shifts under them, the page starts stating numbers that
 * aren't true, and nothing else in the suite would notice.
 *
 * Run via `npm test` (which CI runs in full — it ran only test:pdf until
 * 2026-09-06, and a valuation regression reached production because of it).
 */

import {
  formatSaving,
  resolveRegion,
  savingSentence,
  savingsFor,
  type VehicleCategory,
} from "../src/lib/booking";

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const UK = resolveRegion("");
const LONDON = resolveRegion("SW1A 1AA");
const MEDIUM_PETROL: VehicleCategory = "medium_petrol";

console.log("\nMOT — the ceiling is a legal cap, not a market high:");
{
  const mot = savingsFor("mot", MEDIUM_PETROL, UK);
  check("max is the DVSA Class 4 cap of £54.85", mot.max === 54.85, `got ${mot.max}`);
  check("min is below the cap", mot.min < mot.max, `got ${mot.min}`);
  check("spread is £19.85", mot.spread === 19.85, `got ${mot.spread}`);
  check("flagged as a legal cap", mot.isLegalCap);
  check(
    "sentence names the cap and the floor",
    savingSentence(mot).includes("£54.85") && savingSentence(mot).includes("£35"),
    savingSentence(mot),
  );
}

console.log("\nMOT pricing is not multiplied by region (it's regulated):");
{
  const uk = savingsFor("mot", MEDIUM_PETROL, UK);
  const london = savingsFor("mot", MEDIUM_PETROL, LONDON);
  check("London MOT max equals UK MOT max", uk.max === london.max, `${uk.max} vs ${london.max}`);
  check("London MOT min equals UK MOT min", uk.min === london.min, `${uk.min} vs ${london.min}`);
  check(
    "a regional multiplier can never push an MOT over the legal cap",
    london.max <= 54.85,
    `got ${london.max}`,
  );
}

console.log("\nServices — the spread is the product, and it beats the MOT's:");
{
  const full = savingsFor("full", MEDIUM_PETROL, UK);
  const mot = savingsFor("mot", MEDIUM_PETROL, UK);
  check("full service spread is £120", full.spread === 120, `got ${full.spread}`);
  check("full service spread beats the MOT's", full.spread > mot.spread, `${full.spread} vs ${mot.spread}`);
  check("not flagged as a legal cap", !full.isLegalCap);
  check(
    "sentence leads with the gap, not the range",
    savingSentence(full).startsWith("£120"),
    savingSentence(full),
  );
}

console.log("\nEvery service produces a positive, sane spread:");
{
  for (const service of ["mot", "interim", "full", "diagnostic"] as const) {
    const info = savingsFor(service, MEDIUM_PETROL, UK);
    check(
      `${service}: 0 < spread < max`,
      info.spread > 0 && info.spread < info.max,
      `spread ${info.spread}, max ${info.max}`,
    );
  }
}

console.log("\nRegion multipliers widen a service's spread but keep it coherent:");
{
  const uk = savingsFor("full", MEDIUM_PETROL, UK);
  const london = savingsFor("full", MEDIUM_PETROL, LONDON);
  check("London is dearer than the UK average", london.min > uk.min, `${london.min} vs ${uk.min}`);
  check("London spread is still positive", london.spread > 0, `got ${london.spread}`);
  check("min never exceeds max", london.min < london.max);
}

console.log("\nFormatting — pennies only when the figure has them:");
{
  check("whole pounds render without decimals", formatSaving(120) === "£120", formatSaving(120));
  check("pennies are preserved", formatSaving(19.85) === "£19.85", formatSaving(19.85));
  check("one-penny figures don't lose a digit", formatSaving(19.8) === "£19.80", formatSaving(19.8));
}

if (failures > 0) {
  console.log(`\n❌ ${failures} booking-savings assertion(s) failed.\n`);
  process.exit(1);
}
console.log("\n✅ All booking-savings assertions passed.\n");
