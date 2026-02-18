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
  motAutoAdjustmentPercent: number;
  colourAdjustmentPercent: number;
  ebayTotalListings: number | null;
  ebayMinPrice: number | null;
  ebayMaxPrice: number | null;
  ebayDominantTransmission: string | null;
  ebayDominantBodyType: string | null;
  ebayYearWidened: boolean;
  ebayQ1Price: number | null;
  ebayQ3Price: number | null;
  marketSupply: "good" | "moderate" | "limited" | null;
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

// ── Make average fallback prices ────────────────────────────────────────────

const MAKE_AVERAGES: Record<string, number> = {
  FORD: 24000,
  VOLKSWAGEN: 28000,
  BMW: 40000,
  "MERCEDES-BENZ": 42000,
  AUDI: 38000,
  TOYOTA: 28000,
  VAUXHALL: 22000,
  NISSAN: 24000,
  HYUNDAI: 26000,
  KIA: 26000,
  PEUGEOT: 22000,
  RENAULT: 22000,
  CITROEN: 20000,
  HONDA: 26000,
  MAZDA: 26000,
  VOLVO: 38000,
  "LAND ROVER": 50000,
  JAGUAR: 40000,
  SKODA: 24000,
  SEAT: 22000,
  FIAT: 18000,
  MINI: 24000,
  SUZUKI: 18000,
  MG: 24000,
  TESLA: 44000,
  PORSCHE: 70000,
  LEXUS: 40000,
  SUBARU: 32000,
  MITSUBISHI: 26000,
  DACIA: 16000,
  CUPRA: 32000,
  SMART: 14000,
  DS: 30000,
  GENESIS: 45000,
  POLESTAR: 42000,
  BYD: 34000,
};

const DEFAULT_NEW_PRICE = 25000;

// ── New price lookup ────────────────────────────────────────────────────────

export function lookupNewPrice(
  data: NewPriceEntry[],
  make?: string,
  model?: string,
): number | null {
  if (!make) return null;

  const normMake = normalizeStr(make);
  const normModel = model ? normalizeStr(model) : "";

  if (data.length > 0 && normModel) {
    // Exact match first
    const exact = data.find(
      (e) => normalizeStr(e.make) === normMake && normalizeStr(e.model) === normModel,
    );
    if (exact) return exact.newPrice;

    // Fuzzy: model contains or is contained (strip trim/variant)
    const sameMake = data.filter((e) => normalizeStr(e.make) === normMake);
    const fuzzy = sameMake.find(
      (e) => normModel.includes(normalizeStr(e.model)) || normalizeStr(e.model).includes(normModel),
    );
    if (fuzzy) return fuzzy.newPrice;
  }

  // Fallback: make average
  if (MAKE_AVERAGES[normMake]) return MAKE_AVERAGES[normMake];

  // Last resort
  return DEFAULT_NEW_PRICE;
}

// ── Depreciation curve ──────────────────────────────────────────────────────

export function getDepreciationMultiplier(vehicleAge: number): number {
  if (vehicleAge <= 0) return 1;

  // Annual depreciation rates — each year reduces the value by this percentage
  const rates = [0.25, 0.15, 0.12, 0.10, 0.08, 0.07, 0.06];
  let value = 1;
  for (let y = 0; y < vehicleAge; y++) {
    const rate = y < rates.length ? rates[y] : 0.05;
    value *= (1 - rate);
  }
  // Floor at 5% of original — no car depreciates to zero
  return Math.max(value, 0.05);
}

// ── Make retention multiplier ───────────────────────────────────────────────

const RETENTION: Record<string, number> = {
  PORSCHE: 1.10, TOYOTA: 1.10, LEXUS: 1.10, TESLA: 1.10,
  VAUXHALL: 0.90, PEUGEOT: 0.90, CITROEN: 0.90,
  RENAULT: 0.90, FIAT: 0.90, SEAT: 0.90,
  DS: 0.80, SMART: 0.80, INFINITI: 0.80,
  CHRYSLER: 0.80, CHEVROLET: 0.80,
};

export function getMakeRetentionMultiplier(make?: string, model?: string): number {
  if (!make) return 1.0;
  const norm = normalizeStr(make);
  // Land Rover Defender has strong retention; other LR models don't
  if (norm === "LAND ROVER") {
    if (model && normalizeStr(model).includes("DEFENDER")) return 1.10;
    return 1.00;
  }
  return RETENTION[norm] ?? 1.0;
}

// ── Mileage adjustment ─────────────────────────────────────────────────────

const EXPECTED_MILES_PER_YEAR = 8000;

