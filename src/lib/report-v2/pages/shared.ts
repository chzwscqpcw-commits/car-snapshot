import type { ReportInput } from "@/lib/generateReport";
import { html, type Safe } from "../html";
import type { ThemeTokens } from "../theme";
import { formatPlate, titleCase } from "../format";

// The frame every inner page shares (kicker, running head, folio) and the
// paginator that splits long sections across pages.

/**
 * Usable height of a page body (px): 1123 less the padding (48 + 44), the
 * running head and its rule (68) and the footer (31). Measured from renders.
 */
export const BODY_HEIGHT = 932;
/** Body height left on a continuation page under its "…, continued" heading. */
export const CONTINUED_ROOM = BODY_HEIGHT - 70;

export function runningHead(input: ReportInput): string {
  const d = input.data;
  return `${formatPlate(d.registrationNumber)} · ${[d.yearOfManufacture, titleCase(d.make), titleCase(d.model)].filter(Boolean).join(" ")}`.toUpperCase();
}

export function pageShell(t: ThemeTokens, input: ReportInput, kicker: string, folio: number, body: Safe): Safe {
  const n = String(folio).padStart(2, "0");
  return html`<section class="page" style="background:${t.bg};color:${t.ink}">
  <div class="pad">
    <header class="runhead mono" style="color:${t.muted}"><span>${n} · ${kicker.toUpperCase()}</span><span>${runningHead(input)}</span></header>
    <div class="rule-tight" style="background:${t.rule}"></div>
    <div class="body">${body}</div>
    <footer class="foot mono" style="color:${t.muted}"><span>FREE PLATE CHECK</span><span>${n}</span></footer>
  </div>
</section>`;
}

/** A block of page content and its estimated rendered height in px. */
export type Block = { h: number; html: Safe };

/**
 * Split blocks into pages: the first page has `first` px free (it carries the
 * section's headline and chart), later pages `rest`. Heights are estimates
 * (see textHeight), so budgets keep a margin. A block taller than a whole page
 * still gets a page to itself rather than looping.
 */
export function paginate(blocks: Block[], first: number, rest: number): Safe[][] {
  const pages: Safe[][] = [[]];
  let room = first;
  for (const b of blocks) {
    const current = pages[pages.length - 1];
    if (b.h > room && current.length > 0) {
      pages.push([]);
      room = rest;
    }
    pages[pages.length - 1].push(b.html);
    room -= b.h;
  }
  return pages;
}

/**
 * Rough rendered height of wrapped text: Geist averages ~0.52em per character,
 * so a line holds width / (size × 0.52) characters.
 */
export function textHeight(text: string, widthPx: number, fontPx: number, lineHeight = 1.5): number {
  const perLine = Math.max(10, Math.floor(widthPx / (fontPx * 0.52)));
  const lines = Math.max(1, Math.ceil(text.length / perLine));
  return Math.ceil(lines * fontPx * lineHeight);
}

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/** 4 → "Four"; 15 → "15". */
export function countWord(n: number): string {
  return WORDS[n] ?? String(n);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}
