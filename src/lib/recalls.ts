// Safety recalls matching logic

export type Recall = {
  make: string;
  models: string[];
  buildDateStart: string;
  buildDateEnd: string;
  recallDate: string;
  defect: string;
  remedy: string;
  recallNumber: string;
};

function normalizeStr(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

// Known fuel/engine variant suffixes that don't change the base model.
// "320D" is a diesel 320, "118I" is a petrol 118 — same recall applies.
// But "500X" is a different model from "500" — X is NOT a fuel suffix.
const FUEL_SUFFIXES = /^(D|I|E|S|DI|TD|TDI|CDI|HDI|TDCI|TFSI|TSI|GTI|GTD|GTE|SDI|CRDI|PHEV|EV|BEV)$/;

/**
 * Strip a known fuel/engine suffix from a numeric model code.
 * "320D" → "320", "118I" → "118", "A180D" → "A180"
 * Returns null if no suffix was stripped or the token isn't a
 * numeric model code pattern.
 */
function stripFuelSuffix(token: string): string | null {
  // Match: digits (optionally preceded by a single letter) + suffix
  // e.g. "320D", "118I", "A180D", "C220D", "E300E"
  const match = token.match(/^([A-Z]?\d{2,4})(D|I|E|S|DI|TD|TDI|CDI|HDI|TDCI|TFSI|TSI|GTI|GTD|GTE|SDI|CRDI|PHEV)$/);
  if (match) return match[1];
  return null;
}

/**
 * Token-based model matching — avoids substring false positives.
 *
 * "500X" must NOT match a recall for "500" (different vehicle).
 * "500" must NOT match a recall for "500X" or "500L".
 * "320D" SHOULD match a recall for "320" (diesel variant, same car).
 * "118I" SHOULD match a recall for "118" (petrol variant, same car).
 * "FOCUS" SHOULD match a recall for "FOCUS C-MAX" (same platform).
 * "GOLF" SHOULD match a recall for "GOLF PLUS" (shared platform).
 * "C CLASS" SHOULD match "C-CLASS" (normalised to same tokens).
 *
 * Logic:
 * 1. Exact token match on the primary (first) token
 * 2. If no match, try stripping known fuel suffixes (D/I/TDI etc.)
 *    from the vehicle token — "320D" → "320" → matches recall "320"
 */
function modelMatches(recallModel: string, vehicleModel: string): boolean {
  const recall = normalizeStr(recallModel);
  const vehicle = normalizeStr(vehicleModel);

  // Exact match (after normalisation)
  if (recall === vehicle) return true;

  const recallTokens = recall.split(/\s+/);
  const vehicleTokens = vehicle.split(/\s+/);
  const primaryVehicleToken = vehicleTokens[0];

  // 1. Exact primary token match
  if (recallTokens.some((t) => t === primaryVehicleToken)) return true;

  // 2. Try stripping fuel suffix from the vehicle token
  //    "320D" → "320", then check if "320" is in recall tokens
  const stripped = stripFuelSuffix(primaryVehicleToken);
  if (stripped && recallTokens.some((t) => t === stripped)) return true;

  return false;
}

export function findRecalls(
  recalls: Recall[],
  make?: string,
  model?: string,
  yearOfManufacture?: number
): Recall[] {
  if (!make) return [];

  const normMake = normalizeStr(make);

  return recalls
    .filter((r) => {
      // 1. Exact make match (normalized)
      if (normalizeStr(r.make) !== normMake) return false;

      // 2. Token-based model match (not substring)
      if (model) {
        const matched = r.models.some((m) => modelMatches(m, model));
        if (!matched) return false;
      }

      // 3. Year within build date range
      if (yearOfManufacture && r.buildDateStart && r.buildDateEnd) {
        const startYear = new Date(r.buildDateStart).getFullYear();
        const endYear = new Date(r.buildDateEnd).getFullYear();
        if (yearOfManufacture < startYear || yearOfManufacture > endYear) return false;
      }

      return true;
    })
    .sort((a, b) => new Date(b.recallDate).getTime() - new Date(a.recallDate).getTime());
}
