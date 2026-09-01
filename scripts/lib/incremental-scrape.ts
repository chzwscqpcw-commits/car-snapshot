/**
 * Resumable, time-budgeted scraping.
 *
 * WHY THIS EXISTS. Both big scrapers (Parkers new-car prices, ev-database EV
 * specs) collected every page into memory and wrote the output file once, at
 * the very end. That makes a run all-or-nothing: if it is killed at 95%, it
 * writes nothing at all.
 *
 * Which is exactly what happened. `refresh-prices.yml` ran green every
 * Wednesday while both scrapers timed out mid-scrape — Parkers at 55 minutes
 * against 1,852 pages, EV specs at 10 minutes against 1,339. Both steps are
 * `continue-on-error`, so the job reported success, "check for changes" found
 * nothing, the commit step skipped, and nobody saw a thing. ev-specs.json sat
 * at its February values for 194 days and new-prices.json had not moved since
 * the day Parkers was added.
 *
 * Raising the timeout does not fix this — it was tried, and the workflow's own
 * comment says so: "the answer is to make the scraper incremental, not to raise
 * this again". At two requests a second with a politeness delay, a full pass
 * simply does not fit in a CI job, and never will.
 *
 * THE MODEL. Every run:
 *   1. loads the state file (what we scraped, when, and what we got);
 *   2. orders the work staleset-first — never-scraped URLs, then oldest;
 *   3. scrapes until its time budget runs out, then stops CLEANLY;
 *   4. merges what it got and writes BOTH the output and the state.
 *
 * So every run makes progress and commits it, however little. The dataset
 * converges over successive weeks instead of never arriving, and a bad week
 * costs one slice rather than everything.
 *
 * The state file is committed to the repo on purpose: CI runners are
 * ephemeral, so it is the only way a run can know what the last one did.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const STATE_DIR = path.resolve(__dirname, "..", "scrape-state");

/**
 * One scraped record, kept keyed by its dedupe key rather than its URL.
 *
 * `rank` is the tiebreak when several URLs collapse to the same key — a model
 * with multiple review or model-year pages. Higher wins. Each caller supplies
 * whatever it previously sorted on (ev-database's sitemap id, Parkers' lastmod
 * as epoch ms), so incremental runs keep the same winner the all-at-once
 * version would have picked. Without it, "most recently scraped wins" would
 * let an older model year quietly overwrite a newer one.
 */
export interface StoredRecord<R> {
  rank: number;
  scrapedAt: string;
  record: R;
}

export interface ScrapeState<R> {
  version: 1;
  updatedAt: string;
  /** url -> ISO timestamp it was last successfully attempted. */
  urls: Record<string, string>;
  /** dedupe key -> best record seen for it. */
  records: Record<string, StoredRecord<R>>;
}

function statePath(name: string): string {
  return path.join(STATE_DIR, `${name}.json`);
}

export function loadState<R>(name: string): ScrapeState<R> {
  const p = statePath(name);
  if (!fs.existsSync(p)) {
    return { version: 1, updatedAt: "", urls: {}, records: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(p, "utf-8")) as ScrapeState<R>;
    if (parsed?.version !== 1) throw new Error("unrecognised state version");
    return { version: 1, updatedAt: parsed.updatedAt ?? "", urls: parsed.urls ?? {}, records: parsed.records ?? {} };
  } catch (e) {
    // A corrupt state file must not wedge the scraper forever. Start clean —
    // the cost is one slow convergence cycle, not a permanent failure.
    console.warn(`  ! state file unreadable (${(e as Error).message}) — starting fresh`);
    return { version: 1, updatedAt: "", urls: {}, records: {} };
  }
}

export function saveState<R>(name: string, state: ScrapeState<R>): void {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(statePath(name), JSON.stringify(state, null, 2) + "\n");
}

/**
 * Order URLs so a partial run refreshes what most needs it: never-scraped
 * first, then oldest-scraped. Ties break on the caller's original ordering,
 * which both scrapers set to newest-first.
 *
 * URLs absent from the sitemap are NOT returned — a model that has been
 * delisted stops being refreshed. Its record stays in state until
 * `pruneRecords` drops it.
 */
