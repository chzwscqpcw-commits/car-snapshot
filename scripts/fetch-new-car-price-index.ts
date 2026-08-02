/**
 * Fetches the ONS new-car price index and writes src/data/new-car-price-index.json.
 *
 * WHY THIS EXISTS
 * ───────────────
 * src/data/new-prices.json holds CURRENT (2026) list prices, scraped from
 * Parkers reviews of cars still on sale. The valuation model used those as
 * "what this car cost new" and depreciated from them — so a 2018 Golf was
 * depreciated from the 2026 Golf range price, baking in years of list-price
 * inflation on top of the real value.
 *
 * This index converts a present-day list price back to the registration year.
 * Series D7E8 (dataset MM23) — "CPI INDEX 07.1.1A : NEW CARS 2015=100".
 * Crown copyright, Open Government Licence v3.0: free commercial reuse with
 * attribution. No API key, no rate limit, one JSON GET.
 *
 * Usage:
 *   npx tsx scripts/fetch-new-car-price-index.ts
 */
import fs from "node:fs";
import path from "node:path";

const SERIES_URL =
  "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7e8/mm23/data";
const OUT_PATH = path.resolve(__dirname, "../src/data/new-car-price-index.json");

type OnsPoint = { date: string; value: string; year?: string; month?: string };
type OnsSeries = {
  description?: { title?: string };
  years?: OnsPoint[];
  months?: OnsPoint[];
};

async function main(): Promise<void> {
  const res = await fetch(SERIES_URL, { headers: { "User-Agent": "free-plate-check/1.0" } });
  if (!res.ok) throw new Error(`ONS returned HTTP ${res.status}`);
  const series = (await res.json()) as OnsSeries;

  const byYear: Record<string, number> = {};
  for (const p of series.years ?? []) {
    const y = parseInt(p.date, 10);
    const v = parseFloat(p.value);
    if (Number.isFinite(y) && Number.isFinite(v)) byYear[String(y)] = v;
  }
  if (Object.keys(byYear).length === 0) throw new Error("No annual values parsed from ONS");

  // The current year has no annual figure until the following January, so
  // average whatever months have been published. Without this the newest cars
  // would deflate against a year-old index.
  const latestAnnual = Math.max(...Object.keys(byYear).map(Number));
  const monthsByYear = new Map<number, number[]>();
  for (const p of series.months ?? []) {
    const y = parseInt(p.year ?? "", 10);
    const v = parseFloat(p.value);
    if (!Number.isFinite(y) || !Number.isFinite(v)) continue;
    if (y <= latestAnnual) continue;
    if (!monthsByYear.has(y)) monthsByYear.set(y, []);
    monthsByYear.get(y)!.push(v);
  }
  const partial: Record<string, { months: number; value: number }> = {};
  for (const [y, vals] of monthsByYear) {
    const mean = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    byYear[String(y)] = mean;
    partial[String(y)] = { months: vals.length, value: mean };
  }

  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  const out = {
    source: series.description?.title ?? "CPI INDEX 07.1.1A : NEW CARS 2015=100",
    seriesId: "D7E8",
    dataset: "MM23",
    sourceUrl: SERIES_URL,
    licence: "Open Government Licence v3.0 (Crown copyright)",
    fetchedAt: new Date().toISOString().slice(0, 10),
    minYear: years[0],
    maxYear: years[years.length - 1],
    /** Years still being published, averaged from part-year months. */
    partialYears: partial,
    byYear,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`  ${years.length} years, ${out.minYear}–${out.maxYear}`);
  for (const y of [2008, 2012, 2016, 2020, 2024, out.maxYear]) {
    if (byYear[String(y)]) {
      const f = byYear[String(y)] / byYear[String(out.maxYear)];
      console.log(`  ${y}: index ${byYear[String(y)]}  → deflator ${f.toFixed(3)}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
