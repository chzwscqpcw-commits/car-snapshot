"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { trackConversion } from "@/lib/tracking";

/**
 * Hero reg box — places the reg lookup in the page hero (above the fold) rather
 * than a scroll away. This is the graduated winner of the `valuation_hero_reg_v1`
 * A/B test (reg_search conversion 39.0% → 52.8%, +35% relative, z=4.74), now the
 * shared pattern across every tool landing page.
 *
 * Pre-flights the DVLA lookup before navigating, so a bad reg shows an inline
 * error instead of landing on a broken result page. On success it pushes to
 * `targetPath?vrm=…` (the tool's own result view) and fires `reg_search` with
 * `source:"hero"` so hero searches are distinguishable from the widget below.
 */

interface HeroRegSearchProps {
  /** Where a successful lookup navigates — the tool's own path (e.g. /tax-check)
   *  so the result stays in that tool, or "/" for the full report. */
  targetPath?: string;
  /** Submit-button label — match the tool's intent (e.g. "Check tax status"). */
  ctaLabel?: string;
  /** Optional extra classes on the root (e.g. margin overrides). */
  className?: string;
}

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}
function isValidReg(reg: string): boolean {
  const cleaned = cleanReg(reg);
  return cleaned.length >= 2 && cleaned.length <= 8;
}

export default function HeroRegSearch({
  targetPath = "/",
  ctaLabel = "Check this car free",
  className = "",
}: HeroRegSearchProps) {
  const router = useRouter();
  const [reg, setReg] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      // source:"hero" distinguishes hero-box searches from the widget below.
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
    <div
      className={`mt-5 rounded-xl border border-blue-700/50 bg-slate-900/50 p-3 sm:p-4 sm:max-w-xl ${className}`}
    >
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
              {ctaLabel}
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
  );
}
