/**
 * Fetches the latest DfT VEH0220 CSV and (would) refresh src/data/body-types.json.
 *
 * ⚠ NOT CURRENTLY HOOKED INTO PREBUILD.
 *
 * As of 2026-05, the DfT VEH0220 CSV no longer publishes body *shapes*
 * (Hatchback / Saloon / SUV / Estate / etc.) — the BodyType column now only
 * contains the vehicle CATEGORY ("Cars"). Auto-refreshing from this source
 * would clobber the curated 549-entry body-types.json with garbage that
 * classifies every model as "Cars".
 *
 * This script is left in place with a strict schema guard so:
 *   - If/when DfT restore body-shape data, we can re-enable it in prebuild
 *   - It bails immediately if the schema check fails, leaving the file intact
 *
 * Data source: https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-files
 *
 * Run: npx tsx scripts/fetch-body-types.ts
 * Failure mode: logs warning, exits 0, leaves JSON untouched.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const CONTENT_API =
  "https://www.gov.uk/api/content/government/statistical-data-sets/vehicle-licensing-statistics-data-files";
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(PROJECT_ROOT, "df_VEH0220.csv");
const TARGET_JSON = path.join(PROJECT_ROOT, "src", "data", "body-types.json");

// Body shapes we expect to see in a healthy CSV. If NONE of these appear in
// the first 500 rows of the BodyType column, the schema has changed and we
// bail out rather than overwrite curated data.
const EXPECTED_SHAPES = [
  "HATCHBACK",
  "SALOON",
  "ESTATE",
  "COUPE",
  "CONVERTIBLE",
  "SUV",
  "MPV",
];

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

  const match = attachments.find((a) => /VEH0220/i.test(a.url) || /VEH0220/i.test(a.title));
  if (!match) {
    throw new Error(
      `Could not find VEH0220 CSV in Content API. Available: ${attachments.map((a) => a.title).join(" | ")}`,
    );
  }
  return match.url;
}

async function downloadCsv(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV download failed: ${res.status} ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

function schemaHasBodyShapes(csvPath: string): boolean {
  // Read first ~500 rows, find BodyType column, check distinct values.
  const buf = fs.readFileSync(csvPath, "utf8");
  const lines = buf.split(/\r?\n/, 502);
  if (lines.length < 2) return false;

  const headers = lines[0].split(",").map((h) => h.toUpperCase().trim());
  const bodyIdx = headers.findIndex(
    (h) => h === "BODYTYPE" || h === "BODY TYPE" || h === "BODY_TYPE",
  );
  if (bodyIdx === -1) return false;

  const seen = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length > bodyIdx) seen.add(cols[bodyIdx].trim().toUpperCase());
  }
  return EXPECTED_SHAPES.some((s) => seen.has(s));
}

async function main() {
  console.log("Discovering latest VEH0220 CSV URL…");
  const url = await discoverCsvUrl();
  console.log(`  ${url}`);

  console.log("Downloading CSV…");
  await downloadCsv(url, CSV_PATH);
  const sizeMb = (fs.statSync(CSV_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`  Saved ${CSV_PATH} (${sizeMb} MB)`);

  if (!schemaHasBodyShapes(CSV_PATH)) {
    console.warn(
      `\n⚠ VEH0220 CSV no longer contains body-shape data (Hatchback / Saloon / SUV / …).`,
    );
    console.warn(`  BodyType column appears to only carry the "Cars" category.`);
    console.warn(
      `  Skipping refresh — leaving ${path.relative(PROJECT_ROOT, TARGET_JSON)} untouched.`,
    );
    fs.unlinkSync(CSV_PATH);
    return;
  }

  console.log("Schema check passed. Processing CSV → src/data/body-types.json…");
  execSync(`npx tsx scripts/process-dft-data.ts "${CSV_PATH}"`, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });

  try {
    fs.unlinkSync(CSV_PATH);
  } catch {
    /* ignore */
  }

  console.log("Body types refreshed.");
}

main().catch((err) => {
  console.error("Failed to refresh body types:", err?.message ?? err);
  console.log("Build will continue with existing src/data/body-types.json.");
  try {
    if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH);
  } catch {
    /* ignore */
  }
  process.exit(0);
});
