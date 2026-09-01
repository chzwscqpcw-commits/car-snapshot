/**
 * Fetches EV specs from ev-database.org and writes src/data/ev-specs.json.
 *
 * Usage:
 *   npx tsx scripts/fetch-ev-specs.ts                      # default 40min budget
 *   npx tsx scripts/fetch-ev-specs.ts --budget-minutes=8   # one CI slice
 *   npx tsx scripts/fetch-ev-specs.ts --limit=10           # test on first 10
 *
 * INCREMENTAL. A full pass over ~1,339 URLs takes ~45 minutes at the polite
 * rate below, which does not fit a CI step — and the old all-or-nothing write
 * meant a timeout produced NOTHING. It ran green and wrote nothing for 194
 * days. Now each run refreshes the stalest slice within its time budget and
 * writes what it got, so the dataset converges over successive runs. See
 * scripts/lib/incremental-scrape.ts.
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
import {
  Deadline,
  allRecords,
  coverage,
  loadState,
  orderByStaleness,
  parseBudgetMinutes,
  pruneRecords,
  seedFromExisting,
  writeCompactJsonArray,
  saveState,
  upsertRecord,
} from "./lib/incremental-scrape";

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
  deadline: Deadline,
): Promise<{ specs: Array<EvSpec & { url: string }>; errors: { url: string; error: string }[]; stopped: boolean }> {
  const specs: Array<EvSpec & { url: string }> = [];
  const errors: { url: string; error: string }[] = [];
  const total = urls.length;
  let done = 0;
  let stopped = false;

  // Process in batches; restart the browser between batches to keep
  // memory bounded. Each batch internally uses `concurrency` workers.
  for (let batchStart = 0; batchStart < urls.length; batchStart += BROWSER_RESTART_EVERY) {
    // Budget is checked between batches AND between pages, so we stop cleanly
    // with results in hand rather than being killed mid-write.
    if (deadline.expired()) { stopped = true; break; }
    const batch = urls.slice(batchStart, batchStart + BROWSER_RESTART_EVERY);
    const browser = await launchBrowser();
    try {
      let i = 0;
      async function worker() {
        while (true) {
          if (deadline.expired()) { stopped = true; return; }
          const idx = i++;
          if (idx >= batch.length) return;
          let result: Awaited<ReturnType<typeof scrapeOne>>;
          try {
            result = await scrapeOne(browser, batch[idx]);
          } catch (e) {
            result = { url: batch[idx], error: (e as Error).message };
          }
          if ("make" in result) {
            specs.push({ ...result, url: batch[idx] });
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
  return { specs, errors, stopped };
}

const STATE_NAME = "ev-specs";
/** Default when run by hand: long enough for a full pass locally. */
const DEFAULT_BUDGET_MIN = 40;

function evKey(spec: EvSpec): string {
  return `${spec.make}|${spec.model}`;
}

/** ev-database sitemap ids climb over time, so a higher id is a newer entry. */
function sitemapId(url: string): number {
  return parseInt(url.match(/\/car\/(\d+)/)?.[1] || "0", 10);
}

