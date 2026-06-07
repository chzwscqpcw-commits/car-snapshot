"use client";

import { Banknote } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel, isPartnerConfigured } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";

interface SellCarCTAProps {
  /** Context used as click_context (tracking) and Webgains clickref (attribution). */
  context: string;
  /** Reg pre-fills the instant valuation on We Buy Any Car. */
  regNumber?: string;
}

/**
 * We Buy Any Car "sell your car" CTA for the valuation/owner journey — someone
 * who's just valued their car is the ideal sell-your-car lead. Renders null
 * while the partner is pending (Webgains). Flip pending:false + fill the
 * Webgains IDs in partners.ts to activate.
 */
export default function SellCarCTA({ context, regNumber }: SellCarCTAProps) {
  const partner = PARTNER_LINKS.weBuyAnyCar;
  if (!isPartnerConfigured(partner)) return null;

  const href = regNumber && partner.buildLink ? partner.buildLink(regNumber, context) : partner.url;

  return (
    <div className="rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/30 to-slate-900/30 p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-3">
        <Banknote className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-white">
          Thinking of selling? Get an instant offer
        </h3>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4 ml-8">
        Now you know what it&apos;s worth, see what you&apos;d actually be offered. <strong className="text-slate-100">We Buy Any Car</strong> gives a free online valuation in minutes — a useful second opinion even if you&apos;re not ready to sell yet.
      </p>

      <div className="ml-8 flex flex-col sm:flex-row sm:items-center gap-3">
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => trackPartnerClick("weBuyAnyCar", context)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Get an instant offer &mdash; We Buy Any Car &#8599;
        </a>
        <span className="text-xs text-slate-500">
          Free valuation &middot; quick sale
        </span>
      </div>

      <p className="text-xs text-slate-500 mt-3 ml-8">
        Free Plate Check may earn a small commission from this link.
      </p>
    </div>
  );
}
