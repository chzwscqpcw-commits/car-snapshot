// Build a list of "Did you know?" facts for a specific make/model.
//
// Two sources, combined:
//   1. Curated trivia (src/data/model-trivia.ts) — hand-written heritage/records.
//   2. Derived facts — computed from data the results page already holds
//      (how-many-left rarity, Euro NCAP, MOT pass rate, theft risk). Always
//      accurate because they're generated straight from the datasets.
//
// Derived facts use a generic subject ("It scored…") so they read naturally
// under a "Did you know about your <Vehicle>?" header and sidestep the
// make/model casing problem (DVLA returns uppercase).

import { modelTrivia, makeTrivia } from "@/data/model-trivia";

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

const MAKE_ALIASES: Record<string, string> = {
  MERCEDES: "MERCEDES BENZ",
  "MERCEDES-BENZ": "MERCEDES BENZ",
  VW: "VOLKSWAGEN",
  LANDROVER: "LAND ROVER",
};

function normMake(make: string): string {
  const n = normalize(make);
  return MAKE_ALIASES[n] ?? n;
}

/** Curated facts: model-level first, make-level fallback. */
function getCuratedFacts(make?: string, model?: string): string[] {
  if (!make) return [];
  const mk = normMake(make);
  if (model) {
    const key = `${mk}|${normalize(model)}`;
    if (modelTrivia[key]?.length) return modelTrivia[key];
  }
  return makeTrivia[mk] ?? [];
}

// Tokens kept uppercase when prettifying a vehicle name for display.
const KEEP_UPPER = new Set([
  "BMW", "MG", "VW", "DS", "GTI", "GTD", "GTE", "GT", "RS", "ST", "AMG", "SE",
  "SRI", "TT", "CLA", "CLS", "GLA", "GLC", "GLE", "GLS", "SL", "SLK",
  "RAV4", "CHR", "HR", "UX", "NX", "RX", "EV", "ID", "EQ",
]);

function prettyToken(token: string): string {
  // Hyphenated parts (MERCEDES-BENZ, MX-5) handled piece by piece.
  if (token.includes("-")) return token.split("-").map(prettyToken).join("-");
  if (!token) return token;
  if (/\d/.test(token)) return token.toUpperCase();          // A4, 500X, 208, MX5
  if (KEEP_UPPER.has(token.toUpperCase())) return token.toUpperCase();
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

/** Title-case a make+model for display, preserving known all-caps brands. */
export function formatVehicleName(make?: string, model?: string): string {
  const parts = [make, model].filter(Boolean).join(" ");
  if (!parts) return "your car";
  return parts.split(/\s+/).map(prettyToken).join(" ");
}

export interface ModelFactsInput {
  make?: string;
  /** Display model string (data.model). */
  model?: string;
  /** Expanded model for curated matching (lookupModel), if available. */
  lookupModel?: string;
  rarity?: { licensed: number; category: string } | null;
  ncap?: { overallStars: number; yearTested?: number } | null;
  motPassRate?: { passRate: number; aboveAverage: boolean; nationalAverage: number } | null;
  theftRisk?: { theftsPer1000: number; riskCategory: string } | null;
}

function rarityFact(r: { licensed: number; category: string }): string | null {
  const n = r.licensed;
  if (!n || n <= 0) return null;
  const count = n.toLocaleString();
  switch (r.category) {
    case "very-common":
      return `One of Britain's most common cars — around ${count} are still licensed for UK roads.`;
    case "common":
      return `There are around ${count} still licensed for UK roads.`;
    case "uncommon":
      return `It's becoming less common — around ${count} remain licensed in the UK.`;
    case "rare":
      return `It's now a rare sight, with only around ${count} still licensed in the UK.`;
    case "very-rare":
      return `A genuine rarity — only around ${count} remain licensed on UK roads.`;
    default:
      return `Around ${count} are still licensed for UK roads.`;
  }
}

/** Combine curated + derived facts, de-duplicated. */
export function buildModelFacts(input: ModelFactsInput): { vehicleName: string; facts: string[] } {
  const vehicleName = formatVehicleName(input.make, input.model);
  const facts: string[] = [];

  // 1. Curated trivia (the delightful stuff) leads.
  facts.push(...getCuratedFacts(input.make, input.lookupModel ?? input.model));

  // 2. Derived facts — always true, computed from the datasets.
  const r = input.rarity ? rarityFact(input.rarity) : null;
  if (r) facts.push(r);

  if (input.ncap && input.ncap.overallStars >= 1 && input.ncap.overallStars <= 5) {
    const yr = input.ncap.yearTested ? ` (tested ${input.ncap.yearTested})` : "";
    facts.push(`It scored ${input.ncap.overallStars} stars in Euro NCAP crash testing${yr}.`);
  }

  if (input.motPassRate) {
    const { passRate, aboveAverage, nationalAverage } = input.motPassRate;
    facts.push(
      `Its national MOT pass rate is ${passRate}% — ${aboveAverage ? "above" : "below"} the UK average of ${nationalAverage}%.`,
    );
  }

  // Theft fact only when it's a positive (low risk) — don't alarm in a fun card.
  if (input.theftRisk && (input.theftRisk.riskCategory === "low" || input.theftRisk.riskCategory === "very-low")) {
    const t = Math.round(input.theftRisk.theftsPer1000 * 10) / 10;
    facts.push(`Thefts are uncommon for this model — about ${t} per 1,000 on the road each year.`);
  }

  // De-dupe (exact) while preserving order.
  const seen = new Set<string>();
  const unique = facts.filter((f) => {
    if (seen.has(f)) return false;
    seen.add(f);
    return true;
  });

  return { vehicleName, facts: unique };
}
