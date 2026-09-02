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

/**
 * BookMyGarage service-page destination. The reg is optional: blog-prose links
 * routed through /go have no vehicle context, and emitting a bare `?vrm=`
 * hands BMG an empty parameter to parse for no benefit.
 */
function bmgDestination(path: string, reg: string): string {
  const plate = (reg ?? "").replace(/\s+/g, "").toUpperCase();
  const base = `https://www.bookmygarage.com/${path}/`;
  return encodeURIComponent(plate ? `${base}?vrm=${plate}` : base);
}

export function isPartnerConfigured(partner: PartnerLink): boolean {
  // Any PENDING_* placeholder (PENDING_AWINMID, PENDING_WEBGAINS) means the
  // tracking IDs aren't provisioned yet — render nothing.
  return !partner.pending && !partner.url.includes("PENDING");
}

/**
 * carVertical dashboard placement tags (`sub2`).
 *
 * This matters more than it looks. Our own analytics record `context` on every
 * partner click, so we know clicks per placement precisely — but *sales* exist
 * only on carVertical's side, keyed by `sub2`. Any placement that doesn't get
 * its own tag can never be judged on whether it sells.
 *
 * Until now this was a two-way ternary: blog → `blog`, anything matching
 * "mileage" → `mcheck`, and **everything else → `ccheck`**. That catch-all
 * silently swallowed seven distinct placements, including the valuation result,
 * which alone is ~57% of all our carVertical clicks. Dominyka's "the clicks
 * aren't converting" could never be localised because we had collapsed the
 * evidence before it reached her.
 *
 * `blog` and `mcheck` keep their existing meaning so those two series stay
 * continuous across the change; it's the `ccheck` bucket that splits. Tell
 * carVertical when this mapping changes — they segment their dashboard on it.
 */
const CARVERTICAL_SUB2: Record<string, string> = {
  "valuation-result-carvertical": "val-result",
  // Seller-framed replacement for the above, held pending carVertical
  // coordination (agreement 1.1) — see /preview/carvertical placement 3. Kept as
  // a separate tag rather than reusing `val-result` so the reframe can be
  // compared against the buyer-framed copy it replaces instead of silently
  // overwriting its history.
  "valuation-result-seller": "val-seller",
  "valuation-selling-to-buy": "sell2buy",
  // The homepage's own valuation surface. `/` has an inline implementation
  // rather than the shared ValuationResult component, so it needs its own
  // contexts — but they map to the SAME sub2 as their tool-page twins on
  // purpose: our `click_context` still tells us homepage vs tool page, while
  // carVertical's dashboard keeps ONE line per placement concept instead of
  // splitting an already-thin signal across two. Many-to-one is already how
  // `blog` works below.
  "money-seller": "val-seller",
  "money-selling-to-buy": "sell2buy",
  "mot-history-anomaly": "anomaly",
  // Fires only when a rollback or implausible jump was actually detected — the
  // highest-intent placement on the site, and worth its own line in the
  // dashboard rather than being folded into general mileage-tool traffic.
  "mileage-anomaly-carvertical": "anomaly",
  "money-carvertical": "val-money",
  "mot-history-carvertical": "mot-hist",
  "model-carvertical": "model",
  "running-costs": "runcosts",
  "report-carvertical": "report",
  "report-nextsteps": "nextsteps",
  "stats-car-theft": "stats-theft",
  "stats-how-many-left": "stats-hml",
  // A stats article, not the /mileage-check tool — kept out of `mcheck` so that
  // series keeps meaning "the mileage tool" and stays comparable over time.
  "stats-uk-mileage": "stats-mileage",
};

function carVerticalSub2(ctx: string): string {
  const mapped = CARVERTICAL_SUB2[ctx];
  if (mapped) return mapped;
  if (ctx.includes("blog")) return "blog";
  // Both /mileage-check placements (landing + result) share this tag — same
  // page, and it's what `mcheck` has always meant.
  if (ctx.includes("mileage")) return "mcheck";
  // Unmapped placement: derive a tag from the context rather than folding it
  // into a catch-all. A new placement showing up under its own name is the
  // whole point — a catch-all is exactly how the previous seven went unnoticed.
  return ctx.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "unmapped";
}

