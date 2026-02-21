// Ownership Cost Calculator — annual running cost aggregation

import {
  getDepreciationMultiplier,
  getMakeRetentionMultiplier,
} from "@/lib/valuation";
import { lookupBodyType } from "@/lib/body-type";
import newPricesData from "@/data/new-prices.json";
import evSpecsData from "@/data/ev-specs.json";

const MOT_FEE = 54.85;
const ASSUMED_ANNUAL_MILES = 8000;

// Annual maintenance base costs by vehicle segment (servicing, wear items, minor repairs)
const SEGMENT_MAINTENANCE_BASE: Record<string, number> = {
  city: 300,
  small: 350,
  family: 475,
  premium: 675,
  luxury: 1000,
  suv: 600,
  ev: 200,
  van: 500,
};

/** Age-based multiplier for maintenance costs — older vehicles cost more to maintain */
function getMaintenanceAgeMultiplier(vehicleAge: number): number {
  if (vehicleAge <= 3) return 0.7;
  if (vehicleAge <= 6) return 1.0;
  if (vehicleAge <= 10) return 1.3;
  return 1.6;
}

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
    maintenance: number | null;
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
  segment?: VehicleSegment;
}): OwnershipCostResult | null {
  const { vedAnnualRate, fuelAnnualCost, newPrice, vehicleAge, make, model, isOver3Years, segment } = params;

  const disclaimer =
    "Estimated annual running costs based on available data. " +
    "Excludes insurance, parking, and finance costs. " +
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

  // Calculate maintenance if segment is known
  let maintenance: number | null = null;
  if (segment) {
    const base = SEGMENT_MAINTENANCE_BASE[segment] ?? SEGMENT_MAINTENANCE_BASE.family;
    const ageMult = getMaintenanceAgeMultiplier(vehicleAge);
    maintenance = Math.round(base * ageMult);
  }

  // Check we have at least one cost component
  if (fuelAnnualCost == null && vedAnnualRate == null && depreciation == null && maintenance == null) {
    return null;
  }

  const fuel = fuelAnnualCost != null ? Math.round(fuelAnnualCost) : null;
  const ved = vedAnnualRate;

  let totalAnnual = 0;
  if (fuel != null) totalAnnual += fuel;
  if (ved != null) totalAnnual += ved;
  if (depreciation != null) totalAnnual += depreciation;
  if (maintenance != null) totalAnnual += maintenance;
  if (motFee != null) totalAnnual += motFee;

  const costPerMile = totalAnnual / ASSUMED_ANNUAL_MILES;
  const monthlyCost = Math.round(totalAnnual / 12);
  const dailyCost = Math.round((totalAnnual / 365) * 100) / 100;

  // Build exclusion note
  const excluded: string[] = ["insurance", "parking"];
  if (maintenance == null) excluded.unshift("servicing", "repairs");
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
      maintenance,
    },
    hasDepreciation: depreciation != null,
    hasFuel: fuel != null,
    hasVed: ved != null,
    excludedNote,
    disclaimer,
  };
}

// ── Vehicle Segment Classification & Benchmarks ──

export type VehicleSegment = "city" | "small" | "family" | "premium" | "luxury" | "suv" | "ev" | "van";

const SEGMENT_LABELS: Record<VehicleSegment, string> = {
  city: "City Car",
  small: "Small Car",
  family: "Family Car",
  premium: "Premium Car",
  luxury: "Luxury Car",
  suv: "SUV / Crossover",
  ev: "Electric Vehicle",
  van: "Van / Commercial",
};

// Representative annual fuel costs per segment (8,000 mi/yr, UK 2025 fuel prices)
const SEGMENT_FUEL_ESTIMATE: Record<VehicleSegment, number> = {
  city: 900, small: 1000, family: 1150, premium: 1300,
  luxury: 1500, suv: 1350, ev: 600, van: 1400,
};

const VED_STANDARD = 195; // Post-2017 standard rate
const BENCHMARK_AGE = 5;  // Typical used-car age for comparison

// Build EV model lookup from ev-specs data
type EvEntry = { make: string; model: string };
const evSet = new Set<string>();
for (const e of evSpecsData as EvEntry[]) {
  evSet.add(`${e.make.toUpperCase()}|${e.model.toUpperCase()}`);
}

function isEvModel(make: string, model: string): boolean {
  const mk = make.toUpperCase();
  const md = model.toUpperCase();
  if (evSet.has(`${mk}|${md}`)) return true;
  // Check if any EV spec starts with this model (e.g. "MODEL 3" matches "MODEL 3 LONG RANGE")
  for (const key of evSet) {
    const [evMake, evModel] = key.split("|");
    if (evMake === mk && evModel.startsWith(md)) return true;
  }
  return false;
}

type NewPriceEntry = { make: string; model: string; newPrice: number };

function computeSegmentMedians(): Record<VehicleSegment, { label: string; cost: number }> {
  const costsBySegment: Record<VehicleSegment, number[]> = {
    city: [], small: [], family: [], premium: [],
    luxury: [], suv: [], ev: [], van: [],
  };

  // Deduplicate by make|model (some entries appear twice for lookup matching)
  const seen = new Set<string>();
  for (const entry of newPricesData as NewPriceEntry[]) {
    const key = `${entry.make}|${entry.model}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const ev = isEvModel(entry.make, entry.model);
    const bodyType = lookupBodyType(entry.make, entry.model);
    const segment = classifyVehicleSegment({
      fuelType: ev ? "ELECTRICITY" : undefined,
      bodyType,
      newPrice: entry.newPrice,
    });
    const fuelCost = ev ? SEGMENT_FUEL_ESTIMATE.ev : SEGMENT_FUEL_ESTIMATE[segment];
    const result = calculateOwnershipCost({
      vedAnnualRate: VED_STANDARD,
      fuelAnnualCost: fuelCost,
      newPrice: entry.newPrice,
      vehicleAge: BENCHMARK_AGE,
      make: entry.make,
      model: entry.model,
      isOver3Years: true,
      segment,
    });

    if (result) {
      costsBySegment[segment].push(result.totalAnnual);
    }
  }

  const output = {} as Record<VehicleSegment, { label: string; cost: number }>;
  for (const seg of Object.keys(SEGMENT_LABELS) as VehicleSegment[]) {
    const costs = costsBySegment[seg].sort((a, b) => a - b);
    const median = costs.length > 0
      ? costs[Math.floor(costs.length / 2)]
      : 0;
    output[seg] = { label: SEGMENT_LABELS[seg], cost: median };
  }
  return output;
}

/** Segment medians computed from ~140 popular UK models using the same formula */
export const SEGMENT_MEDIAN_COSTS = computeSegmentMedians();

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
