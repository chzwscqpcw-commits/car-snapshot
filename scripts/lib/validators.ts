/**
 * Shared data-file validation engine.
 *
 * Two layers, run by validate-data.ts (CLI + prebuild) and the refresh
 * workflows, and partly by refresh-data.ts:
 *
 *   1. SHAPE — one validator per dataset (registered by name in
 *      src/data/_registry.ts): the file parses, has at least N entries, and
 *      every value is in a plausible range. A shape error is `fail`.
 *
 *   2. DELTA — the current file against the version committed at a git ref
 *      (`git show <ref>:src/data/<file>`): entry count within a band, key sets
 *      (makes, models, postcode areas, recall numbers) not shrinking by more
 *      than a band, and a few headline figures (national pass rate, latest
 *      fuel price, How Many Left totals for known models) within bands. Out of
 *      band is `review`; a change no legitimate refresh could produce (a
 *      dataset halving, a date going backwards) is `fail`.
 *
 * Shape checks alone let a half-scraped file through as long as it cleared
 * the minimum count; the delta is what notices "recalls lost 600 entries this
 * week" before a PR auto-merges it.
 */

import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import { DATASETS, type DatasetEntry, type DeltaRules } from "../../src/data/_registry";
import { CAZ_ZONES } from "../../src/data/caz-zones";
import { MOT_REGIONS, MOT_TOWNS } from "../../src/data/mot-locations";
import { facts as DID_YOU_KNOW } from "../../src/data/did-you-know";
import { modelTrivia, makeTrivia } from "../../src/data/model-trivia";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DATA_DIR = path.join(PROJECT_ROOT, "src/data");

export type ValidationStatus = "ok" | "review" | "fail";

export interface HeadlineDelta {
  name: string;
  previous: number;
  current: number;
  /** Fractional change, or null when the previous value was 0. */
  change: number | null;
  verdict: ValidationStatus;
}

export interface DeltaResult {
  status: ValidationStatus | "skipped";
  /** Why the comparison was skipped (no previous version, no rules). */
  skippedReason?: string;
  previousCount: number;
  currentCount: number;
  keysLost: number;
  keysAdded: number;
  /** A few of the lost keys, for the report. */
  lostSample: string[];
  headlines: HeadlineDelta[];
  notes: string[];
}

