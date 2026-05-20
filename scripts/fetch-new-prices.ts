/**
 * Fetches new-car list prices from Parkers and writes src/data/new-prices.json.
 *
 * Usage:
 *   npx tsx scripts/fetch-new-prices.ts             # full run (~980 URLs)
 *   npx tsx scripts/fetch-new-prices.ts --limit=10  # test on first 10
 *
 * Strategy:
 * - Parkers publishes a gzipped sitemap (`review.xml.gz`) listing 11k+
 *   review URLs with `lastmod` timestamps. Filter to lastmod within 180
 *   days (active reviews → cars currently on sale).
 * - For each `/MAKE/MODEL/[TRIM/]review/` URL, scrape for the literal
 *   "Price new £X – £Y" string. Take the lower bound as the list price.
 * - Discontinued cars don't show "Price new" so they're silently skipped.
 * - Dedupe by make+model, prefer the most recently-updated review.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import puppeteer, { type Browser } from "puppeteer-core";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(PROJECT_ROOT, "src", "data", "new-prices.json");
const SITEMAP_URL = "https://www.parkers.co.uk/sitemap/zip-files/review.xml.gz";
const MAX_LASTMOD_DAYS = 180; // only currently-selling cars
const CONCURRENCY = 2;
const PER_REQUEST_DELAY_MS = 400;
// Smaller batches → browser restarts more often → bounded memory pressure.
// Crashes around the 40-50 page mark observed empirically.
const BROWSER_RESTART_EVERY = 40;

interface NewPrice {
  make: string;
  model: string;
  newPrice: number;
}

interface SitemapEntry {
  url: string;
  lastmod: string;
}

function resolveChrome(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error("No Chromium-based browser found. Set CHROME_PATH or install Chrome/Brave.");
}

async function fetchSitemapEntries(): Promise<SitemapEntry[]> {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const xml = zlib.gunzipSync(buf).toString("utf-8");
  const entries: SitemapEntry[] = [];
  const re = /<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    entries.push({ url: m[1], lastmod: m[2] });
  }
  return entries;
}

function parseLastmod(s: string): Date {
  // Handles "2026-05-20T12:57:17.0000000Z" → truncate fractional seconds.
  const clean = s.replace(/(\.\d{1,6})\d+(?=[Z+])/, "$1").replace("Z", "+00:00");
  return new Date(clean);
}

function filterRecent(entries: SitemapEntry[], maxDays: number): SitemapEntry[] {
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  return entries.filter((e) => parseLastmod(e.lastmod).getTime() >= cutoff);
}

function parseArgs(): { limit: number | null } {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : null;
  return { limit };
}

// Parse `https://www.parkers.co.uk/{make}/{model}/[trim/]review/` → make+model
function parseMakeModel(url: string): { make: string; model: string } | null {
  const m = url.match(/parkers\.co\.uk\/([^/]+)\/([^/]+)\//);
  if (!m) return null;
  return {
    make: m[1].replace(/-/g, " ").toUpperCase(),
    model: m[2].replace(/-/g, " ").toUpperCase(),
  };
}

async function scrapeOne(
  browser: Browser,
  entry: SitemapEntry,
): Promise<(NewPrice & { lastmod: string }) | { url: string; error: string }> {
  const mm = parseMakeModel(entry.url);
  if (!mm) return { url: entry.url, error: "URL parse failed" };

  if (!browser.connected) return { url: entry.url, error: "browser disconnected" };

  let page;
  try {
    page = await browser.newPage();
  } catch (e) {
    return { url: entry.url, error: `newPage failed: ${(e as Error).message}` };
  }
  try {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      // @ts-expect-error
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, "languages", { get: () => ["en-GB", "en"] });
    });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-GB,en;q=0.9" });

    const resp = await page.goto(entry.url, { waitUntil: "networkidle2", timeout: 45000 });
    if (!resp || resp.status() >= 400) {
      return { url: entry.url, error: `HTTP ${resp?.status() ?? "n/a"}` };
    }

    const text = await page.evaluate(() => document.body.textContent || "");
    // "Price new	£77,010 - £101,110" → capture both bounds, take lower.
    const m = text.match(/Price new\s*£([\d,]+)(?:\s*-\s*£([\d,]+))?/);
    if (!m) {
      return { url: entry.url, error: "no Price new on page" };
    }
    const low = parseInt(m[1].replace(/,/g, ""), 10);
    if (!low || low < 1000 || low > 1_000_000) {
      return { url: entry.url, error: `bad price value ${m[0]}` };
    }
    return { make: mm.make, model: mm.model, newPrice: low, lastmod: entry.lastmod };
  } catch (e) {
    return { url: entry.url, error: (e as Error).message };
  } finally {
    try {
      await page.close();
    } catch {
      /* browser may have crashed; safe to ignore */
    }
  }
}

