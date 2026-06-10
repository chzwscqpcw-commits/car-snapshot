"use client";

import { useState, useEffect, useCallback } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";

/** Fisher-Yates shuffle — show all facts before any repeat. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Model-specific "Did you know?" card. Picks a random fact on mount (so it
 * varies each visit); the user taps ↻ for another — no auto-rotate, so there's
 * always time to read. Each fact "materialises" in via the .fact-enter
 * animation, re-keyed on `tick` so it replays on every change. Renders nothing
 * if there are no facts.
 */
export default function ModelFact({ vehicleName, facts }: { vehicleName: string; facts: string[] }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  // Bumped on every fact change; used as the <p> key to replay the entrance.
  const [tick, setTick] = useState(0);
  // Spin the ↻ icon briefly on each tap.
  const [spinning, setSpinning] = useState(false);

  // Shuffle on mount / when facts change (deferred to effect for SSR safety).
  useEffect(() => {
    if (facts.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueue(shuffle(facts));
    setIndex(0);
    setTick((t) => t + 1);
  }, [facts]);

  const advance = useCallback(() => {
    setIndex((prev) => {
      const next = prev + 1;
      if (next >= queue.length) {
        setQueue(shuffle(facts));
        return 0;
      }
      return next;
    });
    setTick((t) => t + 1);
    setSpinning(true);
    setTimeout(() => setSpinning(false), 500);
  }, [queue.length, facts]);

  if (facts.length === 0 || queue.length === 0) return null;

  const fact = queue[index];

  return (
    <div className="mb-8 p-4 sm:p-5 rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-950/20 to-slate-900/30">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90 mb-1">
            Did you know about your {vehicleName}?
          </p>
          <p
            key={tick}
            className="fact-enter text-sm text-slate-200 min-h-[2.5rem]"
            aria-live="polite"
          >
            {fact}
          </p>
          {queue.length > 1 && (
            <button
              type="button"
              onClick={advance}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-amber-300 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 transition-transform duration-500 ${spinning ? "rotate-180" : ""}`} />
              Another fact
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
