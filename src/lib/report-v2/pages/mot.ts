import type { ReportInput } from "@/lib/generateReport";
import { odometerMiles } from "@/lib/valuation";
import { html, type Safe } from "../html";
import type { ThemeTokens } from "../theme";
import { monthYear, num, parseDate, shortDate } from "../format";
import { BODY_HEIGHT, CONTINUED_ROOM, type Block, countWord, pageShell, paginate, plural, textHeight } from "./shared";

// 03 · The MOT story: mileage at every MOT as a line (measured readings only,
// so it's drawn solid), then every test with its defects and advisories. Long
// histories continue onto extra pages.

type Test = NonNullable<ReportInput["data"]["motTests"]>[number];
type Item = NonNullable<Test["rfrAndComments"]>[number];

const SERIOUS = new Set(["DEFECT", "FAIL", "MAJOR", "DANGEROUS", "PRS"]);

function itemTone(item: Item, t: ThemeTokens): { tag: string; color: string } {
  const type = String(item.type).toUpperCase();
  if (SERIOUS.has(type)) return { tag: type === "DEFECT" ? "FAIL" : type, color: t.risk };
  if (type === "ADVISORY" || type === "MINOR") return { tag: type, color: t.warn };
  return { tag: type, color: t.muted };
}

function sortedTests(input: ReportInput): Test[] {
  return [...(input.data.motTests ?? [])].sort(
    (a, b) => (parseDate(b.completedDate)?.getTime() ?? 0) - (parseDate(a.completedDate)?.getTime() ?? 0),
  );
}

function dotColor(test: Test, t: ThemeTokens): string {
  if (test.testResult === "FAILED") return t.risk;
  return (test.rfrAndComments ?? []).some((i) => String(i.type).toUpperCase() === "ADVISORY") ? t.warn : t.good;
}

