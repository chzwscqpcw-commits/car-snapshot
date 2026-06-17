"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

/**
 * Small results-page nudge shown when the looked-up vehicle is electric or
 * hybrid — points the visitor to our home EV-charger installation page. It's an
 * internal link (the EV page itself handles the ClickMechanic handoff +
 * affiliate disclosure), so no disclosure is needed here. `source` tags the
 * placement for analytics (trackEvent → site_events).
 */
export default function EvChargerPromptWidget({ source }: { source: string }) {
  return (
    <div className="rounded-xl border border-cyan-800/40 bg-gradient-to-br from-cyan-950/30 to-slate-900/30 p-5 sm:p-6">
      <div className="mb-3 flex items-start gap-3">
        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
        <h3 className="text-base font-semibold text-white sm:text-lg">
          Electric or hybrid? Charge it at home
        </h3>
      </div>
      <p className="mb-4 ml-8 text-sm leading-relaxed text-slate-300">
        Charging at home costs around 2p a mile versus ~20p on public rapid chargers
        — and you wake up to a full battery. A 7kW smart charger is fitted from
        around £752, free fitting included.
      </p>
      <div className="ml-8">
        <Link
          href="/ev-charger-installation"
          onClick={() => trackEvent("ev_charger_prompt_click", { source })}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
        >
          See home charger options <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