export function orderByStaleness<R>(urls: string[], state: ScrapeState<R>): string[] {
  return [...urls].sort((a, b) => {
    const ta = state.urls[a];
    const tb = state.urls[b];
    if (!ta && !tb) return 0; // both new — keep caller's order
    if (!ta) return -1;
    if (!tb) return 1;
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
}

/**
 * Wall-clock budget for one run. Checked between pages, so a run overshoots by
 * at most one page rather than being killed mid-write.
 */
export class Deadline {
  private readonly endAt: number;
  constructor(budgetMinutes: number) {
    this.endAt = Date.now() + budgetMinutes * 60_000;
  }
  expired(): boolean {
    return Date.now() >= this.endAt;
  }
  remainingMinutes(): number {
    return Math.max(0, (this.endAt - Date.now()) / 60_000);
  }
}

/** Merge one freshly-scraped record in, keeping the higher-ranked of the two. */
export function upsertRecord<R>(
  state: ScrapeState<R>,
  key: string,
  rank: number,
  record: R,
): void {
  const existing = state.records[key];
  if (!existing || rank >= existing.rank) {
    state.records[key] = { rank, scrapedAt: new Date().toISOString(), record };
  }
}

/**
 * Drop records whose key no longer appears in the live set, so discontinued
 * models fall out instead of accumulating forever. Only safe to call after a
 * FULL pass — on a partial run `liveKeys` is just the slice we happened to
 * visit, and pruning on that would delete most of the dataset every week.
 */
export function pruneRecords<R>(state: ScrapeState<R>, liveKeys: Set<string>): number {
  let removed = 0;
  for (const key of Object.keys(state.records)) {
    if (!liveKeys.has(key)) {
      delete state.records[key];
      removed++;
    }
  }
  return removed;
}

/**
 * Seed an empty state from the existing output file.
 *
 * Without this the FIRST incremental run is destructive: state is empty, so
 * only the slice that run manages to scrape survives, and every record the
 * previous all-at-once process had collected is silently dropped. On
 * ev-specs.json that was 102 entries traded for whatever one budget bought.
 *
 * Seeded records get rank -1 and an epoch timestamp, so they are always
 * outranked by a real scrape and always sort to the front of the staleness
 * queue — they are placeholders that keep the site's data intact while the
 * incremental passes converge, not results in their own right.
 */
export function seedFromExisting<R>(
  state: ScrapeState<R>,
  existing: R[],
  keyOf: (r: R) => string,
): number {
  if (Object.keys(state.records).length > 0) return 0;
  for (const record of existing) {
    state.records[keyOf(record)] = { rank: -1, scrapedAt: "1970-01-01T00:00:00.000Z", record };
  }
  return existing.length;
}

/** Every stored record, ready to be sorted and written as the output file. */
export function allRecords<R>(state: ScrapeState<R>): R[] {
  return Object.values(state.records).map((r) => r.record);
}

/** How many of `urls` have never been scraped, and the oldest timestamp held. */
export function coverage<R>(urls: string[], state: ScrapeState<R>): {
  known: number;
  unknown: number;
  oldest: string | null;
} {
  let known = 0;
  let oldest: string | null = null;
  for (const u of urls) {
    const t = state.urls[u];
    if (!t) continue;
    known++;
    if (!oldest || t < oldest) oldest = t;
  }
  return { known, unknown: urls.length - known, oldest };
}

/**
 * Write an array of records one-per-line: `[`, then `  {...},` per record.
 *
 * Not cosmetic. `JSON.stringify(x, null, 2)` puts every field on its own line,
 * which turns a weekly refresh of a few values into a diff thousands of lines
 * long and roughly triples the bundled file. One record per line keeps each
 * changed record to a single changed line, so a data PR can actually be read —
 * and these files ship to the client, so the size matters too.
 */
export function writeCompactJsonArray(filePath: string, rows: unknown[]): void {
  const body = rows.map((r) => "  " + JSON.stringify(r)).join(",\n");
  fs.writeFileSync(filePath, rows.length ? `[\n${body}\n]\n` : "[]\n");
}

/** `--budget-minutes=N`, defaulting to `fallback`. */
export function parseBudgetMinutes(fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith("--budget-minutes="));
  if (!arg) return fallback;
  const n = parseFloat(arg.split("=")[1]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
