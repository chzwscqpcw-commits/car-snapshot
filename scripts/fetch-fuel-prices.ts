/**
 * Fetches weekly road fuel prices from DESNZ (GOV.UK) and writes
 * src/data/fuel-prices-weekly.json.
 *
 * Data source: https://www.gov.uk/government/statistics/weekly-road-fuel-prices
 *
 * Run: npx tsx scripts/fetch-fuel-prices.ts
 * Hooked into prebuild so every deploy gets the latest prices.
 */

import fs from "fs";
import path from "path";

const CONTENT_API =
  "https://www.gov.uk/api/content/government/statistics/weekly-road-fuel-prices";
const OUTPUT = path.resolve(__dirname, "..", "src", "data", "fuel-prices-weekly.json");

interface WeeklyPrice {
  date: string; // YYYY-MM-DD
  petrol: number; // pence per litre
  diesel: number;
}

interface FuelPriceOutput {
  lastFetched: string;
  source: string;
  weekly: WeeklyPrice[];
}

/** Parse DD/MM/YYYY → YYYY-MM-DD */
function parseDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** Strip BOM and parse CSV rows into weekly price objects */
function parseCsv(csv: string): WeeklyPrice[] {
  const clean = csv.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());

  // Skip header row
  const rows: WeeklyPrice[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 3) continue;

    const date = parseDate(cols[0].trim());
    const petrol = parseFloat(cols[1].trim());
    const diesel = parseFloat(cols[2].trim());

    if (!date || isNaN(petrol) || isNaN(diesel)) continue;

    rows.push({ date, petrol: Math.round(petrol * 100) / 100, diesel: Math.round(diesel * 100) / 100 });
  }

  return rows;
}

/** Find CSV attachment URLs from GOV.UK Content API */
async function discoverCsvUrls(): Promise<{ modern: string; legacy: string | null }> {
  const res = await fetch(CONTENT_API);
  if (!res.ok) throw new Error(`Content API returned ${res.status}`);
  const json = await res.json();

  // Attachments are nested inside details.documents or body content
  // They appear in the details object
  const attachments: { content_type: string; title: string; url: string }[] = [];

  // Walk the document structure to find attachments
  function findAttachments(obj: unknown): void {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(findAttachments);
      return;
    }
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
  const legacy = csvs.find(
    (a) => a.title?.includes("2003") || a.title?.includes("2017")
  );

  if (!modern) {
    // Fallback: find any CSV that isn't the legacy one
    const any = csvs.find((a) => a !== legacy);
    if (!any) throw new Error("Could not find any CSV attachment in Content API response");
    return { modern: any.url, legacy: legacy?.url ?? null };
  }

  return { modern: modern.url, legacy: legacy?.url ?? null };
}

async function fetchCsv(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${url}`);
  return res.text();
}

async function main() {
  console.log("Discovering CSV URLs from GOV.UK Content API...");
  const { modern, legacy } = await discoverCsvUrls();
  console.log(`  Modern CSV: ${modern}`);
  if (legacy) console.log(`  Legacy CSV: ${legacy}`);

  // Fetch both files
  console.log("Fetching CSV data...");
  const [modernCsv, legacyCsv] = await Promise.all([
    fetchCsv(modern),
    legacy ? fetchCsv(legacy) : Promise.resolve(""),
  ]);

  const modernRows = parseCsv(modernCsv);
  const legacyRows = legacyCsv ? parseCsv(legacyCsv) : [];

  console.log(`  Modern: ${modernRows.length} weeks (${modernRows[0]?.date} to ${modernRows[modernRows.length - 1]?.date})`);
  if (legacyRows.length) {
    console.log(`  Legacy: ${legacyRows.length} weeks (${legacyRows[0]?.date} to ${legacyRows[legacyRows.length - 1]?.date})`);
  }

  // Merge and sort by date
  const allRows = [...legacyRows, ...modernRows].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Deduplicate by date (prefer modern file if overlap)
  const seen = new Set<string>();
  const deduped: WeeklyPrice[] = [];
  for (let i = allRows.length - 1; i >= 0; i--) {
    if (!seen.has(allRows[i].date)) {
      seen.add(allRows[i].date);
      deduped.unshift(allRows[i]);
    }
  }

  const output: FuelPriceOutput = {
    lastFetched: new Date().toISOString(),
    source: "https://www.gov.uk/government/statistics/weekly-road-fuel-prices",
    weekly: deduped,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`\nWritten ${deduped.length} weekly data points to src/data/fuel-prices-weekly.json`);

  const latest = deduped[deduped.length - 1];
  console.log(`Latest: ${latest.date} — Petrol ${latest.petrol}p, Diesel ${latest.diesel}p`);
}

main().catch((err) => {
  console.error("Failed to fetch fuel prices:", err);
  // Don't exit with error — allow build to continue with cached data
  console.log("Build will continue with existing cached data if available.");
});
