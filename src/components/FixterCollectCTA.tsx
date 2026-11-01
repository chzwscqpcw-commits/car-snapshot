"use client";

import { Truck } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel, isPartnerConfigured } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
import PartnerTrust from "@/components/PartnerTrust";

/**
 * The "have it collected" alternative — Fixter (Awin 18184) — placed beside a
 * BookMyGarage call to action, never instead of it.
 *
 * BookMyGarage is the primary route everywhere: it covers the whole country
 * and converts at ~6% on the wizard. Fixter collects the car from the door,
 * has the work done at a vetted garage and returns it, in around 100 towns
 * and cities; its terms (in Awin, not here) favour the bigger service basket,
 * but it has no conversion history with us. So it is offered as the second option on
 * the surfaces where the visitor is likeliest to want it — a service rather
 * than a bare MOT, or a city town page — and measured through its own
 * clickrefs (`fixter-<placement>`) before it earns anything more prominent.
 *
 * Two shapes: `card` is a bordered block with the trust line; `inline` is a
 * single sentence with a link, for sitting under another partner's button.
 */
export default function FixterCollectCTA({
  job,
  placement,
  town,
  variant = "card",
  className = "",
}: {
  /** Which Fixter landing page: their MOT page or their servicing page. */
  job: "mot" | "service";
  /** The placement name — becomes `fixter-<placement>` in our events and in Awin. */
  placement: string;
  /** Names the town in the copy on town pages. */
  town?: string;
  variant?: "card" | "inline";
  className?: string;
}) {
  const partnerId = job === "mot" ? "fixterMot" : "fixter";
  const partner = PARTNER_LINKS[partnerId];
  if (!isPartnerConfigured(partner)) return null;

  const clickref = `fixter-${placement}`;
  const href = partner.buildLink ? partner.buildLink("", clickref) : partner.url;
  const rel = getPartnerRel(partner);
  const where = town ? ` in ${town}` : "";
  const onClick = () => trackPartnerClick(partnerId, clickref);
  const from = job === "mot" ? "from £49" : "from £129";

  if (variant === "inline") {
    return (
      <p className={`text-sm leading-relaxed text-slate-400 ${className}`}>
        Rather not drive to the garage?{" "}
        <a href={href} target="_blank" rel={rel} onClick={onClick} className="font-medium text-blue-400 hover:text-blue-300">
          Fixter collects your car{where}, gets the {job === "mot" ? "MOT" : "service"} done and brings it back ↗
        </a>{" "}
        &mdash; {from}, vetted garages, 12-month warranty.
      </p>
    );
  }

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <Truck className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-100">
            Rather not drive to the {job === "mot" ? "test centre" : "garage"}?
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            Fixter collects your car{where}, has the {job === "mot" ? "MOT" : "service"} done at a vetted garage
            ({from}) and brings it back &mdash; no additional work without your say-so, and no payment until
            it&apos;s done.
          </p>
          <a
            href={href}
            target="_blank"
            rel={rel}
            onClick={onClick}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/50 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/20"
          >
            Book collection with Fixter ↗
          </a>
          <PartnerTrust partner="fixter" className="mt-3" />
          <p className="mt-2 text-xs text-slate-500">Free Plate Check may earn a small commission from this link.</p>
        </div>
      </div>
    </div>
  );
}
