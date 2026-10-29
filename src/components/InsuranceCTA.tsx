"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { goLink, type GoContext } from "@/config/partners";
import { insuranceOffer, previewOffer, type InsuranceKind, type InsuranceOffer } from "@/config/insurance";
import { trackEvent } from "@/lib/tracking";

interface InsuranceCTAProps {
  context: GoContext;
  kind: InsuranceKind;
  /** "Ford Focus", from shortVehicleName. */
  vehicleName?: string;
  /** Preview page only: render with the first-choice partner even while it's pending. */
  preview?: boolean;
  className?: string;
}

const NOUN: Record<InsuranceKind, string> = { car: "car", van: "van", motorbike: "bike" };

/**
 * Compare-insurance card, placed beside our running-cost figures — which
 * leave insurance out because it depends on the driver as much as the car.
 * Shows whichever insurance partner is live for this kind of vehicle
 * (src/config/insurance.ts) and nothing while none is.
 *
 * Clicks go through /go like SellCarCTA's: recorded server-side, bots turned
 * away before the partner's tracker, and the placement passed on as the
 * network's sub-ID. So no trackPartnerClick here. Copy makes no claims about
 * the partner: their approved wording isn't in yet.
 */
export default function InsuranceCTA({ context, kind, vehicleName, preview = false, className = "" }: InsuranceCTAProps) {
  const offer: InsuranceOffer | null = preview ? previewOffer(kind) : insuranceOffer(kind);
  const cardRef = useSeenOnce(offer && !preview ? offer.partnerKey : null, context);
  if (!offer) return null;
  const noun = NOUN[kind];

  return (
    <div
      ref={cardRef}
      className={`rounded-xl border border-sky-700/40 bg-gradient-to-br from-sky-950/40 via-slate-900/40 to-slate-900/30 p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <ShieldCheck className="h-5 w-5 text-sky-400 mt-0.5 shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-white">
          {vehicleName ? `Insuring your ${vehicleName}?` : `Compare ${noun} insurance quotes`}
        </h3>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed mb-4 ml-8">
        Insurance is the one running cost we can&apos;t work out from the {noun}: it depends on you as much as the
        {" "}{noun}. Compare quotes in one go to see what yours would cost.
      </p>
      <div className="ml-8">
        <a
          href={preview ? "#" : goLink(offer.go, context)}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Compare {noun} insurance with {offer.partner.name} &#8599;
        </a>
      </div>
      <p className="text-xs text-slate-500 mt-3 ml-8">Free Plate Check may earn a small commission from this link.</p>
    </div>
  );
}

/**
 * `partner_impression` once, when half the card is on screen — the standard
 * the carVertical and WBAC boxes use, so click rates compare across them.
 * Pass null to record nothing (no partner, or the preview page).
 */
export function useSeenOnce(partnerKey: string | null, context: string) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  useEffect(() => {
    if (!partnerKey || seen.current) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !seen.current) {
          seen.current = true;
          trackEvent("partner_impression", { partner_id: partnerKey, click_context: context });
          obs.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [partnerKey, context]);
  return ref;
}
