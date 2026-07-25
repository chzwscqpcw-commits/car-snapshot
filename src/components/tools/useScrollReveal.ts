"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered reveal for entrance animations (line-draws, bar grow-ins).
 * Returns a ref to attach to the container plus `revealed` / `reduced` flags.
 * State writes are deferred out of the synchronous effect body (rAF / observer
 * callback) to satisfy react-hooks/set-state-in-effect and avoid cascading
 * renders. Honours prefers-reduced-motion (reveals instantly, no animation).
 */
export function useScrollReveal(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let io: IntersectionObserver | null = null;
    const raf = requestAnimationFrame(() => {
      if (mq.matches) {
        setReduced(true);
        setRevealed(true);
        return;
      }
      const el = ref.current;
      if (!el) {
        setRevealed(true);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setRevealed(true);
            io?.disconnect();
          }
        },
        { threshold },
      );
      io.observe(el);
    });
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [threshold]);

  return { ref, revealed, reduced };
}
