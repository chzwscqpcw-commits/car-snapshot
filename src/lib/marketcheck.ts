/**
 * MarketCheck UK — second used-car comparable signal (PROTOTYPE, stubbed).
 *
 * Strategy (per the Jun 2026 data-sources research + the actual Starter plan,
 * see memory valuation-price-data-sources): MarketCheck UK Starter is £0/mo
 * base + £0.0010 per call, with a one-time 1,000-call free credit MarketCheck
 * applies automatically. We therefore cap our own LIVE calls per calendar
 * month to a configurable limit — a monthly SPEND cap (max data fee ≈ limit ×
 * £0.0010). Every aggregate is cached in Supabase for free reuse, so the cap
 * only bites on genuinely-new or stale-refresh fetches; most lookups are free.
 * Monthly reset means the data keeps refreshing (unlike a one-time stop) while
 * spend stays bounded and tiny.
 *
 * TWO SAFETY RULES:
 *  1. FAIL-CLOSED cap. If we can't atomically confirm we're under the month's
 *     limit, we DO NOT call the API — so a Supabase hiccup or a race can never
 *     push monthly spend over budget. The reservation is atomic (Postgres
 *     UPDATE ... WHERE calls < limit RETURNING) so two concurrent valuations
 *     can't both spend the last slot.
 *  2. TTL on the cache (30 days) — used prices drift monthly, so old entries
 *     are treated as misses and re-fetched (budget permitting).
 *
 * Enabled only when MARKETCHECK_ENABLED === "true". With no MARKETCHECK_API_KEY
 * it runs in STUB mode (deterministic fake aggregates) so the plumbing — cap,
 * cache, reuse, fallback — can be built and tested before we have a key.
 *
 * ── Supabase schema this expects (apply once) ──────────────────────────────
 *   create table if not exists marketcheck_cache (
 *     id bigint generated always as identity primary key,
 *     make text not null, model text not null, year int not null,
 *     median int, q1 int, q3 int, listing_count int, total_listings int,
 *     created_at timestamptz not null default now()
 *   );
 *   create index if not exists marketcheck_cache_lookup
 *     on marketcheck_cache (make, model, year, created_at desc);
 *
 *   -- Per-month call counter (monthly spend cap, resets implicitly each month).
 *   create table if not exists marketcheck_usage (
 *     month text primary key,            -- 'YYYY-MM' (UTC)
 *     calls int not null default 0
 *   );
 *
 *   -- Atomic reserve: increments only while under the month's limit; returns
 *   -- true iff this caller got a slot. Race-safe via the row lock on UPDATE.
 *   create or replace function reserve_marketcheck_call(p_month text, p_limit int)
 *   returns boolean language plpgsql as $$
 *   declare reserved int;
 *   begin
 *     insert into marketcheck_usage (month, calls) values (p_month, 0)
 *       on conflict (month) do nothing;
 *     update marketcheck_usage set calls = calls + 1
 *       where month = p_month and calls < p_limit
 *       returning calls into reserved;
 *     return reserved is not null;
 *   end; $$;
 *
 *   -- These tables are written/read ONLY by the server via the service-role
 *   -- client (which bypasses RLS), so enable RLS with NO policies — that locks
 *   -- them from the public anon key (important: an open marketcheck_usage row
 *   -- could be tampered with to bypass the spend cap). In the Supabase SQL
 *   -- editor choose "Run and enable RLS"; or run:
 *   alter table marketcheck_cache enable row level security;
 *   alter table marketcheck_usage enable row level security;
 * ───────────────────────────────────────────────────────────────────────────
 */

import { supabaseServerRole } from "@/lib/supabaseServer";

/** Max LIVE API calls per calendar month. MarketCheck Starter is pay-per-call
 *  at £0.0010/call (the first 1,000 are a one-time free credit MarketCheck
 *  applies automatically). So this is a monthly SPEND cap: max monthly data
 *  fee ≈ limit × £0.0010 (e.g. 2,500 → ~£2.50/mo, 5,000 → ~£5/mo). Caching means
 *  most lookups never spend a call. Raise via env (or this default) as appetite
 *  allows — any sane value sits far below MarketCheck's £250/mo early-billing
 *  threshold. Raised 1,000 → 2,500 on 2026-06-08 as valuation volume grew. */
export const MARKETCHECK_MONTHLY_CALL_LIMIT = Number(process.env.MARKETCHECK_MONTHLY_CALL_LIMIT ?? 2500);
/** Cache freshness. Refreshing is cheap (£0.0010), so 30 days keeps the second
 *  signal current without over-spending; raise via env to stretch the budget. */
export const MARKETCHECK_CACHE_TTL_DAYS = Number(process.env.MARKETCHECK_CACHE_TTL_DAYS ?? 30);

export type MarketCheckAggregate = {
  median: number;
  q1: number;
  q3: number;
  listingCount: number; // listings used after filtering
  totalListings: number; // total found for the query
};

