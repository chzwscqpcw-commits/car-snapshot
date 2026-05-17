"use client";

import { Clock } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel, isPartnerConfigured } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";

interface TempInsuranceCTAProps {
  /** Context (e.g., "car-check", "car-valuation", "post-results") used as click_context for tracking */
  context: string;
  /** Optional reg number to pre-fill on Cuvva */
  regNumber?: string;
  /** Headline override for context-specific framing */
  headline?: string;
  /** Body copy override */
  body?: string;
}

/**
 * Cuvva pay-as-you-go temporary insurance CTA, placed on pages where users are
 * likely about to test-drive, take delivery of, or temporarily drive a vehicle
 * they've just looked up.
 *
 * Returns null while the partner is in `pending: true` state (application not
 * yet approved). Flip pending to false in partners.ts and replace
 * PENDING_AWINMID with the real numeric ID to activate everywhere it's mounted.
 */
export default function TempInsuranceCTA({
  context,
  regNumber,
  headline = "Need to drive a car for a few hours or days?",
  body = "Cuvva offers pay-as-you-go car insurance you can buy in 90 seconds from your phone. Perfect for test drives, driving a just-bought car home before annual cover starts, or borrowing a friend's or family member's car.",
}: TempInsuranceCTAProps) {
  const partner = PARTNER_LINKS.cuvva;
  if (!isPartnerConfigured(partner)) return null;

  const href = regNumber && partner.buildLink
    ? partner.buildLink(regNumber)
    : partner.url;

  return (
    <div className="rounded-xl border border-blue-800/40 bg-gradient-to-br from-blue-950/30 to-slate-900/30 p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-3">
        <Clock className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-white">{headline}</h3>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4 ml-8">{body}</p>

      <div className="ml-8 flex flex-col sm:flex-row sm:items-center gap-3">
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => trackPartnerClick("cuvva", context)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Get temporary cover &mdash; Cuvva &#8599;
        </a>
        <span className="text-xs text-slate-500">
          FCA regulated &middot; From 1 hour to 28 days
        </span>
      </div>

      <p className="text-xs text-slate-500 mt-3 ml-8">
        Free Plate Check may earn a small commission from this link.
      </p>
    </div>
  );
}
