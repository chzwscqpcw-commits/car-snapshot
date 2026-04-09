import { NextResponse } from "next/server";
import weeklyJson from "@/data/fuel-prices-weekly.json";

const CONTENT_API =
  "https://www.gov.uk/api/content/government/statistics/weekly-road-fuel-prices";

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

function parseDate(ukDate: string): string {
  const parts = ukDate.split("/");
  if (parts.length !== 3) return ukDate;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/** Discover the latest CSV URL from GOV.UK Content API (same as build script) */
async function discoverCsvUrl(): Promise<string> {
  const res = await fetch(CONTENT_API);
  if (!res.ok) throw new Error(`Content API returned ${res.status}`);
  const json = await res.json();

  const attachments: { content_type: string; title: string; url: string }[] = [];
  function findAttachments(obj: unknown): void {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) { obj.forEach(findAttachments); return; }
    const o = obj as Record<string, unknown>;
    if (o.content_type && o.url && typeof o.title === "string") {
      attachments.push(o as { content_type: string; title: string; url: string });
    }
    Object.values(o).forEach(findAttachments);
  }
  findAttachments(json);

  const csvs = attachments.filter(
    (a) => a.content_type === "text/csv" || a.url?.endsWith(".csv")
  );
  const modern = csvs.find(
    (a) => a.title?.includes("2018") || (a.title?.includes("201") && a.title?.includes("202"))
  );
  const url = modern?.url ?? csvs.find((a) => !a.title?.includes("2003"))?.url;
  if (!url) throw new Error("Could not find CSV attachment in Content API response");
  return url;
}

async function fetchLatestPrices(): Promise<FuelPriceCache> {
  const csvUrl = await discoverCsvUrl();
  const res = await fetch(csvUrl, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);

  const text = await res.text();
  const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);

  const lastLine = lines[lines.length - 1];
  const cols = parseCSVRow(lastLine);

  const petrol = parseFloat(cols[1]);
  const diesel = parseFloat(cols[2]);
  const date = parseDate(cols[0]);

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
