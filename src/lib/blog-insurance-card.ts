import { hasInsuranceIntent, hasMotKeywords, hasVehicleHistoryIntent, hasWarrantyIntent } from "@/config/partners";

/**
 * Where the insurance card (InsuranceCTA, kind "car") sits in an article.
 *
 * Which posts: `showsInsuranceCard` — a post about insurance (hasInsuranceIntent)
 * that has no prompt of its own already and is not held (INSURANCE_CARD_HELD). An MOT post keeps its booking box, a
 * history post the buyer check, a warranty post the warranty card: a post never
 * gets two of those.
 *
 * Where: after the section named in INSURANCE_CARD_AFTER (a heading id), i.e.
 * just before the next `<h2>`, so it follows the section's last sentence. A
 * post not listed gets it before its last `<h2>` (the closing section), which
 * keeps the rule working for the next insurance post without a code change.
 */
export const BLOG_INSURANCE_CONTEXT = "blog-insurance-inline" as const;

/** slug -> id of the `<h2>` whose section the card follows. */
export const INSURANCE_CARD_AFTER: Record<string, string> = {
  "car-insurance-groups-explained": "how-to-check-a-cars-insurance-group-before-you-buy",
  "why-car-insurance-so-expensive-2026": "the-biggest-lever-shop-around",
};

/**
 * Insurance posts held back from this placement for now: the card does not
 * show, and the post is not part of what the partner is asked to approve.
 * driving-without-insurance-penalties (publishes 12 Dec 2026) is held; remove
 * it here, and give it an anchor above, when the placement is cleared for it.
 */
export const INSURANCE_CARD_HELD = ["driving-without-insurance-penalties"];

export function showsInsuranceCard(keywords: string[], slug?: string): boolean {
  return (
    !(slug && INSURANCE_CARD_HELD.includes(slug)) &&
    !hasMotKeywords(keywords) &&
    !hasVehicleHistoryIntent(keywords) &&
    !hasWarrantyIntent(keywords) &&
    hasInsuranceIntent(keywords)
  );
}

/**
 * The offset in `html` where the card goes, or null if the article has no
 * heading to hang it on. Found by the `<h2 id>` markup the blog pipeline
 * writes (src/lib/blog.ts, addHeadingIds).
 */
export function insuranceCardIndex(html: string, slug: string): number | null {
  const heads = [...html.matchAll(/<h2\b[^>]*>/gi)].map((m) => ({ at: m.index ?? 0, tag: m[0] }));
  if (heads.length < 2) return null;
  const anchor = INSURANCE_CARD_AFTER[slug];
  if (anchor) {
    const i = heads.findIndex((h) => h.tag.includes(`id="${anchor}"`));
    if (i >= 0 && i + 1 < heads.length) return heads[i + 1].at;
  }
  return heads[heads.length - 1].at;
}
