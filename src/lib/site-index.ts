/**
 * Site index — the one list of the site's public pages. The command palette
 * (⌘K), the mobile drawer and the /tools hub all read it, so a page added here
 * reaches all three at once; scripts/test-site-index.ts walks src/app and
 * fails when a public page is missing from it, which is how the index stopped
 * drifting (by 2026-11 it had no buyer's check, exemption check or the three
 * newer theft pages). Hand-ordered so the most-useful results surface first;
 * the blog post index is fetched async from /api/search-index and merged at
 * runtime.
 */

export type SiteItemCategory =
  | "check"
  | "tool"
  | "stats"
  | "guide"
  | "site"
  | "action";

export type ToolsSection = "checks" | "utilities";

export interface SiteItem {
  title: string;
  subtitle?: string;
  href: string;
  category: SiteItemCategory;
  /** Extra terms to match against, beyond title + subtitle. */
  keywords?: string[];
  /** Icon name, resolved through SITE_ICONS (src/components/site-icons.ts). */
  icon?: string;
  /** Present when the page has a card on /tools. */
  tools?: {
    section: ToolsSection;
    /** The card's copy — longer than `subtitle`, which the palette shows. */
    blurb: string;
    badge?: string;
    /** Where the card links when that isn't `href` (a sourced booking link). */
    href?: string;
  };
}

