// Vehicle valuation estimator — depreciation model + market data combination

export type ValuationConfidence = "high" | "medium" | "low" | "estimate-only";

export type ValuationResult = {
  rangeLow: number;
  rangeHigh: number;
  estimatedValue: number;
  confidence: ValuationConfidence;
  sources: string[];
  mileageAdjustmentPercent: number;
  conditionAdjustmentPercent: number;
  disclaimer: string;
};

export type ConditionInputs = {
  serviceHistory: "full" | "partial" | "none";
  bodywork: "excellent" | "good" | "fair" | "poor";
  interior: "excellent" | "good" | "worn";
  owners: "1" | "2-3" | "4+";
  accidents: "none" | "minor" | "significant";
};

type NewPriceEntry = { make: string; model: string; newPrice: number };

function normalizeStr(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

// ── New price lookup ────────────────────────────────────────────────────────

export function lookupNewPrice(
  data: NewPriceEntry[],
  make?: string,
  model?: string,
): number | null {
  if (!make || !model || data.length === 0) return null;

  const normMake = normalizeStr(make);
  const normModel = normalizeStr(model);

  // Exact match first
  const exact = data.find(
    (e) => normalizeStr(e.make) === normMake && normalizeStr(e.model) === normModel,
  );
  if (exact) return exact.newPrice;

  // Fuzzy: model contains or is contained
  const sameMake = data.filter((e) => normalizeStr(e.make) === normMake);
  const fuzzy = sameMake.find(
    (e) => normModel.includes(normalizeStr(e.model)) || normalizeStr(e.model).includes(normModel),
  );
  if (fuzzy) return fuzzy.newPrice;

  return null;
}

// ── Depreciation curve ──────────────────────────────────────────────────────

export function getDepreciationMultiplier(vehicleAge: number): number {
  if (vehicleAge <= 0) return 1;

  // Compound depreciation — each year multiplies the running value
  const yearFactors = [0.75, 0.85, 0.88, 0.90, 0.92, 0.93, 0.94];
  let value = 1;
  for (let y = 0; y < vehicleAge; y++) {
    const factor = y < yearFactors.length ? yearFactors[y] : 0.95;
    value *= factor;
  }
  return value;
}

// ── Make retention multiplier ───────────────────────────────────────────────

const HIGH_RETENTION = new Set(["PORSCHE", "TOYOTA", "LEXUS", "TESLA", "LAND ROVER"]);
const LOW_RETENTION = new Set(["VAUXHALL", "PEUGEOT", "CITROEN", "RENAULT", "FIAT", "SEAT"]);
const VERY_LOW_RETENTION = new Set(["DS", "SMART", "INFINITI", "CHRYSLER", "CHEVROLET"]);

export function getMakeRetentionMultiplier(make?: string): number {
  if (!make) return 1.0;
  const norm = normalizeStr(make);
  if (HIGH_RETENTION.has(norm)) return 1.10;
  if (LOW_RETENTION.has(norm)) return 0.90;
  if (VERY_LOW_RETENTION.has(norm)) return 0.80;
  return 1.0;
}

// ── Mileage adjustment ─────────────────────────────────────────────────────

const EXPECTED_MILES_PER_YEAR = 8000;

export function getMileageAdjustment(currentMileage: number | null, vehicleAge: number): number {
  if (!currentMileage || vehicleAge <= 0) return 0;

  const expectedMileage = vehicleAge * EXPECTED_MILES_PER_YEAR;
  const ratio = currentMileage / expectedMileage;

  if (ratio < 0.6) return 8;
  if (ratio < 0.85) return 4;
  if (ratio <= 1.15) return 0;
  if (ratio <= 1.4) return -5;
  return -12;
}

// ── Condition adjustment ────────────────────────────────────────────────────

export function getConditionAdjustment(
  condition: ConditionInputs | null,
  advisoryCount: number,
  recentFailure: boolean,
): number {
  let adj = 0;

  // Auto MOT-based adjustments
  if (advisoryCount > 5) adj -= 3;
  else if (advisoryCount > 2) adj -= 1;
  if (recentFailure) adj -= 4;

  if (!condition) return adj;

  // Service history
  if (condition.serviceHistory === "full") adj += 5;
  else if (condition.serviceHistory === "none") adj -= 8;

  // Bodywork
  if (condition.bodywork === "excellent") adj += 3;
  else if (condition.bodywork === "fair") adj -= 3;
  else if (condition.bodywork === "poor") adj -= 8;

  // Interior
  if (condition.interior === "excellent") adj += 2;
  else if (condition.interior === "worn") adj -= 3;

  // Owners
  if (condition.owners === "1") adj += 3;
  else if (condition.owners === "4+") adj -= 4;

  // Accidents
  if (condition.accidents === "minor") adj -= 5;
  else if (condition.accidents === "significant") adj -= 15;

  return adj;
}

// ── Depreciation baseline ───────────────────────────────────────────────────

export function calculateDepreciationBaseline(
  newPrice: number,
  vehicleAge: number,
  make: string | undefined,
  mileage: number | null,
): number {
  const depMult = getDepreciationMultiplier(vehicleAge);
  const retMult = getMakeRetentionMultiplier(make);
  const mileageAdj = getMileageAdjustment(mileage, vehicleAge);

  const baseValue = newPrice * depMult * retMult;
  const mileageAdjusted = baseValue * (1 + mileageAdj / 100);

  return Math.max(roundTo50(mileageAdjusted), 250);
}

// ── Combine valuation layers ────────────────────────────────────────────────

export function combineValuationLayers(
  depreciationEstimate: number | null,
  ebayMedian: number | null,
  cacheMedian: number | null,
  conditionAdjPercent: number,
): ValuationResult | null {
  if (!depreciationEstimate) return null;

  const disclaimer =
    "This is a rough estimate based on depreciation modelling and market data. " +
    "Actual value depends on condition, specification, service history and local demand. " +
    "This is not a formal valuation.";

  let estimatedValue: number;
  let confidence: ValuationConfidence;
  let rangePercent: number;
  const sources: string[] = ["depreciation model"];

  if (ebayMedian && cacheMedian) {
    // All three sources
    estimatedValue = depreciationEstimate * 0.20 + ebayMedian * 0.40 + cacheMedian * 0.40;
    confidence = "high";
    rangePercent = 10;
    sources.push("similar vehicles on market", "recent valuations");
  } else if (ebayMedian) {
    // Depreciation + eBay
    estimatedValue = depreciationEstimate * 0.35 + ebayMedian * 0.65;
    confidence = "medium";
    rangePercent = 15;
    sources.push("similar vehicles on market");
  } else if (cacheMedian) {
    // Depreciation + cache
    estimatedValue = depreciationEstimate * 0.25 + cacheMedian * 0.75;
    confidence = "medium";
    rangePercent = 15;
    sources.push("recent valuations");
  } else {
    // Depreciation only
    estimatedValue = depreciationEstimate;
    confidence = "estimate-only";
    rangePercent = 25;
  }

  // Apply condition adjustment
  const condAdj = 1 + conditionAdjPercent / 100;
  estimatedValue = estimatedValue * condAdj;

  const rangeLow = roundTo50(estimatedValue * (1 - rangePercent / 100));
  const rangeHigh = roundTo50(estimatedValue * (1 + rangePercent / 100));

  return {
    rangeLow: Math.max(rangeLow, 100),
    rangeHigh,
    estimatedValue: roundTo50(estimatedValue),
    confidence,
    sources,
    mileageAdjustmentPercent: 0, // set by caller
    conditionAdjustmentPercent: conditionAdjPercent,
    disclaimer,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function roundTo50(value: number): number {
  return Math.round(value / 50) * 50;
}
