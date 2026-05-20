/**
 * Fetches EV specs from ev-database.org and writes src/data/ev-specs.json.
 *
 * Usage:
 *   npx tsx scripts/fetch-ev-specs.ts             # full run (~1,339 EVs)
 *   npx tsx scripts/fetch-ev-specs.ts --limit=10  # test on first 10
 *
 * Strategy:
 * - Sitemap lists every EV detail URL — no pagination scraping needed
 * - Each detail page is server-rendered; load with puppeteer (stealth) and
 *   walk the spec tables to pull battery / range / motor / drive
 * - Dedupe by make+model keeping the newest (highest sitemap ID, which is
 *   roughly chronological on ev-database.org)
 *
 * Run locally; not in prebuild (no Chromium on Vercel build infra).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import puppeteer, { type Browser } from "puppeteer-core";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(PROJECT_ROOT, "src", "data", "ev-specs.json");
const SITEMAP_URL = "https://ev-database.org/sitemap.xml";
// ev-database.org rate-limits aggressively (HTTP 429) at higher concurrency.
// Tuned for politeness: 2 workers + per-request delay keeps us well under
// their limit while still finishing 1339 URLs in ~45 minutes.
const CONCURRENCY = 2;
const PER_REQUEST_DELAY_MS = 400;
// Restart the browser every N pages so it doesn't accumulate memory/handles
// and crash with ConnectionClosedError. Empirically the browser starts
// faltering around page 40-100 — 40 keeps us well clear of crashes.
const BROWSER_RESTART_EVERY = 40;

interface EvSpec {
  make: string;
  model: string;
  batteryKwh: number;
  rangeWltp: number;
  chargeFast: string;
  chargeSlow: string;
  motorKw: number;
  driveType: string;
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

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>(https:\/\/ev-database\.org\/car\/[^<]+)<\/loc>/g)].map(
    (m) => m[1],
  );
  // Global URLs work even for cars without UK pricing pages; range still
  // gets displayed in miles via the page's locale handling.
  return [...new Set(urls)];
}

function parseArgs(): { limit: number | null } {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : null;
  return { limit };
}

// Translate ev-database's drive labels to the existing schema's RWD/FWD/AWD.
function mapDriveType(raw: string): string {
  const v = raw.toLowerCase();
  if (v.includes("all") || v.includes("4wd") || v.includes("awd")) return "AWD";
  if (v.includes("front")) return "FWD";
  if (v.includes("rear")) return "RWD";
  return raw.toUpperCase();
}

async function scrapeOne(
  browser: Browser,
  url: string,
): Promise<EvSpec | { url: string; error: string }> {
  if (!browser.connected) return { url, error: "browser disconnected" };
  let page;
  try {
    page = await browser.newPage();
  } catch (e) {
    return { url, error: `newPage failed: ${(e as Error).message}` };
  }
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

    // Retry on 429 with exponential backoff (max 3 tries).
    let resp = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      resp = await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
      if (!resp) break;
      if (resp.status() !== 429) break;
      const backoffMs = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s
      await new Promise((r) => setTimeout(r, backoffMs));
    }
    if (!resp || resp.status() >= 400) {
      return { url, error: `HTTP ${resp?.status() ?? "n/a"}` };
    }

    // Return raw rows; do the label matching in Node to avoid esbuild's
    // __name helper getting injected into the browser context (tsx ships
    // arrow functions inside page.evaluate with a name helper that isn't
    // defined in the page's window scope).
    const data: {
      h1: string;
      ogTitle: string;
      rows: Array<{ label: string; value: string }>;
    } = await page.evaluate(function extractRows() {
      const h1 = (document.querySelector("h1")?.textContent || "").trim();
      const og =
        document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
      const out: Array<{ label: string; value: string }> = [];
      const trs = document.querySelectorAll("tr");
      for (let i = 0; i < trs.length; i++) {
        const cells = trs[i].querySelectorAll("td, th");
        if (cells.length >= 2) {
          const label = (cells[0].textContent || "").trim().replace(/\s+/g, " ");
          const value = (cells[1].textContent || "").trim().replace(/\s+/g, " ");
          if (label && value) out.push({ label, value });
        }
      }
      return { h1: h1, ogTitle: og, rows: out };
    });

    const findRow = (re: RegExp): string | null => {
      const row = data.rows.find((r) => re.test(r.label));
      return row ? row.value : null;
    };

    const useableCapacity = findRow(/^useable capacity\*?$/i);
    const electricRange = findRow(/^electric range\b/i) || findRow(/^range\s*\*?$/i);
    const totalPower = findRow(/^total power/i);
    const drive = findRow(/^drive$/i) || findRow(/^drivetrain$/i);
    // AC charging — labels may carry trailing †/* footnote markers.
    const chargePowerAc = findRow(/^charge power[\s†*]*$/i);
    const chargeTimeAc = findRow(/^charge time \(0->/i);
    // DC fast charging — units can be km or mi depending on locale of detail
    // page. Require non-zero start so the AC row (which starts with `(0->`)
    // doesn't get picked up as DC.
    const chargePowerDcMax = findRow(/^charge power \(max\)[\s†*]*$/i);
    const chargeTimeDc =
      findRow(/^charge time \([1-9]\d*->\d+\s*(?:mi|km)\)[\s†*]*$/i) ||
      findRow(/^charge time \(10-80%\)/i);

    // Parse numeric / text values
    const batteryKwh = useableCapacity
      ? parseFloat(useableCapacity.match(/[\d.]+/)?.[0] || "0")
      : 0;
    // electricRange might be in km (global ev-database pages) or miles (UK
    // locale pages). Detect and convert to miles for schema consistency.
    let rangeWltp = 0;
    if (electricRange) {
      const num = parseInt(electricRange.match(/\d+/)?.[0] || "0", 10);
      const isKm = /km/i.test(electricRange);
      rangeWltp = isKm ? Math.round(num * 0.621371) : num;
    }
    const motorKw = totalPower
      ? parseInt(totalPower.match(/(\d+)\s*kW/)?.[1] || "0", 10)
      : 0;
    const driveType = drive ? mapDriveType(drive) : "";

    // chargeSlow: combine AC charge time + power
    const chargeSlow =
      chargeTimeAc && chargePowerAc
        ? `${chargeTimeAc} (${chargePowerAc})`
        : chargeTimeAc || "";

    // chargeFast: DC fast charge time + max power
    const chargeFast =
      chargeTimeDc && chargePowerDcMax
        ? `${chargeTimeDc} (${chargePowerDcMax})`
        : chargeTimeDc || "";

    // Make + model from og:title (e.g. "BYD ATTO 3 (MY25)" → make=BYD, model=ATTO 3 (MY25))
    // Use the URL slug as a more reliable source: /uk/car/3192/BYD-ATTO-3
    const slugMatch = url.match(/\/car\/\d+\/([^/?#]+)/);
    let make = "";
    let model = "";
    if (slugMatch) {
      const slug = slugMatch[1].replace(/-/g, " ");
      // First "word" is typically the make. Use a curated set for multi-word
      // makes so they don't get split.
      const multiWordMakes = [
        "ALFA ROMEO",
        "ASTON MARTIN",
        "DS AUTOMOBILES",
        "LAND ROVER",
        "MERCEDES BENZ",
        "MERCEDES-BENZ",
        "MG MOTOR",
        "ROLLS ROYCE",
      ];
      const upper = slug.toUpperCase();
      const multi = multiWordMakes.find((m) => upper.startsWith(m));
      if (multi) {
        // Canonicalise to UK/DVLA spelling — "DS AUTOMOBILES" becomes "DS"
        // since UK reg lookups use the short brand name.
        make = multi
          .replace("MERCEDES BENZ", "MERCEDES-BENZ")
          .replace("DS AUTOMOBILES", "DS");
        model = upper.substring(multi.length).trim();
      } else {
        const parts = slug.split(" ");
        make = parts[0].toUpperCase();
        model = parts.slice(1).join(" ").toUpperCase();
      }
    }

    if (!make || !model || batteryKwh === 0 || rangeWltp === 0) {
      return {
        url,
        error: `incomplete — make=${!!make} model=${!!model} battery=${batteryKwh} range=${rangeWltp}`,
      };
    }

    return {
      make,
      model,
      batteryKwh,
      rangeWltp,
      chargeFast,
      chargeSlow,
      motorKw,
      driveType,
    };
  } catch (e) {
    return { url, error: (e as Error).message };
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
  urls: string[],
  concurrency: number,
): Promise<{ specs: EvSpec[]; errors: { url: string; error: string }[] }> {
  const specs: EvSpec[] = [];
  const errors: { url: string; error: string }[] = [];
  const total = urls.length;
  let done = 0;

  // Process in batches; restart the browser between batches to keep
  // memory bounded. Each batch internally uses `concurrency` workers.
  for (let batchStart = 0; batchStart < urls.length; batchStart += BROWSER_RESTART_EVERY) {
    const batch = urls.slice(batchStart, batchStart + BROWSER_RESTART_EVERY);
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
            result = { url: batch[idx], error: (e as Error).message };
          }
          if ("make" in result) {
            specs.push(result);
          } else {
            errors.push(result);
          }
          done++;
          // Polite delay between requests to avoid 429s
          await new Promise((r) => setTimeout(r, PER_REQUEST_DELAY_MS));
          if (done % 20 === 0 || done === total) {
            const pct = Math.floor((done / total) * 100);
            process.stdout.write(
              `\r  progress: ${done}/${total} (${pct}%) — ${specs.length} parsed · ${errors.length} errors`,
            );
          }
        }
      }
      await Promise.all(Array.from({ length: concurrency }, () => worker()));
    } finally {
      try {
        await browser.close();
      } catch {
        /* ignore — browser may have crashed */
      }
    }
  }
  process.stdout.write("\n");
  return { specs, errors };
}

