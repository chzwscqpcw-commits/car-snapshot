// Theft risk rating lookup by make/model
// Data: DVLA stolen-vehicle records (FOI FOIR13058) ÷ DfT VEH0120 licensed cars,
// built by scripts/process-theft-foi.py.
// Format: { "MAKE|MODEL": [cars stolen in the year, cars licensed at its Q4] }

import theftData from "@/data/theft-risk.json";
import theftStats from "@/data/theft-stats.json";

const data = theftData as unknown as Record<string, [number, number]>;

/** Thefts per 1,000 licensed cars across every car DVLA's records match to a model. */
const NATIONAL_AVERAGE = theftStats.nationalPer1000;

/**
 * Was OFF 2026-10-11 → 2026-10-12. The Feb 2026 theft-risk.json was round
 * estimates with no source: 84 models summing to 88k thefts against DVLA's
 * ~54k cars, and a NATIONAL_AVERAGE of 5.5 per 1,000 against a real 1.56. It
 * was rebuilt from DVLA's own make/model release, so ratings are back on.
 * Flip this off again if the data ever has to be withdrawn: every caller
 * already handles a null (it's what an unmatched model returns).
 */
const THEFT_DATA_SOURCED = true;

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

const MAKE_ALIASES: Record<string, string> = {
  "MERCEDES": "MERCEDES BENZ",
  "MERCEDES-BENZ": "MERCEDES BENZ",
  "VW": "VOLKSWAGEN",
  "LANDROVER": "LAND ROVER",
};

// DfT spells some models differently from the DVLA/MOT feeds and our guides:
// "ID.3" is ID3, "MAZDA3" is 3, an Evoque can arrive with make "RANGE ROVER".
// Compared with make prefix, spaces and punctuation removed.
const squash = (s: string) => s.replace(/[^A-Z0-9]/g, "");
const SQUASHED = new Map<string, [number, number]>();
for (const [k, entry] of Object.entries(data)) {
  const [mk, md] = k.split("|");
  const sk = `${squash(mk)}|${squash(md)}`;
  if (!SQUASHED.has(sk)) SQUASHED.set(sk, entry); // JSON is largest fleet first
}
function lookupSquashed(make: string, model: string): [number, number] | undefined {
  let mk = squash(make);
  let md = squash(model);
  if (mk === "RANGEROVER") {
    mk = "LANDROVER";
    md = `RANGEROVER${md}`;
  }
  if (md.startsWith(mk) && md.length > mk.length) md = md.slice(mk.length);
  return SQUASHED.get(`${mk}|${md}`);
}

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

  for (const mk of aliasedMake ? [normMake, aliasedMake] : [normMake]) {
    const entry = lookupSquashed(mk, normModel);
    if (entry) return buildResult(entry);
  }

  // Fuzzy: the lookup model is a trim of a rated model ("FIESTA ZETEC" →
  // FIESTA), else a rated model extends it. The longest contained key wins so
  // "RANGE ROVER SPORT HSE" rates as the Sport, not the Range Rover; for the
  // reverse, the JSON is ordered largest fleet first.
  const tryMakes = aliasedMake ? [normMake, aliasedMake] : [normMake];
  for (const mk of tryMakes) {
    let best: [string, [number, number]] | null = null;
    for (const [entryKey, entry] of Object.entries(data)) {
      const [entryMake, entryModel] = entryKey.split("|");
      if (entryMake !== mk) continue;
      if (normModel.startsWith(entryModel + " ") && (!best || entryModel.length > best[0].length)) {
        best = [entryModel, entry];
      }
    }
    if (best) return buildResult(best[1]);
    for (const [entryKey, entry] of Object.entries(data)) {
      const [entryMake, entryModel] = entryKey.split("|");
      if (entryMake === mk && entryModel.startsWith(normModel + " ")) return buildResult(entry);
    }
  }

  return null;
}
