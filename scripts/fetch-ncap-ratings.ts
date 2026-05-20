/**
 * Fetches Euro NCAP star ratings + sub-scores for every assessment listed
 * in euroncap.com's sitemap, then writes src/data/ncap-ratings.json.
 *
 * Usage:
 *   npx tsx scripts/fetch-ncap-ratings.ts             # full run (~491 pages)
 *   npx tsx scripts/fetch-ncap-ratings.ts --limit=10  # test on first 10
 *
 * Strategy:
 * - Sitemap.xml (XML) lists every assessment URL — no pagination scraping
 * - Each detail page is JS-rendered by Next.js; load with puppeteer (stealth
 *   patches) so the rendered HTML contains everything we need
 * - Extract make+model from <title>, year + stars from meta description,
 *   sub-scores from the visible page text (Adult Occupant XX%, etc.)
 * - Dedupe by make+model — keep the highest yearTested; tie-broken by
 *   highest overallStars
 *
 * Run locally; not in prebuild (no Chromium on Vercel build infra).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import puppeteer, { type Browser } from "puppeteer-core";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(PROJECT_ROOT, "src", "data", "ncap-ratings.json");
const SITEMAP_URL = "https://www.euroncap.com/sitemap.xml";
const CONCURRENCY = 4;

interface NcapRating {
  make: string;
  model: string;
  overallStars: number;
  adultOccupant: number;
  childOccupant: number;
  pedestrian: number;
  safetyAssist: number;
  yearTested: number;
}

function resolveChrome(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error("No Chromium-based browser found. Set CHROME_PATH or install Chrome/Brave.");
}

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const all = [...xml.matchAll(/<loc>(https:\/\/www\.euroncap\.com\/assessments\/[^<]+)<\/loc>/g)].map(
    (m) => m[1],
  );
  // Filter out Assisted Driving assessments: their IDs start with "a" (e.g.
  // /a008/). Those use a Good/Moderate/Entry scoring system, not 5-star
  // crash ratings, so they don't match our schema.
  const crashOnly = all.filter((u) => !/\/a\d+\/?$/.test(u));
  return [...new Set(crashOnly)];
}

function parseArgs(): { limit: number | null } {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : null;
  return { limit };
}

async function scrapeOne(
  browser: Browser,
  url: string,
): Promise<NcapRating | { url: string; error: string }> {
  const page = await browser.newPage();
  try {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      // @ts-expect-error - browser augmentation
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, "languages", { get: () => ["en-GB", "en"] });
    });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-GB,en;q=0.9" });

    const resp = await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    if (!resp || resp.status() >= 400) {
      return { url, error: `HTTP ${resp?.status() ?? "n/a"}` };
    }

    const data = await page.evaluate(() => {
      const title = (document.querySelector("title")?.textContent || "").trim();
      // "Euro NCAP | Kia EV4" → "Kia EV4"
      const titleStripped = title.replace(/^Euro\s*NCAP\s*\|\s*/i, "").trim();
      const metaDesc =
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") || "";
      const bodyText = document.body.textContent || "";
      return { titleStripped, metaDesc, bodyText };
    });

    // year + stars from meta description: "Euro NCAP 2025 safety results for Kia EV4, rated 5 stars."
    const yearMatch = data.metaDesc.match(/(?:Euro NCAP|NCAP)\s+(\d{4})/i);
    const starMatch = data.metaDesc.match(/rated\s+(\d)\s*stars?/i);

    // Sub-scores from page text: "Adult Occupant84%" / "Child Occupant85%" etc.
    const adult = data.bodyText.match(/Adult Occupant[^\d]*(\d{1,3})\s*%/i);
    const child = data.bodyText.match(/Child Occupant[^\d]*(\d{1,3})\s*%/i);
    const vru = data.bodyText.match(/Vulnerable Road User[s]?[^\d]*(\d{1,3})\s*%/i);
    const safety = data.bodyText.match(/Safety Assist[^\d]*(\d{1,3})\s*%/i);

    if (!yearMatch || !starMatch || !adult || !child || !vru || !safety) {
      return {
        url,
        error: `missing fields — year:${!!yearMatch} stars:${!!starMatch} adult:${!!adult} child:${!!child} vru:${!!vru} safety:${!!safety}`,
      };
    }

    // Make + model from titleStripped. Title is "Kia EV4" — but our schema wants
    // uppercase, with multi-word makes (Land Rover, Alfa Romeo, Mercedes-Benz).
    // Use the URL slug as the authoritative make split: /assessments/kia/ev4/...
    const slugMatch = url.match(/\/assessments\/([^/]+)\/([^/]+)\//);
    if (!slugMatch) return { url, error: "URL slug parse failed" };
    const make = decodeURIComponent(slugMatch[1].replace(/\+/g, " ")).toUpperCase();
    const model = decodeURIComponent(slugMatch[2].replace(/\+/g, " ")).toUpperCase();

    return {
      make,
      model,
      overallStars: parseInt(starMatch[1], 10),
      adultOccupant: parseInt(adult[1], 10),
      childOccupant: parseInt(child[1], 10),
      pedestrian: parseInt(vru[1], 10),
      safetyAssist: parseInt(safety[1], 10),
      yearTested: parseInt(yearMatch[1], 10),
    };
  } catch (e) {
    return { url, error: (e as Error).message };
  } finally {
    await page.close();
  }
}

