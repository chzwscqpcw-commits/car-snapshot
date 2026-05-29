export interface PartnerLink {
  url: string;
  name: string;
  isAffiliate: boolean;
  /**
   * If true, the partner's Awin merchant ID is not yet provisioned (application
   * still pending approval). Components that render this partner should check
   * `isPartnerConfigured(partner)` and render nothing while pending — this lets
   * us deploy placement code immediately and activate it the moment the Awin
   * merchant ID arrives by flipping this flag and replacing PENDING_AWINMID in
   * the URL with the real numeric ID.
   */
  pending?: boolean;
  description?: string;
  shortDescription?: string;
  /**
   * Construct the affiliate URL for a given vehicle reg.
   *
   * @param reg The vehicle registration to pre-fill on the merchant page.
   * @param clickref Optional Awin clickref — Awin passes this through to
   *   commission reports so we can filter conversions by which CTA the user
   *   clicked. Should match the click_context passed to trackPartnerClick
   *   for that same callsite so the dashboard event and the Awin commission
   *   line up. Strongly recommended on every callsite — gives per-CTA
   *   conversion attribution within Awin's admin.
   */
  buildLink?: (reg: string, clickref?: string) => string;
}

/**
 * Append an Awin clickref to a tracker URL. Awin accepts &clickref=X on the
 * cread.php query string and passes the value through to the commission
 * record on the publisher side. Used by every BMG buildLink so we can
 * attribute commissions to specific CTAs in your Awin dashboard.
 */
function withClickref(awinUrl: string, clickref?: string): string {
  if (!clickref) return awinUrl;
  const sep = awinUrl.includes("?") ? "&" : "?";
  return `${awinUrl}${sep}clickref=${encodeURIComponent(clickref)}`;
}

export function isPartnerConfigured(partner: PartnerLink): boolean {
  return !partner.pending && !partner.url.includes("PENDING_AWINMID");
}

export const PARTNER_LINKS: Record<string, PartnerLink> = {
  bookMyGarage: {
    url: "https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=https%3A%2F%2Fwww.bookmygarage.com%2Fmot%2F",
    name: "BookMyGarage",
    isAffiliate: true,
    description: "Compare MOT prices at local garages",
    shortDescription: "MOT quotes",
    buildLink: (reg: string, clickref?: string) => {
      const destination = encodeURIComponent(`https://www.bookmygarage.com/mot/?vrm=${reg}`);
      return withClickref(
        `https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=${destination}`,
        clickref,
      );
    },
  },
  bookMyGarageService: {
    url: "https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=https%3A%2F%2Fwww.bookmygarage.com%2Fcar-servicing%2F",
    name: "BookMyGarage Servicing",
    isAffiliate: true,
    description: "Compare car service prices at local garages",
    shortDescription: "Service quotes",
    buildLink: (reg: string, clickref?: string) => {
      const destination = encodeURIComponent(`https://www.bookmygarage.com/car-servicing/?vrm=${reg}`);
      return withClickref(
        `https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=${destination}`,
        clickref,
      );
    },
  },
  bookMyGarageRepair: {
    url: "https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=https%3A%2F%2Fwww.bookmygarage.com%2Fcar-repairs%2F",
    name: "BookMyGarage Repairs",
    isAffiliate: true,
    description: "Compare car repair prices at local garages",
    shortDescription: "Repair quotes",
    buildLink: (reg: string, clickref?: string) => {
      const destination = encodeURIComponent(`https://www.bookmygarage.com/car-repairs/?vrm=${reg}`);
      return withClickref(
        `https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=${destination}`,
        clickref,
      );
    },
  },
  // Extended car warranty (Awin) — applied 2026-05-17, pending approval
  warrantywise: {
    url: "https://www.awin1.com/cread.php?awinmid=PENDING_AWINMID&awinaffid=2729598&ued=https%3A%2F%2Fwww.warrantywise.co.uk%2F",
    name: "Warrantywise",
    isAffiliate: true,
    pending: true,
    description: "Extended car warranty covering major component failures",
    shortDescription: "Warranty quotes",
    buildLink: (reg: string) => {
      const destination = encodeURIComponent(`https://www.warrantywise.co.uk/?vrm=${reg}`);
      return `https://www.awin1.com/cread.php?awinmid=PENDING_AWINMID&awinaffid=2729598&ued=${destination}`;
    },
  },
  // Pay-as-you-go temporary insurance (Awin) — applied 2026-05-17, pending approval
  cuvva: {
    url: "https://www.awin1.com/cread.php?awinmid=PENDING_AWINMID&awinaffid=2729598&ued=https%3A%2F%2Fwww.cuvva.com%2F",
    name: "Cuvva",
    isAffiliate: true,
    pending: true,
    description: "Hourly, daily and weekly car insurance — bought in 90 seconds",
    shortDescription: "Temporary insurance",
    buildLink: (reg: string) => {
      const destination = encodeURIComponent(`https://www.cuvva.com/?vrm=${reg}`);
      return `https://www.awin1.com/cread.php?awinmid=PENDING_AWINMID&awinaffid=2729598&ued=${destination}`;
    },
  },
  govTaxVehicle: {
    url: "https://www.gov.uk/tax-your-vehicle",
    name: "GOV.UK Tax Vehicle",
    isAffiliate: false,
  },
  govMotCentres: {
    url: "https://www.gov.uk/find-mot-centre",
    name: "GOV.UK Find MOT Centre",
    isAffiliate: false,
  },
  parkersInsurance: {
    url: "https://www.parkers.co.uk/car-insurance/insurance-groups/",
    name: "Parkers Insurance Groups",
    isAffiliate: false,
    description: "Free insurance group lookup tool",
  },
};