export interface ValidationResult {
  file: string;
  status: ValidationStatus;
  entryCount: number;
  errors: string[];
  warnings: string[];
  /** Delta findings that want a human look. */
  reviews: string[];
  delta?: DeltaResult;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export function loadJSON(filename: string): unknown {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * The version of a data file committed at `ref`, or null when the ref has no
 * such file (a new dataset) or git is unavailable. Never throws: the delta is
 * then reported as skipped, which the report says out loud.
 */
export function loadJSONAtRef(filename: string, ref: string): unknown | null {
  try {
    const out = execFileSync("git", ["show", `${ref}:src/data/${filename}`], {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

/** `origin/main` when it exists, else `HEAD`. */
export function defaultDeltaRef(): string {
  for (const ref of ["origin/main", "HEAD"]) {
    try {
      execFileSync("git", ["rev-parse", "--verify", "--quiet", ref], {
        cwd: PROJECT_ROOT,
        stdio: ["pipe", "pipe", "pipe"],
      });
      return ref;
    } catch {
      /* try the next */
    }
  }
  return "HEAD";
}

function result(
  file: string,
  entryCount: number,
  errors: string[],
  warnings: string[],
): ValidationResult {
  return {
    file,
    status: errors.length === 0 ? "ok" : "fail",
    entryCount,
    errors,
    warnings,
    reviews: [],
  };
}

function checkArrayMinEntries(data: unknown, min: number): { arr: unknown[]; errors: string[] } {
  if (!Array.isArray(data)) {
    return { arr: [], errors: [`Expected array, got ${typeof data}`] };
  }
  const errors: string[] = [];
  if (data.length < min) {
    errors.push(`Expected at least ${min} entries, found ${data.length}`);
  }
  return { arr: data, errors };
}

function checkObjectMinEntries(
  data: unknown,
  min: number,
): { obj: Record<string, unknown>; keys: string[]; errors: string[] } {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { obj: {}, keys: [], errors: [`Expected object, got ${typeof data}`] };
  }
  const obj = data as Record<string, unknown>;
  const keys = Object.keys(obj);
  const errors: string[] = [];
  if (keys.length < min) {
    errors.push(`Expected at least ${min} entries, found ${keys.length}`);
  }
  return { obj, keys, errors };
}

/** Load-or-fail wrapper every JSON validator starts with. */
function withJSON(file: string, fn: (data: unknown) => ValidationResult, data?: unknown): ValidationResult {
  let d: unknown = data;
  if (d === undefined) {
    try {
      d = loadJSON(file);
    } catch (e: unknown) {
      return result(file, 0, [(e as Error).message], []);
    }
  }
  return fn(d);
}

// ---------------------------------------------------------------------------
// Shape validators — one per dataset. Each takes the parsed data (so the
// test can feed a broken shape) and defaults to the file on disk.
// ---------------------------------------------------------------------------

export function validateRecalls(data?: unknown): ValidationResult {
  const file = "recalls.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { arr, errors: structErrors } = checkArrayMinEntries(d, 2500);
    errors.push(...structErrors);
    if (arr.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);

    const recallNumberRe = /^R[A-Z]*\/\d{2,4}\/\d+[a-z]?$/;
    const makes = new Set<string>();
    let badRecallNumbers = 0;
    let emptyModels = 0;
    for (const raw of arr) {
      const entry = raw as Record<string, unknown>;
      if (typeof entry.recallNumber !== "string" || !recallNumberRe.test(entry.recallNumber)) badRecallNumbers++;
      if (!Array.isArray(entry.models) || entry.models.length === 0) emptyModels++;
      if (typeof entry.make === "string" && entry.make.length > 0) makes.add(entry.make);
    }
    if (badRecallNumbers > 0) errors.push(`${badRecallNumbers} entries have invalid/missing recallNumber (expected R/YYYY/NNN)`);
    if (emptyModels > 0) errors.push(`${emptyModels} entries have empty/missing models array`);
    if (makes.size < 20) errors.push(`Only ${makes.size} unique makes found (expected at least 20)`);
    return result(file, arr.length, errors, []);
  }, data);
}

export function validateFuelEconomy(data?: unknown): ValidationResult {
  const file = "fuel-economy.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    // 800 reflects the post-2024 VCA CSV shape (Model separate from
    // Description, so the make|model|engine|fuel key collapses trim noise).
    // Realistic counts across 4 years are ~1,300; the full archive ~10,600.
    const { arr, errors: structErrors } = checkArrayMinEntries(d, 800);
    errors.push(...structErrors);
    if (arr.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    let badMpg = 0;
    let badEngine = 0;
    for (const raw of arr) {
      const entry = raw as Record<string, unknown>;
      const mpg = entry.combinedMpg;
      if (typeof mpg !== "number" || mpg < 0 || mpg > 500) badMpg++;
      const cc = entry.engineCapacity;
      if (typeof cc !== "number" || cc < 0 || cc > 10000) badEngine++;
    }
    if (badMpg > 0) errors.push(`${badMpg} entries have combinedMpg outside 0–500`);
    if (badEngine > 0) errors.push(`${badEngine} entries have engineCapacity outside 0–10000`);
    return result(file, arr.length, errors, []);
  }, data);
}

export function validateNcapRatings(data?: unknown): ValidationResult {
  const file = "ncap-ratings.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { arr, errors: structErrors } = checkArrayMinEntries(d, 200);
    errors.push(...structErrors);
    if (arr.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    let badStars = 0;
    let badPct = 0;
    let badYear = 0;
    for (const raw of arr) {
      const entry = raw as Record<string, unknown>;
      const stars = entry.overallStars;
      if (typeof stars !== "number" || stars < 0 || stars > 5) badStars++;
      for (const field of ["adultOccupant", "childOccupant", "pedestrian", "safetyAssist"]) {
        const val = entry[field];
        if (typeof val === "number" && (val < 0 || val > 100)) badPct++;
      }
      const year = entry.yearTested;
      if (typeof year !== "number" || year < 2000 || year > 2030) badYear++;
    }
    if (badStars > 0) errors.push(`${badStars} entries have overallStars outside 0–5`);
    if (badPct > 0) errors.push(`${badPct} percentage score values outside 0–100`);
    if (badYear > 0) errors.push(`${badYear} entries have yearTested outside 2000–2030`);
    return result(file, arr.length, errors, []);
  }, data);
}

export function validateNewPrices(data?: unknown): ValidationResult {
  const file = "new-prices.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { arr, errors: structErrors } = checkArrayMinEntries(d, 100);
    errors.push(...structErrors);
    if (arr.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    let badPrice = 0;
    for (const raw of arr) {
      const price = (raw as Record<string, unknown>).newPrice;
      if (typeof price !== "number" || price < 5000 || price > 500000) badPrice++;
    }
    if (badPrice > 0) errors.push(`${badPrice} entries have newPrice outside 5,000–500,000`);
    return result(file, arr.length, errors, []);
  }, data);
}

export function validateEvSpecs(data?: unknown): ValidationResult {
  const file = "ev-specs.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { arr, errors: structErrors } = checkArrayMinEntries(d, 30);
    errors.push(...structErrors);
    if (arr.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    let badBattery = 0;
    let badRange = 0;
    for (const raw of arr) {
      const entry = raw as Record<string, unknown>;
      const kWh = entry.batteryKwh;
      if (typeof kWh !== "number" || kWh < 10 || kWh > 200) badBattery++;
      const range = entry.rangeWltp;
      if (typeof range !== "number" || range < 20 || range > 700) badRange++;
    }
    if (badBattery > 0) errors.push(`${badBattery} entries have batteryKwh outside 10–200`);
    if (badRange > 0) errors.push(`${badRange} entries have rangeWltp outside 20–700`);
    return result(file, arr.length, errors, []);
  }, data);
}

/** `{ "MAKE|MODEL": [a, b] }` lookups: pairs of non-negative numbers. */
function validatePairLookup(file: string, min: number, pairLabel: string, data?: unknown): ValidationResult {
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { obj, keys, errors: structErrors } = checkObjectMinEntries(d, min);
    errors.push(...structErrors);
    if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    let badKeys = 0;
    let badValues = 0;
    for (const key of keys) {
      if (!key.includes("|")) badKeys++;
      const val = obj[key];
      if (
        !Array.isArray(val) ||
        val.length !== 2 ||
        typeof val[0] !== "number" ||
        typeof val[1] !== "number" ||
        val[0] < 0 ||
        val[1] < 0
      ) {
        badValues++;
      }
    }
    if (badKeys > 0) errors.push(`${badKeys} keys missing MAKE|MODEL pipe separator`);
    if (badValues > 0) errors.push(`${badValues} values are not ${pairLabel} number pairs >= 0`);
    return result(file, keys.length, errors, []);
  }, data);
}

export function validateHowManyLeft(data?: unknown): ValidationResult {
  return validatePairLookup("how-many-left.json", 4000, "[licensed, sorn]", data);
}

