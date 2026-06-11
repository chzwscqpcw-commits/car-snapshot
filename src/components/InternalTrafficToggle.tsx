"use client";

import { useEffect, useState } from "react";
import { EyeOff, Eye } from "lucide-react";
import { isInternalTraffic, setInternalTraffic } from "@/lib/tracking";

/**
 * Owner self-exclusion control for the admin dashboard. Reflects and toggles the
 * device-local `fpc:internal_traffic` flag — when on, this browser's events
 * carry `internal: true` and are filtered out of the stats route + experiments.
 * Per-device (localStorage), so set it on every browser you test from. The
 * `?internal=1` / `?internal=0` URL param does the same thing (handy on mobile).
 */
export default function InternalTrafficToggle() {
  const [excluded, setExcluded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // localStorage is client-only, so read after mount (and avoid an SSR/CSR
    // mismatch by rendering nothing until then).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setExcluded(isInternalTraffic());
  }, []);

  function toggle() {
    const next = !excluded;
    setInternalTraffic(next);
    setExcluded(next);
  }

  if (!mounted) return null;

  return (
    <div
      className={`mb-5 flex items-center justify-between gap-3 rounded-xl border p-3 sm:p-4 ${
        excluded
          ? "border-emerald-800/50 bg-emerald-950/30"
          : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {excluded ? (
          <EyeOff className="h-4 w-4 shrink-0 text-emerald-400" />
        ) : (
          <Eye className="h-4 w-4 shrink-0 text-slate-500" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-100">
            {excluded
              ? "This device is excluded from stats"
              : "This device is counted in stats"}
          </p>
          <p className="text-xs text-slate-500">
            {excluded
              ? "Your clicks, searches & page views won't pollute the dashboard or experiments."
              : "Turn on before testing so your own activity doesn't skew the numbers."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          excluded
            ? "border border-slate-600/70 bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            : "bg-emerald-600 text-white hover:bg-emerald-500"
        }`}
      >
        {excluded ? "Count me again" : "Exclude my traffic"}
      </button>
    </div>
  );
}
