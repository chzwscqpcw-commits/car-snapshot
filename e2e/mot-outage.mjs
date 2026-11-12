// End-to-end check of the valuation during an MOT service outage.
//
// On 8–9 Nov 2026 the DVSA MOT history call failed for 21.5 hours. A car's
// model comes from its MOT record, so the valuation had nothing to start from
// and vanished from /value-my-car and the homepage while the selling offers
// stayed. The unit test (scripts/test-mot-outage.tsx) pins the pieces; this
// drives a real browser through both surfaces, because the homepage has its
// own inline valuation that no component test reaches.
//
//   npm run build && npx next start -p 3123   (in one shell)
//   npm run test:e2e                          (in another)
//
// Same rules as plate-flow.mjs: /api/lookup is answered from the fixture with
// its MOT half removed (what the route returns when the MOT call fails), the
// market-comparables call is answered empty, /api/event is answered locally
// and every off-site request is blocked. No real lookup, no partner click.
//
// Env: E2E_BASE_URL (default http://localhost:3123), CHROME_PATH,
// E2E_SHOTS (a directory: save a screenshot of each state there).

import { readFileSync, existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = (process.env.E2E_BASE_URL ?? "http://localhost:3123").replace(/\/$/, "");
const SHOTS = process.env.E2E_SHOTS;
const PLATE = "AB12CDE";

const full = JSON.parse(readFileSync(new URL("./fixtures/lookup-AB12CDE.json", import.meta.url), "utf8"));
/** The fixture as /api/lookup returns it when DVLA answered and MOT did not. */
function motDown({ knownModel }) {
  const { motTests: _t, motStatus: _s, motExpiryDate: _e, model, variant: _v, ...dvlaOnly } = full.data;
  return JSON.stringify({ ...full, motSource: "dvla", data: { ...dvlaOnly, ...(knownModel ? { model } : {}), motUnavailable: true } });
}
const NO_COMPARABLES = JSON.stringify({
  ebayMedian: null, ebayQ1Price: null, ebayQ3Price: null, ebayListingCount: 0, ebayMinPrice: null, ebayMaxPrice: null,
  ebayTotalListings: null, ebayDominantTransmission: null, ebayDominantBodyType: null, ebayYearWidened: false,
  ebayYearTolerance: null, cacheMedian: null, cacheEntryCount: 0, marketcheckMedian: null, marketcheckQ1: null,
  marketcheckQ3: null, marketcheckListingCount: 0, marketcheckSource: null, sources: [],
});

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
].filter(Boolean);
const chrome = CHROME_PATHS.find((p) => existsSync(p));
if (!chrome) {
  console.error("No Chrome found — set CHROME_PATH.");
  process.exit(1);
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });

let failures = 0;
function report(name, ok, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗"} ${name}${!ok && detail ? `  — ${detail}` : ""}`);
}

/** Mileage params sent to the comparables API (it files them as MOT readings). */
const mileageSent = [];
/** Bodies posted to the report renderer (answered 404, as when it is switched off). */
const reportPosts = [];

async function newPage(lookupBody) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 900 });
  await page.setUserAgent(UA);
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (!url.startsWith(BASE)) {
      if (url.startsWith("data:") || url.startsWith("blob:")) return req.continue();
      return req.abort();
    }
    const u = new URL(url);
    if (u.pathname === "/api/lookup") return req.respond({ status: 200, contentType: "application/json", body: lookupBody });
    if (u.pathname === "/api/valuation") {
      if (u.searchParams.has("mileage")) mileageSent.push(u.searchParams.get("mileage"));
      return req.respond({ status: 200, contentType: "application/json", body: NO_COMPARABLES });
    }
    if (u.pathname === "/api/event") return req.respond({ status: 204 });
    if (u.pathname === "/api/report-pdf") {
      try { reportPosts.push(JSON.parse(req.postData() ?? "{}")); } catch { reportPosts.push({}); }
      return req.respond({ status: 404, contentType: "text/plain", body: "Not found" });
    }
    return req.continue();
  });
  return page;
}

