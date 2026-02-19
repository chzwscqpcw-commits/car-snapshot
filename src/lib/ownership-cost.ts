// Ownership Cost Calculator — annual running cost aggregation

import {
  getDepreciationMultiplier,
  getMakeRetentionMultiplier,
} from "@/lib/valuation";

const MOT_FEE = 54.85;
const ASSUMED_ANNUAL_MILES = 8000;

export type OwnershipCostResult = {
  totalAnnual: number;
  costPerMile: number;
  monthlyCost: number;
  dailyCost: number;
  breakdown: {
    fuel: number | null;
    ved: number | null;
    depreciation: number | null;
    mot: number | null;
  };
  hasDepreciation: boolean;
  hasFuel: boolean;
  hasVed: boolean;
  excludedNote: string;
  disclaimer: string;
};

export function calculateOwnershipCost(params: {
  vedAnnualRate: number | null;
  fuelAnnualCost: number | null;
  newPrice: number | null;
  vehicleAge: number;
  make?: string;
  model?: string;
  isOver3Years: boolean;
}): OwnershipCostResult | null {
  const { vedAnnualRate, fuelAnnualCost, newPrice, vehicleAge, make, model, isOver3Years } = params;

  const disclaimer =
    "Estimated annual running costs based on available data. " +
    "Excludes insurance, servicing, repairs, parking, and finance costs. " +
    "Actual costs depend on your driving habits and circumstances.";

  // Calculate depreciation if newPrice available
  let depreciation: number | null = null;
  if (newPrice && vehicleAge >= 1) {
    const retention = getMakeRetentionMultiplier(make, model);
    const valueStart = newPrice * getDepreciationMultiplier(vehicleAge - 1) * retention;
    const valueEnd = newPrice * getDepreciationMultiplier(vehicleAge) * retention;
    depreciation = Math.round(valueStart - valueEnd);
    if (depreciation < 0) depreciation = 0;
  } else if (newPrice && vehicleAge === 0) {
    // First year depreciation
    const valueEnd = newPrice * getDepreciationMultiplier(1) * getMakeRetentionMultiplier(make, model);
    depreciation = Math.round(newPrice - valueEnd);
  }

  const motFee = isOver3Years ? MOT_FEE : null;

  // Check we have at least one cost component
  if (fuelAnnualCost == null && vedAnnualRate == null && depreciation == null) {
    return null;
  }

  const fuel = fuelAnnualCost != null ? Math.round(fuelAnnualCost) : null;
  const ved = vedAnnualRate;

  let totalAnnual = 0;
  if (fuel != null) totalAnnual += fuel;
  if (ved != null) totalAnnual += ved;
  if (depreciation != null) totalAnnual += depreciation;
  if (motFee != null) totalAnnual += motFee;

  const costPerMile = totalAnnual / ASSUMED_ANNUAL_MILES;
  const monthlyCost = Math.round(totalAnnual / 12);
  const dailyCost = Math.round((totalAnnual / 365) * 100) / 100;

  // Build exclusion note
  const excluded: string[] = ["insurance", "servicing", "repairs", "parking"];
  if (depreciation == null) excluded.unshift("depreciation");
  if (fuel == null) excluded.unshift("fuel");
  if (ved == null) excluded.unshift("road tax");
  const excludedNote = `Excludes: ${excluded.join(", ")}.`;

  return {
    totalAnnual: Math.round(totalAnnual),
    costPerMile: Math.round(costPerMile * 100) / 100,
    monthlyCost,
    dailyCost,
    breakdown: {
      fuel,
      ved,
      depreciation,
      mot: motFee != null ? Math.round(motFee) : null,
    },
    hasDepreciation: depreciation != null,
    hasFuel: fuel != null,
    hasVed: ved != null,
    excludedNote,
    disclaimer,
  };
}

// ── Vehicle Segment Classification & UK Average Benchmarks ──

export type VehicleSegment = "city" | "small" | "family" | "premium" | "luxury" | "suv" | "ev" | "van";

export const UK_AVERAGE_ANNUAL_COSTS: Record<VehicleSegment, { label: string; cost: number }> = {
  city:    { label: "City Car",         cost: 2400 },
  small:   { label: "Small Car",        cost: 3000 },
  family:  { label: "Family Car",       cost: 3600 },
  premium: { label: "Premium Car",      cost: 5000 },
  luxury:  { label: "Luxury Car",       cost: 7500 },
  suv:     { label: "SUV / Crossover",  cost: 4500 },
  ev:      { label: "Electric Vehicle", cost: 2800 },
  van:     { label: "Van / Commercial", cost: 4000 },
};

export function classifyVehicleSegment(params: {
  fuelType?: string;
  bodyType?: string | null;
  newPrice?: number | null;
  engineCapacity?: number;
}): VehicleSegment {
  const { fuelType, bodyType, newPrice, engineCapacity } = params;

  // EV by fuel type
  if (fuelType && /electric/i.test(fuelType)) return "ev";

  const bt = (bodyType ?? "").toUpperCase();

  // Van by body type
  if (/\bVAN\b|\bCOMMERCIAL\b|\bPANEL\b|\bPICK[\s-]*UP\b/i.test(bt)) return "van";

  // SUV by body type
  if (/SUV|CROSSOVER|4X4/i.test(bt)) return "suv";

  // Price-based tiers
  if (newPrice != null) {
    if (newPrice >= 60000) return "luxury";
    if (newPrice >= 38000) return "premium";
    if (newPrice >= 24000) return "family";
    if (newPrice >= 18000) return "small";
    return "city";
  }

  // Engine capacity fallback
  if (engineCapacity != null) {
    if (engineCapacity >= 3000) return "premium";
    if (engineCapacity >= 1800) return "family";
    if (engineCapacity >= 1200) return "small";
    return "city";
  }

  return "family";
}
