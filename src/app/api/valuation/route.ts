export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// ── eBay OAuth token cache ──────────────────────────────────────────────────

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;

let cachedEbayToken: { token: string; expiresAt: number } | null = null;

async function getEbayToken(): Promise<string | null> {
  if (cachedEbayToken && cachedEbayToken.expiresAt > Date.now()) {
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
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "https://api.ebay.com/oauth/api_scope",
      }),
    });

    if (!response.ok) {
      console.error(`[VALUATION] eBay token request failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    cachedEbayToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5 min buffer
    };
    return cachedEbayToken.token;
  } catch (error: any) {
    console.error("[VALUATION] eBay token error:", error?.message || error);
    return null;
  }
}

// ── eBay comparables ────────────────────────────────────────────────────────

async function fetchEbayComparables(
  make: string,
  model: string,
  year: number,
  depreciationEstimate?: number,
): Promise<number | null> {
  const token = await getEbayToken();
  if (!token) return null;

  try {
    const query = `${make} ${model} ${year}`;
    const params = new URLSearchParams({
      q: query,
      category_ids: "9801", // Cars
      filter: [
        "buyingOptions:{FIXED_PRICE}",
        "conditionIds:{3000}", // Used
        "deliveryCountry:GB",
        "price:[500..],priceCurrency:GBP",
      ].join(","),
      sort: "price",
      limit: "20",
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[VALUATION] eBay search failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      itemSummaries?: Array<{ price?: { value: string; currency: string } }>;
    };

    if (!data.itemSummaries || data.itemSummaries.length === 0) return null;

    // Extract prices
    const prices = data.itemSummaries
      .map((item) => {
        const val = parseFloat(item.price?.value || "0");
        return val > 0 ? val : null;
      })
      .filter((p): p is number => p !== null);

    if (prices.length < 3) return null;

    // Discard outliers relative to depreciation estimate
    let filtered = prices;
    if (depreciationEstimate && depreciationEstimate > 0) {
      const low = depreciationEstimate * 0.2;
      const high = depreciationEstimate * 3.0;
      filtered = prices.filter((p) => p >= low && p <= high);
    }

    if (filtered.length < 3) return null;

    // Median
    filtered.sort((a, b) => a - b);
    const mid = Math.floor(filtered.length / 2);
    const median = filtered.length % 2 === 0 ? (filtered[mid - 1] + filtered[mid]) / 2 : filtered[mid];

    return Math.round(median);
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

async function checkCache(
  make: string,
  model: string,
  year: number,
): Promise<number | null> {
  try {
    const sb = supabaseServer();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sb
      .from("vehicle_valuations")
      .select("estimated_value")
      .eq("make", make.toUpperCase())
      .eq("model", model.toUpperCase())
      .eq("year_of_manufacture", year)
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data || data.length < 3) return null;

    const values = data.map((r) => r.estimated_value as number).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? Math.round((values[mid - 1] + values[mid]) / 2) : values[mid];
  } catch (error: any) {
    console.error("[VALUATION] Cache read error:", error?.message || error);
    return null;
  }
}

async function upsertCache(
  make: string,
  model: string,
  year: number,
  fuelType: string | undefined,
  value: number,
): Promise<void> {
  try {
    const sb = supabaseServer();
    await sb.from("vehicle_valuations").insert({
      make: make.toUpperCase(),
      model: model.toUpperCase(),
      year_of_manufacture: year,
      fuel_type: fuelType?.toUpperCase() || null,
      estimated_value: Math.round(value),
      source: "ebay",
    });
  } catch (error: any) {
    console.error("[VALUATION] Cache write error:", error?.message || error);
  }
}

// ── Route handler ───────────────────────────────────────────────────────────

type ValuationResponse = {
  ebayMedian: number | null;
  cacheMedian: number | null;
  sources: string[];
};

export async function GET(req: Request): Promise<NextResponse<ValuationResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(req.url);
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const yearStr = searchParams.get("year");
    const depEstStr = searchParams.get("depreciationEstimate");
    const fuelType = searchParams.get("fuelType") || undefined;

    if (!make || !model || !yearStr) {
      return NextResponse.json({ error: "Missing required params: make, model, year" }, { status: 400 });
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const depEstimate = depEstStr ? parseInt(depEstStr, 10) : undefined;

    // Fetch eBay + cache in parallel
    const [ebayMedian, cacheMedian] = await Promise.all([
      fetchEbayComparables(make, model, year, depEstimate),
      checkCache(make, model, year),
    ]);

    const sources: string[] = [];
    if (ebayMedian) sources.push("ebay");
    if (cacheMedian) sources.push("cache");

    // Cache the eBay result if we got one
    if (ebayMedian) {
      upsertCache(make, model, year, fuelType, ebayMedian).catch(() => {});
    }

    return NextResponse.json({ ebayMedian, cacheMedian, sources });
  } catch (error: any) {
    console.error("[VALUATION] Route error:", error?.message || error);
    return NextResponse.json({ error: "Valuation service error" }, { status: 500 });
  }
}
