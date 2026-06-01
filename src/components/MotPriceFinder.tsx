"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, PoundSterling } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function isValidReg(reg: string): boolean {
  const cleaned = cleanReg(reg);
  return cleaned.length >= 2 && cleaned.length <= 8;
}

/**
 * Tool-first hero CTA for the /cheap-mot commercial landing page. Unlike
 * ConversionWidget (which pre-flights the DVLA lookup before navigating to a
 * data result), this is a pure intent capture: take the reg and drop the
 * visitor straight into the /booking wizard, which does its own background
 * lookup and price-range work before the BookMyGarage hand-off. The reg is
 * optional — an empty submit still enters the wizard so we never block a
 * high-intent "just compare prices" click.
 *
 * Fires cheap_mot_compare_click (with has_reg + source) so the keystone
 * page's contribution to BMG bookings is attributable separately from the
 * results-page CTAs. The eventual partner_click still happens at wizard Step 4.
 */
export default function MotPriceFinder({
  source = "cheap_mot_hero",
}: {
  source?: string;
}) {
  const router = useRouter();
  const [reg, setReg] = useState("");
  const [error, setError] = useState("");

  function go() {
    const cleaned = cleanReg(reg);
    // Reg is optional, but if they typed something it must look valid —
    // otherwise the wizard would background-fetch a 404 and show an empty
    // vehicle card.
    if (cleaned && !isValidReg(reg)) {
      setError("That doesn’t look like a valid UK registration");
      return;
    }
    setError("");
    trackEvent("cheap_mot_compare_click", { has_reg: Boolean(cleaned), source });
    const qs = new URLSearchParams({ type: "mot", source });
    if (cleaned) qs.set("vrm", cleaned);
    router.push(`/booking?${qs.toString()}`);
  }

  return (
    <div className="rounded-xl border border-emerald-700/40 bg-gradient-to-r from-emerald-900/25 to-cyan-900/25 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <PoundSterling className="h-5 w-5 shrink-0 text-emerald-400" />
        <h2 className="text-lg font-bold text-slate-100">
          Compare local MOT prices
        </h2>
      </div>
      <p className="mt-1.5 text-sm text-slate-400">
        Enter your reg to see what garages near you charge — many beat the
        &pound;54.85 legal maximum. Free, no signup.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={reg}
            onChange={(e) => {
              setReg(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") go();
            }}
            placeholder="Enter reg, e.g. AB12 CDE"
            maxLength={10}
            aria-label="Vehicle registration"
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 font-mono text-sm uppercase tracking-widest text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={go}
          className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 text-sm font-semibold text-white transition-all hover:from-emerald-600 hover:to-cyan-600 active:scale-95"
        >
          <PoundSterling className="h-4 w-4" />
          Compare MOT prices
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <p className="mt-3 text-xs text-slate-500">
        Free comparison &middot; No booking fee &middot; Prices from local
        garages &middot; Free Plate Check may earn a small commission
      </p>
    </div>
  );
}
