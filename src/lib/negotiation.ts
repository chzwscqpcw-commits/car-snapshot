// Negotiation helper — calculates a suggested discount range
// based on MOT advisories, vehicle age, mileage, and valuation.
// Pure function — no data file needed.

export type NegotiationInput = {
  totalEstimatedCost: { low: number; high: number };
  motReadinessScore: "green" | "amber" | "red";
  advisoryCount: number;
  estimatedValue: number;
  avgMilesPerYear: number | null;
  vehicleAge: number;
};

export type NegotiationResult = {
  suggestedDiscountPercent: { low: number; high: number };
  estimatedSaving: { low: number; high: number };
  reasons: string[];
  confidence: "high" | "medium" | "low";
};

/**
 * Calculate a negotiation discount range.
 * Returns null if no valuation exists or there are no advisories to negotiate on.
 */
export function calculateNegotiation(input: NegotiationInput): NegotiationResult | null {
  const { totalEstimatedCost, motReadinessScore, advisoryCount, estimatedValue, avgMilesPerYear, vehicleAge } = input;

  // Need both a valuation and advisories to negotiate
  if (!estimatedValue || estimatedValue <= 0 || advisoryCount <= 0) return null;

  const reasons: string[] = [];
  let discountLow = 0;
  let discountHigh = 0;

  // 1. Base discount: repair cost as % of vehicle value (capped at 15%)
  const repairPercent = ((totalEstimatedCost.low + totalEstimatedCost.high) / 2) / estimatedValue * 100;
  const repairDiscount = Math.min(repairPercent, 15);
  if (repairDiscount > 0.5) {
    const lowCost = totalEstimatedCost.low;
    const highCost = totalEstimatedCost.high;
    discountLow += Math.max(repairDiscount * 0.6, 1);
    discountHigh += repairDiscount;
    reasons.push(`£${lowCost}–£${highCost} in estimated repair costs from ${advisoryCount} advisory item${advisoryCount !== 1 ? "s" : ""}`);
  }

  // 2. High mileage adjustment (+2–3%)
  if (avgMilesPerYear !== null && avgMilesPerYear > 12000) {
    discountLow += 2;
    discountHigh += 3;
    reasons.push(`Above-average mileage (${avgMilesPerYear.toLocaleString()} miles/year)`);
  }

  // 3. Vehicle age adjustment (+1–2% if 5+ years)
  if (vehicleAge >= 5) {
    discountLow += 1;
    discountHigh += 2;
    reasons.push(`Vehicle is ${vehicleAge} years old — higher maintenance likelihood`);
  }

  // 4. MOT readiness "red" adjustment (+2–3%)
  if (motReadinessScore === "red") {
    discountLow += 2;
    discountHigh += 3;
    reasons.push("MOT readiness rated 'needs attention' — some items may fail next test");
  }

  // Floor 0%, cap 25%
  discountLow = Math.max(0, Math.min(Math.round(discountLow * 10) / 10, 25));
  discountHigh = Math.max(0, Math.min(Math.round(discountHigh * 10) / 10, 25));

  // Ensure low <= high
  if (discountLow > discountHigh) {
    [discountLow, discountHigh] = [discountHigh, discountLow];
  }

  // If both are 0, nothing to negotiate
  if (discountHigh === 0) return null;

  const savingLow = Math.round(estimatedValue * discountLow / 100);
  const savingHigh = Math.round(estimatedValue * discountHigh / 100);

  // Confidence based on how much data we have
  let confidence: NegotiationResult["confidence"] = "low";
  const factorCount = [
    totalEstimatedCost.high > 0,
    avgMilesPerYear !== null && avgMilesPerYear > 0,
    vehicleAge >= 3,
  ].filter(Boolean).length;
  if (factorCount >= 3) confidence = "high";
  else if (factorCount >= 2) confidence = "medium";

  return {
    suggestedDiscountPercent: { low: discountLow, high: discountHigh },
    estimatedSaving: { low: savingLow, high: savingHigh },
    reasons,
    confidence,
  };
}
