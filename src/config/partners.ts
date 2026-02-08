export interface PartnerLink {
  url: string;
  name: string;
  isAffiliate: boolean;
}

export const PARTNER_LINKS: Record<string, PartnerLink> = {
  bookMyGarage: {
    url: "https://www.bookmygarage.com/",
    name: "BookMyGarage",
    isAffiliate: false,
  },
  fixter: {
    url: "https://www.fixter.co.uk/mot",
    name: "Fixter",
    isAffiliate: false,
  },
  goCompare: {
    url: "https://www.awin1.com/cread.php?awinmid=XXXX&awinaffid=XXXX&ued=https%3A%2F%2Fwww.gocompare.com%2Fcar-insurance%2F",
    name: "GoCompare",
    isAffiliate: true,
  },
  hpiCheck: {
    url: "https://www.hpicheck.com/?utm_source=freeplatecheck",
    name: "HPI Check",
    isAffiliate: true,
  },
  carmoola: {
    url: "https://www.awin1.com/cread.php?awinmid=31283&awinaffid=2729598&ued=https%3A%2F%2Fwww.carmoola.co.uk",
    name: "Carmoola",
    isAffiliate: true,
  },
  racBreakdown: {
    url: "https://www.awin1.com/cread.php?awinmid=XXXX&awinaffid=XXXX&ued=https%3A%2F%2Fwww.rac.co.uk%2Fbreakdown-cover",
    name: "RAC Breakdown",
    isAffiliate: true,
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
