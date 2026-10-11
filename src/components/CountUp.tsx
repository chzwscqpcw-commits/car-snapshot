"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  /** Final value to count up to. */
  target: number;
  /** Text to render before the number (e.g. "£", "+", "~£"). */
  prefix?: string;
  /** Text to render after the number (e.g. "%", "/yr", " miles"). */
  suffix?: string;
  /** Decimal places to preserve. Default 0 (integer). */
  decimals?: number;
  /** Animation duration in ms. */
  durationMs?: number;
  /** Locale for number formatting (thousands separators). */
  locale?: string;
}

/**
 * Animated count-up display.
 *
 * Counts from 0 to `target` over `durationMs` using ease-out-cubic, then
 * settles on the exact target. Honours prefers-reduced-motion by snapping
 * straight to the target.
 *
 * The SERVER renders the real target, not 0. Until 2026-10-11 the initial
 * state was 0, so every stat box shipped "0" in its HTML — which is what
 * text-only crawlers, link unfurlers and no-JS visitors read ("~ 0 Vehicle
 * thefts in 2024" on the live car-theft page). The number is marked
 * `data-countup="pending"` and the head script in layout.tsx adds `.js` to
 * <html> before first paint, so with JS on it stays hidden until the effect
 * below resets it to 0 and starts counting — same look as before, no flash of
 * the final value. globals.css reveals it after 3s regardless, in case the
 * bundle never hydrates.
 *
 * Component owns its own state so the animation does not re-render whatever
 * parent renders it (important when the parent is a large page component).
 */
export default function CountUp({
  target,
  prefix = "",
  suffix = "",
  decimals = 0,
  durationMs = 1600,
  locale = "en-GB",
}: CountUpProps) {
  const [displayed, setDisplayed] = useState(target);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (target === 0 || reduceMotion) {
      // Nothing to animate: show the real value as soon as we're hydrated.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayed(target);
      setPending(false);
      return;
    }

    let cancelled = false;
    let startTime: number | null = null;
    setDisplayed(0);
    setPending(false);

    const tick = (now: number) => {
      if (cancelled) return;
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(target * eased);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);

    return () => {
      cancelled = true;
    };
  }, [target, durationMs]);

  const formatted = displayed.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span data-countup={pending ? "pending" : undefined}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