async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    executablePath: resolveChrome(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });
}

async function scrapeAll(
  entries: SitemapEntry[],
  concurrency: number,
): Promise<{
  prices: Array<NewPrice & { lastmod: string }>;
  errors: { url: string; error: string }[];
}> {
  const prices: Array<NewPrice & { lastmod: string }> = [];
  const errors: { url: string; error: string }[] = [];
  const total = entries.length;
  let done = 0;

  for (let batchStart = 0; batchStart < entries.length; batchStart += BROWSER_RESTART_EVERY) {
    const batch = entries.slice(batchStart, batchStart + BROWSER_RESTART_EVERY);
    const browser = await launchBrowser();
    try {
      let i = 0;
      async function worker() {
        while (true) {
          const idx = i++;
          if (idx >= batch.length) return;
          let result: Awaited<ReturnType<typeof scrapeOne>>;
          try {
            result = await scrapeOne(browser, batch[idx]);
          } catch (e) {
            // Catch anything that escaped scrapeOne's own try/finally — keeps
            // the worker alive when the browser dies mid-batch.
            result = { url: batch[idx].url, error: (e as Error).message };
          }
          if ("make" in result) {
            prices.push(result);
          } else {
            errors.push(result);
          }
          done++;
          await new Promise((r) => setTimeout(r, PER_REQUEST_DELAY_MS));
          if (done % 20 === 0 || done === total) {
            const pct = Math.floor((done / total) * 100);
            process.stdout.write(
              `\r  progress: ${done}/${total} (${pct}%) — ${prices.length} parsed · ${errors.length} skipped/errors`,
            );
          }
        }
      }
      await Promise.all(Array.from({ length: concurrency }, () => worker()));
    } finally {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
  }
  process.stdout.write("\n");
  return { prices, errors };
}

function dedupe(prices: Array<NewPrice & { lastmod: string }>): NewPrice[] {
  // Group by make+model, keep the most recently-updated review.
  const map = new Map<string, NewPrice & { lastmod: string }>();
  for (const p of prices) {
    const key = `${p.make}|${p.model}`;
    const existing = map.get(key);
    if (
      !existing ||
      parseLastmod(p.lastmod).getTime() > parseLastmod(existing.lastmod).getTime()
    ) {
      map.set(key, p);
    }
  }
  return Array.from(map.values())
    .map(({ make, model, newPrice }) => ({ make, model, newPrice }))
    .sort((a, b) =>
      a.make === b.make ? a.model.localeCompare(b.model) : a.make.localeCompare(b.make),
    );
}

async function main() {
  const { limit } = parseArgs();
  console.log("Fetching Parkers review sitemap…");
  const allEntries = await fetchSitemapEntries();
  console.log(`  Total review URLs: ${allEntries.length}`);
  const recent = filterRecent(allEntries, MAX_LASTMOD_DAYS);
  console.log(`  Updated within ${MAX_LASTMOD_DAYS}d: ${recent.length}`);

  // Newest first so dedupe keeps the freshest take per make+model.
  recent.sort((a, b) => parseLastmod(b.lastmod).getTime() - parseLastmod(a.lastmod).getTime());
  const work = limit ? recent.slice(0, limit) : recent;
  console.log(`Scraping ${work.length} review pages (concurrency=${CONCURRENCY}, browser restart every ${BROWSER_RESTART_EVERY})…\n`);

  const { prices, errors } = await scrapeAll(work, CONCURRENCY);
  const deduped = dedupe(prices);

  console.log(`\nSummary:`);
  console.log(`  Pages scraped:     ${work.length}`);
  console.log(`  Prices parsed:     ${prices.length}`);
  console.log(`  Skipped/errors:    ${errors.length}`);
  console.log(`  Unique make+model: ${deduped.length}`);

  if (limit) {
    console.log(`\n--- Sample output ---`);
    for (const p of deduped.slice(0, 10)) console.log(JSON.stringify(p));
    console.log(`\n(not writing to ${OUT_PATH} — limit mode)`);
  } else {
    fs.writeFileSync(OUT_PATH, JSON.stringify(deduped, null, 2) + "\n");
    console.log(`\n✓ Wrote ${deduped.length} new-car prices → ${OUT_PATH}`);
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
