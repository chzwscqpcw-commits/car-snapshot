/**
 * Step 3 of the calibration harness — measure the bias. Spends nothing.
 *
 * Produces four answers:
 *
 *  1. HOW BIASED IS OUR MODEL — our depreciation baseline vs MarketCheck's
 *     transaction-value prediction, overall and per age band.
 *
 *  2. WHAT IS THE REAL ASKING->TRANSACTION GAP — reference price vs the
 *     listing's own asking price, for the same vehicle. This is the number
 *     ASKING_PRICE_DISCOUNT = 0.96 (src/app/api/valuation/route.ts:118) is
 *     currently guessing at, and it is measured here for free as a by-product.
 *
 *  3. HOW BIG DOES THE FULL RUN NEED TO BE — the observed disagreement SD
 *     resizes the £60 run properly instead of relying on my ±15% guess.
 *
 *  4. HOW OFTEN DOES THE NEW-PRICE LOOKUP FALL BACK — src/data/new-prices.json
 *     holds 222 CURRENT list prices, so any discontinued nameplate (Fiesta,
 *     Mondeo, Astra...) misses and depreciates from a make average instead of
 *     what the car actually cost new. Suspected to be a large bias source;
 *     this quantifies it.
 *
 * Usage:
 *   npx tsx scripts/calibration/analyse.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  AGE_BANDS,
  CAL_DIR,
  REFERENCE_PATH,
  SAMPLE_PATH,
  type ReferenceRow,
  type Sample,
  gbp,
} from "./lib";
import {
  calculateDepreciationBaseline,
  lookupNewPrice,
} from "../../src/lib/valuation";

const CURRENT_YEAR = new Date().getUTCFullYear();
/** Mirrors ASKING_PRICE_DISCOUNT in src/app/api/valuation/route.ts:118. */
const CURRENT_ASKING_DISCOUNT = 0.96;

type NewPriceEntry = { make: string; model: string; newPrice: number };
const NEW_PRICES = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../src/data/new-prices.json"), "utf8"),
) as NewPriceEntry[];

const norm = (s: string): string =>
  s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Which branch of lookupNewPrice() fired. Mirrors the logic in
 * src/lib/valuation.ts:86-116 — duplicated deliberately, because the real
 * function returns only a number and we need to know WHERE it came from.
 * Keep in step with that function if it changes.
 */
function newPriceSource(make: string, model: string): "exact" | "fuzzy" | "make-average" {
  const m = norm(make);
  const md = norm(model);
  if (NEW_PRICES.some((e) => norm(e.make) === m && norm(e.model) === md)) return "exact";
  const sameMake = NEW_PRICES.filter((e) => norm(e.make) === m);
  if (sameMake.some((e) => md.includes(norm(e.model)) || norm(e.model).includes(md))) {
    return "fuzzy";
  }
  return "make-average";
}

// ── Stats ───────────────────────────────────────────────────────────────────

type Stats = { n: number; mean: number; median: number; sd: number };

function stats(xs: number[]): Stats {
  const n = xs.length;
  if (n === 0) return { n: 0, mean: NaN, median: NaN, sd: NaN };
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const sd = n < 2 ? 0 : Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  return { n, mean, median, sd };
}

/** Sample size for a given half-width at 95% confidence. */
const requiredN = (sd: number, marginPct: number): number =>
  Math.ceil(((1.96 * sd) / marginPct) ** 2);

const pct = (x: number): string => (Number.isFinite(x) ? `${x >= 0 ? "+" : ""}${x.toFixed(1)}%` : "—");

// ── Load ────────────────────────────────────────────────────────────────────

if (!fs.existsSync(SAMPLE_PATH)) {
  console.error(`No sample at ${SAMPLE_PATH}. Run sample.ts first.`);
  process.exit(1);
}
if (!fs.existsSync(REFERENCE_PATH)) {
  console.error(`No reference prices at ${REFERENCE_PATH}. Run reference.ts first.`);
  process.exit(1);
}

const sample = JSON.parse(fs.readFileSync(SAMPLE_PATH, "utf8")) as Sample;
const refByVrm = new Map<string, number>();
for (const line of fs.readFileSync(REFERENCE_PATH, "utf8").split("\n")) {
  if (!line.trim()) continue;
  try {
    const row = JSON.parse(line) as ReferenceRow;
    if (row.marketcheckPrice !== null) refByVrm.set(row.vrm, row.marketcheckPrice);
  } catch {
    // Truncated final line — ignore.
  }
}

type Row = {
  band: string;
  age: number;
  make: string;
  model: string;
  ours: number;
  asking: number;
  reference: number;
  newPriceUsed: number;
  newPriceSource: "exact" | "fuzzy" | "make-average";
  /** Our estimate vs the transaction reference, as a percentage. */
  biasPct: number;
  /** What the asking price would have to be multiplied by to hit the
   *  reference. Compare against ASKING_PRICE_DISCOUNT = 0.96. */
  askingToRef: number;
};

const rows: Row[] = [];
for (const v of sample.vehicles) {
  const reference = refByVrm.get(v.vrm);
  if (reference === undefined) continue;
  const age = Math.max(0, CURRENT_YEAR - v.year);
  const newPriceUsed = lookupNewPrice(NEW_PRICES, v.make, v.model) ?? 25000;
  // Mileage is no longer part of the baseline — it is applied to the blended
  // value in combineValuationLayers. Reported separately below.
  const ours = calculateDepreciationBaseline(newPriceUsed, age, v.make, v.model);
  rows.push({
    band: v.ageBand,
    age,
    make: v.make,
    model: v.model,
    ours,
    asking: v.askingPrice,
    reference,
    newPriceUsed,
    newPriceSource: newPriceSource(v.make, v.model),
    biasPct: ((ours - reference) / reference) * 100,
    askingToRef: reference / v.askingPrice,
  });
}

