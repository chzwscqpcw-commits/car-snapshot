#!/usr/bin/env npx tsx
/**
 * Data refresh orchestrator
 *
 * Downloads source data, runs processing scripts, validates output.
 *
 * Usage:
 *   npx tsx scripts/refresh-data.ts --recalls                   # auto-refresh DVSA recalls
 *   npx tsx scripts/refresh-data.ts --how-many-left <url>       # refresh VEH0120 from URL
 *   npx tsx scripts/refresh-data.ts --body-types <url>          # refresh VEH0220 from URL
 *   npx tsx scripts/refresh-data.ts --all                       # all automatable sources
 *   npx tsx scripts/refresh-data.ts --json                      # machine-readable output
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { execSync } from "child_process";
import {
  validateRecalls,
  validateHowManyLeft,
  validateBodyTypes,
} from "./lib/validators";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "src/data");

const DVSA_RECALLS_URL =
  "https://www.check-vehicle-recalls.service.gov.uk/documents/RecallsFile.csv";

interface RefreshResult {
  source: string;
  status: "success" | "failed" | "skipped";
  message: string;
  entriesBefore?: number;
  entriesAfter?: number;
}

const results: RefreshResult[] = [];
const jsonMode = process.argv.includes("--json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  if (!jsonMode) console.log(`  ${msg}`);
}

function download(url: string, destPath: string, retries = 3): Promise<void> {
  return new Promise((resolve, reject) => {
    const attempt = (n: number) => {
      const protocol = url.startsWith("https") ? https : http;
      const req = protocol.get(url, { timeout: 60000 }, (res) => {
        // Follow redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          log(`  Following redirect to ${res.headers.location}`);
          download(res.headers.location, destPath, n)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          const err = new Error(`HTTP ${res.statusCode} from ${url}`);
          res.resume();
          if (n > 1) {
            const delay = (retries - n + 1) * 2000;
            log(`  Retry in ${delay / 1000}s...`);
            setTimeout(() => attempt(n - 1), delay);
          } else {
            reject(err);
          }
          return;
        }

        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
        file.on("error", reject);
      });

      req.on("error", (err) => {
        if (n > 1) {
          const delay = (retries - n + 1) * 2000;
          log(`  Error: ${err.message}. Retry in ${delay / 1000}s...`);
          setTimeout(() => attempt(n - 1), delay);
        } else {
          reject(err);
        }
      });

      req.on("timeout", () => {
        req.destroy();
        if (n > 1) {
          const delay = (retries - n + 1) * 2000;
          log(`  Timeout. Retry in ${delay / 1000}s...`);
          setTimeout(() => attempt(n - 1), delay);
        } else {
          reject(new Error(`Timeout downloading ${url}`));
        }
      });
    };

    attempt(retries);
  });
}

function countEntries(filePath: string): number {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return Array.isArray(data) ? data.length : Object.keys(data).length;
  } catch {
    return 0;
  }
}

function backupFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const bakPath = filePath + ".bak";
  fs.copyFileSync(filePath, bakPath);
  return bakPath;
}

function restoreBackup(bakPath: string, originalPath: string) {
  if (bakPath && fs.existsSync(bakPath)) {
    fs.copyFileSync(bakPath, originalPath);
    fs.unlinkSync(bakPath);
  }
}

function cleanupBackup(bakPath: string | null) {
  if (bakPath && fs.existsSync(bakPath)) {
    fs.unlinkSync(bakPath);
  }
}

// ---------------------------------------------------------------------------
// Refresh functions
// ---------------------------------------------------------------------------

async function refreshRecalls(): Promise<RefreshResult> {
  const outputFile = path.join(DATA_DIR, "recalls.json");
  const csvPath = path.join(PROJECT_ROOT, "RecallsFile.csv");
  const entriesBefore = countEntries(outputFile);
  const bakPath = backupFile(outputFile);

  log("Downloading DVSA recalls CSV...");
  try {
    await download(DVSA_RECALLS_URL, csvPath);
  } catch (err) {
    return {
      source: "recalls",
      status: "failed",
      message: `Download failed: ${(err as Error).message}`,
    };
  }

  const stat = fs.statSync(csvPath);
  log(`  Downloaded ${(stat.size / 1024 / 1024).toFixed(1)} MB`);

  log("Processing recalls data...");
  try {
    execSync("npx tsx scripts/process-recalls.ts", {
      cwd: PROJECT_ROOT,
      stdio: jsonMode ? "pipe" : "inherit",
      timeout: 120000,
    });
  } catch (err) {
    restoreBackup(bakPath!, outputFile);
    // Clean up downloaded CSV
    if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
    return {
      source: "recalls",
      status: "failed",
      message: `Processing failed: ${(err as Error).message}`,
    };
  }

  // Clean up downloaded CSV
  if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);

  log("Validating output...");
  const validation = validateRecalls();
  if (validation.status === "fail") {
    restoreBackup(bakPath!, outputFile);
    return {
      source: "recalls",
      status: "failed",
      message: `Validation failed after refresh: ${validation.errors.join("; ")}`,
      entriesBefore,
    };
  }

  const entriesAfter = countEntries(outputFile);
  cleanupBackup(bakPath);
  return {
    source: "recalls",
    status: "success",
    message: `Refreshed: ${entriesBefore.toLocaleString()} → ${entriesAfter.toLocaleString()} entries`,
    entriesBefore,
    entriesAfter,
  };
}

async function refreshHowManyLeft(url: string): Promise<RefreshResult> {
  const outputFile = path.join(DATA_DIR, "how-many-left.json");
  const csvPath = path.join(PROJECT_ROOT, "df_VEH0120.csv");
  const entriesBefore = countEntries(outputFile);
  const bakPath = backupFile(outputFile);

  log("Downloading VEH0120 CSV...");
  try {
    await download(url, csvPath);
  } catch (err) {
    return {
      source: "how-many-left",
      status: "failed",
      message: `Download failed: ${(err as Error).message}`,
    };
  }

  log("Processing VEH0120 data...");
  try {
    execSync(`npx tsx scripts/process-veh0120-data.ts "${csvPath}"`, {
      cwd: PROJECT_ROOT,
      stdio: jsonMode ? "pipe" : "inherit",
      timeout: 120000,
    });
  } catch (err) {
    restoreBackup(bakPath!, outputFile);
    if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
    return {
      source: "how-many-left",
      status: "failed",
      message: `Processing failed: ${(err as Error).message}`,
    };
  }

  if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);

  log("Validating output...");
  const validation = validateHowManyLeft();
  if (validation.status === "fail") {
    restoreBackup(bakPath!, outputFile);
    return {
      source: "how-many-left",
      status: "failed",
      message: `Validation failed: ${validation.errors.join("; ")}`,
      entriesBefore,
    };
  }

  const entriesAfter = countEntries(outputFile);
  cleanupBackup(bakPath);
  return {
    source: "how-many-left",
    status: "success",
    message: `Refreshed: ${entriesBefore.toLocaleString()} → ${entriesAfter.toLocaleString()} entries`,
    entriesBefore,
    entriesAfter,
  };
}

async function refreshBodyTypes(url: string): Promise<RefreshResult> {
  const outputFile = path.join(DATA_DIR, "body-types.json");
  const csvPath = path.join(PROJECT_ROOT, "df_VEH0220.csv");
  const entriesBefore = countEntries(outputFile);
  const bakPath = backupFile(outputFile);

  log("Downloading VEH0220 CSV...");
  try {
    await download(url, csvPath);
  } catch (err) {
    return {
      source: "body-types",
      status: "failed",
      message: `Download failed: ${(err as Error).message}`,
    };
  }

  log("Processing VEH0220 data...");
  try {
    execSync(`npx tsx scripts/process-dft-data.ts "${csvPath}"`, {
      cwd: PROJECT_ROOT,
      stdio: jsonMode ? "pipe" : "inherit",
      timeout: 120000,
    });
  } catch (err) {
    restoreBackup(bakPath!, outputFile);
    if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
    return {
      source: "body-types",
      status: "failed",
      message: `Processing failed: ${(err as Error).message}`,
      entriesBefore,
    };
  }

  if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);

  log("Validating output...");
  const validation = validateBodyTypes();
  if (validation.status === "fail") {
    restoreBackup(bakPath!, outputFile);
    return {
      source: "body-types",
      status: "failed",
      message: `Validation failed: ${validation.errors.join("; ")}`,
      entriesBefore,
    };
  }

  const entriesAfter = countEntries(outputFile);
  cleanupBackup(bakPath);
  return {
    source: "body-types",
    status: "success",
    message: `Refreshed: ${entriesBefore.toLocaleString()} → ${entriesAfter.toLocaleString()} entries`,
    entriesBefore,
    entriesAfter,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--json");

  if (args.length === 0) {
    console.log(`
  Data Refresh Orchestrator

  Usage:
    npx tsx scripts/refresh-data.ts --recalls                  Auto-refresh DVSA recalls
    npx tsx scripts/refresh-data.ts --how-many-left <url>      Refresh VEH0120 from URL
    npx tsx scripts/refresh-data.ts --body-types <url>         Refresh VEH0220 from URL
    npx tsx scripts/refresh-data.ts --all                      All automatable sources
    npx tsx scripts/refresh-data.ts --json                     Machine-readable output
`);
    process.exit(0);
  }

  if (!jsonMode) {
    console.log("\n  Data Refresh");
    console.log("  " + "=".repeat(40));
    console.log();
  }

  const doRecalls = args.includes("--recalls") || args.includes("--all");
  const howManyLeftIdx = args.indexOf("--how-many-left");
  const bodyTypesIdx = args.indexOf("--body-types");

  if (doRecalls) {
    log("--- Recalls ---");
    results.push(await refreshRecalls());
    log("");
  }

  if (howManyLeftIdx !== -1) {
    const url = args[howManyLeftIdx + 1];
    if (!url || url.startsWith("--")) {
      results.push({
        source: "how-many-left",
        status: "failed",
        message: "Missing URL argument for --how-many-left",
      });
    } else {
      log("--- How Many Left ---");
      results.push(await refreshHowManyLeft(url));
      log("");
    }
  }

  if (bodyTypesIdx !== -1) {
    const url = args[bodyTypesIdx + 1];
    if (!url || url.startsWith("--")) {
      results.push({
        source: "body-types",
        status: "failed",
        message: "Missing URL argument for --body-types",
      });
    } else {
      log("--- Body Types ---");
      results.push(await refreshBodyTypes(url));
      log("");
    }
  }

  // Summary
  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log("  Summary");
    console.log("  " + "-".repeat(40));
    for (const r of results) {
      const icon =
        r.status === "success"
          ? "\x1b[32m OK \x1b[0m"
          : r.status === "failed"
            ? "\x1b[31mFAIL\x1b[0m"
            : "\x1b[33mSKIP\x1b[0m";
      console.log(`  ${icon}  ${r.source}: ${r.message}`);
    }
    console.log();
  }

  const failed = results.filter((r) => r.status === "failed");
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
