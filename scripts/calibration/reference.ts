/**
 * Step 2 of the calibration harness — buy the reference prices.
 *
 * THIS SCRIPT SPENDS REAL MONEY: £0.30 per vehicle, on
 * /v2/predict/car/uk/marketcheck_price (Marketcheck Price - Base).
 *
 * Safety, in order:
 *   1. Dry run unless --confirm. The dry run prints the exact cost.
 *   2. --budget-gbp is a hard ceiling checked before EVERY call, against an
 *      append-only ledger that survives crashes and restarts.
 *   3. Results are appended as they arrive, and already-priced VRMs are
 *      skipped, so a crash or a re-run never re-pays for a row we hold.
 *
 * Usage:
 *   npx tsx scripts/calibration/reference.ts --limit=20 --budget-gbp=6
 *       Dry run for the £6 pilot.
 *
 *   npx tsx scripts/calibration/reference.ts --limit=20 --budget-gbp=6 --confirm
 *       The pilot, for real.
 *
 *   npx tsx scripts/calibration/reference.ts --limit=200 --budget-gbp=60 --confirm
 *       The full run, after the pilot has confirmed the endpoint behaves and
 *       analyse.ts has reported the real disagreement SD.
 */
import fs from "node:fs";
import {
  RATES_GBP,
  REFERENCE_PATH,
  SAMPLE_PATH,
  type ReferenceRow,
  type Sample,
  type SampledVehicle,
  canAfford,
  ensureCalDir,
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
const TIMEOUT_MS = 15000;
/** Be a good citizen — this is a paid endpoint but there's no reason to hammer it. */
const DELAY_MS = 250;

const CONFIRM = hasFlag("confirm");
const LIMIT = numFlag("limit", 20);
const BUDGET = numFlag("budget-gbp", 6);

if (!fs.existsSync(SAMPLE_PATH)) {
  console.error(`No sample at ${SAMPLE_PATH}. Run sample.ts first.`);
  process.exit(1);
}
const sample = JSON.parse(fs.readFileSync(SAMPLE_PATH, "utf8")) as Sample;

/** VRMs we already hold a reference price for — never pay twice. */
function alreadyPriced(): Set<string> {
  const done = new Set<string>();
  if (!fs.existsSync(REFERENCE_PATH)) return done;
  for (const line of fs.readFileSync(REFERENCE_PATH, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      done.add((JSON.parse(line) as ReferenceRow).vrm);
    } catch {
      // Truncated final line from a hard kill — ignore.
    }
  }
  return done;
}

async function fetchReference(
  v: SampledVehicle,
): Promise<{ price: number | null; status: number }> {
  const params = new URLSearchParams({
    api_key: API_KEY as string,
    vrm: v.vrm,
    miles: String(Math.round(v.miles)),
    dealer_type: v.dealerType,
    postal_code: v.postalCode,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/predict/car/uk/marketcheck_price?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { price: null, status: res.status };
    const json = (await res.json()) as { marketcheck_price?: unknown };
    const raw = json.marketcheck_price;
    const price = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : null;
    return { price, status: res.status };
  } catch {
    return { price: null, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  const done = alreadyPriced();
  const todo = sample.vehicles.filter((v) => !done.has(v.vrm)).slice(0, LIMIT);
  const cost = todo.length * RATES_GBP.pricePredict;

  console.log(`Sample:        ${sample.vehicles.length} vehicles`);
  console.log(`Already priced: ${done.size}`);
  console.log(`To price now:   ${todo.length} → ${gbp(cost)}`);
  console.log(`Ledger spent:   ${gbp(spentGbp())} · budget ${gbp(BUDGET)}\n`);

  if (todo.length === 0) {
    console.log("Nothing to do.");
    return;
  }
  if (!CONFIRM) {
    console.log(`DRY RUN — no money spent. Re-run with --confirm to spend ${gbp(cost)}.`);
    return;
  }
  if (spentGbp() + cost > BUDGET + 1e-9) {
    console.log(
      `NOTE: the full ${todo.length} would exceed the ${gbp(BUDGET)} budget.\n` +
        `      Will stop cleanly when the budget is reached.\n`,
    );
  }

  ensureCalDir();
  let ok = 0;
  let empty = 0;
  let failed = 0;

  for (const [i, v] of todo.entries()) {
    if (!canAfford("pricePredict", BUDGET)) {
      console.log(`\nBudget ${gbp(BUDGET)} reached — stopping.`);
      break;
    }
    // Record the spend BEFORE the call. If the process dies mid-request we
    // over-count by at most one call, which is the safe direction to err.
    recordSpend("pricePredict", `${v.make} ${v.model} ${v.year}`);
    const { price, status } = await fetchReference(v);

    const row: ReferenceRow = {
      vrm: v.vrm,
      marketcheckPrice: price,
      httpStatus: status,
      at: new Date().toISOString(),
    };
    fs.appendFileSync(REFERENCE_PATH, JSON.stringify(row) + "\n");

    if (price !== null) ok++;
    else if (status === 200) empty++;
    else failed++;

    const label = `${v.year} ${v.make} ${v.model}`.padEnd(34).slice(0, 34);
    const shown = price !== null ? gbp(price).padStart(10) : `HTTP ${status}`.padStart(10);
    console.log(`  ${String(i + 1).padStart(3)}. ${label} ask ${gbp(v.askingPrice).padStart(10)}  ref ${shown}`);

    if (i < todo.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(
    `\nPriced ${ok} · no-answer ${empty} · errors ${failed}` +
      `\nTotal spent to date: ${gbp(spentGbp())}` +
      `\nNext: npx tsx scripts/calibration/analyse.ts`,
  );
  if (failed > ok && ok === 0) {
    console.log(
      "\n*** Every call failed. Check the parameter names against\n" +
        "    docs.marketcheck.com/uk/docs/api/cars before spending more.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
