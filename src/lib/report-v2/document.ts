import type { ReportInput } from "@/lib/generateReport";
import { html, raw, type Safe } from "./html";
import { fontFaceCss } from "./fonts";
import { THEMES, type ReportTheme, type ThemeTokens } from "./theme";
import { pounds } from "./format";
import { coverPage, type ContentsLine } from "./pages/cover";
import { verdictPage } from "./pages/verdict";
import { motPages } from "./pages/mot";
import { moneyPage } from "./pages/money";
import { detailPages } from "./pages/details";
import { beforePages } from "./pages/before";
import { REPORT_CSS } from "./styles";

// The report as one HTML document: fixed A4 pages, one <section class="page">
// each, rendered to PDF by render.ts. Sections only appear when the car has
// the data for them, and the cover's contents list is built from the pages
// that were actually produced, so its page numbers are always right.

type Section = { title: string; teaser: string; build: (t: ThemeTokens, firstFolio: number) => Safe[] };

function sections(input: ReportInput, now: Date): Section[] {
  const out: Section[] = [];
  const hs = input.healthScore;
  if (hs) {
    out.push({ title: "The verdict", teaser: `Grade ${hs.grade}, ${hs.score} out of 100`, build: (t, f) => [verdictPage(input, t, f)].filter((p): p is Safe => p !== null) });
  }
  const tests = input.data.motTests ?? [];
  if (tests.length > 0) {
    const fails = tests.filter((x) => x.testResult === "FAILED").length;
    out.push({
      title: "The MOT story",
      teaser: `${tests.length} test${tests.length === 1 ? "" : "s"}, ${fails === 0 ? "no fails" : `${fails} fail${fails === 1 ? "" : "s"}`}`,
      build: (t, f) => motPages(input, t, f),
    });
  }
  const v = input.valuation;
  const moneyTeaser = v?.estimatedValue
    ? `Worth about ${pounds(v.estimatedValue)}`
    : v ? `Worth ${pounds(v.rangeLow)}–${pounds(v.rangeHigh)}`
      : input.ownershipCost ? `${pounds(input.ownershipCost.totalAnnual)} a year to run` : null;
  if (moneyTeaser || input.motReadiness?.riskItems?.length) {
    out.push({ title: "The money", teaser: moneyTeaser ?? "Repairs to budget for", build: (t, f) => [moneyPage(input, t, f)].filter((p): p is Safe => p !== null) });
  }
  out.push({ title: "The details", teaser: "Spec sheet and key facts", build: (t, f) => detailPages(input, t, f) });
  out.push({ title: "Before you buy", teaser: "Checklists and sources", build: (t, f) => beforePages(input, t, f, now) });
  return out;
}

export type RenderOptions = { theme: ReportTheme; now?: Date };

export function renderReportHtml(input: ReportInput, { theme, now = new Date() }: RenderOptions): string {
  const t = THEMES[theme];
  const contents: ContentsLine[] = [];
  const pages: Safe[] = [];
  let folio = 2;
  for (const s of sections(input, now)) {
    const built = s.build(t, folio);
    if (built.length === 0) continue;
    contents.push({ page: folio, title: s.title, text: s.teaser });
    pages.push(...built);
    folio += built.length;
  }
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Vehicle report ${input.data.registrationNumber}</title>
<style>${raw(fontFaceCss())}${raw(REPORT_CSS)}</style>
</head>
<body style="background:${t.bg}">
${coverPage(input, t, now, contents)}
${pages}
</body>
</html>`.value;
}