export function validateTheftRisk(data?: unknown): ValidationResult {
  return validatePairLookup("theft-risk.json", 50, "[theftCount, registeredCount]", data);
}

export function validateTheftRiskVans(data?: unknown): ValidationResult {
  return validatePairLookup("theft-risk-vans.json", 20, "[theftCount, registeredCount]", data);
}

export function validateMotPassRates(data?: unknown): ValidationResult {
  const file = "mot-pass-rates.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { obj, keys, errors: structErrors } = checkObjectMinEntries(d, 80);
    errors.push(...structErrors);
    if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    let badValues = 0;
    for (const key of keys) {
      const val = obj[key];
      if (!Array.isArray(val) || val.length !== 2 || typeof val[0] !== "number" || typeof val[1] !== "number") {
        badValues++;
        continue;
      }
      // val[0] = testCount, val[1] = passRate (0-100)
      if (val[0] < 100) badValues++;
      if (val[1] < 0 || val[1] > 100) badValues++;
    }
    if (badValues > 0) errors.push(`${badValues} entries have invalid [testCount, passRate] values`);
    return result(file, keys.length, errors, []);
  }, data);
}

export function validateMotAreas(data?: unknown): ValidationResult {
  const file = "mot-areas.json";
  return withJSON(file, (data) => {
    const errors: string[] = [];
    const d = data as {
      year?: unknown;
      national?: { tests?: unknown; passes?: unknown };
      areas?: Record<string, { tests?: unknown; passes?: unknown; months?: unknown; sections?: unknown }>;
    };
    if (typeof d !== "object" || d === null) return result(file, 0, ["Expected object"], []);
    if (typeof d.year !== "number" || d.year < 2023) errors.push("year missing or implausible");
    const nat = d.national;
    if (!nat || typeof nat.tests !== "number" || nat.tests < 25_000_000) {
      errors.push("national.tests missing or below 25M (a partial or duplicated read)");
    } else if (typeof nat.passes === "number") {
      const rate = (100 * nat.passes) / nat.tests;
      // 2023: 71.45%, 2024: 71.72%. Outside this band the definitions have slipped.
      if (rate < 65 || rate > 80) errors.push(`national first-time pass rate ${rate.toFixed(1)}% is outside 65–80%`);
    }
    const areas = d.areas ?? {};
    const keys = Object.keys(areas);
    if (keys.length < 100) errors.push(`only ${keys.length} postcode areas (expected 110+)`);
    let bad = 0;
    for (const k of keys) {
      const a = areas[k];
      if (
        typeof a.tests !== "number" || a.tests < 20_000 ||
        typeof a.passes !== "number" || a.passes > a.tests ||
        !Array.isArray(a.months) || a.months.length !== 12 ||
        !Array.isArray(a.sections) || a.sections.length === 0
      ) bad++;
    }
    if (bad > 0) errors.push(`${bad} areas have missing or implausible fields`);
    for (const must of ["B", "M", "LS", "G", "EH", "CF", "SW"]) {
      if (!areas[must]) errors.push(`postcode area ${must} missing — a town page would fall back to national figures`);
    }
    return result(file, keys.length, errors, []);
  }, data);
}

export function validateMotFailureReasons(data?: unknown): ValidationResult {
  const file = "mot-failure-reasons.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { obj, keys, errors: structErrors } = checkObjectMinEntries(d, 100);
    errors.push(...structErrors);
    if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    let badValues = 0;
    for (const key of keys) {
      const val = obj[key];
      if (!Array.isArray(val) || val.length === 0 || val.some((s) => typeof s !== "string" || s.length === 0)) badValues++;
    }
    if (badValues > 0) errors.push(`${badValues} entries are not non-empty arrays of failure area names`);
    return result(file, keys.length, errors, []);
  }, data);
}

export function validateBodyTypes(data?: unknown): ValidationResult {
  const file = "body-types.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { obj, keys, errors: structErrors } = checkObjectMinEntries(d, 300);
    errors.push(...structErrors);
    if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    const shapes = new Set<string>();
    let badKeys = 0;
    let badValues = 0;
    for (const key of keys) {
      if (!key.includes("|")) badKeys++;
      const val = obj[key];
      if (typeof val !== "string" || val.length === 0) badValues++;
      else shapes.add(val);
    }
    if (badKeys > 0) errors.push(`${badKeys} keys missing MAKE|MODEL pipe separator`);
    if (badValues > 0) errors.push(`${badValues} values are not body-type strings`);
    // The 2026 VEH0220 regression wrote "Cars" for every model; a healthy file
    // has a spread of real shapes.
    if (shapes.size < 5) errors.push(`only ${shapes.size} distinct body shapes (expected Hatchback/Saloon/SUV/…)`);
    return result(file, keys.length, errors, []);
  }, data);
}

export function validateColourPopularity(data?: unknown): ValidationResult {
  const file = "colour-popularity.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { obj, keys, errors: structErrors } = checkObjectMinEntries(d, 10);
    errors.push(...structErrors);
    if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    let badValues = 0;
    for (const key of keys) {
      const val = obj[key] as Record<string, unknown>;
      if (typeof val !== "object" || val === null || Array.isArray(val)) {
        badValues++;
        continue;
      }
      const share = val.share;
      const rank = val.rank;
      if (typeof share !== "number" || share < 0 || share > 100) badValues++;
      if (typeof rank !== "number" || rank <= 0) badValues++;
    }
    if (badValues > 0) errors.push(`${badValues} entries have invalid share (0–100) or rank (> 0)`);
    return result(file, keys.length, errors, []);
  }, data);
}

