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

  // Build exclusion note
  const excluded: string[] = ["insurance", "servicing", "repairs", "parking"];
  if (depreciation == null) excluded.unshift("depreciation");
  if (fuel == null) excluded.unshift("fuel");
  if (ved == null) excluded.unshift("road tax");
  const excludedNote = `Excludes: ${excluded.join(", ")}.`;

  return {
    totalAnnual: Math.round(totalAnnual),
    costPerMile: Math.round(costPerMile * 100) / 100,
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
