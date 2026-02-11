// Body type lookup — maps make + model to body type (Hatchback, Saloon, SUV, etc.)

import bodyTypeData from "@/data/body-types.json";

const data = bodyTypeData as Record<string, string>;

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

const MAKE_ALIASES: Record<string, string> = {
  "MERCEDES": "MERCEDES BENZ",
  "MERCEDES-BENZ": "MERCEDES BENZ",
  "VW": "VOLKSWAGEN",
  "LANDROVER": "LAND ROVER",
};

// Models that come in multiple body styles (saloon/estate/etc.)
// When the DVLA only gives us the base model (e.g. "A6"), we can't
// determine which variant it is, so we should NOT guess.
const AMBIGUOUS_MODELS = new Set([
  "AUDI|A3",       // Hatchback, Saloon, Sportback
  "AUDI|A4",       // Saloon, Avant (Estate)
  "AUDI|A5",       // Coupe, Sportback, Cabriolet
  "AUDI|A6",       // Saloon, Avant (Estate), Allroad
  "BMW|2 SERIES",  // Coupe, Gran Coupe, Active Tourer
  "BMW|3 SERIES",  // Saloon, Touring (Estate)
  "BMW|4 SERIES",  // Coupe, Gran Coupe, Convertible
  "BMW|5 SERIES",  // Saloon, Touring (Estate)
  "BMW|6 SERIES",  // Coupe, Gran Coupe, Gran Turismo
  "CITROEN|C4",    // Hatchback, SUV (C4 Cactus)
  "CITROEN|C5",    // Saloon, Estate
  "FORD|FOCUS",    // Hatchback, Estate
  "FORD|MONDEO",   // Saloon, Hatchback, Estate
  "HYUNDAI|I30",   // Hatchback, Estate, Fastback
  "HYUNDAI|I40",   // Saloon, Estate
  "JAGUAR|XF",     // Saloon, Sportbrake (Estate)
  "KIA|CEED",      // Hatchback, Estate (Sportswagon)
  "MAZDA|3",       // Hatchback, Saloon
  "MAZDA|6",       // Saloon, Estate
  "MERCEDES BENZ|C CLASS",   // Saloon, Estate, Coupe, Cabriolet
  "MERCEDES BENZ|E CLASS",   // Saloon, Estate, Coupe, Cabriolet
  "MERCEDES BENZ|CLA",       // Saloon, Shooting Brake (Estate)
  "PEUGEOT|308",   // Hatchback, Estate
  "PEUGEOT|508",   // Saloon, Estate
  "SEAT|LEON",     // Hatchback, Estate (Sportstourer)
  "SKODA|OCTAVIA", // Hatchback, Estate
  "SKODA|SUPERB",  // Saloon, Estate
  "TOYOTA|COROLLA",// Hatchback, Touring Sports (Estate)
  "VAUXHALL|ASTRA",// Hatchback, Estate (Sports Tourer)
  "VAUXHALL|INSIGNIA", // Saloon, Estate (Sports Tourer)
  "VOLKSWAGEN|GOLF",   // Hatchback, Estate
  "VOLKSWAGEN|PASSAT", // Saloon, Estate
  "VOLVO|V40",     // Hatchback, Cross Country (SUV-ish)
]);

/**
 * Look up the most common body type for a given make and model.
 * Returns null if no match found.
 */
export function lookupBodyType(make?: string, model?: string): string | null {
  if (!make || !model) return null;

  const normMake = normalize(make);
  const normModel = normalize(model);

  // Exact match
  const key = `${normMake}|${normModel}`;

  // Skip ambiguous models — these come in multiple body styles and
  // we can't determine which one without variant info from DVLA
  if (AMBIGUOUS_MODELS.has(key)) return null;

  if (data[key]) return data[key];

  // Try make alias
  const aliasedMake = MAKE_ALIASES[normMake];
  if (aliasedMake) {
    const aliasKey = `${aliasedMake}|${normModel}`;
    if (AMBIGUOUS_MODELS.has(aliasKey)) return null;
    if (data[aliasKey]) return data[aliasKey];
  }

  // Fuzzy: model contains lookup key's model or vice versa
  const tryMakes = aliasedMake ? [normMake, aliasedMake] : [normMake];
  for (const mk of tryMakes) {
    for (const [entryKey, bodyType] of Object.entries(data)) {
      const [entryMake, entryModel] = entryKey.split("|");
      if (entryMake !== mk) continue;
      if (normModel.includes(entryModel) || entryModel.includes(normModel)) {
        // Don't return if the matched entry is ambiguous
        if (AMBIGUOUS_MODELS.has(entryKey)) return null;
        return bodyType;
      }
    }
  }

  return null;
}
