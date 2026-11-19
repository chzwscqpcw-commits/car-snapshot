/**
 * Where the MOT prompts in blog articles send a reader: our own booking tool,
 * at the price step.
 *
 * Until Nov 2026 both prompts linked straight to the garage-booking partner.
 * The mid-article card was seen on 569 visitor-days between 12 Sep and 17 Nov
 * 2026 and clicked on 2. Over the same weeks the booking tool handed off 66 of
 * the 104 visitor-days that arrived at its price step with a registration
 * (the box on /cheap-mot), against 2 of 35 that arrived at step 1 with
 * nothing filled in. So the prompts now ask for the registration in the
 * article and open the tool where the price is.
 *
 * One identifier per placement, used three ways so the numbers join without a
 * mapping table: the `source` on `booking_entry_impression` (the box was
 * seen) and `booking_entry_click` (it was used), and the `?source=` the
 * wizard carries on `booking_wizard_start` and every later step. The inline
 * value is the old card's `click_context`, so before and after read on one
 * string.
 */
import { plateHref } from "./plate-url";

export type BlogMotPlacement = "inline" | "foot";

export const BLOG_MOT_SOURCE: Record<BlogMotPlacement, string> = {
  inline: "blog-mot-inline",
  foot: "blog-mot-foot",
};

export function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

/** Loose on purpose: the wizard's lookup is the real test of a plate. */
export function looksLikeReg(cleaned: string): boolean {
  return cleaned.length >= 2 && cleaned.length <= 8;
}

/**
 * The wizard address for a placement.
 *
 * With a registration it rides in the fragment (never the query string, so it
 * never reaches a server or a log), and the wizard opens at the price step
 * because the service is already chosen. Without one, `noreg=1` asks the
 * wizard for the same step with no car: an MOT costs the same whatever the
 * car, so the price step has everything it needs.
 */
export function blogMotBookingHref(placement: BlogMotPlacement, reg: string): string {
  const qs = new URLSearchParams({ type: "mot", source: BLOG_MOT_SOURCE[placement] });
  const cleaned = cleanReg(reg);
  if (!cleaned) qs.set("noreg", "1");
  return plateHref(`/booking?${qs.toString()}`, cleaned);
}