export const SITE_ITEMS: SiteItem[] = [
  // ─── Checks ───
  {
    title: "Free vehicle check",
    subtitle: "Full report from a reg",
    href: "/",
    category: "check",
    keywords: ["check", "lookup", "registration", "vrm", "report", "number plate", "plate check"],
    icon: "search",
    tools: {
      section: "checks",
      blurb: "Every check at once: DVLA spec, MOT history, tax, mileage, ULEZ, recalls, valuation and running costs on one page.",
      badge: "All-in-one",
    },
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
    tools: {
      section: "checks",
      blurb: "Pass/fail history, expiry date, advisories and a clocking-check on mileage.",
      badge: "Most popular",
    },
  },
  {
    title: "Tax check",
    subtitle: "Current tax status & due date",
    href: "/tax-check",
    category: "check",
    keywords: ["tax", "ved", "road tax", "sorn", "expired"],
    icon: "receipt",
    tools: {
      section: "checks",
      blurb: "Current tax status, expiry date and the annual VED rate for your reg.",
    },
  },
  {
    title: "Mileage check",
    subtitle: "Odometer history & clocking signs",
    href: "/mileage-check",
    category: "check",
    keywords: ["mileage", "odometer", "clocking", "history"],
    icon: "gauge",
    tools: {
      section: "checks",
      blurb: "Every MOT mileage reading plotted — spot clocking and inconsistencies.",
    },
  },
  {
    title: "ULEZ check",
    subtitle: "London ULEZ & clean-air compliance",
    href: "/ulez-check",
    category: "check",
    keywords: ["ulez", "emissions", "clean air", "caz", "london"],
    icon: "wind",
    tools: {
      section: "checks",
      blurb: "Instant compliance check for London ULEZ and every UK clean-air zone.",
    },
  },
  {
    title: "Recall check",
    subtitle: "Safety recall lookup",
    href: "/recall-check",
    category: "check",
    keywords: ["recall", "safety", "defect"],
    icon: "alert-triangle",
    tools: {
      section: "checks",
      blurb: "Match your vehicle against every open DVSA safety recall.",
    },
  },
  {
    title: "MOT exemption check",
    subtitle: "Is it over 40 and MOT-exempt? The exact date",
    href: "/mot-exemption-check",
    category: "check",
    keywords: [
      "exemption",
      "exempt",
      "mot exempt",
      "40 years",
      "classic",
      "historic",
      "historic vehicle",
      "historic tax class",
      "old car",
    ],
    icon: "shield-check",
    tools: {
      section: "checks",
      blurb: "Is your car over 40 and exempt from the MOT? See the exact date — and when the historic tax class starts, which isn't the same day.",
    },
  },
  {
    title: "Buyer's check",
    subtitle: "Does the car match its advert? Red flags before you buy",
    href: "/check-before-you-buy",
    category: "check",
    keywords: [
      "buying",
      "buyer",
      "buy",
      "used car",
      "before you buy",
      "check before you buy",
      "advert",
      "clone",
      "red flags",
      "viewing",
    ],
    icon: "clipboard-check",
    tools: {
      section: "checks",
      blurb: "Buying used? Check the car matches its advert, its red flags, and what free data can't show.",
    },
  },
  {
    title: "Car valuation",
    subtitle: "Free vehicle valuation",
    href: "/value-my-car",
    category: "check",
    keywords: ["valuation", "value", "value my car", "worth", "price", "sell"],
    icon: "pound-sterling",
    tools: {
      section: "checks",
      blurb: "Live market valuation built from real eBay listings and depreciation models.",
    },
  },
  {
    title: "Car comparison",
    subtitle: "Compare two saved vehicles side-by-side",
    href: "/compare",
    category: "check",
    keywords: ["compare", "vs", "side by side"],
    icon: "git-compare",
    tools: {
      section: "checks",
      blurb: "Side-by-side report for two saved vehicles — perfect for shortlisting.",
    },
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
    tools: {
      section: "utilities",
      blurb: "Pre-fill the reg once, compare MOT and service prices from local garages, and book in seconds. No email needed.",
      href: "/booking?source=tools_page",
    },
  },
  {
    title: "Cheap MOT near you",
    subtitle: "Compare local garage MOT prices",
    href: "/cheap-mot",
    category: "action",
    keywords: ["cheap mot", "cheapest mot", "mot price", "mot cost", "mot near me", "compare mot"],
    icon: "pound-sterling",
    tools: {
      section: "utilities",
      blurb: "Compare local garage MOT prices — many beat the £54.85 legal maximum.",
    },
  },
  {
    title: "MOT prices by town",
    subtitle: "What an MOT costs where you live",
    href: "/mot-prices",
    category: "action",
    keywords: ["mot prices", "mot by town", "mot cost", "local mot", "compare mot", "near me", "my town"],
    icon: "map-pin",
    tools: {
      section: "utilities",
      blurb: "What garages charge for an MOT in your town, from the DVSA's own test results by area.",
    },
  },
  {
    title: "Free MOT reminder",
    subtitle: "A nudge before it's due — plus tax, recall & value alerts",
    href: "/mot-reminder",
    category: "action",
    keywords: ["reminder", "mot reminder", "alert", "alerts", "email", "push", "notify", "my cars", "saved car"],
    icon: "bell",
    tools: {
      section: "utilities",
      blurb: "A heads-up before the MOT is due, timed how you like. Save a car and you also get tax, recall and value alerts, by push or email.",
    },
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
    tools: {
      section: "utilities",
      blurb: "Drop a free vehicle-check box on your own site in two lines of HTML.",
    },
  },
  {
    title: "Running cost calculators",
    subtitle: "Annual fuel, tax, insurance & servicing",
    href: "/running-costs",
    category: "tool",
    keywords: ["running cost", "cost of ownership", "calculator"],
    icon: "calculator",
    tools: {
      section: "utilities",
      blurb: "Annual fuel, tax, insurance and servicing for any UK car.",
    },
  },
  {
    title: "Servicing & repair guides",
    subtitle: "Costs, intervals & how-to",
    href: "/servicing",
    category: "tool",
    keywords: ["service", "servicing", "repair", "garage", "mechanic"],
    icon: "wrench",
    tools: {
      section: "utilities",
      blurb: "What each service includes, when it's due, and what it typically costs.",
    },
  },
  {
    title: "EV charger installation",
    subtitle: "7kW home charger fitted from £752",
    href: "/ev-charger-installation",
    category: "tool",
    keywords: ["ev", "charger", "ev charger", "ev charging", "electric", "charge at home", "home charger", "charging point", "install", "charger cost", "ohme", "zappi", "7kw"],
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
    tools: {
      section: "utilities",
      blurb: "Personalised price ranges for common repairs — based on your car.",
    },
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
    title: "Least stolen cars",
    subtitle: "The models thieves leave alone",
    href: "/stats/least-stolen-cars",
    category: "stats",
    keywords: ["least stolen", "rarely stolen", "safest cars", "theft rating", "low theft risk", "not stolen"],
    icon: "shield-check",
  },
  {
    title: "Van theft statistics",
    subtitle: "Most-stolen vans & theft rates",
    href: "/stats/van-theft",
    category: "stats",
    keywords: ["van theft", "stolen vans", "most stolen van", "transit", "lcv", "van crime"],
    icon: "alert-triangle",
  },
  {
    title: "Motorbike theft statistics",
    subtitle: "Most-stolen bikes & scooters",
    href: "/stats/motorbike-theft",
    category: "stats",
    keywords: ["motorbike theft", "motorcycle theft", "stolen bikes", "scooter theft", "moped", "bike crime"],
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

/** The cards /tools shows in a section, in index order. */
export function toolsPageItems(section: ToolsSection): SiteItem[] {
  return SITE_ITEMS.filter((item) => item.tools?.section === section);
}

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
