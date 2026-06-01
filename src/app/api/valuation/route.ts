export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getMarketCheckValuation } from "@/lib/marketcheck";

// ── eBay OAuth token cache ──────────────────────────────────────────────────

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;

let cachedEbayToken: { token: string; expiresAt: number } | null = null;

async function getEbayToken(): Promise<string | null> {
  if (cachedEbayToken && cachedEbayToken.expiresAt > Date.now() + 300000) {
    return cachedEbayToken.token;
  }

  if (!EBAY_APP_ID || !EBAY_CERT_ID) {
    return null;
  }

  try {
    const credentials = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString("base64");
    const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    });

    if (!response.ok) {
      console.error(`[VALUATION] eBay token request failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    cachedEbayToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return cachedEbayToken.token;
  } catch (error: unknown) {
    console.error("[VALUATION] eBay token error:", (error as Error)?.message || error);
    return null;
  }
}

// ── Make aliases — eBay sellers abbreviate; match what they actually type.

const MAKE_ALIASES: Record<string, string[]> = {
  VOLKSWAGEN: ["VOLKSWAGEN", "VW"],
  VW: ["VW", "VOLKSWAGEN"],
  "MERCEDES-BENZ": ["MERCEDES-BENZ", "MERCEDES", "MERC", "BENZ"],
  MERCEDES: ["MERCEDES", "MERCEDES-BENZ", "MERC", "BENZ"],
  "LAND ROVER": ["LAND ROVER", "LANDROVER", "LAND-ROVER", "LR", "RANGE ROVER"],
  LANDROVER: ["LANDROVER", "LAND ROVER", "LAND-ROVER"],
  "ALFA ROMEO": ["ALFA ROMEO", "ALFA-ROMEO", "ALFA"],
  ALFA: ["ALFA", "ALFA ROMEO"],
  BMW: ["BMW"],
  MINI: ["MINI"],
  "ROLLS-ROYCE": ["ROLLS-ROYCE", "ROLLS ROYCE", "ROLLS"],
  "ASTON MARTIN": ["ASTON MARTIN", "ASTON-MARTIN", "ASTON"],
};

function expandMakeTokens(makeUpper: string): string[] {
  if (MAKE_ALIASES[makeUpper]) return MAKE_ALIASES[makeUpper];
  const tokens = [makeUpper];
  const firstWord = makeUpper.split(/[\s-]+/)[0];
  if (firstWord && firstWord !== makeUpper && firstWord.length >= 3) {
    tokens.push(firstWord);
  }
  return tokens;
}

// ── Fuel type matching ─────────────────────────────────────────────────────
// Used both for aspect filter (legacy) and title-based detection.

const FUEL_TYPE_MAP: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  "HYBRID ELECTRIC": "Hybrid",
  "PETROL/ELECTRIC": "Hybrid",
  "DIESEL/ELECTRIC": "Hybrid",
  GAS: "Petrol",
  "GAS BI-FUEL": "Petrol",
};

// Title-keyword sets per fuel family. We use these to detect a listing's
// fuel from its title when the seller doesn't fill in the eBay aspect.
const FUEL_TITLE_TOKENS: Record<string, RegExp> = {
  Petrol: /\b(PETROL|GASOLINE|TSI|MPI|GTI|FSI|TFSI|VTEC)\b/i,
  Diesel: /\b(DIESEL|TDI|HDI|CDTI|CDI|DCI|D4D|MULTIJET|BLUEMOTION|BLUETEC|TDCI|D-?4D)\b/i,
  Hybrid: /\b(HYBRID|HEV|PHEV|PLUG[- ]?IN|SELF[- ]?CHARGING|E-?TRON|E-?POWER)\b/i,
  Electric: /\b(ELECTRIC|EV|BEV|FULL[- ]?ELECTRIC|ALL[- ]?ELECTRIC)\b/i,
};

// ── Year-based price floor — keeps £1 starter-bid auctions out of the median.
// Auction listings include very low opening bids that would skew the data.
// Floors are conservative: a 2020+ car can't realistically be worth <£3000.

function priceFloorForYear(year: number): number {
  if (year >= 2020) return 3000;
  if (year >= 2015) return 2000;
  if (year >= 2010) return 1000;
  return 500;
}

// ── Asking price discount ──────────────────────────────────────────────────

// eBay UK is a mixed private/trade marketplace, not a dealer forecourt.
// Asking → sold delta is smaller than the dealer-haggle assumption (was 0.92).
// Auctions in the dataset already drag the bottom down naturally; further
// discounting double-counts.
const ASKING_PRICE_DISCOUNT = 0.96;

// ── Quartile computation (QUARTILE.INC / linear interpolation) ─────────────

function computeQuartiles(sorted: number[]): { q1: number; q3: number } | null {
  if (sorted.length < 5) return null;

  const n = sorted.length;
  const q1Pos = 0.25 * (n - 1);
  const q3Pos = 0.75 * (n - 1);

  const q1Floor = Math.floor(q1Pos);
  const q1Frac = q1Pos - q1Floor;
  const q1 = sorted[q1Floor] + q1Frac * (sorted[q1Floor + 1] - sorted[q1Floor]);

  const q3Floor = Math.floor(q3Pos);
  const q3Frac = q3Pos - q3Floor;
  const q3 = sorted[q3Floor] + q3Frac * (sorted[q3Floor + 1] - sorted[q3Floor]);

  return { q1, q3 };
}

// ── eBay listing fetch ──────────────────────────────────────────────────────
// One broad query, max page size (200). We do year + fuel filtering in code
// because eBay's aspect filters depend on sellers having set the aspect,
// which they often haven't.

type AspectDistribution = {
  localizedAspectName: string;
  aspectValueDistributions: Array<{
    localizedAspectValue: string;
    matchCount: number;
  }>;
};

type RawItem = {
  title: string;
  price: number;
  titleYear: number | null;
  titleFuel: string | null;
};

type EbayBundle = {
  items: RawItem[];
  totalReported: number;
  dominantTransmission: string | null;
  dominantBodyType: string | null;
  query: string;
  rawCount: number;
};

async function fetchEbayItems(
  token: string,
  make: string,
  model: string,
): Promise<EbayBundle | null> {
  // No aspect filters, no buying-option restriction. We rely on title
  // matching + client-side filtering, which is far more reliable than
  // depending on sellers to fill in eBay's structured aspects.
  const params = new URLSearchParams({
    q: `${make} ${model}`,
    category_ids: "9801",
    fieldgroups: "MATCHING_ITEMS,ASPECT_REFINEMENTS,EXTENDED",
    filter: [
      "conditionIds:{3000}", // used cars only
      "price:[500..],priceCurrency:GBP",
      "itemLocationCountry:GB",
    ].join(","),
    limit: "200",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
          "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=GB",
        },
        signal: controller.signal,
      },
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    console.error(`[VALUATION] eBay search failed: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    total?: number;
    itemSummaries?: Array<{
      title?: string;
      price?: { value: string; currency: string };
    }>;
    refinement?: {
      aspectDistributions?: AspectDistribution[];
    };
  };

  const rawCount = data.itemSummaries?.length ?? 0;
  if (!data.itemSummaries || rawCount === 0) {
    return { items: [], totalReported: data.total ?? 0, dominantTransmission: null, dominantBodyType: null, query: params.toString(), rawCount: 0 };
  }

  const items: RawItem[] = [];
  for (const item of data.itemSummaries) {
    const price = parseFloat(item.price?.value || "0");
    if (price <= 0) continue;
    const title = (item.title || "").toUpperCase();
    // Extract a 4-digit year from the title — match years 1990 through next year.
    const nextYear = new Date().getFullYear() + 1;
    const yearMatches = title.match(/\b(19[89]\d|20\d\d)\b/g);
    let titleYear: number | null = null;
    if (yearMatches) {
      // If multiple years appear, prefer the SMALLEST plausible one.
      // Model years are almost always older than other dates in titles —
      // e.g. "2018 Ford Focus MOT 2025" has both years but the car is
      // a 2018. Taking the max would mistake the MOT date for the model.
      const candidates = yearMatches
        .map((y) => parseInt(y, 10))
        .filter((y) => y >= 1990 && y <= nextYear);
      if (candidates.length > 0) titleYear = Math.min(...candidates);
    }
    let titleFuel: string | null = null;
    for (const [family, re] of Object.entries(FUEL_TITLE_TOKENS)) {
      if (re.test(title)) {
        titleFuel = family;
        break;
      }
    }
    items.push({ title, price, titleYear, titleFuel });
  }

  // Dominant aspects from refinement section (across all 200 results)
  let dominantTransmission: string | null = null;
  let dominantBodyType: string | null = null;
  if (data.refinement?.aspectDistributions) {
    for (const aspect of data.refinement.aspectDistributions) {
      if (aspect.localizedAspectName === "Transmission" && aspect.aspectValueDistributions.length > 0) {
        const top = [...aspect.aspectValueDistributions].sort((a, b) => b.matchCount - a.matchCount)[0];
        dominantTransmission = top.localizedAspectValue;
      }
      if (aspect.localizedAspectName === "Body Type" && aspect.aspectValueDistributions.length > 0) {
        const top = [...aspect.aspectValueDistributions].sort((a, b) => b.matchCount - a.matchCount)[0];
        dominantBodyType = top.localizedAspectValue;
      }
    }
  }

  return {
    items,
    totalReported: data.total ?? rawCount,
    dominantTransmission,
    dominantBodyType,
    query: params.toString(),
    rawCount,
  };
}

