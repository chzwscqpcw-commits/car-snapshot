"use client";

import { ArrowUpRight } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
import { usePartnerImpression } from "@/components/usePartnerImpression";

const CM = "#3c93f7"; // ClickMechanic brand blue (cleared for use by Scott, 2026-06-17)

/**
 * Tracked ClickMechanic CTA (client component). buildLink routes by `context`:
 * include "ev"/"charger" → the EV-charger deep link; anything else → the
 * pre-purchase inspection deep link. The click is recorded as partner_click and
 * carries the Awin clickref, so each placement attributes independently.
 */
export default function ClickMechanicCTA({
  context,
  label,
  className = "",
}: {
  context: string;
  label: string;
  className?: string;
}) {
  const partner = PARTNER_LINKS.clickMechanic;
  const href = partner.buildLink ? partner.buildLink("", context) : partner.url;
  const linkRef = usePartnerImpression<HTMLAnchorElement>("clickMechanic", context);
  return (
    <a
      ref={linkRef}
      href={href}
      target="_blank"
      rel={getPartnerRel(partner)}
      onClick={() => trackPartnerClick("clickMechanic", context)}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] ${className}`}
      style={{ backgroundColor: CM, boxShadow: `0 10px 30px -10px ${CM}` }}
    >
      {label} <ArrowUpRight className="h-4 w-4" />
    </a>
  );
}
