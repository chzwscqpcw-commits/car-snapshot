// Model guide data aggregation — pulls from all existing data sources at build time

import { lookupNcap, type NcapRating } from "@/lib/ncap";
import { lookupMotPassRate, type MotPassRateResult } from "@/lib/mot-pass-rate";
import { lookupNewPrice, getDepreciationMultiplier, getMakeRetentionMultiplier } from "@/lib/valuation";
import { lookupFuelEconomy, type FuelEconomyEntry, type FuelEconomyResult } from "@/lib/fuel-economy";
import { findRecalls, type Recall } from "@/lib/recalls";
import { lookupBodyType } from "@/lib/body-type";
import { lookupRarity, type RarityResult } from "@/lib/how-many-left";
import { lookupTheftRisk, type TheftRiskResult } from "@/lib/theft-risk";
import {
  calculateOwnershipCost,
  classifyVehicleSegment,
  SEGMENT_MEDIAN_COSTS,
  type OwnershipCostResult,
  type VehicleSegment,
} from "@/lib/ownership-cost";

import newPricesData from "@/data/new-prices.json";
import fuelEconomyData from "@/data/fuel-economy.json";
import recallsData from "@/data/recalls.json";
import evSpecsData from "@/data/ev-specs.json";

// ── Types ────────────────────────────────────────────────────────────────────

type NewPriceEntry = { make: string; model: string; newPrice: number };

type EvSpecEntry = {
  make: string;
  model: string;
  batteryKwh: number;
  rangeWltp: number;
  chargeFast: string | null;
  chargeSlow: string | null;
  motorKw: number | null;
  driveType: string | null;
};

export type ModelEntry = {
  make: string;
  model: string;
  makeSlug: string;
  modelSlug: string;
};

