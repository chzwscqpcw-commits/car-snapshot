/**
 * DVSA Vehicle Recalls Data Processor
 *
 * This script processes the DVSA (Driver and Vehicle Standards Agency) vehicle
 * recalls CSV file and outputs a filtered, normalized JSON file for use in the
 * Free Plate Check application.
 *
 * HOW TO DOWNLOAD THE SOURCE DATA:
 * 1. Visit https://www.check-vehicle-recalls.service.gov.uk/documents/RecallsFile.csv
 *    This is the official DVSA recalls database, updated regularly.
 * 2. Save the file as RecallsFile.csv in the project root directory.
 * 3. The CSV contains all vehicle recalls reported in the UK, including cars,
 *    motorcycles, commercial vehicles, and other vehicle types.
 *
 * USAGE:
 *   npx tsx scripts/process-recalls.ts
 *   # or
 *   npx ts-node scripts/process-recalls.ts
 *
 * The script will read RecallsFile.csv from the project root and output
 * processed data to src/data/recalls.json.
 *
 * CSV COLUMNS (as per DVSA format):
 *   - Manufacturer: Vehicle manufacturer name
 *   - Model: Affected model(s), may contain multiple models separated by commas or slashes
 *   - Build Start: Start of affected build date range (DD/MM/YYYY or similar)
 *   - Build End: End of affected build date range (DD/MM/YYYY or similar)
 *   - Recall Date: Date the recall was issued (DD/MM/YYYY or similar)
 *   - Defect: Description of the safety defect
 *   - Remedy: Description of the corrective action
 *   - Recall Number: Unique DVSA recall reference (e.g. R/2023/123)
 *   - Vehicle Type: Type of vehicle (e.g. "Car", "Motorcycle", "LCV", "HGV")
 *   - ... other columns may exist but are not used
 *
 * NOTES:
 * - Only car and light vehicle recalls are included in the output (filters by Vehicle Type).
 * - Make names are normalized to uppercase for consistent matching.
 * - Model fields are split into arrays to handle multi-model recalls.
 * - Uses only Node.js built-in modules (fs, readline, path) -- no external dependencies.
 */

import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecallRecord {
  make: string;
  models: string[];
  buildDateStart: string;
  buildDateEnd: string;
  recallDate: string;
  defect: string;
  remedy: string;
  recallNumber: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, "..");
const INPUT_FILE = path.join(PROJECT_ROOT, "RecallsFile.csv");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "src", "data", "recalls.json");

