// Fuel economy lookup and cost estimation

export type FuelEconomyEntry = {
  make: string;
  model: string;
  engineCapacity?: number;
  fuelType: string;
  combinedMpg: number;
  urbanMpg?: number;
  extraUrbanMpg?: number;
};

export type FuelEconomyResult = {
  combinedMpg: number;
  urbanMpg?: number;
  extraUrbanMpg?: number;
  estimatedAnnualCost: number;
  matchType: "exact" | "model-fuel" | "model-only";
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

export function lookupFuelEconomy(
  data: FuelEconomyEntry[],
  make?: string,
  model?: string,
  engineCapacity?: number,
  fuelType?: string
): FuelEconomyResult | null {
  if (!make || !model || data.length === 0) return null;

  const normMake = normalizeStr(make);
  const normModel = normalizeStr(model);

  // 1. Exact match: make + model + engine + fuel
  if (engineCapacity && fuelType) {
    const exact = data.find(
      (e) =>
        normalizeStr(e.make) === normMake &&
        normalizeStr(e.model) === normModel &&
        e.engineCapacity === engineCapacity &&
        normalizeStr(e.fuelType) === normalizeStr(fuelType)
    );
    if (exact) {
      return {
        combinedMpg: exact.combinedMpg,
        urbanMpg: exact.urbanMpg,
        extraUrbanMpg: exact.extraUrbanMpg,
        estimatedAnnualCost: calculateAnnualCost(exact.combinedMpg, fuelType),
        matchType: "exact",
      };
    }
  }

  // 2. Make + model + fuel
  if (fuelType) {
    const modelFuel = data.find(
      (e) =>
        normalizeStr(e.make) === normMake &&
        (normalizeStr(e.model) === normModel ||
          normalizeStr(e.model).includes(normModel) ||
          normModel.includes(normalizeStr(e.model))) &&
        normalizeStr(e.fuelType) === normalizeStr(fuelType)
    );
    if (modelFuel) {
      return {
        combinedMpg: modelFuel.combinedMpg,
        urbanMpg: modelFuel.urbanMpg,
        extraUrbanMpg: modelFuel.extraUrbanMpg,
        estimatedAnnualCost: calculateAnnualCost(modelFuel.combinedMpg, fuelType),
        matchType: "model-fuel",
      };
    }
  }

  // 3. Make + model only
  const modelOnly = data.find(
    (e) =>
      normalizeStr(e.make) === normMake &&
      (normalizeStr(e.model) === normModel ||
        normalizeStr(e.model).includes(normModel) ||
        normModel.includes(normalizeStr(e.model)))
  );
  if (modelOnly) {
    return {
      combinedMpg: modelOnly.combinedMpg,
      urbanMpg: modelOnly.urbanMpg,
      extraUrbanMpg: modelOnly.extraUrbanMpg,
      estimatedAnnualCost: calculateAnnualCost(modelOnly.combinedMpg, fuelType),
      matchType: "model-only",
    };
  }

  return null;
}
