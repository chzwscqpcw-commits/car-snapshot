// MOT national pass rate lookup by make/model
// Data: aggregated from DVSA MOT bulk data (data.gov.uk)
// Format: { "MAKE|MODEL": [testCount, passRate] }

import motPassData from "@/data/mot-pass-rates.json";

const data = motPassData as unknown as Record<string, [number, number]>;

const UK_AVERAGE_PASS_RATE = 72;

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

const MAKE_ALIASES: Record<string, string> = {
  "MERCEDES": "MERCEDES BENZ",
  "MERCEDES-BENZ": "MERCEDES BENZ",
  "VW": "VOLKSWAGEN",
  "LANDROVER": "LAND ROVER",
};

export type MotPassRateResult = {
  passRate: number;
  testCount: number;
  aboveAverage: boolean;
  nationalAverage: number;
};

/**
 * Look up the national MOT pass rate for a make/model.
 * Uses the same normalize/alias/fuzzy pattern as how-many-left.ts.
 */
export function lookupMotPassRate(make?: string, model?: string): MotPassRateResult | null {
  if (!make || !model) return null;

  const normMake = normalize(make);
  const normModel = normalize(model);

  function buildResult(entry: [number, number]): MotPassRateResult {
    const [testCount, passRate] = entry;
    return {
      passRate,
      testCount,
      aboveAverage: passRate >= UK_AVERAGE_PASS_RATE,
      nationalAverage: UK_AVERAGE_PASS_RATE,
    };
  }

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
