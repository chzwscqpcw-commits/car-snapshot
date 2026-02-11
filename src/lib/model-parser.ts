// DVLA model string parser — extracts structured data from raw model strings
// e.g. "A6 AVANT S LINE 2.0 TDI ULTRA S TRONIC" → { baseModel: "A6", bodyStyle: "Avant", trim: "S Line", ... }

export type ParsedModel = {
  baseModel: string;
  bodyStyle: string | null;
  trim: string | null;
  fuelIndicator: string | null;
  transmission: string | null;
  driveType: string | null;
  engineDesc: string | null;
};

// ── Classification dictionaries ──────────────────────────────────────────────

// Multi-word tokens (extracted first, longest match wins)
const MULTI_WORD_TRIMS = [
  "S LINE", "M SPORT", "AMG LINE", "GT LINE", "ST LINE", "N LINE",
  "R LINE", "R DESIGN", "BLACK EDITION", "FIRST EDITION", "LAUNCH EDITION",
  "SE L", "RS LINE",
];

const MULTI_WORD_TRANSMISSIONS = ["S TRONIC", "TIPTRONIC", "STEPTRONIC"];

const MULTI_WORD_BODY_STYLES = ["SHOOTING BRAKE", "GRAND TOURER", "GRAN COUPE", "GRAN TURISMO"];

const MULTI_WORD_FUEL = ["E HYBRID", "PLUG IN HYBRID"];

const MULTI_WORD_DRIVE = ["ALL WHEEL DRIVE"];

// Single-word tokens
const BODY_STYLES = new Set([
  "AVANT", "ESTATE", "SALOON", "COUPE", "CONVERTIBLE", "HATCHBACK", "SUV",
  "CABRIOLET", "TOURING", "SPORTBACK", "WAGON", "MPV", "CROSSOVER",
  "LIMOUSINE", "ROADSTER", "FASTBACK", "LIFTBACK", "SEDAN",
]);

const TRIMS = new Set([
  "SE", "SPORT", "FR", "VIGNALE", "TITANIUM", "TEKNA", "ACTIVE", "DYNAMIC",
  "LUXURY", "PRESTIGE", "PLATINUM", "ULTIMATE", "INSCRIPTION", "MOMENTUM",
  "XCEED", "ELEGANCE", "EXCLUSIVE", "PREMIUM", "EXPRESSION", "ICONIC",
  "SIGNATURE", "SAHARA", "OVERLAND", "LIMITED", "ADVANCE",
]);

const TRANSMISSIONS = new Set([
  "AUTO", "AUTOMATIC", "MANUAL", "CVT", "DSG", "PDK", "DCT", "EDC",
  "POWERSHIFT", "EAT6", "EAT8", "MULTITRONIC",
]);

const FUEL_INDICATORS = new Set([
  "TDI", "TFSI", "TSI", "HDI", "CDTI", "TDCI", "HYBRID", "ELECTRIC",
  "PHEV", "MHEV", "ECOBOOST", "SKYACTIV", "JTDM", "MULTIJET", "CRDI",
  "GDI", "DCI", "BLUEHDI", "GTI", "GTD", "GTE", "BLUETEC", "CGI", "CDI",
  "VTEC", "VVTI", "PEV", "BEV", "HEV",
]);

const DRIVE_TYPES = new Set([
  "QUATTRO", "4MATIC", "XDRIVE", "4WD", "AWD", "4MOTION", "ALL4",
  "EDRIVE", "ETRON",
]);

// Standalone fuel letters — single D/I/E when appearing as separate words
// "320D" is handled by the numeric suffix stripper; this catches "C220 D" patterns
const STANDALONE_FUEL_LETTERS = new Set(["D", "I", "E"]);

// Words to skip — they appear often but carry no useful classification
const SKIP_WORDS = new Set([
  "ULTRA", "PLUS", "PRO", "NEW", "MY", "UK", "SS",
]);

// ── Title case helper ────────────────────────────────────────────────────────

