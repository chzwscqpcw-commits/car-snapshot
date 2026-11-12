/**
 * Two small guards for /api/lookup, added after November 2026, when a script
 * calling the route directly (no page, rotating addresses, one list of plates
 * asked for again and again) grew to over half of all recorded lookups and
 * asked for one unregistered plate 112 times in four minutes.
 *
 * 1. `calledFromOurPages` tells a lookup made by one of our pages from one
 *    made by anything else, so the two can be counted apart.
 * 2. `UnknownPlates` remembers for a few minutes that DVLA does not know a
 *    plate, so asking again does not reach DVLA and DVSA again.
 *
 * Neither blocks anyone. A caller can forge the headers the first one reads;
 * it is for honest counting, not for access control.
 */

/**
 * Did one of our own pages make this request?
 *
 * A browser running our page says so on every `fetch`: `Sec-Fetch-Site:
 * same-origin` (all current browsers), and on a POST an `Origin` header that
 * names this host (older Safari sends only that). A script calling the route
 * sends neither unless it sets them on purpose.
 */
export function calledFromOurPages(headers: Headers): boolean {
  if (headers.get("sec-fetch-site") === "same-origin") return true;

  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.split(",")[0].trim().toLowerCase();
  } catch {
    return false;
  }
}

/** What DVLA said about a plate it has no record of. */
export type UnknownPlateAnswer = { error: string; status: number };

/** Ten minutes: long enough to stop a loop, short enough for a plate registered today. */
export const UNKNOWN_PLATE_TTL_MS = 10 * 60 * 1000;
const MAX_REMEMBERED = 5000;

/**
 * Plates DVLA has just told us it does not know, by hash, per server
 * instance. Instances are reused across requests, so a repeat usually lands
 * on one that remembers; one that does not asks once and then remembers too.
 */
export class UnknownPlates {
  private readonly held = new Map<string, UnknownPlateAnswer & { until: number }>();

  constructor(
    private readonly ttlMs: number = UNKNOWN_PLATE_TTL_MS,
    private readonly max: number = MAX_REMEMBERED,
  ) {}

  remember(key: string, answer: UnknownPlateAnswer, now: number = Date.now()): void {
    this.held.delete(key); // re-insert, so the oldest entry is always first
    this.held.set(key, { ...answer, until: now + this.ttlMs });
    while (this.held.size > this.max) {
      const oldest = this.held.keys().next().value;
      if (oldest === undefined) break;
      this.held.delete(oldest);
    }
  }

  recall(key: string, now: number = Date.now()): UnknownPlateAnswer | null {
    const entry = this.held.get(key);
    if (!entry) return null;
    if (now >= entry.until) {
      this.held.delete(key);
      return null;
    }
    return { error: entry.error, status: entry.status };
  }

  get size(): number {
    return this.held.size;
  }
}
