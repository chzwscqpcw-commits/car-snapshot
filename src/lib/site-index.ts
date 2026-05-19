/**
 * Site search index — the universe of destinations the command palette can
 * navigate to. Hand-curated so the most-useful results surface first; the
 * blog post index is fetched async from /api/posts and merged at runtime.
 */

export type SiteItemCategory =
  | "check"
  | "tool"
  | "stats"
  | "guide"
  | "site"
  | "action";

export interface SiteItem {
  title: string;
  subtitle?: string;
  href: string;
  category: SiteItemCategory;
  /** Extra terms to match against, beyond title + subtitle. */
  keywords?: string[];
  /** Optional Lucide icon name string (rendered by the palette). */
  icon?: string;
}

export const SITE_ITEMS: SiteItem[] = [
  // ─── Checks ───
  {
    title: "Free vehicle check",
    subtitle: "Full report from a reg",
    href: "/",
    category: "check",
    keywords: ["check", "lookup", "registration", "vrm", "report"],
    icon: "search",
  },
  {
    title: "MOT check",
    subtitle: "Pass/fail history & advisories",
    href: "/mot-check",
    category: "check",
    keywords: ["mot", "test", "expiry", "advisory", "pass rate"],
    icon: "shield-check",
  },
  {
    title: "Tax check",
    subtitle: "Current tax status & due date",
    href: "/tax-check",
    category: "check",
    keywords: ["tax", "ved", "road tax", "sorn", "expired"],
    icon: "receipt",
  },
  {
    title: "Mileage check",
    subtitle: "Odometer history & clocking signs",
    href: "/mileage-check",
    category: "check",
    keywords: ["mileage", "odometer", "clocking", "history"],
    icon: "gauge",
  },
  {
    title: "ULEZ check",
    subtitle: "London ULEZ & clean-air compliance",
    href: "/ulez-check",
    category: "check",
    keywords: ["ulez", "emissions", "clean air", "caz", "london"],
    icon: "wind",
  },
  {
    title: "Recall check",
    subtitle: "Safety recall lookup",
    href: "/recall-check",
    category: "check",
    keywords: ["recall", "safety", "defect"],
    icon: "alert-triangle",
  },
  {
    title: "Car valuation",
    subtitle: "Free vehicle valuation",
    href: "/car-valuation",
    category: "check",
    keywords: ["valuation", "value", "worth", "price", "sell"],
    icon: "pound-sterling",
  },
  {
    title: "Car comparison",
    subtitle: "Compare two saved vehicles side-by-side",
    href: "/compare",
    category: "check",
    keywords: ["compare", "vs", "side by side"],
    icon: "git-compare",
  },

  // ─── Tools ───
  {
    title: "Free MOT reminder",
    subtitle: "We email you 28 & 7 days before",
    href: "/mot-reminder",
    category: "action",
    keywords: ["reminder", "mot reminder", "alert", "email", "notify"],
    icon: "bell",
  },
  {
    title: "All tools",
    subtitle: "Every free check & calculator in one place",
    href: "/tools",
    category: "tool",
    keywords: ["tools", "hub", "everything"],
    icon: "wrench",
  },
  {
    title: "Embed widget",
    subtitle: "Add a free check widget to your site",
    href: "/embed",
    category: "tool",
    keywords: ["embed", "widget", "iframe", "code"],
    icon: "code",
  },
  {
    title: "Running cost calculators",
    subtitle: "Annual fuel, tax, insurance & servicing",
    href: "/running-costs",
    category: "tool",
    keywords: ["running cost", "cost of ownership", "calculator"],
    icon: "calculator",
  },
  {
    title: "Servicing & repair guides",
    subtitle: "Costs, intervals & how-to",
    href: "/servicing",
    category: "tool",
    keywords: ["service", "servicing", "repair", "garage", "mechanic"],
    icon: "wrench",
  },
  {
    title: "Repair cost calculators",
    subtitle: "Estimate common repair prices",
    href: "/repair-costs",
    category: "tool",
    keywords: ["repair", "fix", "cost", "estimate", "garage", "price"],
    icon: "wrench",
  },

  // ─── Stats ───
  {
    title: "UK motoring statistics",
    subtitle: "Hub: MOT, fuel, theft, EV, road safety",
    href: "/stats",
    category: "stats",
    keywords: ["stats", "statistics", "data", "charts"],
    icon: "bar-chart-3",
  },
  {
    title: "UK fuel prices",
    subtitle: "Petrol & diesel by region",
    href: "/stats/fuel-prices",
    category: "stats",
    keywords: ["fuel", "petrol", "diesel", "price", "average"],
    icon: "fuel",
  },

  // ─── Guides ───
  {
    title: "All car guides",
    subtitle: "Browse every guide",
    href: "/blog",
    category: "guide",
    keywords: ["blog", "articles", "guides"],
    icon: "book-open",
  },
  {
    title: "Clean air zones (UK)",
    subtitle: "Every CAZ explained — fees, vehicles, dates",
    href: "/clean-air-zones",
    category: "guide",
    keywords: ["caz", "clean air zone", "london", "birmingham", "bristol", "sheffield", "bath"],
    icon: "wind",
  },
  {
    title: "Cars browser",
    subtitle: "Every UK make & model",
    href: "/cars",
    category: "guide",
    keywords: ["cars", "make", "model", "browse"],
    icon: "car",
  },

  // ─── Site ───
  { title: "About", href: "/about", category: "site", keywords: ["about", "who", "team"] },
  { title: "Contact", subtitle: "Get in touch — ideas, bugs, business", href: "/contact", category: "site", keywords: ["contact", "email", "support", "feedback", "message"] },
  { title: "Privacy", href: "/privacy", category: "site", keywords: ["privacy", "gdpr", "data"] },
  { title: "Terms", href: "/terms", category: "site", keywords: ["terms", "conditions"] },
];

/** Top-level links shown in the persistent nav (kept very short). */
export const PRIMARY_NAV: { label: string; href: string }[] = [
  { label: "Tools", href: "/tools" },
  { label: "Stats", href: "/stats" },
  { label: "Guides", href: "/blog" },
];

/** Detect a plausible UK vehicle reg (2-8 alphanumeric after stripping). */
export function detectReg(input: string): string | null {
  const cleaned = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (cleaned.length < 2 || cleaned.length > 8) return null;
  // Must contain at least one digit and one letter to look like a reg
  if (!/[A-Z]/.test(cleaned) || !/[0-9]/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Cheap relevance scorer — prefix > word-start > substring > token overlap.
 * Returns 0 for non-matches so callers can filter.
 */
export function scoreItem(item: SiteItem, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const title = item.title.toLowerCase();
  const sub = (item.subtitle ?? "").toLowerCase();
  const kw = (item.keywords ?? []).join(" ").toLowerCase();
  const hay = `${title} ${sub} ${kw}`;

  if (title === q) return 1000;
  if (title.startsWith(q)) return 500;
  // Word-start match anywhere
  if (new RegExp(`(^|\\s)${escapeRegExp(q)}`).test(hay)) return 200;
  if (hay.includes(q)) return 80;

  // Token overlap — every query token must appear somewhere
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const matched = tokens.filter((t) => hay.includes(t)).length;
    if (matched === tokens.length) return 40;
    if (matched > 0) return 5 * matched;
  }
  return 0;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