/**
 * carVertical UK list prices, read off carvertical.com/gb/pricing on the date
 * below. Kept here as ONE constant because the CTA now states the price to the
 * visitor, and a stale figure on our side is worse than no figure at all.
 *
 * Why state it: 307 clicks analysed 2026-08-25 showed a median of 72 seconds
 * between clicking out and reappearing on our site — long enough to see a price
 * and leave, not long enough to buy. The CTA had no price anywhere, so every
 * click was a blind one and the £37.99 checkout came as a shock.
 *
 * We are paid per SALE (€6), never per click, so filtering out visitors who
 * would never pay £38 costs us nothing and fixes the exact complaint carVertical
 * raised. Expect click volume to drop; that is the intent.
 *
 * ⚠️ Re-verify when carVertical run a promotion, and tell Dominyka before
 * changing this copy — pricing claims are coordinated under agreement 1.1/3.1.
 *
 * CONFIRMED BY THE ADVERTISER 2026-09-02. Dominyka sent the full price list
 * direct, which is a stronger source than the public pricing page these were
 * originally read from. Every figure below matched, including the promo prices
 * our discountPct computes (£30.39 single, £16.79 per report in the 3-pack).
 *
 *   standard   1 report £37.99 · 2-pack £51.98 (£25.99 ea) · 3-pack £62.97 (£20.99 ea)
 *   with code  1 report £30.39 · 2-pack £41.58 (£20.79 ea) · 3-pack £50.38 (£16.79 ea)
 *
 * The 2-REPORT PACK is deliberately absent below. She offered it and approved
 * omitting it: "If you want to highlight the single and the three-pack, that's
 * fine from our side." Two anchors — the entry price and the best per-report
 * price — bracket the range; a third number in the middle adds clutter without
 * changing the reader's decision. It is recorded here so nobody has to ask
 * again if that judgement is ever revisited.
 *
 * She also confirmed affiliate discounts will not exceed 20% and undertook to
 * give advance notice of any pricing change.
 */
export const CARVERTICAL_PRICING = {
  /** One report, full price. */
  single: 37.99,
  /** Per-report price in the three-report pack — the multi-car shopper's price. */
  packOf3PerReport: 20.99,
  /** Our coupon, applied automatically through the tracking link. */
  discountPct: 20,
  /** Confirmed direct with carVertical (Dominyka), not read off the public page. */
  verifiedOn: "2026-09-02",
} as const;

/** £37.99 -> "£30.39". Rounded to the penny the way a checkout would show it. */
export function carVerticalDiscountedSingle(): string {
  const p = CARVERTICAL_PRICING.single * (1 - CARVERTICAL_PRICING.discountPct / 100);
  return `£${p.toFixed(2)}`;
}

