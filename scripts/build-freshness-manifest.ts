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

function isDirty(file: string): boolean {
  // True if the file has uncommitted changes (modified or staged but not
  // yet committed). The refresh workflow runs this between writing data
  // and committing, so we need to recognize that state as "fresh now".
  try {
    const out = execSync(`git status --porcelain "src/data/${file}"`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function filesChangedInHead(): Set<string> {
  // Set of src/data/*.json files that the most recent commit actually
  // changed. We use this to gate the git-log path — Vercel's shallow
  // clone returns misleading per-path git log dates, so we only trust
  // git log when we can confirm the file was *actually* modified in HEAD.
  try {
    const out = execSync(`git diff --name-only HEAD~1 HEAD`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const set = new Set<string>();
    for (const line of out.split("\n")) {
      const t = line.trim();
      if (t.startsWith("src/data/") && t.endsWith(".json")) {
        set.add(t.replace("src/data/", ""));
      }
    }
    return set;
  } catch {
    // shallow clone with no HEAD~1, or no .git — can't confirm anything
    return new Set();
  }
}


function loadExistingManifest(): Record<string, string> {
  // The manifest is committed to git and serves as the source of truth.
  // We read it first so values can be preserved across builds where git log
  // can't see deep history (e.g., Vercel's shallow clone).
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function main() {
  const now = new Date().toISOString();
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && f !== "_freshness.json")
    .sort();

  // Start from the committed manifest so unmodified entries survive shallow
  // clones (Vercel) where `git log -- <file>` returns nothing — or worse,
  // misleading dates from other recent commits on Vercel's modified clone.
  const existing = loadExistingManifest();
  const manifest: Record<string, string> = { ...existing };
  const changedInHead = filesChangedInHead();
  let gitOk = 0;
  let fetchedNow = 0;
  let dirty = 0;
  let preserved = 0;

  for (const f of files) {
    if (FETCHED_THIS_BUILD.has(f)) {
      // Prebuild fetch scripts just (re)wrote this — stamp it "now".
      manifest[f] = now;
      fetchedNow++;
      continue;
    }
    if (isDirty(f)) {
      // File modified in this working tree but not yet committed
      // (e.g., refresh workflow ran but hasn't pushed). Treat as fresh now.
      manifest[f] = now;
      dirty++;
      continue;
    }
    if (changedInHead.has(f)) {
      // File was actually changed in HEAD — trust git log for the date.
      // (Without this gate, Vercel's clone sometimes returns a date from
      // an unrelated recent commit, making every file look fresh.)
      const git = gitLogIso(f);
      if (git) {
        manifest[f] = git;
        gitOk++;
        continue;
      }
    }
    // Default: preserve the committed manifest value. This is the
    // overwhelming case — most files aren't touched in any given commit,
    // so their last-modified date should carry across builds intact.
    if (existing[f]) {
      manifest[f] = existing[f];
      preserved++;
    } else {
      // First time seeing this file — best we can do is now.
      manifest[f] = now;
    }
  }

  // Strip debug entries from any prior build before writing.
  delete manifest["_debug_decisions"];
  delete manifest["_debug_env"];

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(
    `Wrote freshness manifest: ${files.length} files (${fetchedNow} fetched-now · ${dirty} dirty-now · ${gitOk} from git · ${preserved} preserved). filesChangedInHead=${[...changedInHead].join(",") || "(none)"}`,
  );
}

main();
