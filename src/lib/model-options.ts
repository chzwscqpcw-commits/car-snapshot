// The models we can put a price on, per make: the choices offered when the
// MOT service is down and a car arrives without its model (DVLA returns the
// make only). Built from the two tables the valuation already ships — the
// list-price table and the market calibration — so every option is one the
// model can actually start from, and it costs the bundle nothing.

import newPricesData from "@/data/new-prices.json";
import calibrationData from "@/data/model-price-calibration.json";

function normMake(make: string): string {
  const m = make.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  // DVLA says both; the tables say MERCEDES BENZ / MERCEDES-BENZ.
  return m === "MERCEDES" ? "MERCEDES BENZ" : m;
}

function normModel(model: string): string {
  return model.toUpperCase().replace(/\s+/g, " ").trim();
}

/** "CORSA E", "ASTRA ELECTRIC": the fuel type already says a car is electric,
 *  so the electrified namesake of a listed model is one choice too many. */
const ELECTRIFIED_SUFFIX = / (E|EV|ELECTRIC)$/;

let byMake: Map<string, string[]> | null = null;

function build(): Map<string, string[]> {
  const sets = new Map<string, Set<string>>();
  // "C HR" (list prices) and "C-HR" (calibration) are one car: first spelling wins.
  const seen = new Set<string>();
  const add = (make: string, model: string) => {
    const mk = normMake(make);
    const md = normModel(model);
    if (!mk || !md) return;
    const key = `${mk}|${md.replace(/-/g, " ")}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (!sets.has(mk)) sets.set(mk, new Set());
    sets.get(mk)!.add(md);
  };
  for (const row of newPricesData as Array<{ make: string; model: string }>) add(row.make, row.model);
  for (const key of Object.keys((calibrationData as { families: Record<string, unknown> }).families)) {
    const [make, family] = key.split("|");
    if (make && family) add(make, family);
  }
  const out = new Map<string, string[]>();
  for (const [make, models] of sets) {
    const list = [...models].filter((m) => !(ELECTRIFIED_SUFFIX.test(m) && models.has(m.replace(ELECTRIFIED_SUFFIX, ""))));
    out.set(make, list.sort((a, b) => a.localeCompare(b, "en", { numeric: true })));
  }
  return out;
}

/** Models we can price for this make, A–Z. Empty when the make is unknown. */
export function modelOptionsForMake(make?: string | null): string[] {
  if (!make) return [];
  byMake ??= build();
  return byMake.get(normMake(make)) ?? [];
}

/** A typed model name, tidied to the shape DVLA uses (upper case, single
 *  spaces, no punctuation beyond a hyphen or dot), or null when it is empty. */
export function cleanTypedModel(input: string): string | null {
  const cleaned = input
    .toUpperCase()
    .replace(/[^A-Z0-9 .\-+]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  return cleaned.length > 0 ? cleaned : null;
}