export function getMileageAdjustment(currentMileage: number | null, vehicleAge: number): number {
  if (!currentMileage || vehicleAge <= 0) return 0;

  const expectedMileage = vehicleAge * EXPECTED_MILES_PER_YEAR;
  const ratio = currentMileage / expectedMileage;

  if (ratio < 0.60) return 8;       // Significantly below average
  if (ratio < 0.85) return 4;       // Below average
  if (ratio <= 1.15) return 0;      // Average
  if (ratio <= 1.40) return -5;     // Above average
  return -12;                        // Significantly above average
}

// ── MOT auto-adjustment ─────────────────────────────────────────────────────

export function getMotAutoAdjustment(advisoryCount: number, recentFailure: boolean): number {
  let adj = 0;
  if (recentFailure) {
    adj -= 8;
  } else if (advisoryCount >= 5) {
    adj -= 5;
  } else if (advisoryCount <= 1) {
    adj += 3;
  }
  // 2-4 advisories: 0%
  return adj;
}

// ── Condition adjustment ────────────────────────────────────────────────────

export function getConditionAdjustment(
  condition: ConditionInputs | null,
  advisoryCount: number,
  recentFailure: boolean,
): { total: number; motAuto: number } {
  const motAuto = getMotAutoAdjustment(advisoryCount, recentFailure);

  if (!condition) return { total: motAuto, motAuto };

  let adj = motAuto;

  // Service history
  if (condition.serviceHistory === "full") adj += 8;
  else if (condition.serviceHistory === "none") adj -= 10;
  // "partial" = baseline (0)

  // Bodywork
  if (condition.bodywork === "excellent") adj += 5;
  else if (condition.bodywork === "fair") adj -= 8;
  else if (condition.bodywork === "poor") adj -= 15;
  // "good" = baseline (0)

  // Interior
  if (condition.interior === "excellent") adj += 3;
  else if (condition.interior === "worn") adj -= 5;
  // "good" = baseline (0)

  // Owners
  if (condition.owners === "1") adj += 3;
  else if (condition.owners === "4+") adj -= 5;
  // "2-3" = baseline (0)

  // Accidents
  if (condition.accidents === "minor") adj -= 10;
  else if (condition.accidents === "significant") adj -= 20;
  // "none" = baseline (0)

  return { total: adj, motAuto };
}

// ── Colour adjustment ───────────────────────────────────────────────────────

const COLOUR_ADJUSTMENTS: Record<string, number> = {
  BLACK: 0, WHITE: 0, SILVER: 0, GREY: 0,
  BLUE: -1, RED: -1,
  GREEN: -3, YELLOW: -4, ORANGE: -4,
  BROWN: -3, BEIGE: -2, PURPLE: -4,
  GOLD: -2, MAROON: -2, BRONZE: -2,
};

export function getColourAdjustment(colour?: string): number {
  if (!colour) return 0;
  return COLOUR_ADJUSTMENTS[colour.toUpperCase()] ?? -2;
}

// ── Depreciation baseline ───────────────────────────────────────────────────

export function calculateDepreciationBaseline(
  newPrice: number,
  vehicleAge: number,
  make: string | undefined,
  model: string | undefined,
  mileage: number | null,
): number {
  const depMult = getDepreciationMultiplier(vehicleAge);
  const retMult = getMakeRetentionMultiplier(make, model);
  const mileageAdj = getMileageAdjustment(mileage, vehicleAge);

  const baseValue = newPrice * depMult * retMult;
  const mileageAdjusted = baseValue * (1 + mileageAdj / 100);

  return Math.max(roundTo50(mileageAdjusted), 250);
}

// ── Combine valuation layers ────────────────────────────────────────────────

