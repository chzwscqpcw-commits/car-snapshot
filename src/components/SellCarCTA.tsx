"use client";

import { useEffect, useRef } from "react";
import { Banknote } from "lucide-react";
import {
  PARTNER_LINKS,
  WBAC_PREFILLS_PLATE,
  goLink,
  isPartnerConfigured,
  setGoPlate,
  type GoContext,
} from "@/config/partners";
import { trackEvent } from "@/lib/tracking";
import WbacLogo from "@/components/WbacLogo";

interface SellCarCTAProps {
  /** click_context, and the Rakuten `u1` sub-ID the sale is attributed under. */
  context: Extract<GoContext, "valuation-result-wbac" | "money-wbac">;
  /** Handed to /go for We Buy Any Car's pre-fill, once that's confirmed to work
   *  (WBAC_PREFILLS_PLATE in partners.ts). */
  regNumber?: string;
  /** WBAC's affiliate programme is cars only — they asked us not to show the
   *  offer for vans (28 Oct 2026). Required so no new placement forgets it. */
  isVan: boolean;
  /** "Ford Focus" — names the car in the heading. Omit when unknown. */
  vehicleName?: string;
  /** Render even while the partner is pending — for the preview page. */
  preview?: boolean;
  className?: string;
}

/**
 * We Buy Any Car "sell your car" offer for the valuation journey — someone who
 * has just valued a car they own is exactly who an instant-offer buyer wants.
 * Renders null for vans, and while the partner is pending.
 *
 * Sits BELOW the carVertical seller box on both valuation surfaces, never above
 * it: that box is the site's best converter (6.9% on the valuation result,
 * Sep–Oct 2026), and pushing it down to make room for an untested offer is how
 * a proven placement gets lost.
 *
 * Clicks go through /go/webuyanycar, like carVertical's: the route records the
 * click server-side (ad-blockers can't drop it), turns away bots before the
 * Rakuten tracker is hit — a new network's first weeks are the worst time for
 * a run of fake clicks — and rebuilds the tracker link from partners.ts. So no
 * trackPartnerClick here, or every click would count twice.
 */
export default function SellCarCTA({ context, regNumber, isVan, vehicleName, preview = false, className = "" }: SellCarCTAProps) {
  const live = isPartnerConfigured(PARTNER_LINKS.weBuyAnyCar) && !isVan;

  // `partner_impression` once, when half the card is on screen — the same
  // seen-not-just-mounted standard as the carVertical boxes, so the click rate
  // can be read against them. Never from the preview page.
  const cardRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(false);
  useEffect(() => {
    if (!live || preview || seenRef.current) return;
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !seenRef.current) {
          seenRef.current = true;
          trackEvent("partner_impression", { partner_id: "weBuyAnyCar", click_context: context });
          obs.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [live, preview, context]);

  if (!live && !preview) return null;

  return (
    <div
      ref={cardRef}
      className={`rounded-xl border border-emerald-600/40 bg-gradient-to-br from-emerald-900/40 via-emerald-950/30 to-slate-900/30 p-5 sm:p-6 shadow-lg shadow-emerald-950/30 ${className}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <Banknote className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
        <h3 className="flex-1 text-base sm:text-lg font-semibold text-white">
          {vehicleName ? `Selling your ${vehicleName}?` : "Thinking of selling?"}
        </h3>
        <WbacLogo className="shrink-0 text-xs" />
      </div>

      {/* Claims about WBAC stay within their own approved link text ("Get Your
          Free 30 Second Car Valuation") — the Rakuten agreement (2.5) bars any
          others. Never imply they'll pay our figure: theirs is a trade offer. */}
      <p className="text-sm text-slate-300 leading-relaxed mb-3 ml-8">
        Our figure is a guide to what it&apos;s worth. To see what you could sell it for today, get a free online valuation from <strong className="text-slate-100">We Buy Any Car</strong>.
      </p>

      <ul className="ml-8 mb-4 flex flex-wrap gap-2 text-xs text-emerald-200">
        {["Free", "About 30 seconds", "Online"].map((t) => (
          <li key={t} className="rounded-full border border-emerald-700/50 bg-emerald-900/30 px-2.5 py-1">
            {t}
          </li>
        ))}
      </ul>

      <div className="ml-8">
        <a
          href={goLink("webuyanycar", context)}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          onClick={() => {
            if (WBAC_PREFILLS_PLATE) setGoPlate(regNumber);
          }}
          className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Get my free valuation &#8599;
        </a>
      </div>

      <p className="text-xs text-slate-500 mt-3 ml-8">
        Free Plate Check may earn a small commission from this link.
      </p>
    </div>
  );
}
