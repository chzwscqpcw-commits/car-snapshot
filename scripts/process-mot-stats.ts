#!/usr/bin/env npx tsx
/**
 * Process DVSA MOT test result data into aggregated pass rates by make/model.
 *
 * Input:  DVSA anonymised MOT bulk data CSV (from data.gov.uk)
 *         Expected columns: test_id,vehicle_id,test_date,test_class_id,test_type,
 *                           test_result,test_mileage,postcode_area,make,model,
 *                           colour,fuel_type,cylinder_capacity,first_use_date
 *
 * Output: src/data/mot-pass-rates.json
 *         Format: { "MAKE|MODEL": [testCount, passRate] }
 *         Only includes make/model combinations with >= 100 tests.
 *
 * Usage:
 *   npx tsx scripts/process-mot-stats.ts path/to/dft_test_result_YYYY.csv
 *
 * Download data from: https://data.gov.uk/dataset/e3939ef8-30c7-4ca8-9c7c-ad9475cc9b2f
 */

import { createReadStream } from "fs";
import { writeFileSync } from "fs";
import { createInterface } from "readline";
import path from "path";

const MIN_TESTS = 100;

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/process-mot-stats.ts <path-to-csv>");
    console.error("Download data from: https://data.gov.uk/dataset/e3939ef8-30c7-4ca8-9c7c-ad9475cc9b2f");
    process.exit(1);
  }

  console.log(`Processing: ${csvPath}`);

  type Stats = { total: number; passed: number };
  const stats = new Map<string, Stats>();

  const rl = createInterface({
    input: createReadStream(csvPath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let headerParsed = false;
  let colMake = -1;
  let colModel = -1;
  let colResult = -1;
  let rowCount = 0;

  for await (const line of rl) {
    if (!headerParsed) {
      const cols = line.toLowerCase().split(",").map(c => c.trim().replace(/"/g, ""));
      colMake = cols.indexOf("make");
      colModel = cols.indexOf("model");
      colResult = cols.indexOf("test_result");
      if (colMake < 0 || colModel < 0 || colResult < 0) {
        // Try alternative column names
        if (colResult < 0) colResult = cols.indexOf("testresult");
        if (colMake < 0 || colModel < 0 || colResult < 0) {
          console.error("Could not find required columns: make, model, test_result");
          console.error("Found columns:", cols.join(", "));
          process.exit(1);
        }
      }
      headerParsed = true;
      continue;
    }

    const fields = line.split(",").map(f => f.trim().replace(/"/g, ""));
    const make = (fields[colMake] ?? "").toUpperCase().trim();
    const model = (fields[colModel] ?? "").toUpperCase().trim();
    const result = (fields[colResult] ?? "").toUpperCase().trim();

    if (!make || !model || !result) continue;

    // Only count P (pass) and F (fail) results
    const isPassed = result === "P" || result === "PASSED" || result === "PRS";
    const isFailed = result === "F" || result === "FAILED" || result === "FRS";
    if (!isPassed && !isFailed) continue;

    const key = `${make}|${model}`;
    const existing = stats.get(key) ?? { total: 0, passed: 0 };
    existing.total++;
    if (isPassed) existing.passed++;
    stats.set(key, existing);

    rowCount++;
    if (rowCount % 1_000_000 === 0) {
      console.log(`  Processed ${(rowCount / 1_000_000).toFixed(0)}M rows...`);
    }
  }

  console.log(`Total rows processed: ${rowCount.toLocaleString()}`);
  console.log(`Unique make/model combos: ${stats.size.toLocaleString()}`);

  // Filter to MIN_TESTS and build output
  const output: Record<string, [number, number]> = {};
  let included = 0;

  for (const [key, { total, passed }] of stats) {
    if (total < MIN_TESTS) continue;
    const passRate = Math.round((passed / total) * 1000) / 10; // one decimal place
    output[key] = [total, passRate];
    included++;
  }

  console.log(`Entries with >= ${MIN_TESTS} tests: ${included}`);

  const outPath = path.join(__dirname, "..", "src", "data", "mot-pass-rates.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
  console.log(`Written to: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