export function combineValuationLayers(
  depreciationEstimate: number | null,
  ebayMedian: number | null,
  ebayListingCount: number,
  cacheMedian: number | null,
  cacheEntryCount: number,
  conditionAdjPercent: number,
  colourAdjPercent: number,
  ebayTotalListings: number | null,
  ebayMinPrice: number | null,
  ebayMaxPrice: number | null,
  ebayDominantTransmission: string | null,
  ebayDominantBodyType: string | null,
  ebayYearWidened: boolean,
  ebayQ1Price: number | null,
  ebayQ3Price: number | null,
): ValuationResult | null {
  if (!depreciationEstimate) return null;

  const disclaimer =
    "This is an estimated guide value based on depreciation calculations, " +
    "publicly advertised vehicle prices (adjusted from asking prices to " +
    "reflect typical transaction values), and aggregated market data. It is " +
    "not a professional valuation and should not be relied upon as such. " +
    "Actual vehicle value depends on exact specification, condition, service " +
    "history, local market conditions, and provenance.";

  let estimatedValue: number;
  let confidence: ValuationConfidence;
  let fallbackPercent: number;
  const sources: string[] = ["depreciation model"];

  const totalOnMarket = ebayTotalListings || 0;

  if (ebayMedian && cacheMedian) {
    // All three sources — reduce eBay weight when year widened
    if (ebayYearWidened) {
      estimatedValue = depreciationEstimate * 0.30 + ebayMedian * 0.30 + cacheMedian * 0.40;
    } else {
      estimatedValue = depreciationEstimate * 0.20 + ebayMedian * 0.40 + cacheMedian * 0.40;
    }
    confidence = totalOnMarket >= 100 ? "high" : "medium";
    fallbackPercent = confidence === "high" ? 8 : 12;
    sources.push(
      `${totalOnMarket > ebayListingCount ? totalOnMarket : ebayListingCount} similar vehicle${ebayListingCount !== 1 ? "s" : ""} on the market`,
      "recent valuations",
    );
  } else if (ebayMedian) {
    // Depreciation + eBay — give depreciation more weight when year widened
    if (ebayYearWidened) {
      estimatedValue = depreciationEstimate * 0.55 + ebayMedian * 0.45;
      confidence = totalOnMarket >= 5 ? "medium" : "low";
      fallbackPercent = confidence === "medium" ? 15 : 18;
    } else {
      estimatedValue = depreciationEstimate * 0.35 + ebayMedian * 0.65;
      confidence = totalOnMarket >= 100 ? "high" : totalOnMarket >= 20 ? "medium" : "low";
      fallbackPercent = confidence === "high" ? 8 : 12;
    }
    sources.push(
      `${totalOnMarket > ebayListingCount ? totalOnMarket : ebayListingCount} similar vehicle${ebayListingCount !== 1 ? "s" : ""} on the market`,
    );
  } else if (cacheMedian) {
    // Depreciation + cache
    estimatedValue = depreciationEstimate * 0.25 + cacheMedian * 0.75;
    confidence = "medium";
    fallbackPercent = 12;
    sources.push("recent valuations");
  } else {
    // Depreciation only
    estimatedValue = depreciationEstimate;
    confidence = "low";
    fallbackPercent = 20;
  }

  // Widened year search caps confidence at medium
  if (ebayYearWidened && confidence === "high") {
    confidence = "medium";
  }

  // ── Compute range (IQR path vs fallback percentage) ──────────────────────
  let rangePercent: number;
  const hasIQR = ebayQ1Price != null && ebayQ3Price != null && ebayListingCount >= 5;

  if (hasIQR) {
    // IQR half-width as percentage of estimatedValue
    const iqrHalfRange = (ebayQ3Price - ebayQ1Price) / 2;
    const iqrPercent = Math.max((iqrHalfRange / estimatedValue) * 100, 3); // min 3% half-range

    // Blend IQR with fallback by confidence
    let blended: number;
    if (confidence === "high") {
      blended = iqrPercent; // IQR direct
    } else if (confidence === "medium") {
      blended = iqrPercent * 0.70 + fallbackPercent * 0.30;
    } else {
      blended = iqrPercent * 0.50 + fallbackPercent * 0.50;
    }

    // Safety cap: never wider than fallback; safety floor: min 3% half-range (6% total spread)
    rangePercent = Math.max(Math.min(blended, fallbackPercent), 3);
  } else {
    rangePercent = fallbackPercent;
  }

  // Apply condition + colour adjustments
  const condAdj = 1 + conditionAdjPercent / 100;
  const colAdj = 1 + colourAdjPercent / 100;
  estimatedValue = estimatedValue * condAdj * colAdj;

  const rangeLow = roundTo50(estimatedValue * (1 - rangePercent / 100));
  const rangeHigh = roundTo50(estimatedValue * (1 + rangePercent / 100));

  // Market supply categorisation
  let marketSupply: "good" | "moderate" | "limited" | null = null;
  if (totalOnMarket > 0) {
    if (totalOnMarket >= 100) marketSupply = "good";
    else if (totalOnMarket >= 20) marketSupply = "moderate";
    else marketSupply = "limited";
  }

  return {
    rangeLow: Math.max(rangeLow, 100),
    rangeHigh,
    estimatedValue: roundTo50(estimatedValue),
    confidence,
    sources,
    mileageAdjustmentPercent: 0, // set by caller
    conditionAdjustmentPercent: conditionAdjPercent,
    motAutoAdjustmentPercent: 0, // set by caller
    colourAdjustmentPercent: colourAdjPercent,
    ebayTotalListings: totalOnMarket || null,
    ebayMinPrice,
    ebayMaxPrice,
    ebayDominantTransmission,
    ebayDominantBodyType,
    ebayYearWidened,
    ebayQ1Price: ebayQ1Price ?? null,
    ebayQ3Price: ebayQ3Price ?? null,
    marketSupply,
    disclaimer,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function roundTo50(value: number): number {
  return Math.round(value / 50) * 50;
}
