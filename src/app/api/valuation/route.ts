export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

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
  } catch (error: any) {
    console.error("[VALUATION] eBay token error:", error?.message || error);
    return null;
  }
}

// ── Fuel type mapping (DVLA → eBay aspect values) ──────────────────────────

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

// ── Asking price discount ──────────────────────────────────────────────────

const ASKING_PRICE_DISCOUNT = 0.92; // 8% discount: eBay asking → realistic

// ── eBay comparables ────────────────────────────────────────────────────────

type AspectDistribution = {
  localizedAspectName: string;
  aspectValueDistributions: Array<{
    localizedAspectValue: string;
    matchCount: number;
  }>;
};

type EbayResult = {
  median: number;
  listingCount: number;
  minPrice: number;
  maxPrice: number;
  totalListings: number;
  dominantTransmission: string | null;
  dominantBodyType: string | null;
  yearWidened: boolean;
};

async function searchEbay(
  token: string,
  make: string,
  model: string,
  yearFilter: string | null,
  fuelType: string | null,
  depreciationEstimate?: number,
): Promise<EbayResult | null> {
  // Build aspect_filter parts
  const aspects: string[] = [];
  if (yearFilter) aspects.push(`Model Year:${yearFilter}`);
  if (fuelType) {
    const mapped = FUEL_TYPE_MAP[fuelType.toUpperCase()];
    if (mapped) aspects.push(`Fuel Type:{${mapped}}`);
  }

  const params = new URLSearchParams({
    q: `${make} ${model}`,
    category_ids: "9801",
    fieldgroups: "MATCHING_ITEMS,ASPECT_REFINEMENTS,EXTENDED",
    filter: [
      "buyingOptions:{FIXED_PRICE}",
      "conditionIds:{3000}",
      "price:[750..],priceCurrency:GBP",
      "itemLocationCountry:GB",
    ].join(","),
    sort: "price",
    limit: "50",
  });

  if (aspects.length > 0) {
    params.set("aspect_filter", `categoryId:9801,${aspects.join(",")}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(
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

  clearTimeout(timeout);

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

  if (!data.itemSummaries || data.itemSummaries.length === 0) return null;

  const makeUpper = make.toUpperCase();
  const modelUpper = model.toUpperCase();

  // Filter: title must contain both make AND model, and have a valid price
  const validItems = data.itemSummaries.filter((item) => {
    const title = (item.title || "").toUpperCase();
    if (!title.includes(makeUpper) || !title.includes(modelUpper)) return false;
    const price = parseFloat(item.price?.value || "0");
    return price > 0;
  });

  const prices = validItems.map((item) => parseFloat(item.price!.value));

  if (prices.length < 2) return null;

  // Discard outliers relative to depreciation estimate (35%-250%)
  let filtered = prices;
  if (depreciationEstimate && depreciationEstimate > 0) {
    const low = depreciationEstimate * 0.35;
    const high = depreciationEstimate * 2.5;
    filtered = prices.filter((p) => p >= low && p <= high);
  }

  if (filtered.length < 2) return null;

  // Median
  filtered.sort((a, b) => a - b);
  const mid = Math.floor(filtered.length / 2);
  const median =
    filtered.length % 2 === 0
      ? (filtered[mid - 1] + filtered[mid]) / 2
      : filtered[mid];

  // Extract dominant aspects from refinement data
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
    median: Math.round(median * ASKING_PRICE_DISCOUNT),
    listingCount: filtered.length,
    minPrice: Math.round(filtered[0]),
    maxPrice: Math.round(filtered[filtered.length - 1]),
    totalListings: data.total || filtered.length,
    dominantTransmission,
    dominantBodyType,
    yearWidened: false,
  };
}

async function fetchEbayComparables(
  make: string,
  model: string,
  year: number,
  fuelType: string | null,
  depreciationEstimate?: number,
): Promise<EbayResult | null> {
  const token = await getEbayToken();
  if (!token) return null;

  try {
    // Attempt 1: Exact year aspect + fuel type
    const r1 = await searchEbay(token, make, model, `{${year}}`, fuelType, depreciationEstimate);
    if (r1 && r1.listingCount >= 3) return r1;

    // Attempt 2: Adjacent years ±1 aspect + fuel type
    const r2 = await searchEbay(
      token, make, model,
      `{${year - 1}|${year}|${year + 1}}`,
      fuelType, depreciationEstimate,
    );
    if (r2 && r2.listingCount >= 3) return { ...r2, yearWidened: true };

    // Attempt 3: ±2 years aspect + fuel type
    const years = [year - 2, year - 1, year, year + 1, year + 2].join("|");
    const r3 = await searchEbay(
      token, make, model, `{${years}}`, fuelType, depreciationEstimate,
    );
    if (r3 && r3.listingCount >= 3) return { ...r3, yearWidened: true };

    // Attempt 4: Drop year aspect, keep fuel type
    const r4 = await searchEbay(token, make, model, null, fuelType, depreciationEstimate);
    if (r4 && r4.listingCount >= 3) return { ...r4, yearWidened: true };

    // Attempt 5: Drop year and fuel type
    const r5 = await searchEbay(token, make, model, null, null, depreciationEstimate);
    if (r5) return { ...r5, yearWidened: true };

    // Return whatever we got from earlier attempts if any had results
    if (r1) return r1;
    if (r2) return { ...r2, yearWidened: true };

    return null;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error("[VALUATION] eBay request timeout");
    } else {
      console.error("[VALUATION] eBay search error:", error?.message || error);
    }
    return null;
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
  } catch (error: any) {
    console.error("[VALUATION] Cache read error:", error?.message || error);
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
  } catch (error: any) {
    console.error("[VALUATION] Cache write error:", error?.message || error);
  }
}

// ── Route handler ───────────────────────────────────────────────────────────

type ValuationResponse = {
  ebayMedian: number | null;
  ebayListingCount: number;
  ebayMinPrice: number | null;
  ebayMaxPrice: number | null;
  ebayTotalListings: number | null;
  ebayDominantTransmission: string | null;
  ebayDominantBodyType: string | null;
  ebayYearWidened: boolean;
  cacheMedian: number | null;
  cacheEntryCount: number;
  sources: string[];
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

    // Check cache first — if warm, we can skip eBay
    const cacheResult = await checkCache(make, model, year);

    let ebayResult: EbayResult | null = null;

    // Only call eBay if cache is cold (<3 entries)
    if (!cacheResult) {
      ebayResult = await fetchEbayComparables(make, model, year, fuelType, depEstimate);
    }

    const sources: string[] = [];
    if (ebayResult) sources.push("ebay");
    if (cacheResult) sources.push("cache");

    // Parse colour adjustment for cache write
    const colourAdj = colourStr ? parseFloat(colourStr) : undefined;

    // Write to cache asynchronously (don't block response)
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

    return NextResponse.json({
      ebayMedian: ebayResult?.median ?? null,
      ebayListingCount: ebayResult?.listingCount ?? 0,
      ebayMinPrice: ebayResult?.minPrice ?? null,
      ebayMaxPrice: ebayResult?.maxPrice ?? null,
      ebayTotalListings: ebayResult?.totalListings ?? null,
      ebayDominantTransmission: ebayResult?.dominantTransmission ?? null,
      ebayDominantBodyType: ebayResult?.dominantBodyType ?? null,
      ebayYearWidened: ebayResult?.yearWidened ?? false,
      cacheMedian: cacheResult?.median ?? null,
      cacheEntryCount: cacheResult?.entryCount ?? 0,
      sources,
    });
  } catch (error: any) {
    console.error("[VALUATION] Route error:", error?.message || error);
    return NextResponse.json(
      { error: "Valuation service error" },
      { status: 500 },
    );
  }
}
