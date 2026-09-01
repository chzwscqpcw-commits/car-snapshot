/**
 * robots.txt for freeplatecheck.co.uk
 *
 * Default rule blocks all crawler access to:
 * - /api/         — JSON endpoints; nothing to index
 * - /data-health  — admin dashboard behind a PIN gate; SEO-irrelevant
 * - /preview/     — internal screenshot/preview routes with fixture data,
 *                   explicitly tagged "not linked, robots-noindex" in code
 * - /demo/        — affiliate-partner demo previews behind a password
 * - /go/          — tracked outbound affiliate redirects. Nothing to index,
 *                   and following one banks a real click in the partner's
 *                   dashboard for a visit that never happened. The route
 *                   refuses crawlers itself too (src/lib/bots.ts) — this
 *                   disallow is the polite first line, not the only one.
 * - /*?vrm=       — plate-lookup deep-links (e.g. /car-valuation?vrm=AB12CDE).
 *                   `vrm` is the LIVE search param the app reads/writes; keep
 *                   this in lock-step with the router.push targets. These carry
 *                   a number plate (personal data), so they must never be
 *                   crawled or indexed — plus they're thin, near-duplicate,
 *                   effectively-infinite param URLs that waste crawl budget.
 * - /*?reg=       — legacy plate param + the old SearchAction template. Kept
 *                   blocked for defence-in-depth even though the app no longer
 *                   emits it. Every canonical page is param-free, so nothing
 *                   indexable is lost by blocking either param.
 *
 * AI crawlers (GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot etc.) are
 * explicitly welcomed at the top level so the site shows up in LLM
 * citations — same disallows otherwise. Without these, some AI crawlers
 * default to blocked.
 */

const DISALLOW = ["/api/", "/data-health", "/preview/", "/demo/", "/go/", "/*?vrm=", "/*?reg="];

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "cohere-ai",
];

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: "https://www.freeplatecheck.co.uk/sitemap.xml",
  };
}
