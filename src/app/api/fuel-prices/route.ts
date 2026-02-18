import { NextResponse } from "next/server";

const CSV_URL =
  "https://assets.publishing.service.gov.uk/media/6993252f7da91680ad7f44a1/CSV__2018_-____3_.csv";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Fallback prices (pence/litre) — updated Feb 2026
const FALLBACK_PETROL = 131;
const FALLBACK_DIESEL = 141;

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
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const parts = ukDate.split("/");
  if (parts.length !== 3) return ukDate;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

async function fetchLatestPrices(): Promise<FuelPriceCache> {
  const res = await fetch(CSV_URL, { next: { revalidate: 86400 } });
  if (!res.ok) {
    throw new Error(`CSV fetch failed: ${res.status}`);
  }

  const text = await res.text();
  const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);

  // Last non-empty line is the latest data
  const lastLine = lines[lines.length - 1];
  const cols = parseCSVRow(lastLine);

  // cols[0] = Date, cols[1] = ULSP pump price, cols[2] = ULSD pump price
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
    return NextResponse.json({
      petrol: FALLBACK_PETROL,
      diesel: FALLBACK_DIESEL,
      date: null,
    });
  }
}