// ── Comparables computation ─────────────────────────────────────────────────
// Given the raw eBay items, find the tightest year band with enough matches
// and compute median + IQR.

type EbayResult = {
  median: number;
  q1Price: number | null;
  q3Price: number | null;
  listingCount: number;
  minPrice: number;
  maxPrice: number;
  totalListings: number;
  dominantTransmission: string | null;
  dominantBodyType: string | null;
  yearWidened: boolean;
  yearTolerance: number;
  rejectedByTitle: number;
  rejectedByPriceFloor: number;
  rejectedByIqr: number;
  selectedSample: Array<{ title: string; price: number; year: number | null }>;
};

function buildComparables(
  bundle: EbayBundle,
  make: string,
  model: string,
  year: number,
  fuelType: string | null,
  depEstimate?: number,
): EbayResult | null {
  if (bundle.items.length === 0) return null;

  const makeTokens = expandMakeTokens(make.toUpperCase().trim());
  // Model tokens: split on whitespace + slash + hyphen, drop empties only.
  // Critically we keep single-character tokens — for "3 SERIES" or "C-MAX"
  // the leading digit/letter is part of the identity. Previously we
  // filtered `length >= 2` which dropped the "3" and caused BMW 1/5/7
  // SERIES listings to be lumped in with 3 SERIES queries.
  const modelTokens = model
    .toUpperCase()
    .split(/[\s/-]+/)
    .filter(Boolean);

  // Step 1: title must contain a make-token AND every model-token.
  let rejectedByTitle = 0;
  const titleMatched = bundle.items.filter((i) => {
    const makeOk = makeTokens.some((t) => i.title.includes(t));
    const modelOk = modelTokens.length > 0 && modelTokens.every((t) => i.title.includes(t));
    if (!makeOk || !modelOk) {
      rejectedByTitle++;
      return false;
    }
    return true;
  });

  // Step 2: enforce a price floor (kills £1 auction openers + write-offs).
  // We layer two signals: a conservative year-based floor AND, if we have
  // a depreciation estimate, 35% of that. The max of the two is the floor.
  // For a 2019 BMW 3 Series with £14k dep estimate, this gives a £4.9k floor
  // instead of the static £2k, correctly rejecting older/salvage BMWs that
  // have "BMW 3 SERIES" in the title but no year.
  const yearFloor = priceFloorForYear(year);
  const depFloor = depEstimate ? Math.round(depEstimate * 0.35) : 0;
  const floor = Math.max(yearFloor, depFloor);
  let rejectedByPriceFloor = 0;
  const aboveFloor = titleMatched.filter((i) => {
    if (i.price < floor) {
      rejectedByPriceFloor++;
      return false;
    }
    return true;
  });

  if (aboveFloor.length === 0) return null;

  // Step 3: ONLY accept listings where we can confirm the year. eBay sellers
  // who omit the year in the title disproportionately list old/salvage cars
  // (BMW E36, E91, F30 chassis codes etc.), so accepting "year unknown" as a
  // match pollutes the median with cars from the wrong decade. We widen the
  // tolerance progressively but always require a parsed year.
  const mappedFuel = fuelType ? FUEL_TYPE_MAP[fuelType.toUpperCase()] || null : null;
  const fuelOk = (i: RawItem) =>
    !mappedFuel || !i.titleFuel || i.titleFuel === mappedFuel;
  let yearTolerance = 0;
  let selected: RawItem[] = [];
  for (const tol of [0, 1, 2, 3, 5]) {
    yearTolerance = tol;
    selected = aboveFloor.filter(
      (i) => i.titleYear !== null && Math.abs(i.titleYear - year) <= tol && fuelOk(i),
    );
    if (selected.length >= 5) break;
  }

  // Final fallback: if still <3 year-confirmed items even at ±5, drop the
  // fuel-type requirement to widen the pool a bit.
  if (selected.length < 3) {
    selected = aboveFloor.filter(
      (i) => i.titleYear !== null && Math.abs(i.titleYear - year) <= yearTolerance,
    );
  }

  if (selected.length < 2) return null;

  // Step 4: IQR-based outlier trim (1.5× IQR rule).
  let prices = selected.map((i) => i.price).sort((a, b) => a - b);
  let rejectedByIqr = 0;
  if (prices.length >= 5) {
    const q = computeQuartiles(prices)!;
    const iqr = q.q3 - q.q1;
    const lo = q.q1 - 1.5 * iqr;
    const hi = q.q3 + 1.5 * iqr;
    const trimmed = prices.filter((p) => p >= lo && p <= hi);
    rejectedByIqr = prices.length - trimmed.length;
    if (trimmed.length >= 3) prices = trimmed;
  }

  const n = prices.length;
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];
  const quartiles = computeQuartiles(prices);

  return {
    median: Math.round(median * ASKING_PRICE_DISCOUNT),
    q1Price: quartiles ? Math.round(quartiles.q1 * ASKING_PRICE_DISCOUNT) : null,
    q3Price: quartiles ? Math.round(quartiles.q3 * ASKING_PRICE_DISCOUNT) : null,
    listingCount: n,
    minPrice: Math.round(prices[0]),
    maxPrice: Math.round(prices[n - 1]),
    totalListings: bundle.totalReported,
    dominantTransmission: bundle.dominantTransmission,
    dominantBodyType: bundle.dominantBodyType,
    yearWidened: yearTolerance > 0,
    yearTolerance,
    rejectedByTitle,
    rejectedByPriceFloor,
    rejectedByIqr,
    selectedSample: selected.slice(0, 15).map((i) => ({
      title: i.title.slice(0, 80),
      price: i.price,
      year: i.titleYear,
    })),
  };
}

