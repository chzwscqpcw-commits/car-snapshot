"use client";

import SampleResultCard, { type SampleVariant } from "@/components/home/SampleResultCard";
import { trackEvent } from "@/lib/tracking";

// A tool lander's example result, before anyone has searched: the same live
// card the homepage shows beside its hero, in that tool's form. The pages are
// server components, so the card's "try your own" handler lives here: it
// sends the visitor to the hero reg box and notes the tap as
// tool_sample_click { tool, variant, placement, car } — one event for every
// lander, split by `tool` (the page) and `placement` (rail beside the hero on
// wide screens, inline below the search box on narrower ones).

export default function ToolSampleCard({
  variant,
  tool,
  placement,
  className = "",
  wide = false,
}: {
  variant: SampleVariant;
  /** The page, as its path without the slash: "mot-check", "tax-check"… */
  tool: string;
  placement: "rail" | "inline";
  className?: string;
  wide?: boolean;
}) {
  const tryOwnCar = (car: string) => {
    trackEvent("tool_sample_click", { tool, variant, placement, car });
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Vehicle registration"]');
    if (!input) return;
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input.focus({ preventScroll: true }), 450);
  };
  return <SampleResultCard variant={variant} onTry={tryOwnCar} wide={wide} className={className} />;
}
