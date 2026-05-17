"use client";

import { useEffect, useState } from "react";
import {
  EXPERIMENTS,
  trackExperimentClick,
  trackExperimentImpression,
} from "@/lib/tracking";

const EXPERIMENT_ID = EXPERIMENTS.MOBILE_SEARCH_CUE;
const STORAGE_KEY = `experiment_${EXPERIMENT_ID}`;

type Variant = "A" | "B" | "C";
const VARIANTS: readonly Variant[] = ["A", "B", "C"] as const;

function getOrAssignVariant(): Variant {
  if (typeof window === "undefined") return "A";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "A" || stored === "B" || stored === "C") return stored;
    const assigned = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    localStorage.setItem(STORAGE_KEY, assigned);
    return assigned;
  } catch {
    // localStorage unavailable (private mode etc.) — default to A
    return "A";
  }
}

/**
 * Mobile-only "scroll down to enter your reg" affordance shown below the
 * illustrative example card on landing pages. Three variants are randomly
 * assigned per visitor (sticky via localStorage) to A/B/C test which framing
 * produces the highest engagement.
 *
 * Tracked via gtag: experiment_impression on mount, experiment_click on tap.
 * Downstream conversions (reg search submitted, MOT reminder set) are tagged
 * with the active variant via trackConversion() in ConversionWidget.
 */
export default function MobileSearchCue() {
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    const v = getOrAssignVariant();
    setVariant(v);
    trackExperimentImpression(EXPERIMENT_ID, v);
  }, []);

  if (!variant) return null;

  const onClick = () => trackExperimentClick(EXPERIMENT_ID, variant);

  if (variant === "A") {
    return (
      <a
        href="#check-vehicle"
        onClick={onClick}
        className="lg:hidden mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
      >
        Check yours below
        <svg className="h-3 w-3 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </a>
    );
  }

  if (variant === "B") {
    return (
      <a
        href="#check-vehicle"
        onClick={onClick}
        className="lg:hidden mt-4 mx-auto flex w-fit items-center gap-2 rounded-full border border-emerald-700/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
      >
        Check your vehicle now
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    );
  }

  // Variant C: bold attention-grabbing block CTA
  return (
    <a
      href="#check-vehicle"
      onClick={onClick}
      className="lg:hidden mt-3 mx-auto flex max-w-xs items-center justify-center gap-2 rounded-lg border-2 border-emerald-500 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-5 py-3 text-sm font-bold text-emerald-200 shadow-lg shadow-emerald-500/20 transition-colors hover:from-emerald-500/30 hover:to-cyan-500/30"
    >
      Tap to check yours
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </a>
  );
}