export function validateTyreSizes(data?: unknown): ValidationResult {
  const file = "tyre-sizes.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { obj, keys, errors: structErrors } = checkObjectMinEntries(d, 100);
    errors.push(...structErrors);
    if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    const sizeRe = /^\d+\/\d+ R\d+$/;
    const boltRe = /^\dx\d+(\.\d+)?$/;
    let badSizes = 0;
    let badBolts = 0;
    for (const key of keys) {
      const val = obj[key] as Record<string, unknown>;
      if (typeof val !== "object" || val === null || Array.isArray(val)) {
        badSizes++;
        continue;
      }
      const sizes = val.sizes;
      if (!Array.isArray(sizes) || sizes.length === 0 || sizes.some((s) => typeof s !== "string" || !sizeRe.test(s))) badSizes++;
      const bolt = val.boltPattern;
      if (typeof bolt === "string" && !boltRe.test(bolt)) badBolts++;
    }
    if (badSizes > 0) errors.push(`${badSizes} entries have invalid tyre sizes (expected NNN/NN RNN)`);
    if (badBolts > 0) errors.push(`${badBolts} entries have invalid boltPattern (expected NxNNN)`);
    return result(file, keys.length, errors, []);
  }, data);
}

export function validateVehicleDimensions(data?: unknown): ValidationResult {
  const file = "vehicle-dimensions.json";
  return withJSON(file, (d) => {
    const errors: string[] = [];
    const { obj, keys, errors: structErrors } = checkObjectMinEntries(d, 100);
    errors.push(...structErrors);
    if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, []);
    const rangeChecks: [string, number, number][] = [
      ["lengthMm", 2500, 6000],
      ["widthMm", 1400, 2500],
      ["heightMm", 1000, 2500],
      ["wheelbaseMm", 1800, 4000],
      ["kerbWeightKg", 800, 3500],
      ["bootLitres", 50, 3000],
    ];
    let badValues = 0;
    for (const key of keys) {
      const val = obj[key] as Record<string, unknown>;
      if (typeof val !== "object" || val === null || Array.isArray(val)) {
        badValues++;
        continue;
      }
      for (const [field, min, max] of rangeChecks) {
        const v = val[field];
        if (typeof v === "number" && (v < min || v > max)) {
          badValues++;
          break;
        }
      }
    }
    if (badValues > 0) errors.push(`${badValues} entries have dimension values outside expected ranges`);
    return result(file, keys.length, errors, []);
  }, data);
}

export function validateTheftStats(data?: unknown): ValidationResult {
  const file = "theft-stats.json";
  return withJSON(file, (data) => {
    const errors: string[] = [];
    const d = data as Record<string, unknown>;
    if (typeof d !== "object" || d === null) return result(file, 0, ["Expected object"], []);
    const year = d.year;
    if (typeof year !== "number" || year < 2020 || year > 2040) errors.push("year missing or implausible");
    let fleets = 0;
    for (const fleet of ["cars", "vans", "motorcycles"]) {
      const f = d[fleet] as Record<string, unknown> | undefined;
      if (!f || typeof f !== "object") {
        errors.push(`${fleet} block missing`);
        continue;
      }
      fleets++;
      const per1000 = f.nationalPer1000;
      if (typeof per1000 !== "number" || per1000 <= 0 || per1000 > 50) errors.push(`${fleet}.nationalPer1000 implausible (${String(per1000)})`);
      const byYear = f.byYear as Record<string, unknown> | undefined;
      if (!byYear || typeof byYear[String(year)] !== "number") errors.push(`${fleet}.byYear has no figure for ${String(year)}`);
      if (!Array.isArray(f.topByCount) || f.topByCount.length < 5) errors.push(`${fleet}.topByCount has fewer than 5 rows`);
    }
    const share = d.matchedShare;
    if (typeof share !== "number" || share < 0.8 || share > 1) errors.push("matchedShare outside 0.8–1 (the FOI→VEH0120 join broke)");
    return result(file, fleets, errors, []);
  }, data);
}

export function validateFuelPricesWeekly(data?: unknown): ValidationResult {
  const file = "fuel-prices-weekly.json";
  return withJSON(file, (data) => {
    const errors: string[] = [];
    const d = data as { weekly?: unknown; lastFetched?: unknown };
    if (typeof d !== "object" || d === null || !Array.isArray(d.weekly)) return result(file, 0, ["Expected { weekly: [] }"], []);
    const weekly = d.weekly as Record<string, unknown>[];
    // DESNZ series starts June 2003; ~52 rows a year.
    if (weekly.length < 1000) errors.push(`only ${weekly.length} weeks (expected 1,000+ since 2003)`);
    let bad = 0;
    let unsorted = 0;
    for (let i = 0; i < weekly.length; i++) {
      const w = weekly[i];
      if (typeof w.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(w.date)) bad++;
      for (const k of ["petrol", "diesel"]) {
        const v = w[k];
        if (typeof v !== "number" || v < 50 || v > 300) bad++;
      }
      if (i > 0 && typeof w.date === "string" && typeof weekly[i - 1].date === "string" && w.date <= (weekly[i - 1].date as string)) unsorted++;
    }
    if (bad > 0) errors.push(`${bad} rows have a bad date or a price outside 50–300p`);
    if (unsorted > 0) errors.push(`${unsorted} rows out of date order`);
    const last = weekly[weekly.length - 1];
    if (last && typeof last.date === "string") {
      const ageDays = (Date.now() - Date.parse(last.date)) / 864e5;
      if (ageDays > 60) errors.push(`latest week ${last.date} is ${Math.round(ageDays)} days old (DESNZ publishes weekly)`);
    }
    return result(file, weekly.length, errors, []);
  }, data);
}

