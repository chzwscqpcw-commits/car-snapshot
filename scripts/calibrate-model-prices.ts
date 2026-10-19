/**
 * Builds src/data/model-price-calibration.json — a market-calibrated
 * "effective new price" per model family, from our own valuation telemetry.
 *
 * Usage (needs .env.local with the Supabase URL + anon key, as for analytics):
 *   npx tsx scripts/calibrate-model-prices.ts               # last 120 days
 *   npx tsx scripts/calibrate-model-prices.ts --days=180
 *
 * WHY. The depreciation baseline is list-price × deflator × curve × retention,
 * and list price is the weak link. new-prices.json is scraped from Parkers,
 * which only prices cars on sale today, keeps one price per make+model, and
 * takes it from whichever review was touched last — so whole marques are
 * missing (no Mercedes or Jaguar rows in Oct 2026), discontinued models fall
 * to a make average (a third of all valuations), and older generations get
 * today's price (every Range Rover at £108,960).
 *
 * Every `valuation_result` event that found eBay comparables records what
 * that make/model/year actually sells for. Dividing that market median by
 * deflator × curve × retention gives the list price that WOULD have produced
 * it; the median of those across a family's years is its effective price.
 * Leave-one-out on Oct 2026 data: per-car error 38% -> 22%, share within
 * ±25% of market 36% -> 54%, covering families behind 71% of valuations.
 *
 * Not a feedback loop: the input is eBay's market median (already discounted
 * 4% to transaction in the valuation route), never our own estimate.
 *
 * The effective price is NOT a list price and must never be displayed as
 * "new from £X" — cars like the Citroen C1 hold their value in pounds, so
 * their effective price sits well above what they cost new. It only feeds
 * calculateDepreciationBaseline.
 *
 * Re-run after changing the depreciation curve, retention or deflator: the
 * effective price is defined relative to them.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  getDepreciationMultiplier,
  getListPriceDeflator,
  getMakeRetentionMultiplier,
} from "../src/lib/valuation";
import { modelFamily } from "../src/lib/model-family";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "src", "data", "model-price-calibration.json");

/** A family needs this many make/model/year observations… */
const MIN_OBS = 4;
/** …spanning this many distinct ages, so one generation can't define it. */
const MIN_AGES = 3;
/** Comparables per observation — fewer and the eBay median is one listing. */
const MIN_LISTINGS = 3;

type Obs = {
  make: string;
  model: string;
  year: number;
  age: number;
  ebayMedian: number;
  ebayListingCount: number;
};

function readEnv(): Record<string, string> {
  const raw = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  return Object.fromEntries(
    raw
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
      }),
  );
}

function median(xs: number[]): number {
  const a = [...xs].sort((x, y) => x - y);
  const n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
}

async function main(): Promise<void> {
  const daysArg = process.argv.find((a) => a.startsWith("--days="));
  const days = daysArg ? Number(daysArg.split("=")[1]) : 120;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const env = readEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Cursor on created_at, not .range(): offset paging over this table hits
  // the statement timeout past ~80k rows.
  const latest = new Map<string, Obs>();
  let cursor = since;
  let events = 0;
  for (;;) {
    const { data, error } = await sb
      .from("site_events")
      .select("metadata,created_at")
      .eq("event_type", "valuation_result")
      .not("metadata->>ebayMedian", "is", null)
      .gt("created_at", cursor)
      .order("created_at")
      .limit(1000);
    if (error) throw new Error(`site_events: ${error.message}`);
    for (const r of data) {
      const m = r.metadata as Partial<Obs> & { internal?: boolean };
      if (m.internal || !m.make || !m.model || !m.year) continue;
      // Latest observation per make/model/year: the market moves.
      latest.set(`${m.make}|${m.model}|${m.year}`, m as Obs);
    }
    events += data.length;
    if (data.length < 1000) break;
    cursor = data[data.length - 1].created_at as string;
  }

  const families = new Map<string, { implied: number[]; ages: Set<number> }>();
  for (const o of latest.values()) {
    if (!(o.ebayMedian > 0) || (o.ebayListingCount ?? 0) < MIN_LISTINGS) continue;
    if (!(o.age >= 1 && o.age <= 25)) continue;
    const fam = modelFamily(o.make, o.model);
    if (!fam) continue;
    const perPound =
      getListPriceDeflator(o.age) *
      getDepreciationMultiplier(o.age) *
      getMakeRetentionMultiplier(o.make, o.model);
    if (!(perPound > 0)) continue;
    const f = families.get(fam) ?? { implied: [], ages: new Set<number>() };
    f.implied.push(o.ebayMedian / perPound);
    f.ages.add(o.age);
    families.set(fam, f);
  }

  // minAge/maxAge bound where the price may be applied (± AGE_MARGIN at
  // runtime). A family is often one generation in the data: every Land Rover
  // Defender observed in Oct 2026 was a 2001-2016 classic, whose effective
  // price (£234k) would value a 3-year-old new-shape Defender at ~£90k.
  const out: Record<string, { price: number; n: number; minAge: number; maxAge: number }> = {};
  for (const [fam, f] of [...families.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (f.implied.length < MIN_OBS || f.ages.size < MIN_AGES) continue;
    out[fam] = {
      price: Math.round(median(f.implied) / 50) * 50,
      n: f.implied.length,
      minAge: Math.min(...f.ages),
      maxAge: Math.max(...f.ages),
    };
  }

  const payload = {
    generatedAt: new Date().toISOString().slice(0, 10),
    windowDays: days,
    events,
    observations: latest.size,
    rule: `median(ebayMedian / (deflator x curve x retention)) per family; >=${MIN_OBS} obs over >=${MIN_AGES} ages, >=${MIN_LISTINGS} listings each; applied only within minAge-2..maxAge+2`,
    families: out,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(
    `${events} events -> ${latest.size} make/model/years -> ${Object.keys(out).length} calibrated families -> ${path.relative(ROOT, OUT)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
