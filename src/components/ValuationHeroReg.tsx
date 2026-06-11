"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import MobileSearchCue from "@/components/MobileSearchCue";
import {
  EXPERIMENTS,
  assignExperimentVariant,
  trackExperimentImpression,
  trackConversion,
} from "@/lib/tracking";

/**
 * A/B test `valuation_hero_reg_v1` on the /car-valuation hero.
 *
 *  - Variant "a" (control): today's layout — the hero pitches and the
 *    mobile-only {@link MobileSearchCue} points down to the reg box in the
 *    ConversionWidget below. Nothing changes for control visitors.
 *  - Variant "b" (treatment): a reg box rendered in the hero itself, above the
 *    fold, so the action sits with the pitch instead of a scroll away.
 *
 * Exposure (tier 2 of the attribution model) is recorded the moment the hero
 * slot is actually seen, via an IntersectionObserver on an always-present 1px
 * marker — so it fires identically for both variants and on every viewport,
 * even where the control's MobileSearchCue is `lg:hidden`. Conversions
 * (`reg_search`) then auto-attribute to the exposed variant. The treatment box
 * and the ConversionWidget below both fire `reg_search`, so the test measures
 * the net lift in exposed sessions that start a valuation.
 */

const EXP_ID = EXPERIMENTS.VALUATION_HERO_REG;
const VARIANTS = ["a", "b"];

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}
function isValidReg(reg: string): boolean {
  const cleaned = cleanReg(reg);
  return cleaned.length >= 2 && cleaned.length <= 8;
}

export default function ValuationHeroReg({
  targetPath = "/car-valuation",
}: {
  targetPath?: string;
}) {
  const router = useRouter();
  const [variant, setVariant] = useState<string | null>(null);
  const [reg, setReg] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const markerRef = useRef<HTMLDivElement>(null);
  const exposedRef = useRef(false);

  // Assign the sticky variant on the client (localStorage-backed). Reading
  // client-only storage on mount is exactly the external-state-sync case the
  // rule exempts; the cascading render is one-shot and intended.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVariant(assignExperimentVariant(EXP_ID, VARIANTS));
  }, []);

  // Record exposure when the hero slot is genuinely on screen.
  useEffect(() => {
    if (!variant || !markerRef.current || exposedRef.current) return;
    const el = markerRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !exposedRef.current) {
            exposedRef.current = true;
            trackExperimentImpression(EXP_ID, variant);
            io.disconnect();
          }
        }
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [variant]);

  async function handleLookup() {
    const cleaned = cleanReg(reg);
    if (!cleaned) {
      setError("Please enter a registration number");
      return;
    }
    if (!isValidReg(reg)) {
      setError("That doesn’t look like a valid UK registration");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm: cleaned }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(
          (body && (body.error || body.message)) ||
            (res.status === 404
              ? "We couldn’t find that registration — double-check and try again."
              : "Lookup failed — please try again in a moment.")
        );
        setSubmitting(false);
        return;
      }
      // reg_search auto-attaches exp_valuation_hero_reg_v1 for exposed sessions.
      // source:"hero" distinguishes treatment-box searches from the widget below.
      trackConversion("reg_search", {
        vrm: cleaned,
        flow: "tool",
        target_path: targetPath,
        source: "hero",
      });
      const join = targetPath.includes("?") ? "&" : "?";
      router.push(`${targetPath}${join}vrm=${cleaned}`);
    } catch {
      setError(
        "Couldn’t reach the lookup service — check your connection and try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Always-present marker so exposure fires for both variants on every
          viewport (control's cue is mobile-only). */}
      <div ref={markerRef} aria-hidden className="h-px w-full" />

      {variant === "b" ? (
        <div className="mt-5 rounded-xl border border-blue-700/50 bg-slate-900/50 p-3 sm:p-4 sm:max-w-xl">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={reg}
                onChange={(e) => {
                  setReg(e.target.value.toUpperCase());
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLookup();
                }}
                placeholder="Enter reg, e.g. AB12 CDE"
                maxLength={10}
                aria-label="Vehicle registration"
                className="h-12 w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 font-mono text-base uppercase tracking-widest text-white transition-all placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={submitting}
              className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-cyan-600 active:scale-95 disabled:cursor-progress disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking&hellip;
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Value my car free
                </>
              )}
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Free &amp; instant &mdash; no email, no signup
            </p>
          )}
        </div>
      ) : (
        <MobileSearchCue />
      )}
    </>
  );
}