export function validateNewCarPriceIndex(data?: unknown): ValidationResult {
  const file = "new-car-price-index.json";
  return withJSON(file, (data) => {
    const errors: string[] = [];
    const d = data as { byYear?: Record<string, unknown>; minYear?: unknown; maxYear?: unknown; partialYears?: Record<string, { value?: unknown }> };
    if (typeof d !== "object" || d === null || typeof d.byYear !== "object" || d.byYear === null) return result(file, 0, ["Expected { byYear: {} }"], []);
    const years = Object.keys(d.byYear);
    if (years.length < 25) errors.push(`only ${years.length} years (ONS series runs from 1996)`);
    let bad = 0;
    for (const y of years) {
      const v = d.byYear[y];
      if (!/^\d{4}$/.test(y) || typeof v !== "number" || v < 40 || v > 400) bad++;
    }
    if (bad > 0) errors.push(`${bad} years have a bad key or an index outside 40–400 (2015=100)`);
    if (typeof d.maxYear !== "number" || d.maxYear < new Date().getUTCFullYear() - 1) errors.push("maxYear is more than a year behind");
    return result(file, years.length, errors, []);
  }, data);
}

export function validateServicePrices(data?: unknown): ValidationResult {
  const file = "service-prices.json";
  return withJSON(file, (data) => {
    const errors: string[] = [];
    const d = data as Record<string, Record<string, unknown>>;
    if (typeof d !== "object" || d === null) return result(file, 0, ["Expected object"], []);
    for (const block of ["mot", "interimService", "fullService", "diagnostic", "regions"]) {
      if (typeof d[block] !== "object" || d[block] === null) errors.push(`${block} block missing`);
    }
    const mot = d.mot ?? {};
    const legalMax = mot.legalMax;
    if (typeof legalMax !== "number" || legalMax < 40 || legalMax > 80) errors.push(`mot.legalMax implausible (${String(legalMax)})`);
    if (typeof mot.median !== "number" || typeof legalMax !== "number" || mot.median > legalMax) errors.push("mot.median missing or above the legal maximum");
    const regions = Object.keys(d.regions ?? {});
    if (regions.length < 10) errors.push(`only ${regions.length} regions (expected 11+)`);
    return result(file, regions.length, errors, []);
  }, data);
}

export function validateModelPriceCalibration(data?: unknown): ValidationResult {
  const file = "model-price-calibration.json";
  return withJSON(file, (data) => {
    const errors: string[] = [];
    const d = data as { generatedAt?: unknown; families?: Record<string, Record<string, unknown>> };
    if (typeof d !== "object" || d === null || typeof d.families !== "object" || d.families === null) return result(file, 0, ["Expected { families: {} }"], []);
    const keys = Object.keys(d.families);
    if (keys.length < 50) errors.push(`only ${keys.length} families (expected 100+)`);
    let bad = 0;
    for (const k of keys) {
      const f = d.families[k];
      if (!k.includes("|") || typeof f.price !== "number" || f.price < 3000 || f.price > 500000 || typeof f.n !== "number" || f.n < 3) bad++;
    }
    if (bad > 0) errors.push(`${bad} families have a bad key, a price outside 3,000–500,000 or n < 3`);
    if (typeof d.generatedAt !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(d.generatedAt)) errors.push("generatedAt missing");
    return result(file, keys.length, errors, []);
  }, data);
}

// Hand-written modules: imported, so a syntax error fails before this runs.
export function validateCazZones(): ValidationResult {
  const errors: string[] = [];
  if (CAZ_ZONES.length < 5) errors.push(`only ${CAZ_ZONES.length} zones`);
  const slugs = new Set<string>();
  for (const z of CAZ_ZONES) {
    if (slugs.has(z.slug)) errors.push(`duplicate slug ${z.slug}`);
    slugs.add(z.slug);
    if (!z.officialUrl.startsWith("http")) errors.push(`${z.slug}: officialUrl is not a URL`);
    if (z.charges.length === 0 && z.status === "active") errors.push(`${z.slug}: active zone with no charges`);
  }
  return result("caz-zones.ts", CAZ_ZONES.length, errors, []);
}

export function validateMotLocations(): ValidationResult {
  const errors: string[] = [];
  if (MOT_TOWNS.length < 10) errors.push(`only ${MOT_TOWNS.length} towns`);
  for (const t of MOT_TOWNS) {
    if (!MOT_REGIONS[t.region]) errors.push(`${t.slug}: unknown region ${t.region}`);
  }
  for (const [k, r] of Object.entries(MOT_REGIONS)) {
    if (!(r.priceLow > 0 && r.priceHigh >= r.priceLow && r.priceHigh <= 54.85)) errors.push(`${k}: price band outside 0–54.85`);
  }
  return result("mot-locations.ts", MOT_TOWNS.length, errors, []);
}

export function validateDidYouKnow(): ValidationResult {
  const errors: string[] = [];
  if (DID_YOU_KNOW.length < 50) errors.push(`only ${DID_YOU_KNOW.length} facts`);
  const empty = DID_YOU_KNOW.filter((f) => !f.text || !f.category).length;
  if (empty > 0) errors.push(`${empty} facts have no text or category`);
  return result("did-you-know.ts", DID_YOU_KNOW.length, errors, []);
}

export function validateModelTrivia(): ValidationResult {
  const errors: string[] = [];
  const models = Object.keys(modelTrivia);
  if (models.length < 50) errors.push(`only ${models.length} models`);
  const badKeys = [...models, ...Object.keys(makeTrivia)].filter((k) => k !== k.toUpperCase()).length;
  if (badKeys > 0) errors.push(`${badKeys} keys are not upper-case (lookups normalise to upper)`);
  // An empty list is a content gap, not a broken file: the lookup simply finds
  // nothing for that model. Say so without blocking every refresh on it.
  const thin = models.filter((k) => !Array.isArray(modelTrivia[k]) || modelTrivia[k].length === 0);
  const warnings = thin.length ? [`${thin.length} models have no facts yet (${thin.slice(0, 4).join(", ")}${thin.length > 4 ? ", …" : ""})`] : [];
  return result("model-trivia.ts", models.length, errors, warnings);
}

