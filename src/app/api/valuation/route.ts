export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getMarketCheckValuation } from "@/lib/marketcheck";
import { fetchEbayItems, buildComparables, ebaySearchModel, type EbayResult } from "@/lib/ebay-comparables";
import { analyticsWritesEnabled } from "@/lib/analytics-writes";

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

async function fetchEbayComparables(
  make: string,
  model: string,
  year: number,
  fuelType: string | null,
  debug: boolean,
): Promise<{ result: EbayResult | null; debug?: Record<string, unknown> }> {
  const token = await getEbayToken();
  if (!token) return { result: null };

  try {
    // Search on the model family; buildComparables still prefers titles that
    // match DVLA's full model and only relaxes when too few do.
    const bundle = await fetchEbayItems(token, make, ebaySearchModel(make, model));
    if (!bundle) return { result: null };

    const result = buildComparables(bundle, make, model, year, fuelType);

    if (debug) {
      return {
        result,
        debug: {
          query: bundle.query,
          rawCount: bundle.rawCount,
          totalReported: bundle.totalReported,
          itemsAfterTitleFilter: bundle.items.length - (result?.rejectedByTitle ?? 0),
          matchedOn: result?.matchedOn ?? null,
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
      fetchEbayComparables(make, model, year, fuelType, debug),
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
    if (analyticsWritesEnabled()) {
      sb.from("site_events").insert({
        event_type: "valuation",
        metadata: { make, model, year },
      }).then(() => {}, () => {});
    }

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
        rejectedBySalvage: ebayResult?.rejectedBySalvage,
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
