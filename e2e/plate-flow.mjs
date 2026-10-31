// End-to-end check of how a number plate travels through the site (#174).
//
// Plates live in the URL fragment (/mot-check#vrm=AB12CDE), which the browser
// never sends to a server. That only holds while every entry point — hero
// search, quick-link pills, direct links, old ?vrm= links, the homepage,
// booking, MOT reminders and the carVertical hand-off — keeps reading and
// writing the fragment. Unit tests can't see any of that, so this drives a
// real browser against a production build.
//
//   npm run build && npx next start -p 3123   (in one shell)
//   npm run test:e2e                          (in another)
//
// Self-contained and safe to run anywhere:
// - /api/lookup is answered from a fixture, so no DVLA/MOT keys are needed
//   and no real lookup is made;
// - every request that leaves our own origin is blocked — no GA hits, and
//   the /go redirect to carVertical is read, never followed (a followed
//   redirect once banked a real affiliate click);
// - /api/event is answered locally, so nothing reaches site_events.
//
// Env: E2E_BASE_URL (default http://localhost:3123), CHROME_PATH.

import { readFileSync, existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = (process.env.E2E_BASE_URL ?? "http://localhost:3123").replace(/\/$/, "");
const PLATE = "AB12CDE";
const LOOKUP = readFileSync(new URL("./fixtures/lookup-AB12CDE.json", import.meta.url), "utf8");

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

// /go treats a headless user agent as a bot, so present as desktop Chrome.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox"],
});

/** Every request to our own server whose URL — or Referer — carried the plate. */
const leaks = [];
/** Plates sent to /api/lookup (in the POST body, where they belong). */
const lookups = [];
/** Plates sent to /api/saved-cars (POST body too). */
const saves = [];
let failures = 0;

function report(name, ok, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗"} ${name}${!ok && detail ? `  — ${detail}` : ""}`);
}

async function newPage() {
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
    // Chrome reports the URL with its fragment, but never sends that part.
    const sent = url.split("#")[0];
    if (sent.includes(PLATE)) leaks.push(sent.slice(BASE.length));
    // A ?vrm= address leaks mostly through Referer: every request the page
    // makes sends it. (Browsers strip the fragment from Referer.)
    const referer = req.headers()["referer"] ?? "";
    if (referer.includes(PLATE)) leaks.push(`referer ${referer.replace(BASE, "")} -> ${sent.slice(BASE.length)}`);
    const path = new URL(url).pathname;
    if (path === "/api/lookup") {
      lookups.push(JSON.parse(req.postData() ?? "{}").vrm);
      return req.respond({ status: 200, contentType: "application/json", body: LOOKUP });
    }
    if (path === "/api/saved-cars") {
      saves.push(JSON.parse(req.postData() ?? "{}").vrm);
      return req.respond({ status: 200, contentType: "application/json", body: '{"ok":true,"status":"created"}' });
    }
    if (path === "/api/event") return req.respond({ status: 204 });
    return req.continue();
  });
  return page;
}

/** Poll `fn` in the page until it returns truthy, or give up. */
async function until(page, fn, timeout = 15000, ...args) {
  try {
    await page.waitForFunction(fn, { timeout, polling: 200 }, ...args);
    return true;
  } catch {
    return false;
  }
}

const landingGone = () => !document.querySelector("[data-plate-landing]");
const bodyMatches = (src) => new RegExp(src, "i").test(document.body.innerText);

async function check(name, fn) {
  let page;
  try {
    page = await newPage();
    await fn(page);
  } catch (err) {
    report(name, false, err instanceof Error ? err.message : String(err));
  } finally {
    await page?.close().catch(() => {});
  }
}

// 1. Hero search on a tool page -> fragment URL + result; Back -> landing.
await check("hero search", async (page) => {
  await page.goto(`${BASE}/mot-check`, { waitUntil: "networkidle0" });
  await page.type('input[placeholder^="Enter reg"]', PLATE);
  await page.keyboard.press("Enter");
  const shown = await until(page, (plate) => location.hash === `#vrm=${plate}` && !document.querySelector("[data-plate-landing]"), 15000, PLATE);
  report("hero search -> /mot-check#vrm= result", shown && (await until(page, bodyMatches, 15000, "VAUXHALL|ASTRA")), page.url());

  await page.goBack();
  const back = await until(page, () => location.hash === "" && !!document.querySelector("[data-plate-landing]") && !document.documentElement.hasAttribute("data-plate"));
  report("back -> landing again", back, page.url());
});

// 2. A direct fragment link hides the landing before hydration (no flash),
//    then renders the result; its quick-link pills keep the fragment form.
await check("direct link", async (page) => {
  await page.goto(`${BASE}/mileage-check#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  const early = await page.evaluate(() => {
    const el = document.querySelector("[data-plate-landing]");
    return {
      flag: document.documentElement.hasAttribute("data-plate"),
      landingVisible: el ? getComputedStyle(el).display !== "none" : false,
    };
  });
  report("direct #vrm= link: landing hidden before hydration", early.flag && !early.landingVisible, JSON.stringify(early));
  report("direct #vrm= link: result renders", (await until(page, landingGone)) && (await until(page, bodyMatches, 15000, "mileage")));

  const pill = `a[href="/tax-check#vrm=${PLATE}"]`;
  const hasPill = await until(page, (sel) => !!document.querySelector(sel), 10000, pill);
  report("quick-link pill uses the fragment", hasPill);
  if (hasPill) {
    await page.click(pill);
    const ok = await until(page, (plate) => location.pathname === "/tax-check" && location.hash === `#vrm=${plate}` && !document.querySelector("[data-plate-landing]"), 15000, PLATE);
    report("pill -> tax result", ok, page.url());
  }
});

