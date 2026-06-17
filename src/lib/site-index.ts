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
    title: "Car check",
    subtitle: "Free UK vehicle lookup from a reg",
    href: "/car-check",
    category: "check",
    keywords: ["car check", "vehicle check", "reg check", "free check", "history"],
    icon: "car",
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
    title: "Book MOT or service",
    subtitle: "Compare local garage prices — pre-filled hand-off",
    href: "/booking",
    category: "action",
    keywords: [
      "book",
      "booking",
      "garage",
      "service",
      "interim",
      "full service",
      "mot test",
      "mot near me",
      "diagnostic",
      "compare prices",
      "bookmygarage",
      "bmg",
    ],
    icon: "calendar-check",
  },
  {
    title: "Free MOT reminder",
    subtitle: "We email you before it's due — you choose when",
    href: "/mot-reminder",
    category: "action",
    keywords: ["reminder", "mot reminder", "alert", "email", "notify"],
    icon: "bell",
  },
  {
    title: "Cheap MOT near you",
    subtitle: "Compare local garage MOT prices",
    href: "/cheap-mot",
    category: "action",
    keywords: ["cheap mot", "cheapest mot", "mot price", "mot cost", "mot near me", "compare mot"],
    icon: "pound-sterling",
  },
  {
    title: "MOT prices by town",
    subtitle: "Average MOT prices for your area",
    href: "/mot-prices",
    category: "action",
    keywords: ["mot prices", "mot by town", "mot cost", "local mot", "compare mot"],
    icon: "pound-sterling",
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
    title: "EV charger installation",
    subtitle: "7kW home charger fitted from £752",
    href: "/ev-charger-installation",
    category: "tool",
    keywords: ["ev", "charger", "electric", "home charger", "install", "ohme", "zappi", "7kw"],
    icon: "zap",
  },
  {
    title: "Pre-purchase car inspection",
    subtitle: "A mechanic checks the car from £79",
    href: "/pre-purchase-inspection",
    category: "tool",
    keywords: ["inspection", "pre-purchase", "mechanic", "before buying", "used car inspection", "check over"],
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
  {
    title: "Aircon regas cost",
    subtitle: "What an air-con regas costs",
    href: "/repair-costs/aircon-regas",
    category: "tool",
    keywords: ["aircon regas", "air con", "ac recharge", "air conditioning"],
    icon: "wrench",
  },
  {
    title: "Cambelt replacement cost",
    subtitle: "Timing-belt replacement prices",
    href: "/repair-costs/cambelt-replacement",
    category: "tool",
    keywords: ["cambelt", "timing belt", "belt replacement"],
    icon: "wrench",
  },
  {
    title: "DPF cleaning cost",
    subtitle: "Diesel particulate filter cleaning",
    href: "/repair-costs/dpf-cleaning",
    category: "tool",
    keywords: ["dpf", "diesel particulate filter", "dpf clean"],
    icon: "wrench",
  },
  {
    title: "Brake pads replacement cost",
    subtitle: "Front & rear brake-pad prices",
    href: "/repair-costs/brake-pads-replacement",
    category: "tool",
    keywords: ["brake pads", "brakes", "pad replacement"],
    icon: "wrench",
  },
  {
    title: "Car battery replacement cost",
    subtitle: "12V battery replacement prices",
    href: "/repair-costs/car-battery-replacement",
    category: "tool",
    keywords: ["car battery", "battery replacement", "12v battery", "flat battery"],
    icon: "wrench",
  },
  {
    title: "Clutch replacement cost",
    subtitle: "Clutch replacement prices",
    href: "/repair-costs/clutch-replacement",
    category: "tool",
    keywords: ["clutch", "clutch replacement", "gearbox"],
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
  {
    title: "Cost of motoring",
    subtitle: "What running a car really costs per year",
    href: "/stats/cost-of-motoring",
    category: "stats",
    keywords: ["cost of motoring", "ownership cost", "running cost", "average cost"],
    icon: "pound-sterling",
  },
  {
    title: "Road tax (VED) history",
    subtitle: "How VED bands & rates changed",
    href: "/stats/road-tax-history",
    category: "stats",
    keywords: ["road tax", "ved", "vehicle excise duty", "tax bands", "tax history"],
    icon: "receipt",
  },
  {
    title: "Used car prices",
    subtitle: "UK used-car price index & trends",
    href: "/stats/used-car-prices",
    category: "stats",
    keywords: ["used car prices", "price index", "used market", "depreciation"],
    icon: "pound-sterling",
  },
  {
    title: "Fuel type comparison",
    subtitle: "EV vs petrol vs diesel cost per mile",
    href: "/stats/fuel-type-comparison",
    category: "stats",
    keywords: ["fuel type", "petrol vs diesel", "ev vs petrol", "cost per mile", "compare fuel"],
    icon: "fuel",
  },
  {
    title: "MOT pass rates",
    subtitle: "Pass/fail rates & top failure reasons",
    href: "/stats/mot-pass-rates",
    category: "stats",
    keywords: ["mot pass rate", "mot fail", "failure reasons", "pass rate"],
    icon: "shield-check",
  },
  {
    title: "Most reliable cars",
    subtitle: "Reliability rankings by make",
    href: "/stats/most-reliable-cars",
    category: "stats",
    keywords: ["reliable cars", "reliability", "most reliable", "breakdown rates"],
    icon: "bar-chart-3",
  },
  {
    title: "UK mileage trends",
    subtitle: "Average annual mileage over time",
    href: "/stats/uk-mileage",
    category: "stats",
    keywords: ["mileage trends", "average mileage", "annual mileage", "miles per year"],
    icon: "gauge",
  },
  {
    title: "Most popular cars",
    subtitle: "Best-selling & most-registered models",
    href: "/stats/popular-cars",
    category: "stats",
    keywords: ["popular cars", "most registered", "best selling", "top cars"],
    icon: "car",
  },
  {
    title: "Car colours",
    subtitle: "Most popular UK car colours",
    href: "/stats/car-colours",
    category: "stats",
    keywords: ["car colours", "car colors", "popular colour", "grey", "most common colour"],
    icon: "bar-chart-3",
  },
  {
    title: "How many are left?",
    subtitle: "How many of each model survive on UK roads",
    href: "/stats/how-many-left",
    category: "stats",
    keywords: ["how many left", "left on uk roads", "how many", "survival", "rarity", "still on the road"],
    icon: "car",
  },
  {
    title: "EV adoption",
    subtitle: "Electric-car uptake & sales share",
    href: "/stats/ev-adoption",
    category: "stats",
    keywords: ["ev adoption", "electric cars", "ev sales", "electric vehicle uptake"],
    icon: "bar-chart-3",
  },
  {
    title: "Car registrations",
    subtitle: "New-car registration trends",
    href: "/stats/car-registrations",
    category: "stats",
    keywords: ["car registrations", "new car sales", "registrations", "smmt"],
    icon: "bar-chart-3",
  },
  {
    title: "Car theft statistics",
    subtitle: "Most-stolen models & theft trends",
    href: "/stats/car-theft",
    category: "stats",
    keywords: ["car theft", "stolen cars", "most stolen", "theft", "keyless"],
    icon: "alert-triangle",
  },
  {
    title: "Road safety",
    subtitle: "Road deaths & casualty trends",
    href: "/stats/road-safety",
    category: "stats",
    keywords: ["road safety", "road deaths", "casualties", "accidents"],
    icon: "bar-chart-3",
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
