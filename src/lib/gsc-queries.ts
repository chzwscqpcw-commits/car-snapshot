// The search terms the dashboard tracks, grouped by what the searcher wants.
// No server imports, so the dashboard (a client page) can group rows by it.
//
// Refreshed 30 Oct 2026 from Search Console: the original list (Aug 2026) was
// nine variants of "free car valuation without email" plus the brand. By late
// Oct two other families were bringing real traffic — the plate checks ("plate
// check" 657 clicks / 54.7k impressions over 3 months, "plate checker" 557 /
// 106.7k) and How Many Left — and the dashboard showed neither. The snapshot
// also keeps the top queries by clicks, untracked or not, so the next one
// shows up without anyone editing this list.

export interface QueryGroup {
  label: string;
  queries: string[];
}

export const KEY_QUERY_GROUPS: QueryGroup[] = [
  {
    label: "Plate check",
    queries: [
      "plate check",
      "plate checker",
      "number plate check",
      "number plate checker",
      "reg plate check",
      "registration plate check",
      "license plate lookup",
      "license plate check",
      "licence plate check",
      "car plate check",
      "license plate checker",
    ],
  },
  {
    label: "Valuation",
    queries: [
      "free car valuation without email",
      "free car valuation without personal details",
      "free car valuation without email or phone number",
      "value my car without signing up",
      "car valuation without email",
      "free car valuation",
      "car value check no email",
    ],
  },
  {
    label: "How Many Left",
    queries: ["how many left", "how many left cars"],
  },
  {
    label: "Brand",
    queries: ["free plate check", "freeplatecheck"],
  },
];

export const KEY_QUERIES: string[] = KEY_QUERY_GROUPS.flatMap((g) => g.queries);

/** Which group a query belongs to, or null if it isn't tracked. */
export function queryGroup(query: string): string | null {
  const q = query.toLowerCase();
  return KEY_QUERY_GROUPS.find((g) => g.queries.includes(q))?.label ?? null;
}

/** How many of the top queries by clicks each snapshot keeps. */
export const TOP_QUERIES = 20;
