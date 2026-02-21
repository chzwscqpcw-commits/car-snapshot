#!/usr/bin/env npx tsx
/**
 * Data file freshness monitor
 *
 * Checks when each data file was last modified (via git log or fs.stat)
 * and flags stale files based on configurable thresholds.
 *
 * Usage:
 *   npx tsx scripts/check-freshness.ts          # human-readable table
 *   npx tsx scripts/check-freshness.ts --json   # machine-readable JSON
 *
 * Exit code is always 0 (informational only).
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const DATA_DIR = path.resolve(__dirname, "../src/data");
const PROJECT_ROOT = path.resolve(__dirname, "..");

interface FreshnessEntry {
  file: string;
  lastModified: string; // ISO date
  daysAgo: number;
  threshold: number;
  stale: boolean;
  source: "automatable" | "curated";
}

// Automatable sources have a shorter threshold (90 days)
// Curated sources get 180 days before flagging
const FILE_CONFIG: Record<string, { threshold: number; source: "automatable" | "curated" }> = {
  "recalls.json":            { threshold: 90,  source: "automatable" },
  "how-many-left.json":      { threshold: 90,  source: "automatable" },
  "body-types.json":         { threshold: 90,  source: "automatable" },
  "fuel-economy.json":       { threshold: 180, source: "curated" },
  "ncap-ratings.json":       { threshold: 180, source: "curated" },
  "new-prices.json":         { threshold: 180, source: "curated" },
  "ev-specs.json":           { threshold: 180, source: "curated" },
  "mot-pass-rates.json":     { threshold: 180, source: "curated" },
  "mot-failure-reasons.json":{ threshold: 180, source: "curated" },
  "theft-risk.json":         { threshold: 180, source: "curated" },
  "colour-popularity.json":  { threshold: 180, source: "curated" },
  "tyre-sizes.json":         { threshold: 180, source: "curated" },
  "vehicle-dimensions.json": { threshold: 180, source: "curated" },
};

function getLastModifiedDate(file: string): Date {
  const relPath = path.join("src/data", file);

  // Try git log first
  try {
    const output = execSync(
      `git log -1 --format=%aI -- "${relPath}"`,
      { cwd: PROJECT_ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
    if (output) {
      return new Date(output);
    }
  } catch {
    // git not available, fall through
  }

  // Fallback to filesystem mtime
  const filePath = path.join(DATA_DIR, file);
  const stat = fs.statSync(filePath);
  return stat.mtime;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

const jsonMode = process.argv.includes("--json");
const now = new Date();

const entries: FreshnessEntry[] = Object.entries(FILE_CONFIG).map(([file, config]) => {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    return {
      file,
      lastModified: "unknown",
      daysAgo: Infinity,
      threshold: config.threshold,
      stale: true,
      source: config.source,
    };
  }

  const lastMod = getLastModifiedDate(file);
  const days = daysBetween(lastMod, now);

  return {
    file,
    lastModified: lastMod.toISOString().split("T")[0],
    daysAgo: days,
    threshold: config.threshold,
    stale: days > config.threshold,
    source: config.source,
  };
});

const staleFiles = entries.filter((e) => e.stale);

if (jsonMode) {
  console.log(JSON.stringify({ entries, staleCount: staleFiles.length }, null, 2));
} else {
  const maxFileLen = Math.max(...entries.map((e) => e.file.length));

  console.log("\n  Data File Freshness Report");
  console.log("  " + "=".repeat(60));
  console.log();
  console.log(
    `  ${"File".padEnd(maxFileLen)}   ${"Last Modified".padEnd(12)}   ${"Age".padEnd(8)}   ${"Threshold".padEnd(10)}   Status`
  );
  console.log("  " + "-".repeat(maxFileLen + 50));

  for (const e of entries) {
    const padded = e.file.padEnd(maxFileLen);
    const age = e.daysAgo === Infinity ? "???" : `${e.daysAgo}d`;
    const status = e.stale
      ? "\x1b[33m STALE \x1b[0m"
      : "\x1b[32m  OK   \x1b[0m";
    console.log(
      `  ${padded}   ${e.lastModified.padEnd(12)}   ${age.padStart(8)}   ${(e.threshold + "d").padStart(10)}   ${status}`
    );
  }

  console.log();
  if (staleFiles.length > 0) {
    console.log(`  \x1b[33m${staleFiles.length} file(s) are stale and may need updating\x1b[0m`);
    for (const f of staleFiles) {
      console.log(`    - ${f.file} (${f.daysAgo === Infinity ? "not found" : f.daysAgo + " days old"}, threshold: ${f.threshold}d)`);
    }
  } else {
    console.log("  \x1b[32mAll data files are fresh\x1b[0m");
  }
  console.log();
}

// Export for use by GitHub Action
export { entries as freshnessEntries, staleFiles };
