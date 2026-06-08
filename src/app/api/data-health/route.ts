import { NextResponse } from "next/server";

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
import freshness from "@/data/_freshness.json";
import { supabaseServerRole } from "@/lib/supabaseServer";
import {
  MARKETCHECK_MONTHLY_CALL_LIMIT,
  MARKETCHECK_CACHE_TTL_DAYS,
  marketCheckEnabled,
} from "@/lib/marketcheck";

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
    // Weekly Vercel cron at /api/cron/refresh-recalls writes to Supabase
    // data_cache. The bundled JSON file is a build-time fallback. Direct
    // HTTP fetches are blocked by Imperva bot protection, so we cannot
    // refresh this at prebuild. Threshold extended to 180d — production
    // freshness comes from the cron + cache, not the JSON file.
    threshold: 180,
    source: "semi-auto",
    refreshHint:
      "Weekly Vercel cron refreshes Supabase data_cache (production source of truth). For a bundled-JSON refresh: download RecallsFile.csv manually from the DVSA service and run scripts/process-recalls.ts.",
    sourceUrl:
      "https://www.check-vehicle-recalls.service.gov.uk",
  },
  "how-many-left.json": {
    threshold: 90,
    source: "auto",
    refreshHint:
      "Auto-refreshed at every deploy by scripts/fetch-how-many-left.ts (latest DfT VEH0120 CSV from gov.uk Content API).",
    sourceUrl:
      "https://www.gov.uk/government/statistical-data-sets/veh01-vehicles-registered-for-the-first-time",
  },
  "body-types.json": {
    // Was auto via DfT VEH0220, but as of 2026-05 the source CSV no longer
    // publishes body shapes (Hatchback/Saloon/SUV/…) — the BodyType column
    // only carries the vehicle category ("Cars"). Reclassified as curated
    // until/unless DfT restore the body-shape breakdown.
    threshold: 365,
    source: "curated",
    refreshHint:
      "DfT VEH0220 no longer publishes body shapes. Manually update from manufacturer specs, or re-enable scripts/fetch-body-types.ts if the source returns.",
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
    source: "semi-auto",
    refreshHint:
      "Pulls euroncap.com/sitemap.xml then scrapes ~465 detail pages via puppeteer-core with stealth patches. Run: npx tsx scripts/fetch-ncap-ratings.ts",
    sourceUrl: "https://www.euroncap.com/sitemap.xml",
  },
  "new-prices.json": {
    threshold: 180,
    source: "semi-auto",
    refreshHint:
      "Scrapes Parkers review sitemap (lastmod within 180d) via puppeteer. Run: npx tsx scripts/fetch-new-prices.ts",
    sourceUrl: "https://www.parkers.co.uk/sitemap.xml",
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
  // Read from the prebuild-written manifest. Neither git log nor fs.statSync
  // work reliably at Vercel runtime (no .git in the bundle; statSync returns
  // a fixed placeholder mtime). The manifest is generated by
  // scripts/build-freshness-manifest.ts during prebuild, where git is
  // available, and it specially marks files refreshed in the same prebuild.
  return (freshness as Record<string, string>)[file] ?? "";
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Reads the Supabase data_cache row for a given key and returns the
// updated_at ISO timestamp (or null if no row). Used to surface the real
// freshness of data refreshed via cron rather than the (older) JSON fallback.
async function fetchProductionAge(key: string): Promise<string | null> {
  try {
    const sb = supabaseServerRole();
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

// ── MarketCheck monthly spend cap usage ───────────────────────────────────

type MarketCheckUsage = {
  enabled: boolean;
  month: string; // 'YYYY-MM' (UTC)
  calls: number;
  limit: number;
  percent: number; // 0–100, clamped
  remaining: number;
  estSpendGbp: number; // calls × £0.0010
  cacheTtlDays: number;
  cacheEntries: number | null;
};

// Reads the current month's MarketCheck call count + cache size via the
// service-role client (the usage/cache tables are RLS-locked from the anon
// key). Surfaces the spend cap as a percentage so usage is visible at a
// glance during the rollout phase.
async function fetchMarketCheckUsage(now: Date): Promise<MarketCheckUsage> {
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const limit = MARKETCHECK_MONTHLY_CALL_LIMIT;
  const base: MarketCheckUsage = {
    enabled: marketCheckEnabled(),
    month,
    calls: 0,
    limit,
    percent: 0,
    remaining: limit,
    estSpendGbp: 0,
    cacheTtlDays: MARKETCHECK_CACHE_TTL_DAYS,
    cacheEntries: null,
  };
  try {
    const sb = supabaseServerRole();
    const [usageRes, cacheRes] = await Promise.all([
      sb.from("marketcheck_usage").select("calls").eq("month", month).maybeSingle(),
      sb.from("marketcheck_cache").select("*", { count: "exact", head: true }),
    ]);
    const calls = (usageRes.data?.calls as number | undefined) ?? 0;
    base.calls = calls;
    base.remaining = Math.max(0, limit - calls);
    base.percent = limit > 0 ? Math.min(100, Math.round((calls / limit) * 100)) : 0;
    base.estSpendGbp = Math.round(calls * 0.001 * 100) / 100;
    base.cacheEntries = cacheRes.count ?? null;
  } catch {
    // Leave defaults (zeros) — the dashboard renders an "unavailable" state.
  }
  return base;
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

  const marketcheck = await fetchMarketCheckUsage(now);

  return NextResponse.json({
    status: "ok",
    buildTime: BUILD_TIME,
    commit: COMMIT,
    totalEntries,
    staleCount,
    files,
    marketcheck,
  });
}