async function main() {
  const { limit } = parseArgs();
  const budgetMinutes = parseBudgetMinutes(DEFAULT_BUDGET_MIN);

  console.log("Fetching ev-database.org sitemap…");
  const allUrls = await fetchSitemapUrls();
  // Newest first, so a first-ever run covers current models before old ones.
  const sortedUrls = [...allUrls].sort((a, b) => sitemapId(b) - sitemapId(a));
  console.log(`Found ${allUrls.length} EV URLs`);

  if (limit) {
    // Limit mode stays a pure dry run — no state, no writes.
    const work = sortedUrls.slice(0, limit);
    console.log(`\nLimit mode: scraping ${work.length}, writing nothing.\n`);
    const { specs } = await scrapeAll(work, CONCURRENCY, new Deadline(budgetMinutes));
    for (const sp of specs.slice(0, 10)) console.log(JSON.stringify(sp));
    return;
  }

  const state = loadState<EvSpec>(STATE_NAME);
  // First incremental run: adopt whatever the old all-at-once process left in
  // ev-specs.json, so the site keeps its data while the slices converge
  // instead of collapsing to one budget's worth. See seedFromExisting.
  if (fs.existsSync(OUT_PATH)) {
    const existing = JSON.parse(fs.readFileSync(OUT_PATH, "utf-8")) as EvSpec[];
    const seeded = seedFromExisting(state, existing, evKey);
    if (seeded) console.log(`  seeded ${seeded} existing records from ${path.basename(OUT_PATH)}`);
  }
  const before = coverage(sortedUrls, state);
  console.log(
    `  state: ${before.known} known · ${before.unknown} never scraped` +
      (before.oldest ? ` · oldest ${before.oldest.slice(0, 10)}` : ""),
  );

  // Stalest first: never-scraped, then oldest.
  const work = orderByStaleness(sortedUrls, state);
  console.log(
    `\nScraping up to ${work.length} pages with a ${budgetMinutes}-minute budget ` +
      `(concurrency=${CONCURRENCY}, browser restart every ${BROWSER_RESTART_EVERY})…`,
  );

  const deadline = new Deadline(budgetMinutes);
  const { specs, errors, stopped } = await scrapeAll(work, CONCURRENCY, deadline);

  // Merge this slice in. Rank by sitemap id so a partial run can't let an
  // older model year overwrite a newer one just by being scraped later.
  const nowIso = new Date().toISOString();
  for (const sp of specs) {
    const { url, ...record } = sp;
    state.urls[url] = nowIso;
    upsertRecord(state, evKey(record), sitemapId(url), record);
  }
  // Errors split two ways, and getting this wrong quietly breaks convergence.
  //
  // A TRANSIENT failure (429, timeout, dropped connection) means "ask again" —
  // we learned nothing about that URL. Marking it attempted would push it to
  // the back of the staleness queue and, on a run that is entirely rate-limited,
  // would mark the whole slice as done having fetched nothing.
  //
  // A PERMANENT one (a 404, or a page we parsed but that lacks the fields we
  // need) will fail identically next week, so it IS marked — otherwise a
  // handful of broken URLs sit at the front of the queue forever and the rest
  // of the dataset never gets refreshed.
  const isTransient = (msg: string) =>
    /HTTP 429|HTTP 5\d\d|timeout|timed out|ECONN|socket|disconnected|Navigation/i.test(msg);
  let retryable = 0;
  for (const e of errors) {
    if (isTransient(e.error)) retryable++;
    else state.urls[e.url] = nowIso;
  }

  // Prune ONLY after a genuinely complete pass — see pruneRecords.
  const attempted = specs.length + errors.length;
  let pruned = 0;
  if (!stopped && retryable === 0 && attempted >= work.length) {
    const liveKeys = new Set(Object.keys(state.records));
    for (const sp of specs) liveKeys.add(evKey(sp));
    pruned = pruneRecords(state, liveKeys);
  }

  const out = allRecords(state).sort((a, b) =>
    a.make === b.make ? a.model.localeCompare(b.model) : a.make.localeCompare(b.make),
  );
  writeCompactJsonArray(OUT_PATH, out);
  saveState(STATE_NAME, state);

  const after = coverage(sortedUrls, state);
  console.log(`\nSummary:`);
  console.log(`  Pages this run:    ${attempted} (${specs.length} parsed · ${errors.length} errors, ${retryable} retryable)`);
  console.log(`  Stopped on budget: ${stopped ? "yes" : "no — full pass"}`);
  console.log(`  Coverage:          ${after.known}/${sortedUrls.length} URLs seen · ${after.unknown} still never scraped`);
  if (pruned) console.log(`  Pruned:            ${pruned} delisted`);
  console.log(`\n✓ Wrote ${out.length} EV specs → ${OUT_PATH}`);

  if (errors.length && errors.length < 20) {
    console.log(`\nErrors (sample):`);
    for (const e of errors.slice(0, 10)) console.log(`  ${e.error.slice(0, 70)} — ${e.url}`);
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
