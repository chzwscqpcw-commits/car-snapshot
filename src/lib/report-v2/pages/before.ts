import type { ReportInput } from "@/lib/generateReport";
import { html, type Safe } from "../html";
import type { ThemeTokens } from "../theme";
import { shortDate } from "../format";
import { BODY_HEIGHT, CONTINUED_ROOM, type Block, pageShell, paginate, textHeight } from "./shared";

// Last section · Before you buy: the three role checklists, where the data
// comes from, and what the report doesn't cover. Always printed.

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
    h: 280,
    html: html`<div class="fineprint" style="border-color:${t.ruleStrong}">
      <div class="stack-6">
        <h2 class="eyebrow">WHERE THIS COMES FROM</h2>
        ${SOURCES.map((s) => html`<p style="color:${t.soft}">${s}</p>`)}
      </div>
      <div class="stack-6">
        <h2 class="eyebrow">WHAT IT DOESN'T COVER</h2>
        <p style="color:${t.soft}">This report doesn't check outstanding finance, insurance write-offs, police stolen markers or previous keepers. Don't rely on it alone to buy a car: inspect it, check the V5C matches, and consider a mechanic's inspection.</p>
        <p style="color:${t.soft}">Government data can lag behind real events. Free Plate Check doesn't guarantee the information is complete or current.</p>
      </div>
    </div>
    <div class="signoff mono" style="color:${t.muted}"><span>Generated ${shortDate(now)} at ${now.toISOString().slice(11, 16)} UTC</span><span>freeplatecheck.co.uk</span></div>`,
  });

  const pages = paginate(blocks, BODY_HEIGHT - 64 - 28, CONTINUED_ROOM);
  return pages.map((content, i) =>
    pageShell(t, input, "Before you buy", firstFolio + i, html`${i === 0 ? html`<h1 class="display h-page">Before you buy.</h1>` : html`<h2 class="display h-cont">Before you buy, continued</h2>`}<div class="stack-24 fill">${content}</div>`),
  );
}
