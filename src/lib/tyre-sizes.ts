// Tyre size lookup — maps make + model to tyre sizes, bolt pattern, centrebore

import tyreSizeData from "@/data/tyre-sizes.json";

type TyreSizeEntry = {
  sizes: string[];
  boltPattern: string;
  centrebore: string;
};

const data = tyreSizeData as Record<string, TyreSizeEntry>;

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

const MAKE_ALIASES: Record<string, string> = {
  "MERCEDES": "MERCEDES BENZ",
  "MERCEDES-BENZ": "MERCEDES BENZ",
  "VW": "VOLKSWAGEN",
  "LANDROVER": "LAND ROVER",
};

export type TyreSizeResult = {
  sizes: string[];
  boltPattern: string;
  centrebore: string;
};

export function lookupTyreSizes(make?: string, model?: string): TyreSizeResult | null {
  if (!make || !model) return null;

  const normMake = normalize(make);
  const normModel = normalize(model);

  // Exact match
  const key = `${normMake}|${normModel}`;
  if (data[key]) return data[key];

  // Try make alias
  const aliasedMake = MAKE_ALIASES[normMake];
  if (aliasedMake) {
    const aliasKey = `${aliasedMake}|${normModel}`;
    if (data[aliasKey]) return data[aliasKey];
  }

  // Fuzzy: model contains lookup key's model or vice versa
  const tryMakes = aliasedMake ? [normMake, aliasedMake] : [normMake];
  for (const mk of tryMakes) {
    for (const [entryKey, entry] of Object.entries(data)) {
      const [entryMake, entryModel] = entryKey.split("|");
      if (entryMake !== mk) continue;
      if (normModel.includes(entryModel) || entryModel.includes(normModel)) {
        return entry;
      }
    }
  }

  return null;
}
