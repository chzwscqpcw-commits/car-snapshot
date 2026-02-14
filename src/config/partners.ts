export interface PartnerLink {
  url: string;
  name: string;
  isAffiliate: boolean;
  description?: string;
  shortDescription?: string;
  buildLink?: (reg: string) => string;
}

export const PARTNER_LINKS: Record<string, PartnerLink> = {
  bookMyGarage: {
    url: "https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=https%3A%2F%2Fwww.bookmygarage.com",
    name: "BookMyGarage",
    isAffiliate: true,
    description: "Compare MOT, servicing & repair prices at local garages",
    shortDescription: "MOT & servicing",
    buildLink: (reg: string) => {
      const destination = encodeURIComponent(`https://www.bookmygarage.com/?vrm=${reg}`);
      return `https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=${destination}`;
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
