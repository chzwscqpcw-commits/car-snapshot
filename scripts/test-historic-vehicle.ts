/**
 * Assertions for the two 40-year exemption rules. These are pure date
 * arithmetic against a FIXED "now", because the whole point of the tool is the
 * boundary behaviour — and a rule that is only exercised on the day you happen
 * to run it is a rule that breaks silently next April.
 */
import { getHistoricStatus, isApproachingExemption } from "../src/lib/historic-vehicle";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

const NOW = new Date(2026, 7, 23); // 23 Aug 2026

console.log("\nMOT exemption — 40th anniversary of first registration:");
check("1985 car is eligible",
  getHistoricStatus({ yearOfManufacture: 1985 }, NOW).motExemptEligible, true);
check("1990 car is not yet",
  getHistoricStatus({ yearOfManufacture: 1990 }, NOW).motExemptEligible, false);
// Boundary: registered Mar 1986 turns 40 in Mar 2026 — before our fixed NOW.
check("reg 1986-03 eligible by Aug 2026",
  getHistoricStatus({ yearOfManufacture: 1986, monthOfFirstRegistration: "1986-03" }, NOW)
    .motExemptEligible, true);
// ...but registered Nov 1986 does not turn 40 until Nov 2026.
check("reg 1986-11 NOT eligible in Aug 2026",
  getHistoricStatus({ yearOfManufacture: 1986, monthOfFirstRegistration: "1986-11" }, NOW)
    .motExemptEligible, false);

console.log("\nHistoric VED — built before 1 Jan (Y-40), claimable from 1 April Y:");
check("1985 car: historic VED from 1 Apr 2026",
  getHistoricStatus({ yearOfManufacture: 1985 }, NOW).vedHistoricFrom?.toDateString(),
  new Date(2026, 3, 1).toDateString());
check("1985 car is VED-eligible by Aug 2026",
  getHistoricStatus({ yearOfManufacture: 1985 }, NOW).vedHistoricEligible, true);
check("1986 car: historic VED from 1 Apr 2027",
  getHistoricStatus({ yearOfManufacture: 1986 }, NOW).vedHistoricFrom?.toDateString(),
  new Date(2027, 3, 1).toDateString());
check("1986 car NOT VED-eligible in Aug 2026",
  getHistoricStatus({ yearOfManufacture: 1986 }, NOW).vedHistoricEligible, false);

console.log("\nTHE GAP — MOT-exempt but still taxed (the bit everyone gets wrong):");
const gapCar = getHistoricStatus({ yearOfManufacture: 1986, monthOfFirstRegistration: "1986-03" }, NOW);
check("Mar-1986 car is MOT-exempt", gapCar.motExemptEligible, true);
check("...but not yet VED-exempt", gapCar.vedHistoricEligible, false);
check("...and we can say how long the gap runs",
  typeof gapCar.daysInExemptionGap === "number" && gapCar.daysInExemptionGap > 0, true);
check("no gap reported once both apply",
  getHistoricStatus({ yearOfManufacture: 1985 }, NOW).daysInExemptionGap, null);

console.log("\nApproaching (within 5 years) and missing data:");
check("1989 car is approaching",
  isApproachingExemption(getHistoricStatus({ yearOfManufacture: 1989 }, NOW)), true);
check("2015 car is not approaching",
  isApproachingExemption(getHistoricStatus({ yearOfManufacture: 2015 }, NOW)), false);
check("already-exempt car is not 'approaching'",
  isApproachingExemption(getHistoricStatus({ yearOfManufacture: 1970 }, NOW)), false);
check("no year at all -> not eligible, no crash",
  getHistoricStatus({}, NOW).motExemptEligible, false);
check("no year at all -> buildYear null",
  getHistoricStatus({}, NOW).buildYear, null);
check("junk month falls back to year",
  getHistoricStatus({ yearOfManufacture: 1980, monthOfFirstRegistration: "nonsense" }, NOW).buildYear, 1980);

console.log(
  failures === 0
    ? "\n✅ All historic-vehicle assertions passed.\n"
    : `\n❌ ${failures} assertion(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