// 3. Old ?vrm= links (sent emails, the partner widget) still work and are
//    rewritten to the fragment.
await check("legacy link", async (page) => {
  await page.goto(`${BASE}/ulez-check?vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  const ok = await until(page, (plate) => location.search === "" && location.hash === `#vrm=${plate}`, 15000, PLATE);
  report("legacy ?vrm= -> migrated to #vrm=", ok && (await until(page, landingGone)), page.url());
});

// 4. The homepage runs its own inline lookup and then resets the address.
for (const [name, path] of [["homepage #vrm=", `/#vrm=${PLATE}`], ["homepage legacy ?vrm=", `/?vrm=${PLATE}`]]) {
  await check(name, async (page) => {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    const looked = await until(page, bodyMatches, 20000, "VAUXHALL|ASTRA");
    const reset = await until(page, () => location.search === "" && location.hash === "");
    report(`${name} -> lookup, then address reset`, looked && reset, page.url());
  });
}

// 5. Booking and MOT reminders pre-fill from the fragment. With a plate and
//    a service type, the wizard skips to step 3 (location) and looks the car
//    up in the background — the plate itself isn't on screen at that step.
await check("booking", async (page) => {
  const before = lookups.length;
  await page.goto(`${BASE}/booking?type=mot&source=e2e#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  const atStep3 = await until(page, () => !!document.querySelector('input[placeholder^="e.g. SW1A"]'));
  // The lookup is a background fetch after step 3 renders — wait for it rather
  // than reading the list the instant step 3 appears (a race on fast runners).
  const deadline = Date.now() + 10000;
  while (!lookups.slice(before).includes(PLATE) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 200));
  const looked = lookups.slice(before).includes(PLATE);
  report("booking pre-fills the plate (skips to step 3)", atStep3 && looked, JSON.stringify({ atStep3, looked }));
});

await check("mot reminder", async (page) => {
  await page.goto(`${BASE}/mot-reminder#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  const ok = await until(page, (plate) =>
    [...document.querySelectorAll("input")].some((i) => i.value.replace(/\s/g, "").toUpperCase() === plate), 15000, PLATE);
  report("MOT reminder pre-fills the plate", ok);
});

// 5b. Save a car for alerts: one tap, then an email. The plate travels to
//     /api/saved-cars in the POST body, never in the address.
await check("save car", async (page) => {
  await page.goto(`${BASE}/#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  const sel = '[data-save-card="results"] button';
  const has = await until(page, (s) => !!document.querySelector(s), 20000, sel);
  report("save card renders on the result", has);
  if (!has) return;
  await page.click(sel);
  const asks = await until(page, () => !!document.querySelector('[data-save-card="results"] input[type="email"]'));
  report("one tap saves, then asks where alerts go", asks);
  if (!asks) return;
  await page.type('[data-save-card="results"] input[type="email"]', "e2e@example.com");
  await page.click('[data-save-card="results"] button[type="submit"]');
  const done = await until(page, () => /Alerts on for/i.test(document.querySelector('[data-save-card="results"]')?.textContent ?? ""));
  report("alerts switched on, plate sent in the POST body", done && saves.includes(PLATE), JSON.stringify({ done, saves }));
});

// 6. carVertical hand-off: the link carries no plate; clicking it puts the
//    plate in a short-lived cookie that /go turns into the partner's sub3.
await check("carVertical", async (page) => {
  const redirects = [];
  page.on("response", (res) => {
    if (res.url().includes("/go/carvertical") && res.status() === 302) redirects.push(res.headers()["location"] ?? "");
  });
  await page.goto(`${BASE}/mileage-check#vrm=${PLATE}`, { waitUntil: "domcontentloaded" });
  // The result's own box — the hidden landing content has a carVertical link
  // too (ctx=mileage-carvertical), which disappears when the result mounts.
  const sel = 'a[href^="/go/carvertical"][href*="ctx=mileage-result-carvertical"]';
  const has = await until(page, (s) => !!document.querySelector(s), 15000, sel);
  const href = has ? await page.$eval(sel, (a) => a.getAttribute("href")) : null;
  report("/go link has no plate in it", !!href && !href.includes(PLATE) && !/vrm=/i.test(href), String(href));
  if (!has) return;

  // Same tab, so the redirect is observable here (the real link opens a new one).
  await page.$eval(sel, (a) => a.removeAttribute("target"));
  await page.click(sel);
  const deadline = Date.now() + 15000;
  while (!redirects.length && Date.now() < deadline) await new Promise((r) => setTimeout(r, 200));
  report("/go redirect pre-fills the plate from the cookie", redirects.some((loc) => loc.includes(`sub3=${PLATE}`)), JSON.stringify(redirects));
});

// The point of #174: no request to our server ever carried the plate in its
// URL or Referer — except the legacy-link pages this run opens on purpose,
// which load with ?vrm= (and send it as Referer) until they rewrite it.
const LEGACY = [`/ulez-check?vrm=${PLATE}`, `/?vrm=${PLATE}`];
const unexpected = leaks.filter((l) => !LEGACY.some((u) => l === u || l.startsWith(`referer ${u} ->`)));
report("no request to our server carried the plate in its URL or Referer", unexpected.length === 0, JSON.stringify(unexpected.slice(0, 5)));

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll plate-flow checks passed");
process.exit(failures ? 1 : 0);
