/**
 * Generates marketing screenshot thumbnails of each tool's result UI for the
 * mobile landing-page previews.
 *
 * Pipeline: launches headless Chrome via puppeteer-core, navigates the
 * already-running dev server to /preview/{tool}, waits for any secondary
 * fetches (eBay, fuel-economy, recalls) to settle, screenshots the result
 * card and writes to public/previews/{tool}.png.
 *
 * One-time setup (already done if package.json has the script):
 *   npm install --save-dev puppeteer-core
 *
 * Usage:
 *   1. Start the dev server: npm run dev       (in a separate terminal)
 *   2. Run: npx tsx scripts/generate-previews.ts
 *
 * Env vars:
 *   PREVIEW_BASE_URL  Defaults to http://localhost:3001
 *   CHROME_PATH       Defaults to the standard macOS Chrome.app path
 *   PREVIEW_TOOLS     Comma-separated subset of tools (defaults to all)
 */

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import puppeteer from "puppeteer-core";

/** Try common Chromium-browser paths on macOS — first one found wins. */
function resolveChromeExecutable(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Arc.app/Contents/MacOS/Arc",
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    "No Chromium-based browser found. Install Chrome/Brave/Edge or set CHROME_PATH."
  );
}

const ALL_TOOLS = [
  "tax-check",
  "mot-check",
  "mileage-check",
  "ulez-check",
  "recall-check",
  "car-valuation",
  "running-costs",
] as const;

const BASE_URL = process.env.PREVIEW_BASE_URL || "http://localhost:3001";
const CHROME_PATH = resolveChromeExecutable();
const OUT_DIR = resolve(process.cwd(), "public", "previews");

// Per-tool crop height — tuned by eye to fit the hero + the most informative
// supporting card while keeping the thumbnail tight. Adjust here if a tool's
// hero gets taller; values are device-pixels at deviceScaleFactor=2.
const TOOL_HEIGHT_PX: Record<(typeof ALL_TOOLS)[number], number> = {
  "tax-check": 500,
  "mot-check": 600,
  "mileage-check": 600,
  "ulez-check": 380,
  "recall-check": 540,
  "car-valuation": 660,
  "running-costs": 660,
};

async function shoot(slug: string, height: number) {
  const url = `${BASE_URL}/preview/${slug}`;
  console.log(`📸  ${url}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--font-render-hinting=none", // crisper text in screenshots
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 420, height: 1400, deviceScaleFactor: 2 });
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);

    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    // Extra settle for animated entry transitions (cyan glow pulses, etc.)
    await new Promise((r) => setTimeout(r, 600));

    const target = await page.$("#screenshot-target");
    if (!target) {
      throw new Error("#screenshot-target not found — preview route shape changed?");
    }

    const box = await target.boundingBox();
    if (!box) {
      throw new Error("bounding box unavailable");
    }

    const outPath = join(OUT_DIR, `${slug}.png`);
    await page.screenshot({
      path: outPath as `${string}.png`,
      clip: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: Math.min(box.height, height),
      },
    });
    console.log(`   ✓  ${outPath}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const requested = process.env.PREVIEW_TOOLS?.split(",").map((s) => s.trim());
  const tools = requested && requested.length > 0
    ? (requested as readonly string[]).filter((t): t is (typeof ALL_TOOLS)[number] =>
        (ALL_TOOLS as readonly string[]).includes(t)
      )
    : ALL_TOOLS;

  if (tools.length === 0) {
    console.error("No valid tools to generate. Got:", requested);
    process.exit(1);
  }

  console.log(`Generating ${tools.length} preview screenshot${tools.length === 1 ? "" : "s"}…\n`);

  for (const slug of tools) {
    try {
      await shoot(slug, TOOL_HEIGHT_PX[slug]);
    } catch (err) {
      console.error(`   ✗  ${slug}: ${(err as Error).message}`);
    }
  }

  console.log("\nDone. Re-run any time the result UI changes.");
}

main().catch((err) => {
  console.error("[generate-previews] fatal:", err);
  process.exit(1);
});
