/**
 * Bulk-download VCA Car Fuel Data ZIPs from the official archive, extract the
 * CSV from each, and write them to ./vca-csvs/ ready for process-fuel-data.ts.
 *
 * Usage:
 *   npx tsx scripts/fetch-vca-archive.ts             # all years (2000+, default)
 *   npx tsx scripts/fetch-vca-archive.ts --recent    # 2018+ only
 *   npx tsx scripts/fetch-vca-archive.ts 2024 2025   # specific year tags
 *
 * Why this exists:
 * VCA's downloads page is JavaScript-driven and 302-redirects anyone who
 * tries to hit the URLs cold. We open a headless browser to warm the ASP.NET
 * session cookie, then fetch the ZIPs directly with that cookie.
 *
 * Each ZIP contains one CSV named "data for guide <tag>.csv" — we extract,
 * rename to "<tag>.csv", and place in ./vca-csvs/. Then run:
 *   npx tsx scripts/process-fuel-data.ts vca-csvs/*.csv
 */
import { existsSync, mkdirSync, writeFileSync, readdirSync, statSync, copyFileSync, rmSync } from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import puppeteer, { type Page } from "puppeteer-core";

function resolveChrome(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const p of candidates) if (existsSync(p)) return p;
  throw new Error("No Chromium-based browser found. Install Chrome/Brave/Edge or set CHROME_PATH.");
}

const BASE = "https://carfueldata.vehicle-certification-agency.gov.uk";
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "vca-csvs");
const TMP_ZIP_DIR = "/tmp/vca-zips";

// Year tags as VCA hosts them. The recon script pulled these from the live
// downloads + archive pages on 2026-05-20.
const ALL_YEAR_TAGS = [
  "july2000", "jan2001", "july2001",
  "may2002", "may2003", "may2004", "may2005", "may2006", "may2007", "may2008", "may2009", "may2010",
  "aug2011", "aug2012", "aug2013", "aug2014", "aug2015", "aug2016", "aug2017",
  "sept2018",
  "2019", "2020", "2021", "2022", "2023", "2024", "2025",
  "latest", // currently maps to 2026 partial year
];

// Recent-only set (handy for quick refreshes when older data hasn't changed)
const RECENT_YEAR_TAGS = ["sept2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "latest"];

function parseArgs(): string[] {
  const args = process.argv.slice(2);
  if (args.length === 0) return ALL_YEAR_TAGS;
  if (args.includes("--recent")) return RECENT_YEAR_TAGS;
  if (args.includes("--all")) return ALL_YEAR_TAGS;
  // Filter out flags, treat the rest as year tags
  const tags = args.filter((a) => !a.startsWith("--"));
  return tags.length > 0 ? tags : ALL_YEAR_TAGS;
}

async function warmSession(page: Page): Promise<string> {
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  );
  console.log("Warming session…");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 30000 });
  await page.goto(`${BASE}/downloads/default.aspx`, { waitUntil: "networkidle2", timeout: 30000 });
  const cookies = await page.cookies();
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function discoverZipUrl(page: Page, tag: string): Promise<string | null> {
  const interstitial = `${BASE}/downloads/download.aspx?rg=${tag}`;
  await page.goto(interstitial, { waitUntil: "networkidle2", timeout: 30000 });
  const zipPath = await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll("a")).find((a) =>
      /\.zip$/i.test(a.getAttribute("href") || ""),
    );
    return a ? a.getAttribute("href") : null;
  });
  if (!zipPath) return null;
  return zipPath.startsWith("http") ? zipPath : `${BASE}${zipPath}`;
}

async function downloadZip(
  url: string,
  cookieHeader: string,
  referer: string,
  destPath: string,
): Promise<number> {
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader,
      Referer: referer,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("zip")) throw new Error(`Unexpected content-type: ${ct}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return buf.length;
}

function extractCsv(zipPath: string, outDir: string, tagLabel: string): string | null {
  // Use shell `unzip` — available on macOS by default.
  const extractDir = path.join(TMP_ZIP_DIR, `extract-${tagLabel}`);
  if (existsSync(extractDir)) rmSync(extractDir, { recursive: true, force: true });
  mkdirSync(extractDir, { recursive: true });
  try {
    execSync(`unzip -q "${zipPath}" -d "${extractDir}"`, { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    console.error(`  unzip failed for ${zipPath}:`, (e as Error).message);
    return null;
  }
  // Find the largest .csv inside (sometimes there are extras like environmental labels)
  const files = readdirSync(extractDir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".csv"))
    .map((d) => path.join(d.parentPath, d.name));
  if (files.length === 0) {
    console.error(`  no CSV found inside ${zipPath}`);
    return null;
  }
  const largest = files.sort((a, b) => statSync(b).size - statSync(a).size)[0];
  const destPath = path.join(outDir, `${tagLabel}.csv`);
  copyFileSync(largest, destPath);
  return destPath;
}

async function main() {
  const tags = parseArgs();
  console.log(`Will download ${tags.length} year tag(s): ${tags.join(", ")}\n`);

  // Prepare directories
  for (const dir of [OUT_DIR, TMP_ZIP_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: resolveChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const summary: { tag: string; bytes: number; csvPath: string | null; error?: string }[] = [];

  try {
    const page = await browser.newPage();
    const cookieHeader = await warmSession(page);

    for (const tag of tags) {
      const interstitial = `${BASE}/downloads/download.aspx?rg=${tag}`;
      console.log(`  ${tag}: discovering ZIP URL…`);
      try {
        const zipUrl = await discoverZipUrl(page, tag);
        if (!zipUrl) {
          console.log(`    skipped (no ZIP link found on page)`);
          summary.push({ tag, bytes: 0, csvPath: null, error: "no zip link" });
          continue;
        }
        console.log(`    ${zipUrl}`);
        const zipPath = path.join(TMP_ZIP_DIR, `${tag}.zip`);
        const bytes = await downloadZip(zipUrl, cookieHeader, interstitial, zipPath);
        console.log(`    downloaded ${(bytes / 1024).toFixed(0)} KB`);
        const csvPath = extractCsv(zipPath, OUT_DIR, tag);
        if (csvPath) {
          const sizeKb = (statSync(csvPath).size / 1024).toFixed(0);
          console.log(`    extracted ${path.basename(csvPath)} (${sizeKb} KB)`);
        }
        summary.push({ tag, bytes, csvPath });
      } catch (e) {
        console.error(`    ERROR: ${(e as Error).message}`);
        summary.push({ tag, bytes: 0, csvPath: null, error: (e as Error).message });
      }
    }
  } finally {
    await browser.close();
  }

  console.log("\n--- Summary ---");
  for (const s of summary) {
    const status = s.csvPath ? "✓" : "✗";
    const detail = s.error ? `(${s.error})` : `${(s.bytes / 1024).toFixed(0)} KB`;
    console.log(`  ${status} ${s.tag.padEnd(10)} ${detail}`);
  }

  const csvs = summary.filter((s) => s.csvPath).map((s) => s.csvPath as string);
  console.log(`\n${csvs.length}/${summary.length} CSVs extracted to ${OUT_DIR}/`);
  if (csvs.length > 0) {
    console.log(`\nNext step:`);
    console.log(`  npx tsx scripts/process-fuel-data.ts vca-csvs/*.csv`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
