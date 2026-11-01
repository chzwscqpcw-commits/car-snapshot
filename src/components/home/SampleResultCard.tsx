"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useScrollReveal } from "@/components/tools/useScrollReveal";
import { CLASSIC_SAMPLE, SAMPLE_CARS, pageSampleIndex } from "@/components/home/sample-cars";
import { RING_C } from "@/components/home/sample-graphics";
import { HeaderAside, VARIANT_COPY, VariantBody, type SampleVariant } from "@/components/home/sample-bodies";

export type { SampleVariant };

// What a lookup returns, shown before anyone has searched: one of a handful of
// made-up example cars (sample-cars.ts), clearly labelled as such. The "check"
// variant is the homepage's full report; "valuation" is what /value-my-car
// shows; the rest are each tool lander's own result (sample-bodies.tsx). Wide
// screens show the card beside the hero; narrower ones show it once, below
// the search box. The rows and their graphics animate in once the card is on
// screen (sample-graphics.tsx has the pieces, the keyframes are below).

export default function SampleResultCard({
  onTry,
  className = "",
  wide = false,
  variant = "check",
}: {
  onTry: (car: string) => void;
  className?: string;
  /** Inline copy: two columns of rows from md up, so it never stretches thin. */
  wide?: boolean;
  /** Which tool's result this is an example of. */
  variant?: SampleVariant;
}) {
  // The server renders the first car; the visitor's car is picked after
  // mount (deferred, as useScrollReveal does), while everything is still
  // hidden waiting for the entrance.
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIndex(pageSampleIndex()));
    return () => cancelAnimationFrame(raf);
  }, []);
  const car = SAMPLE_CARS[index];
  // The exemption check needs a car near the 40-year line, so it has its own.
  const identity = variant === "exemption" ? CLASSIC_SAMPLE : car;
  const copy = VARIANT_COPY[variant];

  // Play the entrance once, when the card is actually on screen.
  const { ref, revealed: shown } = useScrollReveal(0.25);

  return (
    <div
      ref={ref}
      className={`sample-card relative rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur shadow-[0_20px_60px_-20px_rgba(34,211,238,0.25)] p-5 ${shown ? "is-shown" : ""} ${className}`}
    >
      <style>{`
        .sample-card .sample-row { opacity: 0; transform: translateY(6px); }
        .sample-card.is-shown .sample-row { animation: sampleRowIn 0.45s ease-out forwards; }
        .sample-card .sample-pop { opacity: 0; transform: scale(0.4); transform-box: fill-box; transform-origin: center; }
        .sample-card.is-shown .sample-pop { animation: samplePop 0.35s cubic-bezier(.34,1.56,.64,1) forwards; }
        .sample-card .sample-grow-x { transform: scaleX(0); transform-box: fill-box; transform-origin: left center; }
        .sample-card.is-shown .sample-grow-x { animation: sampleGrowX 0.6s ease-out forwards; }
        .sample-card .sample-grow-y { transform: scaleY(0); transform-origin: center bottom; }
        .sample-card.is-shown .sample-grow-y { animation: sampleGrowY 0.5s ease-out forwards; }
        .sample-card .sample-ring { stroke-dashoffset: ${RING_C}; }
        .sample-card.is-shown .sample-ring { animation: sampleRing 1.2s ease-out 0.2s forwards; }
        @keyframes sampleRowIn { to { opacity: 1; transform: none; } }
        @keyframes samplePop { to { opacity: 1; transform: none; } }
        @keyframes sampleGrowX { to { transform: none; } }
        @keyframes sampleGrowY { to { transform: none; } }
        @keyframes sampleRing { to { stroke-dashoffset: var(--ring-to); } }
        @media (prefers-reduced-motion: reduce) {
          .sample-card .sample-row, .sample-card.is-shown .sample-row { animation: none; opacity: 1; transform: none; }
          .sample-card .sample-pop, .sample-card.is-shown .sample-pop,
          .sample-card .sample-grow-x, .sample-card.is-shown .sample-grow-x,
          .sample-card .sample-grow-y, .sample-card.is-shown .sample-grow-y { animation: none; opacity: 1; transform: none; }
          .sample-card .sample-ring, .sample-card.is-shown .sample-ring { animation: none; stroke-dashoffset: var(--ring-to); }
        }
      `}</style>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">What you&apos;ll see</span>
        <span className="text-[11px] text-slate-500">{copy.label}</span>
      </div>

      <div className="sample-row flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="inline-block rounded-md bg-[#f6d33a] px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-slate-900">
            {identity.plate}
          </div>
          <div className="mt-1.5 text-base font-semibold text-white truncate">{identity.title}</div>
          <div className="text-xs text-slate-400">{identity.spec}</div>
        </div>
        <HeaderAside variant={variant} car={car} />
      </div>

      <VariantBody variant={variant} car={car} wide={wide} />

      <button
        type="button"
        onClick={() => onTry(variant === "exemption" ? "classic" : car.id)}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
      >
        <ArrowUp className="w-4 h-4 text-cyan-400" />
        {copy.cta}
      </button>
    </div>
  );
}
