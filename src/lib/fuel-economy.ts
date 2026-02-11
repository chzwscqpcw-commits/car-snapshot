// Fuel economy lookup and cost estimation

export type FuelEconomyEntry = {
  make: string;
  model: string;
  engineCapacity?: number;
  fuelType: string;
  combinedMpg: number;
  urbanMpg?: number;
  extraUrbanMpg?: number;
  enginePowerPS?: number;
  enginePowerKW?: number;
  noiseLevel?: number;
  electricRange?: number;
  transmission?: string;
};

export type FuelEconomyResult = {
  combinedMpg: number;
  urbanMpg?: number;
  extraUrbanMpg?: number;
  estimatedAnnualCost: number;
  matchType: "exact" | "model-fuel" | "model-only";
  matchedModel?: string;
  enginePowerPS?: number;
  enginePowerKW?: number;
  noiseLevel?: number;
  electricRange?: number;
  transmission?: string;
};

// Average fuel prices (pence per litre) — update periodically
const FUEL_PRICES: Record<string, number> = {
  petrol: 143,
  diesel: 150,
  default: 145,
};

const ASSUMED_ANNUAL_MILES = 8000;
const LITRES_PER_GALLON = 4.546;

function normalizeStr(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

/** Strip common prefixes VCA adds like "NEW" from model names */
function stripModelPrefix(model: string): string {
  return model.replace(/^NEW\s+/, "");
}

/** Check if two engine capacities are close enough (within 100cc) */
function engineMatch(a?: number, b?: number): boolean {
  if (!a || !b) return false;
  return Math.abs(a - b) <= 100;
}

/** Score how well a candidate model matches the search model (higher = better) */
function modelMatchScore(candidate: string, search: string): number {
  const c = stripModelPrefix(candidate);
  if (c === search) return 100; // exact
  if (c.startsWith(search + " ")) return 80; // e.g. "A6 SALOON" starts with "A6 "
  if (c.includes(search)) return 60; // contains
  if (search.includes(c)) return 40; // search contains candidate
  return 0;
}

/** Find the best matching entry from candidates by model name and optional engine */
function bestMatch(
  candidates: FuelEconomyEntry[],
  normModel: string,
  engineCapacity?: number,
  bodyStyleHint?: string,
): FuelEconomyEntry | null {
  let best: FuelEconomyEntry | null = null;
  let bestScore = 0;

  for (const e of candidates) {
    const eModel = normalizeStr(e.model);
    let score = modelMatchScore(eModel, normModel);
    if (score === 0) continue;

    // Bonus for engine capacity match
    if (engineCapacity && engineMatch(e.engineCapacity, engineCapacity)) {
      score += 10;
    }

    // Bonus for body style match (e.g. "AVANT" in "A6 AVANT")
    if (bodyStyleHint && normalizeStr(bodyStyleHint).length > 0) {
      if (eModel.includes(normalizeStr(bodyStyleHint))) {
        score += 5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }

  return best;
}

function getFuelPrice(fuelType?: string): number {
  if (!fuelType) return FUEL_PRICES.default;
  const lower = fuelType.toLowerCase();
  if (lower.includes("diesel")) return FUEL_PRICES.diesel;
  if (lower.includes("petrol")) return FUEL_PRICES.petrol;
  return FUEL_PRICES.default;
}

function calculateAnnualCost(mpg: number, fuelType?: string): number {
  if (mpg <= 0) return 0;
  const pricePerLitre = getFuelPrice(fuelType) / 100; // convert pence to pounds
  const litres = (ASSUMED_ANNUAL_MILES / mpg) * LITRES_PER_GALLON;
  return Math.round(litres * pricePerLitre);
}

function extendedFields(entry: FuelEconomyEntry): Pick<FuelEconomyResult, "enginePowerPS" | "enginePowerKW" | "noiseLevel" | "electricRange" | "transmission"> {
  const result: Pick<FuelEconomyResult, "enginePowerPS" | "enginePowerKW" | "noiseLevel" | "electricRange" | "transmission"> = {};
  if (entry.enginePowerPS) result.enginePowerPS = entry.enginePowerPS;
  if (entry.enginePowerKW) result.enginePowerKW = entry.enginePowerKW;
  if (entry.noiseLevel) result.noiseLevel = entry.noiseLevel;
  if (entry.electricRange) result.electricRange = entry.electricRange;
  if (entry.transmission) result.transmission = entry.transmission;
  return result;
}

export function lookupFuelEconomy(
  data: FuelEconomyEntry[],
  make?: string,
  model?: string,
  engineCapacity?: number,
  fuelType?: string,
  bodyStyleHint?: string,
): FuelEconomyResult | null {
  if (!make || !model || data.length === 0) return null;

  const normMake = normalizeStr(make);
  const normModel = normalizeStr(model);
  const normFuel = fuelType ? normalizeStr(fuelType) : null;

  // Filter to same make first
  const sameMake = data.filter((e) => normalizeStr(e.make) === normMake);
  if (sameMake.length === 0) return null;

  // 1. Exact match: make + model + engine (within tolerance) + fuel
  if (engineCapacity && normFuel) {
    const exact = sameMake.find(
      (e) =>
        normalizeStr(e.model) === normModel &&
        engineMatch(e.engineCapacity, engineCapacity) &&
        normalizeStr(e.fuelType) === normFuel
    );
    if (exact) {
      return {
        combinedMpg: exact.combinedMpg,
        urbanMpg: exact.urbanMpg,
        extraUrbanMpg: exact.extraUrbanMpg,
        estimatedAnnualCost: calculateAnnualCost(exact.combinedMpg, fuelType),
        matchType: "exact",
        matchedModel: exact.model,
        ...extendedFields(exact),
      };
    }
  }

  // 2. Best model match + fuel (with engine preference)
  if (normFuel) {
    const sameFuel = sameMake.filter((e) => normalizeStr(e.fuelType) === normFuel);
    const match = bestMatch(sameFuel, normModel, engineCapacity, bodyStyleHint);
    if (match) {
      return {
        combinedMpg: match.combinedMpg,
        urbanMpg: match.urbanMpg,
        extraUrbanMpg: match.extraUrbanMpg,
        estimatedAnnualCost: calculateAnnualCost(match.combinedMpg, fuelType),
        matchType: "model-fuel",
        matchedModel: match.model,
        ...extendedFields(match),
      };
    }
  }

  // 3. Best model match only (any fuel)
  const match = bestMatch(sameMake, normModel, engineCapacity, bodyStyleHint);
  if (match) {
    return {
      combinedMpg: match.combinedMpg,
      urbanMpg: match.urbanMpg,
      extraUrbanMpg: match.extraUrbanMpg,
      estimatedAnnualCost: calculateAnnualCost(match.combinedMpg, fuelType),
      matchType: "model-only",
      matchedModel: match.model,
      ...extendedFields(match),
    };
  }

  return null;
}
