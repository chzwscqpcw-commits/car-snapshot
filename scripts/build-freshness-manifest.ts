/**
 * Writes src/data/_freshness.json — a map of { filename: ISO-timestamp }
 * recording when each data file was last refreshed.
 *
 * Why this exists: at Vercel runtime, neither `git log` nor `fs.statSync`
 * returns accurate mtimes on bundled files (git history isn't shipped, and
 * statSync reports a fixed historical placeholder). So the /api/data-health
 * dashboard was showing every file as ~2769 days stale.
 *
 * Strategy:
 *   - At prebuild time, `git log` IS available because the build env has the
 *     repo checked out. We run it for each data file and capture the most
 *     recent commit time.
 *   - For files that get fetched-and-replaced earlier in the same prebuild
 *     (fuel-prices, how-many-left), their git log timestamp would be stale
 *     because the fresh download isn't committed. We special-case those to
 *     "now" so the dashboard reflects reality.
 *   - Runtime reads the static manifest — no git, no fs.statSync needed.
 *
 * Run: npx tsx scripts/build-freshness-manifest.ts
 * Hooked into prebuild AFTER all fetch-* scripts.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "src", "data");
const MANIFEST_PATH = path.join(DATA_DIR, "_freshness.json");

// Files refreshed by fetch-* prebuild scripts that ran earlier in this build.
// Their content is "now", even though git log would say otherwise.
const FETCHED_THIS_BUILD = new Set([
  "fuel-prices-weekly.json",
  "how-many-left.json",
]);

function gitLogIso(file: string): string | null {
  try {
    const out = execSync(`git log -1 --format=%aI -- "src/data/${file}"`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function statMtimeIso(file: string): string | null {
  try {
    const stat = fs.statSync(path.join(DATA_DIR, file));
    return stat.mtime.toISOString();
  } catch {
    return null;
  }
}

function main() {
  const now = new Date().toISOString();
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && f !== "_freshness.json")
    .sort();

  const manifest: Record<string, string> = {};
  let gitOk = 0;
  let fetchedNow = 0;
  let mtimeFallback = 0;

  for (const f of files) {
    if (FETCHED_THIS_BUILD.has(f)) {
      manifest[f] = now;
      fetchedNow++;
      continue;
    }
    const git = gitLogIso(f);
    if (git) {
      manifest[f] = git;
      gitOk++;
      continue;
    }
    // Last-ditch fallback: filesystem mtime. Won't be accurate in Vercel
    // runtime, but at prebuild time on a developer machine it's usable.
    const mtime = statMtimeIso(f);
    if (mtime) {
      manifest[f] = mtime;
      mtimeFallback++;
    } else {
      manifest[f] = now; // file existed but unstattable — degrade gracefully
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(
    `Wrote freshness manifest: ${files.length} files (${fetchedNow} fetched-now · ${gitOk} from git · ${mtimeFallback} from mtime)`,
  );
}

main();
