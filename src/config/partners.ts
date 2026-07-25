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
   * @param postcode Optional location postcode to pre-fill on the merchant page
   *   (currently only ClickMechanic's inspection flow — it needs BOTH vrm +
   *   postcode to skip data entry; other partners ignore it).
   */
  buildLink?: (reg: string, clickref?: string, postcode?: string) => string;
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
  // Any PENDING_* placeholder (PENDING_AWINMID, PENDING_WEBGAINS) means the
  // tracking IDs aren't provisioned yet — render nothing.
  return !partner.pending && !partner.url.includes("PENDING");
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
  // ClickMechanic — pre-purchase inspections + EV-charger installation (Awin
  // merchant 67328) — applied 2026-06-07, APPROVED + activated 2026-06-08.
  // Standard commission 2.5% (Scott offered to revisit once volume builds).
  // We use the canonical awin1.com/cread.php tracking link (awinmid=67328,
  // awinaffid=2729598, ued=<destination>) — same format as our BookMyGarage
  // links, so &clickref survives for per-placement attribution. (Scott first
  // sent tidd.ly shortlinks; those silently dropped the clickref, so we use the
  // awin1.com link they resolve to — confirmed equivalent, and Scott OK'd it.)
  //
  // Reg PRE-FILL (Scott, 2026-06-17): the INSPECTION flow uses a co-branded
  // partner landing page (our logo) that accepts ?vrm=&postcode= (caps). We pass
  // the searched reg as ?vrm= (the user enters their postcode on CM's side); the
  // partner page itself is the graceful fallback if pre-fill ever fails. EVCI has
  // NO pass-through (CM doesn't use vrm/postcode to quote an install) → it lands
  // on the EV-charger page. buildLink routes by context: "ev"/"charger" → EV,
  // else → inspection partner page. (ued query separators are double-encoded by
  // encodeURIComponent, exactly as Awin requires — same as BookMyGarage.)
  clickMechanic: {
    url: "https://www.awin1.com/cread.php?awinmid=67328&awinaffid=2729598&ued=https%3A%2F%2Fwww.clickmechanic.com%2Fpartners%2Ffreeplatecheck",
    name: "ClickMechanic",
    isAffiliate: true,
    pending: false,
    description: "Book a pre-purchase inspection or repair with a vetted mobile mechanic",
    shortDescription: "Mechanic quotes",
    buildLink: (reg: string, clickref?: string, postcode?: string) => {
      const ctx = (clickref ?? "").toLowerCase();
      // Match "ev" only as a standalone token (not inside "preview"/"review"/etc.)
      const isEv = /(^|[^a-z])ev([^a-z]|$)/.test(ctx) || ctx.includes("charger");
      let dest: string;
      if (isEv) {
        dest = "https://www.clickmechanic.com/ev-charger-installation";
      } else {
        // Co-branded partner landing page. ClickMechanic needs BOTH vrm +
        // postcode to skip data entry (verified: vrm alone leaves the form
        // empty; vrm+postcode jumps straight to "select inspection"). We pass
        // whatever we have — postcode is an optional field our side; without it
        // the user just lands on the entry form (graceful fallback).
        const plate = (reg ?? "").replace(/\s+/g, "").toUpperCase();
        const pc = (postcode ?? "").trim().toUpperCase();
        const qs = [
          plate && `vrm=${plate}`,
          pc && `postcode=${pc}`,
        ].filter(Boolean).join("&");
        dest = `https://www.clickmechanic.com/partners/freeplatecheck${qs ? `?${qs}` : ""}`;
      }
      return withClickref(
        `https://www.awin1.com/cread.php?awinmid=67328&awinaffid=2729598&ued=${encodeURIComponent(dest)}`,
        clickref,
      );
    },
  },
  // We Buy Any Car — sell-your-car instant offer. NOTE: Webgains, NOT Awin.
  // Applied 2026-06-07; pending Webgains account + programme approval. Webgains
  // tracker format:
  //   https://track.webgains.com/click.html?wgcampaignid=<YOUR_CAMPAIGN_ID>&wgprogramid=<WBAC_PROGRAM_ID>&wgtarget=<encoded dest>
  // Fill both IDs from the Webgains dashboard on approval, then flip pending:false.
  weBuyAnyCar: {
    url: "https://track.webgains.com/click.html?wgcampaignid=PENDING_WEBGAINS&wgprogramid=PENDING_WEBGAINS&wgtarget=https%3A%2F%2Fwww.webuyanycar.com%2F",
    name: "We Buy Any Car",
    isAffiliate: true,
    pending: true,
    description: "Get a free instant offer to sell your car",
    shortDescription: "Instant offer",
    buildLink: (reg: string, clickref?: string) => {
      const destination = encodeURIComponent(`https://www.webuyanycar.com/?vrm=${reg}`);
      const base = `https://track.webgains.com/click.html?wgcampaignid=PENDING_WEBGAINS&wgprogramid=PENDING_WEBGAINS&wgtarget=${destination}`;
      return clickref ? `${base}&clickref=${encodeURIComponent(clickref)}` : base;
    },
  },
  // Carwow "Sell my Car" — sell-car / valuation audience. CORRECTION (2026-06-08):
  // Carwow's Awin UK programme is CLOSED. The live UK networks are Impact.com /
  // TradeDoubler / FlexOffers (Impact.com = best pick: major + reputable), NONE
  // of which we're on yet (we have Awin + Webgains only). So this is PARKED until
  // the owner decides to join a new network. On joining, replace the whole
  // url/buildLink with that network's tracking-link format, then flip
  // pending:false. Kept staged so the intent + path is documented.
  carwowSell: {
    url: "https://www.carwow.co.uk/sell-my-car?ref=PENDING_NETWORK",
    name: "Carwow",
    isAffiliate: true,
    pending: true,
    description: "Sell your car — Carwow has dealers bid for it, often beating instant-buyer offers",
    shortDescription: "Sell your car",
    buildLink: (_reg: string, clickref?: string) => {
      const base = "https://www.carwow.co.uk/sell-my-car?ref=PENDING_NETWORK";
      return clickref ? `${base}&clickref=${encodeURIComponent(clickref)}` : base;
    },
  },
  // carVertical — full vehicle history check (finance, stolen, write-off,
  // mileage anomalies). Pure referral: the customer buys from carVertical under
  // carVertical's own terms — we never originate, store or handle the report,
  // so none of the data liability that shelved a self-built check sits with us.
  // IN-HOUSE programme, NOT Awin — only a DE-region feed appears on Awin; the
  // UK programme is direct via carvertical.com/gb/affiliate-program (free,
  // 90-day cookie, from €4/sale tiered+uncapped). Staged 2026-06-08 — apply
  // direct; on approval carVertical issues its OWN tracking link (Post Affiliate
  // Pro), so replace the whole url/buildLink below with their link format (and
  // its sub-id/clickref param name), then flip pending:false.
  // LIVE 2026-06-11 (Everflow offer GB 6EUR, ID 4, CPA €6).
  // UPDATED 2026-06-16 — switched from carVertical's direct destination URLs
  // (hardcoded _ef_transaction_id) to Dominyka's proper EVERFLOW TRACKING LINKS
  // on carvertical.deal. The old links pinned every click to one fixed
  // _ef_transaction_id, so Everflow collapsed all clicks under a single click ID
  // and the dashboard read 0 clicks (vs our own analytics). The tracker links
  // below mint a UNIQUE transaction id per click (server-side redirect) while
  // still pre-filling the reg and applying the coupon. Param mapping (Dominyka):
  //   sub1 = coupon applied at checkout (freeplatecheck — our 20% discount)
  //   sub2 = placement tag we segment on in the dashboard (ccheck / mcheck / blog)
  //   sub3 = dynamic reg/VIN pre-filled on the precheck landing page
  //   source_id=AFF + the NCRBZ8/6JHXF path identify us as the affiliate.
  // Report + mileage carry uid=5 + sub3; blog has neither (no reg to pre-fill).
  // Our OWN per-placement detail still comes from the partner_click `context`.
  carVertical: {
    url: "https://www.carvertical.deal/NCRBZ8/6JHXF/?source_id=AFF&sub1=freeplatecheck&sub2=blog",
    name: "carVertical",
    isAffiliate: true,
    pending: false,
    description: "Full vehicle history check — finance, stolen, write-off & mileage records",
    shortDescription: "History check",
    buildLink: (reg: string, clickref?: string) => {
      const ctx = (clickref ?? "").toLowerCase();
      const TRACKER = "https://www.carvertical.deal/NCRBZ8/6JHXF/";
      // Blog placement: no reg to pre-fill, no uid (matches Dominyka's blog link).
      if (ctx.includes("blog")) {
        return `${TRACKER}?source_id=AFF&sub1=freeplatecheck&sub2=blog`;
      }
      // sub2 segments the placement in carVertical's dashboard:
      // mcheck = mileage-check page, ccheck = report / car-check.
      const sub2 = ctx.includes("mileage") ? "mcheck" : "ccheck";
      const plate = (reg ?? "").replace(/\s+/g, "").toUpperCase();
      return `${TRACKER}?uid=5&source_id=AFF&sub1=freeplatecheck&sub2=${sub2}&sub3=${encodeURIComponent(plate)}`;
    },
  },
  // HPI Check — the brand-name UK history check (the phrase consumers actually
  // search for). Pure referral, same as carVertical: the customer contracts
  // with HPI directly, so no data liability sits with us. NOTE: Webgains, NOT
  // Awin. Staged 2026-06-08 — apply on Webgains, then fill both IDs from the
  // Webgains dashboard and flip pending:false on approval.
  //
  // ⛔ DO NOT ACTIVATE while the carVertical agreement is in force (signed
  // 2026-06-09). carVertical's exclusivity clause (Section 5) bars promoting
  // ANY competing vehicle-history-report provider worldwide — HPI is a direct
  // competitor. Activating this would breach that agreement. To use HPI instead,
  // terminate carVertical first (30 days' notice). Also blocked separately by
  // the Webgains ~10k-unique-visitor gate.
  hpiCheck: {
    url: "https://track.webgains.com/click.html?wgcampaignid=PENDING_WEBGAINS&wgprogramid=PENDING_WEBGAINS&wgtarget=https%3A%2F%2Fwww.hpi.co.uk%2F",
    name: "HPI Check",
    isAffiliate: true,
    pending: true,
    description: "The UK's best-known vehicle history check — finance, stolen & write-off",
    shortDescription: "History check",
    buildLink: (_reg: string, clickref?: string) => {
      const destination = encodeURIComponent("https://www.hpi.co.uk/");
      const base = `https://track.webgains.com/click.html?wgcampaignid=PENDING_WEBGAINS&wgprogramid=PENDING_WEBGAINS&wgtarget=${destination}`;
      return clickref ? `${base}&clickref=${encodeURIComponent(clickref)}` : base;
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
  // GoCompare — car-insurance comparison (Awin merchant 117439). Top-5 UK
  // comparison site, 170+ insurance brands, CPA basis (exact rate in the Awin
  // F&P doc). Replaces the old non-affiliate Parkers insurance-group leak (£0,
  // off-site, not pre-filled). ALREADY APPLIED on Awin — status Pending Approval
  // (account contact Harry Curtis, harry.curtis@awin.com). awinmid is known
  // (117439), so on approval just flip pending:false. The action prompt is gated
  // on isPartnerConfigured so we never promote before Awin accepts us.
  // (Confused.com was the first pick but isn't joinable on this Awin account.)
  goCompare: {
    url: "https://www.awin1.com/cread.php?awinmid=117439&awinaffid=2729598&ued=https%3A%2F%2Fwww.gocompare.com%2Fcar-insurance%2F",
    name: "GoCompare",
    isAffiliate: true,
    pending: true,
    description: "Compare car insurance quotes from 170+ providers",
    shortDescription: "Insurance quotes",
    // On activation you may swap the ued destination for GoCompare's approved
    // affiliate car-insurance deep link from their Awin creative.
    buildLink: (_reg: string, clickref?: string) => {
      const destination = encodeURIComponent("https://www.gocompare.com/car-insurance/");
      return withClickref(
        `https://www.awin1.com/cread.php?awinmid=117439&awinaffid=2729598&ued=${destination}`,
        clickref,
      );
    },
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
    keywords: [
      "valuation",
      "car value",
      "car worth",
      "how much is my car",
      "resale value",
      "hold their value",
      "holds its value",
      "depreciat",
      "trade-in value",
    ],
    cta: {
      path: "/car-valuation",
      label: "Get a free valuation",
      description: "Enter a reg to see an instant estimated value for any UK vehicle.",
    },
  },
  {
    keywords: ["mot check", "mot history", "mot test", "mot expiry", "mot due", "mot reminder", "mot cost", "mot fail", "mot camera", "driving without mot"],
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

/**
 * Vehicle-history / provenance intent (HPI, finance, write-off, stolen, buying
 * a used car). These readers want a *paid history report* — so route them to
 * carVertical rather than a free reg-check tool, which is the weakest possible
 * match for the highest-intent history reader. Checked BEFORE getTopicCta on the
 * blog so an "HPI check" post doesn't fall through to the free /car-check tool.
 * Deliberately excludes plain mileage/clocking, which keeps its own /mileage-check
 * route.
 */
const HISTORY_INTENT_KEYWORDS = [
  "hpi",
  "history check",
  "vehicle history",
  "car history",
  "outstanding finance",
  "finance check",
  "write-off",
  "write off",
  "stolen",
  "provenance",
  "car data check",
  "cat s",
  "cat n",
  "cat c",
  "cat d",
  "buying a used car",
  "checks before buying",
];

export function hasVehicleHistoryIntent(keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return false;
  const lower = keywords.map((k) => k.toLowerCase());
  return HISTORY_INTENT_KEYWORDS.some((h) => lower.some((k) => k.includes(h)));
}
