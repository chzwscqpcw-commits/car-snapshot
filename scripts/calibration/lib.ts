/**
 * Shared plumbing for the valuation calibration harness.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Users report the valuation tool reads too high. We have no ground truth to
 * measure that against: every signal the tool uses (eBay asking prices, a
 * 14-day median of past eBay medians, a MarketCheck inventory aggregate) is an
 * ASKING price, and asking prices systematically overstate what a car sells
 * for. `ASKING_PRICE_DISCOUNT = 0.96` in src/app/api/valuation/route.ts is a
 * guess at that gap, applied to eBay only.
 *
 * MarketCheck's Price endpoint (/v2/predict/car/uk/marketcheck_price) is a
 * transaction-value prediction — they claim within 5% of actual transaction
 * price across 25+ model years, within 4% on 1-5 year-old cars. That makes it
 * a usable REFERENCE to measure our bias against. At £0.30/call it is far too
 * expensive to serve live, but it is cheap enough to buy ONCE as a measurement.
 *
 * The plan: spend ~£66 once, fit the free model to the reference, then set
 * MARKETCHECK_ENABLED=false and stop paying £30/month forever.
 *
 * SAMPLE SOURCE — WHY NOT OUR OWN USERS' PLATES
 * ─────────────────────────────────────────────
 * The Price endpoint is keyed on VRM. Our vehicle_valuations table
 * deliberately does not store registrations, and pushing live user plates to a
 * third party to run this measurement would be a real privacy regression for
 * no benefit. Instead we sample REAL DEALER LISTINGS from MarketCheck's own
 * inventory search — those carry a VRM, an asking price, mileage and a year.
 * No user plate is ever involved, we control the age stratification rather
 * than taking whatever traffic happens to give us, and we get a bonus
 * measurement for free: reference price minus listing asking price is a direct
 * read on the asking->transaction gap that 0.96 is currently guessing at.
 *
 * SPEND SAFETY
 * ────────────
 * Every paid call is appended to a ledger BEFORE the money is considered spent
 * and the ledger is the single source of truth for the running total. Scripts
 * are dry-run by default and refuse to spend without --confirm. The budget
 * check happens per-call, so a crash or a bad loop cannot overrun it.
 */
import fs from "node:fs";
import path from "node:path";

// ── Env ─────────────────────────────────────────────────────────────────────

/** Manually load .env.local — scripts don't auto-load it. Matches the pattern
 *  in scripts/cleanup-test-reminders.ts. */
