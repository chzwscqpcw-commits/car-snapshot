import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReportInput } from "@/lib/generateReport";
import { html, raw, type Safe } from "../html";
import type { ThemeTokens } from "../theme";
import { isMotorbike, isVan, num, pounds, shortVehicleName, vehicleNoun } from "../format";
import { qrSvg } from "../qr";
import { pageShell } from "./shared";
import { ASSUMED_ANNUAL_MILES } from "@/lib/fuel-economy";
import { goLink, isPartnerConfigured, PARTNER_LINKS } from "@/config/partners";

// 04 · The money: estimated value with its range against live asking prices,
// the cost to run, repairs to budget for, and the negotiation helper. Any
// part without data drops out; with none of it the page isn't printed.

function rangeBar(v: NonNullable<ReportInput["valuation"]>, t: ThemeTokens): Safe {
  const lowAsk = v.ebayMinPrice ?? null;
  const highAsk = v.ebayMaxPrice ?? null;
  const lo = Math.min(v.rangeLow, lowAsk ?? v.rangeLow);
  const hi = Math.max(v.rangeHigh, highAsk ?? v.rangeHigh);
  const pad = (hi - lo) * 0.08 || 500;
  const X0 = 20, X1 = 662;
  const x = (n: number) => X0 + ((n - (lo - pad)) / (hi + pad - (lo - pad))) * (X1 - X0);
  const est = v.estimatedValue;
  return html`<svg role="img" aria-label="Typical range ${pounds(v.rangeLow)} to ${pounds(v.rangeHigh)}${lowAsk && highAsk ? `; asking prices ${pounds(lowAsk)} to ${pounds(highAsk)}` : ""}" width="682" height="74" viewBox="0 0 682 74">
    ${lowAsk && highAsk ? html`<rect x="${x(lowAsk).toFixed(1)}" y="26" width="${(x(highAsk) - x(lowAsk)).toFixed(1)}" height="4" rx="2" fill="${t.ruleStrong}"/>
      <text x="${x(lowAsk).toFixed(1)}" y="66" text-anchor="middle" font-family="Geist Mono" font-size="11" fill="${t.muted}">${pounds(lowAsk)}</text>
      <text x="${x(highAsk).toFixed(1)}" y="66" text-anchor="middle" font-family="Geist Mono" font-size="11" fill="${t.muted}">${pounds(highAsk)}</text>` : ""}
    <rect x="${x(v.rangeLow).toFixed(1)}" y="20" width="${(x(v.rangeHigh) - x(v.rangeLow)).toFixed(1)}" height="16" rx="8" fill="${t.accent}" opacity="0.15"/>
    <rect x="${x(v.rangeLow).toFixed(1)}" y="20" width="${(x(v.rangeHigh) - x(v.rangeLow)).toFixed(1)}" height="16" rx="8" fill="none" stroke="${t.accent}" stroke-width="1.5"/>
    <text x="${x(v.rangeLow).toFixed(1)}" y="10" text-anchor="middle" font-family="Geist Mono" font-size="12" fill="${t.ink}">${pounds(v.rangeLow)}</text>
    <text x="${x(v.rangeHigh).toFixed(1)}" y="10" text-anchor="middle" font-family="Geist Mono" font-size="12" fill="${t.ink}">${pounds(v.rangeHigh)}</text>
    ${est ? html`<line x1="${x(est).toFixed(1)}" y1="8" x2="${x(est).toFixed(1)}" y2="48" stroke="${t.ink}" stroke-width="2.5"/>
      <text x="${x(est).toFixed(1)}" y="66" text-anchor="middle" font-family="Geist Mono" font-size="12" font-weight="600" fill="${t.ink}">${pounds(est)}</text>` : ""}
  </svg>`;
}

