"use client";

import { useEffect, useState } from "react";
import ConversionWidget from "@/components/stats/ConversionWidget";
import { EXPERIMENTS, assignExperimentVariant } from "@/lib/tracking";

/**
 * Variant-aware wrapper around {@link ConversionWidget} for the /car-valuation
 * page, part of the `valuation_hero_reg_v1` A/B test.
 *
 * Variant "b" moves the reg box into the page hero (see ValuationHeroReg), so
 * this lower widget hides its own reg-lookup to avoid a redundant duplicate —
 * keeping only the MOT-reminder block. Variant "a" (and any unresolved/SSR
 * state) keeps the lookup, so the control layout is unchanged.
 *
 * Assignment is sticky + idempotent: calling assignExperimentVariant here
 * returns the same bucket ValuationHeroReg assigns, regardless of mount order.
 */
export default function ValuationConversionWidget(
  props: React.ComponentProps<typeof ConversionWidget>
) {
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVariant(assignExperimentVariant(EXPERIMENTS.VALUATION_HERO_REG, ["a", "b"]));
  }, []);

  // Default to showing the lookup until the variant resolves, so the control
  // (and the SSR/first paint) never flashes a missing box; only variant "b"
  // hides it once known.
  return <ConversionWidget {...props} showLookup={variant !== "b"} />;
}