async function fetchEbayComparables(
  make: string,
  model: string,
  year: number,
  fuelType: string | null,
  depEstimate: number | undefined,
  debug: boolean,
): Promise<{ result: EbayResult | null; debug?: Record<string, unknown> }> {
  const token = await getEbayToken();
  if (!token) return { result: null };

  try {
    const bundle = await fetchEbayItems(token, make, model);
    if (!bundle) return { result: null };

    const result = buildComparables(bundle, make, model, year, fuelType, depEstimate);

    if (debug) {
      return {
        result,
        debug: {
          query: bundle.query,
          rawCount: bundle.rawCount,
          totalReported: bundle.totalReported,
          itemsAfterTitleFilter: bundle.items.length - (result?.rejectedByTitle ?? 0),
          sampleTitles: bundle.items.slice(0, 5).map((i) => ({
            title: i.title,
            price: i.price,
            year: i.titleYear,
            fuel: i.titleFuel,
          })),
        },
      };
    }
    return { result };
  } catch (error: unknown) {
    if ((error as Error)?.name === "AbortError") {
      console.error("[VALUATION] eBay request timeout");
    } else {
      console.error("[VALUATION] eBay search error:", (error as Error)?.message || error);
    }
    return { result: null };
  }
}

// ── Supabase cache ──────────────────────────────────────────────────────────