async function until(page, fn, timeout = 15000, ...args) {
  try {
    await page.waitForFunction(fn, { timeout, polling: 200 }, ...args);
    return true;
  } catch {
    return false;
  }
}

async function shot(page, name) {
  if (!SHOTS) return;
  // The homepage reveals sections as they scroll into view; show them all.
  await page.addStyleTag({ content: "*{animation-duration:0s!important;transition-duration:0s!important}" });
  const el = await page.$("[data-mot-outage-notice]");
  if (el) await el.evaluate((n) => window.scrollTo(0, n.getBoundingClientRect().top + window.scrollY - 80));
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

const hasNotice = () => !!document.querySelector("[data-mot-outage-notice]");
const text = () => document.body.innerText;

async function check(name, lookupBody, fn) {
  let page;
  try {
    page = await newPage(lookupBody);
    await fn(page);
  } catch (err) {
    report(name, false, err instanceof Error ? err.message : String(err));
  } finally {
    await page?.close().catch(() => {});
  }
}

// 1. /value-my-car, a car we have looked up before: the model survives, so
//    the valuation renders at once, with the explanation above it.
await check("tool, known model", motDown({ knownModel: true }), async (page) => {
  await page.goto(`${BASE}/value-my-car#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  const shown = await until(page, () => !!document.querySelector("[data-mot-outage-notice]") && /Estimated market value/i.test(document.body.innerText));
  const body = await page.evaluate(text);
  report("value-my-car: a valuation renders with the MOT service down", shown && /£\d/.test(body.split(/Estimated market value/i)[1] ?? ""));
  report("value-my-car: says MOT history is temporarily unavailable", /MOT history is temporarily unavailable/i.test(body));
  report("value-my-car: says the mileage is estimated from the car's age", await page.evaluate(() => !!document.querySelector("[data-mileage-estimated]")));
  report("value-my-car: explanation comes before the figure", body.search(/MOT history is temporarily unavailable/i) < body.search(/Estimated market value/i));
  report("value-my-car: confidence is not stated as high", !/High confidence/i.test(body));
  report("value-my-car: the estimate is not filed as an MOT reading", mileageSent.length === 0, mileageSent.join(","));
  await shot(page, "tool-known-model");

  // The visitor corrects the mileage: the note changes to say so.
  await page.click("#exact-mileage", { clickCount: 3 });
  await page.type("#exact-mileage", "51000");
  const corrected = await until(page, () => /uses the mileage you entered/i.test(document.body.innerText) && !document.querySelector("[data-mileage-estimated]"));
  report("value-my-car: the visitor can correct the mileage", corrected);
});

// 2. /value-my-car, a car we have never seen: no model, so ask for it.
await check("tool, unknown model", motDown({ knownModel: false }), async (page) => {
  await page.goto(`${BASE}/value-my-car#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  const asked = await until(page, () => !!document.querySelector("[data-mot-outage-notice] select"));
  const before = await page.evaluate(text);
  report("value-my-car (new car): explains and asks for the model", asked && /MOT history is temporarily unavailable/i.test(before));
  report("value-my-car (new car): no figure and no selling offer until then", !/Estimated market value/i.test(before) && !/we buy any car/i.test(before) && !/carvertical/i.test(before));
  await shot(page, "tool-asks-model");

  await page.select("[data-mot-outage-notice] select", "ASTRA");
  const valued = await until(page, () => /Estimated market value/i.test(document.body.innerText) && /as you told us/i.test(document.body.innerText));
  report("value-my-car (new car): choosing the model produces a valuation", valued && /£\d/.test(((await page.evaluate(text)).split(/Estimated market value/i)[1] ?? "")));
  await shot(page, "tool-after-model");
});

// 3. The homepage has its own inline valuation. Same outage, same answers.
await check("homepage, unknown model", motDown({ knownModel: false }), async (page) => {
  await page.goto(`${BASE}/#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  const asked = await until(page, () => !!document.querySelector("[data-mot-outage-notice] select"), 20000);
  const before = await page.evaluate(text);
  report("homepage: says MOT history is unavailable near the top", await page.evaluate(() => !!document.querySelector("[data-mot-outage-banner]")));
  report("homepage: explains and asks for the model", asked);
  report(
    "homepage: no valuation and no selling offer until then",
    !/Estimated Value/.test(before) && !/we buy any car/i.test(before) && !(await page.evaluate(() => !!document.querySelector("[data-money-seller]"))),
  );
  await shot(page, "home-asks-model");

  await page.select("[data-mot-outage-notice] select", "ASTRA");
  const valued = await until(page, () => /Estimated Value/.test(document.body.innerText) && /assumes typical mileage for its age/i.test(document.body.innerText));
  report("homepage: choosing the model produces a valuation, with the mileage caveat", valued);
  report("homepage: confidence is not stated as high", !/High confidence/i.test(await page.evaluate(text)));
  report("homepage: the offers return with the valuation", await page.evaluate(() => !!document.querySelector("[data-money-seller]")));
  await shot(page, "home-after-model");

  await page.type('[data-mot-outage-notice] input[inputmode="numeric"]', "51000");
  report("homepage: the visitor can correct the mileage", await until(page, () => /uses the mileage you entered/i.test(document.body.innerText)));
});

await check("homepage, known model", motDown({ knownModel: true }), async (page) => {
  await page.goto(`${BASE}/#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  const valued = await until(page, () => !!document.querySelector("[data-mot-outage-notice]") && /Estimated Value/.test(document.body.innerText), 20000);
  report("homepage: a car we have seen before is valued at once, with the notice", valued && !(await page.evaluate(() => !!document.querySelector("[data-mot-outage-notice] select"))));
  await shot(page, "home-known-model");
  // No health grade: a quarter of it is the MOT history we don't have.
  const graded = await page.evaluate(() => /Health [A-F]\b/.test(document.body.innerText) || /Vehicle Health Score/.test(document.body.innerText));
  report("homepage: no health grade on missing MOT history, and it says why", !graded && (await page.evaluate(() => !!document.querySelector("[data-health-paused]"))));

  // The PDF report made in this state is told about it, so it can say that
  // MOT history was unavailable and that the valuation assumes typical mileage.
  await page.click('button[aria-controls="report-menu-header"]');
  await page.waitForSelector('#report-menu-header [role="menuitem"]', { timeout: 5000 });
  await page.click('#report-menu-header [role="menuitem"]');
  const start = Date.now();
  while (reportPosts.length === 0 && Date.now() - start < 10000) await new Promise((r) => setTimeout(r, 100));
  const sent = reportPosts[0]?.input;
  report("homepage: the PDF report is told MOT history was unavailable", sent?.data?.motUnavailable === true && !(sent?.data?.motTests?.length > 0));
  report(
    "homepage: the PDF report is told the valuation assumes typical mileage",
    sent?.valuation?.mileageEstimated === true && sent?.valuation?.assumedMileage > 0,
    JSON.stringify(sent?.valuation ?? null).slice(0, 200),
  );
});

// 4. Every other tool says why its MOT data is missing.
await check("mot tool", motDown({ knownModel: true }), async (page) => {
  await page.goto(`${BASE}/mot-check#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  report("mot-check: says MOT history is temporarily unavailable", await until(page, () => !!document.querySelector("[data-mot-outage-banner]")));
});

// 5. And on a normal day none of this appears.
await check("normal day", JSON.stringify(full), async (page) => {
  await page.goto(`${BASE}/value-my-car#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  // The mileage panel reveals a moment after the figure: wait for both.
  const shown = await until(page, () => /Estimated market value/i.test(document.body.innerText) && /Pre-filled from the last MOT/i.test(document.body.innerText));
  const noNotice = !(await page.evaluate(hasNotice));
  const prefilled = /Pre-filled from the last MOT/i.test(await page.evaluate(text));
  report("normal lookup: valuation with no outage notice", shown && noNotice && prefilled, `valuation shown: ${shown}, no notice: ${noNotice}, mileage pre-filled from the MOT: ${prefilled}`);
});

await browser.close();
console.log(failures === 0 ? "\nAll MOT-outage e2e checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
