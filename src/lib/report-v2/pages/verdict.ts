import type { ReportInput } from "@/lib/generateReport";
import { html, type Safe } from "../html";
import type { ThemeTokens } from "../theme";
import { countWord, pageShell, plural } from "./shared";

// 02 · The verdict: the health score, how it adds up, and up to three facts
// about the model (theft risk, model MOT pass rate, Euro NCAP).

type Fact = { label: string; value: string; text: string; color: string };

const THEFT_LABEL: Record<string, string> = {
  "very-high": "Very high",
  high: "High",
  moderate: "Moderate",
  low: "Low",
  "very-low": "Very low",
};

function facts(input: ReportInput, t: ThemeTokens): Fact[] {
  const out: Fact[] = [];
  const tr = input.theftRisk;
  if (tr) {
    const risky = tr.riskCategory === "very-high" || tr.riskCategory === "high";
    out.push({
      label: "THEFT RISK",
      value: THEFT_LABEL[tr.riskCategory] ?? tr.riskCategory,
      text: `${tr.theftsPer1000} per 1,000 of this model stolen a year; UK average ${tr.nationalAverage} for ${tr.fleet}`,
      color: risky ? t.risk : tr.riskCategory === "moderate" ? t.warn : t.good,
    });
  }
  const pr = input.motPassRate;
  if (pr) {
    out.push({
      label: "MODEL MOT PASS RATE",
      value: `${pr.passRate}%`,
      text: `First-time pass rate for this model; UK average ${pr.nationalAverage}%`,
      color: pr.passRate >= pr.nationalAverage ? t.good : t.warn,
    });
  }
  const nc = input.ncapRating;
  if (nc && nc.overallStars > 0) {
    out.push({
      label: "SAFETY",
      value: `${nc.overallStars} ${plural(nc.overallStars, "star")}`,
      text: `Euro NCAP, tested ${nc.yearTested}`,
      color: nc.overallStars >= 4 ? t.good : nc.overallStars === 3 ? t.warn : t.risk,
    });
  }
  return out.slice(0, 3);
}

/** "MOT Currency" → "MOT currency", "ULEZ" stays: lower-case all but acronyms. */
function lowerName(s: string): string {
  return s.split(" ").map((w) => (/^[A-Z0-9]{2,5}$/.test(w) ? w : w.toLowerCase())).join(" ");
}

export function verdictHeadline(hs: NonNullable<ReportInput["healthScore"]>): { headline: string; deck: string } {
  const parts = hs.breakdown.map((b) => ({ ...b, share: b.maxScore > 0 ? b.score / b.maxScore : 1 }));
  const weak = parts.filter((p) => p.share < 0.6).sort((a, b) => a.share - b.share);
  const strong = parts.filter((p) => p.share >= 1);
  const headline = weak.length === 0 ? `${hs.label}, with nothing that stands out.` : `${hs.label}, with ${countWord(weak.length).toLowerCase()} ${plural(weak.length, "thing")} to watch.`;
  const sentences: string[] = [];
  if (strong.length > 0) sentences.push(`Full marks for ${strong.slice(0, 3).map((s) => lowerName(s.category)).join(", ").replace(/, ([^,]*)$/, " and $1")}.`);
  for (const w of weak.slice(0, 2)) sentences.push(`${w.category}: ${w.detail.charAt(0).toLowerCase()}${w.detail.slice(1)}.`);
  return { headline, deck: sentences.join(" ") };
}

export function verdictPage(input: ReportInput, t: ThemeTokens, folio: number): Safe | null {
  const hs = input.healthScore;
  if (!hs) return null;
  const { headline, deck } = verdictHeadline(hs);
  const C = 2 * Math.PI * 112;
  const filled = Math.max(0, Math.min(1, hs.score / 100)) * C;
  const fs = facts(input, t);

  const rows = hs.breakdown.map((b) => {
    const share = b.maxScore > 0 ? b.score / b.maxScore : 0;
    const color = share >= 0.8 ? t.good : share >= 0.5 ? t.warn : t.risk;
    return html`<div class="score-row" style="border-color:${t.rule}">
      <div class="score-name"><span>${b.category}</span><span style="color:${t.muted}">${b.detail}</span></div>
      <div class="bar" style="background:${t.track}"><div style="width:${Math.round(share * 100)}%;background:${color}"></div></div>
      <span class="mono score-pts">${b.score} / ${b.maxScore}</span>
    </div>`;
  });

  return pageShell(t, input, "The verdict", folio, html`
  <div class="verdict-top">
    <div class="gauge">
      <svg role="img" aria-label="Health score ${hs.score} out of 100" width="250" height="250" viewBox="0 0 250 250">
        <circle cx="125" cy="125" r="112" fill="none" stroke="${t.rule}" stroke-width="6"/>
        <circle cx="125" cy="125" r="112" fill="none" stroke="${t.accent}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${filled.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 125 125)"/>
      </svg>
      <div class="gauge-label"><span class="display grade">${hs.grade}</span><span class="mono" style="color:${t.muted}">${hs.score} / 100</span></div>
    </div>
    <div class="stack-16">
      <h1 class="display h-page">${headline}</h1>
      <p class="lede" style="color:${t.soft}">${deck}</p>
    </div>
  </div>
  <div class="section-gap">
    <div class="table-head" style="border-color:${t.ruleStrong}"><h2 class="eyebrow">HOW THE SCORE ADDS UP</h2><span class="mono small" style="color:${t.muted}">POINTS</span></div>
    ${rows}
  </div>
  <div class="grow"></div>
  ${fs.length > 0 ? html`<div class="facts" style="border-color:${t.ruleStrong};grid-template-columns:repeat(${fs.length}, minmax(0, 1fr))">
    ${fs.map((f) => html`<div class="fact"><span class="mono label" style="color:${t.muted}">${f.label}</span><span class="display fact-value" style="color:${f.color}">${f.value}</span><span class="fact-text" style="color:${t.soft}">${f.text}</span></div>`)}
  </div>` : ""}`);
}
