/**
 * Step 1 of the calibration harness — build a stratified sample of real UK
 * dealer listings to measure our valuation model against. See lib.ts for why.
 *
 * Costs £0.012 per search call (up to 50 listings each), so a full sample is
 * pennies. The expensive step is reference.ts; this one exists partly to prove
 * the approach works BEFORE any £0.30 call is possible.
 *
 * Usage:
 *   npx tsx scripts/calibration/sample.ts --probe
 *       One single call (£0.012). Dumps the response shape so we can confirm
 *       which field carries the VRM. ALWAYS RUN THIS FIRST — the UK
 *       active-listings response shape isn't in the public docs.
 *
 *   npx tsx scripts/calibration/sample.ts --per-band=8 --budget-gbp=1 --confirm
 *       Real sample. Writes .calibration/sample.json.
 *
 * Flags:
 *   --probe            single exploratory call, prints raw shape
 *   --per-band=N       vehicles wanted per age band (default 8)
 *   --budget-gbp=N     hard spend cap for this script (default 1.00)
 *   --confirm          actually spend; without it the script is a dry run
 *   --fallback-postcode=XX  postcode used when a listing carries none
 */
import fs from "node:fs";
import {
  AGE_BANDS,
  RATES_GBP,
  SAMPLE_PATH,
  type Sample,
  type SampledVehicle,
  bandForAge,
  canAfford,
  ensureCalDir,
  flag,
  gbp,
  hasFlag,
  loadEnvLocal,
  numFlag,
  recordSpend,
  spentGbp,
} from "./lib";

loadEnvLocal();

const API_KEY = process.env.MARKETCHECK_API_KEY;
if (!API_KEY) {
  console.error("Missing MARKETCHECK_API_KEY in .env.local");
  process.exit(1);
}

const API_BASE = process.env.MARKETCHECK_API_BASE ?? "https://api.marketcheck.com/v2";
const ROWS = 50;
const TIMEOUT_MS = 15000;

const PROBE = hasFlag("probe");
const CONFIRM = hasFlag("confirm");
const PER_BAND = numFlag("per-band", 8);
const BUDGET = numFlag("budget-gbp", 1);
/** The Price endpoint requires a postal_code. Where a listing doesn't carry
 *  one we hold it constant so the reference is at least internally consistent;
 *  the analysis reports how many rows used the fallback so any regional offset
 *  is visible rather than hidden. B1 is central England. */
const FALLBACK_POSTCODE = flag("fallback-postcode") ?? "B1 1AA";

const CURRENT_YEAR = new Date().getUTCFullYear();

type Listing = Record<string, unknown>;

/** Years to sweep. One search call per year, spread across every band so the
 *  sample covers the whole depreciation curve rather than clustering on the
 *  ages that happen to be most listed. */
function sweepYears(): number[] {
  const years: number[] = [];
  for (const band of AGE_BANDS) {
    const maxAge = Math.min(band.maxAge, 22);
    const span = maxAge - band.minAge;
    // Two probes per band (start and middle) keeps calls low while still
    // spanning the band.
    const ages = span <= 1 ? [band.minAge] : [band.minAge, band.minAge + Math.ceil(span / 2)];
    for (const age of ages) years.push(CURRENT_YEAR - age);
  }
  return [...new Set(years)].sort((a, b) => b - a);
}

async function search(year: number): Promise<{ listings: Listing[]; status: number }> {
  const params = new URLSearchParams({
    api_key: API_KEY as string,
    country: "uk",
    year: String(year),
    rows: String(ROWS),
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/search/car/uk/active?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`  HTTP ${res.status} for year ${year}`);
      return { listings: [], status: res.status };
    }
    const json = (await res.json()) as { listings?: unknown };
    return {
      listings: Array.isArray(json.listings) ? (json.listings as Listing[]) : [],
      status: res.status,
    };
  } catch (err) {
    console.error(`  fetch failed for year ${year}:`, (err as Error)?.message);
    return { listings: [], status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

// ── Defensive field extraction ──────────────────────────────────────────────
// The UK active-listings response shape isn't documented publicly, so read
// every plausible field name rather than guessing one. --probe confirms which
// actually fires.

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;
const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v.replace(/[^0-9.]/g, "")) : v;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
};
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

function extractVrm(l: Listing): string | null {
  const build = obj(l.build);
  return (
    str(l.vehicle_registration_mark) ??
    str(l.vrm) ??
    str(l.registration) ??
    str(build.vehicle_registration_mark) ??
    str(build.vrm) ??
    null
  );
}

function extractVehicle(l: Listing): SampledVehicle | null {
  const vrm = extractVrm(l);
  if (!vrm) return null;

  const build = obj(l.build);
  const dealer = obj(l.dealer);

  const year = num(l.year) ?? num(build.year);
  const price = num(l.price);
  const miles = num(l.miles) ?? num(l.mileage);
  const make = str(l.make) ?? str(build.make);
  const model = str(l.model) ?? str(build.model);

  // Every one of these is needed either by the Price endpoint or by our own
  // model, so a partial row is useless — drop it rather than fake a value.
  if (!year || !price || miles === null || !make || !model) return null;

  const postcode = str(dealer.postal_code) ?? str(dealer.zip) ?? str(dealer.postcode);
  const dealerType = str(l.inventory_type) ?? str(dealer.dealer_type) ?? "independent";

  return {
    vrm,
    make,
    model,
    year,
    miles,
    askingPrice: price,
    dealerType: dealerType === "franchise" ? "franchise" : "independent",
    postalCode: postcode ?? FALLBACK_POSTCODE,
    postalCodeSource: postcode ? "listing" : "fallback",
    ageBand: bandForAge(Math.max(0, CURRENT_YEAR - year)),
  };
}

