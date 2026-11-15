"use client";

import { Banknote } from "lucide-react";
import {
  PARTNER_LINKS,
  WBAC_PREFILLS_PLATE,
  goLink,
  isPartnerConfigured,
  setGoPlate,
} from "@/config/partners";
import { usePartnerImpression } from "@/components/usePartnerImpression";
import WbacLogo from "@/components/WbacLogo";
import {
  WBAC_BUTTON_LABEL,
  WBAC_DISCLOSURE,
  WBAC_POINTS,
  WbacPitch,
  wbacHeading,
} from "@/components/SellCarCTA";

interface SellCarStripProps {
  /** Handed to /go for We Buy Any Car's pre-fill (see SellCarCTA). */
  regNumber?: string;
  /** Cars only, as everywhere We Buy Any Car is shown. Required on purpose. */
  isVan: boolean;
  /** "Ford Focus" — names the car in the heading. Omit when unknown. */
  vehicleName?: string;
  /** False once the visitor says they are keeping the car: the strip folds
   *  away and can't be reached by tab or screen reader. */
  open: boolean;
  /** The preview page: render it, record nothing. */
  preview?: boolean;
  /** Called on a click on the offer, before the browser leaves for /go. */
  onOfferClick?: () => void;
}

/**
 * The We Buy Any Car offer as the foot of the valuation card: arm "top" of
 * valuation_wbac_top_v1 (see EXPERIMENTS in tracking.ts). Same offer, same
 * approved wording and same /go route as SellCarCTA, in a quarter of the
 * height, so a seller has both things on one screen: what the car is worth
 * (ours) and where to see what they could sell it for today (theirs).
 *
 * It sits UNDER our figure, range and car details and never beside or above
 * them: the valuation is what the page promised, and it is laid out exactly
 * as it is without the strip. Meant to be placed as the last child of a
 * padded card; the negative margins carry its tint to the card's edges.
 *
 * Its own /go context, `valuation-result-wbac-top`, reaches the partner as
 * the placement, so their order report splits by arm. `partner_impression`
 * fires under the same context when half the strip is on screen.
 */
export default function SellCarStrip({
  regNumber,
  isVan,
  vehicleName,
  open,
  preview = false,
  onOfferClick,
}: SellCarStripProps) {
  const live = isPartnerConfigured(PARTNER_LINKS.weBuyAnyCar) && !isVan;
  const ref = usePartnerImpression<HTMLDivElement>(
    "weBuyAnyCar",
    "valuation-result-wbac-top",
    live && open && !preview,
  );

  if (!live) return null;

  return (
    <div
      inert={!open}
      className={`@container -mx-6 -mb-6 grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none sm:-mx-8 sm:-mb-8 ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          ref={ref}
          data-wbac-top
          className="wbac-top-enter mt-5 border-t border-emerald-500/25 bg-gradient-to-r from-emerald-900/35 via-emerald-950/25 to-slate-950/0 px-6 pb-4 pt-4 sm:px-8 sm:pb-5"
        >
          <div className="@xl:flex @xl:items-center @xl:gap-8">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                <h3 className="flex-1 text-sm font-semibold text-white @xl:flex-none">{wbacHeading(vehicleName)}</h3>
                <WbacLogo className="shrink-0 text-[10px]" />
              </div>
              <p className="mt-1.5 text-[13px] leading-snug text-slate-300">
                <WbacPitch />
              </p>
            </div>

            <div className="mt-3 shrink-0 @xl:mt-0 @xl:w-60">
              <a
                href={goLink("webuyanycar", "valuation-result-wbac-top")}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                onClick={() => {
                  if (WBAC_PREFILLS_PLATE) setGoPlate(regNumber);
                  onOfferClick?.();
                }}
                className="wbac-top-sheen group relative inline-flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 transition-colors hover:bg-emerald-600 active:bg-emerald-600"
              >
                {WBAC_BUTTON_LABEL}
                <span
                  aria-hidden
                  className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                >
                  &#8599;
                </span>
              </a>
              <p className="mt-2 text-center text-[11px] text-emerald-200/80">{WBAC_POINTS.join(" · ")}</p>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-snug text-slate-500 @xl:mt-3">{WBAC_DISCLOSURE}</p>
        </div>
      </div>
    </div>
  );
}
