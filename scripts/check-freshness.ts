#!/usr/bin/env npx tsx
/**
 * Data file freshness monitor.
 *
 * Reads every dataset from the registry (src/data/_registry.ts), finds when
 * each file was last changed (git log, else mtime) and flags the ones past
 * their `thresholdDays`. The thresholds used to live in a table in this file
 * that disagreed with the one in the data-health route; the registry is now
 * the only copy.
 *
 *   npx tsx scripts/check-freshness.ts          # human-readable table
 *   npx tsx scripts/check-freshness.ts --json   # machine-readable JSON
 *
 * Exit code is always 0 (informational only).
 */

import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import { DATASETS, describeMethod } from "../src/data/_registry";

const DATA_DIR = path.resolve(__dirname, "../src/data");
const PROJECT_ROOT = path.resolve(__dirname, "..");

interface FreshnessEntry {
  file: string;
  label: string;
  lastModified: string; // ISO date
  daysAgo: number;
  threshold: number;
  stale: boolean;
  method: string;
  nextDue: string | null;
}

function getLastModifiedDate(file: string): Date {
  try {
    const output = execFileSync("git", ["log", "-1", "--format=%aI", "--", `src/data/${file}`], {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (output) return new Date(output);
  } catch {
    // git not available, fall through
  }
  return fs.statSync(path.join(DATA_DIR, file)).mtime;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

const jsonMode = process.argv.includes("--json");
const now = new Date();

const entries: FreshnessEntry[] = DATASETS.map((d) => {
  const filePath = path.join(DATA_DIR, d.file);
  const base = { file: d.file, label: d.label, threshold: d.thresholdDays, method: describeMethod(d), nextDue: d.nextDue ?? null };
  if (!fs.existsSync(filePath)) {
    return { ...base, lastModified: "unknown", daysAgo: Infinity, stale: true };
  }
  const lastMod = getLastModifiedDate(d.file);
  const days = daysBetween(lastMod, now);
  return { ...base, lastModified: lastMod.toISOString().split("T")[0], daysAgo: days, stale: days > d.thresholdDays };
});

const staleFiles = entries.filter((e) => e.stale);
const dueSoon = entries.filter((e) => e.nextDue && (Date.parse(e.nextDue) - now.getTime()) / 864e5 <= 45);

if (jsonMode) {
  console.log(JSON.stringify({ entries, staleCount: staleFiles.length, dueSoon: dueSoon.map((e) => e.file) }, null, 2));
} else {
  const maxFileLen = Math.max(...entries.map((e) => e.file.length));
  console.log("\n  Data File Freshness Report");
  console.log("  " + "=".repeat(70));
  console.log();
  console.log(`  ${"File".padEnd(maxFileLen)}   ${"Last change".padEnd(12)}   ${"Age".padEnd(8)}   ${"Threshold".padEnd(10)}   ${"Next due".padEnd(10)}   Status`);
  console.log("  " + "-".repeat(maxFileLen + 66));
  for (const e of entries) {
    const age = e.daysAgo === Infinity ? "???" : `${e.daysAgo}d`;
    const status = e.stale ? "\x1b[33m STALE \x1b[0m" : "\x1b[32m  OK   \x1b[0m";
    console.log(`  ${e.file.padEnd(maxFileLen)}   ${e.lastModified.padEnd(12)}   ${age.padStart(8)}   ${(e.threshold + "d").padStart(10)}   ${(e.nextDue ?? "—").padEnd(10)}   ${status}`);
  }
  console.log();
  if (staleFiles.length > 0) {
    console.log(`  \x1b[33m${staleFiles.length} file(s) are stale and may need updating\x1b[0m`);
    for (const f of staleFiles) {
      console.log(`    - ${f.file} (${f.daysAgo === Infinity ? "not found" : f.daysAgo + " days old"}, threshold: ${f.threshold}d) — ${f.method}`);
    }
  } else {
    console.log("  \x1b[32mAll data files are fresh\x1b[0m");
  }
  if (dueSoon.length > 0) {
    console.log(`  ${dueSoon.length} hand-run dataset(s) due within 45 days: ${dueSoon.map((e) => `${e.file} (${e.nextDue})`).join(", ")}`);
  }
  console.log();
}

export { entries as freshnessEntries, staleFiles };