// Short tokens (<=2 chars) stay uppercase: "SE" not "Se", "FR" not "Fr"
// Known brand-cased words get special handling
const BRAND_CASE: Record<string, string> = {
  "4matic": "4MATIC", "xdrive": "xDrive", "4motion": "4Motion",
  "all4": "ALL4", "edrive": "eDrive", "etron": "e-tron", "quattro": "Quattro",
  "amg": "AMG", "bmw": "BMW", "vw": "VW",
};

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => {
      if (BRAND_CASE[w]) return BRAND_CASE[w];
      if (w.length <= 2) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

// ── Core parser ──────────────────────────────────────────────────────────────

export function parseModel(model: string, make?: string): ParsedModel {
  if (!model || model.trim().length === 0) {
    return { baseModel: model || "", bodyStyle: null, trim: null, fuelIndicator: null, transmission: null, driveType: null, engineDesc: null };
  }

  // Normalize: uppercase, collapse whitespace
  let input = model.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

  // Track classified token positions
  const classified = new Set<number>(); // indices into the token array after multi-word extraction

  // Results
  let bodyStyle: string | null = null;
  let trim: string | null = null;
  let fuelIndicator: string | null = null;
  let transmission: string | null = null;
  let driveType: string | null = null;
  let engineSize: string | null = null;

  // Step 1: Extract multi-word tokens (longest match first to prevent partial matches)
  const allMultiWord: Array<{ pattern: string; category: "trim" | "transmission" | "bodyStyle" | "fuel" | "drive" }> = [
    ...MULTI_WORD_TRIMS.map((p) => ({ pattern: p, category: "trim" as const })),
    ...MULTI_WORD_TRANSMISSIONS.map((p) => ({ pattern: p, category: "transmission" as const })),
    ...MULTI_WORD_BODY_STYLES.map((p) => ({ pattern: p, category: "bodyStyle" as const })),
    ...MULTI_WORD_FUEL.map((p) => ({ pattern: p, category: "fuel" as const })),
    ...MULTI_WORD_DRIVE.map((p) => ({ pattern: p, category: "drive" as const })),
  ];

  // Sort by length descending so longer patterns match first
  allMultiWord.sort((a, b) => b.pattern.length - a.pattern.length);

  for (const { pattern, category } of allMultiWord) {
    // Use word boundary matching to avoid partial matches
    const regex = new RegExp(`\\b${pattern}\\b`);
    if (regex.test(input)) {
      switch (category) {
        case "trim":
          if (!trim) trim = titleCase(pattern);
          break;
        case "transmission":
          if (!transmission) transmission = titleCase(pattern); // e.g. "S Tronic"
          break;
        case "bodyStyle":
          if (!bodyStyle) bodyStyle = titleCase(pattern);
          break;
        case "fuel":
          if (!fuelIndicator) fuelIndicator = pattern; // keep uppercase
          break;
        case "drive":
          if (!driveType) driveType = titleCase(pattern);
          break;
      }
      // Remove matched pattern from input
      input = input.replace(regex, " ").replace(/\s+/g, " ").trim();
    }
  }

  // Step 2: Extract engine size (e.g. "2.0")
  const engineMatch = input.match(/\b(\d+\.\d+)\b/);
  if (engineMatch) {
    engineSize = engineMatch[1];
    input = input.replace(engineMatch[0], " ").replace(/\s+/g, " ").trim();
  }

  // Step 3: Classify remaining single-word tokens
  const tokens = input.split(/\s+/);
  const unclassified: Array<{ token: string; index: number }> = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;

    if (BODY_STYLES.has(token)) {
      if (!bodyStyle) bodyStyle = titleCase(token);
      classified.add(i);
    } else if (TRIMS.has(token)) {
      if (!trim) trim = titleCase(token);
      classified.add(i);
    } else if (TRANSMISSIONS.has(token)) {
      if (!transmission) transmission = token; // keep uppercase (DSG, CVT, etc.)
      classified.add(i);
    } else if (FUEL_INDICATORS.has(token)) {
      if (!fuelIndicator) fuelIndicator = token; // keep uppercase (TDI, TFSI, etc.)
      classified.add(i);
    } else if (DRIVE_TYPES.has(token)) {
      if (!driveType) driveType = titleCase(token);
      classified.add(i);
    } else if (STANDALONE_FUEL_LETTERS.has(token) && !fuelIndicator) {
      // Standalone D/I/E — diesel/petrol/electric indicator
      fuelIndicator = token;
      classified.add(i);
    } else if (SKIP_WORDS.has(token)) {
      classified.add(i);
    } else {
      // Check for fuel suffix on numeric model codes: "320D" → fuel "D"
      // But only if the token has digits followed by a single D/I/E letter
      const fuelSuffixMatch = token.match(/^([A-Z]?\d{2,4})(D|I|E)$/);
      if (fuelSuffixMatch && !fuelIndicator) {
        // "320D" → fuel indicator "D", token becomes "320"
        fuelIndicator = fuelSuffixMatch[2];
        unclassified.push({ token: fuelSuffixMatch[1], index: i });
      } else {
        unclassified.push({ token, index: i });
      }
    }
  }

  // Step 4: Assemble baseModel from leading unclassified tokens
  const baseModelTokens: string[] = [];
  for (const { token, index } of unclassified) {
    // Stop at the first gap — if there are classified tokens before this one
    // and there's a gap, remaining unclassified tokens aren't part of the base model
    if (baseModelTokens.length > 0) {
      // Check if there was a classified token between the last base token and this one
      const lastBaseIndex = unclassified[baseModelTokens.length - 1]?.index ?? -1;
      let gapHasClassified = false;
      for (let g = lastBaseIndex + 1; g < index; g++) {
        if (classified.has(g)) {
          gapHasClassified = true;
          break;
        }
      }
      if (gapHasClassified) break;
    }
    baseModelTokens.push(token);
  }

  // Build engine description from engine size
  let engineDesc: string | null = null;
  if (engineSize) {
    engineDesc = `${engineSize}L`;
  }

  // Build baseModel
  let baseModel = baseModelTokens.length > 0 ? baseModelTokens.join(" ") : "";

  // Graceful fallback: if nothing was classified and no base model extracted
  if (!baseModel && !bodyStyle && !trim && !fuelIndicator && !transmission && !driveType) {
    baseModel = model.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  }

  return {
    baseModel,
    bodyStyle,
    trim,
    fuelIndicator,
    transmission,
    driveType,
    engineDesc,
  };
}