type CacheResult = {
  median: number;
  entryCount: number;
} | null;

async function checkCache(
  make: string,
  model: string,
  year: number,
): Promise<CacheResult> {
  try {
    const sb = supabaseServer();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sb
      .from("vehicle_valuations")
      .select("ebay_median_price")
      .eq("make", make.toUpperCase())
      .eq("model", model.toUpperCase())
      .eq("year", year)
      .not("ebay_median_price", "is", null)
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data || data.length < 3) return null;

    const values = data
      .map((r) => r.ebay_median_price as number)
      .filter((v) => v > 0)
      .sort((a, b) => a - b);

    if (values.length < 3) return null;

    const mid = Math.floor(values.length / 2);
    const median =
      values.length % 2 === 0
        ? Math.round((values[mid - 1] + values[mid]) / 2)
        : values[mid];

    return { median, entryCount: values.length };
  } catch (error: unknown) {
    console.error("[VALUATION] Cache read error:", (error as Error)?.message || error);
    return null;
  }
}

async function writeCache(params: {
  make: string;
  model: string;
  year: number;
  fuelType?: string;
  engineCapacity?: number;
  mileage?: number;
  estimatedNewPrice?: number;
  depreciationEstimate?: number;
  ebayMedian?: number;
  ebayListingCount?: number;
  ebayMinPrice?: number;
  ebayMaxPrice?: number;
  ebayTotalListings?: number;
  dominantTransmission?: string;
  dominantBodyType?: string;
  colourAdjustment?: number;
  combinedLow?: number;
  combinedHigh?: number;
}): Promise<void> {
  try {
    const sb = supabaseServer();
    await sb.from("vehicle_valuations").insert({
      make: params.make.toUpperCase(),
      model: params.model.toUpperCase(),
      year: params.year,
      fuel_type: params.fuelType?.toUpperCase() || null,
      engine_capacity: params.engineCapacity || null,
      mileage: params.mileage || null,
      mileage_source: params.mileage ? "mot" : null,
      estimated_new_price: params.estimatedNewPrice || null,
      depreciation_estimate: params.depreciationEstimate || null,
      ebay_median_price: params.ebayMedian || null,
      ebay_listing_count: params.ebayListingCount || null,
      ebay_min_price: params.ebayMinPrice || null,
      ebay_max_price: params.ebayMaxPrice || null,
      ebay_total_listings: params.ebayTotalListings || null,
      ebay_dominant_transmission: params.dominantTransmission || null,
      ebay_dominant_body_type: params.dominantBodyType || null,
      colour_adjustment: params.colourAdjustment || null,
      combined_low: params.combinedLow || null,
      combined_high: params.combinedHigh || null,
    });
  } catch (error: unknown) {
    console.error("[VALUATION] Cache write error:", (error as Error)?.message || error);
  }
}

