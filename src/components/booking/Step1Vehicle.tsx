"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import type { LookupVehicle } from "@/components/tools/shared";

interface Props {
  initialVrm: string;
  onConfirm: (vrm: string, vehicle: LookupVehicle | null) => void;
}

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export default function Step1Vehicle({ initialVrm, onConfirm }: Props) {
  const [vrm, setVrm] = useState(initialVrm || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-look up if a vrm was provided at mount.
  useEffect(() => {
    if (initialVrm) doLookup(initialVrm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * One motion: type the reg, submit, land on the service picker.
   *
   * This screen used to look the vehicle up, render a result card, and wait
   * for a second "Continue →" click. Two clicks after typing, on the step whose
   * entire job is the first interaction — and the funnel showed the cost:
   * `homepage_hero` lost 11 of its 12 sessions between step 1 and step 2, the
   * steepest drop anywhere in the wizard.
   *
   * A successful lookup now advances straight through. Nothing is lost by
   * doing so: the vehicle is echoed at the top of the next step with a "not
   * your car?" link back here, so a wrong plate is still one click to fix —
   * it just isn't a toll charged to everyone who typed the right one.
   */
  async function doLookup(reg: string) {
    const cleaned = cleanReg(reg);
    if (cleaned.length < 2) {
      setError("Please enter a valid UK registration");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm: cleaned }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't find that registration — please check and try again.");
        return;
      }
      const payload = await res.json();
      const v = payload?.data as LookupVehicle | undefined;
      if (!v) {
        setError("No data returned for that registration.");
        return;
      }
      setVrm(cleaned);
      onConfirm(cleaned, v);
    } catch {
      setError("Couldn't reach the lookup service — check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Which vehicle?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter the registration — we&apos;ll pull the make, model and MOT history from DVLA,
          then show what a service costs for that exact car.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          doLookup(vrm);
        }}
        className="space-y-3"
      >
        {/* UK number plate. The blue GB band and the yellow field are the most
            recognisable object in this whole subject — the input may as well
            look like the thing the user is copying from. */}
        <div className="flex items-stretch overflow-hidden rounded-lg border-2 border-slate-950 shadow-lg shadow-black/40 focus-within:ring-2 focus-within:ring-cyan-400/70">
          <div className="flex w-9 shrink-0 flex-col items-center justify-end gap-1 bg-[#003399] pb-1.5 pt-2 sm:w-11">
            <span aria-hidden="true" className="text-[7px] leading-[1.15] text-yellow-300 sm:text-[8px]">
              ★★★
              <br />
              ★&nbsp;&nbsp;★
              <br />
              ★★★
            </span>
            <span className="text-[10px] font-bold tracking-wider text-white sm:text-xs">GB</span>
          </div>
          <input
            type="text"
            value={vrm}
            onChange={(e) => setVrm(e.target.value.toUpperCase())}
            placeholder="AB12 CDE"
            maxLength={8}
            aria-label="Vehicle registration"
            className="h-14 w-full bg-[#FFD400] px-3 text-center text-2xl font-extrabold tracking-[0.14em] text-slate-950 placeholder:font-bold placeholder:text-slate-950/35 focus:outline-none sm:h-16 sm:text-3xl"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !vrm.trim()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Looking up your vehicle…
            </>
          ) : (
            <>
              Show me prices
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => onConfirm("", null)}
        className="block text-xs text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-400"
      >
        Skip — I don&apos;t want to enter a registration
      </button>
    </div>
  );
}
