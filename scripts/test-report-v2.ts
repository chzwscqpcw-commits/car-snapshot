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
import { renderPdf } from "../src/lib/report-v2/render";
import { SAMPLE_REPORT_INPUT } from "../src/lib/report-v2/sample";

const EXPECTED_PAGES = 1; // cover only, until the inner pages land

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
    const out = `/tmp/fpc-report-v2-${theme}.pdf`;
    try { writeFileSync(out, pdf); } catch { /* read-only fs is fine */ }
    console.log(`  rendered in ${ms} ms → ${out} (${(pdf.length / 1024).toFixed(0)} KB)`);
  }

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
