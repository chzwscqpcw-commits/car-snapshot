// "How Many Left" rarity lookup — maps make + model to UK licensing counts

import rarityData from "@/data/how-many-left.json";

const data = rarityData as unknown as Record<string, [number, number]>;

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

const MAKE_ALIASES: Record<string, string> = {
  "MERCEDES": "MERCEDES BENZ",
  "MERCEDES-BENZ": "MERCEDES BENZ",
  "VW": "VOLKSWAGEN",
  "LANDROVER": "LAND ROVER",
};

export type RarityCategory = "very-rare" | "rare" | "uncommon" | "common" | "very-common";

export type RarityResult = {
  licensed: number;
  sorn: number;
  total: number;
  category: RarityCategory;
};

function categorize(total: number): RarityCategory {
  if (total < 1000) return "very-rare";
  if (total < 5000) return "rare";
  if (total < 25000) return "uncommon";
  if (total < 100000) return "common";
  return "very-common";
}

function buildResult(entry: [number, number]): RarityResult {
  const [licensed, sorn] = entry;
  const total = licensed + sorn;
  return { licensed, sorn, total, category: categorize(total) };
}

/**
 * Look up how many vehicles of this make/model are left on UK roads.
 * Accepts the lookupModel (expanded via expandBaseModelForLookup) so
 * "320D" → "3 SERIES" matching works.
 */
export function lookupRarity(make?: string, model?: string): RarityResult | null {
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