if (rows.length === 0) {
  console.error("No vehicles have both a sample entry and a reference price.");
  process.exit(1);
}

// ── Report ──────────────────────────────────────────────────────────────────

const out: string[] = [];
const say = (s = ""): void => {
  console.log(s);
  out.push(s);
};

const overall = stats(rows.map((r) => r.biasPct));
const askingGap = stats(rows.map((r) => (r.askingToRef - 1) * 100));

say(`# Valuation calibration — ${rows.length} vehicles`);
say();
say(`Reference: MarketCheck Price (transaction-value prediction, £0.30/call).`);
say(`Ours: the depreciation baseline from src/lib/valuation.ts, no market signals.`);
say();

say(`## 1. Is our model biased?`);
say();
say(`Mean bias   ${pct(overall.mean)}   (positive = we value HIGH)`);
say(`Median bias ${pct(overall.median)}`);
say(`SD          ${overall.sd.toFixed(1)}%`);
say(`95% CI on the mean: ${pct(overall.mean - (1.96 * overall.sd) / Math.sqrt(overall.n))} to ${pct(overall.mean + (1.96 * overall.sd) / Math.sqrt(overall.n))}`);
say();
say(`| Age band | n | mean bias | median | SD |`);
say(`|---|---|---|---|---|`);
for (const b of AGE_BANDS) {
  const s = stats(rows.filter((r) => r.band === b.label).map((r) => r.biasPct));
  if (s.n === 0) continue;
  say(`| ${b.label} | ${s.n} | ${pct(s.mean)} | ${pct(s.median)} | ${s.sd.toFixed(1)}% |`);
}
say();

say(`## 2. The real asking->transaction gap`);
say();
say(`Current code uses ASKING_PRICE_DISCOUNT = ${CURRENT_ASKING_DISCOUNT} (a ${((1 - CURRENT_ASKING_DISCOUNT) * 100).toFixed(0)}% haircut),`);
say(`applied to eBay only — the MarketCheck median gets no haircut at all.`);
say();
const meanFactor = stats(rows.map((r) => r.askingToRef)).mean;
say(`Measured: reference / asking = ${meanFactor.toFixed(3)}  (mean ${pct(askingGap.mean)})`);
say(`So the correct discount is ~${meanFactor.toFixed(2)}, vs ${CURRENT_ASKING_DISCOUNT} in the code.`);
say();

say(`## 3. Sizing the full run`);
say();
say(`Observed SD is ${overall.sd.toFixed(1)}%. At 95% confidence:`);
for (const margin of [2, 3, 4]) {
  const n = requiredN(overall.sd, margin);
  say(`  +/-${margin}% overall  → n = ${n}  (${gbp(n * 0.3)})`);
}
const perBand = requiredN(overall.sd, 3);
say(`  +/-3% per band  → n = ${perBand} x 5 bands = ${perBand * 5}  (${gbp(perBand * 5 * 0.3)})`);
say();

say(`## 4. New-price lookup fallback rate`);
say();
say(`src/data/new-prices.json holds ${NEW_PRICES.length} CURRENT list prices. Discontinued`);
say(`nameplates miss and fall back to a make average, depreciating from the wrong number.`);
say();
const bySource = ["exact", "fuzzy", "make-average"] as const;
say(`| lookup result | n | share | mean bias |`);
say(`|---|---|---|---|`);
for (const src of bySource) {
  const subset = rows.filter((r) => r.newPriceSource === src);
  if (subset.length === 0) continue;
  const s = stats(subset.map((r) => r.biasPct));
  say(`| ${src} | ${s.n} | ${((s.n / rows.length) * 100).toFixed(0)}% | ${pct(s.mean)} |`);
}
say();
say(`If 'make-average' rows are markedly more biased than 'exact' rows, the new-price`);
say(`table — not the depreciation curve — is the dominant error source.`);
say();

say(`## Worst offenders`);
say();
say(`| age | vehicle | new price used | ours | reference | bias |`);
say(`|---|---|---|---|---|---|`);
for (const r of [...rows].sort((a, b) => b.biasPct - a.biasPct).slice(0, 10)) {
  say(
    `| ${r.age} | ${r.make} ${r.model} | ${gbp(r.newPriceUsed)} (${r.newPriceSource}) | ` +
      `${gbp(r.ours)} | ${gbp(r.reference)} | ${pct(r.biasPct)} |`,
  );
}
say();

const fallbackNote = sample.vehicles.filter((v) => v.postalCodeSource === "fallback").length;
say(`---`);
say();
say(`Caveats:`);
say(`- ${fallbackNote}/${sample.vehicles.length} vehicles used a fallback postcode, so any`);
say(`  regional price effect in the reference is an unmeasured constant offset.`);
say(`- "Ours" is the depreciation baseline ALONE. The shipped tool blends in eBay and`);
say(`  cache signals, which are asking prices and will push the shipped number higher`);
say(`  still. Treat this bias as a floor, not the full picture.`);
say(`- The reference is a retail transaction value, not a private-sale price.`);

fs.writeFileSync(path.join(CAL_DIR, "report.md"), out.join("\n") + "\n");
console.log(`\nWritten to ${path.join(CAL_DIR, "report.md")} (no registrations included)`);