// Round-robin worker pool of size `concurrency`
async function scrapeAll(
  browser: Browser,
  urls: string[],
  concurrency: number,
): Promise<{ ratings: NcapRating[]; errors: { url: string; error: string }[] }> {
  const ratings: NcapRating[] = [];
  const errors: { url: string; error: string }[] = [];
  let i = 0;
  let done = 0;
  const total = urls.length;

  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= urls.length) return;
      const url = urls[idx];
      const result = await scrapeOne(browser, url);
      if ("make" in result) {
        ratings.push(result);
      } else {
        errors.push(result);
      }
      done++;
      if (done % 10 === 0 || done === total) {
        const pct = Math.floor((done / total) * 100);
        process.stdout.write(
          `\r  progress: ${done}/${total} (${pct}%) — ${ratings.length} parsed · ${errors.length} errors`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  process.stdout.write("\n");
  return { ratings, errors };
}

function dedupe(ratings: NcapRating[]): NcapRating[] {
  // Group by make+model, keep best entry: highest year, then highest stars.
  const map = new Map<string, NcapRating>();
  for (const r of ratings) {
    const key = `${r.make}|${r.model}`;
    const existing = map.get(key);
    if (
      !existing ||
      r.yearTested > existing.yearTested ||
      (r.yearTested === existing.yearTested && r.overallStars > existing.overallStars)
    ) {
      map.set(key, r);
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.make === b.make ? a.model.localeCompare(b.model) : a.make.localeCompare(b.make),
  );
}

async function main() {
  const { limit } = parseArgs();
  console.log("Fetching sitemap…");
  const allUrls = await fetchSitemapUrls();
  const urls = limit ? allUrls.slice(0, limit) : allUrls;
  console.log(`Found ${allUrls.length} assessment URLs${limit ? ` (limited to ${limit})` : ""}\n`);

  const browser = await puppeteer.launch({
    executablePath: resolveChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  try {
    console.log(`Scraping with concurrency=${CONCURRENCY}…`);
    const { ratings, errors } = await scrapeAll(browser, urls, CONCURRENCY);
    const deduped = dedupe(ratings);

    console.log(`\nSummary:`);
    console.log(`  Pages scraped:    ${urls.length}`);
    console.log(`  Successful:       ${ratings.length}`);
    console.log(`  Errors:           ${errors.length}`);
    console.log(`  Unique make+model: ${deduped.length}`);

    if (errors.length && errors.length < 30) {
      console.log(`\nErrors:`);
      for (const e of errors.slice(0, 30)) {
        console.log(`  ${e.error.slice(0, 60)} — ${e.url}`);
      }
    }

    if (limit) {
      console.log(`\n--- Sample output (--limit=${limit}) ---`);
      for (const r of deduped.slice(0, 10)) {
        console.log(JSON.stringify(r));
      }
      console.log(`\n(not writing to ${OUT_PATH} — limit mode)`);
    } else {
      fs.writeFileSync(OUT_PATH, JSON.stringify(deduped, null, 2) + "\n");
      console.log(`\n✓ Wrote ${deduped.length} ratings → ${OUT_PATH}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
