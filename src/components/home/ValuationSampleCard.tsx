"use client";

import SampleResultCard from "@/components/home/SampleResultCard";
import { trackEvent } from "@/lib/tracking";

// /value-my-car's example valuation, before anyone has searched. The page is a
// server component, so the card's "try your own" handler lives here: it sends
// the visitor to the hero reg box and notes the tap.

export default function ValuationSampleCard({
  placement,
  className = "",
  wide = false,
}: {
  placement: "rail" | "inline";
  className?: string;
  wide?: boolean;
}) {
  const tryOwnCar = (car: string) => {
    trackEvent("valuation_sample_click", { placement, car });
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Vehicle registration"]');
    if (!input) return;
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input.focus({ preventScroll: true }), 450);
  };
  return <SampleResultCard variant="valuation" onTry={tryOwnCar} wide={wide} className={className} />;
}
