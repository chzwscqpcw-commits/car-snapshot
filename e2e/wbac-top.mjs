// End-to-end check of valuation_wbac_top_v1: We Buy Any Car beside the
// estimate on /value-my-car (see EXPERIMENTS in src/lib/tracking.ts).
//
// The unit test (scripts/test-wbac-top-test.ts) pins the arithmetic. What it
// cannot see is whether a real page puts a visitor in an arm, draws that
// arm, and reports it: a test whose two arms are counted differently, or
// whose strip pushes our own figure about, gives an answer that means
// nothing. So this drives a real browser through both arms and checks:
//   · control is today's page (the card, no strip) and top is the strip inside
//     the valuation card with no card below, each on its own /go placement;
//   · our figure sits in exactly the same place in both arms, and the strip's
//     button is on the first screen of a phone;
//   · each arm records one exposure a session when the figure is on screen,
//     and one click, however often the button is pressed;
//   · a keeper sees neither offer and a van is not in the test at all.
//
//   npm run build && npx next start -p 3123   (in one shell)
//   npm run test:e2e                          (in another)
//
// Same rules as plate-flow.mjs: /api/lookup is answered from the fixture,
// the market-comparables call is answered empty, /api/event is answered
// locally and every off-site request is blocked. The offer's button is
// pressed with its navigation cancelled and /go answered locally, so no
// partner click is ever made.
//
// Env: E2E_BASE_URL (default http://localhost:3123), CHROME_PATH.

import { readFileSync, existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = (process.env.E2E_BASE_URL ?? "http://localhost:3123").replace(/\/$/, "");
const PLATE = "AB12CDE";
const TEST_ID = "valuation_wbac_top_v1";
const BUCKET_KEY = `experiment_${TEST_ID}`;
const CARD_LINK = 'a[href="/go/webuyanycar?ctx=valuation-result-wbac"]';
const STRIP_LINK = 'a[href="/go/webuyanycar?ctx=valuation-result-wbac-top"]';

const full = JSON.parse(readFileSync(new URL("./fixtures/lookup-AB12CDE.json", import.meta.url), "utf8"));
const CAR = JSON.stringify(full);
const VAN = JSON.stringify({ ...full, data: { ...full.data, typeApproval: "N1" } });
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

/** Requests that reached /go: there must never be one. */
const goRequests = [];

/**
 * A fresh visitor (own storage), a phone-sized screen, and the arm they are
 * in already drawn (`arm`), or left for the page to draw (`null`).
 */
async function newVisitor(lookupBody, arm) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.setUserAgent(UA);
  /** Every event the page sent to /api/event, as {type, payload}. */
  const events = [];
  await page.evaluateOnNewDocument(
    (key, value) => {
      // Events go by fetch, whose body the test can read (a beacon's can't be).
      Object.defineProperty(navigator, "sendBeacon", { value: undefined, configurable: true });
      if (value && !localStorage.getItem(key)) localStorage.setItem(key, value);
      // The offer's button is pressed for real, but goes nowhere.
      document.addEventListener(
        "click",
        (e) => {
          if (e.target instanceof Element && e.target.closest('a[href^="/go/"]')) e.preventDefault();
        },
        true,
      );
    },
    BUCKET_KEY,
    arm,
  );
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (!url.startsWith(BASE)) {
      if (url.startsWith("data:") || url.startsWith("blob:")) return req.continue();
      return req.abort();
    }
    const u = new URL(url);
    if (u.pathname.startsWith("/go/")) {
      goRequests.push(u.pathname + u.search);
      return req.respond({ status: 204 });
    }
    if (u.pathname === "/api/lookup") return req.respond({ status: 200, contentType: "application/json", body: lookupBody });
    if (u.pathname === "/api/valuation") return req.respond({ status: 200, contentType: "application/json", body: NO_COMPARABLES });
    if (u.pathname === "/api/saved-cars") return req.respond({ status: 200, contentType: "application/json", body: '{"ok":true,"status":"created"}' });
    if (u.pathname === "/api/event") {
      try { events.push(JSON.parse(req.postData() ?? "{}")); } catch { /* not ours */ }
      return req.respond({ status: 204 });
    }
    return req.continue();
  });
  const ofTest = (type) => events.filter((e) => e.type === type && e.payload?.experiment_id === TEST_ID);
  return { context, page, events, ofTest };
}

async function until(page, fn, timeout = 15000, ...args) {
  try {
    await page.waitForFunction(fn, { timeout, polling: 200 }, ...args);
    return true;
  } catch {
    return false;
  }
}
const settle = (ms = 700) => new Promise((r) => setTimeout(r, ms));
const valued = () => /Estimated market value/i.test(document.body.innerText) && /Pre-filled from the last MOT/i.test(document.body.innerText);

