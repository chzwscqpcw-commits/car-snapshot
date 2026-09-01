"use client";

import { useEffect, useRef, type RefObject } from "react";
import { trackEvent } from "@/lib/tracking";

/**
 * Fire a `partner_impression` once, when a placement is genuinely seen.
 *
 * "Seen" means 50% visible in the viewport — the same seen-not-just-mounted
 * standard the experiment framework holds exposure to (see the three-tier
 * attribution note in `tracking.ts`), so an impression represents a real
 * chance to click rather than "rendered somewhere below the fold".
 *
 * Why this matters: without impressions we can only ever see clicks, which
 * makes "this placement never rendered" indistinguishable from "it rendered
 * ten thousand times and nobody clicked". Those two have opposite fixes.
 * The Warrantywise and ClickMechanic placements sat in exactly that blind
 * spot — mounted on 14 and 5 surfaces respectively, with single-digit clicks
 * a month and no way to tell which failure it was.
 *
 * The event writes `click_context` (not `impression_context`) on purpose:
 * it's the same key `partner_click` uses, so clicks and impressions group and
 * join on one field with no special-casing downstream.
 *
 * @param partnerId  Partner key from PARTNER_LINKS (e.g. "warrantywise").
 * @param context    Placement tag — must match the `click_context` the same
 *                   callsite passes to `trackPartnerClick`, or the two series
 *                   won't join.
 * @param enabled    Set false to suppress (preview//demo pages, or while the
 *                   partner is unconfigured) so our own review traffic never
 *                   pollutes the denominator.
 * @param extra      Optional extra metadata merged into the event payload.
 * @returns          Ref to attach to the placement's outermost element.
 */
export function usePartnerImpression<T extends HTMLElement = HTMLDivElement>(
  partnerId: string,
  context: string,
  enabled = true,
  extra?: Record<string, unknown>,
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const seenRef = useRef(false);

  // `extra` is typically an inline object literal, so it's a fresh reference
  // every render. Hold it in a ref and keep it out of the dep array — its
  // contents are read once, at the moment the impression fires. Synced in an
  // effect rather than during render (refs must not be written while
  // rendering); the observer fires after paint, so the ref is always current
  // by the time it's read.
  const extraRef = useRef(extra);
  useEffect(() => {
    extraRef.current = extra;
  });

  useEffect(() => {
    if (!enabled || seenRef.current) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seenRef.current) {
            seenRef.current = true;
            trackEvent("partner_impression", {
              partner_id: partnerId,
              click_context: context,
              ...extraRef.current,
            });
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [enabled, partnerId, context]);

  return ref;
}