function valueSection(v: NonNullable<ReportInput["valuation"]>, t: ThemeTokens, noun: string): Safe {
  const conf = v.confidence.toLowerCase();
  // ± is half the range over the estimate, as on the website's confidence chip.
  const pct = v.estimatedValue ? Math.round(((v.rangeHigh - v.rangeLow) / 2 / v.estimatedValue) * 100) : null;
  const confColor = conf === "high" ? t.good : conf === "low" ? t.risk : t.warn;
  const hero = v.estimatedValue ? pounds(v.estimatedValue) : `${pounds(v.rangeLow)}–${pounds(v.rangeHigh)}`;
  const adjustments = [
    v.mileageAdjustmentPercent ? `mileage ${v.mileageAdjustmentPercent > 0 ? "+" : ""}${v.mileageAdjustmentPercent}%` : null,
    v.conditionAdjustmentPercent ? `condition ${v.conditionAdjustmentPercent > 0 ? "+" : ""}${v.conditionAdjustmentPercent}%` : null,
    v.colourAdjustmentPercent ? `colour ${v.colourAdjustmentPercent > 0 ? "+" : ""}${v.colourAdjustmentPercent}%` : null,
  ].filter(Boolean);
  const notes = [
    v.sources.length ? `Based on ${v.sources.join(", ").toLowerCase()}.` : null,
    adjustments.length ? `Adjusted for ${adjustments.join(", ")}.` : null,
    v.ebayDominantTransmission || v.ebayDominantBodyType ? `Most similar cars for sale: ${[v.ebayDominantTransmission, v.ebayDominantBodyType].filter(Boolean).join(", ").toLowerCase()}.` : null,
  ].filter(Boolean).join(" ");
  return html`<div class="value-head">
    <div class="stack-6"><span class="mono label" style="color:${t.muted}">ESTIMATED VALUE TODAY</span><span class="display value-hero${v.estimatedValue ? "" : " value-hero-range"}">${hero}</span></div>
    <div class="stack-6 right"><span class="conf" style="color:${confColor}">${conf.charAt(0).toUpperCase()}${conf.slice(1)} confidence${pct ? ` · ±${pct}%` : ""}</span>${v.ebayTotalListings ? html`<span class="small-text" style="color:${t.muted}">${num(v.ebayTotalListings)} similar cars for sale</span>` : ""}</div>
  </div>
  <figure class="chart tight">${rangeBar(v, t)}<figcaption style="color:${t.muted}">Shaded: typical range for this ${noun}.${v.ebayMinPrice && v.ebayMaxPrice ? " Thin line: asking prices for similar cars on sale now." : ""}${notes ? ` ${notes}` : ""}</figcaption></figure>`;
}

const SITE = "https://www.freeplatecheck.co.uk";

let wbacLogo: string | null = null;

/** WBAC's own logo (from their Rakuten creative), inlined: the renderer allows no network. */
function wbacLogoDataUri(): string {
  wbacLogo ??= `data:image/png;base64,${readFileSync(path.join(process.cwd(), "src", "lib", "report-v2", "assets", "wbac-logo.png")).toString("base64")}`;
  return wbacLogo;
}

/**
 * We Buy Any Car under the valuation, as on the website: QR code for a
 * printed or desktop copy, a tap-able link for a phone. Through /go (context
 * pdf-wbac, `v` = edition) so clicks are counted. Cars only: WBAC's programme
 * excludes vans, and motorbikes aren't what they buy. Wording sticks to WBAC's
 * approved creative ("Get Your Free 30 Second Car Valuation").
 */
