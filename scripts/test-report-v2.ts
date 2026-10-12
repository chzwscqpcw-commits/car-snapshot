/**
 * Server-rendered report (v2) smoke test.
 *
 * Renders the sample report in both editions through the real pipeline
 * (HTML template → headless Chromium → PDF) and checks:
 *   - a valid PDF of the expected page count comes back for each theme
 *   - the bundled fonts are embedded (no silent fallback to system fonts)
 *   - hostile input is escaped and can't inject markup
 *
 * Needs a Chrome-family browser: locally it finds Chrome/Brave/Edge, in CI the
 * runner's /usr/bin/google-chrome, or set CHROME_PATH. Writes the PDFs to
 * /tmp/fpc-report-v2-<theme>.pdf for a visual check.
 *
 * Run: npx tsx scripts/test-report-v2.ts   (or: npm run test:report-v2)
 */
import { writeFileSync } from "node:fs";
import { renderReportHtml } from "../src/lib/report-v2/document";
import { findOverflowingPages, renderPdf } from "../src/lib/report-v2/render";
import { SAMPLE_REPORT_INPUT } from "../src/lib/report-v2/sample";

// Cover, verdict, MOT story, money, details, before you buy.
const EXPECTED_PAGES = 6;

const failures: string[] = [];
function check(label: string, ok: boolean) {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failures.push(label);
}

(async () => {
  const now = new Date("2026-10-12T12:00:00Z");

  for (const theme of ["dark", "light"] as const) {
    console.log(`\n${theme} edition:`);
    const html = renderReportHtml(SAMPLE_REPORT_INPUT, { theme, now });
    check("plate formatted as AB12 CDE", html.includes("AB12 CDE"));
    check("summary sentence built from the data", html.includes("A 7-year-old diesel saloon with 4 MOTs on record, the latest a pass in Apr 2026, and one open advisory: brakes."));

    const t0 = Date.now();
    const pdf = Buffer.from(await renderPdf(html));
    const ms = Date.now() - t0;
    const raw = pdf.toString("latin1");
    const pages = (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    check("valid PDF header", raw.startsWith("%PDF"));
    check(`${EXPECTED_PAGES} page(s) (got ${pages})`, pages === EXPECTED_PAGES);
    for (const font of ["Geist", "GeistMono", "InstrumentSerif"]) {
      check(`${font} embedded`, new RegExp(`/FontName\\s*/[A-Z]{6}\\+${font}`).test(raw));
    }
    const edition = theme === "light" ? "print" : "dark";
    check(`clickable carVertical link (v=${edition})`, raw.includes(`/URI (https://www.freeplatecheck.co.uk/go/carvertical?ctx=pdf-carvertical&vrm=AB12CDE&v=${edition})`));
    check("running costs state the mileage they assume", html.includes("Based on 7,400 miles a year"));
    const out = `/tmp/fpc-report-v2-${theme}.pdf`;
    try { writeFileSync(out, pdf); } catch { /* read-only fs is fine */ }
    console.log(`  rendered in ${ms} ms → ${out} (${(pdf.length / 1024).toFixed(0)} KB)`);
  }

  console.log("\nNothing clipped:");
  const sampleOverflow = await findOverflowingPages(renderReportHtml(SAMPLE_REPORT_INPUT, { theme: "dark", now }));
  check(`sample: no page overflows${sampleOverflow.length ? ` (${sampleOverflow.join(", ")})` : ""}`, sampleOverflow.length === 0);

  // Stress case: a 14-year-old car with a long, messy MOT history, no
  // valuation or health score, so sections paginate and others drop out.
  const long = structuredClone(SAMPLE_REPORT_INPUT);
  long.healthScore = null;
  long.valuation = null;
  long.data.motTests = Array.from({ length: 14 }, (_, i) => ({
    completedDate: `${2025 - i}-06-0${(i % 9) + 1}T10:00:00.000Z`,
    testResult: (i % 4 === 1 ? "FAILED" : "PASSED") as "FAILED" | "PASSED",
    odometer: { value: 140000 - i * 9000, unit: "mi" },
    motTestNumber: `9999 0000 ${String(i).padStart(4, "0")}`,
    rfrAndComments: Array.from({ length: (i % 5) + 1 }, (_, j) => ({
      text: j % 2 === 0
        ? "Offside rear suspension arm pin or bush worn, close to the limit of wear but still within tolerance at the time of test"
        : "Nearside front tyre worn close to legal limit",
      type: (i % 4 === 1 && j === 0 ? "MAJOR" : "ADVISORY") as "ADVISORY",
    })),
  }));
  long.checklist = {
    buyer: Array.from({ length: 12 }, (_, i) => `Buyer check number ${i + 1}: confirm the documents and history line up with the car`),
    owner: Array.from({ length: 8 }, (_, i) => `Owner task ${i + 1}`),
    seller: Array.from({ length: 6 }, (_, i) => `Seller task ${i + 1}`),
  };
  const longHtml = renderReportHtml(long, { theme: "light", now });
  const overflow = await findOverflowingPages(longHtml);
  check(`long history: no page overflows${overflow.length ? ` (${overflow.join(", ")})` : ""}`, overflow.length === 0);
  check("long history: no verdict page", !longHtml.includes("THE VERDICT"));
  check("long history: MOT story continues", longHtml.includes("The MOT story, continued"));
  try { writeFileSync("/tmp/fpc-report-v2-long.pdf", Buffer.from(await renderPdf(longHtml))); } catch { /* fine */ }

  console.log("\nEscaping:");
  const hostile = structuredClone(SAMPLE_REPORT_INPUT);
  hostile.data.model = `<img src=x onerror=alert(1)> SPORT`;
  hostile.data.registrationNumber = `"><script>alert(1)</script>`;
  const html = renderReportHtml(hostile, { theme: "dark", now });
  check("no injected <script>", !html.includes("<script>"));
  check("no injected <img", !html.includes("<img"));
  check("hostile text kept, escaped", html.includes("&lt;img") && html.includes("&lt;script&gt;"));

  if (failures.length) {
    console.error(`\n❌ ${failures.length} check(s) failed`);
    process.exit(1);
  }
  console.log("\n✅ Report v2 render checks passed.");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
