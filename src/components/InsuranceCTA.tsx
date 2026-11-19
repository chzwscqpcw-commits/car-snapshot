"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { goLink, type GoContext, type PartnerLogo } from "@/config/partners";
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
 * network's sub-ID. So no trackPartnerClick here.
 *
 * The wording is our own and stays claim-free on purpose: it says what the
 * card is for and names the partner, nothing more. No saving, no "cheapest"
 * or "best", no reward, no description of the partner's service. Their
 * programme wants every placement approved before it goes live, so a change
 * to the text here is a change to send them first.
 *
 * Two things on the card are the partner's, taken from its entry in
 * partners.ts and shown as supplied: its logo (on a white plate) and, under
 * our own commission line, the regulatory line it requires. A partner with
 * neither gets a text-only card.
 */
export default function InsuranceCTA({ context, kind, vehicleName, preview = false, className = "" }: InsuranceCTAProps) {
  const offer: InsuranceOffer | null = preview ? previewOffer(kind) : insuranceOffer(kind);
  const cardRef = useSeenOnce(offer && !preview ? offer.partnerKey : null, context);
  if (!offer) return null;
  const noun = NOUN[kind];

  return (
    <div
      ref={cardRef}
      data-insurance-card={kind}
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
      {/* Phone: the logo sits above the full-width button. Wider: beside it. */}
      <div className="ml-8 flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <a
          href={preview ? "#" : goLink(offer.go, context)}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="inline-flex w-full sm:w-auto items-center justify-center text-center px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Compare {noun} insurance with {offer.partner.name} &#8599;
        </a>
        {offer.partner.logo && <PartnerLogoPlate logo={offer.partner.logo} name={offer.partner.name} />}
      </div>
      <p className="text-xs text-slate-500 mt-3 ml-8">Free Plate Check may earn a small commission from this link.</p>
      {offer.partner.regulatoryLine && (
        <p data-regulatory-line className="text-xs text-slate-500 mt-1 ml-8">{offer.partner.regulatoryLine}</p>
      )}
    </div>
  );
}

/**
 * The partner's logo on a white plate: most wordmarks are drawn for a light
 * page and vanish on our dark cards. The file is shown whole and as supplied
 * (never recoloured or cropped), with clear space of about half its height
 * on every side; the plate is as tall as the button it sits beside.
 */
function PartnerLogoPlate({ logo, name }: { logo: PartnerLogo; name: string }) {
  return (
    <span data-partner-logo className="inline-flex shrink-0 items-center rounded-lg bg-white px-3.5 py-2.5">
      <Image
        src={logo.src}
        alt={name}
        width={logo.width}
        height={logo.height}
        unoptimized
        style={{ height: 24, width: "auto" }}
      />
    </span>
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