// ── Route handler ───────────────────────────────────────────────────────────

type ValuationResponse = {
  ebayMedian: number | null;
  ebayQ1Price: number | null;
  ebayQ3Price: number | null;
  ebayListingCount: number;
  ebayMinPrice: number | null;
  ebayMaxPrice: number | null;
  ebayTotalListings: number | null;
  ebayDominantTransmission: string | null;
  ebayDominantBodyType: string | null;
  ebayYearWidened: boolean;
  ebayYearTolerance: number | null;
  cacheMedian: number | null;
  cacheEntryCount: number;
  // MarketCheck UK (prototype, flag-gated) — second used-comparable signal.
  marketcheckMedian: number | null;
  marketcheckQ1: number | null;
  marketcheckQ3: number | null;
  marketcheckListingCount: number;
  marketcheckSource: "cache" | "api" | null;
  sources: string[];
  debug?: Record<string, unknown>;
};

export async function GET(
  req: Request,
): Promise<NextResponse<ValuationResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(req.url);
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const yearStr = searchParams.get("year");
    const depEstStr = searchParams.get("depreciationEstimate");
    const newPriceStr = searchParams.get("newPrice");
    const fuelType = searchParams.get("fuelType") || null;
    const engineStr = searchParams.get("engineCapacity");
    const mileageStr = searchParams.get("mileage");
    const colourStr = searchParams.get("colour");
    const debug = searchParams.get("debug") === "true";

    if (!make || !model || !yearStr) {
      return NextResponse.json(
        { error: "Missing required params: make, model, year" },
        { status: 400 },
      );
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const depEstimate = depEstStr ? parseInt(depEstStr, 10) : undefined;
    const newPrice = newPriceStr ? parseInt(newPriceStr, 10) : undefined;
    const engineCapacity = engineStr ? parseInt(engineStr, 10) : undefined;
    const mileage = mileageStr ? parseInt(mileageStr, 10) : undefined;

    // Always hit both eBay AND cache. eBay is the freshest signal; cache is
    // a confirmation/fallback. Previously we short-circuited to cache when
    // it had ≥3 entries, which let data go stale.
    const [cacheResult, { result: ebayResult, debug: ebayDebug }, mcOutcome] = await Promise.all([
      checkCache(make, model, year),
      fetchEbayComparables(make, model, year, fuelType, depEstimate, debug),
      // Flag-gated; resolves to {ok:false} (no throw) when disabled/capped. The
      // free-tier monthly cap and TTL cache live inside this call.
      getMarketCheckValuation(make, model, year),
    ]);

    const marketcheck = mcOutcome.ok ? mcOutcome.aggregate : null;
    const marketcheckSource = mcOutcome.ok ? mcOutcome.source : null;

    const sources: string[] = [];
    if (ebayResult) sources.push("ebay");
    if (cacheResult) sources.push("cache");
    if (marketcheck) sources.push("marketcheck");

    const colourAdj = colourStr ? parseFloat(colourStr) : undefined;

    // Track valuation event (fire-and-forget)
    const sb = supabaseServer();
    sb.from("site_events").insert({
      event_type: "valuation",
      metadata: { make, model, year },
    }).then(() => {}, () => {});

    // Write to cache asynchronously
    if (ebayResult) {
      writeCache({
        make,
        model,
        year,
        fuelType: fuelType || undefined,
        engineCapacity,
        mileage,
        estimatedNewPrice: newPrice,
        depreciationEstimate: depEstimate,
        ebayMedian: ebayResult.median,
        ebayListingCount: ebayResult.listingCount,
        ebayMinPrice: ebayResult.minPrice,
        ebayMaxPrice: ebayResult.maxPrice,
        ebayTotalListings: ebayResult.totalListings,
        dominantTransmission: ebayResult.dominantTransmission || undefined,
        dominantBodyType: ebayResult.dominantBodyType || undefined,
        colourAdjustment: colourAdj,
      }).catch(() => {});
    }

    const response: ValuationResponse = {
      ebayMedian: ebayResult?.median ?? null,
      ebayQ1Price: ebayResult?.q1Price ?? null,
      ebayQ3Price: ebayResult?.q3Price ?? null,
      ebayListingCount: ebayResult?.listingCount ?? 0,
      ebayMinPrice: ebayResult?.minPrice ?? null,
      ebayMaxPrice: ebayResult?.maxPrice ?? null,
      ebayTotalListings: ebayResult?.totalListings ?? null,
      ebayDominantTransmission: ebayResult?.dominantTransmission ?? null,
      ebayDominantBodyType: ebayResult?.dominantBodyType ?? null,
      ebayYearWidened: ebayResult?.yearWidened ?? false,
      ebayYearTolerance: ebayResult?.yearTolerance ?? null,
      cacheMedian: cacheResult?.median ?? null,
      cacheEntryCount: cacheResult?.entryCount ?? 0,
      marketcheckMedian: marketcheck?.median ?? null,
      marketcheckQ1: marketcheck?.q1 ?? null,
      marketcheckQ3: marketcheck?.q3 ?? null,
      marketcheckListingCount: marketcheck?.listingCount ?? 0,
      marketcheckSource,
      sources,
    };

    if (debug) {
      response.debug = {
        ...(ebayDebug || {}),
        marketcheck: { reason: mcOutcome.ok ? mcOutcome.source : mcOutcome.reason, aggregate: marketcheck },
        rejectedByTitle: ebayResult?.rejectedByTitle,
        rejectedByPriceFloor: ebayResult?.rejectedByPriceFloor,
        rejectedByIqr: ebayResult?.rejectedByIqr,
        selectedSample: ebayResult?.selectedSample ?? [],
      };
    }

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error: unknown) {
    console.error("[VALUATION] Route error:", (error as Error)?.message || error);
    return NextResponse.json(
      { error: "Valuation service error" },
      { status: 500 },
    );
  }
}