function sellPanel(input: ReportInput, t: ThemeTokens): Safe | null {
  const bodyStyle = input.parsedModel?.bodyStyle;
  if (!isPartnerConfigured(PARTNER_LINKS.weBuyAnyCar) || isVan(input.data, bodyStyle) || isMotorbike(input.data)) return null;
  const href = SITE + goLink("webuyanycar", "pdf-wbac", t.name === "light" ? "print" : "dark");
  const name = shortVehicleName(input.data.make, input.data.model);
  return html`<div class="sell" style="border-color:${t.ruleStrong}">
    <div class="stack-6 sell-text">
      <div class="sell-head"><span class="mono label" style="color:${t.accent}">${name ? `SELLING YOUR ${name.toUpperCase()}?` : "THINKING OF SELLING?"}</span><img class="sell-logo" src="${wbacLogoDataUri()}" alt="We Buy Any Car" width="96" height="24"></div>
      <p style="color:${t.soft}">Our figure is a guide to what it's worth. To see what you could sell it for today, get your free 30 second car valuation from We Buy Any Car.</p>
      <a class="history-link" href="${href}" style="color:${t.accent}">Get my free valuation<svg aria-hidden="true" width="14" height="10" viewBox="0 0 14 10"><path d="M1 5h11M8 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <span class="fine" style="color:${t.muted}">Partner link: Free Plate Check may earn a commission, at no cost to you.</span>
    </div>
    <a class="qr" href="${href}" aria-label="Get a free valuation from We Buy Any Car">${raw(qrSvg(href, 96))}<span class="mono" style="color:${t.muted}">SCAN OR TAP</span></a>
  </div>`;
}

function costSection(input: ReportInput, t: ThemeTokens): Safe | null {
  const oc = input.ownershipCost;
  if (!oc || oc.totalAnnual <= 0) return null;
  const b = oc.breakdown;
  const parts = ([
    ["Depreciation", b.depreciation, t.accent],
    ["Fuel", b.fuel, t.soft],
    ["Servicing and repairs", b.maintenance, t.warn],
    ["Road tax", b.ved, t.good],
    ["MOT", b.mot, t.muted],
  ] as const).filter(([, v]) => v && v > 0) as Array<readonly [string, number, string]>;
  const total = oc.totalAnnual;
  const vsAvg = input.ukAverageCost ? total - input.ukAverageCost : null;
  // Fuel (and so the total and cost per mile) assumes the UK average mileage,
  // like every running-cost figure on the site. Say so, and if this car's own
  // MOT mileage is well off that, show what fuel would cost at its real rate.
  const own = input.motInsights?.avgMilesPerYear ?? null;
  const ownDiffers = own !== null && own > 0 && Math.abs(own - ASSUMED_ANNUAL_MILES) / ASSUMED_ANNUAL_MILES >= 0.15;
  const fuelAtOwn = ownDiffers && b.fuel ? Math.round((b.fuel * own!) / ASSUMED_ANNUAL_MILES / 10) * 10 : null;
  const mileageNote = `Based on ${num(ASSUMED_ANNUAL_MILES)} miles a year, the UK average (DfT).${
    ownDiffers ? ` This car has averaged about ${num(Math.round(own! / 100) * 100)} a year between MOTs${fuelAtOwn ? `, so its fuel is more likely about ${pounds(fuelAtOwn)} a year` : ""}.` : ""
  }`;
  return html`<div class="stack-14">
    <h2 class="eyebrow underline" style="border-color:${t.ruleStrong}">COST TO RUN</h2>
    <div class="cost-hero"><span class="display">${pounds(total)}</span><span style="color:${t.muted}">a year</span></div>
    <span class="small-text" style="color:${t.soft}">${pounds(total / 12)} a month · £${(total / 365).toFixed(2)} a day${oc.costPerMile ? ` · ${Math.round(oc.costPerMile * 100)}p a mile` : ""}</span>
    ${b.fuel ? html`<span class="small-text" style="color:${t.muted}">${mileageNote}</span>` : ""}
    <div class="stack-bar">${parts.map(([, v, c]) => html`<div style="width:${((v / total) * 100).toFixed(1)}%;background:${c}"></div>`)}</div>
    <div>${parts.map(([name, v, c]) => html`<div class="legend-row" style="border-color:${t.rule}"><i style="background:${c}"></i><span>${name}</span><span class="mono">${pounds(v)}</span></div>`)}</div>
    <span class="small-text" style="color:${t.muted}">${vsAvg !== null && input.ukAverageLabel ? `${pounds(Math.abs(vsAvg))} ${vsAvg <= 0 ? "less" : "more"} than a typical ${input.ukAverageLabel.toLowerCase()}. ` : ""}${oc.excludedNote}</span>
  </div>`;
}

