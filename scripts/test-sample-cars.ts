/**
 * The example cars behind the homepage, /value-my-car and every tool lander's
 * "what you'll see" card — src/components/home/sample-cars.ts.
 *
 * Their MOT and tax dates are fixed text, so they go stale: this fails two
 * weeks before the first one passes, which is the reminder to refresh the
 * dates (and add a test to each history, and bump REF_YEAR). It also checks
 * the per-tool fields the landers' cards read, so a new car can't ship with
 * half a record.
 */
import { CLASSIC_SAMPLE, REF_YEAR, SAMPLE_CARS } from "../src/components/home/sample-cars";

let failures = 0;
function check(label: string, ok: boolean, detail = ""): void {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  — ${detail}`}`);
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/** "14 Mar 2027" → a Date, or null when it isn't in that form. */
function parseDate(s: string): Date | null {
  const m = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(s.trim());
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month < 0) return null;
  const d = new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
  return Number.isNaN(d.getTime()) ? null : d;
}

const DAY = 86_400_000;
const now = Date.now();
const horizon = now + 14 * DAY;

console.log("\nDates are in the future (refresh them when this fails):");
let earliest: { car: string; field: string; when: Date } | null = null;
for (const car of SAMPLE_CARS) {
  for (const field of ["motUntil", "taxUntil"] as const) {
    const when = parseDate(car[field]);
    check(`${car.id} ${field} "${car[field]}" is a date`, when !== null);
    if (!when) continue;
    if (!earliest || when < earliest.when) earliest = { car: car.id, field, when };
  }
}
if (earliest) {
  const daysLeft = Math.floor((earliest.when.getTime() - now) / DAY);
  check(
    `earliest date (${earliest.car} ${earliest.field}) is more than two weeks away`,
    earliest.when.getTime() > horizon,
    `${daysLeft} days left — refresh every motUntil / taxUntil, add a test to each history, bump REF_YEAR`,
  );
}
check(`REF_YEAR (${REF_YEAR}) is this year or last`, REF_YEAR >= new Date().getUTCFullYear() - 1 && REF_YEAR <= new Date().getUTCFullYear());

console.log("\nEvery car has the whole record:");
for (const car of SAMPLE_CARS) {
  const problems: string[] = [];
  if (car.mot.length !== car.mileage.length) problems.push("one mileage per MOT");
  if (car.mileage.some((m, i) => i > 0 && m <= car.mileage[i - 1])) problems.push("mileage must rise");
  if (car.year + 3 + car.mot.length - 1 !== REF_YEAR) problems.push(`MOTs should run from year+3 to REF_YEAR (${car.year + 3}–${REF_YEAR})`);
  if (car.costSplit.reduce((a, b) => a + b, 0) !== 100) problems.push("costSplit must sum to 100");
  if (car.listingBars.length !== 6) problems.push("six listing bars");
  if (!(car.valueMid > 0 && car.valueMid < car.newPrice)) problems.push("valueMid below newPrice");
  if (!/^About £[\d,]+ a year$/.test(car.runningCost)) problems.push("runningCost sentence");
  if (`About £${car.runningCostTotal.toLocaleString("en-GB")} a year` !== car.runningCost) problems.push("runningCostTotal must match runningCost");
  if (!(car.vedAnnual >= 0 && car.vedAnnual <= 800)) problems.push("vedAnnual in range");
  if (!car.vedBasis) problems.push("vedBasis");
  if (!car.euroStandard) problems.push("euroStandard");
  if (!Array.isArray(car.advisories)) problems.push("advisories");
  if (!(car.modelPassRate > 0 && car.modelPassRate < 100)) problems.push("modelPassRate");
  if (car.openRecalls > 0 && !car.openRecallTitle) problems.push("an open recall needs a title");
  if (car.openRecalls === 0 && car.openRecallTitle) problems.push("no open recall, no title");
  if (car.buyerFlags.length < 3 || car.buyerFlags.length > 4) problems.push("3–4 buyer flags");
  if (car.buyerFlags[car.buyerFlags.length - 1]?.tone !== "ask") problems.push("the last buyer flag is the free-records gap");
  if (!/^[A-Z]{2}\d{2} [A-Z]{3}$/.test(car.plate)) problems.push("placeholder plate in the AB12 CDE style");
  check(`${car.id}`, problems.length === 0, problems.join("; "));
}
check("the ids are unique", new Set(SAMPLE_CARS.map((c) => c.id)).size === SAMPLE_CARS.length);
check("at least one car fails ULEZ and one has an open recall", SAMPLE_CARS.some((c) => !c.ulez) && SAMPLE_CARS.some((c) => c.openRecalls > 0));

console.log("\nThe classic car for the exemption check:");
const exempt = parseDate(CLASSIC_SAMPLE.exemptFrom);
const registered = parseDate(CLASSIC_SAMPLE.firstRegistered);
const historic = parseDate(CLASSIC_SAMPLE.historicTaxFrom);
check("dates parse", !!exempt && !!registered && !!historic);
if (exempt && registered && historic) {
  check("exempt exactly 40 years after first registration", exempt.getUTCFullYear() - registered.getUTCFullYear() === 40 && exempt.getUTCMonth() === registered.getUTCMonth() && exempt.getUTCDate() === registered.getUTCDate());
  check("historic tax class starts on the 1 April after the 40th year", historic.getUTCMonth() === 3 && historic.getUTCDate() === 1 && historic.getUTCFullYear() === exempt.getUTCFullYear() + 1);
  check("it is already exempt", exempt.getTime() < now);
}
check("its plate cannot be real (a Z the prefix system never issued)", /Z/.test(CLASSIC_SAMPLE.plate));
check("registered in the year of the title", CLASSIC_SAMPLE.title.startsWith(String(CLASSIC_SAMPLE.year)));

if (failures) {
  console.error(`\n${failures} sample-car check(s) failed`);
  process.exit(1);
}
console.log("\nAll sample-car checks passed");