export type MarketCheckOutcome =
  | { ok: true; aggregate: MarketCheckAggregate; source: "cache" | "api" }
  | { ok: false; reason: "disabled" | "capped" | "no-data" | "error" };

export function marketCheckEnabled(): boolean {
  return process.env.MARKETCHECK_ENABLED === "true";
}

function usingStub(): boolean {
  return !process.env.MARKETCHECK_API_KEY;
}

/** Current calendar month in UTC, 'YYYY-MM'. */
function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Dependency seam so the orchestration (cache-first → cap → fetch → cache)
 *  can be unit-tested without Supabase or the network. */
export type MarketCheckDeps = {
  readCache: (make: string, model: string, year: number) => Promise<MarketCheckAggregate | null>;
  reserveCall: (month: string, limit: number) => Promise<boolean>;
  fetchListings: (make: string, model: string, year: number) => Promise<MarketCheckAggregate | null>;
  writeCache: (make: string, model: string, year: number, agg: MarketCheckAggregate) => Promise<void>;
};

/**
 * Get a MarketCheck used-price aggregate for a vehicle, honouring the cache
 * and the monthly cap. Order: feature flag → cache (TTL) → atomic reserve
 * (fail-closed) → live fetch → cache-write.
 */
export async function getMarketCheckValuation(
  make: string,
  model: string,
  year: number,
  deps: MarketCheckDeps = defaultDeps,
): Promise<MarketCheckOutcome> {
  if (!marketCheckEnabled()) return { ok: false, reason: "disabled" };

  try {
    // 1. Cache-first — unlimited, free. Already-known combos never spend budget.
    const cached = await deps.readCache(make, model, year);
    if (cached) return { ok: true, aggregate: cached, source: "cache" };

    // 2. Reserve one of this month's calls, atomically. Fail-closed: if we
    //    don't get a slot (monthly cap reached, or Supabase unavailable), we
    //    don't call — so monthly spend can never exceed limit × £0.0010.
    const reserved = await deps.reserveCall(currentMonthKey(), MARKETCHECK_MONTHLY_CALL_LIMIT);
    if (!reserved) return { ok: false, reason: "capped" };

    // 3. Live fetch (stub or real). We've already spent the budget slot.
    const live = await deps.fetchListings(make, model, year);
    if (!live) return { ok: false, reason: "no-data" };

    // 4. Cache for reuse (best-effort).
    await deps.writeCache(make, model, year, live).catch(() => {});
    return { ok: true, aggregate: live, source: "api" };
  } catch (err) {
    console.error("[MARKETCHECK] orchestration error:", (err as Error)?.message || err);
    return { ok: false, reason: "error" };
  }
}

// ── Aggregation ──────────────────────────────────────────────────────────────

/** Excel-compatible (linear interpolation) quartile, matching the eBay path. */
function quartile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 1) return sortedAsc[0];
  const pos = (sortedAsc.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sortedAsc[base + 1] ?? sortedAsc[base];
  return Math.round(sortedAsc[base] + rest * (next - sortedAsc[base]));
}

/** Aggregate raw asking prices into a median/IQR summary. Trims 1.5×IQR
 *  outliers first (same approach as the eBay comparables filter). */
export function aggregatePrices(prices: number[]): MarketCheckAggregate | null {
  const clean = prices.filter((p) => typeof p === "number" && p > 0).sort((a, b) => a - b);
  if (clean.length < 3) return null;
  const total = clean.length;
  const q1 = quartile(clean, 0.25);
  const q3 = quartile(clean, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  const trimmed = clean.filter((p) => p >= lo && p <= hi);
  const used = trimmed.length >= 3 ? trimmed : clean;
  return {
    median: quartile(used, 0.5),
    q1: quartile(used, 0.25),
    q3: quartile(used, 0.75),
    listingCount: used.length,
    totalListings: total,
  };
}

// ── Live fetch (stub today; real impl sketched) ──────────────────────────────

/** Deterministic FNV-1a hash so the stub is stable per make/model/year (a
 *  given vehicle always returns the same fake aggregate — mimics a real cache
 *  hit and keeps tests deterministic). */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const round50 = (n: number) => Math.round(n / 50) * 50;

/** STUB: a plausible, deterministic used-price aggregate from a depreciation
 *  curve + a per-vehicle spread. Replace with fetchListingsLive() once we have
 *  a MARKETCHECK_API_KEY. */
export function fetchListingsStub(
  make: string,
  model: string,
  year: number,
): MarketCheckAggregate | null {
  const age = Math.max(0, new Date().getUTCFullYear() - year);
  const base = Math.max(800, Math.round(28000 * Math.pow(0.85, age)));
  const h = hash(`${make.toUpperCase()}|${model.toUpperCase()}|${year}`);
  const spread = 0.1 + (h % 10) / 100; // 10–19%
  // Synthesize a small spread of listings around the base so aggregatePrices
  // runs the same code path the real fetch will use.
  const count = 8 + (h % 18); // 8–25
  const prices: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1); // 0..1
    prices.push(round50(base * (1 - spread + 2 * spread * t)));
  }
  return aggregatePrices(prices);
}

