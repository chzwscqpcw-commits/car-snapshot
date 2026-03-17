/**
 * Manual Fuel Price Data Updater
 *
 * This script helps you update the fuel price data in the Free Plate Check app.
 * Since DESNZ weekly road fuel prices don't have a stable machine-readable API,
 * this script provides a semi-automated workflow:
 *
 * HOW TO GET LATEST DATA:
 * 1. Visit https://www.gov.uk/government/statistics/weekly-road-fuel-prices
 * 2. Download the latest CSV/ODS file from the page
 * 3. Find the latest annual average prices (or calculate from weekly data)
 * 4. Run this script with the new year's data:
 *
 *    npx tsx scripts/update-fuel-prices.ts --year 2026 --petrol 137.5 --diesel 144.8
 *
 * WHAT IT DOES:
 * - Reads src/lib/stats-data/fuel-prices.ts
 * - Adds or updates the specified year's data point
 * - Updates the lastUpdated date
 * - Writes the file back
 *
 * ALTERNATIVE: For mid-year updates, you can calculate the YTD average from
 * the DESNZ weekly CSV. Each row has columns for ULSP (petrol) and ULSD (diesel)
 * prices in pence per litre.
 */

import * as fs from "fs";
import * as path from "path";

const FILE_PATH = path.resolve(
  __dirname,
  "..",
  "src",
  "lib",
  "stats-data",
  "fuel-prices.ts"
);

function parseArgs(): { year: number; petrol: number; diesel: number } {
  const args = process.argv.slice(2);
  let year = 0;
  let petrol = 0;
  let diesel = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--year" && args[i + 1]) {
      year = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--petrol" && args[i + 1]) {
      petrol = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === "--diesel" && args[i + 1]) {
      diesel = parseFloat(args[i + 1]);
      i++;
    }
  }

  if (!year || !petrol || !diesel) {
    console.error("Usage: npx tsx scripts/update-fuel-prices.ts --year 2026 --petrol 137.5 --diesel 144.8");
    console.error("");
    console.error("Options:");
    console.error("  --year    Year to add/update (e.g. 2026)");
    console.error("  --petrol  Average petrol price in pence per litre (e.g. 137.5)");
    console.error("  --diesel  Average diesel price in pence per litre (e.g. 144.8)");
    console.error("");
    console.error("Data source: https://www.gov.uk/government/statistics/weekly-road-fuel-prices");
    process.exit(1);
  }

  return { year, petrol, diesel };
}

function main() {
  const { year, petrol, diesel } = parseArgs();

  if (!fs.existsSync(FILE_PATH)) {
    console.error(`File not found: ${FILE_PATH}`);
    process.exit(1);
  }

  let content = fs.readFileSync(FILE_PATH, "utf-8");

  // Check if the year already exists
  const yearRegex = new RegExp(
    `\\{\\s*year:\\s*${year}\\s*,\\s*petrol:\\s*[\\d.]+\\s*,\\s*diesel:\\s*[\\d.]+(\\s*)\\}`
  );

  if (yearRegex.test(content)) {
    // Update existing year
    content = content.replace(
      yearRegex,
      `{ year: ${year}, petrol: ${petrol}, diesel: ${diesel} }`
    );
    console.log(`Updated existing entry for ${year}.`);
  } else {
    // Add new year before the closing ];
    // Find the last data entry line and add after it
    const lastEntryRegex =
      /(  \{ year: \d{4}, petrol: [\d.]+, diesel: [\d.]+ \},?\n)(];)/;
    const match = content.match(lastEntryRegex);

    if (match) {
      const lastEntry = match[1].trimEnd();
      // Ensure the previous last entry has a trailing comma
      const fixedLast = lastEntry.endsWith(",")
        ? lastEntry
        : lastEntry + ",";
      content = content.replace(
        lastEntryRegex,
        `${fixedLast}\n  { year: ${year}, petrol: ${petrol}, diesel: ${diesel} },\n$2`
      );
      console.log(`Added new entry for ${year}.`);
    } else {
      console.error("Could not find the data array in the file. Manual edit required.");
      process.exit(1);
    }
  }

  // Update lastUpdated
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const now = new Date();
  const monthName = months[now.getMonth()];
  const currentYear = now.getFullYear();

  content = content.replace(
    /export const lastUpdated = ".*?";/,
    `export const lastUpdated = "${monthName} ${currentYear}";`
  );

  fs.writeFileSync(FILE_PATH, content, "utf-8");
  console.log(`Updated lastUpdated to "${monthName} ${currentYear}".`);
  console.log(`File written: ${FILE_PATH}`);
  console.log("");
  console.log("Done. Remember to commit the changes.");
}

main();
