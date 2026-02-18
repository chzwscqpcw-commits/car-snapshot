// EV/PHEV specification lookup
// Data: compiled from manufacturer specs for popular UK EVs and PHEVs

import evData from "@/data/ev-specs.json";

type EvSpecEntry = {
  make: string;
  model: string;
  batteryKwh: number;
  rangeWltp: number;
  chargeFast: string | null;
  chargeSlow: string | null;
  motorKw: number | null;
  driveType: string | null;
};

const entries = evData as EvSpecEntry[];

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

const MAKE_ALIASES: Record<string, string> = {
  "MERCEDES": "MERCEDES BENZ",
  "MERCEDES-BENZ": "MERCEDES BENZ",
  "VW": "VOLKSWAGEN",
  "LANDROVER": "LAND ROVER",
};

export type EvSpecsResult = {
  batteryKwh: number;
  rangeWltp: number;
  chargeFast: string | null;
  chargeSlow: string | null;
  motorKw: number | null;
  driveType: string | null;
};

function buildResult(entry: EvSpecEntry): EvSpecsResult {
  return {
    batteryKwh: entry.batteryKwh,
    rangeWltp: entry.rangeWltp,
    chargeFast: entry.chargeFast,
    chargeSlow: entry.chargeSlow,
    motorKw: entry.motorKw,
    driveType: entry.driveType,
  };
}

/**
 * Look up EV/PHEV specs for a vehicle.
 * Only returns results for electric or hybrid fuel types.
 */
export function lookupEvSpecs(make?: string, model?: string, fuelType?: string): EvSpecsResult | null {
  if (!make || !model || !fuelType) return null;

  // Only look up electric/hybrid vehicles
  const fuelLower = fuelType.toLowerCase();
  const isElectric = fuelLower.includes("electric") || fuelLower === "electricity" || fuelLower.includes("hybrid");
  if (!isElectric) return null;

  const normMake = normalize(make);
  const normModel = normalize(model);
  const tryMakes = [normMake];
  const aliasedMake = MAKE_ALIASES[normMake];
  if (aliasedMake) tryMakes.push(aliasedMake);

  // Exact match
  for (const mk of tryMakes) {
    for (const entry of entries) {
      if (normalize(entry.make) === mk && normalize(entry.model) === normModel) {
        return buildResult(entry);
      }
    }
  }

  // Fuzzy: model contains or is contained by entry model
  for (const mk of tryMakes) {
    for (const entry of entries) {
      if (normalize(entry.make) !== mk) continue;
      const entryModel = normalize(entry.model);
      if (normModel.includes(entryModel) || entryModel.includes(normModel)) {
        return buildResult(entry);
      }
    }
  }

  return null;
}