// Vehicle types to include (case-insensitive matching)
const INCLUDED_VEHICLE_TYPES = new Set([
  "car",
  "cars",
  "light vehicle",
  "light vehicles",
  "lcv",
  "passenger vehicle",
  "passenger car",
  "m1", // EU vehicle category for passenger cars
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
        // Escaped quote inside a quoted field
        current += '"';
        i++; // skip the second quote
      } else if (char === '"') {
        // End of quoted field
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

  // Push the last field
  fields.push(current.trim());
  return fields;
}

/**
 * Attempt to parse a date string in various common formats and return an
 * ISO-style date string (YYYY-MM-DD). Returns an empty string if parsing fails.
 *
 * Supported input formats:
 *   DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD.MM.YYYY, MM/YYYY, YYYY
 */
function parseDate(raw: string): string {
  if (!raw || raw.trim() === "") return "";

  const s = raw.trim();

  // Already ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // MM/YYYY (no day)
  const myMatch = s.match(/^(\d{1,2})[/\-.](\d{4})$/);
  if (myMatch) {
    const month = myMatch[1].padStart(2, "0");
    const year = myMatch[2];
    return `${year}-${month}-01`;
  }

  // Just a year: YYYY
  if (/^\d{4}$/.test(s)) {
    return `${s}-01-01`;
  }

  // Fallback: try Date constructor
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return "";
}

/**
 * Split a model string into an array of individual model names.
 * Models may be separated by commas, slashes, " and ", " & ", or semicolons.
 * Each model name is trimmed and converted to uppercase.
 */
function parseModels(raw: string): string[] {
  if (!raw || raw.trim() === "") return [];

  return raw
    .split(/[,;/]|\band\b|\b&\b/i)
    .map((m) => m.trim().toUpperCase())
    .filter((m) => m.length > 0);
}

// ---------------------------------------------------------------------------
// Column Index Detection
// ---------------------------------------------------------------------------

/**
 * Try to detect column indices from the header row.
 * We look for known column name patterns (case-insensitive).
 */
function detectColumns(headers: string[]): {
  manufacturer: number;
  model: number;
  buildStart: number;
  buildEnd: number;
  recallDate: number;
  defect: number;
  remedy: number;
  recallNumber: number;
  vehicleType: number;
} {
  const lower = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  function findIndex(patterns: string[]): number {
    for (const pattern of patterns) {
      const idx = lower.findIndex((h) => h.includes(pattern));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const result = {
    manufacturer: findIndex(["manufacturer", "make"]),
    model: findIndex(["model", "modelrange"]),
    buildStart: findIndex(["buildstart", "buildfrom", "startdate", "buildrangestart", "datefrom"]),
    buildEnd: findIndex(["buildend", "buildto", "enddate", "buildrangeend", "dateto"]),
    recallDate: findIndex(["recalldate", "launchdate", "dateofrecall", "daterecall"]),
    defect: findIndex(["defect", "concern", "defectdescription", "faultdescription"]),
    remedy: findIndex(["remedy", "remedyaction", "correctiveaction", "remedydescription"]),
    recallNumber: findIndex(["recallnumber", "recallref", "recallno", "dvsarecall", "recallreference"]),
    vehicleType: findIndex(["vehicletype", "type", "vehiclecategory", "category"]),
  };

  // Validate that we found the essential columns
  const missing: string[] = [];
  if (result.manufacturer === -1) missing.push("Manufacturer");
  if (result.model === -1) missing.push("Model");
  if (result.recallNumber === -1) missing.push("Recall Number");
  if (result.defect === -1) missing.push("Defect");

  if (missing.length > 0) {
    console.error("Could not detect required columns:", missing.join(", "));
    console.error("Headers found:", headers.join(" | "));
    console.error(
      "\nPlease check that the CSV file is in the expected DVSA RecallsFile.csv format."
    );
    process.exit(1);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main Processing
// ---------------------------------------------------------------------------

async function processRecalls(): Promise<void> {
  // Check input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Input file not found: ${INPUT_FILE}`);
    console.error(
      "\nDownload it from: https://www.check-vehicle-recalls.service.gov.uk/documents/RecallsFile.csv"
    );
    console.error("Save it as RecallsFile.csv in the project root directory.");
    process.exit(1);
  }

  console.log(`Reading recalls from: ${INPUT_FILE}`);

  const fileStream = fs.createReadStream(INPUT_FILE, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers: string[] | null = null;
  let columns: ReturnType<typeof detectColumns> | null = null;
  const records: RecallRecord[] = [];
  let totalRows = 0;
  let filteredOut = 0;
  let skippedIncomplete = 0;

  for await (const line of rl) {
    // Skip empty lines
    if (line.trim() === "") continue;

    const fields = parseCSVLine(line);

    // First non-empty line is treated as the header
    if (!headers) {
      headers = fields;
      columns = detectColumns(headers);
      console.log(`Detected ${headers.length} columns in header row.`);
      if (columns.vehicleType === -1) {
        console.log(
          "Note: No 'Vehicle Type' column found. All records will be included (no type filtering)."
        );
      }
      continue;
    }

    totalRows++;

    if (!columns) continue; // TypeScript guard

    // Filter by vehicle type if the column exists
    if (columns.vehicleType !== -1) {
      const vehicleType = (fields[columns.vehicleType] || "").toLowerCase().trim();
      if (vehicleType && !INCLUDED_VEHICLE_TYPES.has(vehicleType)) {
        filteredOut++;
        continue;
      }
    }

    // Extract fields
    const make = (fields[columns.manufacturer] || "").trim().toUpperCase();
    const modelRaw = fields[columns.model] || "";
    const models = parseModels(modelRaw);
    const buildDateStart = parseDate(fields[columns.buildStart] || "");
    const buildDateEnd = parseDate(fields[columns.buildEnd] || "");
    const recallDate = parseDate(fields[columns.recallDate] || "");
    const defect = (fields[columns.defect] || "").trim();
    const remedy = columns.remedy !== -1 ? (fields[columns.remedy] || "").trim() : "";
    const recallNumber = (fields[columns.recallNumber] || "").trim();

    // Skip records with missing essential data
    if (!make || models.length === 0 || !recallNumber || !defect) {
      skippedIncomplete++;
      continue;
    }

    records.push({
      make,
      models,
      buildDateStart,
      buildDateEnd,
      recallDate,
      defect,
      remedy,
      recallNumber,
    });
  }

  // Sort by recall date descending (most recent first), then by make
  records.sort((a, b) => {
    const dateCompare = b.recallDate.localeCompare(a.recallDate);
    if (dateCompare !== 0) return dateCompare;
    return a.make.localeCompare(b.make);
  });

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2) + "\n", "utf-8");

  // Summary
  console.log("\n--- Processing Complete ---");
  console.log(`Total data rows:       ${totalRows}`);
  console.log(`Filtered out (type):   ${filteredOut}`);
  console.log(`Skipped (incomplete):  ${skippedIncomplete}`);
  console.log(`Records written:       ${records.length}`);
  console.log(`Unique makes:          ${new Set(records.map((r) => r.make)).size}`);
  console.log(`Output file:           ${OUTPUT_FILE}`);
}

// Run
processRecalls().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
