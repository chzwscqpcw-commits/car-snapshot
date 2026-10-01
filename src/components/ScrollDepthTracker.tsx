"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/tracking";

/**
 * Fires `scroll_depth` at 25/50/75/100% of the page, once each per mount.
 *
 * Why it exists: scroll depth was only ever instrumented on the homepage
 * results view, so `/blog/` produced ZERO scroll events. That made every
 * question about in-article CTA placement unanswerable — "the CTA sits after
 * the second H2" tells you nothing unless you know how many readers reach the
 * second H2. A placement argument without this data is decoration.
 *
 * Deliberately a null-rendering component rather than a hook, so a server
 * component (the blog post page) can mount it without becoming a client
 * component itself.
 *
 * The homepage keeps its own copy: its thresholds reset per vehicle lookup and
 * carry the VRM, which is a different measurement from "how far down an article
 * did this reader get". Merging them would mean one of the two lying.
 */

// Module scope: a fresh array literal per render would be a new dep every time.
const DEFAULT_THRESHOLDS = [25, 50, 75, 100];

export default function ScrollDepthTracker({
  path,
  thresholds = DEFAULT_THRESHOLDS,
}: {
  /** Page identity for the event — the blog page passes `/blog/<slug>`. */
  path: string;
  thresholds?: number[];
}) {
  // Join to a primitive so a caller passing an inline array doesn't re-arm the
  // observer on every render.
  const key = thresholds.join(",");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const marks = key.split(",").map(Number);
    const fired = new Set<number>();

    function check() {
      const doc = document.documentElement;
      // A page shorter than the viewport is 100% read the moment it loads;
      // guard the divide so that reports as 100 rather than NaN.
      const height = doc.scrollHeight || 0;
      if (height <= 0) return;
      const scrolled = window.scrollY + window.innerHeight;
      const pct = Math.round((scrolled / height) * 100);
      for (const t of marks) {
        if (pct >= t && !fired.has(t)) {
          fired.add(t);
          trackEvent("scroll_depth", { threshold_pct: t, path });
        }
      }
    }

    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        check();
      });
    }

    check(); // a short post may already be fully visible
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [path, key]);

  return null;
}
