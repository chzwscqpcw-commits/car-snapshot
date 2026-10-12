import type { ReportInput } from "@/lib/generateReport";
import { html, raw } from "./html";
import { fontFaceCss } from "./fonts";
import { THEMES, type ReportTheme } from "./theme";
import { coverPage } from "./pages/cover";

// The report as one HTML document: fixed A4 pages, one <section class="page">
// each, rendered to PDF by render.ts. Layout rules shared by every page live in
// BASE_CSS; colours come from the theme and are set inline per element so the
// dark and light editions share every line of markup.

const BASE_CSS = `
@page { size: A4; margin: 0 }
* { box-sizing: border-box }
html, body { margin: 0; padding: 0 }
body { font-family: 'Geist', system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; break-after: page }
.page:last-child { page-break-after: auto; break-after: auto }
.pad { position: relative; height: 100%; display: flex; flex-direction: column; padding: 48px 56px 44px }
.grow { flex-grow: 1 }
.mono { font-family: 'Geist Mono', ui-monospace, monospace }
.small { font-size: 12px; letter-spacing: 0.08em }
.display { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400 }
.rule { height: 1px; margin-top: 18px }
.masthead { display: flex; justify-content: space-between; align-items: center }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.14em }
.hero { margin-top: 96px; display: flex; flex-direction: column; gap: 28px; position: relative }
.plate { align-self: flex-start; background: #F5C518; color: #111111; border-radius: 10px; padding: 14px 34px; font-weight: 700; font-size: 76px; letter-spacing: 0.06em; line-height: 1 }
.cover-title { margin: 0; font-size: 104px; line-height: 0.95; letter-spacing: -0.01em; max-width: 600px; text-wrap: balance }
.cover-title em { font-style: italic }
.deck { margin: 0; font-size: 19px; line-height: 1.55; max-width: 480px; text-wrap: pretty }
.contents { list-style: none; margin: 0 0 40px; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 40px; row-gap: 22px; max-width: 540px; position: relative }
.contents li { display: flex; gap: 14px; align-items: baseline }
.contents li .mono { font-size: 13px }
.contents li div { display: flex; flex-direction: column; gap: 3px }
.contents-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 25px; line-height: 1.1 }
.contents-text { font-size: 13px; line-height: 1.4 }
.vitals { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid; border-bottom: 1px solid }
.vital { padding: 16px 0; display: flex; flex-direction: column; gap: 6px }
.vital .label { font-size: 11px; letter-spacing: 0.1em }
.vital-value { font-size: 20px; font-weight: 600 }
.vital-sub { font-size: 12px }
.foot { position: relative; display: flex; justify-content: space-between; margin-top: 18px; font-size: 11px; letter-spacing: 0.06em }
`;

export type RenderOptions = { theme: ReportTheme; now?: Date };

export function renderReportHtml(input: ReportInput, { theme, now = new Date() }: RenderOptions): string {
  const t = THEMES[theme];
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Vehicle report ${input.data.registrationNumber}</title>
<style>${raw(fontFaceCss())}${raw(BASE_CSS)}</style>
</head>
<body style="background:${t.bg}">
${coverPage(input, t, now)}
</body>
</html>`.value;
}
