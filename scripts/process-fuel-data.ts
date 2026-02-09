/**
 * VCA Car Fuel Economy Data Processor
 *
 * This script processes car fuel consumption data CSV files from the Vehicle
 * Certification Agency (VCA) and outputs a deduplicated, normalized JSON file
 * for use in the Free Plate Check application.
 *
 * HOW TO DOWNLOAD THE SOURCE DATA:
 * 1. Visit https://carfueldata.vehicle-certification-agency.gov.uk/downloads/default.aspx
 * 2. Download one or more yearly CSV files (e.g. "Euro 6 Car Fuel Data" or similar).
 *    The site provides data going back multiple years. Download the years you need.
 * 3. Save the CSV files in the project root directory.
 * 4. Pass them as arguments to this script (see USAGE below).
 *
 * The VCA data includes official NEDC/WLTP fuel consumption figures for all new cars
 * sold in the UK. Each row represents a specific variant of a car model with its
 * tested fuel economy values.
 *
 * USAGE:
 *   npx tsx scripts/process-fuel-data.ts CarFuelData2024.csv CarFuelData2023.csv
 *   # or process all fuel data CSVs in the project root:
 *   npx tsx scripts/process-fuel-data.ts *.csv
 *
 * If no arguments are provided, the script looks for files matching
 * CarFuelData*.csv or *fuel*.csv in the project root.
 *
 * CSV COLUMNS (typical VCA format):
 *   - Manufacturer: Vehicle manufacturer name
 *   - Model: Vehicle model name
 *   - Description: Variant description (engine/trim info)
 *   - Transmission: Gearbox type (Manual/Automatic)
 *   - Engine Capacity (cm3): Engine displacement in cubic centimetres
 *   - Fuel Type: Petrol, Diesel, Electricity, etc.
 *   - Metric - Urban (Cold): Urban fuel consumption (L/100km)
 *   - Metric - Extra Urban: Extra-urban fuel consumption (L/100km)
 *   - Metric - Combined: Combined fuel consumption (L/100km)
 *   - Imperial - Urban (Cold): Urban fuel consumption (mpg)
 *   - Imperial - Extra Urban: Extra-urban fuel consumption (mpg)
 *   - Imperial - Combined: Combined fuel consumption (mpg)
 *   - CO2 (g/km): CO2 emissions
 *   ... and additional columns for WLTP values, noise levels, etc.
 *
 * Column names vary slightly between years, so the script uses flexible matching.
 *
 * NOTES:
 * - Make and model are normalized to uppercase for consistent matching.
 * - Deduplication is by make + model + engineCapacity + fuelType (keeps first occurrence).
 * - Electric/hydrogen vehicles without MPG figures are skipped.
 * - Uses only Node.js built-in modules (fs, readline, path) -- no external dependencies.
 */

import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FuelRecord {
  make: string;
  model: string;
  engineCapacity: number;
  fuelType: string;
  combinedMpg: number;
  urbanMpg: number;
  extraUrbanMpg: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "src", "data", "fuel-economy.json");

// Fuel types to include (electric/hydrogen vehicles don't have meaningful MPG)
const INCLUDED_FUEL_TYPES = new Set([
  "petrol",
  "diesel",
  "petrol/electric",
  "diesel/electric",
  "petrol hybrid",
  "diesel hybrid",
  "lpg",
  "cng",
  "bifuel",
]);