/** Mileage line chart over time, 682×240. Null if fewer than 2 readings. */
function mileageChart(tests: Test[], t: ThemeTokens): Safe | null {
  const pts = tests
    .map((x) => ({ date: parseDate(x.completedDate), miles: odometerMiles(x.odometer), test: x }))
    .filter((p): p is { date: Date; miles: number; test: Test } => p.date !== null && p.miles !== null)
    .reverse();
  if (pts.length < 2) return null;
  const W = 682, X0 = 60, X1 = 650, Y0 = 200, Y1 = 22;
  const t0 = pts[0].date.getTime(), t1 = pts[pts.length - 1].date.getTime();
  const maxMiles = Math.max(...pts.map((p) => p.miles));
  const step = maxMiles > 150_000 ? 50_000 : maxMiles > 60_000 ? 25_000 : maxMiles > 30_000 ? 20_000 : 10_000;
  const top = Math.ceil(maxMiles / step) * step || step;
  const x = (d: Date) => (t1 === t0 ? (X0 + X1) / 2 : X0 + ((d.getTime() - t0) / (t1 - t0)) * (X1 - X0));
  const y = (m: number) => Y0 - (m / top) * (Y0 - Y1);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(1)} ${y(p.miles).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts[pts.length - 1].date).toFixed(1)} ${Y0} L${x(pts[0].date).toFixed(1)} ${Y0} Z`;
  const grid: Safe[] = [];
  for (let v = step; v <= top; v += step) {
    grid.push(html`<line x1="${X0 - 20}" y1="${y(v).toFixed(1)}" x2="${W}" y2="${y(v).toFixed(1)}" stroke="${t.rule}" stroke-width="1" stroke-dasharray="3 5"/>
      <text x="0" y="${(y(v) + 4).toFixed(1)}" font-family="Geist Mono" font-size="11" fill="${t.muted}">${v >= 1000 ? `${v / 1000}k` : v}</text>`);
  }
  // Year labels: first, last and up to 3 between, skipping any that would sit
  // within 80px of the last one so long histories don't collide.
  const labelIdx = new Set([0, pts.length - 1]);
  const stride = Math.max(1, Math.round((pts.length - 1) / 4));
  const lastX = x(pts[pts.length - 1].date);
  for (let i = stride; i < pts.length - 1; i += stride) {
    if (lastX - x(pts[i].date) >= 80) labelIdx.add(i);
  }
  const first = pts[0], last = pts[pts.length - 1];
  return html`<svg role="img" aria-label="Mileage at each MOT, from ${num(first.miles)} in ${monthYear(first.date)} to ${num(last.miles)} in ${monthYear(last.date)}" width="${W}" height="240" viewBox="0 0 ${W} 240">
    <line x1="${X0 - 20}" y1="${Y0}" x2="${W}" y2="${Y0}" stroke="${t.ruleStrong}" stroke-width="1"/>
    ${grid}
    <path d="${area}" fill="${t.accent}" opacity="0.1"/>
    <path d="${line}" fill="none" stroke="${t.accent}" stroke-width="2.5" stroke-linejoin="round"/>
    ${pts.map((p) => {
      const c = dotColor(p.test, t);
      const failed = p.test.testResult === "FAILED";
      return html`<circle cx="${x(p.date).toFixed(1)}" cy="${y(p.miles).toFixed(1)}" r="${failed ? 7 : 6}" fill="${failed ? c : t.bg}" stroke="${c}" stroke-width="3"/>`;
    })}
    ${pts.map((p, i) => labelIdx.has(i) ? html`<text x="${x(p.date).toFixed(1)}" y="225" text-anchor="middle" font-family="Geist Mono" font-size="12" fill="${t.muted}">${monthYear(p.date).toUpperCase()}</text>` : "")}
  </svg>`;
}

// Notes column: 682 less the dot, date and miles columns and gaps (402), less
// the tag column and its gap (74).
const NOTE_W = 328;

function testBlock(test: Test, t: ThemeTokens): Block {
  const d = parseDate(test.completedDate);
  const miles = odometerMiles(test.odometer);
  const items = test.rfrAndComments ?? [];
  const result = test.testResult === "PASSED" ? "PASS" : test.testResult === "FAILED" ? "FAIL" : "NO DETAILS";
  const notes = items.length === 0
    ? html`<span style="color:${t.soft}">${test.testResult === "PASSED" ? "No advisories." : "No details held."}</span>`
    : items.map((i) => {
        const tone = itemTone(i, t);
        return html`<div class="note"><span class="mono tag" style="color:${tone.color}">${tone.tag}</span><span style="color:${t.soft}">${i.text}</span></div>`;
      });
  // Row padding and rule ≈ 34px around the taller of the date stack (≈ 44px)
  // and the notes. Calibrated against renders.
  const h = 34 + Math.max(28, items.reduce((s, i) => s + textHeight(i.text, NOTE_W, 14) + 6, 0));
  return {
    h,
    html: html`<div class="test-row" style="border-color:${t.rule}">
      <div class="dot" style="background:${dotColor(test, t)}"></div>
      <div class="test-when"><span class="test-date">${d ? shortDate(d) : "Unknown date"}</span><span class="mono tag" style="color:${dotColor(test, t)}">${result}</span></div>
      <div class="notes">${notes}</div>
      <span class="mono test-miles">${miles !== null ? num(miles) : "—"}</span>
    </div>`,
  };
}

export function motHeadline(input: ReportInput): { lead: string; tail: string; tailRisk: boolean; deck: string } {
  const tests = input.data.motTests ?? [];
  const fails = tests.filter((x) => x.testResult === "FAILED").length;
  const warnings = input.motInsights?.mileageWarnings ?? [];
  const lead = `${countWord(tests.length)} ${plural(tests.length, "test")}, ${fails === 0 ? "no fails," : `${countWord(fails).toLowerCase()} ${plural(fails, "fail")},`}`;
  const tail = warnings.length === 0 ? "no mileage warnings." : `${countWord(warnings.length).toLowerCase()} mileage ${plural(warnings.length, "warning")}.`;
  const avg = input.motInsights?.avgMilesPerYear;
  const deck = [
    avg ? `The mileage climbs about ${num(avg)} miles a year between tests${warnings.length === 0 ? ", with no drops that would suggest a clocked odometer" : ""}.` : null,
    warnings.length > 0 ? warnings.join(" ") : null,
  ].filter(Boolean).join(" ");
  return { lead, tail, tailRisk: warnings.length > 0, deck };
}

export function motPages(input: ReportInput, t: ThemeTokens, firstFolio: number): Safe[] {
  const tests = sortedTests(input);
  if (tests.length === 0) return [];
  const { lead, tail, tailRisk, deck } = motHeadline(input);
  const chart = mileageChart(tests, t);

  const blocks: Block[] = tests.map((x) => testBlock(x, t));

  const recurring = input.motInsights?.recurringAdvisories ?? [];
  const latest = tests[0];
  const latestDate = parseDate(latest.completedDate);
  const latestAdvisories = (latest.rfrAndComments ?? []).filter((i) => String(i.type).toUpperCase() === "ADVISORY").length;
  const quote = recurring.length > 0
    ? `“${recurring[0].text}” has come up at ${recurring[0].count} MOTs. Ask what has been done about it.`
    : latestAdvisories > 0 && latestDate
      ? `If you're buying, ask the seller what was done about the ${latestDate.getUTCFullYear()} ${plural(latestAdvisories, "advisory", "advisories")}.`
      : null;
  const expiry = parseDate(input.data.motExpiryDate);
  if (quote || expiry) {
    blocks.push({
      h: 130,
      html: html`<blockquote class="pullquote" style="border-color:${t.ruleStrong}">
        ${quote ? html`<p class="display">${quote}</p>` : html`<p></p>`}
        ${expiry ? html`<div class="due"><span class="mono label" style="color:${t.muted}">NEXT MOT DUE</span><span class="due-date">${shortDate(expiry)}</span></div>` : ""}
      </blockquote>`,
    });
  }

  // Headline: two lines at 60px. Chart figure: 30 margin + 240 + caption 28.
  const deckH = deck ? textHeight(deck, 560, 16, 1.6) + 16 : 0;
  const firstRoom = BODY_HEIGHT - 120 - deckH - (chart ? 298 : 0) - 30;
  const pages = paginate(blocks, firstRoom, CONTINUED_ROOM);

  return pages.map((content, i) => {
    const head = i === 0
      ? html`<h1 class="display h-page h-mot">${lead} <em style="color:${tailRisk ? t.risk : t.accent}">${tail}</em></h1>
        ${deck ? html`<p class="lede narrow" style="color:${t.soft}">${deck}</p>` : ""}
        ${chart ? html`<figure class="chart">${chart}<figcaption style="color:${t.muted}">Mileage recorded at each MOT. Red marks a failed test.</figcaption></figure>` : ""}`
      : html`<h2 class="display h-cont">The MOT story, continued</h2>`;
    return pageShell(t, input, "The MOT story", firstFolio + i, html`${head}<div class="tests">${content}</div>`);
  });
}