async function openValuation(page) {
  await page.goto(`${BASE}/value-my-car#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  return until(page, valued);
}

/** Where things are on the page, in page pixels. */
const layout = (cardSel, stripSel) => {
  const box = (n) => {
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), left: Math.round(r.left), height: Math.round(r.height) };
  };
  const figure = [...document.querySelectorAll("section p")].find((p) => /^£[\d,]+/.test(p.innerText.trim()));
  const strip = document.querySelector("[data-wbac-top]");
  return {
    figure: box(figure),
    figureText: figure?.innerText.split("\n")[0] ?? null,
    hero: box(figure?.closest("section")),
    strip: box(strip),
    // What is left of the strip on the page once its fold has closed over it.
    stripShown: strip ? Math.round(strip.parentElement.getBoundingClientRect().height) : 0,
    stripInHero: !!strip && strip.closest("section") === figure?.closest("section"),
    stripInert: !!strip?.closest("[inert]"),
    stripButton: box(document.querySelector(stripSel)),
    card: box(document.querySelector(cardSel)),
    wbacLinks: document.querySelectorAll('a[href^="/go/webuyanycar"]').length,
    chip: !!document.querySelector('[data-seller-intent="valuation-result"]'),
    plateInLinks: [...document.querySelectorAll('a[href^="/go/"]')].some((a) => /AB12/i.test(a.getAttribute("href") ?? "")),
    viewport: innerHeight,
    overflow: document.documentElement.scrollWidth > innerWidth,
  };
};

async function check(name, lookupBody, arm, fn) {
  let visitor;
  try {
    visitor = await newVisitor(lookupBody, arm);
    await fn(visitor);
  } catch (err) {
    report(name, false, err instanceof Error ? err.message : String(err));
  } finally {
    await visitor?.context.close().catch(() => {});
  }
}

let controlLayout = null;

// 1. Control: today's page, counted.
await check("control arm", CAR, "control", async ({ page, ofTest }) => {
  report("control: the valuation renders", await openValuation(page));
  await settle();
  const l = await page.evaluate(layout, CARD_LINK, STRIP_LINK);
  controlLayout = l;
  report("control: the offer card is under the chip, and there is no strip", !!l.card && !l.strip && l.wbacLinks === 1 && l.chip, JSON.stringify(l));
  report("control: the card is below the first screen (which is what the test is about)", !!l.card && l.card.top > l.viewport, JSON.stringify(l.card));
  const seen = ofTest("experiment_impression");
  report("control: one exposure, for the control arm, with the figure on screen", seen.length === 1 && seen[0].payload.variant === "control", JSON.stringify(seen));

  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "center" }), CARD_LINK);
  await page.click(CARD_LINK);
  await page.click(CARD_LINK);
  await settle(400);
  const clicks = ofTest("experiment_click");
  report("control: pressing the card's button is one click for the control arm", clicks.length === 1 && clicks[0].payload.variant === "control", JSON.stringify(clicks));
});

// 2. Top: the strip inside the valuation card, counted the same way.
await check("top arm", CAR, "top", async ({ page, events, ofTest }) => {
  report("top: the valuation renders", await openValuation(page));
  await settle(1200); // the strip's entrance has finished
  const l = await page.evaluate(layout, CARD_LINK, STRIP_LINK);
  report("top: the strip is inside the valuation card, under our figure", !!l.strip && l.stripInHero && l.strip.top > l.figure.bottom && !l.stripInert, JSON.stringify(l));
  report("top: no card further down (one offer, moved)", !l.card && l.wbacLinks === 1 && l.chip, JSON.stringify({ card: l.card, links: l.wbacLinks }));
  report(
    "top: our figure is exactly where it is in control",
    !!controlLayout && l.figureText === controlLayout.figureText && l.figure.top === controlLayout.figure.top && l.figure.left === controlLayout.figure.left && l.figure.height === controlLayout.figure.height,
    JSON.stringify({ top: l.figure, control: controlLayout?.figure }),
  );
  report("top: the strip's button is on a phone's first screen", !!l.stripButton && l.stripButton.bottom <= l.viewport, JSON.stringify({ button: l.stripButton, viewport: l.viewport }));
  report("top: nothing overflows sideways, and no plate in a link", !l.overflow && !l.plateInLinks);
  const wording = await page.evaluate(() => document.querySelector("[data-wbac-top]").innerText);
  report(
    "top: the strip carries the card's wording, nothing more",
    /Selling your Vauxhall Astra\?/.test(wording) &&
      /Our figure is a guide to what it's worth\. To see what you could sell it for today, get a free online valuation from We Buy Any Car\./.test(wording) &&
      /Get my free valuation/.test(wording) &&
      /Free · About 30 seconds · Online/.test(wording) &&
      /Free Plate Check may earn a small commission from this link\./.test(wording),
    wording,
  );
  const link = await page.$eval(STRIP_LINK, (a) => ({ rel: a.rel, target: a.target }));
  report("top: the link is marked sponsored and nofollow", /sponsored/.test(link.rel) && /nofollow/.test(link.rel) && link.target === "_blank", JSON.stringify(link));

  const seen = ofTest("experiment_impression");
  report("top: one exposure, for the top arm", seen.length === 1 && seen[0].payload.variant === "top", JSON.stringify(seen));
  const shown = events.filter((e) => e.type === "partner_impression" && e.payload?.partner_id === "weBuyAnyCar");
  report("top: the strip's own placement is recorded as seen", shown.length === 1 && shown[0].payload.click_context === "valuation-result-wbac-top", JSON.stringify(shown));

  await page.click(STRIP_LINK);
  await page.click(STRIP_LINK);
  await settle(400);
  const clicks = ofTest("experiment_click");
  report("top: pressing the strip's button is one click for the top arm", clicks.length === 1 && clicks[0].payload.variant === "top", JSON.stringify(clicks));

  // A second look in the same visit is the same exposed visit, not a new one.
  await page.reload({ waitUntil: "domcontentloaded" });
  await until(page, valued);
  await settle();
  report("top: a second valuation in the same visit is not a second exposure", ofTest("experiment_impression").length === 1, String(ofTest("experiment_impression").length));

  // What an exposed visit does next carries the arm (the guard metrics).
  await page.evaluate(() => document.querySelector('[data-seller-intent="valuation-result"]').scrollIntoView({ block: "center" }));
  await page.evaluate(() => [...document.querySelectorAll('[data-seller-intent="valuation-result"] button')].find((b) => b.innerText.trim() === "Keeping").click());
  await settle(900);
  const answer = events.find((e) => e.type === "seller_intent");
  report("top: a chip answer from an exposed visit carries the arm", answer?.payload?.[`exp_${TEST_ID}`] === "top" && answer?.payload?.surface === "valuation-result", JSON.stringify(answer));

  const kept = await page.evaluate(layout, CARD_LINK, STRIP_LINK);
  report("top: a keeper's strip folds away and can't be reached", kept.stripInert && kept.stripShown === 0 && kept.hero.bottom < l.hero.bottom && !kept.card, JSON.stringify({ shown: kept.stripShown, inert: kept.stripInert, hero: [l.hero.bottom, kept.hero.bottom] }));
  report("top: …and our figure has not moved", kept.figure.top === l.figure.top && kept.figureText === l.figureText);

  // The keeper comes back another day: nothing to click, so not counted.
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await until(page, valued);
  await settle();
  const back = await page.evaluate(layout, CARD_LINK, STRIP_LINK);
  report("top: a returning keeper sees no offer and is not counted again", back.stripInert && back.stripShown === 0 && ofTest("experiment_impression").length === 1, JSON.stringify({ inert: back.stripInert, seen: ofTest("experiment_impression").length }));
});

// 3. A visitor nobody has put in an arm is put in one, and it sticks.
await check("bucketing", CAR, null, async ({ page, ofTest }) => {
  await openValuation(page);
  await settle();
  const arm = await page.evaluate((k) => localStorage.getItem(k), BUCKET_KEY);
  const l = await page.evaluate(layout, CARD_LINK, STRIP_LINK);
  report("a new visitor is put in one of the two arms", arm === "control" || arm === "top", String(arm));
  report("…and is shown that arm and counted in it", (arm === "top") === !!l.strip && (arm === "control") === !!l.card && ofTest("experiment_impression")[0]?.payload.variant === arm, JSON.stringify({ arm, strip: !!l.strip, card: !!l.card }));
  await page.reload({ waitUntil: "domcontentloaded" });
  await until(page, valued);
  report("…and keeps it on the next visit", (await page.evaluate((k) => localStorage.getItem(k), BUCKET_KEY)) === arm);
});

// 4. Vans: no We Buy Any Car offer anywhere, so no arm and no count.
await check("van", VAN, null, async ({ page, ofTest }) => {
  await openValuation(page);
  await settle();
  const l = await page.evaluate(layout, CARD_LINK, STRIP_LINK);
  const arm = await page.evaluate((k) => localStorage.getItem(k), BUCKET_KEY);
  report("van: no offer in either form, and not in the test", l.wbacLinks === 0 && !l.strip && arm === null && ofTest("experiment_impression").length === 0, JSON.stringify({ links: l.wbacLinks, arm }));
});
await check("van, visitor already in the top arm", VAN, "top", async ({ page, ofTest }) => {
  await openValuation(page);
  await settle();
  const l = await page.evaluate(layout, CARD_LINK, STRIP_LINK);
  report("van: still no offer for a visitor who is in the top arm", l.wbacLinks === 0 && !l.strip && ofTest("experiment_impression").length === 0, JSON.stringify({ links: l.wbacLinks }));
});

report("no request ever reached /go", goRequests.length === 0, goRequests.join(", "));

await browser.close();
console.log(failures === 0 ? "\nAll We Buy Any Car position test e2e checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
