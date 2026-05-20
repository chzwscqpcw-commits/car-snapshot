import { NextResponse } from "next/server";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import recalls from "@/data/recalls.json";
import fuelEconomy from "@/data/fuel-economy.json";
import ncapRatings from "@/data/ncap-ratings.json";
import newPrices from "@/data/new-prices.json";
import evSpecs from "@/data/ev-specs.json";
import howManyLeft from "@/data/how-many-left.json";
import motPassRates from "@/data/mot-pass-rates.json";
import motFailureReasons from "@/data/mot-failure-reasons.json";
import bodyTypes from "@/data/body-types.json";
import theftRisk from "@/data/theft-risk.json";
import colourPopularity from "@/data/colour-popularity.json";
import tyreSizes from "@/data/tyre-sizes.json";
import vehicleDimensions from "@/data/vehicle-dimensions.json";
import { supabaseServer } from "@/lib/supabaseServer";

// Dynamic so we can query the Supabase data_cache table on each request and
// report the actual freshness of what production users see — not just the
// build-time JSON mtime, which lags reality for cron-refreshed datasets.
export const dynamic = "force-dynamic";

const BUILD_TIME = new Date().toISOString();
const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

// ── Per-file metadata ────────────────────────────────────────────────────────

type FileMeta = {
  threshold: number;
  source: "auto" | "semi-auto" | "curated";
  refreshHint: string;
  sourceUrl: string | null;
};