function dedupe(specs: EvSpec[], urlOrderByMake: Map<string, number>): EvSpec[] {
  // Group by make+model, keep the entry from the highest sitemap-ID URL (newest model year on ev-database.org).
  const map = new Map<string, { spec: EvSpec; order: number }>();
  for (const s of specs) {
    const key = `${s.make}|${s.model}`;
    const order = urlOrderByMake.get(key) ?? 0;
    const existing = map.get(key);
    if (!existing || order > existing.order) {
      map.set(key, { spec: s, order });
    }
  }
  return Array.from(map.values())
    .map((e) => e.spec)
    .sort((a, b) =>
      a.make === b.make ? a.model.localeCompare(b.model) : a.make.localeCompare(b.make),
    );
}

async function main() {
  const { limit } = parseArgs();
  console.log("Fetching ev-database.org sitemap…");
  const allUrls = await fetchSitemapUrls();
  // Sitemap URLs sorted by ID (ascending = older). Reverse so newest first
  // — useful for dedupe (first occurrence wins by sitemap order).
  const sortedUrls = [...allUrls].sort((a, b) => {
    const idA = parseInt(a.match(/\/car\/(\d+)/)?.[1] || "0", 10);
    const idB = parseInt(b.match(/\/car\/(\d+)/)?.[1] || "0", 10);
    return idB - idA;
  });
  const urls = limit ? sortedUrls.slice(0, limit) : sortedUrls;
  console.log(`Found ${allUrls.length} EV URLs${limit ? ` (limited to ${limit})` : ""}\n`);

  console.log(`Scraping with concurrency=${CONCURRENCY}, browser restart every ${BROWSER_RESTART_EVERY} pages…`);
  const { specs, errors } = await scrapeAll(urls, CONCURRENCY);

  // Build URL-order map for tiebreaking dedupe (higher ID = newer)
  const urlOrderByMake = new Map<string, number>();
  for (const s of specs) {
    const matchUrl = urls.find((u) => {
      const slug = u.match(/\/car\/\d+\/([^/?#]+)/)?.[1] || "";
      return slug.toUpperCase().replace(/-/g, " ").includes(`${s.make} ${s.model}`);
    });
    const id = matchUrl ? parseInt(matchUrl.match(/\/car\/(\d+)/)?.[1] || "0", 10) : 0;
    const key = `${s.make}|${s.model}`;
    if (!urlOrderByMake.has(key) || urlOrderByMake.get(key)! < id) {
      urlOrderByMake.set(key, id);
    }
  }

  const deduped = dedupe(specs, urlOrderByMake);

  console.log(`\nSummary:`);
  console.log(`  Pages scraped:    ${urls.length}`);
  console.log(`  Successful:       ${specs.length}`);
  console.log(`  Errors:           ${errors.length}`);
  console.log(`  Unique make+model: ${deduped.length}`);

  if (limit) {
    console.log(`\n--- Sample output (--limit=${limit}) ---`);
    for (const s of deduped.slice(0, 10)) {
      console.log(JSON.stringify(s));
    }
    console.log(`\n(not writing to ${OUT_PATH} — limit mode)`);
  } else {
    fs.writeFileSync(OUT_PATH, JSON.stringify(deduped, null, 2) + "\n");
    console.log(`\n✓ Wrote ${deduped.length} EV specs → ${OUT_PATH}`);
  }

  if (errors.length && errors.length < 20) {
    console.log(`\nErrors (sample):`);
    for (const e of errors.slice(0, 10)) {
      console.log(`  ${e.error.slice(0, 70)} — ${e.url}`);
    }
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
