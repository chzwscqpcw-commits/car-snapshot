"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import type { LookupVehicle } from "@/components/tools/shared";
import Button from "@/components/Button";

interface Props {
  initialVrm: string;
  onConfirm: (vrm: string, vehicle: LookupVehicle | null) => void;
}

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export default function Step1Vehicle({ initialVrm, onConfirm }: Props) {
  const [vrm, setVrm] = useState(initialVrm || "");
  const [vehicle, setVehicle] = useState<LookupVehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-look up if a vrm was provided at mount
  useEffect(() => {
    if (initialVrm) doLookup(initialVrm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setVehicle(null);
        return;
      }
      const payload = await res.json();
      const v = payload?.data as LookupVehicle | undefined;
      if (!v) {
        setError("No data returned for that registration.");
        setVehicle(null);
        return;
      }
      setVehicle(v);
      setVrm(cleaned);
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
          Enter the registration — we&apos;ll pull the make, model, and MOT history from DVLA.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          doLookup(vrm);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={vrm}
          onChange={(e) => setVrm(e.target.value.toUpperCase())}
          placeholder="e.g. AB12 CDE"
          maxLength={8}
          className="flex-1 h-12 rounded-lg border border-slate-700 bg-slate-900/80 px-4 font-mono text-lg tracking-[0.2em] text-white placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-sm focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <Button
          type="submit"
          disabled={loading || !vrm.trim()}
          size="lg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-red-300 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {vehicle && (
        <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-mono tracking-widest text-cyan-300">{vrm}</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-white truncate">
                {vehicle.make} {vehicle.model}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {vehicle.yearOfManufacture && `${vehicle.yearOfManufacture} · `}
                {vehicle.fuelType && `${vehicle.fuelType.toLowerCase()} · `}
                {vehicle.engineCapacity && `${vehicle.engineCapacity}cc`}
              </p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          </div>
          <button
            type="button"
            onClick={() => onConfirm(vrm, vehicle)}
            className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
          >
            Continue →
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onConfirm("", null)}
        className="block text-xs text-slate-500 hover:text-slate-400 transition-colors underline underline-offset-2"
      >
        Skip — I don&apos;t want to enter a registration
      </button>
    </div>
  );
}