export const PARTNER_LINKS: Record<string, PartnerLink> = {
  bookMyGarage: {
    url: "https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=https%3A%2F%2Fwww.bookmygarage.com%2Fmot%2F",
    name: "BookMyGarage",
    isAffiliate: true,
    description: "Compare MOT prices at local garages",
    shortDescription: "MOT quotes",
    buildLink: (reg: string, clickref?: string) => {
      const destination = bmgDestination("mot", reg);
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
      const destination = bmgDestination("car-servicing", reg);
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
      const destination = bmgDestination("car-repairs", reg);
      return withClickref(
        `https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=${destination}`,
        clickref,
      );
    },
  },
  // Extended car warranty (Awin merchant 75286) — applied 2026-05-17,
  // APPROVED + activated 2026-08-23.
  //
  // clickref is threaded through exactly as BookMyGarage/ClickMechanic do. It
  // is not optional bookkeeping: without it every warranty commission lands in
  // one undifferentiated bucket in Awin and no placement can be judged on
  // whether it actually sells — the same blindness the carVertical `sub2`
  // catch-all caused (see CARVERTICAL_SUB2 above).
  //
  // NO REG PRE-FILL IS POSSIBLE (probed 2026-08-23, after it visibly failed on a
  // real lookup). Findings, so nobody re-tries this:
  //   · warrantywise.co.uk's homepage has no reg field at all.
  //   · The quote journey starts at vehicle.warrantywise.co.uk/warranty/registration/
  //     — a DIFFERENT subdomain, reached via a 301 from /get-a-quote/.
  //   · That 301 STRIPS the query string, so nothing survives the hop.
  //   · The quote page ignores every candidate param. Browser-tested after
  //     hydration (not just server HTML, since it is a JS app): vrm, reg,
  //     registration, registrationNumber, regNumber, vehicleRegistration,
  //     vehicle_registration, plate, numberPlate, vrn — all 10 leave the
  //     "Enter Registration" input empty. The value reaches the framework's
  //     page-props `query` blob and the app simply never reads it.
  //   · So pre-fill is not something we can unlock from our side by guessing a
  //     name; Warrantywise would have to build it. Asked of Jack Fisher.
  // So we deep-link to /get-a-quote/ on the PRIMARY domain (keeps the click on
  // the domain Awin tracks; the 301 then lands the user on the reg-entry step
  // rather than a marketing homepage) and drop the reg entirely — carrying a
  // plate in an outbound URL for zero benefit is pure leakage. `reg` stays in
  // the signature so wiring a real param back in is a one-line change if Jack
  // Fisher confirms one.
  warrantywise: {
    url: "https://www.awin1.com/cread.php?awinmid=75286&awinaffid=2729598&ued=https%3A%2F%2Fwww.warrantywise.co.uk%2F",
    name: "Warrantywise",
    isAffiliate: true,
    pending: false,
    description: "Extended car warranty covering major component failures",
    shortDescription: "Warranty quotes",
    // Destination routes on the clickref, the same way ClickMechanic's does.
    // Warrantywise sell a separate CLASSIC plan and their own schema defines a
    // "modern classic" as a vehicle from the 1980s–2000s — which is precisely
    // the cohort /stats/how-many-left attracts (rare, surviving, mostly 90s/00s
    // cars). Sending a Rover 800 owner to the mainstream quote flow would be the
    // wrong product; sending them to the classic page is the right one.
    buildLink: (_reg: string, clickref?: string) => {
      const ctx = (clickref ?? "").toLowerCase();
      const isClassic = ctx.includes("classic") || ctx.includes("how-many-left");
      const dest = isClassic
        ? "https://www.warrantywise.co.uk/classic-car-warranty/"
        : "https://www.warrantywise.co.uk/get-a-quote/";
      return withClickref(
        `https://www.awin1.com/cread.php?awinmid=75286&awinaffid=2729598&ued=${encodeURIComponent(dest)}`,
        clickref,
      );
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
    // Same clickref treatment as warrantywise above — Cuvva is still pending,
    // but the gap was identical and would have cost the same attribution.
    buildLink: (reg: string, clickref?: string) => {
      const plate = (reg ?? "").replace(/\s+/g, "").toUpperCase();
      const dest = `https://www.cuvva.com/${plate ? `?vrm=${plate}` : ""}`;
      return withClickref(
        `https://www.awin1.com/cread.php?awinmid=PENDING_AWINMID&awinaffid=2729598&ued=${encodeURIComponent(dest)}`,
        clickref,
      );
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
  // sub2 mapping lives in CARVERTICAL_SUB2 below — see the note there on why
  // it is not a two-way ternary any more.
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
      const sub2 = carVerticalSub2(ctx);
      // Blog placement: no reg to pre-fill, no uid (matches Dominyka's blog link).
      //
      // Links written inline in post prose arrive here as `blog-inline-<slug>`
      // (via /go/carvertical — see src/lib/affiliateLinks.ts). Those carry the
      // slug in sub3 so each post is individually attributable, while sub2
      // stays "blog" — that series is the one carVertical already reports on,
      // and splitting it would break its continuity for no gain. The older
      // `blog-carvertical` component CTA keeps its bare, sub3-less link.
      if (sub2 === "blog") {
        const base = `${TRACKER}?source_id=AFF&sub1=freeplatecheck&sub2=blog`;
        const post = ctx.startsWith("blog-inline-")
          ? ctx.slice("blog-inline-".length)
          : "";
        return post ? `${base}&sub3=${encodeURIComponent(post)}` : base;
      }
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

/**
 * `rel` for an outbound partner link.
 *
 * Affiliate links get `sponsored` (Google's required disclosure) AND
 * `nofollow`. The `nofollow` is not redundant: `sponsored` tells Google how to
 * treat the link for ranking, but it is `nofollow` that asks a crawler not to
 * fetch the URL at all — and an affiliate network counts a click the moment
 * its tracker is requested, by anything. Component CTAs sit in server-rendered
 * HTML on fully crawlable pages, so without this they bank clicks against zero
 * sales exactly the way the inline blog links did (see src/lib/affiliateLinks.ts).
 *
 * This is the polite half of the defence — it only binds crawlers that choose
 * to obey. The /go route additionally refuses them outright; component CTAs
 * don't route through /go because they can track their own clicks in the
 * browser, so `nofollow` is what they have.
 */
export function getPartnerRel(partner: PartnerLink): string {
  if (partner.isAffiliate) return "noopener sponsored nofollow";
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

/**
 * Word-boundary matched, not substring. A plain `.includes("mot")` also fires
 * on **re**mot**e**, **mot**or and **mot**orway, which handed the BookMyGarage
 * MOT inject to four posts that should have carried a different CTA — the
 * motor-finance post being a genuine carVertical loss.
 */
const MOT_KEYWORD_PATTERNS = MOT_KEYWORDS.map(
  (mk) => new RegExp(`\\b${mk.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`)
);

export function hasMotKeywords(keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return false;
  const lower = keywords.map((k) => k.toLowerCase());
  return MOT_KEYWORD_PATTERNS.some((re) => lower.some((k) => re.test(k)));
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
      "best time to buy",
      "best time to sell",
      "used car price",
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
  // Running costs — insurance, fuel and the cost-of-ownership cluster.
  //
  // `car-insurance-groups-explained` is the site's SECOND best-read post (315
  // views/30d) and rendered no call to action at all, because it matched none
  // of the matchers above. Nineteen posts were in that state. Insurance has no
  // live partner yet (GoCompare is still pending), but /running-costs is a
  // genuine fit rather than a filler: it prices insurance, fuel, tax and
  // servicing for the specific vehicle, which is the question these posts leave
  // the reader holding.
  {
    keywords: [
      "insurance group",
      "car insurance",
      "insurance cost",
      "cheapest cars to insure",
      "running cost",
      "cost of owning",
      "fuel econom",
      "save fuel",
      "fuel price",
      "fuel duty",
      "mpg",
      "petrol vs diesel",
      "electric car cost",
      "ev charger",
      "ev grant",
      "electric car grant",
    ],
    cta: {
      path: "/running-costs",
      label: "See this car's running costs",
      description: "Enter a reg for a full annual cost estimate — fuel, tax, insurance and servicing.",
    },
  },
  // Paperwork, plates and ownership documents. All questions about a specific
  // vehicle's record, which is exactly what the free car check answers.
  {
    keywords: [
      "v5c",
      "logbook",
      "number plate",
      "private plate",
      "personalised registration",
      "plate change",
      "76 plate",
      "keeper",
      "vehicle documents",
    ],
    cta: {
      path: "/car-check",
      label: "Run a free car check",
      description: "Enter a reg to see full vehicle details from official DVLA data.",
    },
  },
  // Faults, symptoms and garage-bill topics. The reader has a car in front of
  // them with something wrong; the check surfaces its MOT and advisory record,
  // which is the context those bills sit in.
  {
    keywords: [
      "warning light",
      "dashboard",
      "overheat",
      "air con",
      "aircon",
      "garage overcharging",
      "repair cost",
      "breakdown",
      "pothole",
      // Seasonal driving-conditions posts: lights, tyres and wipers are all
      // MOT items, so the vehicle's advisory record is the relevant context.
      "driving in fog",
      "heavy rain",
      "winter driving",
      // Motor-finance redress. No tool of ours answers a PCP mis-selling
      // question directly — this is the closest honest fit rather than a good
      // one, and it beats the alternative, which was rendering nothing at all.
      "car finance",
      "pcp",
      "finance compensation",
    ],
    cta: {
      path: "/car-check",
      label: "Check this vehicle's record",
      description: "Enter a reg to see MOT history and advisories from official DVSA data.",
    },
  },
  // Enforcement / penalty topics. Deliberately LAST: it's the broadest matcher
  // in the list, and a post about an MOT fine or an unpaid ULEZ charge should
  // reach its own specific tool above before falling through to here.
  //
  // Added because enforcement posts are the site's best-read content — the ANPR
  // guide alone is ~26% of all blog traffic — and a post that matched none of
  // the matchers above rendered NO call to action whatsoever. Same failure the
  // warranty posts had before `hasWarrantyIntent` was added.
  {
    keywords: [
      "penalty charge",
      "pcn",
      "bus lane",
      "box junction",
      "fine",
      "penalty notice",
      "anpr",
      "speeding",
      "points on licence",
    ],
    cta: {
      path: "/car-check",
      label: "Check this vehicle's status",
      description: "Enter a reg to see MOT, tax and emissions status in one place — before the next letter arrives.",
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

/**
 * Warranty intent — posts about cover, breakdowns and repair bills rather than
 * provenance or MOT booking. Checked AFTER hasMotKeywords and
 * hasVehicleHistoryIntent so an MOT post keeps its booking prompt and an HPI
 * post keeps carVertical; this only claims posts nothing else wanted.
 *
 * Written because `used-car-warranty-worth-it-2026` — the single most
 * warranty-relevant page on the site — matched none of the existing routers and
 * therefore rendered no CTA at all.
 */
const WARRANTY_INTENT_KEYWORDS = [
  "warranty",
  "extended warranty",
  "breakdown cover",
  "repair bill",
];

export function hasWarrantyIntent(keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return false;
  const lower = keywords.map((k) => k.toLowerCase());
  return WARRANTY_INTENT_KEYWORDS.some((wk) => lower.some((k) => k.includes(wk)));
}

export function hasVehicleHistoryIntent(keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return false;
  const lower = keywords.map((k) => k.toLowerCase());
  return HISTORY_INTENT_KEYWORDS.some((h) => lower.some((k) => k.includes(h)));
}
