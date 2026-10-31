"use client";

import { useEffect, useState } from "react";
import { INTENT_LABELS, SAVE_INTENTS, type SaveIntent } from "@/lib/saved-cars";
import { carIntent, onIntentChange, rememberIntent } from "@/lib/my-cars";
import { trackEvent } from "@/lib/tracking";

/**
 * "Selling it, or keeping it?" — one tap above the seller offers on a
 * valuation. Half of everyone valuing a car owns it and is not selling, and
 * the only honest way to know which half someone is in is to ask. A keeper
 * gets no selling offers at all (the valuation stays a valuation); a seller,
 * or someone thinking about it, gets We Buy Any Car first and carVertical
 * second. Nobody is made to answer: until they do, both offers show.
 *
 * The answer is kept per plate on this device (my-cars.ts) and pre-fills the
 * save card's "plans for it?" row, so the page never asks twice. Each tap
 * fires `seller_intent {surface, intent}` — the declared signal the partner
 * clicks can be read against.
 */

export function useCarIntent(vrm: string): SaveIntent | null {
  const plate = vrm.replace(/\s+/g, "").toUpperCase();
  const [intent, setIntent] = useState<SaveIntent | null>(null);
  useEffect(() => {
    const sync = () => setIntent(plate ? carIntent(plate) : null);
    sync();
    return onIntentChange(sync);
  }, [plate]);
  return intent;
}

export default function SellerIntentChip({
  vrm,
  surface,
  className = "",
}: {
  vrm: string;
  /** Which valuation this sits on, for the event. */
  surface: "valuation-result" | "home-valuation";
  className?: string;
}) {
  const plate = vrm.replace(/\s+/g, "").toUpperCase();
  const intent = useCarIntent(plate);

  const pick = (i: SaveIntent) => {
    const next = intent === i ? null : i;
    rememberIntent(plate, next);
    trackEvent("seller_intent", { surface, intent: next ?? "cleared", vrm: plate });
  };

  return (
    <div
      data-seller-intent={surface}
      className={`rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm font-medium text-slate-200">Selling it, or keeping it?</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Your plans for this car">
          {SAVE_INTENTS.map((i) => {
            const on = intent === i;
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                onClick={() => pick(i)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95 ${
                  on
                    ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
                    : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500 hover:text-white"
                }`}
              >
                {INTENT_LABELS[i]}
              </button>
            );
          })}
        </div>
      </div>
      {intent === "keeping" && (
        <p className="mt-2 text-xs text-slate-500">
          No selling offers, then. Save it below and we&apos;ll tell you when the MOT or tax is due.
        </p>
      )}
    </div>
  );
}
