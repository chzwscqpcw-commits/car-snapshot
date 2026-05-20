/**
 * Fetches the latest DVSA recalls CSV and refreshes src/data/recalls.json.
 *
 * ⚠ NOT CURRENTLY HOOKED INTO PREBUILD.
 *
 * The DVSA Vehicle Recalls service sits behind Imperva bot protection.
 * Direct HTTP fetches (Node fetch, curl, even with a realistic User-Agent)
 * receive a 302 to a JS-challenge interstitial — the CSV never downloads.
 * Solving this would require either:
 *   - A proxy / headless browser path (Playwright/Puppeteer)
 *   - An alternate mirror of the data
 *   - Manual download → commit to git (current process)
 *
 * The existing Vercel cron at /api/cron/refresh-recalls *may* succeed where
 * local fetches fail — Vercel's egress IPs sometimes get less aggressive
 * treatment from Imperva. Leaving this script in place so it can be
 * re-enabled if the bot protection changes.
 *
 * Manual recall refresh today:
 *   1. Open https://www.check-vehicle-recalls.service.gov.uk in a browser
 *   2. Click "Download" on the Recalls File CSV
 *   3. Save as RecallsFile.csv in the project root
 *   4. Run: npx tsx scripts/process-recalls.ts
 *   5. Commit the updated src/data/recalls.json
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const DVSA_CSV_URL =
  "https://www.check-vehicle-recalls.service.gov.uk/documents/RecallsFile.csv";
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(PROJECT_ROOT, "RecallsFile.csv");

async function downloadCsv(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`CSV download failed: ${res.status} ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

async function main() {
  console.log("Downloading DVSA recalls CSV…");
  console.log(`  ${DVSA_CSV_URL}`);
  await downloadCsv(DVSA_CSV_URL, CSV_PATH);
  const sizeMb = (fs.statSync(CSV_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`  Saved ${CSV_PATH} (${sizeMb} MB)`);

  console.log("Processing CSV → src/data/recalls.json…");
  execSync("npx tsx scripts/process-recalls.ts", {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });

  // Clean up the raw CSV — we only need the processed JSON.
  try {
    fs.unlinkSync(CSV_PATH);
  } catch {
    /* ignore */
  }

  console.log("Recalls refreshed.");
}

main().catch((err) => {
  console.error("Failed to refresh recalls:", err?.message ?? err);
  console.log("Build will continue with existing src/data/recalls.json.");
  try {
    if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH);
  } catch {
    /* ignore */
  }
  // Exit 0 — stale data beats a broken build.
  process.exit(0);
});