/** Validators by the name the registry uses. */
export const VALIDATORS: Record<string, (data?: unknown) => ValidationResult> = {
  validateRecalls,
  validateFuelEconomy,
  validateNcapRatings,
  validateNewPrices,
  validateEvSpecs,
  validateHowManyLeft,
  validateMotPassRates,
  validateMotFailureReasons,
  validateMotAreas,
  validateBodyTypes,
  validateTheftRisk,
  validateTheftRiskVans,
  validateTheftStats,
  validateColourPopularity,
  validateTyreSizes,
  validateVehicleDimensions,
  validateFuelPricesWeekly,
  validateNewCarPriceIndex,
  validateServicePrices,
  validateModelPriceCalibration,
  validateCazZones,
  validateMotLocations,
  validateDidYouKnow,
  validateModelTrivia,
};

// ---------------------------------------------------------------------------
// Delta: the current file against the previously committed version
// ---------------------------------------------------------------------------

export interface DatasetProfile {
  count: number;
  /** The identifying keys, or null when the dataset has none worth tracking. */
  keys: Set<string> | null;
  /** Headline figures, compared within a band. */
  headlines: Record<string, number>;
  /** Headline names that must never go down (a year, a latest date). */
  monotonic: string[];
}

const asRecords = (d: unknown): Record<string, unknown>[] => (Array.isArray(d) ? (d as Record<string, unknown>[]) : []);
const asObject = (d: unknown): Record<string, unknown> =>
  typeof d === "object" && d !== null && !Array.isArray(d) ? (d as Record<string, unknown>) : {};
const makeModelKeys = (arr: Record<string, unknown>[]) => new Set(arr.map((r) => `${String(r.make)}|${String(r.model)}`));
const makes = (arr: Record<string, unknown>[]) => new Set(arr.map((r) => String(r.make))).size;

/**
 * What the delta compares for each dataset. Headline names are stable so a
 * per-dataset band can be set on them in the registry.
 */
export function profileDataset(file: string, data: unknown): DatasetProfile {
  const none: DatasetProfile = { count: 0, keys: null, headlines: {}, monotonic: [] };
  switch (file) {
    case "recalls.json": {
      const arr = asRecords(data);
      return { count: arr.length, keys: new Set(arr.map((r) => String(r.recallNumber))), headlines: { makes: makes(arr) }, monotonic: [] };
    }
    case "fuel-economy.json":
    case "ncap-ratings.json":
    case "new-prices.json":
    case "ev-specs.json": {
      const arr = asRecords(data);
      return { count: arr.length, keys: makeModelKeys(arr), headlines: { makes: makes(arr) }, monotonic: [] };
    }
    case "how-many-left.json": {
      const obj = asObject(data) as Record<string, [number, number]>;
      const keys = Object.keys(obj);
      const total = (k: string) => (Array.isArray(obj[k]) ? obj[k][0] + obj[k][1] : 0);
      const headlines: Record<string, number> = {
        "FORD|FIESTA": total("FORD|FIESTA"),
        "VOLKSWAGEN|GOLF": total("VOLKSWAGEN|GOLF"),
        "VAUXHALL|CORSA": total("VAUXHALL|CORSA"),
        "FORD|TRANSIT": total("FORD|TRANSIT"),
        licensedTotal: keys.reduce((n, k) => n + (Array.isArray(obj[k]) ? obj[k][0] : 0), 0),
      };
      return { count: keys.length, keys: new Set(keys), headlines, monotonic: [] };
    }
    case "mot-pass-rates.json": {
      const obj = asObject(data) as Record<string, [number, number]>;
      const keys = Object.keys(obj);
      let tests = 0;
      let passes = 0;
      for (const k of keys) {
        if (Array.isArray(obj[k])) {
          tests += obj[k][0];
          passes += (obj[k][0] * obj[k][1]) / 100;
        }
      }
      return { count: keys.length, keys: new Set(keys), headlines: { weightedPassRate: tests ? Math.round((1000 * passes) / tests) / 10 : 0 }, monotonic: [] };
    }
    case "mot-areas.json": {
      const d = data as { year?: number; national?: { tests?: number; passes?: number }; areas?: Record<string, unknown> };
      const areas = Object.keys(asObject(d?.areas));
      const tests = d?.national?.tests ?? 0;
      const passes = d?.national?.passes ?? 0;
      return {
        count: areas.length,
        keys: new Set(areas),
        headlines: { nationalPassRate: tests ? Math.round((1000 * passes) / tests) / 10 : 0, nationalTests: tests, year: d?.year ?? 0 },
        monotonic: ["year"],
      };
    }
    case "theft-stats.json": {
      const d = asObject(data) as { year?: number; cars?: { nationalPer1000?: number; byYear?: Record<string, number>; topByCount?: unknown[] }; vans?: { topByCount?: unknown[] }; motorcycles?: { topByCount?: unknown[] } };
      const year = d.year ?? 0;
      const rows = (d.cars?.topByCount?.length ?? 0) + (d.vans?.topByCount?.length ?? 0) + (d.motorcycles?.topByCount?.length ?? 0);
      return {
        count: rows,
        keys: null,
        headlines: { year, carsPer1000: d.cars?.nationalPer1000 ?? 0, carThefts: d.cars?.byYear?.[String(year)] ?? 0 },
        monotonic: ["year"],
      };
    }
    case "fuel-prices-weekly.json": {
      const weekly = asRecords((data as { weekly?: unknown })?.weekly);
      const last = weekly[weekly.length - 1] ?? {};
      return {
        count: weekly.length,
        keys: null,
        headlines: {
          latestPetrol: Number(last.petrol ?? 0),
          latestDiesel: Number(last.diesel ?? 0),
          latestWeek: typeof last.date === "string" ? Math.floor(Date.parse(last.date) / 864e5) : 0,
          weeks: weekly.length,
        },
        monotonic: ["latestWeek", "weeks"],
      };
    }
    case "new-car-price-index.json": {
      const d = asObject(data) as { byYear?: Record<string, number>; maxYear?: number; partialYears?: Record<string, { value?: number }> };
      const byYear = d.byYear ?? {};
      const years = Object.keys(byYear);
      const maxYear = d.maxYear ?? 0;
      const latest = d.partialYears?.[String(maxYear)]?.value ?? byYear[String(maxYear)] ?? 0;
      return { count: years.length, keys: null, headlines: { latestValue: latest, maxYear }, monotonic: ["maxYear"] };
    }
    case "service-prices.json": {
      const d = asObject(data) as { mot?: { median?: number; legalMax?: number }; regions?: Record<string, unknown> };
      return { count: Object.keys(asObject(d.regions)).length, keys: new Set(Object.keys(asObject(d.regions))), headlines: { motMedian: d.mot?.median ?? 0, motLegalMax: d.mot?.legalMax ?? 0 }, monotonic: [] };
    }
    case "model-price-calibration.json": {
      const fam = asObject((data as { families?: unknown })?.families);
      return { count: Object.keys(fam).length, keys: new Set(Object.keys(fam)), headlines: {}, monotonic: [] };
    }
    case "mot-failure-reasons.json":
    case "body-types.json":
    case "theft-risk.json":
    case "theft-risk-vans.json":
    case "colour-popularity.json":
    case "tyre-sizes.json":
    case "vehicle-dimensions.json": {
      const keys = Object.keys(asObject(data));
      return { count: keys.length, keys: new Set(keys), headlines: {}, monotonic: [] };
    }
    default:
      return none;
  }
}