// ── Lookup model expander ────────────────────────────────────────────────────

/**
 * Expand a parsed base model into a form better suited for VCA / NCAP / recall lookups.
 * BMW "320" → "3 SERIES", Mercedes "C220" → "C CLASS", etc.
 * Returns an uppercase string for lookup matching.
 */
export function expandBaseModelForLookup(make: string, parsed: ParsedModel): string {
  const normMake = make.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  const base = parsed.baseModel.toUpperCase().replace(/\s+/g, " ").trim();

  if (normMake === "BMW") {
    // "320" → "3 SERIES", "118" → "1 SERIES"
    const numMatch = base.match(/^(\d)\d{2}$/);
    if (numMatch) return `${numMatch[1]} SERIES`;
    // "M3" → "3 SERIES"
    const mMatch = base.match(/^M(\d)$/);
    if (mMatch) return `${mMatch[1]} SERIES`;
    // "X5", "I4" etc. stay as-is
  }

  if (normMake === "MERCEDES BENZ" || normMake === "MERCEDES-BENZ" || normMake === "MERCEDES") {
    // "C220" → "C CLASS", "A180" → "A CLASS", "E300" → "E CLASS"
    const classMatch = base.match(/^([A-Z])\d{2,3}$/);
    if (classMatch) return `${classMatch[1]} CLASS`;
    // "CLA", "GLC" etc. stay as-is
  }

  if (normMake === "AUDI") {
    // "A6", "Q5" etc. stay as-is — they're already clean base models
    // but "RS6" should stay as-is too
  }

  // Default: return the base model as-is
  return base || make.toUpperCase();
}