// ── Probe ───────────────────────────────────────────────────────────────────

async function probe(): Promise<void> {
  console.log(`PROBE — one call, ${gbp(RATES_GBP.inventorySearch)}\n`);
  if (!CONFIRM) {
    console.log("Dry run. Re-run with --confirm to make the call.");
    return;
  }
  if (!canAfford("inventorySearch", BUDGET)) {
    console.error(`Budget ${gbp(BUDGET)} exhausted (spent ${gbp(spentGbp())}).`);
    process.exit(1);
  }

  const year = CURRENT_YEAR - 8;
  recordSpend("inventorySearch", `probe year=${year}`);
  const { listings, status } = await search(year);

  console.log(`HTTP ${status} · ${listings.length} listings for year ${year}\n`);
  if (listings.length === 0) {
    console.log("No listings returned — cannot confirm the response shape.");
    return;
  }

  const first = listings[0];
  console.log("Top-level keys on listing[0]:");
  console.log("  " + Object.keys(first).join(", ") + "\n");
  for (const nested of ["build", "dealer"]) {
    const keys = Object.keys(obj(first[nested]));
    if (keys.length) console.log(`Keys on listing[0].${nested}:\n  ${keys.join(", ")}\n`);
  }

  const withVrm = listings.filter((l) => extractVrm(l)).length;
  const usable = listings.filter((l) => extractVehicle(l)).length;
  console.log(`VRM present:      ${withVrm}/${listings.length}`);
  console.log(`Fully usable:     ${usable}/${listings.length}`);
  const sampleVrm = extractVrm(first);
  console.log(`Example VRM:      ${sampleVrm ? sampleVrm.slice(0, 2) + "****" : "NONE"}`);
  console.log(`\nSpent so far: ${gbp(spentGbp())}`);

  if (withVrm === 0) {
    console.log(
      "\n*** BLOCKER: no VRM on any listing. The Price endpoint is VRM-keyed, so\n" +
        "    this sampling approach cannot work. Stop here — do NOT run reference.ts.",
    );
  }
}

// ── Full sample ─────────────────────────────────────────────────────────────

async function buildSample(): Promise<void> {
  const years = sweepYears();
  const maxCost = years.length * RATES_GBP.inventorySearch;
  console.log(
    `SAMPLE — up to ${years.length} calls (${gbp(maxCost)}), target ${PER_BAND}/band\n` +
      `Years: ${years.join(", ")}\n`,
  );
  if (!CONFIRM) {
    console.log("Dry run. Re-run with --confirm to spend.");
    return;
  }

  const byBand = new Map<string, SampledVehicle[]>(AGE_BANDS.map((b) => [b.label, []]));
  let listingsSeen = 0;
  let withVrm = 0;

  for (const year of years) {
    if (!canAfford("inventorySearch", BUDGET)) {
      console.log(`Budget ${gbp(BUDGET)} reached — stopping early.`);
      break;
    }
    const band = bandForAge(Math.max(0, CURRENT_YEAR - year));
    if ((byBand.get(band)?.length ?? 0) >= PER_BAND) continue; // band already full

    recordSpend("inventorySearch", `sample year=${year}`);
    const { listings } = await search(year);
    listingsSeen += listings.length;
    withVrm += listings.filter((l) => extractVrm(l)).length;

    for (const l of listings) {
      const v = extractVehicle(l);
      if (!v) continue;
      const bucket = byBand.get(v.ageBand);
      if (!bucket || bucket.length >= PER_BAND) continue;
      if (bucket.some((e) => e.vrm === v.vrm)) continue;
      bucket.push(v);
    }
    console.log(
      `  ${year} → ${listings.length} listings · band ${band} now ${byBand.get(band)?.length ?? 0}/${PER_BAND}`,
    );
  }

  const vehicles = [...byBand.values()].flat();
  const sample: Sample = {
    createdAt: new Date().toISOString(),
    vrmCoverage: { listingsSeen, withVrm },
    vehicles,
  };
  ensureCalDir();
  fs.writeFileSync(SAMPLE_PATH, JSON.stringify(sample, null, 2));

  console.log(`\nSampled ${vehicles.length} vehicles → ${SAMPLE_PATH}`);
  for (const b of AGE_BANDS) {
    console.log(`  ${b.label.padEnd(6)} ${byBand.get(b.label)?.length ?? 0}`);
  }
  console.log(`\nVRM coverage: ${withVrm}/${listingsSeen} listings`);
  console.log(`Spent so far: ${gbp(spentGbp())}`);
  console.log(
    `\nNext: reference.ts on these ${vehicles.length} vehicles would cost ` +
      `${gbp(vehicles.length * RATES_GBP.pricePredict)}.`,
  );
}

(PROBE ? probe() : buildSample()).catch((err) => {
  console.error(err);
  process.exit(1);
});
