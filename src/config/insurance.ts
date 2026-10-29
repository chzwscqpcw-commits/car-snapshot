import { PARTNER_LINKS, isPartnerConfigured, type InsuranceGoPartner, type PartnerLink } from "@/config/partners";

// Which insurance partner a placement shows. Placements ask by vehicle type
// and get the first partner in the list that's live, so they switch on — and
// switch brand — with no change of their own: RVU (confused.com / Uswitch on
// Rakuten) when its links arrive, GoCompare (Awin, pending since 2026) as the
// car fallback; Tempcover first for temporary cover, then Cuvva.

export type InsuranceKind = "car" | "van" | "motorbike";

export interface InsuranceOffer {
  /** Key in PARTNER_LINKS; also the partner_id /go records. */
  partnerKey: string;
  /** The /go/<key> route that redirects to it. */
  go: InsuranceGoPartner;
  partner: PartnerLink;
}

const ANNUAL: Record<InsuranceKind, Array<{ partnerKey: string; go: InsuranceGoPartner }>> = {
  car: [
    { partnerKey: "rvuCarInsurance", go: "rvu-car" },
    { partnerKey: "goCompare", go: "gocompare" },
  ],
  van: [{ partnerKey: "rvuVanInsurance", go: "rvu-van" }],
  motorbike: [{ partnerKey: "rvuBikeInsurance", go: "rvu-bike" }],
};

const TEMPORARY: Array<{ partnerKey: string; go: InsuranceGoPartner }> = [
  { partnerKey: "tempcover", go: "tempcover" },
  { partnerKey: "cuvva", go: "cuvva" },
];

function firstLive(options: Array<{ partnerKey: string; go: InsuranceGoPartner }>): InsuranceOffer | null {
  for (const o of options) {
    const partner = PARTNER_LINKS[o.partnerKey];
    if (partner && isPartnerConfigured(partner)) return { ...o, partner };
  }
  return null;
}

/** Annual insurance for this kind of vehicle, or null if no partner is live. */
export function insuranceOffer(kind: InsuranceKind): InsuranceOffer | null {
  return firstLive(ANNUAL[kind]);
}

/** Temporary (hourly/daily) cover, or null if no partner is live. Cars only. */
export function tempCoverOffer(): InsuranceOffer | null {
  return firstLive(TEMPORARY);
}

/** The first partner in the list, live or not — for the preview page. */
export function previewOffer(kind: InsuranceKind | "temporary"): InsuranceOffer {
  const o = kind === "temporary" ? TEMPORARY[0] : ANNUAL[kind][0];
  return { ...o, partner: PARTNER_LINKS[o.partnerKey] };
}
