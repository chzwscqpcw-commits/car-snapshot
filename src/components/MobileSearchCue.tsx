"use client";

import { trackEvent } from "@/lib/tracking";

/**
 * Mobile-only "tap to check your reg" CTA shown below the example card on
 * landing pages.
 *
 * This is the shipped winner of the mobile_search_cue_v1 A/B/C test: variant C,
 * the bold block CTA, which drove ~37.7% tap-through vs 24.6% (pill) and 2.6%
 * (subtle text link) over ~480 impressions. The experiment has been retired;
 * clicks are now tracked as a plain `mobile_search_cue_click` event.
 */
export default function MobileSearchCue() {
  return (
    <a
      href="#check-vehicle"
      onClick={() => trackEvent("mobile_search_cue_click")}
      className="lg:hidden mt-3 mx-auto flex max-w-xs items-center justify-center gap-2 rounded-lg border-2 border-emerald-500 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-5 py-3 text-sm font-bold text-emerald-200 shadow-lg shadow-emerald-500/20 transition-colors hover:from-emerald-500/30 hover:to-cyan-500/30"
    >
      Tap to check yours
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </a>
  );
}
