/**
 * Shared data file validation engine
 *
 * Exports one validator per JSON data file + a validateAll() orchestrator.
 * Used by validate-data.ts (CLI + prebuild) and refresh-data.ts (post-refresh).
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.resolve(__dirname, "../../src/data");

export interface ValidationResult {
  file: string;
  status: "pass" | "fail";
  entryCount: number;
  errors: string[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadJSON(filename: string): unknown {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function result(
  file: string,
  entryCount: number,
  errors: string[],
  warnings: string[]
): ValidationResult {
  return {
    file,
    status: errors.length === 0 ? "pass" : "fail",
    entryCount,
    errors,
    warnings,
  };
}

function checkArrayMinEntries(
  data: unknown,
  file: string,
  min: number
): { arr: unknown[]; errors: string[] } {
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
  file: string,
  min: number
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

// ---------------------------------------------------------------------------
// Individual validators
// ---------------------------------------------------------------------------

export function validateRecalls(): ValidationResult {
  const file = "recalls.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { arr, errors: structErrors } = checkArrayMinEntries(data, file, 2500);
  errors.push(...structErrors);
  if (arr.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

  const recallNumberRe = /^R[A-Z]*\/\d{2,4}\/\d+[a-z]?$/;
  const makes = new Set<string>();
  let badRecallNumbers = 0;
  let emptyModels = 0;

  for (let i = 0; i < arr.length; i++) {
    const entry = arr[i] as Record<string, unknown>;
    if (!entry.recallNumber || typeof entry.recallNumber !== "string") {
      badRecallNumbers++;
    } else if (!recallNumberRe.test(entry.recallNumber)) {
      badRecallNumbers++;
    }
    if (!Array.isArray(entry.models) || entry.models.length === 0) {
      emptyModels++;
    }
    if (typeof entry.make === "string" && entry.make.length > 0) {
      makes.add(entry.make);
    }
  }

  if (badRecallNumbers > 0) {
    errors.push(`${badRecallNumbers} entries have invalid/missing recallNumber (expected R/YYYY/NNN)`);
  }
  if (emptyModels > 0) {
    errors.push(`${emptyModels} entries have empty/missing models array`);
  }
  if (makes.size < 20) {
    errors.push(`Only ${makes.size} unique makes found (expected at least 20)`);
  }

  return result(file, arr.length, errors, warnings);
}

export function validateFuelEconomy(): ValidationResult {
  const file = "fuel-economy.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { arr, errors: structErrors } = checkArrayMinEntries(data, file, 4000);
  errors.push(...structErrors);
  if (arr.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

  let badMpg = 0;
  let badEngine = 0;

  for (let i = 0; i < arr.length; i++) {
    const entry = arr[i] as Record<string, unknown>;
    const mpg = entry.combinedMpg as number;
    if (typeof mpg !== "number" || mpg < 0 || mpg > 500) {
      badMpg++;
    }
    const cc = entry.engineCapacity as number;
    if (typeof cc !== "number" || cc < 0 || cc > 10000) {
      badEngine++;
    }
  }

  if (badMpg > 0) errors.push(`${badMpg} entries have combinedMpg outside 0–200`);
  if (badEngine > 0) errors.push(`${badEngine} entries have engineCapacity outside 0–10000`);

  return result(file, arr.length, errors, warnings);
}

export function validateNcapRatings(): ValidationResult {
  const file = "ncap-ratings.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { arr, errors: structErrors } = checkArrayMinEntries(data, file, 200);
  errors.push(...structErrors);
  if (arr.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

  let badStars = 0;
  let badPct = 0;
  let badYear = 0;

  for (let i = 0; i < arr.length; i++) {
    const entry = arr[i] as Record<string, unknown>;
    const stars = entry.overallStars as number;
    if (typeof stars !== "number" || stars < 0 || stars > 5) badStars++;

    for (const field of ["adultOccupant", "childOccupant", "pedestrian", "safetyAssist"]) {
      const val = entry[field] as number;
      if (typeof val === "number" && (val < 0 || val > 100)) badPct++;
    }

    const year = entry.yearTested as number;
    if (typeof year !== "number" || year < 2000 || year > 2030) badYear++;
  }

  if (badStars > 0) errors.push(`${badStars} entries have overallStars outside 0–5`);
  if (badPct > 0) errors.push(`${badPct} percentage score values outside 0–100`);
  if (badYear > 0) errors.push(`${badYear} entries have yearTested outside 2010–2030`);

  return result(file, arr.length, errors, warnings);
}

export function validateNewPrices(): ValidationResult {
  const file = "new-prices.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { arr, errors: structErrors } = checkArrayMinEntries(data, file, 100);
  errors.push(...structErrors);
  if (arr.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

  let badPrice = 0;

  for (let i = 0; i < arr.length; i++) {
    const entry = arr[i] as Record<string, unknown>;
    const price = entry.newPrice as number;
    if (typeof price !== "number" || price < 5000 || price > 500000) badPrice++;
  }

  if (badPrice > 0) errors.push(`${badPrice} entries have newPrice outside 5,000–500,000`);

  return result(file, arr.length, errors, warnings);
}

export function validateEvSpecs(): ValidationResult {
  const file = "ev-specs.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { arr, errors: structErrors } = checkArrayMinEntries(data, file, 30);
  errors.push(...structErrors);
  if (arr.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

  let badBattery = 0;
  let badRange = 0;

  for (let i = 0; i < arr.length; i++) {
    const entry = arr[i] as Record<string, unknown>;
    const kWh = entry.batteryKwh as number;
    if (typeof kWh !== "number" || kWh < 10 || kWh > 200) badBattery++;

    const range = entry.rangeWltp as number;
    if (typeof range !== "number" || range < 20 || range > 700) badRange++;
  }

  if (badBattery > 0) errors.push(`${badBattery} entries have batteryKwh outside 10–200`);
  if (badRange > 0) errors.push(`${badRange} entries have rangeWltp outside 50–700`);

  return result(file, arr.length, errors, warnings);
}

export function validateHowManyLeft(): ValidationResult {
  const file = "how-many-left.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { obj, keys, errors: structErrors } = checkObjectMinEntries(data, file, 4000);
  errors.push(...structErrors);
  if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

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
  if (badValues > 0) errors.push(`${badValues} values are not [licensed, sorn] number pairs >= 0`);

  return result(file, keys.length, errors, warnings);
}

export function validateMotPassRates(): ValidationResult {
  const file = "mot-pass-rates.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { obj, keys, errors: structErrors } = checkObjectMinEntries(data, file, 80);
  errors.push(...structErrors);
  if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

  let badValues = 0;

  for (const key of keys) {
    const val = obj[key];
    if (
      !Array.isArray(val) ||
      val.length !== 2 ||
      typeof val[0] !== "number" ||
      typeof val[1] !== "number"
    ) {
      badValues++;
      continue;
    }
    // val[0] = testCount, val[1] = passRate (0-100)
    if (val[0] < 100) badValues++;
    if (val[1] < 0 || val[1] > 100) badValues++;
  }

  if (badValues > 0) errors.push(`${badValues} entries have invalid [testCount, passRate] values`);

  return result(file, keys.length, errors, warnings);
}

export function validateMotFailureReasons(): ValidationResult {
  const file = "mot-failure-reasons.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { obj, keys, errors: structErrors } = checkObjectMinEntries(data, file, 100);
  errors.push(...structErrors);
  if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

  let badValues = 0;

  for (const key of keys) {
    const val = obj[key];
    if (
      !Array.isArray(val) ||
      val.length === 0 ||
      !val.every((v: unknown) => typeof v === "string")
    ) {
      badValues++;
    }
  }

  if (badValues > 0) errors.push(`${badValues} entries are not non-empty string arrays`);

  return result(file, keys.length, errors, warnings);
}

export function validateBodyTypes(): ValidationResult {
  const file = "body-types.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { obj, keys, errors: structErrors } = checkObjectMinEntries(data, file, 200);
  errors.push(...structErrors);
  if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

  const knownBodyTypes = new Set([
    "Hatchback", "Saloon", "SUV", "Estate", "Convertible", "Coupe",
    "MPV", "Van", "Pickup", "Limousine", "Sports Car", "Tourer",
    "Crossover", "City Car", "Roadster", "Off-Road", "Minibus",
  ]);

  let badValues = 0;
  const unknownTypes = new Set<string>();

  for (const key of keys) {
    const val = obj[key];
    if (typeof val !== "string" || val.length === 0) {
      badValues++;
    } else if (!knownBodyTypes.has(val)) {
      unknownTypes.add(val);
    }
  }

  if (badValues > 0) errors.push(`${badValues} entries are not valid body type strings`);
  if (unknownTypes.size > 0) {
    warnings.push(`Unknown body types found: ${[...unknownTypes].join(", ")}`);
  }

  return result(file, keys.length, errors, warnings);
}

export function validateTheftRisk(): ValidationResult {
  const file = "theft-risk.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { obj, keys, errors: structErrors } = checkObjectMinEntries(data, file, 50);
  errors.push(...structErrors);
  if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

  let badValues = 0;

  for (const key of keys) {
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

  if (badValues > 0) errors.push(`${badValues} entries are not valid [theftCount, registeredCount] pairs`);

  return result(file, keys.length, errors, warnings);
}

export function validateColourPopularity(): ValidationResult {
  const file = "colour-popularity.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { obj, keys, errors: structErrors } = checkObjectMinEntries(data, file, 10);
  errors.push(...structErrors);
  if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

  let badValues = 0;

  for (const key of keys) {
    const val = obj[key] as Record<string, unknown>;
    if (typeof val !== "object" || val === null || Array.isArray(val)) {
      badValues++;
      continue;
    }
    const share = val.share as number;
    const rank = val.rank as number;
    if (typeof share !== "number" || share < 0 || share > 100) badValues++;
    if (typeof rank !== "number" || rank <= 0) badValues++;
  }

  if (badValues > 0) errors.push(`${badValues} entries have invalid share (0–100) or rank (> 0)`);

  return result(file, keys.length, errors, warnings);
}

export function validateTyreSizes(): ValidationResult {
  const file = "tyre-sizes.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { obj, keys, errors: structErrors } = checkObjectMinEntries(data, file, 100);
  errors.push(...structErrors);
  if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

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
    if (!Array.isArray(sizes) || sizes.length === 0) {
      badSizes++;
    } else {
      for (const s of sizes) {
        if (typeof s !== "string" || !sizeRe.test(s)) {
          badSizes++;
          break;
        }
      }
    }
    const bolt = val.boltPattern;
    if (typeof bolt === "string" && !boltRe.test(bolt)) {
      badBolts++;
    }
  }

  if (badSizes > 0) errors.push(`${badSizes} entries have invalid tyre sizes (expected NNN/NN RNN)`);
  if (badBolts > 0) errors.push(`${badBolts} entries have invalid boltPattern (expected NxNNN)`);

  return result(file, keys.length, errors, warnings);
}

export function validateVehicleDimensions(): ValidationResult {
  const file = "vehicle-dimensions.json";
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = loadJSON(file);
  } catch (e: unknown) {
    return result(file, 0, [(e as Error).message], []);
  }

  const { obj, keys, errors: structErrors } = checkObjectMinEntries(data, file, 100);
  errors.push(...structErrors);
  if (keys.length === 0 && structErrors.length > 0) return result(file, 0, errors, warnings);

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

  return result(file, keys.length, errors, warnings);
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export const ALL_VALIDATORS = [
  validateRecalls,
  validateFuelEconomy,
  validateNcapRatings,
  validateNewPrices,
  validateEvSpecs,
  validateHowManyLeft,
  validateMotPassRates,
  validateMotFailureReasons,
  validateBodyTypes,
  validateTheftRisk,
  validateColourPopularity,
  validateTyreSizes,
  validateVehicleDimensions,
];

export function validateAll(): ValidationResult[] {
  return ALL_VALIDATORS.map((fn) => fn());
}
