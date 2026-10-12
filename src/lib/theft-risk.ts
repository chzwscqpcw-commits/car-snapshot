// Theft risk rating lookup by make/model
// Data: DVLA stolen-vehicle records (FOI FOIR13058) ÷ DfT VEH0120 licensed
// vehicles, built by scripts/process-theft-foi.py. Cars and vans are rated
// separately, each against its own national average (vans are stolen about
// twice as often as cars, so one average would brand every van "high").
// Format: { "MAKE|MODEL": [stolen in the year, licensed at its Q4] }

import carData from "@/data/theft-risk.json";
import vanData from "@/data/theft-risk-vans.json";
import theftStats from "@/data/theft-stats.json";

/**
 * Was OFF 2026-10-11 → 2026-10-12. The Feb 2026 theft-risk.json was round
 * estimates with no source: 84 models summing to 88k thefts against DVLA's
 * ~54k cars, and a national average of 5.5 per 1,000 against a real 1.56. It
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

type Fleet = {
  kind: "cars" | "vans";
  data: Record<string, [number, number]>;
  squashed: Map<string, [number, number]>;
  /** Thefts per 1,000 licensed across every vehicle of this kind DVLA's records match to a model. */
  national: number;
};

function fleet(kind: Fleet["kind"], json: unknown, national: number): Fleet {
  const data = json as Record<string, [number, number]>;
  const squashed = new Map<string, [number, number]>();
  for (const [k, entry] of Object.entries(data)) {
    const [mk, md] = k.split("|");
    const sk = `${squash(mk)}|${squash(md)}`;
    if (!squashed.has(sk)) squashed.set(sk, entry); // JSON is largest fleet first
  }
  return { kind, data, squashed, national };
}

// A model in both (Transporter Shuttle car, Transporter van) rates against
// whichever fleet is bigger: the 333k vans, not the few thousand Shuttles.
const FLEETS: Fleet[] = [
  fleet("cars", carData, theftStats.cars.nationalPer1000),
  fleet("vans", vanData, theftStats.vans.nationalPer1000),
];

function lookupSquashed(f: Fleet, make: string, model: string): [number, number] | undefined {
  let mk = squash(make);
  let md = squash(model);
  if (mk === "RANGEROVER") {
    mk = "LANDROVER";
    md = `RANGEROVER${md}`;
  }
  if (md.startsWith(mk) && md.length > mk.length) md = md.slice(mk.length);
  return f.squashed.get(`${mk}|${md}`);
}

export type TheftRiskResult = {
  theftsPer1000: number;
  rateMultiplier: number;
  riskCategory: "very-high" | "high" | "moderate" | "low" | "very-low";
  theftCount: number;
  registeredCount: number;
  nationalAverage: number;
  /** Which fleet the rate and average describe — for "per 1,000 licensed cars/vans". */
  fleet: "cars" | "vans";
};

function categorize(multiplier: number): TheftRiskResult["riskCategory"] {
  if (multiplier > 3) return "very-high";
  if (multiplier > 2) return "high";
  if (multiplier > 1) return "moderate";
  if (multiplier >= 0.5) return "low";
  return "very-low";
}

function buildResult(f: Fleet, entry: [number, number]): TheftRiskResult {
  const [theftCount, registeredCount] = entry;
  const theftsPer1000 = Math.round((theftCount / registeredCount) * 10000) / 10;
  const multiplier = theftsPer1000 / f.national;
  return {
    theftsPer1000,
    rateMultiplier: Math.round(multiplier * 100) / 100,
    riskCategory: categorize(multiplier),
    theftCount,
    registeredCount,
    nationalAverage: f.national,
    fleet: f.kind,
  };
}

function lookupIn(f: Fleet, normMake: string, normModel: string): TheftRiskResult | null {
  const { data } = f;

  // Exact match
  const key = `${normMake}|${normModel}`;
  if (data[key]) return buildResult(f, data[key]);

  // Try make alias
  const aliasedMake = MAKE_ALIASES[normMake];
  if (aliasedMake) {
    const aliasKey = `${aliasedMake}|${normModel}`;
    if (data[aliasKey]) return buildResult(f, data[aliasKey]);
  }

  const tryMakes = aliasedMake ? [normMake, aliasedMake] : [normMake];
  for (const mk of tryMakes) {
    const entry = lookupSquashed(f, mk, normModel);
    if (entry) return buildResult(f, entry);
  }

  // Fuzzy: the lookup model is a trim of a rated model ("FIESTA ZETEC" →
  // FIESTA), else a rated model extends it. The longest contained key wins so
  // "RANGE ROVER SPORT HSE" rates as the Sport, not the Range Rover; for the
  // reverse, the JSON is ordered largest fleet first.
  for (const mk of tryMakes) {
    let best: [string, [number, number]] | null = null;
    for (const [entryKey, entry] of Object.entries(data)) {
      const [entryMake, entryModel] = entryKey.split("|");
      if (entryMake !== mk) continue;
      if (normModel.startsWith(entryModel + " ") && (!best || entryModel.length > best[0].length)) {
        best = [entryModel, entry];
      }
    }
    if (best) return buildResult(f, best[1]);
    for (const [entryKey, entry] of Object.entries(data)) {
      const [entryMake, entryModel] = entryKey.split("|");
      if (entryMake === mk && entryModel.startsWith(normModel + " ")) return buildResult(f, entry);
    }
  }

  return null;
}

/**
 * Look up the theft risk rating for a make/model, as a car or a van.
 * Uses the same normalize/alias/fuzzy pattern as mot-pass-rate.ts.
 */
export function lookupTheftRisk(make?: string, model?: string): TheftRiskResult | null {
  if (!THEFT_DATA_SOURCED) return null;
  if (!make || !model) return null;
  const normMake = normalize(make);
  const normModel = normalize(model);
  let best: TheftRiskResult | null = null;
  for (const f of FLEETS) {
    const r = lookupIn(f, normMake, normModel);
    if (r && (!best || r.registeredCount > best.registeredCount)) best = r;
  }
  return best;
}

export type TheftModelOption = { key: string; make: string; model: string; fleet: Fleet["kind"] };

/**
 * Every rated model, for the "check your model" search on /stats/car-theft.
 * A model rated as both (Transporter) appears once, under the fleet
 * lookupTheftRisk would use for it.
 */
export function listRatedModels(): TheftModelOption[] {
  const byKey = new Map<string, TheftModelOption & { n: number }>();
  for (const f of FLEETS) {
    for (const [key, [, n]] of Object.entries(f.data)) {
      const prev = byKey.get(key);
      if (prev && prev.n >= n) continue;
      const [make, model] = key.split("|");
      byKey.set(key, { key, make, model, fleet: f.kind, n });
    }
  }
  return [...byKey.values()].map(({ n: _n, ...o }) => o);
}
