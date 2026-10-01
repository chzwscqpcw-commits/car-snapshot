"use client";

import { Wrench } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { usePartnerImpression } from "./usePartnerImpression";
import { trackPartnerClick } from "@/lib/tracking";

/**
 * Subtle, in-article MOT-booking prompt (BookMyGarage affiliate) for MOT-related
 * blog posts. Designed to sit partway through the article — early enough to
 * catch readers without scrolling to the end, but woven in rather than shouted.
 *
 * The `clickref` flows into the Awin link so booking conversions are
 * attributable to this exact placement in the Awin dashboard.
 *
 * WHY THIS IS A CLIENT COMPONENT. It used to be server-rendered with no JS,
 * which meant it emitted no `partner_impression` and no `partner_click` — on 25
 * posts carrying 35% of all blog traffic. Locally it was indistinguishable from
 * a CTA that did not exist: a month of data showed literally zero events for it,
 * while every other blog CTA could be measured. Awin could see the bookings, but
 * nothing here could answer "is this worth the space it occupies", which is the
 * question that decides whether those 781 monthly views should point at
 * BookMyGarage at all.
 *
 * The local context and the Awin clickref are deliberately the SAME string, so
 * impressions, clicks and bookings line up on one identifier across all three
 * systems with no mapping table to drift.
 */
export default function MotBookingInline({ clickref }: { clickref: string }) {
  const partner = PARTNER_LINKS.bookMyGarage;
  const href = partner.buildLink ? partner.buildLink("", clickref) : partner.url;
  const cardRef = usePartnerImpression<HTMLDivElement>("bookMyGarage", clickref);

  return (
    <div
      ref={cardRef}
      className="max-w-[700px] mx-auto my-8 flex items-start gap-3 rounded-lg border border-blue-800/40 bg-blue-950/20 px-4 py-3"
    >
      <Wrench className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
      <p className="text-sm text-slate-300 leading-relaxed">
        <span className="text-slate-200 font-medium">In a hurry?</span> You can compare MOT prices at local garages and book online in minutes —{" "}
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => trackPartnerClick("bookMyGarage", clickref)}
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
        >
          see quotes on BookMyGarage →
        </a>
      </p>
    </div>
  );
}
