// End-to-end check that a link styled with utilities draws the way its
// classes say.
//
// Until Nov 2026 globals.css had `a { color: inherit; text-decoration: none }`
// outside any cascade layer. Tailwind v4 keeps its utilities in a layer, and
// unlayered CSS outranks every layer, so `text-blue-400`, `underline` and
// every `hover:text-*` on an <a> or <Link> did nothing: links drew in the
// surrounding text colour, button labels in whatever grey they inherited. It
// went unnoticed for months because nothing fails; the page just reads
// worse. Only a real browser can see it, so this reads computed styles on a
// production build:
//   · every link with a `text-<colour>` class computes to that colour (the
//     same class on a throwaway <span> is the reference);
//   · every link with `underline` is underlined;
//   · both hold with the device in light mode and in dark mode, and the page
//     behind is the same dark colour in both (it was white in light mode,
//     which washed the header and footer out to grey).
// Links inside an article body are left out: `.blog-content a` styles those.
//
//   npm run build && npx next start -p 3123   (in one shell)
//   npm run test:e2e                          (in another)
//
// Reads pages only: no lookup, /api/event answered locally, every off-site
// request blocked.
//
// Env: E2E_BASE_URL (default http://localhost:3123), CHROME_PATH.

import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = (process.env.E2E_BASE_URL ?? "http://localhost:3123").replace(/\/$/, "");
/** Header, footer, hero links, buttons, pills, a table of contents, underlined sources. */
const PAGES = ["/", "/tools", "/about", "/stats", "/cheap-mot", "/blog/what-to-do-if-car-fails-mot"];

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

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
let failures = 0;

function report(name, ok, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗"} ${name}${!ok && detail ? `  — ${detail}` : ""}`);
}

/** Runs in the page: every visible link's colour and underline against its own classes. */
function audit() {
  const COLOUR = /^text-(?:white|black|\[#[0-9a-fA-F]{3,8}\]|[a-z]+-\d{2,3})(?:\/\d+)?$/;
  const probe = document.createElement("span");
  document.body.appendChild(probe);
  const wrong = [];
  let coloured = 0;
  let underlined = 0;
  for (const a of document.querySelectorAll("a")) {
    if (a.closest(".blog-content") || a.style.color) continue;
    const box = a.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    const classes = [...a.classList];
    const style = getComputedStyle(a);
    const label = `"${(a.innerText || a.getAttribute("aria-label") || a.getAttribute("href") || "").trim().slice(0, 40)}"`;
    const colours = classes.filter((c) => COLOUR.test(c));
    if (colours.length === 1) {
      coloured++;
      probe.className = colours[0];
      const want = getComputedStyle(probe).color;
      if (style.color !== want) wrong.push(`${label} has ${colours[0]} (${want}) but draws ${style.color}`);
    }
    if (classes.includes("underline")) {
      underlined++;
      if (!style.textDecorationLine.includes("underline")) wrong.push(`${label} has underline but draws none`);
    }
  }
  probe.remove();
  return { coloured, underlined, wrong, page: getComputedStyle(document.body).backgroundColor };
}

const pageColour = {};
for (const scheme of ["dark", "light"]) {
  let coloured = 0;
  let underlined = 0;
  const wrong = [];
  for (const path of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    // Colours are compared at rest: a link mid-`transition-colors` reads as neither.
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: scheme },
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.startsWith("data:") || url.startsWith("blob:")) return req.continue();
      if (!url.startsWith(BASE)) return req.abort();
      if (new URL(url).pathname === "/api/event") return req.respond({ status: 204 });
      return req.continue();
    });
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 45000 });
      await new Promise((r) => setTimeout(r, 500));
      const found = await page.evaluate(audit);
      // Every page here has the footer's coloured links; none means it did not load.
      if (!found.coloured) wrong.push(`${path}: no coloured link on the page`);
      coloured += found.coloured;
      underlined += found.underlined;
      wrong.push(...found.wrong.map((w) => `${path}: ${w}`));
      pageColour[scheme] = found.page;
    } catch (err) {
      wrong.push(`${path}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      await page.close();
    }
  }
  // A page that lost its coloured links would pass an every-link check with nothing to check.
  report(`${scheme} mode: links were found to check`, coloured >= 100 && underlined >= 3, `${coloured} coloured, ${underlined} underlined`);
  report(
    `${scheme} mode: ${coloured} coloured and ${underlined} underlined links draw as their classes say`,
    wrong.length === 0,
    `${wrong.length} wrong, e.g. ${wrong.slice(0, 3).join(" | ")}`,
  );
}
report("the page behind is the same colour in light mode as in dark", !!pageColour.dark && pageColour.light === pageColour.dark, JSON.stringify(pageColour));

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll link-style checks passed");
process.exit(failures ? 1 : 0);