function budgetSection(input: ReportInput, t: ThemeTokens): Safe | null {
  const mr = input.motReadiness;
  const items = mr?.riskItems ?? [];
  if (!mr || items.length === 0) return null;
  return html`<div class="stack-14">
    <h2 class="eyebrow underline" style="border-color:${t.ruleStrong}">BUDGET FOR SOON</h2>
    ${items.slice(0, 6).map((r) => html`<div class="budget-row" style="border-color:${t.rule}">
      <div class="stack-2"><span class="budget-name">${r.categoryLabel}${r.isRecurring ? html` <span class="mono tag" style="color:${t.warn}">RECURRING</span>` : ""}</span><span class="small-text" style="color:${t.soft}">${r.text}</span></div>
      <span class="mono">${pounds(r.estimatedCost.low)}–${pounds(r.estimatedCost.high)}</span>
    </div>`)}
    ${items.length > 1 ? html`<div class="budget-total"><span>Total, from the latest MOT advisories</span><span class="display" style="color:${t.warn}">${pounds(mr.totalEstimatedCost.low)}–${pounds(mr.totalEstimatedCost.high)}</span></div>` : ""}
  </div>`;
}

function negotiationSection(input: ReportInput, t: ThemeTokens): Safe | null {
  const n = input.negotiation;
  if (!n) return null;
  return html`<div class="stack-14">
    <h2 class="eyebrow underline" style="border-color:${t.ruleStrong}">IF YOU'RE BUYING: ROOM TO NEGOTIATE</h2>
    <div class="cost-hero"><span class="display">${n.suggestedDiscountPercent.low}–${n.suggestedDiscountPercent.high}%</span><span style="color:${t.muted}">off, about ${pounds(n.estimatedSaving.low)}–${pounds(n.estimatedSaving.high)}</span></div>
    ${n.reasons.slice(0, 4).map((r) => html`<div class="legend-row" style="border-color:${t.rule}"><span>${r}</span></div>`)}
  </div>`;
}

export function moneyHeadline(input: ReportInput): string | null {
  const v = input.valuation;
  if (v?.estimatedValue) return `Worth about ${pounds(v.estimatedValue)}.`;
  if (v) return `Worth ${pounds(v.rangeLow)} to ${pounds(v.rangeHigh)}.`;
  if (input.ownershipCost) return `About ${pounds(input.ownershipCost.totalAnnual)} a year to run.`;
  if (input.motReadiness?.riskItems?.length) return "What to budget for.";
  return null;
}

export function moneyPage(input: ReportInput, t: ThemeTokens, folio: number): Safe | null {
  if (!moneyHeadline(input)) return null;
  const v = input.valuation;
  const cost = costSection(input, t);
  const budget = budgetSection(input, t);
  const nego = negotiationSection(input, t);
  // Two columns under the value: cost to run on the left; budget and
  // negotiation stacked on the right. One column if only one has content.
  const right = [budget, nego].filter(Boolean) as Safe[];
  const cols = [cost, right.length ? html`<div class="stack-32">${right}</div>` : null].filter(Boolean) as Safe[];
  return pageShell(t, input, "The money", folio, html`
    ${v ? valueSection(v, t, vehicleNoun(input.data, input.parsedModel?.bodyStyle)) : html`<h1 class="display h-page">${moneyHeadline(input)}</h1>`}
    ${v ? sellPanel(input, t) : ""}
    ${cols.length ? html`<div class="money-cols" style="grid-template-columns:repeat(${cols.length}, minmax(0, 1fr))">${cols}</div>` : ""}
    <div class="grow"></div>
    ${v?.disclaimer ? html`<p class="fine" style="color:${t.muted}">${v.disclaimer}</p>` : ""}`);
}
