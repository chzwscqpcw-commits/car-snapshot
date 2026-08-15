import { NextResponse } from "next/server";
import weeklyJson from "@/data/fuel-prices-weekly.json";
import { discoverFuelCsvUrl, parseFuelCsvDate } from "@/lib/govuk-fuel-csv";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type FuelPriceCache = {
  petrol: number;
  diesel: number;
  date: string;
  fetchedAt: number;
};

let cache: FuelPriceCache | null = null;

function parseCSVRow(row: string): string[] {
  return row.split(",").map((s) => s.trim());
}

async function fetchLatestPrices(): Promise<FuelPriceCache> {
  // Discovery + date parsing live in src/lib/govuk-fuel-csv.ts. This route had
  // its own correct copy while /data-health had a hardcoded URL that rotted;
  // one shared implementation is the point.
  const csvUrl = await discoverFuelCsvUrl();
  const res = await fetch(csvUrl, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);

  const text = await res.text();
  const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);

  const lastLine = lines[lines.length - 1];
  const cols = parseCSVRow(lastLine);

  const petrol = parseFloat(cols[1]);
  const diesel = parseFloat(cols[2]);
  const date = parseFuelCsvDate(cols[0]);

  if (isNaN(petrol) || isNaN(diesel)) {
    throw new Error("Failed to parse fuel prices from CSV");
  }

  return {
    petrol: Math.round(petrol * 100) / 100,
    diesel: Math.round(diesel * 100) / 100,
    date,
    fetchedAt: Date.now(),
  };
}

/** Fallback: latest data from the build-time weekly JSON */
function getFallbackFromWeeklyData(): { petrol: number; diesel: number; date: string } {
  const latest = weeklyJson.weekly[weeklyJson.weekly.length - 1];
  return { petrol: latest.petrol, diesel: latest.diesel, date: latest.date };
}

export async function GET() {
  // Return cached data if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      petrol: cache.petrol,
      diesel: cache.diesel,
      date: cache.date,
    });
  }

  try {
    cache = await fetchLatestPrices();
    return NextResponse.json({
      petrol: cache.petrol,
      diesel: cache.diesel,
      date: cache.date,
    });
  } catch (error) {
    console.error("Failed to fetch fuel prices:", error);
    // Fall back to build-time data instead of stale hardcoded values
    const fallback = getFallbackFromWeeklyData();
    return NextResponse.json({
      petrol: fallback.petrol,
      diesel: fallback.diesel,
      date: fallback.date,
    });
  }
}
