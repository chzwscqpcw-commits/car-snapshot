/**
 * MOT testing by postcode area — the real-data backbone of the
 * /mot-prices/[town] pages.
 *
 * Source: src/data/mot-areas.json, built once a year by
 * scripts/process-mot-areas.py from the DVSA anonymised MOT bulk results
 * (Class 4, normal tests, first-time result). Each entry is one postcode
 * AREA (B, M, LS, …), the finest public grain the data has: the station's
 * area, not its address. No public data set lists test centres by town, so
 * nothing here ever claims a centre count — see the script's header.
 *
 * A town maps to one or more areas (London spans six), and the figures for
 * several areas are combined by adding counts; the two medians are
 * test-weighted averages of the areas' medians, which is close enough for
 * "cars tested here are older/higher-mileage than the UK" and never shown
 * to more precision than that supports.
 */

import areasData from "@/data/mot-areas.json";

export interface AreaCounts {
  tests: number;
  passes: number;
  mileageMedian: number | null;
  ageMedian: number | null;
  fuel: { ev: number; hybrid: number; diesel: number };
  /** Initial tests per calendar month, January first. */
  months: number[];
  /** [make, tests], most-tested first. */
  makes: [string, number][];
  /** [failure area, tests with at least one F/PRS item there], biggest first. */
  sections: [string, number][];
  /** Initial tests with at least one dangerous defect. */
  dangerous: number;
}

interface NationalCounts {
  tests: number;
  passes: number;
  mileageMedian: number;
  ageMedian: number;
  dangerous: number;
  months: number[];
  sections: [string, number][];
}

interface AreasFile {
  year: number;
  source: string;
  national: NationalCounts;
  areas: Record<string, AreaCounts>;
}

const DATA = areasData as unknown as AreasFile;

export const MOT_AREAS_YEAR = DATA.year;

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface MonthShare {
  /** 0 = January. */
  index: number;
  name: string;
  /** Share of the year's tests, in percent. */
  share: number;
}

export interface NamedShare {
  name: string;
  /** Percent of initial tests. */
  share: number;
}

export interface AreaStats {
  /** The postcode areas that were found in the data, e.g. ["B"] or ["E","N",…]. */
  areas: string[];
  tests: number;
  /** First-time pass rate, percent, one decimal. */
  passRate: number;
  /** passRate minus the national rate, percentage points, one decimal. */
  passRateVsUk: number;
  /** Percent of initial tests with a dangerous defect, one decimal. */
  dangerousShare: number;
  dangerousShareUk: number;
  mileageMedian: number;
  mileageMedianUk: number;
  ageMedian: number;
  ageMedianUk: number;
  /** Percent of tests that were battery-electric / hybrid / diesel. */
  evShare: number;
  hybridShare: number;
  dieselShare: number;
  topMakes: NamedShare[];
  topFailures: NamedShare[];
  topFailuresUk: NamedShare[];
  busiestMonth: MonthShare;
  quietestMonth: MonthShare;
  /** Percent of the year's tests in each month, January first. */
  monthShares: number[];
}

export interface NationalStats {
  tests: number;
  passRate: number;
  dangerousShare: number;
  mileageMedian: number;
  ageMedian: number;
  topFailures: NamedShare[];
  busiestMonth: MonthShare;
  quietestMonth: MonthShare;
}

function pct(n: number, d: number, dp = 1): number {
  if (!d) return 0;
  const f = 10 ** dp;
  return Math.round((100 * n) / d * f) / f;
}

function monthShares(months: number[]): { busiest: MonthShare; quietest: MonthShare } {
  const total = months.reduce((a, b) => a + b, 0);
  let hi = 0;
  let lo = 0;
  months.forEach((n, i) => {
    if (n > months[hi]) hi = i;
    if (n < months[lo]) lo = i;
  });
  return {
    busiest: { index: hi, name: MONTH_NAMES[hi], share: pct(months[hi], total) },
    quietest: { index: lo, name: MONTH_NAMES[lo], share: pct(months[lo], total) },
  };
}

function topShares(pairs: [string, number][], tests: number, limit: number): NamedShare[] {
  const merged = new Map<string, number>();
  for (const [name, n] of pairs) merged.set(name, (merged.get(name) ?? 0) + n);
  return [...merged.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, n]) => ({ name, share: pct(n, tests) }));
}

