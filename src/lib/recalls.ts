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

/**
 * Token-based model matching — avoids substring false positives.
 *
 * "500X" must NOT match a recall for "500" (different vehicle).
 * "500" must NOT match a recall for "500X" or "500L".
 * "FOCUS" SHOULD match a recall for "FOCUS C-MAX" (same platform).
 * "GOLF" SHOULD match a recall for "GOLF PLUS" (shared platform).
 * "C CLASS" SHOULD match "C-CLASS" (normalised to same tokens).
 *
 * Logic: the vehicle model's primary token (first word) must appear
 * as a complete, exact token in the recall model string.
 */
function modelMatches(recallModel: string, vehicleModel: string): boolean {
  const recall = normalizeStr(recallModel);
  const vehicle = normalizeStr(vehicleModel);

  // Exact match (after normalisation)
  if (recall === vehicle) return true;

  const recallTokens = recall.split(/\s+/);
  const vehicleTokens = vehicle.split(/\s+/);

  // The vehicle's primary model token must appear as a complete token
  // in the recall model. e.g. "500X" only matches recall tokens
  // containing "500X", not "500" or "500L".
  const primaryVehicleToken = vehicleTokens[0];

  if (!recallTokens.some((t) => t === primaryVehicleToken)) return false;

  // If the vehicle model has additional qualifying tokens that look
  // like variant identifiers (not generic words like SERIES/CLASS),
  // verify they also appear in the recall model to avoid matching
  // e.g. vehicle "FOCUS C MAX" against recall "FOCUS" only.
  // However, if the vehicle has extra tokens not in the recall, we
  // still match — the recall may cover the whole model family.
  // The critical check is the reverse: a recall for a SPECIFIC variant
  // should not match a DIFFERENT variant. That's already handled by
  // the primary token check above (e.g. "500X" ≠ "500").

  return true;
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
