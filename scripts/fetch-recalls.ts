/**
 * Fetches the latest DVSA recalls CSV and refreshes src/data/recalls.json.
 *
 * Usage (run locally before deploy):
 *   npx tsx scripts/fetch-recalls.ts
 *
 * How it works:
 * The DVSA Vehicle Recalls service sits behind Imperva bot protection.
 * Plain Node `fetch` and `curl` receive a 302 → JS-challenge interstitial.
 * We bypass this by:
 *   1. Launching real Chromium (Brave) via puppeteer-core
 *   2. Applying stealth patches (hide navigator.webdriver, etc.)
 *   3. Warming the session by loading the recalls homepage so Imperva
 *      issues cookies and runs its challenge
 *   4. Fetching the CSV via `fetch()` inside the browser context, so the
 *      request carries the warmed cookies AND the real-browser TLS
 *      fingerprint that Imperva can't distinguish from a human visitor
 *
 * After downloading RecallsFile.csv to the project root, we shell out to
 * scripts/process-recalls.ts which writes src/data/recalls.json, then
 * remove the source CSV (it's 7+ MB; we only need the processed JSON).
 *
 * Not in prebuild because Vercel's build environment doesn't have
 * Chromium installed; this is a local-developer step before npm run deploy.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import puppeteer from "puppeteer-core";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(PROJECT_ROOT, "RecallsFile.csv");

const BASE = "https://www.check-vehicle-recalls.service.gov.uk";
const HOME_URL = `${BASE}/`;
const CSV_URL_PATH = "/documents/RecallsFile.csv";

function resolveChrome(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error(
    "No Chromium-based browser found. Install Chrome/Brave/Edge or set CHROME_PATH.",
  );
}

async function downloadViaPuppeteer(): Promise<string> {
  const browser = await puppeteer.launch({
    executablePath: resolveChrome(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--lang=en-GB",
    ],
  });
  try {
    const page = await browser.newPage();
    // Stealth patches before any page loads — Imperva checks navigator.webdriver
    // and a handful of other obvious headless tells.
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      // @ts-expect-error - browser augmentation
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, "plugins", {
        get: () => [{ name: "Chrome PDF Plugin" }, { name: "Chrome PDF Viewer" }],
      });
      Object.defineProperty(navigator, "languages", { get: () => ["en-GB", "en"] });
    });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-GB,en;q=0.9" });
    await page.setViewport({ width: 1440, height: 900 });

    console.log("Warming Imperva session at recalls homepage…");
    const home = await page.goto(HOME_URL, { waitUntil: "networkidle2", timeout: 45000 });
    if (!home || home.status() >= 400) {
      throw new Error(`Homepage returned ${home?.status()} — Imperva may have changed protection`);
    }
    await new Promise((r) => setTimeout(r, 2000));

    console.log(`Fetching CSV inside browser context: ${CSV_URL_PATH}…`);
    const csv = await page.evaluate(async (path: string) => {
      const r = await fetch(path, { credentials: "include" });
      if (!r.ok) throw new Error(`fetch ${path} → HTTP ${r.status}`);
      return await r.text();
    }, CSV_URL_PATH);

    if (csv.includes("<html") || csv.length < 100_000) {
      throw new Error(
        `CSV looks wrong (got ${csv.length} bytes; contains HTML: ${csv.includes("<html")}). Imperva may be serving an interstitial.`,
      );
    }
    return csv;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("=== DVSA Recalls Refresh ===\n");
  const csv = await downloadViaPuppeteer();
  fs.writeFileSync(CSV_PATH, csv);
  const sizeMb = (csv.length / 1024 / 1024).toFixed(1);
  console.log(`✓ Saved ${CSV_PATH} (${sizeMb} MB)\n`);

  console.log("Processing CSV → src/data/recalls.json…");
  execSync("npx tsx scripts/process-recalls.ts", { cwd: PROJECT_ROOT, stdio: "inherit" });

  // Clean up the raw CSV — the processed JSON is what we ship.
  try {
    fs.unlinkSync(CSV_PATH);
  } catch {
    /* ignore */
  }
  console.log("\n✓ Recalls refreshed. Now: git add src/data/recalls.json && npm run deploy");
}

main().catch((err) => {
  console.error("\n✗ Failed:", err?.message ?? err);
  try {
    if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH);
  } catch {
    /* ignore */
  }
  process.exit(1);
});
