// Euro NCAP safety rating lookup

import ncapData from "@/data/ncap-ratings.json";

export type NcapRating = {
  make: string;
  model: string;
  overallStars: number;
  adultOccupant: number;
  childOccupant: number;
  pedestrian: number;
  safetyAssist: number;
  yearTested: number;
};

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

export function lookupNcap(make?: string, model?: string): NcapRating | null {
  if (!make || !model) return null;

  const normMake = normalize(make);
  const normModel = normalize(model);

  // Exact match first
  const exact = (ncapData as NcapRating[]).find(
    (r) => normalize(r.make) === normMake && normalize(r.model) === normModel
  );
  if (exact) return exact;

  // Fuzzy: model contains or is contained by
  const fuzzy = (ncapData as NcapRating[]).find(
    (r) =>
      normalize(r.make) === normMake &&
      (normalize(r.model).includes(normModel) || normModel.includes(normalize(r.model)))
  );
  if (fuzzy) return fuzzy;

  // Handle make aliases (e.g., "MERCEDES" → "MERCEDES-BENZ")
  const makeAliases: Record<string, string> = {
    MERCEDES: "MERCEDES-BENZ",
    "MERCEDES BENZ": "MERCEDES-BENZ",
    VW: "VOLKSWAGEN",
    LANDROVER: "LAND ROVER",
  };

  const aliasedMake = makeAliases[normMake];
  if (aliasedMake) {
    const aliasMatch = (ncapData as NcapRating[]).find(
      (r) =>
        normalize(r.make) === aliasedMake &&
        (normalize(r.model) === normModel ||
          normalize(r.model).includes(normModel) ||
          normModel.includes(normalize(r.model)))
    );
    if (aliasMatch) return aliasMatch;
  }

  return null;
}