export function getPartnerRel(partner: PartnerLink): string {
  if (partner.isAffiliate) return "noopener sponsored";
  return "noopener noreferrer";
}

export const MOT_KEYWORDS = [
  "MOT",
  "mot advisory",
  "mot history",
  "mot test",
  "mot failure",
  "mot expiry",
  "roadworthy",
];

export function hasMotKeywords(keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return false;
  const lower = keywords.map((k) => k.toLowerCase());
  return MOT_KEYWORDS.some((mk) =>
    lower.some((k) => k.includes(mk.toLowerCase()))
  );
}

interface TopicCta {
  path: string;
  label: string;
  description: string;
}

const TOPIC_MATCHERS: { keywords: string[]; cta: TopicCta }[] = [
  {
    keywords: ["ulez", "clean air zone", "emission", "ultra low emission"],
    cta: {
      path: "/ulez-check",
      label: "Check ULEZ compliance",
      description: "Enter a reg to see if a vehicle meets ULEZ emission standards.",
    },
  },
  {
    keywords: ["recall", "safety recall", "dvsa recall"],
    cta: {
      path: "/recall-check",
      label: "Check for safety recalls",
      description: "Enter a reg to see if any safety recalls have been issued.",
    },
  },
  {
    keywords: ["valuation", "car value", "car worth", "how much is my car"],
    cta: {
      path: "/car-valuation",
      label: "Get a free valuation",
      description: "Enter a reg to see an instant estimated value for any UK vehicle.",
    },
  },
  {
    keywords: ["mot check", "mot history", "mot test", "mot expiry", "mot due", "mot reminder", "mot cost", "mot fail"],
    cta: {
      path: "/mot-reminder",
      label: "Set a free MOT reminder",
      description: "Get a free email reminder before your MOT expires — never miss it.",
    },
  },
  {
    keywords: ["car tax", "road tax", "ved", "sorn", "vehicle excise duty"],
    cta: {
      path: "/tax-check",
      label: "Check tax status",
      description: "Enter a reg to see if a vehicle is taxed, SORN'd or untaxed.",
    },
  },
  {
    keywords: ["mileage", "clocking", "clocked", "odometer"],
    cta: {
      path: "/mileage-check",
      label: "Check mileage history",
      description: "Enter a reg to see odometer readings from every MOT test.",
    },
  },
  {
    keywords: ["used car check", "car check", "buying a used car", "vehicle check"],
    cta: {
      path: "/car-check",
      label: "Run a free car check",
      description: "Enter a reg to see full vehicle details from official DVLA data.",
    },
  },
];

export function getTopicCta(keywords: string[]): TopicCta | null {
  if (!keywords || keywords.length === 0) return null;
  const lower = keywords.map((k) => k.toLowerCase());
  for (const matcher of TOPIC_MATCHERS) {
    if (matcher.keywords.some((mk) => lower.some((k) => k.includes(mk)))) {
      return matcher.cta;
    }
  }
  return null;
}
