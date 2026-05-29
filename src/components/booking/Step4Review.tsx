"use client";

import { ExternalLink, Edit3, ShieldCheck } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
import {
  flexibilityLabel,
  formatPriceRange,
  priceRangeFor,
  resolveRegion,
  serviceLabel,
  serviceMeta,
  type FlexibilityChip,
  type ServiceType,
  type VehicleCategory,
} from "@/lib/booking";

interface Props {
  vrm: string;
  vehicleLabel: string;
  service: ServiceType;
  category: VehicleCategory;
  postcode: string;
  date: string;
  flexibility: FlexibilityChip;
  onEdit: () => void;
}

function buildBmgHandoffUrl(
  service: ServiceType,
  vrm: string,
  postcode: string,
  clickref: string,
): string {
  // The Awin tracker still wraps the destination so attribution works.
  //
  // When we have BOTH vrm and postcode AND the service is MOT, deep-link
  // straight to BMG's results page — skipping the search form and its
  // "Compare Prices Instantly" click. The URL pattern was confirmed by
  // observing the redirect after submitting the search form on
  // bookmygarage.com/mot/. Saves the user one tap and removes the
  // friction of seeing their already-pre-filled details on a form they
  // didn't fill in.
  //
  // For service / diagnostic, or when postcode is missing, we still
  // route to the search page — BMG's results URL pattern for those
  // services isn't confirmed yet, and the search page works as a safe
  // fallback either way.
  const hasFullContext = vrm && postcode;
  let destination: string;
  if (hasFullContext && service === "mot") {
    const params = new URLSearchParams();
    params.set("p", "1");
    params.set("postcode", postcode);
    params.set("vrm", vrm);
    destination = `https://bookmygarage.com/results/?${params.toString()}`;
  } else {
    const base =
      service === "mot"
        ? "https://www.bookmygarage.com/mot/"
        : service === "diagnostic"
          ? "https://www.bookmygarage.com/car-repairs/"
          : "https://www.bookmygarage.com/car-servicing/";
    const params = new URLSearchParams();
    if (vrm) params.set("vrm", vrm);
    if (postcode) params.set("postcode", postcode);
    const query = params.toString();
    destination = query ? `${base}?${query}` : base;
  }

  const encoded = encodeURIComponent(destination);
  // clickref gets passed through to Awin commission reports so we can
  // attribute every conversion to a specific CTA in the Awin dashboard.
  // Matches the click_context fired via trackPartnerClick.
  const clickrefParam = clickref ? `&clickref=${encodeURIComponent(clickref)}` : "";
  return `https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598${clickrefParam}&ued=${encoded}`;
}

function formatDateFriendly(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default function Step4Review({
  vrm,
  vehicleLabel,
  service,
  category,
  postcode,
  date,
  flexibility,
  onEdit,
}: Props) {
  const region = resolveRegion(postcode);
  const price = priceRangeFor(service, category, region);
  const meta = serviceMeta(service);
  const clickref = `booking-flow-${service}`;
  const handoffUrl = buildBmgHandoffUrl(service, vrm, postcode, clickref);

  function handleHandoffClick() {
    trackPartnerClick("bookMyGarage", clickref);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Ready to compare prices</h2>
        <p className="mt-1 text-sm text-slate-400">
          Here&apos;s what we&apos;ll send to BookMyGarage. You can edit anything, or hand off now.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Vehicle</p>
            <p className="mt-0.5 text-base font-semibold text-white truncate">
              {vrm && <span className="font-mono tracking-wider text-cyan-300 mr-2">{vrm}</span>}
              {vehicleLabel || (vrm ? "Loading vehicle…" : "No vehicle selected")}
            </p>
          </div>
        </div>

        <hr className="border-slate-800" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Service</p>
            <p className="mt-0.5 text-white font-medium">{serviceLabel(service)}</p>
            <p className="mt-0.5 text-xs text-slate-400">{meta.summary}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Estimated price</p>
            <p className="mt-0.5 text-emerald-300 font-mono font-semibold tabular-nums">
              {formatPriceRange(price)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{region.label} · ~{meta.durationMins} min</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Location</p>
            <p className="mt-0.5 text-white font-mono">{postcode || "Not specified"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Timing</p>
            <p className="mt-0.5 text-white">
              {flexibility === "browsing"
                ? "Just browsing"
                : `${flexibilityLabel(flexibility)} · ${formatDateFriendly(date)}`}
            </p>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">What happens next</p>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          You&apos;ll hand off to BookMyGarage with your reg{postcode ? " and postcode" : ""} pre-filled.
          You&apos;ll see real-time quotes from local garages, then book with whichever
          suits you. We don&apos;t share your email or sell your details — that stays at BMG.
        </p>
      </div>

      {/* CTAs */}
      <div className="space-y-2">
        <a
          href={handoffUrl}
          target="_blank"
          rel={getPartnerRel(PARTNER_LINKS.bookMyGarage)}
          onClick={handleHandoffClick}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3.5 font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition-all hover:from-emerald-400 hover:to-cyan-400"
        >
          Compare prices on BookMyGarage
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit details
        </button>
        <p className="text-[10px] text-slate-600 text-center pt-1">
          Free comparison · No booking fee · Free Plate Check earns a small commission
        </p>
      </div>
    </div>
  );
}
