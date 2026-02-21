// Vehicle dimensions lookup — maps make + model to dimensions

import dimensionsData from "@/data/vehicle-dimensions.json";

type DimensionsEntry = {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  wheelbaseMm: number;
  kerbWeightKg: number;
  bootLitres: number;
};

const data = dimensionsData as Record<string, DimensionsEntry>;

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

const MAKE_ALIASES: Record<string, string> = {
  "MERCEDES": "MERCEDES BENZ",
  "MERCEDES-BENZ": "MERCEDES BENZ",
  "VW": "VOLKSWAGEN",
  "LANDROVER": "LAND ROVER",
};

export type VehicleDimensionsResult = {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  wheelbaseMm: number;
  kerbWeightKg: number;
  bootLitres: number;
};

export function lookupVehicleDimensions(make?: string, model?: string): VehicleDimensionsResult | null {
  if (!make || !model) return null;

  const normMake = normalize(make);
  const normModel = normalize(model);

  const key = `${normMake}|${normModel}`;
  if (data[key]) return data[key];

  const aliasedMake = MAKE_ALIASES[normMake];
  if (aliasedMake) {
    const aliasKey = `${aliasedMake}|${normModel}`;
    if (data[aliasKey]) return data[aliasKey];
  }

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