export type DepreciationPoint = {
  year: number;
  retainedPercent: number;
  estimatedValue: number;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type ModelGuideData = {
  make: string;
  model: string;
  makeSlug: string;
  modelSlug: string;
  displayMake: string;
  displayModel: string;
  displayName: string;

  ncap: NcapRating | null;
  recalls: Recall[];
  motPassRate: MotPassRateResult | null;
  newPrice: number | null;
  bodyType: string | null;
  rarity: RarityResult | null;
  theftRisk: TheftRiskResult | null;
  fuelEconomy: FuelEconomyResult | null;
  fuelVariants: FuelEconomyEntry[];
  evSpecs: EvSpecEntry[];
  isEv: boolean;
  runningCosts: OwnershipCostResult | null;
  segment: VehicleSegment;
  segmentLabel: string;
  segmentAvgCost: number;
  depreciationCurve: DepreciationPoint[];
  narrative: string[];
  faq: FaqItem[];
};

// ── Model Registry ───────────────────────────────────────────────────────────

export const MODEL_REGISTRY: ModelEntry[] = [
  // Audi
  { make: "AUDI", model: "A1", makeSlug: "audi", modelSlug: "a1" },
  { make: "AUDI", model: "A3", makeSlug: "audi", modelSlug: "a3" },
  { make: "AUDI", model: "A4", makeSlug: "audi", modelSlug: "a4" },
  { make: "AUDI", model: "A5", makeSlug: "audi", modelSlug: "a5" },
  { make: "AUDI", model: "A6", makeSlug: "audi", modelSlug: "a6" },
  { make: "AUDI", model: "E-TRON", makeSlug: "audi", modelSlug: "e-tron" },
  { make: "AUDI", model: "Q2", makeSlug: "audi", modelSlug: "q2" },
  { make: "AUDI", model: "Q3", makeSlug: "audi", modelSlug: "q3" },
  { make: "AUDI", model: "Q5", makeSlug: "audi", modelSlug: "q5" },
  { make: "AUDI", model: "Q7", makeSlug: "audi", modelSlug: "q7" },
  // BMW
  { make: "BMW", model: "1 SERIES", makeSlug: "bmw", modelSlug: "1-series" },
  { make: "BMW", model: "2 SERIES", makeSlug: "bmw", modelSlug: "2-series" },
  { make: "BMW", model: "3 SERIES", makeSlug: "bmw", modelSlug: "3-series" },
  { make: "BMW", model: "4 SERIES", makeSlug: "bmw", modelSlug: "4-series" },
  { make: "BMW", model: "5 SERIES", makeSlug: "bmw", modelSlug: "5-series" },
  { make: "BMW", model: "I4", makeSlug: "bmw", modelSlug: "i4" },
  { make: "BMW", model: "IX", makeSlug: "bmw", modelSlug: "ix" },
  { make: "BMW", model: "X1", makeSlug: "bmw", modelSlug: "x1" },
  { make: "BMW", model: "X3", makeSlug: "bmw", modelSlug: "x3" },
  { make: "BMW", model: "X5", makeSlug: "bmw", modelSlug: "x5" },
  // BYD
  { make: "BYD", model: "ATTO 3", makeSlug: "byd", modelSlug: "atto-3" },
  { make: "BYD", model: "DOLPHIN", makeSlug: "byd", modelSlug: "dolphin" },
  // Citroen
  { make: "CITROEN", model: "C3", makeSlug: "citroen", modelSlug: "c3" },
  { make: "CITROEN", model: "C4", makeSlug: "citroen", modelSlug: "c4" },
  { make: "CITROEN", model: "C5 AIRCROSS", makeSlug: "citroen", modelSlug: "c5-aircross" },
  // Cupra
  { make: "CUPRA", model: "BORN", makeSlug: "cupra", modelSlug: "born" },
  { make: "CUPRA", model: "FORMENTOR", makeSlug: "cupra", modelSlug: "formentor" },
  // Dacia
  { make: "DACIA", model: "DUSTER", makeSlug: "dacia", modelSlug: "duster" },
  { make: "DACIA", model: "SANDERO", makeSlug: "dacia", modelSlug: "sandero" },
  // Fiat
  { make: "FIAT", model: "500", makeSlug: "fiat", modelSlug: "500" },
  { make: "FIAT", model: "PANDA", makeSlug: "fiat", modelSlug: "panda" },
  // Ford
  { make: "FORD", model: "ECOSPORT", makeSlug: "ford", modelSlug: "ecosport" },
  { make: "FORD", model: "FIESTA", makeSlug: "ford", modelSlug: "fiesta" },
  { make: "FORD", model: "FOCUS", makeSlug: "ford", modelSlug: "focus" },
  { make: "FORD", model: "KUGA", makeSlug: "ford", modelSlug: "kuga" },
  { make: "FORD", model: "MONDEO", makeSlug: "ford", modelSlug: "mondeo" },
  { make: "FORD", model: "MUSTANG MACH-E", makeSlug: "ford", modelSlug: "mustang-mach-e" },
  { make: "FORD", model: "PUMA", makeSlug: "ford", modelSlug: "puma" },
  { make: "FORD", model: "RANGER", makeSlug: "ford", modelSlug: "ranger" },
  // Honda
  { make: "HONDA", model: "CIVIC", makeSlug: "honda", modelSlug: "civic" },
  { make: "HONDA", model: "CR-V", makeSlug: "honda", modelSlug: "cr-v" },
  { make: "HONDA", model: "HR-V", makeSlug: "honda", modelSlug: "hr-v" },
  { make: "HONDA", model: "JAZZ", makeSlug: "honda", modelSlug: "jazz" },
  // Hyundai
  { make: "HYUNDAI", model: "I10", makeSlug: "hyundai", modelSlug: "i10" },
  { make: "HYUNDAI", model: "I20", makeSlug: "hyundai", modelSlug: "i20" },
  { make: "HYUNDAI", model: "I30", makeSlug: "hyundai", modelSlug: "i30" },
  { make: "HYUNDAI", model: "IONIQ 5", makeSlug: "hyundai", modelSlug: "ioniq-5" },
  { make: "HYUNDAI", model: "IONIQ 6", makeSlug: "hyundai", modelSlug: "ioniq-6" },
  { make: "HYUNDAI", model: "KONA", makeSlug: "hyundai", modelSlug: "kona" },
  { make: "HYUNDAI", model: "TUCSON", makeSlug: "hyundai", modelSlug: "tucson" },
  // Jaguar
  { make: "JAGUAR", model: "E-PACE", makeSlug: "jaguar", modelSlug: "e-pace" },
  { make: "JAGUAR", model: "F-PACE", makeSlug: "jaguar", modelSlug: "f-pace" },
  { make: "JAGUAR", model: "XE", makeSlug: "jaguar", modelSlug: "xe" },
  { make: "JAGUAR", model: "XF", makeSlug: "jaguar", modelSlug: "xf" },
  // Kia
  { make: "KIA", model: "CEED", makeSlug: "kia", modelSlug: "ceed" },
  { make: "KIA", model: "EV6", makeSlug: "kia", modelSlug: "ev6" },
  { make: "KIA", model: "EV9", makeSlug: "kia", modelSlug: "ev9" },
  { make: "KIA", model: "NIRO", makeSlug: "kia", modelSlug: "niro" },
  { make: "KIA", model: "PICANTO", makeSlug: "kia", modelSlug: "picanto" },
  { make: "KIA", model: "RIO", makeSlug: "kia", modelSlug: "rio" },
  { make: "KIA", model: "SPORTAGE", makeSlug: "kia", modelSlug: "sportage" },
  // Land Rover
  { make: "LAND ROVER", model: "DEFENDER", makeSlug: "land-rover", modelSlug: "defender" },
  { make: "LAND ROVER", model: "DISCOVERY", makeSlug: "land-rover", modelSlug: "discovery" },
  { make: "LAND ROVER", model: "DISCOVERY SPORT", makeSlug: "land-rover", modelSlug: "discovery-sport" },
  { make: "LAND ROVER", model: "RANGE ROVER", makeSlug: "land-rover", modelSlug: "range-rover" },
  { make: "LAND ROVER", model: "RANGE ROVER SPORT", makeSlug: "land-rover", modelSlug: "range-rover-sport" },
  // Lexus
  { make: "LEXUS", model: "IS", makeSlug: "lexus", modelSlug: "is" },
  { make: "LEXUS", model: "NX", makeSlug: "lexus", modelSlug: "nx" },
  { make: "LEXUS", model: "RX", makeSlug: "lexus", modelSlug: "rx" },
  // Mazda
  { make: "MAZDA", model: "CX-30", makeSlug: "mazda", modelSlug: "cx-30" },
  { make: "MAZDA", model: "CX-5", makeSlug: "mazda", modelSlug: "cx-5" },
  { make: "MAZDA", model: "MAZDA3", makeSlug: "mazda", modelSlug: "mazda3" },
  { make: "MAZDA", model: "MX-5", makeSlug: "mazda", modelSlug: "mx-5" },
  // Mercedes-Benz
  { make: "MERCEDES-BENZ", model: "A CLASS", makeSlug: "mercedes-benz", modelSlug: "a-class" },
  { make: "MERCEDES-BENZ", model: "C CLASS", makeSlug: "mercedes-benz", modelSlug: "c-class" },
  { make: "MERCEDES-BENZ", model: "CLA", makeSlug: "mercedes-benz", modelSlug: "cla" },
  { make: "MERCEDES-BENZ", model: "E CLASS", makeSlug: "mercedes-benz", modelSlug: "e-class" },
  { make: "MERCEDES-BENZ", model: "GLA", makeSlug: "mercedes-benz", modelSlug: "gla" },
  { make: "MERCEDES-BENZ", model: "GLB", makeSlug: "mercedes-benz", modelSlug: "glb" },
  { make: "MERCEDES-BENZ", model: "GLC", makeSlug: "mercedes-benz", modelSlug: "glc" },
  { make: "MERCEDES-BENZ", model: "GLE", makeSlug: "mercedes-benz", modelSlug: "gle" },
  // MG
  { make: "MG", model: "HS", makeSlug: "mg", modelSlug: "hs" },
  { make: "MG", model: "MG4", makeSlug: "mg", modelSlug: "mg4" },
  { make: "MG", model: "ZS", makeSlug: "mg", modelSlug: "zs" },
  // MINI
  { make: "MINI", model: "COUNTRYMAN", makeSlug: "mini", modelSlug: "countryman" },
  { make: "MINI", model: "HATCH", makeSlug: "mini", modelSlug: "hatch" },
  // Nissan
  { make: "NISSAN", model: "ARIYA", makeSlug: "nissan", modelSlug: "ariya" },
  { make: "NISSAN", model: "JUKE", makeSlug: "nissan", modelSlug: "juke" },
  { make: "NISSAN", model: "LEAF", makeSlug: "nissan", modelSlug: "leaf" },
  { make: "NISSAN", model: "MICRA", makeSlug: "nissan", modelSlug: "micra" },
  { make: "NISSAN", model: "QASHQAI", makeSlug: "nissan", modelSlug: "qashqai" },
  { make: "NISSAN", model: "X-TRAIL", makeSlug: "nissan", modelSlug: "x-trail" },
  // Peugeot
  { make: "PEUGEOT", model: "208", makeSlug: "peugeot", modelSlug: "208" },
  { make: "PEUGEOT", model: "2008", makeSlug: "peugeot", modelSlug: "2008" },
  { make: "PEUGEOT", model: "308", makeSlug: "peugeot", modelSlug: "308" },
  { make: "PEUGEOT", model: "3008", makeSlug: "peugeot", modelSlug: "3008" },
  { make: "PEUGEOT", model: "5008", makeSlug: "peugeot", modelSlug: "5008" },
  // Polestar
  { make: "POLESTAR", model: "2", makeSlug: "polestar", modelSlug: "2" },
  // Porsche
  { make: "PORSCHE", model: "911", makeSlug: "porsche", modelSlug: "911" },
  { make: "PORSCHE", model: "CAYENNE", makeSlug: "porsche", modelSlug: "cayenne" },
  { make: "PORSCHE", model: "MACAN", makeSlug: "porsche", modelSlug: "macan" },
  { make: "PORSCHE", model: "TAYCAN", makeSlug: "porsche", modelSlug: "taycan" },
  // Range Rover
  { make: "RANGE ROVER", model: "EVOQUE", makeSlug: "range-rover", modelSlug: "evoque" },
  // Renault
  { make: "RENAULT", model: "CAPTUR", makeSlug: "renault", modelSlug: "captur" },
  { make: "RENAULT", model: "CLIO", makeSlug: "renault", modelSlug: "clio" },
  { make: "RENAULT", model: "MEGANE", makeSlug: "renault", modelSlug: "megane" },
  { make: "RENAULT", model: "ZOE", makeSlug: "renault", modelSlug: "zoe" },
  // SEAT
  { make: "SEAT", model: "ARONA", makeSlug: "seat", modelSlug: "arona" },
  { make: "SEAT", model: "ATECA", makeSlug: "seat", modelSlug: "ateca" },
  { make: "SEAT", model: "IBIZA", makeSlug: "seat", modelSlug: "ibiza" },
  { make: "SEAT", model: "LEON", makeSlug: "seat", modelSlug: "leon" },
  // Skoda
  { make: "SKODA", model: "ENYAQ", makeSlug: "skoda", modelSlug: "enyaq" },
  { make: "SKODA", model: "FABIA", makeSlug: "skoda", modelSlug: "fabia" },
  { make: "SKODA", model: "KAROQ", makeSlug: "skoda", modelSlug: "karoq" },
  { make: "SKODA", model: "KODIAQ", makeSlug: "skoda", modelSlug: "kodiaq" },
  { make: "SKODA", model: "OCTAVIA", makeSlug: "skoda", modelSlug: "octavia" },
  { make: "SKODA", model: "SUPERB", makeSlug: "skoda", modelSlug: "superb" },
  // Suzuki
  { make: "SUZUKI", model: "JIMNY", makeSlug: "suzuki", modelSlug: "jimny" },
  { make: "SUZUKI", model: "SWIFT", makeSlug: "suzuki", modelSlug: "swift" },
  { make: "SUZUKI", model: "VITARA", makeSlug: "suzuki", modelSlug: "vitara" },
  // Tesla
  { make: "TESLA", model: "MODEL 3", makeSlug: "tesla", modelSlug: "model-3" },
  { make: "TESLA", model: "MODEL S", makeSlug: "tesla", modelSlug: "model-s" },
  { make: "TESLA", model: "MODEL X", makeSlug: "tesla", modelSlug: "model-x" },
  { make: "TESLA", model: "MODEL Y", makeSlug: "tesla", modelSlug: "model-y" },
  // Toyota
  { make: "TOYOTA", model: "AYGO", makeSlug: "toyota", modelSlug: "aygo" },
  { make: "TOYOTA", model: "BZ4X", makeSlug: "toyota", modelSlug: "bz4x" },
  { make: "TOYOTA", model: "C-HR", makeSlug: "toyota", modelSlug: "c-hr" },
  { make: "TOYOTA", model: "COROLLA", makeSlug: "toyota", modelSlug: "corolla" },
  { make: "TOYOTA", model: "LAND CRUISER", makeSlug: "toyota", modelSlug: "land-cruiser" },
  { make: "TOYOTA", model: "PRIUS", makeSlug: "toyota", modelSlug: "prius" },
  { make: "TOYOTA", model: "RAV4", makeSlug: "toyota", modelSlug: "rav4" },
  { make: "TOYOTA", model: "YARIS", makeSlug: "toyota", modelSlug: "yaris" },
  { make: "TOYOTA", model: "YARIS CROSS", makeSlug: "toyota", modelSlug: "yaris-cross" },
  // Vauxhall
  { make: "VAUXHALL", model: "ASTRA", makeSlug: "vauxhall", modelSlug: "astra" },
  { make: "VAUXHALL", model: "CORSA", makeSlug: "vauxhall", modelSlug: "corsa" },
  { make: "VAUXHALL", model: "CROSSLAND", makeSlug: "vauxhall", modelSlug: "crossland" },
  { make: "VAUXHALL", model: "GRANDLAND", makeSlug: "vauxhall", modelSlug: "grandland" },
  { make: "VAUXHALL", model: "INSIGNIA", makeSlug: "vauxhall", modelSlug: "insignia" },
  { make: "VAUXHALL", model: "MOKKA", makeSlug: "vauxhall", modelSlug: "mokka" },
  // Volkswagen
  { make: "VOLKSWAGEN", model: "GOLF", makeSlug: "volkswagen", modelSlug: "golf" },
  { make: "VOLKSWAGEN", model: "ID.3", makeSlug: "volkswagen", modelSlug: "id3" },
  { make: "VOLKSWAGEN", model: "ID.4", makeSlug: "volkswagen", modelSlug: "id4" },
  { make: "VOLKSWAGEN", model: "ID.5", makeSlug: "volkswagen", modelSlug: "id5" },
  { make: "VOLKSWAGEN", model: "PASSAT", makeSlug: "volkswagen", modelSlug: "passat" },
  { make: "VOLKSWAGEN", model: "POLO", makeSlug: "volkswagen", modelSlug: "polo" },
  { make: "VOLKSWAGEN", model: "T-CROSS", makeSlug: "volkswagen", modelSlug: "t-cross" },
  { make: "VOLKSWAGEN", model: "T-ROC", makeSlug: "volkswagen", modelSlug: "t-roc" },
  { make: "VOLKSWAGEN", model: "TIGUAN", makeSlug: "volkswagen", modelSlug: "tiguan" },
  { make: "VOLKSWAGEN", model: "TOUAREG", makeSlug: "volkswagen", modelSlug: "touareg" },
  // Volvo
  { make: "VOLVO", model: "EX30", makeSlug: "volvo", modelSlug: "ex30" },
  { make: "VOLVO", model: "V60", makeSlug: "volvo", modelSlug: "v60" },
  { make: "VOLVO", model: "XC40", makeSlug: "volvo", modelSlug: "xc40" },
  { make: "VOLVO", model: "XC60", makeSlug: "volvo", modelSlug: "xc60" },
  { make: "VOLVO", model: "XC90", makeSlug: "volvo", modelSlug: "xc90" },
];

// ── Display name formatting ──────────────────────────────────────────────────

const MAKE_DISPLAY: Record<string, string> = {
  "AUDI": "Audi",
  "BMW": "BMW",
  "BYD": "BYD",
  "CITROEN": "Citroen",
  "CUPRA": "Cupra",
  "DACIA": "Dacia",
  "FIAT": "Fiat",
  "FORD": "Ford",
  "HONDA": "Honda",
  "HYUNDAI": "Hyundai",
  "JAGUAR": "Jaguar",
  "KIA": "Kia",
  "LAND ROVER": "Land Rover",
  "LEXUS": "Lexus",
  "MAZDA": "Mazda",
  "MERCEDES-BENZ": "Mercedes-Benz",
  "MG": "MG",
  "MINI": "MINI",
  "NISSAN": "Nissan",
  "PEUGEOT": "Peugeot",
  "POLESTAR": "Polestar",
  "PORSCHE": "Porsche",
  "RANGE ROVER": "Range Rover",
  "RENAULT": "Renault",
  "SEAT": "SEAT",
  "SKODA": "Skoda",
  "SUZUKI": "Suzuki",
  "TESLA": "Tesla",
  "TOYOTA": "Toyota",
  "VAUXHALL": "Vauxhall",
  "VOLKSWAGEN": "Volkswagen",
  "VOLVO": "Volvo",
};

const MODEL_DISPLAY: Record<string, string> = {
  "1 SERIES": "1 Series",
  "2 SERIES": "2 Series",
  "3 SERIES": "3 Series",
  "4 SERIES": "4 Series",
  "5 SERIES": "5 Series",
  "A CLASS": "A-Class",
  "ATTO 3": "Atto 3",
  "BZ4X": "bZ4X",
  "C CLASS": "C-Class",
  "C-HR": "C-HR",
  "C5 AIRCROSS": "C5 Aircross",
  "CR-V": "CR-V",
  "CX-30": "CX-30",
  "CX-5": "CX-5",
  "DISCOVERY SPORT": "Discovery Sport",
  "E CLASS": "E-Class",
  "E-PACE": "E-Pace",
  "E-TRON": "e-tron",
  "EV6": "EV6",
  "EV9": "EV9",
  "EX30": "EX30",
  "F-PACE": "F-Pace",
  "HR-V": "HR-V",
  "I10": "i10",
  "I20": "i20",
  "I30": "i30",
  "I4": "i4",
  "ID.3": "ID.3",
  "ID.4": "ID.4",
  "ID.5": "ID.5",
  "IONIQ 5": "IONIQ 5",
  "IONIQ 6": "IONIQ 6",
  "IX": "iX",
  "LAND CRUISER": "Land Cruiser",
  "MAZDA3": "Mazda3",
  "MG4": "MG4",
  "MODEL 3": "Model 3",
  "MODEL S": "Model S",
  "MODEL X": "Model X",
  "MODEL Y": "Model Y",
  "MUSTANG MACH-E": "Mustang Mach-E",
  "MX-5": "MX-5",
  "RANGE ROVER": "Range Rover",
  "RANGE ROVER SPORT": "Range Rover Sport",
  "RAV4": "RAV4",
  "T-CROSS": "T-Cross",
  "T-ROC": "T-Roc",
  "V60": "V60",
  "X-TRAIL": "X-Trail",
  "XC40": "XC40",
  "XC60": "XC60",
  "XC90": "XC90",
  "YARIS CROSS": "Yaris Cross",
};

export function getDisplayMake(make: string): string {
  return MAKE_DISPLAY[make] ?? make.charAt(0) + make.slice(1).toLowerCase();
}

export function getDisplayModel(model: string): string {
  if (MODEL_DISPLAY[model]) return MODEL_DISPLAY[model];
  return model
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

const TYPICAL_AGE = 5;
const VED_POST_2017 = 195;

function getAllFuelVariants(make: string, model: string): FuelEconomyEntry[] {
  const normMake = normalize(make);
  const normModel = normalize(model);
  return (fuelEconomyData as FuelEconomyEntry[]).filter((e) => {
    if (normalize(e.make) !== normMake) return false;
    const eModel = normalize(e.model);
    return eModel === normModel || eModel.startsWith(normModel + " ") || eModel.startsWith(normModel + ",");
  });
}

function getAllEvVariants(make: string, model: string): EvSpecEntry[] {
  const normMake = normalize(make);
  const normModel = normalize(model);
  return (evSpecsData as EvSpecEntry[]).filter((e) => {
    if (normalize(e.make) !== normMake) return false;
    const eModel = normalize(e.model);
    return eModel === normModel || eModel.startsWith(normModel + " ");
  });
}

// ── Registry lookups ─────────────────────────────────────────────────────────

export function findModelEntry(makeSlug: string, modelSlug: string): ModelEntry | undefined {
  return MODEL_REGISTRY.find((m) => m.makeSlug === makeSlug && m.modelSlug === modelSlug);
}

export function getModelsForMake(makeSlug: string): ModelEntry[] {
  return MODEL_REGISTRY.filter((m) => m.makeSlug === makeSlug);
}

export function getUniqueMakes(): { makeSlug: string; displayMake: string; modelCount: number }[] {
  const makeMap = new Map<string, { make: string; count: number }>();
  for (const m of MODEL_REGISTRY) {
    const existing = makeMap.get(m.makeSlug);
    if (existing) {
      existing.count++;
    } else {
      makeMap.set(m.makeSlug, { make: m.make, count: 1 });
    }
  }
  return Array.from(makeMap.entries()).map(([makeSlug, { make, count }]) => ({
    makeSlug,
    displayMake: getDisplayMake(make),
    modelCount: count,
  }));
}

// ── Main data aggregation ────────────────────────────────────────────────────

export function getModelGuideData(makeSlug: string, modelSlug: string): ModelGuideData | null {
  const entry = findModelEntry(makeSlug, modelSlug);
  if (!entry) return null;

  const { make, model } = entry;
  const displayMake = getDisplayMake(make);
  const displayModel = getDisplayModel(model);
  const displayName = `${displayMake} ${displayModel}`;

  // Safety
  const ncap = lookupNcap(make, model);
  const recalls = findRecalls(recallsData as Recall[], make, model);

  // Reliability
  const motPassRate = lookupMotPassRate(make, model);

  // Market
  const newPrice = lookupNewPrice(newPricesData as NewPriceEntry[], make, model);
  const bodyType = lookupBodyType(make, model);
  const rarity = lookupRarity(make, model);
  const theftRisk = lookupTheftRisk(make, model);

  // Fuel economy
  const fuelVariants = getAllFuelVariants(make, model);
  const fuelEconomy = lookupFuelEconomy(
    fuelEconomyData as FuelEconomyEntry[],
    make,
    model,
  );

  // EV specs
  const evSpecs = getAllEvVariants(make, model);
  const isEv = evSpecs.length > 0;

  // Segment classification
  const segment = classifyVehicleSegment({
    fuelType: isEv ? "ELECTRICITY" : fuelVariants[0]?.fuelType,
    bodyType,
    newPrice,
  });
  const segmentInfo = SEGMENT_MEDIAN_COSTS[segment];

  // Running costs (for a typical 5-year-old vehicle)
  const fuelAnnualCost = fuelEconomy?.estimatedAnnualCost ?? null;
  const runningCosts = calculateOwnershipCost({
    vedAnnualRate: VED_POST_2017,
    fuelAnnualCost: isEv ? 0 : fuelAnnualCost,
    newPrice,
    vehicleAge: TYPICAL_AGE,
    make,
    model,
    isOver3Years: true,
    segment,
  });

  // Depreciation curve
  const depreciationCurve: DepreciationPoint[] = [];
  if (newPrice) {
    const retention = getMakeRetentionMultiplier(make, model);
    for (let y = 1; y <= 10; y++) {
      const mult = getDepreciationMultiplier(y) * retention;
      depreciationCurve.push({
        year: y,
        retainedPercent: Math.round(mult * 100),
        estimatedValue: Math.round((newPrice * mult) / 50) * 50,
      });
    }
  }

  const data: ModelGuideData = {
    make,
    model,
    makeSlug: entry.makeSlug,
    modelSlug: entry.modelSlug,
    displayMake,
    displayModel,
    displayName,
    ncap,
    recalls,
    motPassRate,
    newPrice,
    bodyType,
    rarity,
    theftRisk,
    fuelEconomy,
    fuelVariants,
    evSpecs,
    isEv,
    runningCosts,
    segment,
    segmentLabel: segmentInfo.label,
    segmentAvgCost: segmentInfo.cost,
    depreciationCurve,
    narrative: [],
    faq: [],
  };

  data.narrative = generateNarrative(data);
  data.faq = generateFAQ(data);

  return data;
}

// ── Narrative generation ─────────────────────────────────────────────────────

function generateNarrative(d: ModelGuideData): string[] {
  const sentences: string[] = [];
  const { displayName, displayModel } = d;

  // Opening context
  if (d.rarity) {
    const count = d.rarity.licensed.toLocaleString("en-GB");
    sentences.push(
      `With ${count} currently licensed in the UK, the ${displayName} is one of Britain's ${d.rarity.category === "very-common" ? "most popular" : "well-known"} cars.`,
    );
  } else {
    sentences.push(`The ${displayName} is a popular choice on UK roads.`);
  }

  // NCAP
  if (d.ncap) {
    sentences.push(
      `Euro NCAP awarded the ${displayModel} ${d.ncap.overallStars} stars in ${d.ncap.yearTested}, with ${d.ncap.adultOccupant}% adult occupant and ${d.ncap.childOccupant}% child protection scores.`,
    );
  }

  // MOT reliability
  if (d.motPassRate) {
    const comparison =
      d.motPassRate.passRate > d.motPassRate.nationalAverage
        ? "above"
        : d.motPassRate.passRate < d.motPassRate.nationalAverage
          ? "below"
          : "at";
    let motSentence = `It has a ${d.motPassRate.passRate}% first-time MOT pass rate — ${comparison} the UK national average of ${d.motPassRate.nationalAverage}%.`;
    if (d.motPassRate.commonFailureReasons?.length) {
      motSentence += ` Common MOT failure areas include ${d.motPassRate.commonFailureReasons.slice(0, 3).join(", ").toLowerCase()}.`;
    }
    sentences.push(motSentence);
  }

  // Running costs
  if (d.runningCosts) {
    sentences.push(
      `Annual running costs are estimated at £${d.runningCosts.totalAnnual.toLocaleString("en-GB")} for a typical ${TYPICAL_AGE}-year-old example, breaking down to £${d.runningCosts.monthlyCost}/month or ${Math.round(d.runningCosts.costPerMile * 100)}p/mile.`,
    );
  }

  // Theft risk
  if (d.theftRisk) {
    sentences.push(
      `Theft risk is rated ${d.theftRisk.riskCategory.replace("-", " ")} at ${d.theftRisk.theftsPer1000} per 1,000 registered vehicles.`,
    );
  }

  return sentences;
}

// ── FAQ generation ───────────────────────────────────────────────────────────

function generateFAQ(d: ModelGuideData): FaqItem[] {
  const faq: FaqItem[] = [];
  const { displayName, displayModel } = d;

  // Reliability
  if (d.motPassRate) {
    const comparison = d.motPassRate.aboveAverage ? "above" : "below";
    faq.push({
      question: `Is the ${displayName} reliable?`,
      answer: `The ${displayModel} has a ${d.motPassRate.passRate}% first-time MOT pass rate based on ${d.motPassRate.testCount.toLocaleString("en-GB")} tests — ${comparison} the UK national average of ${d.motPassRate.nationalAverage}%. ${d.motPassRate.aboveAverage ? "This suggests good overall reliability." : "Some models may need more attention at MOT time."}`,
    });
  }

  // Safety
  if (d.ncap) {
    faq.push({
      question: `How safe is the ${displayName}?`,
      answer: `Euro NCAP awarded the ${displayModel} ${d.ncap.overallStars} out of 5 stars when tested in ${d.ncap.yearTested}. It scored ${d.ncap.adultOccupant}% for adult occupant protection, ${d.ncap.childOccupant}% for child occupant protection, ${d.ncap.pedestrian}% for vulnerable road users, and ${d.ncap.safetyAssist}% for safety assist features.`,
    });
  }

  // Running costs
  if (d.runningCosts) {
    faq.push({
      question: `How much does a ${displayName} cost to run?`,
      answer: `Annual running costs for a typical ${TYPICAL_AGE}-year-old ${displayModel} are estimated at around £${d.runningCosts.totalAnnual.toLocaleString("en-GB")} per year (£${d.runningCosts.monthlyCost}/month). This includes fuel, road tax, depreciation, and MOT fees — but excludes insurance, servicing, and repairs.`,
    });
  }

  // Recalls
  faq.push({
    question: `Are there any recalls on the ${displayName}?`,
    answer:
      d.recalls.length > 0
        ? `There ${d.recalls.length === 1 ? "is" : "are"} ${d.recalls.length} known safety recall${d.recalls.length !== 1 ? "s" : ""} affecting the ${displayModel}. These are issued by the DVSA when a safety defect is found. You can check if a specific vehicle is affected by entering its registration number.`
        : `There are no known DVSA safety recalls currently listed for the ${displayModel}. However, recalls can be issued at any time — enter a specific registration to check.`,
  });

  // Theft
  if (d.theftRisk) {
    faq.push({
      question: `Is the ${displayName} likely to be stolen?`,
      answer: `The ${displayModel} has a theft rate of ${d.theftRisk.theftsPer1000} per 1,000 registered vehicles, which is rated ${d.theftRisk.riskCategory.replace("-", " ")} compared to the national average of ${d.theftRisk.nationalAverage} per 1,000. ${d.theftRisk.riskCategory === "very-high" || d.theftRisk.riskCategory === "high" ? "Extra security measures like tracking devices and steering locks are recommended." : "Standard security precautions should be sufficient."}`,
    });
  }

  // New price
  if (d.newPrice) {
    faq.push({
      question: `How much does a new ${displayName} cost?`,
      answer: `A new ${displayModel} starts from around £${d.newPrice.toLocaleString("en-GB")}. After ${TYPICAL_AGE} years, a typical example retains about ${d.depreciationCurve.find((p) => p.year === TYPICAL_AGE)?.retainedPercent ?? "–"}% of its original value.`,
    });
  }

  return faq;
}
