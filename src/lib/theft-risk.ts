// Theft risk rating lookup by make/model
// Data: aggregated from DVLA FOI, Home Office vehicle theft statistics
// Format: { "MAKE|MODEL": [theftCount, registeredCount] }

import theftData from "@/data/theft-risk.json";

const data = theftData as unknown as Record<string, [number, number]>;

const NATIONAL_AVERAGE = 5.5; // thefts per 1,000 registered vehicles

/**
 * OFF since 2026-10-11. theft-risk.json was never built from a real source:
 * round estimates added in Feb 2026, its 84 models summing to 88k thefts when
 * DVLA recorded ~55k for the whole UK in 2025 (RAV4: 420 here vs 1,319 per
 * DVLA). NATIONAL_AVERAGE above is ~3x the real rate. Every "Theft risk: High"
 * on a result, report or model guide was derived from it, so the lookup returns
 * null until the data is real — every caller already handles a null (it's what
 * an unmatched model returns).
 *
 * To turn it back on: obtain DVLA's make/model stolen-vehicle release (FOI
 * FOIR13058, 2014–2025, answered Feb 2026; DVLA doesn't publish responses, so
 * request it), divide by DfT VEH0120 licensed stock for the same models,
 * rewrite theft-risk.json as [thefts, licensed], recompute NATIONAL_AVERAGE,
 * and flip this flag. /stats/car-theft lost its charts at the same time.
 */
const THEFT_DATA_SOURCED = false;

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

const MAKE_ALIASES: Record<string, string> = {
  "MERCEDES": "MERCEDES BENZ",
  "MERCEDES-BENZ": "MERCEDES BENZ",
  "VW": "VOLKSWAGEN",
  "LANDROVER": "LAND ROVER",
};

export type TheftRiskResult = {
  theftsPer1000: number;
  rateMultiplier: number;
  riskCategory: "very-high" | "high" | "moderate" | "low" | "very-low";
  theftCount: number;
  registeredCount: number;
  nationalAverage: number;
};

function categorize(theftsPer1000: number): TheftRiskResult["riskCategory"] {
  const multiplier = theftsPer1000 / NATIONAL_AVERAGE;
  if (multiplier > 3) return "very-high";
  if (multiplier > 2) return "high";
  if (multiplier > 1) return "moderate";
  if (multiplier >= 0.5) return "low";
  return "very-low";
}

function buildResult(entry: [number, number]): TheftRiskResult {
  const [theftCount, registeredCount] = entry;
  const theftsPer1000 = Math.round((theftCount / registeredCount) * 10000) / 10;
  return {
    theftsPer1000,
    rateMultiplier: Math.round((theftsPer1000 / NATIONAL_AVERAGE) * 100) / 100,
    riskCategory: categorize(theftsPer1000),
    theftCount,
    registeredCount,
    nationalAverage: NATIONAL_AVERAGE,
  };
}

/**
 * Look up the theft risk rating for a make/model.
 * Uses the same normalize/alias/fuzzy pattern as mot-pass-rate.ts.
 */
export function lookupTheftRisk(make?: string, model?: string): TheftRiskResult | null {
  if (!THEFT_DATA_SOURCED) return null;
  if (!make || !model) return null;

  const normMake = normalize(make);
  const normModel = normalize(model);

  // Exact match
  const key = `${normMake}|${normModel}`;
  if (data[key]) return buildResult(data[key]);

  // Try make alias
  const aliasedMake = MAKE_ALIASES[normMake];
  if (aliasedMake) {
    const aliasKey = `${aliasedMake}|${normModel}`;
    if (data[aliasKey]) return buildResult(data[aliasKey]);
  }

  // Fuzzy: model contains lookup key's model or vice versa
  const tryMakes = aliasedMake ? [normMake, aliasedMake] : [normMake];
  for (const mk of tryMakes) {
    for (const [entryKey, entry] of Object.entries(data)) {
      const [entryMake, entryModel] = entryKey.split("|");
      if (entryMake !== mk) continue;
      if (normModel.includes(entryModel) || entryModel.includes(normModel)) {
        return buildResult(entry);
      }
    }
  }

  return null;
}
