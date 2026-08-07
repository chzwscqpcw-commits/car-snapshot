"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel, isPartnerConfigured } from "@/config/partners";
import { trackPartnerClick, trackEvent } from "@/lib/tracking";
import CarVerticalLogo from "@/components/CarVerticalLogo";

interface SellingToBuyBridgeProps {
  /** click_context for attribution. Note there is deliberately no `regNumber`
   *  prop — see the note on pre-filling below. */
  context?: string;
  preview?: boolean;
}

/**
 * The seller→buyer bridge, shown under a valuation result.
 *
 * 41% of our visitors land straight on a valuation page and are valuing a car
 * they already own. The standing read of that was "our audience is sellers, not
 * buyers" — which is only half true. Someone valuing their car is usually weeks
 * away from buying one, and at that moment they are already on the site with
 * the tools open. Rather than trying to attract a different audience, this
 * catches the one we have at the point their intent is about to flip.
 *
 * Two routes on purpose. The free check is ours and costs nothing — sending
 * them back into our own funnel with genuine buyer intent is the point, because
 * buyer-intent volume is the binding constraint on the carVertical partnership,
 * not conversion rate. The paid report is there for anyone already at the
 * commit-or-walk-away stage.
 *
 * Deliberately does NOT pre-fill the reg on either route: the car they're
 * considering is not the car they just valued, and pre-filling the wrong plate
 * would be worse than pre-filling nothing.
 */
export default function SellingToBuyBridge({
  context = "valuation-selling-to-buy",
  preview = false,
}: SellingToBuyBridgeProps) {
  const partner = PARTNER_LINKS.carVertical;
  if (!preview && !isPartnerConfigured(partner)) return null;

  const href = partner.buildLink ? partner.buildLink("", context) : partner.url;

  return (
    <div className="rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800/40 to-slate-900/20 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <ArrowRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <h3 className="text-sm font-semibold text-white sm:text-base">
            Selling to buy something else?
          </h3>
        </div>
        <CarVerticalLogo className="shrink-0 text-xs" />
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
        Run the plate of the car you&apos;re considering before you commit to it. Our
        free check covers MOT history, tax and every recorded mileage reading. The
        things that cost people thousands — outstanding finance and write-off
        records — sit in private databases that no free check can reach.
      </p>

      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Link
          href="/car-check"
          onClick={() => trackEvent("selling_to_buy_free_check", { context })}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-600/70 bg-slate-800/40 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800/80 hover:text-white sm:w-auto"
        >
          Free check on another car
        </Link>
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => trackPartnerClick("carVertical", context)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1b54ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1746e0] sm:w-auto"
        >
          Full history report <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <p className="mt-2.5 text-[11px] text-slate-500">
        Two routes, deliberately. The free check is ours and costs nothing;
        carVertical provides and sells the full report, and we may earn a
        commission — it never costs you more.
      </p>
    </div>
  );
}
