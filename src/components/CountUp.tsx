"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  /** Final value to count up to. */
  target: number;
  /** Animation duration in ms. */
  durationMs?: number;
  /** Locale for number formatting. */
  locale?: string;
}

/**
 * Animated count-up display.
 *
 * Counts from 0 to `target` over `durationMs` using ease-out-cubic, then
 * settles on the exact target. Honours prefers-reduced-motion by snapping
 * straight to the target.
 *
 * Component owns its own state so the animation does not re-render whatever
 * parent renders it (important when the parent is a large page component).
 */
export default function CountUp({
  target,
  durationMs = 1600,
  locale = "en-GB",
}: CountUpProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setDisplayed(0);
      return;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayed(target);
      return;
    }

    let cancelled = false;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (cancelled) return;
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(target * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);

    return () => {
      cancelled = true;
    };
  }, [target, durationMs]);

  return <>{displayed.toLocaleString(locale)}</>;
}