const pct = (prev: number, cur: number): number | null => (prev === 0 ? null : (cur - prev) / prev);
const fmtPct = (p: number | null): string => (p === null ? "n/a" : `${p >= 0 ? "+" : ""}${(100 * p).toFixed(1)}%`);
/** Years and small figures read better without thousands separators; the fuel week is a date. */
const fmtHeadline = (name: string, v: number): string => {
  if (name === "latestWeek") return new Date(v * 864e5).toISOString().slice(0, 10);
  if (/year/i.test(name) || Math.abs(v) < 10_000) return String(v);
  return v.toLocaleString("en-GB");
};

/**
 * Compare a current dataset with its previous version under the registry's
 * rules. Pure: takes parsed data, returns findings, never reads git.
 */
export function deltaCheck(entry: DatasetEntry, current: unknown, previous: unknown | null): DeltaResult {
  const base: DeltaResult = {
    status: "skipped",
    previousCount: 0,
    currentCount: profileDataset(entry.file, current).count,
    keysLost: 0,
    keysAdded: 0,
    lostSample: [],
    headlines: [],
    notes: [],
  };
  if (!entry.deltaRules) return { ...base, skippedReason: "hand-written module; reviewed in its own PR" };
  if (previous === null || previous === undefined) return { ...base, skippedReason: "no previous version at the reference" };

  const rules: Required<Omit<DeltaRules, "headlineBands">> & { headlineBands: Record<string, number> } = {
    countBand: entry.deltaRules.countBand ?? 0.2,
    countFailBand: entry.deltaRules.countFailBand ?? 0.5,
    keyShrinkBand: entry.deltaRules.keyShrinkBand ?? 0.1,
    headlineBand: entry.deltaRules.headlineBand ?? 0.2,
    headlineBands: entry.deltaRules.headlineBands ?? {},
  };
  const cur = profileDataset(entry.file, current);
  const prev = profileDataset(entry.file, previous);
  const notes: string[] = [];
  let status: ValidationStatus = "ok";
  const worsen = (to: ValidationStatus) => {
    if (to === "fail" || (to === "review" && status === "ok")) status = to;
  };

  // Entry count
  const countChange = pct(prev.count, cur.count);
  if (countChange !== null && Math.abs(countChange) > rules.countFailBand) {
    worsen("fail");
    notes.push(`entry count ${prev.count.toLocaleString("en-GB")} → ${cur.count.toLocaleString("en-GB")} (${fmtPct(countChange)}) — more than ±${Math.round(100 * rules.countFailBand)}%, which no single refresh of this source produces`);
  } else if (countChange !== null && Math.abs(countChange) > rules.countBand) {
    worsen("review");
    notes.push(`entry count ${prev.count.toLocaleString("en-GB")} → ${cur.count.toLocaleString("en-GB")} (${fmtPct(countChange)}) is outside ±${Math.round(100 * rules.countBand)}%`);
  }

  // Key set
  let keysLost = 0;
  let keysAdded = 0;
  const lostSample: string[] = [];
  if (cur.keys && prev.keys) {
    for (const k of prev.keys) {
      if (!cur.keys.has(k)) {
        keysLost++;
        if (lostSample.length < 5) lostSample.push(k);
      }
    }
    for (const k of cur.keys) if (!prev.keys.has(k)) keysAdded++;
    const lostShare = prev.keys.size ? keysLost / prev.keys.size : 0;
    if (lostShare > 0.5) {
      worsen("fail");
      notes.push(`${keysLost.toLocaleString("en-GB")} of ${prev.keys.size.toLocaleString("en-GB")} keys vanished (${fmtPct(-lostShare)}) — a different file, not a refresh`);
    } else if (lostShare > rules.keyShrinkBand) {
      worsen("review");
      notes.push(`${keysLost.toLocaleString("en-GB")} of ${prev.keys.size.toLocaleString("en-GB")} keys vanished (${fmtPct(-lostShare)}, band ${Math.round(100 * rules.keyShrinkBand)}%), e.g. ${lostSample.join(", ")}`);
    }
  }

  // Headlines
  const headlines: HeadlineDelta[] = [];
  for (const name of Object.keys(cur.headlines)) {
    if (!(name in prev.headlines)) continue;
    const p = prev.headlines[name];
    const c = cur.headlines[name];
    const change = pct(p, c);
    let verdict: ValidationStatus = "ok";
    if (cur.monotonic.includes(name)) {
      if (c < p) {
        verdict = "fail";
        notes.push(`${name} went backwards: ${fmtHeadline(name, p)} → ${fmtHeadline(name, c)}`);
      }
    } else {
      const band = rules.headlineBands[name] ?? rules.headlineBand;
      if (change !== null && Math.abs(change) > band) {
        verdict = "review";
        notes.push(`${name} ${fmtHeadline(name, p)} → ${fmtHeadline(name, c)} (${fmtPct(change)}) is outside ±${Math.round(100 * band)}%`);
      } else if (change === null && c !== p) {
        verdict = "review";
        notes.push(`${name} ${p} → ${c}`);
      }
    }
    worsen(verdict);
    headlines.push({ name, previous: p, current: c, change, verdict });
  }

  return { status, previousCount: prev.count, currentCount: cur.count, keysLost, keysAdded, lostSample, headlines, notes };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export interface ValidateOptions {
  /** Compare each JSON dataset with the version committed at this git ref. */
  against?: string;
}

/**
 * Shape-validate every registered dataset, and with `against` also run the
 * delta. A dataset's status is the worse of the two.
 */
export function validateAll(opts: ValidateOptions = {}): ValidationResult[] {
  return DATASETS.map((entry) => {
    const validator = VALIDATORS[entry.validator];
    if (!validator) {
      return { file: entry.file, status: "fail" as const, entryCount: 0, errors: [`no validator named ${entry.validator}`], warnings: [], reviews: [] };
    }
    const r = validator();
    if (!opts.against || entry.kind !== "json") return r;
    if (r.status === "fail" && r.errors.some((e) => e.startsWith("File not found") || e.startsWith("Expected"))) return r;
    const previous = loadJSONAtRef(entry.file, opts.against);
    let current: unknown;
    try {
      current = loadJSON(entry.file);
    } catch {
      return r;
    }
    const delta = deltaCheck(entry, current, previous);
    const reviews = delta.status === "review" ? delta.notes : [];
    const errors = delta.status === "fail" ? [...r.errors, ...delta.notes] : r.errors;
    const status: ValidationStatus = r.status === "fail" || delta.status === "fail" ? "fail" : delta.status === "review" ? "review" : "ok";
    return { ...r, status, errors, reviews, delta };
  });
}

/** The worst status across a run. */
export function overallStatus(results: ValidationResult[]): ValidationStatus {
  if (results.some((r) => r.status === "fail")) return "fail";
  if (results.some((r) => r.status === "review")) return "review";
  return "ok";
}

const ICON: Record<ValidationStatus, string> = { ok: "✅ ok", review: "🟡 review", fail: "❌ fail" };

/** The Markdown table the workflows put in the PR body and the review issue. */
export function renderMarkdownReport(results: ValidationResult[], against?: string): string {
  const overall = overallStatus(results);
  const lines: string[] = [];
  lines.push(`### Data validation — ${ICON[overall]}`);
  lines.push("");
  lines.push(against ? `Shape checks plus a comparison with \`${against}\`.` : "Shape checks only (no comparison with a previous version).");
  lines.push("");
  lines.push("| Dataset | Status | Entries | Keys | Notes |");
  lines.push("|---|---|---:|---|---|");
  for (const r of results) {
    const d = r.delta;
    const entries = d && d.status !== "skipped" && d.previousCount !== d.currentCount
      ? `${d.previousCount.toLocaleString("en-GB")} → ${d.currentCount.toLocaleString("en-GB")} (${fmtPct(pct(d.previousCount, d.currentCount))})`
      : r.entryCount.toLocaleString("en-GB");
    const keys = d && d.status !== "skipped" && (d.keysLost || d.keysAdded)
      ? `−${d.keysLost} / +${d.keysAdded}`
      : d && d.status !== "skipped" ? "unchanged" : "";
    const notes: string[] = [...r.errors, ...r.reviews, ...r.warnings.map((w) => `warning: ${w}`)];
    if (d?.status === "skipped" && against) notes.push(`delta skipped: ${d.skippedReason}`);
    if (d && d.status === "ok" && d.headlines.length) {
      notes.push(d.headlines.map((h) => `${h.name} ${fmtHeadline(h.name, h.current)}${h.change !== null && h.change !== 0 ? ` (${fmtPct(h.change)})` : ""}`).join(" · "));
    }
    lines.push(`| \`${r.file}\` | ${ICON[r.status]} | ${entries} | ${keys} | ${notes.join("<br>").replace(/\|/g, "\\|")} |`);
  }
  lines.push("");
  const counts = { ok: 0, review: 0, fail: 0 };
  for (const r of results) counts[r.status]++;
  lines.push(`${results.length} datasets: ${counts.ok} ok · ${counts.review} review · ${counts.fail} fail.`);
  return lines.join("\n");
}
