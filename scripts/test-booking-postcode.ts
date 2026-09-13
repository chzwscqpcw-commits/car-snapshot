/**
 * Postcode validation assertions.
 *
 * This function decides what gets handed to BookMyGarage on the step that
 * carries every penny of commission. Before it existed, `postcode.length >= 2`
 * counted as valid, so "SW" reached the hand-off URL and broke it — our own
 * pricing was happy because `resolveRegion` reads only the area prefix, so
 * nothing on our side looked wrong.
 *
 * Run via `npm test`.
 */

import { classifyPostcode, resolveRegion } from "../src/lib/booking";

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("\nFull postcodes — every real outcode shape, normalised:");
{
  const cases: [string, string][] = [
    ["SW1A 1AA", "SW1A 1AA"], // two letters + digit + letter
    ["sw1a1aa", "SW1A 1AA"], // lowercase, unspaced
    ["GU1 1AA", "GU1 1AA"], // two letters + single digit
    ["M1 1AE", "M1 1AE"], // one letter + single digit
    ["B33 8TH", "B33 8TH"], // one letter + two digits
    ["EC1A 1BB", "EC1A 1BB"], // London, letter in the outcode
    ["  ne1   4st  ", "NE1 4ST"], // messy whitespace
    ["GU1-1AA", "GU1 1AA"], // stray punctuation
  ];
  for (const [input, expected] of cases) {
    const r = classifyPostcode(input);
    check(
      `"${input}" → ${expected}`,
      r.kind === "full" && r.usable && r.normalised === expected,
      `got kind=${r.kind} normalised="${r.normalised}"`,
    );
  }
}

console.log("\nOutcodes alone are usable — BMG can geocode a district:");
{
  for (const input of ["GU1", "SW1A", "M1", "B33", "EC1A"]) {
    const r = classifyPostcode(input);
    check(`"${input}" is a usable outcode`, r.kind === "outcode" && r.usable && r.normalised === input,
      `got kind=${r.kind}`);
  }
}

console.log("\nFragments are NOT usable — this is the bug that broke the hand-off:");
{
  for (const input of ["S", "SW", "GU", "NE", "EC"]) {
    const r = classifyPostcode(input);
    check(`"${input}" rejected as a fragment`, r.kind === "partial" && !r.usable,
      `got kind=${r.kind} usable=${r.usable}`);
  }
  const sw = classifyPostcode("SW");
  check("a rejected fragment yields no normalised value to send", sw.normalised === "",
    `got "${sw.normalised}"`);
}

console.log("\nHalf-typed incodes are fragments too, not outcodes:");
{
  for (const input of ["GU1 1", "GU1 1A", "SW1A 1"]) {
    const r = classifyPostcode(input);
    check(`"${input}" is not yet usable`, r.kind === "partial" && !r.usable, `got kind=${r.kind}`);
  }
}

console.log("\nEmpty input is 'empty', never 'partial' — it drives different copy:");
{
  for (const input of ["", "   ", "-"]) {
    const r = classifyPostcode(input);
    check(`${JSON.stringify(input)} → empty`, r.kind === "empty" && !r.usable, `got kind=${r.kind}`);
  }
}

console.log("\nJunk never slips through as usable:");
{
  for (const input of ["ABCDEF", "12345", "!!!", "LONDON", "1"]) {
    const r = classifyPostcode(input);
    check(`"${input}" not usable`, !r.usable, `got kind=${r.kind} normalised="${r.normalised}"`);
  }
}

console.log("\nThe regression in full: pricing stayed right while the hand-off broke:");
{
  // resolveRegion reads the area prefix, so it was always happy with "SW" —
  // which is exactly why nothing on our side surfaced the problem.
  check("resolveRegion still prices a bare 'SW' as London",
    resolveRegion("SW").key === "london", `got ${resolveRegion("SW").key}`);
  check("...but classifyPostcode refuses to send it", !classifyPostcode("SW").usable);
  check("a complete outcode is both priced and sendable",
    resolveRegion("SW1A").key === "london" && classifyPostcode("SW1A").usable);
}

if (failures > 0) {
  console.log(`\n❌ ${failures} booking-postcode assertion(s) failed.\n`);
  process.exit(1);
}
console.log("\n✅ All booking-postcode assertions passed.\n");

// ── BookMyGarage hand-off routing ────────────────────────────────────────────
//
// Which route we take decides which clickref Awin records, and that is the
// whole point of splitting them: both routes shared one clickref until now, so
// there was no way to tell whether skipping BMG's search form actually sells
// better.

import { bmgClickref, bmgRouteFor } from "../src/lib/booking";

console.log("\nRoute: deep-link needs BOTH a reg and a geocodable postcode:");
{
  check("reg + full postcode → results", bmgRouteFor("LN63XYZ", "GU1 1AA") === "results");
  check("reg + outcode → results", bmgRouteFor("LN63XYZ", "GU1") === "results");
  check("reg + fragment → search", bmgRouteFor("LN63XYZ", "SW") === "search",
    `got ${bmgRouteFor("LN63XYZ", "SW")}`);
  check("reg + no postcode → search", bmgRouteFor("LN63XYZ", "") === "search");
  check("postcode but no reg → search", bmgRouteFor("", "GU1 1AA") === "search");
  check("neither → search", bmgRouteFor("", "") === "search");
}

console.log("\nClickref: the deep-link keeps the existing name, the new route is suffixed:");
{
  check("deep-link MOT is unchanged", bmgClickref("mot", "results") === "booking-flow-mot",
    bmgClickref("mot", "results"));
  check("search MOT is suffixed", bmgClickref("mot", "search") === "booking-flow-mot-search",
    bmgClickref("mot", "search"));
  check("deep-link full service is unchanged", bmgClickref("full", "results") === "booking-flow-full");
  check("search full service is suffixed", bmgClickref("full", "search") === "booking-flow-full-search");
  for (const service of ["mot", "interim", "full", "diagnostic"] as const) {
    for (const route of ["results", "search"] as const) {
      check(
        `${service}/${route} still starts with booking-flow- (the admin dashboard filters on it)`,
        bmgClickref(service, route).startsWith("booking-flow-"),
        bmgClickref(service, route),
      );
    }
  }
}

console.log("\nThe two never disagree — a fragment can't produce a deep-link clickref:");
{
  const route = bmgRouteFor("LN63XYZ", "SW");
  check("fragment routes to search and is labelled as such",
    route === "search" && bmgClickref("mot", route) === "booking-flow-mot-search");
}

if (failures > 0) {
  console.log(`\n❌ ${failures} assertion(s) failed.\n`);
  process.exit(1);
}
console.log("✅ Hand-off routing assertions passed.\n");