/** Base URL + tuning for the live API. Overridable via env so the endpoint can
 *  be corrected without a code change once verified against the UK docs. */
const MARKETCHECK_API_BASE = process.env.MARKETCHECK_API_BASE ?? "https://api.marketcheck.com/v2";
const MARKETCHECK_FETCH_ROWS = 50;
const MARKETCHECK_TIMEOUT_MS = 6000;

/**
 * REAL fetch — MarketCheck UK Active Listings → price aggregate.
 *
 * Verified against the live UK API (Jun 2026): endpoint /search/car/uk/active,
 * country=uk, listings[].price is a top-level GBP number (also carries miles,
 * inventory_type, etc.). Defensive: tolerates missing fields and degrades to
 * null on any non-200/parse error, so it fails safe (no MarketCheck signal)
 * rather than crashing. Host/path overridable via MARKETCHECK_API_BASE.
 */
export async function fetchListingsLive(
  make: string,
  model: string,
  year: number,
): Promise<MarketCheckAggregate | null> {
  const apiKey = process.env.MARKETCHECK_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    api_key: apiKey,
    country: "uk",
    make,
    model,
    year: String(year),
    rows: String(MARKETCHECK_FETCH_ROWS),
  });
  const url = `${MARKETCHECK_API_BASE}/search/car/uk/active?${params.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MARKETCHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      // 401 = bad key, 429 = rate limit, etc. Log and fail safe.
      console.error(`[MARKETCHECK] live fetch HTTP ${res.status} for ${make} ${model} ${year}`);
      return null;
    }
    const json = (await res.json()) as { listings?: unknown };
    const listings = Array.isArray(json?.listings) ? (json.listings as Record<string, unknown>[]) : [];
    const prices = listings
      .map((l) => {
        // Best-effort price extraction — adjust if the real field differs.
        const raw =
          (l?.price as unknown) ??
          ((l?.dealer as Record<string, unknown>)?.price as unknown) ??
          ((l?.build as Record<string, unknown>)?.price as unknown);
        const n = typeof raw === "string" ? parseFloat(raw.replace(/[^0-9.]/g, "")) : raw;
        return typeof n === "number" ? n : NaN;
      })
      .filter((n) => Number.isFinite(n) && n > 0);
    return aggregatePrices(prices);
  } catch (err) {
    const e = err as Error;
    console.error(
      `[MARKETCHECK] live fetch ${e?.name === "AbortError" ? "timeout" : "error"} for ${make} ${model} ${year}:`,
      e?.message || e,
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Default Supabase-backed deps ─────────────────────────────────────────────

const defaultDeps: MarketCheckDeps = {
  async readCache(make, model, year) {
    try {
      const sb = supabaseServerRole();
      const ttlAgo = new Date(
        Date.now() - MARKETCHECK_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data, error } = await sb
        .from("marketcheck_cache")
        .select("median, q1, q3, listing_count, total_listings")
        .eq("make", make.toUpperCase())
        .eq("model", model.toUpperCase())
        .eq("year", year)
        .gte("created_at", ttlAgo)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error || !data || data.length === 0) return null;
      const r = data[0] as Record<string, number>;
      if (!r.median) return null;
      return {
        median: r.median,
        q1: r.q1,
        q3: r.q3,
        listingCount: r.listing_count,
        totalListings: r.total_listings,
      };
    } catch {
      return null;
    }
  },

  async reserveCall(month, limit) {
    // Atomic + fail-closed: any error → false (don't call the API).
    try {
      const sb = supabaseServerRole();
      const { data, error } = await sb.rpc("reserve_marketcheck_call", {
        p_month: month,
        p_limit: limit,
      });
      if (error) {
        console.error("[MARKETCHECK] reserve RPC error:", error.message);
        return false;
      }
      return data === true;
    } catch (err) {
      console.error("[MARKETCHECK] reserve error:", (err as Error)?.message || err);
      return false;
    }
  },

  async fetchListings(make, model, year) {
    // Stub when there's no API key; the real call once MARKETCHECK_API_KEY is set.
    if (usingStub()) return fetchListingsStub(make, model, year);
    return fetchListingsLive(make, model, year);
  },

  async writeCache(make, model, year, agg) {
    try {
      const sb = supabaseServerRole();
      await sb.from("marketcheck_cache").insert({
        make: make.toUpperCase(),
        model: model.toUpperCase(),
        year,
        median: agg.median,
        q1: agg.q1,
        q3: agg.q3,
        listing_count: agg.listingCount,
        total_listings: agg.totalListings,
      });
    } catch (err) {
      console.error("[MARKETCHECK] cache write error:", (err as Error)?.message || err);
    }
  },
};
