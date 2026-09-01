/**
 * Crawler detection for outbound affiliate redirects.
 *
 * Why this exists: affiliate networks count a click the moment their tracker
 * URL is requested — they have no idea whether a human or a crawler made the
 * request. Our blog carries inline partner links in the prose, and
 * `robots.ts` deliberately welcomes AI crawlers (GPTBot, ClaudeBot,
 * PerplexityBot et al) so the site earns LLM citations. Those two facts
 * combine badly: a single link-following pass over the blog registers as real
 * traffic in the partner's dashboard, inflating clicks against zero sales and
 * dragging our conversion rate toward zero.
 *
 * `rel="nofollow"` and a robots.txt disallow are the polite half of the fix —
 * they only work on crawlers that choose to obey. This is the half that holds
 * regardless: /go/* serves well-behaved crawlers a 204 instead of a redirect,
 * so the partner's tracker is never reached and no click is recorded.
 *
 * Deliberately matched loosely. A false positive costs one affiliate click;
 * a false negative costs a polluted conversion rate and an awkward
 * conversation with the partner. Erring toward "treat it as a bot" is right.
 */
const BOT_UA_RE = new RegExp(
  [
    // Generic self-identifying tokens — catches the long tail of scrapers,
    // monitors and link-preview fetchers that never make the named list.
    "bot", "crawl", "spider", "slurp",
    // Link unfurlers / previewers: they fetch every URL in a shared message.
    "preview", "fetcher", "embedly", "quora link", "outbrain",
    "whatsapp", "telegram", "discord", "slack", "vkshare", "skypeuripreview",
    // HTTP libraries and CLI tools — never a real reader.
    "curl", "wget", "python-requests", "python-urllib", "httpx", "aiohttp",
    "okhttp", "java/", "go-http-client", "libwww-perl", "guzzle", "axios",
    "node-fetch", "postman", "insomnia", "scrapy", "headlesschrome",
    // Named AI crawlers. These are the ones robots.ts explicitly allows, so
    // they will reach the blog and see the links.
    "gptbot", "oai-searchbot", "chatgpt-user", "claudebot", "claude-web",
    "anthropic-ai", "perplexitybot", "perplexity-user", "google-extended",
    "applebot", "bytespider", "ccbot", "cohere-ai", "diffbot", "meta-external",
    "amazonbot", "youbot", "timpibot", "omgili", "petalbot", "duckassistbot",
    // Uptime / SEO / security scanners.
    "pingdom", "uptimerobot", "statuscake", "site24x7", "datadog",
    "ahrefs", "semrush", "mj12", "dotbot", "screaming frog", "lighthouse",
    "chrome-privacy-preserving-prefetch",
  ].join("|"),
  "i",
);

/**
 * True when the request looks like a crawler, scraper, preview fetcher or
 * monitoring agent rather than a person clicking a link.
 *
 * An absent or empty User-Agent counts as a bot: every real browser sends
 * one, so a blank UA is either a script or something deliberately hiding.
 */
export function isBotRequest(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim();
  if (!ua) return true;
  return BOT_UA_RE.test(ua);
}

/**
 * True for browser-initiated speculative fetches — prefetch, prerender and
 * link-preload. Chrome's speculation rules and `<link rel=prefetch>` will
 * happily fetch a redirect target before the user has clicked anything, which
 * would bank an affiliate click for a page view that never happened.
 *
 * Detected via the Fetch Metadata and prefetch hint headers browsers send on
 * speculative requests. Absent headers mean "not speculative" — the common
 * case for a genuine click.
 */
export function isSpeculativeRequest(headers: Headers): boolean {
  const purpose = headers.get("sec-purpose") ?? headers.get("purpose") ?? "";
  if (/prefetch|prerender|preview/i.test(purpose)) return true;
  // Moz-Purpose is Firefox's equivalent; X-Purpose is the older Safari form.
  const moz = headers.get("moz-purpose") ?? headers.get("x-purpose") ?? "";
  return /prefetch|prerender|preview/i.test(moz);
}
