/**
 * DfT VEH0120 "How Many Left" Data Processor
 *
 * Processes the DfT VEH0120 CSV to extract licensed and SORN counts per
 * make + model. Outputs a compact JSON lookup file.
 *
 * HOW TO DOWNLOAD THE SOURCE DATA:
 * 1. Visit https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-files
 * 2. Download the VEH0120 CSV (df_VEH0120.csv)
 * 3. Save in the project root directory.
 *
 * USAGE:
 *   npx tsx scripts/process-veh0120-data.ts df_VEH0120.csv
 *   # or without arguments (auto-detects *veh0120*.csv in project root):
 *   npx tsx scripts/process-veh0120-data.ts
 *
 * CSV COLUMNS (VEH0120):
 *   - Make (manufacturer)
 *   - GenModel (generic model name)
 *   - BodyType (body type classification)
 *   - LicenceStatus (Licensed / SORN)
 *   - Year/quarter columns with counts (e.g. "2024 Q4", "2024")
 *
 * OUTPUT:
 *   src/data/how-many-left.json — compact { "MAKE|MODEL": [licensed, sorn] } lookup
 */

import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MakeModelCounts {
  licensed: number;
  sorn: number;
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

// ---------------------------------------------------------------------------
// Main Processing
// ---------------------------------------------------------------------------

async function processFile(filePath: string): Promise<Map<string, MakeModelCounts>> {
  const data = new Map<string, MakeModelCounts>();

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers: string[] | null = null;
  let makeIdx = -1;
  let modelIdx = -1;
  let licenceStatusIdx = -1;
  let countIdx = -1;
  let countColName = "";
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);

    if (!headers) {
      headers = fields.map((h) => h.toUpperCase().trim());

      // Find column indices
      makeIdx = headers.findIndex((h) => h === "MAKE" || h === "MANUFACTURER");
      modelIdx = headers.findIndex((h) =>
        h === "GENMODEL" || h === "GEN MODEL" || h === "MODEL" || h === "GENERIC MODEL"
      );
      licenceStatusIdx = headers.findIndex((h) =>
        h === "LICENCESTATUS" || h === "LICENCE STATUS" || h === "LICENCE_STATUS" ||
        h === "LICENSE STATUS" || h === "LICENSESTATUS"
      );

      if (makeIdx === -1 || modelIdx === -1) {
        console.error("Could not find required columns (Make, Model/GenModel)");
        console.error("Available headers:", headers.join(", "));
        process.exit(1);
      }

      // Find the rightmost numeric/year column for counts
      // VEH0120 has year columns like "2024 Q4", "2024", or "TOTAL"
      // We want the most recent year column (rightmost one that looks like a year/quarter)
      let bestIdx = -1;
      let bestLabel = "";

      for (let i = headers.length - 1; i >= 0; i--) {
        const h = headers[i];
        // Match year columns like "2024 Q4", "2024", or "TOTAL"/"VALUE"/"COUNT"
        if (/^\d{4}(\s+Q\d)?$/.test(h) || h === "TOTAL" || h === "COUNT" || h === "VALUE") {
          bestIdx = i;
          bestLabel = h;
          break;
        }
      }

      if (bestIdx === -1) {
        // Fallback: use the last column
        bestIdx = headers.length - 1;
        bestLabel = headers[bestIdx];
      }

      countIdx = bestIdx;
      countColName = bestLabel;

      console.log(`Found columns: Make=${headers[makeIdx]}, Model=${headers[modelIdx]}${licenceStatusIdx >= 0 ? `, LicenceStatus=${headers[licenceStatusIdx]}` : ""}, Count=${countColName} (col ${countIdx})`);
      continue;
    }

    if (fields.length <= Math.max(makeIdx, modelIdx, countIdx)) continue;

    const make = normalize(fields[makeIdx]);
    const model = normalize(fields[modelIdx]);
    const count = parseInt(fields[countIdx].replace(/,/g, ""), 10) || 0;

    if (!make || !model || count <= 0) continue;

    // Determine licence status
    const licenceStatus = licenceStatusIdx >= 0 ? fields[licenceStatusIdx].toUpperCase().trim() : "";
    const isLicensed = licenceStatus.includes("LICEN") || licenceStatus === "" || licenceStatus === "LICENSED";
    const isSorn = licenceStatus.includes("SORN");

    const key = `${make}|${model}`;
    const existing = data.get(key) || { licensed: 0, sorn: 0 };

    if (isSorn) {
      existing.sorn += count;
    } else if (isLicensed) {
      existing.licensed += count;
    } else {
      // Unknown status — count as licensed
      existing.licensed += count;
    }

    data.set(key, existing);

    if (lineNum % 100000 === 0) {
      console.log(`  Processed ${lineNum.toLocaleString()} lines...`);
    }
  }

  console.log(`  Total: ${lineNum.toLocaleString()} lines, ${data.size} unique make/model combinations`);
  return data;
}

async function main() {
  const args = process.argv.slice(2);
  let csvFiles = args;

  if (csvFiles.length === 0) {
    // Auto-detect
    const rootFiles = fs.readdirSync(process.cwd());
    csvFiles = rootFiles.filter((f) => f.toLowerCase().includes("veh0120") && f.endsWith(".csv"));
    if (csvFiles.length === 0) {
      console.error("No VEH0120 CSV files found. Pass file paths as arguments.");
      console.error("Download from: https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-files");
      process.exit(1);
    }
  }

  console.log(`Processing ${csvFiles.length} file(s): ${csvFiles.join(", ")}`);

  const allData = new Map<string, MakeModelCounts>();

  for (const file of csvFiles) {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    console.log(`\nProcessing ${path.basename(filePath)}...`);
    const fileData = await processFile(filePath);

    // Merge
    for (const [key, counts] of fileData) {
      const existing = allData.get(key) || { licensed: 0, sorn: 0 };
      existing.licensed += counts.licensed;
      existing.sorn += counts.sorn;
      allData.set(key, existing);
    }
  }

  // Build compact output: { "MAKE|MODEL": [licensed, sorn] }
  // Filter out entries with 0 total
  const output: Record<string, [number, number]> = {};
  let filtered = 0;

  for (const [key, counts] of allData) {
    const total = counts.licensed + counts.sorn;
    if (total > 0) {
      output[key] = [counts.licensed, counts.sorn];
    } else {
      filtered++;
    }
  }

  // Write output
  const outPath = path.join(process.cwd(), "src", "data", "how-many-left.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 0));

  const sizeKB = (Buffer.byteLength(JSON.stringify(output)) / 1024).toFixed(1);
  console.log(`\nOutput: ${outPath}`);
  console.log(`  ${Object.keys(output).length} entries, ${sizeKB} KB`);
  if (filtered > 0) console.log(`  ${filtered} zero-count entries filtered out`);

  // Show sample entries sorted by total (descending)
  const sorted = Object.entries(output).sort((a, b) => (b[1][0] + b[1][1]) - (a[1][0] + a[1][1]));
  console.log("\nTop 10 most common:");
  for (const [key, [licensed, sorn]] of sorted.slice(0, 10)) {
    console.log(`  ${key}: ${licensed.toLocaleString()} licensed, ${sorn.toLocaleString()} SORN (${(licensed + sorn).toLocaleString()} total)`);
  }

  console.log("\nBottom 10 (rarest):");
  for (const [key, [licensed, sorn]] of sorted.slice(-10)) {
    console.log(`  ${key}: ${licensed.toLocaleString()} licensed, ${sorn.toLocaleString()} SORN (${(licensed + sorn).toLocaleString()} total)`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
