import type { NextConfig } from "next";

const CANONICAL_HOST = "www.freeplatecheck.co.uk";

const nextConfig: NextConfig = {
  compress: true,
  /**
   * Canonical-host redirects. Previously this was a src/middleware.ts that
   * inspected the Host header on every request and redirected the three
   * non-canonical hostnames to www.freeplatecheck.co.uk. Next.js 16
   * deprecated the middleware file convention in favour of proxy, but the
   * smarter migration here is to drop middleware/proxy entirely — pure
   * host→host redirects are exactly what next.config.redirects() is for,
   * they're handled at the Vercel edge without invoking any runtime, and
   * Vercel can serve them faster than middleware can return a Response.
   *
   * 301 (permanent) is correct here because the canonical domain decision
   * isn't going to flip back; this is the form Google should bake into its
   * index.
   */
  redirects: async () => [
    // Short, memorable social/marketing links → the EV-charger page. TikTok
    // captions aren't clickable and we've no bio link, so "freeplatecheck.co.uk/ev"
    // is a URL people can actually type. Not permanent: it's a campaign alias we
    // may want to repoint later.
    {
      source: "/ev",
      destination: `https://${CANONICAL_HOST}/ev-charger-installation`,
      permanent: false,
    },
    {
      source: "/ev-charger",
      destination: `https://${CANONICAL_HOST}/ev-charger-installation`,
      permanent: false,
    },
    // Three used-car buying posts consolidated into one pillar guide. They were
    // chasing the same intent as each other and splitting the ranking signal
    // between them; the pillar absorbs all three. 301 because the old URLs are
    // never coming back and we want Google to pass their equity to the pillar.
    {
      source: "/blog/how-to-check-car-before-buying-online",
      destination: `https://${CANONICAL_HOST}/blog/used-car-buying-guide`,
      permanent: true,
    },
    {
      source: "/blog/what-to-check-on-a-test-drive",
      destination: `https://${CANONICAL_HOST}/blog/used-car-buying-guide#the-test-drive`,
      permanent: true,
    },
    {
      source: "/blog/hidden-costs-buying-used-car",
      destination: `https://${CANONICAL_HOST}/blog/used-car-buying-guide#start-with-the-real-budget-not-the-sticker-price`,
      permanent: true,
    },
    {
      source: "/:path*",
      has: [{ type: "host", value: "freeplatecheck.com" }],
      destination: `https://${CANONICAL_HOST}/:path*`,
      permanent: true,
    },
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.freeplatecheck.com" }],
      destination: `https://${CANONICAL_HOST}/:path*`,
      permanent: true,
    },
    {
      source: "/:path*",
      has: [{ type: "host", value: "freeplatecheck.co.uk" }],
      destination: `https://${CANONICAL_HOST}/:path*`,
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/_next/static/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/:path*",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
    {
      // Generated OG/social preview images are assets referenced in meta
      // tags, not pages. Tell Google not to index them as pages — this clears
      // the "Crawled - currently not indexed" noise they create. Done via a
      // noindex header rather than a robots.txt Disallow on purpose: social
      // scrapers (Twitterbot/LinkedInBot) must still be able to FETCH the
      // image, and X-Robots-Tag noindex doesn't block the fetch.
      source: "/:path*/opengraph-image",
      headers: [{ key: "X-Robots-Tag", value: "noindex" }],
    },
  ],
};

export default nextConfig;
