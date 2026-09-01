/**
 * Affiliate links written inline in blog markdown.
 *
 * Component CTAs (WarrantyCTA, CarVerticalReportCTA, MOTBookingCTA …) build
 * their hrefs through `PARTNER_LINKS[…].buildLink` and get `rel` from
 * `getPartnerRel`, so they are tracked and correctly marked. Links typed into
 * a post's prose bypass all of that: `remark-html` renders `[text](url)` as a
 * bare `<a href="…">` with no `rel`, no `target` and no click handler.
 *
 * That left 18 raw partner links across 15 posts which were:
 *   1. invisible to us — no `partner_click`, so their traffic never appeared
 *      in `site_events` and no post could be judged on whether it earned;
 *   2. unmarked to Google — affiliate links require `rel="sponsored"`;
 *   3. followable by crawlers — and `robots.ts` explicitly welcomes AI
 *      crawlers, so a link-following pass banks real clicks at the partner
 *      against zero sales.
 *
 * This module fixes all three at render time rather than by hand-editing
 * markdown, so a future post that pastes a raw partner URL is covered
 * automatically instead of silently reopening the hole.
 */

/**
 * Partner hosts that appear (or plausibly will appear) in post prose, mapped
 * to the `/go/<partner>` key that owns the link. The key must exist in
 * `GO_PARTNERS` in `src/app/go/[partner]/route.ts`.
 *
 * Hosts listed here get their href replaced by the tracked redirect. Hosts in
 * `MARK_ONLY_HOSTS` below keep their href but still get `rel` + `target`.
 */
const REDIRECT_HOSTS: Record<string, string> = {
  "carvertical.deal": "carvertical",
  "www.carvertical.deal": "carvertical",
};

/**
 * Awin `cread.php` links written into prose, resolved to a `/go/<partner>` key.
 *
 * Awin puts every merchant behind the same host, so the host alone can't say
 * which partner a link belongs to — the merchant id (`awinmid`) and the
 * destination (`ued`) together can. There were 18 of these across the corpus,
 * every one of them without a `clickref`, which meant BookMyGarage commissions
 * earned by blog prose arrived in Awin as an undifferentiated lump with no way
 * to tell which post produced them. BookMyGarage is our highest-volume partner,
 * so that was the most valuable attribution we were throwing away.
 *
 * The `/go` route rebuilds each link from `partners.ts`, which produces the
 * same three destinations these already point at — so the reader lands exactly
 * where they did before, and we gain both a `partner_click` and a per-post
 * clickref.
 */
const AWIN_ROUTES: { mid: string; destContains: string; partner: string }[] = [
  { mid: "68338", destContains: "bookmygarage.com%2fmot", partner: "bookmygarage" },
  { mid: "68338", destContains: "bookmygarage.com%2fcar-servicing", partner: "bookmygarage-service" },
  { mid: "68338", destContains: "bookmygarage.com%2fcar-repairs", partner: "bookmygarage-repair" },
];

/**
 * Resolve an awin1.com tracker URL to a `/go` partner key, or null when it's a
 * merchant we don't re-route (in which case it's still marked, below).
 */
function awinPartnerFor(href: string): string | null {
  const mid = href.match(/[?&]awinmid=(\d+)/i)?.[1];
  if (!mid) return null;
  const lower = href.toLowerCase();
  for (const route of AWIN_ROUTES) {
    if (route.mid === mid && lower.includes(route.destContains)) {
      return route.partner;
    }
  }
  return null;
}

/**
 * Affiliate/monetised hosts we mark but do not re-route — either because the
 * network URL already carries its own attribution, or because no `/go` handler
 * exists for that merchant yet.
 */
const MARK_ONLY_HOSTS = new Set([
  "awin1.com",
  "www.awin1.com",
  "track.webgains.com",
  "tidd.ly",
  "clickmechanic.com",
  "www.clickmechanic.com",
  "bookmygarage.com",
  "www.bookmygarage.com",
  "warrantywise.co.uk",
  "www.warrantywise.co.uk",
]);

/** `rel` for a monetised outbound link: disclosed to Google, not followed. */
export const AFFILIATE_REL = "sponsored nofollow noopener noreferrer";

function hostOf(href: string): string | null {
  try {
    return new URL(href).hostname.toLowerCase();
  } catch {
    // Relative/internal links (/blog/…, #anchor) — not our concern.
    return null;
  }
}

/**
 * Rewrite the affiliate links in a rendered blog post's HTML.
 *
 * For every `<a>` pointing at a known partner host:
 *   · a `REDIRECT_HOSTS` match has its href swapped for `/go/<partner>?post=<slug>`,
 *     which records a `partner_click` server-side, blocks crawlers, and rebuilds
 *     the real tracker URL from `partners.ts` — one source of truth instead of a
 *     URL frozen into markdown months ago;
 *   · every match gets `rel="sponsored nofollow noopener noreferrer"` and
 *     `target="_blank"`, replacing any that were already there.
 *
 * Internal links and ordinary outbound citations (gov.uk, DVSA …) are left
 * untouched — `nofollow` on those would throw away legitimate outbound signal.
 *
 * @param htmlContent Rendered post HTML from remark.
 * @param slug        Post slug, used for per-post attribution.
 */
export function rewriteAffiliateLinks(htmlContent: string, slug: string): string {
  return htmlContent.replace(
    /<a\s+([^>]*?)>/gi,
    (whole: string, attrs: string) => {
      const hrefMatch = attrs.match(/href\s*=\s*"([^"]*)"/i);
      if (!hrefMatch) return whole;

      const href = hrefMatch[1];
      const host = hostOf(href);
      if (!host) return whole;

      // Host match first, then the Awin merchant-id lookup for the shared
      // awin1.com host.
      const partner =
        REDIRECT_HOSTS[host] ??
        (host.endsWith("awin1.com") ? awinPartnerFor(href) : null);
      if (!partner && !MARK_ONLY_HOSTS.has(host)) return whole;

      // Strip any rel/target already present so we don't emit duplicates.
      let next = attrs
        .replace(/\srel\s*=\s*"[^"]*"/gi, "")
        .replace(/\starget\s*=\s*"[^"]*"/gi, "");

      if (partner) {
        const to = `/go/${partner}?post=${encodeURIComponent(slug)}`;
        next = next.replace(/href\s*=\s*"[^"]*"/i, `href="${to}"`);
      }

      return `<a ${next.trim()} rel="${AFFILIATE_REL}" target="_blank">`;
    },
  );
}
