/**
 * robots.txt for freeplatecheck.co.uk
 *
 * Default rule blocks all crawler access to:
 * - /api/         — JSON endpoints; nothing to index
 * - /data-health  — admin dashboard behind a PIN gate; SEO-irrelevant
 * - /preview/     — internal screenshot/preview routes with fixture data,
 *                   explicitly tagged "not linked, robots-noindex" in code
 * - /demo/        — affiliate-partner demo previews behind a password
 *
 * AI crawlers (GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot etc.) are
 * explicitly welcomed at the top level so the site shows up in LLM
 * citations — same disallows otherwise. Without these, some AI crawlers
 * default to blocked.
 */

const DISALLOW = ["/api/", "/data-health", "/preview/", "/demo/"];

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