const FILE_META: Record<string, FileMeta> = {
  "recalls.json": {
    threshold: 90,
    source: "auto",
    refreshHint: "Run: npx tsx scripts/refresh-data.ts --recalls",
    sourceUrl: "https://www.gov.uk/government/publications/recalls-and-faults-data-files",
  },
  "how-many-left.json": {
    threshold: 90,
    source: "auto",
    refreshHint:
      "Run: npx tsx scripts/refresh-data.ts --how-many-left <URL> — get VEH0120 URL from gov.uk vehicle stats page",
    sourceUrl: "https://www.gov.uk/government/statistical-data-sets/veh01-vehicles-registered-for-the-first-time",
  },
  "body-types.json": {
    threshold: 90,
    source: "auto",
    refreshHint:
      "Run: npx tsx scripts/refresh-data.ts --body-types <URL> — get VEH0220 URL from gov.uk vehicle stats page",
    sourceUrl: "https://www.gov.uk/government/statistical-data-sets/veh02-licensed-cars",
  },
  "fuel-economy.json": {
    threshold: 180,
    source: "semi-auto",
    refreshHint:
      "Download yearly CSVs from carfueldata.vehicle-certification-agency.gov.uk → run: npx tsx scripts/process-fuel-data.ts *.csv",
    sourceUrl: "https://carfueldata.vehicle-certification-agency.gov.uk/downloads/default.aspx",
  },
  "mot-pass-rates.json": {
    threshold: 180,
    source: "semi-auto",
    refreshHint:
      "Download bulk MOT data from data.gov.uk → run: npx tsx scripts/process-mot-stats.ts <csv>",
    sourceUrl: "https://www.data.gov.uk/dataset/e3939ef8-30c7-4ca8-9c7c-ad9475cc9b2f/anonymised-mot-tests-and-results",
  },
  "ncap-ratings.json": {
    threshold: 180,
    source: "curated",
    refreshHint: "Manually update from euroncap.com results pages (anti-bot blocks scraping)",
    sourceUrl: "https://www.euroncap.com/en/ratings/",
  },
  "new-prices.json": {
    threshold: 180,
    source: "curated",
    refreshHint: "Research current list prices from manufacturer websites for popular UK models",
    sourceUrl: null,
  },
  "ev-specs.json": {
    threshold: 180,
    source: "curated",
    refreshHint: "Update battery capacity, range, and charging specs from manufacturer websites",
    sourceUrl: null,
  },
  "theft-risk.json": {
    threshold: 180,
    source: "curated",
    refreshHint: "Update from insurance industry reports and police theft statistics",
    sourceUrl: null,
  },
  "colour-popularity.json": {
    threshold: 180,
    source: "curated",
    refreshHint: "Update from DfT annual colour popularity statistical release",
    sourceUrl: "https://www.gov.uk/government/statistical-data-sets/veh02-licensed-cars",
  },
  "mot-failure-reasons.json": {
    threshold: 180,
    source: "curated",
    refreshHint: "Compile common failure reasons from DVSA MOT statistics publications",
    sourceUrl: "https://www.gov.uk/government/statistics/mot-testing-data",
  },
  "tyre-sizes.json": {
    threshold: 180,
    source: "curated",
    refreshHint: "Update from tyre databases and manufacturer specification sheets",
    sourceUrl: null,
  },
  "vehicle-dimensions.json": {
    threshold: 180,
    source: "curated",
    refreshHint: "Update length/width/height/weight from manufacturer specification pages",
    sourceUrl: null,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function count(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (typeof data === "object" && data !== null) return Object.keys(data).length;
  return 0;
}

function getLastModified(file: string): string {
  const projectRoot = process.cwd();

  // Try git log first
  try {
    const output = execSync(`git log -1 --format=%aI -- "src/data/${file}"`, {
      cwd: projectRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (output) return output;
  } catch {
    // git not available, fall through
  }

  // Fallback to filesystem mtime
  try {
    const filePath = path.join(projectRoot, "src", "data", file);
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString();
  } catch {
    return "";
  }
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Reads the Supabase data_cache row for a given key and returns the
// updated_at ISO timestamp (or null if no row). Used to surface the real
// freshness of data refreshed via cron rather than the (older) JSON fallback.
async function fetchProductionAge(key: string): Promise<string | null> {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb
      .from("data_cache")
      .select("updated_at")
      .eq("key", key)
      .single();
    if (error || !data) return null;
    return data.updated_at as string;
  } catch {
    return null;
  }
}

// ── Compute freshness at request time ─────────────────────────────────────

const DATA_FILES: Record<string, unknown> = {
  "recalls.json": recalls,
  "fuel-economy.json": fuelEconomy,
  "ncap-ratings.json": ncapRatings,
  "new-prices.json": newPrices,
  "ev-specs.json": evSpecs,
  "how-many-left.json": howManyLeft,
  "mot-pass-rates.json": motPassRates,
  "mot-failure-reasons.json": motFailureReasons,
  "body-types.json": bodyTypes,
  "theft-risk.json": theftRisk,
  "colour-popularity.json": colourPopularity,
  "tyre-sizes.json": tyreSizes,
  "vehicle-dimensions.json": vehicleDimensions,
};

// Datasets that have a Supabase data_cache row refreshed by a cron, so the
// real freshness can be reported alongside (or instead of) the JSON mtime.
// Map file name → cache key.
const PROD_CACHE_KEYS: Record<string, string> = {
  "recalls.json": "recalls",
};

export async function GET() {
  const now = new Date();

  const files = await Promise.all(
    Object.entries(DATA_FILES).map(async ([file, data]) => {
      const meta = FILE_META[file];
      const modDate = getLastModified(file);
      const lastModified = modDate ? modDate.split("T")[0] : "unknown";
      const fileDaysAgo = modDate ? daysBetween(new Date(modDate), now) : -1;

      // Production age: only set for datasets backed by Supabase cache.
      // Reflects what users *actually* see in production.
      let productionDaysAgo: number | null = null;
      let productionUpdatedAt: string | null = null;
      const cacheKey = PROD_CACHE_KEYS[file];
      if (cacheKey) {
        productionUpdatedAt = await fetchProductionAge(cacheKey);
        if (productionUpdatedAt) {
          productionDaysAgo = daysBetween(new Date(productionUpdatedAt), now);
        }
      }

      // Effective age: production cache if available, else file mtime.
      const effectiveDaysAgo =
        productionDaysAgo !== null ? productionDaysAgo : fileDaysAgo;
      const stale =
        effectiveDaysAgo === -1 ? false : effectiveDaysAgo >= meta.threshold;

      return {
        file,
        entries: count(data),
        lastModified,
        daysAgo: fileDaysAgo,
        productionDaysAgo,
        productionUpdatedAt,
        effectiveDaysAgo,
        threshold: meta.threshold,
        stale,
        source: meta.source,
        refreshHint: meta.refreshHint,
        sourceUrl: meta.sourceUrl,
      };
    }),
  );

  const staleCount = files.filter((f) => f.stale).length;
  const totalEntries = files.reduce((sum, f) => sum + f.entries, 0);

  return NextResponse.json({
    status: "ok",
    buildTime: BUILD_TIME,
    commit: COMMIT,
    totalEntries,
    staleCount,
    files,
  });
}
