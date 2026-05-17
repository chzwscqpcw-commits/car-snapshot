"use client";

import { Shield } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel, isPartnerConfigured } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";

interface WarrantyCTAProps {
  /** Context (e.g., "mileage-check", "recall-check") used as click_context for tracking */
  context: string;
  /** Optional reg number to pre-fill on Warrantywise */
  regNumber?: string;
}

/**
 * Warrantywise extended-warranty CTA, placed contextually on pages where the
 * vehicle data signals warranty value (high mileage, older car, recall history).
 *
 * Returns null while the partner is in `pending: true` state (application not
 * yet approved). Flip pending to false in partners.ts and replace
 * PENDING_AWINMID with the real numeric ID to activate everywhere it's mounted.
 */
export default function WarrantyCTA({ context, regNumber }: WarrantyCTAProps) {
  const partner = PARTNER_LINKS.warrantywise;
  if (!isPartnerConfigured(partner)) return null;

  const href = regNumber && partner.buildLink
    ? partner.buildLink(regNumber)
    : partner.url;

  return (
    <div className="rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/30 to-slate-900/30 p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-3">
        <Shield className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-white">
          Protect your car against unexpected bills
        </h3>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4 ml-8">
        Older or higher-mileage cars are most at risk of expensive component failures. <strong className="text-slate-100">Warrantywise</strong> extended warranties cover major mechanical and electrical breakdowns — engine, gearbox, electronics, AC — so a single repair doesn&apos;t wipe out months of savings.
      </p>

      <div className="ml-8 flex flex-col sm:flex-row sm:items-center gap-3">
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => trackPartnerClick("warrantywise", context)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Get a warranty quote &mdash; Warrantywise &#8599;
        </a>
        <span className="text-xs text-slate-500">
          FCA regulated &middot; 30-day money-back
        </span>
      </div>

      <p className="text-xs text-slate-500 mt-3 ml-8">
        Free Plate Check may earn a small commission from this link.
      </p>
    </div>
  );
}
