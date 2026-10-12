import { existsSync } from "node:fs";
import type { Browser } from "puppeteer-core";

// HTML → PDF with headless Chromium. On Vercel (Linux) it uses the serverless
// build from @sparticuz/chromium; locally, an installed Chrome-family browser
// (or CHROME_PATH). The browser is launched once per function instance and
// reused, so warm requests skip the ~1-2s launch.
//
// Locked down: the page renders with JavaScript disabled and every network
// request aborted except data: URIs (the template inlines its fonts), so a
// value that slipped past escaping still couldn't run script or reach out.

const LOCAL_BROWSERS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

let browserPromise: Promise<Browser> | null = null;

async function launch(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default;
  // A real Vercel deployment is Linux with VERCEL_URL set. Don't trust VERCEL
  // or VERCEL_ENV alone: `vercel env pull` writes both into .env.local.
  const onVercel = process.platform === "linux" && Boolean(process.env.VERCEL_URL);
  const local = process.env.CHROME_PATH ?? (onVercel ? undefined : LOCAL_BROWSERS.find((p) => existsSync(p)));
  if (local) {
    return puppeteer.launch({ executablePath: local, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  }
  const chromium = (await import("@sparticuz/chromium")).default;
  chromium.setGraphicsMode = false; // no WebGL needed for a document
  return puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    executablePath: await chromium.executablePath(),
    headless: "shell",
  });
}

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    if (b && b.connected) return b;
  }
  browserPromise = launch();
  return browserPromise;
}

export async function renderPdf(html: string): Promise<Uint8Array> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (req.url().startsWith("data:")) void req.continue();
      else void req.abort();
    });
    await page.setContent(html, { waitUntil: "load", timeout: 20_000 });
    await page.evaluateHandle("document.fonts.ready").catch(() => undefined);
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, timeout: 30_000 });
  } finally {
    await page.close().catch(() => undefined);
  }
}