// ---------------------------------------------------------------------------
// CSV Parsing Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a single CSV line, respecting quoted fields that may contain commas.
 * Handles double-quote escaping (i.e. "" inside a quoted field becomes ").
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse a numeric value from a string, returning 0 if not a valid number.
 */
function parseNumber(raw: string): number {
  if (!raw || raw.trim() === "" || raw.trim() === "-") return 0;
  const n = parseFloat(raw.trim());
  return isNaN(n) ? 0 : n;
}

/**
 * Normalize fuel type to a consistent uppercase format.
 */
function normalizeFuelType(raw: string): string {
  const s = raw.trim().toUpperCase();

  // Normalize common variations
  if (s.includes("PETROL") && s.includes("ELECTRIC")) return "PETROL/ELECTRIC";
  if (s.includes("DIESEL") && s.includes("ELECTRIC")) return "DIESEL/ELECTRIC";
  if (s === "PETROL" || s === "UNLEADED") return "PETROL";
  if (s === "DIESEL" || s === "DERV") return "DIESEL";

  return s;
}

// ---------------------------------------------------------------------------
// Column Index Detection
// ---------------------------------------------------------------------------

/**
 * Try to detect column indices from the header row.
 * VCA CSVs have slightly different column names between years, so we
 * use flexible pattern matching.
 */
function detectColumns(headers: string[]): {
  manufacturer: number;
  model: number;
  engineCapacity: number;
  fuelType: number;
  combinedMpg: number;
  urbanMpg: number;
  extraUrbanMpg: number;
} | null {
  const lower = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  function findIndex(patterns: string[]): number {
    for (const pattern of patterns) {
      const idx = lower.findIndex((h) => h.includes(pattern));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  // For MPG columns, we specifically want the Imperial values, not Metric (L/100km).
  // We need to be careful: "imperialcombined" vs "metriccombined".
  function findMpgIndex(context: string): number {
    // First try: look for imperial + context
    let idx = lower.findIndex(
      (h) => h.includes("imperial") && h.includes(context)
    );
    if (idx !== -1) return idx;

    // Second try: look for mpg + context
    idx = lower.findIndex((h) => h.includes("mpg") && h.includes(context));
    if (idx !== -1) return idx;

    // Third try: look for context + mpg
    idx = lower.findIndex((h) => h.includes(context) && h.includes("mpg"));
    if (idx !== -1) return idx;

    // Fourth try: just "combined", "urban", "extraurban" that does NOT contain "metric" or "l100"
    idx = lower.findIndex(
      (h) =>
        h.includes(context) &&
        !h.includes("metric") &&
        !h.includes("l100") &&
        !h.includes("co2") &&
        !h.includes("wltp")
    );
    if (idx !== -1) return idx;

    return -1;
  }

  const result = {
    manufacturer: findIndex(["manufacturer", "make"]),
    model: findIndex(["model"]),
    engineCapacity: findIndex(["enginecapacity", "capacity", "enginecc", "enginesize", "cc"]),
    fuelType: findIndex(["fueltype", "fuel"]),
    combinedMpg: findMpgIndex("combined"),
    urbanMpg: findMpgIndex("urban"),
    extraUrbanMpg: findMpgIndex("extraurban"),
  };

  // Validate essential columns
  const missing: string[] = [];
  if (result.manufacturer === -1) missing.push("Manufacturer");
  if (result.model === -1) missing.push("Model");
  if (result.fuelType === -1) missing.push("Fuel Type");

  if (missing.length > 0) {
    console.warn("  Could not detect required columns:", missing.join(", "));
    console.warn("  Headers found:", headers.join(" | "));
    return null;
  }

  // MPG columns are important but not fatal -- some years only have metric
  if (result.combinedMpg === -1) {
    console.warn("  Warning: Could not find Combined MPG column. Will attempt L/100km conversion.");
    // Try to find metric combined for conversion
    const metricCombined = lower.findIndex(
      (h) => (h.includes("metric") || h.includes("l100")) && h.includes("combined")
    );
    if (metricCombined !== -1) {
      // We'll store the index but mark it for conversion
      result.combinedMpg = metricCombined;
      // Flag for conversion handled in processing
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main Processing
// ---------------------------------------------------------------------------

async function processFile(
  filePath: string,
  seen: Set<string>,
  records: FuelRecord[]
): Promise<{ total: number; added: number; dupes: number; skipped: number }> {
  const stats = { total: 0, added: 0, dupes: 0, skipped: 0 };

  if (!fs.existsSync(filePath)) {
    console.error(`  File not found: ${filePath}`);
    return stats;
  }

  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers: string[] | null = null;
  let columns: ReturnType<typeof detectColumns> = null;

  for await (const line of rl) {
    if (line.trim() === "") continue;

    const fields = parseCSVLine(line);

    // First non-empty line is the header
    if (!headers) {
      headers = fields;
      columns = detectColumns(headers);
      if (!columns) {
        console.warn(`  Skipping file (unrecognized format): ${filePath}`);
        break;
      }
      console.log(`  Detected ${headers.length} columns.`);
      continue;
    }

    if (!columns) continue;

    stats.total++;

    // Extract fields
    const make = (fields[columns.manufacturer] || "").trim().toUpperCase();
    const model = (fields[columns.model] || "").trim().toUpperCase();
    const engineCapacity = Math.round(parseNumber(fields[columns.engineCapacity] || ""));
    const fuelTypeRaw = (fields[columns.fuelType] || "").trim();
    const fuelType = normalizeFuelType(fuelTypeRaw);

    // Skip if essential data is missing
    if (!make || !model || !fuelType) {
      stats.skipped++;
      continue;
    }

    // Filter out pure electric / hydrogen (no meaningful MPG)
    if (!INCLUDED_FUEL_TYPES.has(fuelType.toLowerCase())) {
      // Allow through if it seems like a recognizable fuel type
      if (
        fuelType === "ELECTRICITY" ||
        fuelType === "ELECTRIC" ||
        fuelType === "HYDROGEN" ||
        fuelType === "FUEL CELL"
      ) {
        stats.skipped++;
        continue;
      }
    }

    // Parse MPG values
    let combinedMpg = parseNumber(fields[columns.combinedMpg] || "");
    let urbanMpg = parseNumber(fields[columns.urbanMpg] || "");
    let extraUrbanMpg = parseNumber(fields[columns.extraUrbanMpg] || "");

    // If values look like L/100km (typically < 20), convert to MPG
    // Imperial gallons: 282.481 / L_per_100km = MPG
    if (combinedMpg > 0 && combinedMpg < 20) {
      combinedMpg = Math.round((282.481 / combinedMpg) * 10) / 10;
    }
    if (urbanMpg > 0 && urbanMpg < 20) {
      urbanMpg = Math.round((282.481 / urbanMpg) * 10) / 10;
    }
    if (extraUrbanMpg > 0 && extraUrbanMpg < 20) {
      extraUrbanMpg = Math.round((282.481 / extraUrbanMpg) * 10) / 10;
    }

    // Skip records with no MPG data at all
    if (combinedMpg === 0 && urbanMpg === 0 && extraUrbanMpg === 0) {
      stats.skipped++;
      continue;
    }

    // Deduplication key: make + model + engineCapacity + fuelType
    const dedupeKey = `${make}|${model}|${engineCapacity}|${fuelType}`;
    if (seen.has(dedupeKey)) {
      stats.dupes++;
      continue;
    }
    seen.add(dedupeKey);

    records.push({
      make,
      model,
      engineCapacity,
      fuelType,
      combinedMpg,
      urbanMpg,
      extraUrbanMpg,
    });

    stats.added++;
  }

  return stats;
}

async function main(): Promise<void> {
  // Determine input files from command-line arguments or auto-detect
  let inputFiles: string[] = process.argv.slice(2);

  if (inputFiles.length === 0) {
    // Auto-detect: look for CarFuelData*.csv or *fuel*.csv in project root
    console.log("No input files specified. Searching for fuel data CSVs in project root...");
    const rootFiles = fs.readdirSync(PROJECT_ROOT);
    inputFiles = rootFiles
      .filter((f) => {
        const lower = f.toLowerCase();
        return (
          lower.endsWith(".csv") &&
          (lower.includes("fuel") || lower.includes("carfuel") || lower.includes("vca"))
        );
      })
      .map((f) => path.join(PROJECT_ROOT, f));

    if (inputFiles.length === 0) {
      console.error("No fuel data CSV files found in project root.");
      console.error(
        "\nDownload from: https://carfueldata.vehicle-certification-agency.gov.uk/downloads/default.aspx"
      );
      console.error("Then either:");
      console.error("  1. Save CSVs in the project root and re-run this script, or");
      console.error(
        "  2. Pass file paths as arguments: npx tsx scripts/process-fuel-data.ts path/to/file.csv"
      );
      process.exit(1);
    }
  } else {
    // Resolve relative paths against CWD
    inputFiles = inputFiles.map((f) => path.resolve(f));
  }

  console.log(`Processing ${inputFiles.length} file(s)...\n`);

  const seen = new Set<string>();
  const records: FuelRecord[] = [];
  let grandTotal = 0;
  let grandAdded = 0;
  let grandDupes = 0;
  let grandSkipped = 0;

  for (const filePath of inputFiles) {
    console.log(`Processing: ${path.basename(filePath)}`);
    const stats = await processFile(filePath, seen, records);
    grandTotal += stats.total;
    grandAdded += stats.added;
    grandDupes += stats.dupes;
    grandSkipped += stats.skipped;
    console.log(
      `  Rows: ${stats.total} | Added: ${stats.added} | Dupes: ${stats.dupes} | Skipped: ${stats.skipped}\n`
    );
  }

  // Sort by make, then model, then engine capacity
  records.sort((a, b) => {
    const makeCompare = a.make.localeCompare(b.make);
    if (makeCompare !== 0) return makeCompare;
    const modelCompare = a.model.localeCompare(b.model);
    if (modelCompare !== 0) return modelCompare;
    return a.engineCapacity - b.engineCapacity;
  });

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2) + "\n", "utf-8");

  // Summary
  console.log("--- Processing Complete ---");
  console.log(`Files processed:       ${inputFiles.length}`);
  console.log(`Total data rows:       ${grandTotal}`);
  console.log(`Records added:         ${grandAdded}`);
  console.log(`Duplicates removed:    ${grandDupes}`);
  console.log(`Skipped (no data):     ${grandSkipped}`);
  console.log(`Unique makes:          ${new Set(records.map((r) => r.make)).size}`);
  console.log(`Unique models:         ${new Set(records.map((r) => `${r.make} ${r.model}`)).size}`);
  console.log(`Output file:           ${OUTPUT_FILE}`);
}

// Run
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
