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

      // 2. Fuzzy model match (substring in either direction)
      if (model) {
        const normModel = normalizeStr(model);
        const modelMatch = r.models.some((m) => {
          const normRecallModel = normalizeStr(m);
          return normRecallModel.includes(normModel) || normModel.includes(normRecallModel);
        });
        if (!modelMatch) return false;
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
