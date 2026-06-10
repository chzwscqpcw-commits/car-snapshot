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
 * Model-specific "Did you know?" card for the results page. Picks a random fact
 * on mount (so it varies each visit), auto-rotates, and lets the user tap for
 * another. Renders nothing if there are no facts.
 */
export default function ModelFact({ vehicleName, facts }: { vehicleName: string; facts: string[] }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  // Shuffle on mount / when facts change (deferred to effect for SSR safety).
  useEffect(() => {
    if (facts.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueue(shuffle(facts));
    setIndex(0);
    setVisible(true);
  }, [facts]);

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= queue.length) {
          setQueue(shuffle(facts));
          return 0;
        }
        return next;
      });
      setVisible(true);
    }, 350);
  }, [queue.length, facts]);

  // Gentle auto-rotate when there's more than one fact.
  useEffect(() => {
    if (queue.length <= 1) return;
    const timer = setInterval(advance, 14_000);
    return () => clearInterval(timer);
  }, [advance, queue.length]);

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
            className="text-sm text-slate-200 transition-opacity duration-300 min-h-[2.5rem]"
            style={{ opacity: visible ? 1 : 0 }}
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
              <RefreshCw className="w-3 h-3" />
              Another fact
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
