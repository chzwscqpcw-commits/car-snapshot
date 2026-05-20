/**
 * Fetches the latest DfT VEH0120 CSV (licensed + SORN counts by make/model)
 * from the gov.uk Content API and refreshes src/data/how-many-left.json by
 * shelling out to the existing process-veh0120-data.ts script.
 *
 * Prefers the UK-wide CSV when both GB and UK files are listed.
 *
 * Data source: https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-files
 *
 * Hooked into prebuild so every deploy gets the freshest DfT data without
 * any manual download step.
 *
 * Run: npx tsx scripts/fetch-how-many-left.ts
 * Failure mode: logs warning, exits 0 (build continues with existing JSON).
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const CONTENT_API =
  "https://www.gov.uk/api/content/government/statistical-data-sets/vehicle-licensing-statistics-data-files";
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(PROJECT_ROOT, "df_VEH0120.csv");

interface Attachment {
  content_type: string;
  title: string;
  url: string;
}

async function discoverCsvUrl(): Promise<string> {
  const res = await fetch(CONTENT_API);
  if (!res.ok) throw new Error(`Content API returned ${res.status}`);
  const json = await res.json();

  const attachments: Attachment[] = [];
  function walk(obj: unknown): void {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    const o = obj as Record<string, unknown>;
    if (
      typeof o.url === "string" &&
      typeof o.title === "string" &&
      (o.content_type === "text/csv" || o.url.endsWith(".csv"))
    ) {
      attachments.push(o as unknown as Attachment);
    }
    Object.values(o).forEach(walk);
  }
  walk(json);

  const matches = attachments.filter((a) => /VEH0120/i.test(a.url) || /VEH0120/i.test(a.title));
  if (matches.length === 0) {
    throw new Error(
      `Could not find VEH0120 CSV in Content API. Available: ${attachments.map((a) => a.title).join(" | ")}`,
    );
  }
  // Prefer UK-wide over GB-only when both exist
  const uk = matches.find((a) => /VEH0120_UK/i.test(a.url) || /United Kingdom/i.test(a.title));
  return (uk ?? matches[0]).url;
}

async function downloadCsv(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV download failed: ${res.status} ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

async function main() {
  console.log("Discovering latest VEH0120 CSV URL…");
  const url = await discoverCsvUrl();
  console.log(`  ${url}`);

  console.log("Downloading CSV…");
  await downloadCsv(url, CSV_PATH);
  const sizeMb = (fs.statSync(CSV_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`  Saved ${CSV_PATH} (${sizeMb} MB)`);

  console.log("Processing CSV → src/data/how-many-left.json…");
  execSync(`npx tsx scripts/process-veh0120-data.ts "${CSV_PATH}"`, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });

  // Clean up the raw CSV — we only need the processed JSON.
  try {
    fs.unlinkSync(CSV_PATH);
  } catch {
    /* ignore */
  }

  console.log("How-many-left refreshed.");
}

main().catch((err) => {
  console.error("Failed to refresh how-many-left:", err?.message ?? err);
  console.log("Build will continue with existing src/data/how-many-left.json.");
  try {
    if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH);
  } catch {
    /* ignore */
  }
  // Exit 0 — stale data beats a broken build.
  process.exit(0);
});
