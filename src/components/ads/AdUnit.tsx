"use client";

import { useEffect } from "react";
import { ADSENSE_CLIENT, AD_SLOTS, adsEnabled } from "@/config/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdUnitProps {
  /** Which configured slot to render (see AD_SLOTS in config/ads.ts). */
  slot: keyof typeof AD_SLOTS;
  className?: string;
}

/**
 * A single responsive AdSense unit. Renders NOTHING until ads are enabled and
 * the slot ID is configured — safe to mount now, activate later. Labelled
 * "Advertisement" (honest + AdSense-friendly).
 */
export default function AdUnit({ slot, className }: AdUnitProps) {
  const slotId = AD_SLOTS[slot];
  const live = adsEnabled() && !!slotId;

  useEffect(() => {
    if (!live) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense library not ready or blocked by the browser — ignore.
    }
  }, [live]);

  if (!live) return null;

  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1 text-center">
        Advertisement
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
