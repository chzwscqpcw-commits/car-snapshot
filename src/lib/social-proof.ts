/**
 * The homepage's "N+ checked" figure: how many lookups are in `site_events`.
 *
 * It is the planner's estimate, not an exact count. An exact count reads
 * every row of the table, and by October 2026 that took longer than the
 * database's 3-second statement timeout (Postgres 57014), so the route failed
 * on most requests and the figure dropped off the homepage. The estimate
 * comes from table statistics, costs the same however large the table gets,
 * and on 12 Nov 2026 was 2.1% under the true count (122,723 against 125,343).
 * The page rounds down to the nearest hundred and adds a "+", so that is
 * close enough.
 *
 * The figure is decoration. Nothing here throws: a failed count gives the
 * last figure this server instance read, or no figure at all, and the page
 * leaves the counter out.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** How long to wait for the database before giving up on this request. */
const COUNT_TIMEOUT_MS = 2500;

export type LookupTotal =
  | { total: number; source: "live" }
  /** The count failed; `total` is the last one that worked on this instance. */
  | { total: number; source: "last-good"; failure: string }
  /** The count failed and this instance has never had one. */
  | { total: null; source: "none"; failure: string };

/**
 * Kept per server instance. Instances are reused across requests, so this
 * covers a short database wobble; a fresh instance starts with nothing.
 */
let lastGood: number | null = null;

/** Test hook: forget the last good figure. */
export function resetLookupTotal(): void {
  lastGood = null;
}

function describe(error: { code?: string; message?: string }, status: number | undefined): string {
  const parts = [error.code, error.message, status ? `HTTP ${status}` : undefined].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "no detail from the database";
}

async function countLookups(sb: SupabaseClient): Promise<number> {
  // A GET for zero rows, not a HEAD: a HEAD has no body, so a failure came
  // back with an empty message and the logs said nothing about why.
  const { count, error, status } = await sb
    .from("site_events")
    .select("id", { count: "planned" })
    .eq("event_type", "lookup")
    .limit(0)
    .abortSignal(AbortSignal.timeout(COUNT_TIMEOUT_MS));

  if (error) throw new Error(describe(error, status));
  if (typeof count !== "number" || !Number.isFinite(count) || count < 0) {
    throw new Error(`no count in the response (HTTP ${status})`);
  }
  return count;
}

/**
 * Read the figure. `client` is called inside the guard because making the
 * client throws when the environment variables are missing.
 */
export async function readLookupTotal(client: () => SupabaseClient): Promise<LookupTotal> {
  try {
    const count = await countLookups(client());
    // Statistics are refreshed now and then and the estimate can step down a
    // little when they are. A counter of checks made should not go backwards.
    lastGood = Math.max(count, lastGood ?? 0);
    return { total: lastGood, source: "live" };
  } catch (err) {
    const failure = err instanceof Error ? err.message : String(err);
    return lastGood === null
      ? { total: null, source: "none", failure }
      : { total: lastGood, source: "last-good", failure };
  }
}
