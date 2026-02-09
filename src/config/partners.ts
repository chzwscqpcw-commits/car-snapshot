export interface PartnerLink {
  url: string;
  name: string;
  isAffiliate: boolean;
  description?: string;
  shortDescription?: string;
}

export const PARTNER_LINKS: Record<string, PartnerLink> = {
  bookMyGarage: {
    url: "https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=https%3A%2F%2Fwww.bookmygarage.com",
    name: "BookMyGarage",
    isAffiliate: true,
    description: "Compare MOT, servicing & repair prices at local garages",
    shortDescription: "MOT & servicing",
  },
  carmoola: {
    url: "https://www.awin1.com/cread.php?awinmid=31283&awinaffid=2729598&ued=https%3A%2F%2Fwww.carmoola.co.uk",
    name: "Carmoola",
    isAffiliate: true,
    description: "Flexible car finance — check eligibility without affecting your credit score",
    shortDescription: "Car finance",
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
