/**
 * Google AdSense — BLOG-ONLY display ads.
 *
 * Ships DORMANT: nothing renders and no script loads until a publisher ID is
 * configured, so this is safe to deploy now and activate later.
 *
 * Deliberately scoped to blog/guide pages only (via src/app/blog/layout.tsx) —
 * never the tool or results pages — to protect page speed (Core Web Vitals →
 * SEO) and the affiliate conversion funnel.
 *
 * To activate (no code change needed):
 *   1. Get approved for AdSense; note your publisher ID (ca-pub-XXXXXXXXXXXXXXXX).
 *   2. Create a responsive "in-article" ad unit; copy its data-ad-slot value.
 *   3. Set these env vars in Vercel and redeploy:
 *        NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
 *        NEXT_PUBLIC_ADSENSE_SLOT_BLOG=<the slot id>
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

/** Ad unit slot IDs (AdSense → Ads → By ad unit → copy the data-ad-slot value). */
export const AD_SLOTS = {
  /** Responsive in-article unit shown after a blog post body. */
  blogInArticle: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG ?? "",
} as const;

/** True only once a valid publisher ID is set. Gate ALL ad rendering on this. */
export function adsEnabled(): boolean {
  return /^ca-pub-\d{10,}$/.test(ADSENSE_CLIENT);
}
