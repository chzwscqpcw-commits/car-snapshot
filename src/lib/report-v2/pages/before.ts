import type { ReportInput } from "@/lib/generateReport";
import { html, raw, type Safe } from "../html";
import { CARVERTICAL_PRICING, carVerticalDiscountedSingle, goLink } from "@/config/partners";
import { qrSvg } from "../qr";
import type { ThemeTokens } from "../theme";
import { formatPlate, shortDate } from "../format";
import { BODY_HEIGHT, CONTINUED_ROOM, type Block, pageShell, paginate, textHeight } from "./shared";

// Last section · Next steps: checklists for buyers, owners and sellers, the
// history check the free data can't do, and where the data comes from. Always
// printed. (Was "Before you buy", which only fitted one of the three readers.)

const LISTS: Array<{ key: "buyer" | "owner" | "seller"; title: string }> = [
  { key: "buyer", title: "If you're buying" },
  { key: "owner", title: "If you own it" },
  { key: "seller", title: "If you're selling" },
];

const SOURCES = [
  "Vehicle record: DVLA Vehicle Enquiry Service",
  "MOT history: DVSA MOT History API",
  "Model pass rates: DVSA anonymised MOT data",
  "Theft rates: DVLA stolen-vehicle records (FOI) and DfT licensing statistics",
  "Values, running costs and repair estimates: Free Plate Check models, using live listings where available",
];

const LIST_W = 300;

const SITE = "https://www.freeplatecheck.co.uk";

/**
 * The carVertical link: through /go so the click is recorded (context
 * pdf-carvertical, `v` = the edition), which redirects to carVertical's
 * tracker with our 20% code applied. No plate in it (Oct 2026): a printed or
 * scanned link can't hand one over except in the URL, and a plate in a /go URL
 * lands in server logs — the reader types it into carVertical instead.
 */
export function carVerticalReportLink(t: ThemeTokens): string {
  return SITE + goLink("carvertical", "pdf-carvertical", t.name === "light" ? "print" : "dark");
}

/** What the free data can't show, and the carVertical report that can: QR + link. */
function historyPanel(input: ReportInput, t: ThemeTokens): Safe {
  const plate = formatPlate(input.data.registrationNumber);
  const href = carVerticalReportLink(t);
  return html`<div class="history" style="border-color:${t.ruleStrong}">
    <div class="stack-10 history-text">
      <span class="mono label" style="color:${t.accent}">WHAT THIS REPORT CAN'T SEE</span>
      <h2 class="display history-title">Finance, write-offs and stolen markers.</h2>
      <p style="color:${t.soft}">Free government data doesn't show whether ${plate} has outstanding finance, has been written off or is flagged as stolen. A carVertical history report checks those, along with mileage records.</p>
      <p style="color:${t.soft}"><strong style="color:${t.ink}">£${CARVERTICAL_PRICING.single.toFixed(2)}, or ${carVerticalDiscountedSingle()} with code <span class="mono">freeplatecheck</span></strong> (${CARVERTICAL_PRICING.discountPct}% off, applied automatically through this link).</p>
      <a class="history-link" href="${href}" style="color:${t.accent}">Check ${plate} on carVertical<svg aria-hidden="true" width="14" height="10" viewBox="0 0 14 10"><path d="M1 5h11M8 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <span class="fine" style="color:${t.muted}">Partner link: Free Plate Check earns a commission if you buy, at no extra cost to you.</span>
    </div>
    <a class="qr" href="${href}" aria-label="Check ${plate} on carVertical">${raw(qrSvg(href, 132))}<span class="mono" style="color:${t.muted}">SCAN OR TAP</span></a>
  </div>`;
}

export function beforePages(input: ReportInput, t: ThemeTokens, firstFolio: number, now: Date): Safe[] {
  const blocks: Block[] = [];
  for (const list of LISTS) {
    const items = input.checklist?.[list.key] ?? [];
    if (items.length === 0) continue;
    // Items sit in two columns, so each row is as tall as its taller item.
    let h = 52;
    for (let r = 0; r < items.length; r += 2) {
      h += Math.max(...items.slice(r, r + 2).map((i) => textHeight(i, LIST_W - 24, 14, 1.45))) + 17;
    }
    blocks.push({
      h,
      html: html`<div class="checklist">
        <h2 class="display check-title">${list.title}</h2>
        <ul>${items.map((i) => html`<li style="border-color:${t.rule}"><span class="box" style="border-color:${t.ruleStrong}"></span><span>${i}</span></li>`)}</ul>
      </div>`,
    });
  }
  blocks.push({
    h: 520,
    html: html`<div class="closing">
    ${historyPanel(input, t)}
    <div class="fineprint" style="border-color:${t.ruleStrong}">
      <div class="stack-6">
        <h2 class="eyebrow">WHERE THIS COMES FROM</h2>
        ${SOURCES.map((s) => html`<p style="color:${t.soft}">${s}</p>`)}
      </div>
      <div class="stack-6">
        <h2 class="eyebrow">PLEASE NOTE</h2>
        <p style="color:${t.soft}">Don't rely on any report alone to buy a car: inspect it, check the V5C matches the car and seller, and consider a mechanic's inspection.</p>
        <p style="color:${t.soft}">Government data can lag behind real events. Free Plate Check doesn't guarantee the information is complete or current.</p>
      </div>
    </div>
    <div class="signoff mono" style="color:${t.muted}"><span>Generated ${shortDate(now)} at ${now.toISOString().slice(11, 16)} UTC</span><span>freeplatecheck.co.uk</span></div>
    </div>`,
  });

  const pages = paginate(blocks, BODY_HEIGHT - 64 - 28, CONTINUED_ROOM);
  return pages.map((content, i) =>
    pageShell(t, input, "Next steps", firstFolio + i, html`${i === 0 ? html`<h1 class="display h-page">What to do next.</h1>` : html`<h2 class="display h-cont">Next steps, continued</h2>`}<div class="stack-24 fill">${content}</div>`),
  );
}