function titleCaseMake(make: string): string {
  const special: Record<string, string> = {
    BMW: "BMW",
    "MERCEDES-BENZ": "Mercedes-Benz",
    "LAND ROVER": "Land Rover",
    MG: "MG",
    DS: "DS",
    "ALFA ROMEO": "Alfa Romeo",
    "ASTON MARTIN": "Aston Martin",
    "ROLLS ROYCE": "Rolls-Royce",
  };
  if (special[make]) return special[make];
  return make
    .toLowerCase()
    .split(/(\s|-)/)
    .map((p) => (p.length > 1 ? p[0].toUpperCase() + p.slice(1) : p.toUpperCase()))
    .join("");
}

export function nationalStats(): NationalStats {
  const n = DATA.national;
  const m = monthShares(n.months);
  return {
    tests: n.tests,
    passRate: pct(n.passes, n.tests),
    dangerousShare: pct(n.dangerous, n.tests),
    mileageMedian: n.mileageMedian,
    ageMedian: n.ageMedian,
    topFailures: topShares(n.sections, n.tests, 3),
    busiestMonth: m.busiest,
    quietestMonth: m.quietest,
  };
}

/**
 * Combined figures for one or more postcode areas. Returns null when none of
 * the codes is in the data (an area under the script's minimum, or a typo),
 * so a page can fall back to the national picture instead of rendering
 * zeros.
 */
export function areaStats(codes: string[]): AreaStats | null {
  const found = codes.map((c) => c.toUpperCase()).filter((c) => DATA.areas[c]);
  if (found.length === 0) return null;
  const rows = found.map((c) => DATA.areas[c]);
  const tests = rows.reduce((a, r) => a + r.tests, 0);
  const passes = rows.reduce((a, r) => a + r.passes, 0);
  const dangerous = rows.reduce((a, r) => a + r.dangerous, 0);
  const weighted = (pick: (r: AreaCounts) => number | null): number => {
    let num = 0;
    let den = 0;
    for (const r of rows) {
      const v = pick(r);
      if (v == null) continue;
      num += v * r.tests;
      den += r.tests;
    }
    return den ? num / den : 0;
  };
  const months = Array.from({ length: 12 }, (_, i) => rows.reduce((a, r) => a + (r.months[i] ?? 0), 0));
  const m = monthShares(months);
  const uk = nationalStats();

  return {
    areas: found,
    tests,
    passRate: pct(passes, tests),
    passRateVsUk: Math.round((pct(passes, tests) - uk.passRate) * 10) / 10,
    dangerousShare: pct(dangerous, tests),
    dangerousShareUk: uk.dangerousShare,
    mileageMedian: Math.round(weighted((r) => r.mileageMedian) / 100) * 100,
    mileageMedianUk: Math.round(uk.mileageMedian / 100) * 100,
    ageMedian: Math.round(weighted((r) => r.ageMedian) * 10) / 10,
    ageMedianUk: uk.ageMedian,
    evShare: pct(rows.reduce((a, r) => a + r.fuel.ev, 0), tests),
    hybridShare: pct(rows.reduce((a, r) => a + r.fuel.hybrid, 0), tests),
    dieselShare: pct(rows.reduce((a, r) => a + r.fuel.diesel, 0), tests, 0),
    topMakes: topShares(rows.flatMap((r) => r.makes), tests, 3).map((s) => ({ ...s, name: titleCaseMake(s.name) })),
    topFailures: topShares(rows.flatMap((r) => r.sections), tests, 3),
    topFailuresUk: uk.topFailures,
    busiestMonth: m.busiest,
    quietestMonth: m.quietest,
    monthShares: months.map((n) => pct(n, tests)),
  };
}

/** "1,023,021" → "1.02 million"; "363,607" → "364,000". For prose, not tables. */
export function roundTests(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")} million`;
  if (n >= 100_000) return `${Math.round(n / 1000).toLocaleString("en-GB")},000`;
  return `${Math.round(n / 100) * 100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "the B postcode area" / "the E, N, NW, SE, SW and W postcode areas". */
export function areaLabel(areas: string[]): string {
  if (areas.length === 1) return `the ${areas[0]} postcode area`;
  const head = areas.slice(0, -1).join(", ");
  return `the ${head} and ${areas[areas.length - 1]} postcode areas`;
}
