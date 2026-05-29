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
  ],
};

export default nextConfig;
