/**
 * Take iPhone-viewport screenshots of every page we touched today, so I can
 * visually inspect each one for layout issues.
 */
import { existsSync, mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

function resolveChrome(): string {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  ];
  for (const p of candidates) if (existsSync(p)) return p;
  throw new Error("No Chromium");
}

const OUT_DIR = "/tmp/mobile-screenshots";
const BASE = "https://www.freeplatecheck.co.uk";

// iPhone 14 Pro: 393x852 viewport. Screenshot the *full* page (not just
// what's in viewport) so we can scan the whole thing in one image.
async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: resolveChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true });
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );

    const paths = [
      "/",
      "/mot-check",
      "/car-check",
      "/tax-check",
      "/mileage-check",
      "/ulez-check",
      "/recall-check",
      "/car-valuation",
      "/mot-reminder",
      "/servicing",
      "/running-costs",
    ];

    for (const path of paths) {
      const url = `${BASE}${path}`;
      const label = (path === "/" ? "home" : path.replace(/^\//, "")).replace(/\//g, "_");
      console.log(`📸  ${label}`);
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        // Brief settle
        await new Promise((r) => setTimeout(r, 800));
        await page.screenshot({
          path: `${OUT_DIR}/${label}.png` as `${string}.png`,
          fullPage: true,
        });
      } catch (e) {
        console.error(`  failed: ${(e as Error).message}`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