export function loadEnvLocal(): void {
  const envPath = path.resolve(__dirname, "../../.env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

// ── Paths ───────────────────────────────────────────────────────────────────

/** Working directory for calibration artefacts. GITIGNORED — the sample holds
 *  real vehicle registrations scraped from dealer listings. The analysis
 *  output is written plate-free so it can be shared or committed. */
export const CAL_DIR = path.resolve(__dirname, "../../.calibration");
export const SAMPLE_PATH = path.join(CAL_DIR, "sample.json");
export const REFERENCE_PATH = path.join(CAL_DIR, "reference.jsonl");
export const LEDGER_PATH = path.join(CAL_DIR, "ledger.jsonl");

export function ensureCalDir(): void {
  fs.mkdirSync(CAL_DIR, { recursive: true });
}

// ── Rate card ───────────────────────────────────────────────────────────────

/**
 * Verified 2026-08-02 from the founder's logged-in subscriptions page at
 * developers.marketcheck.com/uk/subscriptions (Starter tier).
 *
 * IMPORTANT — this is the mistake that caused the £30 invoice. The rate card
 * lists MCP Playground Usage at £0.0010/call; every real data endpoint is
 * £0.0120. src/lib/marketcheck.ts:69-76 documents £0.0010 and sizes its
 * monthly cap as a "~£2.50/mo" spend cap on that basis — so the cap is
 * actually a £30/mo budget, 12x its documented intent. Do not repeat that:
 * these constants are the real, observed rates.
 */
export const RATES_GBP = {
  /** /v2/search/car/uk/active — "UK Inventory Search & Listing/VDP" */
  inventorySearch: 0.012,
  /** /v2/predict/car/uk/marketcheck_price — "Marketcheck Price - Base" */
  pricePredict: 0.3,
} as const;

export type PaidEndpoint = keyof typeof RATES_GBP;

// ── Budget ledger ───────────────────────────────────────────────────────────

export type LedgerEntry = {
  at: string;
  endpoint: PaidEndpoint;
  costGbp: number;
  note: string;
};

/** Total spent so far across every calibration run, read from the ledger.
 *  The ledger is append-only and survives crashes, so restarting a script can
 *  never quietly reset the budget. */
export function spentGbp(): number {
  if (!fs.existsSync(LEDGER_PATH)) return 0;
  let total = 0;
  for (const line of fs.readFileSync(LEDGER_PATH, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      total += (JSON.parse(line) as LedgerEntry).costGbp;
    } catch {
      // A truncated final line from a hard kill. Ignore it rather than
      // crashing — worst case we under-count by one call (£0.30).
    }
  }
  return Math.round(total * 10000) / 10000;
}

export function recordSpend(endpoint: PaidEndpoint, note: string): void {
  ensureCalDir();
  const entry: LedgerEntry = {
    at: new Date().toISOString(),
    endpoint,
    costGbp: RATES_GBP[endpoint],
    note,
  };
  fs.appendFileSync(LEDGER_PATH, JSON.stringify(entry) + "\n");
}

/**
 * Guard one call against the budget. Returns false when the call must NOT be
 * made. Call this immediately before every paid request — never batch the
 * check, or a loop can overshoot.
 */
export function canAfford(endpoint: PaidEndpoint, budgetGbp: number): boolean {
  return spentGbp() + RATES_GBP[endpoint] <= budgetGbp + 1e-9;
}

export const gbp = (n: number): string => `£${n.toFixed(2)}`;

// ── CLI helpers ─────────────────────────────────────────────────────────────

export function flag(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

export function numFlag(name: string, fallback: number): number {
  const raw = flag(name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    console.error(`--${name} must be a number, got "${raw}"`);
    process.exit(1);
  }
  return n;
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

// ── Sample types ────────────────────────────────────────────────────────────

/** One real dealer listing, sampled to be a calibration subject. */
export type SampledVehicle = {
  vrm: string;
  make: string;
  model: string;
  year: number;
  miles: number;
  /** The dealer's ASKING price from the listing. */
  askingPrice: number;
  /** franchise | independent, as reported by the listing where available. */
  dealerType: string;
  /** Dealer postcode where the listing carried one; else the fallback. */
  postalCode: string;
  postalCodeSource: "listing" | "fallback";
  ageBand: string;
};

export type Sample = {
  createdAt: string;
  /** How many listings we saw vs how many carried a usable VRM. The Price
   *  endpoint is VRM-keyed, so a low rate here kills the whole approach —
   *  which is exactly what the pilot is for. */
  vrmCoverage: { listingsSeen: number; withVrm: number };
  vehicles: SampledVehicle[];
};

/** The reference price for one vehicle, one JSONL row per paid call. */
export type ReferenceRow = {
  vrm: string;
  /** MarketCheck's transaction-value prediction, or null if they had no answer. */
  marketcheckPrice: number | null;
  httpStatus: number;
  at: string;
};

// ── Age banding ─────────────────────────────────────────────────────────────

/** Bands chosen so each spans a distinct part of the depreciation curve in
 *  src/lib/valuation.ts — the steep early years, the flattening middle, and
 *  the tail where the 5% floor and the flat 0.05 rate take over. */
export const AGE_BANDS: Array<{ label: string; minAge: number; maxAge: number }> = [
  { label: "0-3", minAge: 0, maxAge: 3 },
  { label: "4-6", minAge: 4, maxAge: 6 },
  { label: "7-10", minAge: 7, maxAge: 10 },
  { label: "11-15", minAge: 11, maxAge: 15 },
  { label: "16+", minAge: 16, maxAge: 99 },
];

export function bandForAge(age: number): string {
  return AGE_BANDS.find((b) => age >= b.minAge && age <= b.maxAge)?.label ?? "16+";
}
