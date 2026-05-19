import type { VehicleSegment } from "@/lib/ownership-cost";

/**
 * Lightweight insurance-cost estimator. Produces a ballpark figure (not a
 * quote) from the vehicle's segment and a few easy driver inputs. Designed
 * to be honest about its limits — real premiums vary by hundreds of pounds
 * for the same car. Use the result to set expectations, then drive users to
 * a real comparison site for an actual quote.
 *
 * Baselines and multipliers are anchored to publicly published UK averages
 * (ABI, MoneySavingExpert 2025 figures). Adjust here when you have better
 * data — every consumer of this lib will update automatically.
 */

export type AgeBand =
  | "17-21"
  | "22-24"
  | "25-29"
  | "30-49"
  | "50-65"
  | "65+";

export type LocationBand =
  | "inner-london"
  | "outer-london"
  | "suburban"
  | "rural";

export type NcdBand = "0" | "1-2" | "3-5" | "6-9" | "10+";

export type OccupationBand = "lower" | "standard" | "higher";

export type InsuranceInputs = {
  ageBand?: AgeBand;
  locationBand?: LocationBand;
  ncdBand?: NcdBand;
  occupationBand?: OccupationBand;
};

export type InsuranceEstimate = {
  /** Final annual estimate in pounds, rounded. */
  estimatedAnnual: number;
  /** Pre-multiplier baseline for the vehicle's segment. */
  baseline: number;
  /** Combined multiplier (product of all applied factors). */
  multiplier: number;
  /** True once the user has answered at least one Q&A pill. */
  isCustomised: boolean;
  appliedBreakdown: {
    age: number;
    location: number;
    ncd: number;
    occupation: number;
    mileage: number;
  };
};

/** Segment baselines (£ per year) — anchored to ABI 2025 averages by car type. */
const SEGMENT_BASELINES: Record<VehicleSegment, number> = {
  city: 450,
  small: 550,
  family: 600,
  premium: 780,
  luxury: 1200,
  suv: 720,
  ev: 720,
  van: 900,
};

const AGE_MULTIPLIER: Record<AgeBand, number> = {
  "17-21": 3.2,
  "22-24": 2.0,
  "25-29": 1.4,
  "30-49": 1.0,
  "50-65": 0.85,
  "65+": 1.1,
};

const LOCATION_MULTIPLIER: Record<LocationBand, number> = {
  "inner-london": 1.55,
  "outer-london": 1.3,
  suburban: 1.0,
  rural: 0.85,
};

const NCD_MULTIPLIER: Record<NcdBand, number> = {
  "0": 1.5,
  "1-2": 1.2,
  "3-5": 1.0,
  "6-9": 0.85,
  "10+": 0.72,
};

const OCCUPATION_MULTIPLIER: Record<OccupationBand, number> = {
  lower: 0.92,
  standard: 1.0,
  higher: 1.45,
};

function mileageMultiplier(milesPerYear: number): number {
  if (milesPerYear < 5000) return 0.85;
  if (milesPerYear < 10000) return 1.0;
  if (milesPerYear < 15000) return 1.1;
  if (milesPerYear < 25000) return 1.25;
  return 1.4;
}

export function estimateInsurance(
  segment: VehicleSegment,
  inputs: InsuranceInputs | null,
  milesPerYear: number
): InsuranceEstimate {
  const baseline = SEGMENT_BASELINES[segment] ?? SEGMENT_BASELINES.family;

  const age = inputs?.ageBand ? AGE_MULTIPLIER[inputs.ageBand] : 1;
  const location = inputs?.locationBand ? LOCATION_MULTIPLIER[inputs.locationBand] : 1;
  const ncd = inputs?.ncdBand ? NCD_MULTIPLIER[inputs.ncdBand] : 1;
  const occupation = inputs?.occupationBand
    ? OCCUPATION_MULTIPLIER[inputs.occupationBand]
    : 1;
  const mileage = mileageMultiplier(milesPerYear);

  const multiplier = age * location * ncd * occupation * mileage;
  const estimatedAnnual = Math.round(baseline * multiplier);

  const isCustomised =
    !!inputs &&
    !!(
      inputs.ageBand ||
      inputs.locationBand ||
      inputs.ncdBand ||
      inputs.occupationBand
    );

  return {
    estimatedAnnual,
    baseline,
    multiplier,
    isCustomised,
    appliedBreakdown: { age, location, ncd, occupation, mileage },
  };
}
