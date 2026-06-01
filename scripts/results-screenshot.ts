/**
 * Drive the homepage at iPhone viewport, submit a reg, screenshot the full
 * results page. The placeholder-cycle plates in src/app/page.tsx are good
 * candidates — they're real-looking UK plates.
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

    // Try a few candidate plates — first one that returns real data wins
    const candidatePlates = ["P7 SJG"];

    for (const plate of candidatePlates) {
      console.log(`\nTrying ${plate}…`);
      await page.goto(BASE, { waitUntil: "networkidle2", timeout: 30000 });
      // The reg input has placeholder "AB12 CDE" (or a cycled real plate).
      // The command palette input has placeholder "Search anything…⌘K" —
      // we need to skip past it. Find the input with the reg-plate style.
      const focused = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
        const regInput = inputs.find((i) => {
          const ph = (i.placeholder || "").trim();
          return /^[A-Z]{1,2}\d{1,2}\s?[A-Z]{1,3}$/i.test(ph);
        });
        if (regInput) {
          regInput.focus();
          return regInput.placeholder;
        }
        return null;
      });
      if (!focused) {
        console.log("  reg-plate input not found, skipping");
        continue;
      }
      console.log(`  focused reg input (placeholder=${focused})`);
      // Capture every request after we submit so we can see what the page asked for
      const requestLog: string[] = [];
      page.on("request", (req) => {
        const url = req.url();
        if (url.includes("/api/")) requestLog.push(`${req.method()} ${url}`);
      });
      await page.keyboard.type(plate.replace(/\s/g, ""), { delay: 80 });
      // Press Enter to submit (page.tsx line ~3315 has Enter handler)
      await page.keyboard.press("Enter");
      // brief wait then check what state the page is in
      await new Promise((r) => setTimeout(r, 4000));
      console.log(`  network calls after submit:`);
      for (const r of requestLog.slice(0, 10)) console.log(`    ${r}`);
      const pageState = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
        const regInput = inputs.find((i) => /^[A-Z]{1,2}\d/i.test((i.placeholder || "").trim()) || i.value.length >= 5);
        return { regInputValue: regInput?.value ?? null, bodyTextSnippet: (document.body.textContent || "").slice(0, 200) };
      });
      console.log(`  reg input value: ${pageState.regInputValue}`);
      console.log(`  body start: ${pageState.bodyTextSnippet.replace(/\s+/g, " ")}`);

      // Wait for the data fetches: DVLA, MOT, valuation, recalls, fuel
      // economy, running costs, NCAP, etc. Network may queue several.
      await new Promise((r) => setTimeout(r, 30000));
      // Scroll back to top before screenshot
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise((r) => setTimeout(r, 500));

      // Save several screenshots at different scroll positions so we can
      // see each section at a readable resolution. Full-page would be ~26k
      // tall and unreadable when displayed scaled-down.
      const label = plate.replace(/\s/g, "");
      const viewportHeight = 852;
      const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      console.log(`  total page height: ${totalHeight}px`);

      // First pass: scroll slowly through the entire page so IntersectionObserver-
      // gated content (DataReveal fade-ins) gets triggered. Without this the
      // screenshots capture empty placeholders where lazy content hasn't shown.
      const slowStep = 250;
      for (let y = 0; y < totalHeight; y += slowStep) {
        await page.evaluate((sy: number) => window.scrollTo(0, sy), y);
        await new Promise((r) => setTimeout(r, 120));
      }
      // Scroll back to top, wait for any final settle
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise((r) => setTimeout(r, 800));
      // Re-check the height (may have grown if reveals injected content)
      const finalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      console.log(`  height after reveal pass: ${finalHeight}px`);

      // Take a screenshot every viewport-height worth of scroll
      const screenshots: string[] = [];
      const step = viewportHeight - 80;
      for (let i = 0, scrollY = 0; scrollY < finalHeight; i++, scrollY += step) {
        await page.evaluate((y: number) => window.scrollTo(0, y), scrollY);
        await new Promise((r) => setTimeout(r, 350));
        const path = `${OUT_DIR}/results-${label}-${String(i).padStart(2, "0")}.png` as `${string}.png`;
        await page.screenshot({ path, fullPage: false });
        screenshots.push(path);
      }
      console.log(`  ✓ saved ${screenshots.length} viewport screenshots`);
      break;
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
