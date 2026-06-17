"use client";

import { ClipboardCheck } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel, isPartnerConfigured } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
import ClickMechanicLogo from "@/components/ClickMechanicLogo";

interface InspectionCTAProps {
  /** Context used as click_context (tracking) and Awin clickref (attribution). */
  context: string;
  /** Optional reg — kept for consistency; ClickMechanic's flow doesn't pre-fill it. */
  regNumber?: string;
}

/**
 * ClickMechanic pre-purchase inspection CTA for the buyer/check flow — a vetted
 * mobile mechanic inspects the car before purchase. Renders null while the
 * partner is pending approval (flip pending:false in partners.ts to activate).
 */
export default function InspectionCTA({ context, regNumber }: InspectionCTAProps) {
  const partner = PARTNER_LINKS.clickMechanic;
  if (!isPartnerConfigured(partner)) return null;

  const href = partner.buildLink ? partner.buildLink(regNumber ?? "", context) : partner.url;

  return (
    <div className="rounded-xl border border-cyan-800/40 bg-gradient-to-br from-cyan-950/30 to-slate-900/30 p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-3">
        <ClipboardCheck className="h-5 w-5 text-cyan-400 mt-0.5 shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-white">
          Buying this car? Get it inspected first
        </h3>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4 ml-8">
        A check confirms the paperwork — an inspection confirms the car. <ClickMechanicLogo className="text-sm" /> sends a vetted mobile mechanic to wherever the car is for a fixed-price pre-purchase inspection, so you know what you&apos;re buying before you commit.
      </p>

      <div className="ml-8 flex flex-col sm:flex-row sm:items-center gap-3">
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => trackPartnerClick("clickMechanic", context)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Book a pre-purchase inspection &#8599;
        </a>
        <span className="text-xs text-slate-500">
          Fixed price &middot; 1,000+ vetted mechanics
        </span>
      </div>

      <p className="text-xs text-slate-400 mt-3 ml-8">
        Free Plate Check may earn a small commission from this link — it never costs you more.
      </p>
    </div>
  );
}
