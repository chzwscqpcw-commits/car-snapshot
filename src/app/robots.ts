export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
      // Explicitly welcome AI crawlers for citation visibility
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: "/api/",
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: "/api/",
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: "/api/",
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: "/api/",
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: "/api/",
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: "/api/",
      },
      {
        userAgent: "cohere-ai",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: "https://www.freeplatecheck.co.uk/sitemap.xml",
  };
}
