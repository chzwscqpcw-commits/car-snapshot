/**
 * DfT VEH0220 Body Type Data Processor
 *
 * Processes the DfT VEH0220 CSV to extract the most common body type for each
 * make + model combination. Outputs a compact JSON lookup file.
 *
 * HOW TO DOWNLOAD THE SOURCE DATA:
 * 1. Visit https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-files
 * 2. Download the VEH0220 CSV (df_VEH0220.csv, ~38.5 MB)
 *    Direct URL: https://assets.publishing.service.gov.uk/media/68ed09a42adc28a81b4acfec/df_VEH0220.csv
 * 3. Save in the project root directory.
 *
 * USAGE:
 *   npx tsx scripts/process-dft-data.ts df_VEH0220.csv
 *   # or without arguments (auto-detects df_VEH0220.csv in project root):
 *   npx tsx scripts/process-dft-data.ts
 *
 * CSV COLUMNS (VEH0220):
 *   The CSV has various columns. We need:
 *   - Make (manufacturer)
 *   - GenModel (generic model name)
 *   - BodyType (body type classification)
 *   - Total or a count column (number of vehicles)
 *
 * OUTPUT:
 *   src/data/body-types.json — compact { "MAKE|MODEL": "BodyType" } lookup
 */

import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BodyTypeCount {
  [bodyType: string]: number;
}

interface MakeModelMap {
  [makeModel: string]: BodyTypeCount;
}

// ---------------------------------------------------------------------------
// CSV Parsing
// ---------------------------------------------------------------------------

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function normalize(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

// Map DfT body type labels to user-friendly display names
function normalizeBodyType(bt: string): string | null {
  const norm = bt.toUpperCase().trim();
  const mapping: Record<string, string> = {
    "SALOON": "Saloon",
    "HATCHBACK": "Hatchback",
    "ESTATE": "Estate",
    "COUPE": "Coupe",
    "CONVERTIBLE": "Convertible",
    "MPV": "MPV",
    "SUV": "SUV",
    "4X4": "SUV",
    "PICKUP": "Pickup",
    "VAN": "Van",
    "MINIBUS": "Minibus",
    "LIMOUSINE": "Limousine",
    "CABRIOLET": "Convertible",
    "SPORTS": "Coupe",
    "TOURER": "Estate",
  };

  // Check for exact match first
  if (mapping[norm]) return mapping[norm];

  // Check for partial matches
  for (const [key, val] of Object.entries(mapping)) {
    if (norm.includes(key)) return val;
  }

  // Skip non-car body types
  if (norm.includes("MOTORCYCLE") || norm.includes("TRICYCLE") ||
      norm.includes("BUS") || norm.includes("TRUCK") || norm.includes("HGV") ||
      norm.includes("NOT RECORDED") || norm.includes("OTHER") || norm === "") {
    return null;
  }

  // Return as title case if it looks like a valid body type
  if (norm.length > 2 && norm.length < 30) {
    return norm.charAt(0) + norm.slice(1).toLowerCase();
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main Processing
// ---------------------------------------------------------------------------

async function processFile(filePath: string): Promise<MakeModelMap> {
  const data: MakeModelMap = {};

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers: string[] | null = null;
  let makeIdx = -1;
  let modelIdx = -1;
  let bodyTypeIdx = -1;
  let countIdx = -1;
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);

    if (!headers) {
      headers = fields.map((h) => h.toUpperCase().trim());

      // Find column indices — VEH0220 column names may vary
      makeIdx = headers.findIndex((h) => h === "MAKE" || h === "MANUFACTURER");
      modelIdx = headers.findIndex((h) => h === "GENMODEL" || h === "GEN MODEL" || h === "MODEL" || h === "GENERIC MODEL");
      bodyTypeIdx = headers.findIndex((h) => h === "BODYTYPE" || h === "BODY TYPE" || h === "BODY_TYPE");
      countIdx = headers.findIndex((h) => h === "TOTAL" || h === "COUNT" || h === "VALUE");

      if (makeIdx === -1 || modelIdx === -1 || bodyTypeIdx === -1) {
        console.error("Could not find required columns (Make, Model/GenModel, BodyType)");
        console.error("Available headers:", headers.join(", "));
        process.exit(1);
      }

      console.log(`Found columns: Make=${headers[makeIdx]}, Model=${headers[modelIdx]}, BodyType=${headers[bodyTypeIdx]}${countIdx >= 0 ? `, Count=${headers[countIdx]}` : ""}`);
      continue;
    }

    if (fields.length <= Math.max(makeIdx, modelIdx, bodyTypeIdx)) continue;

    const make = normalize(fields[makeIdx]);
    const model = normalize(fields[modelIdx]);
    const rawBodyType = fields[bodyTypeIdx].trim();
    const bodyType = normalizeBodyType(rawBodyType);
    const count = countIdx >= 0 ? parseInt(fields[countIdx].replace(/,/g, ""), 10) || 1 : 1;

    if (!make || !model || !bodyType) continue;

    const key = `${make}|${model}`;
    if (!data[key]) data[key] = {};
    data[key][bodyType] = (data[key][bodyType] || 0) + count;

    if (lineNum % 100000 === 0) {
      console.log(`  Processed ${lineNum.toLocaleString()} lines...`);
    }
  }

  console.log(`  Total: ${lineNum.toLocaleString()} lines, ${Object.keys(data).length} unique make/model combinations`);
  return data;
}

async function main() {
  const args = process.argv.slice(2);
  let csvFiles = args;

  if (csvFiles.length === 0) {
    // Auto-detect
    const rootFiles = fs.readdirSync(process.cwd());
    csvFiles = rootFiles.filter((f) => f.toLowerCase().includes("veh0220") && f.endsWith(".csv"));
    if (csvFiles.length === 0) {
      console.error("No VEH0220 CSV files found. Pass file paths as arguments.");
      process.exit(1);
    }
  }

  console.log(`Processing ${csvFiles.length} file(s): ${csvFiles.join(", ")}`);

  let allData: MakeModelMap = {};

  for (const file of csvFiles) {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    console.log(`\nProcessing ${path.basename(filePath)}...`);
    const fileData = await processFile(filePath);

    // Merge
    for (const [key, counts] of Object.entries(fileData)) {
      if (!allData[key]) allData[key] = {};
      for (const [bt, count] of Object.entries(counts)) {
        allData[key][bt] = (allData[key][bt] || 0) + count;
      }
    }
  }

  // Build output: for each make/model, take the most common body type
  const output: Record<string, string> = {};
  for (const [key, counts] of Object.entries(allData)) {
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      output[key] = sorted[0][0];
    }
  }

  // Write output
  const outPath = path.join(process.cwd(), "src", "data", "body-types.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 0));

  const sizeKB = (Buffer.byteLength(JSON.stringify(output)) / 1024).toFixed(1);
  console.log(`\nOutput: ${outPath}`);
  console.log(`  ${Object.keys(output).length} entries, ${sizeKB} KB`);

  // Show sample entries
  const sample = Object.entries(output).slice(0, 10);
  console.log("\nSample entries:");
  for (const [key, bt] of sample) {
    console.log(`  ${key} → ${bt}`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
