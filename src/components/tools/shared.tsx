"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Receipt,
  ShieldCheck,
  Gauge,
  Wind,
  PoundSterling,
  ArrowRight,
} from "lucide-react";
import BoltMark from "@/components/BoltMark";
import ScanBeamReveal from "@/components/ScanBeamReveal";
import { trackEvent } from "@/lib/tracking";

/* ─── Types ───────────────────────────────────────────────────────────── */

export interface LookupVehicle {
  registrationNumber: string;
  make?: string;
  model?: string;
  yearOfManufacture?: number;
  fuelType?: string;
  engineCapacity?: number;
  co2Emissions?: number;
  monthOfFirstRegistration?: string;
  euroStatus?: string;
  colour?: string;
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
  motTests?: MotTest[];
  /** Any other fields the lookup returns — opaque pass-through. */
  [key: string]: unknown;
}

export interface MotTest {
  completedDate: string;
  testResult: "PASSED" | "FAILED" | "NO DETAILS HELD";
  expiryDate?: string;
  odometer?: { value: number; unit: string };
  motTestNumber?: string;
  rfrAndComments?: Array<{ text: string; type: "COMMENT" | "DEFECT" | "ADVISORY" }>;
}

export type LookupState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; vehicle: LookupVehicle };

/* ─── Hook ───────────────────────────────────────────────────────────── */

export function useVehicleLookup(vrm: string): LookupState {
  const [state, setState] = useState<LookupState>({ kind: "loading" });

  useEffect(() => {
    // Skip the fetch when called with an empty vrm — used by the preview
    // routes that inject a fixture vehicle directly and don't need to hit
    // /api/lookup. State stays at "loading" but callers short-circuit
    // before rendering it.
    if (!vrm) return;
    let cancelled = false;
    setState({ kind: "loading" });
    fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vrm }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => null);
          throw new Error(
            body?.error || "Couldn't find that registration — double-check and try again."
          );
        }
        const payload = await r.json();
        const v = payload?.data as LookupVehicle | undefined;
        if (!v) throw new Error("No data returned for that registration.");
        return v;
      })
      .then((v) => {
        if (cancelled) return;
        setState({ kind: "ok", vehicle: v });
        trackEvent("results_view", {
          flow: "tool",
          make: v.make ?? null,
          mot_status: v.motStatus ?? null,
          fuel_type: v.fuelType ?? null,
          year_of_manufacture: v.yearOfManufacture ?? null,
          tax_status: v.taxStatus ?? null,
          euro_status: v.euroStatus ?? null,
          has_mot_expiry: !!v.motExpiryDate,
        });
      })
      .catch((err: Error) => {
        if (!cancelled)
          setState({ kind: "error", message: err.message || "Lookup failed — try again." });
      });
    return () => {
      cancelled = true;
    };
  }, [vrm]);

  return state;
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

export const DAY_MS = 1000 * 60 * 60 * 24;

export function daysBetween(a: Date, b: Date): number {
  const start = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const end = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((end - start) / DAY_MS);
}

export function formatLongDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function vehicleLabel(v: LookupVehicle): string {
  return [v.yearOfManufacture, v.make, v.model].filter(Boolean).join(" ");
}

/* ─── Shared building blocks ─────────────────────────────────────────── */

export function VehiclePill({ reg, label }: { reg: string; label?: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/60 pl-1 pr-4 py-1">
      <span className="rounded-full bg-amber-400 px-3 py-1 font-mono text-sm font-bold tracking-wider text-slate-900 shadow-inner">
        {reg}
      </span>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </div>
  );
}

export function LookupSkeleton({
  vrm,
  hint = "Reading DVLA & MOT records…",
}: {
  vrm: string;
  hint?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-12">
      <VehiclePill reg={vrm} />
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 animate-pulse">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
          <span className="text-sm text-slate-400">{hint}</span>
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-3 w-32 rounded bg-slate-800" />
          <div className="h-10 w-64 rounded bg-slate-800" />
          <div className="h-3 w-48 rounded bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

export function LookupError({
  vrm,
  message,
  backHref = "/tools",
}: {
  vrm: string;
  message: string;
  backHref?: string;
}) {
  const router = useRouter();
  const pathname = usePathname() || backHref;
  const [retryReg, setRetryReg] = useState("");
  const [retrySubmitting, setRetrySubmitting] = useState(false);
  const [retryError, setRetryError] = useState("");

  async function handleRetry(e?: React.FormEvent) {
    e?.preventDefault();
    const cleaned = retryReg.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (cleaned.length < 2 || cleaned.length > 8) {
      setRetryError("That doesn’t look like a valid UK reg.");
      return;
    }
    setRetryError("");
    setRetrySubmitting(true);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm: cleaned }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setRetryError(
          (body && (body.error || body.message)) ||
            "Still couldn’t find that — double-check the reg."
        );
        return;
      }
      router.push(`${pathname}?vrm=${cleaned}`);
    } catch {
      setRetryError("Couldn’t reach the lookup — check your connection.");
    } finally {
      setRetrySubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-12">
      <VehiclePill reg={vrm} />
      <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-rose-200">
              Couldn't pull this check
            </h2>
            <p className="mt-1 text-sm text-rose-200/80">{message}</p>
          </div>
        </div>

        <form onSubmit={handleRetry} className="mt-2" noValidate>
          <label
            htmlFor="retry-reg"
            className="block text-[11px] font-semibold uppercase tracking-wider text-rose-300/80 mb-1.5"
          >
            Try a different registration
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              id="retry-reg"
              type="text"
              value={retryReg}
              onChange={(e) => {
                setRetryReg(e.target.value.toUpperCase());
                setRetryError("");
              }}
              placeholder="e.g. AB12 CDE"
              maxLength={10}
              disabled={retrySubmitting}
              autoCapitalize="characters"
              spellCheck={false}
              className="h-11 flex-1 rounded-lg border border-rose-500/30 bg-slate-950/60 px-3 font-[family-name:var(--font-geist-mono)] text-sm tracking-widest text-white uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={retrySubmitting}
              className="h-11 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-5 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition-all disabled:opacity-70 disabled:cursor-progress"
            >
              {retrySubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking…
                </>
              ) : (
                <>
                  Check
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
          {retryError && (
            <p className="mt-2 text-xs text-rose-300">{retryError}</p>
          )}
        </form>

        <div className="mt-4 pt-3 border-t border-rose-500/20 text-xs text-rose-300/80">
          <a
            href={backHref}
            className="inline-flex items-center gap-1 hover:text-rose-200 transition-colors"
          >
            ← Or browse all tools
          </a>
        </div>
      </div>
    </div>
  );
}

export function RevealCTA({
  vrm,
  pitch = "MOT history, recalls, ULEZ, valuation, running costs, owner negotiation helpers — every piece of data we hold, on one page.",
}: {
  vrm: string;
  pitch?: string;
}) {
  return (
    <section className="mt-6 sm:mt-8 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 p-6 sm:p-8 text-center relative overflow-hidden">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full blur-3xl bg-cyan-500/10 pointer-events-none" />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-[11px] font-medium text-cyan-300 mb-3">
          <BoltMark className="h-3 w-3" />
          Want everything?
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Pull the full DVLA report for {vrm}
        </h3>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          {pitch}
        </p>
        <div className="mt-5 flex justify-center">
          <ScanBeamReveal
            vrm={vrm}
            destination="/"
            label={`Pull full report for ${vrm}`}
            subLabel="≈12 sections · free · no signup"
          />
        </div>
      </div>
    </section>
  );
}

interface QuickPillDef {
  href: (vrm: string) => string;
  label: string;
  icon: typeof CheckCircle2;
}

const ALL_PILLS: Record<string, QuickPillDef> = {
  mot: { href: (v) => `/mot-check?vrm=${v}`, label: "MOT history", icon: ShieldCheck },
  tax: { href: (v) => `/tax-check?vrm=${v}`, label: "Tax", icon: Receipt },
  mileage: { href: (v) => `/mileage-check?vrm=${v}`, label: "Mileage", icon: Gauge },
  ulez: { href: (v) => `/ulez-check?vrm=${v}`, label: "ULEZ", icon: Wind },
  recall: { href: (v) => `/recall-check?vrm=${v}`, label: "Recalls", icon: AlertTriangle },
  valuation: {
    href: (v) => `/car-valuation?vrm=${v}`,
    label: "Valuation",
    icon: PoundSterling,
  },
};

export function QuickPillRail({
  vrm,
  exclude = [],
}: {
  vrm: string;
  exclude?: string[];
}) {
  const order = ["mot", "tax", "mileage", "ulez", "recall", "valuation"].filter(
    (k) => !exclude.includes(k)
  );
  return (
    <section className="mt-6">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Or run a different check on {vrm}
      </p>
      <div className="flex flex-wrap gap-2">
        {order.map((k) => {
          const p = ALL_PILLS[k];
          if (!p) return null;
          const Icon = p.icon;
          return (
            <a
              key={k}
              href={p.href(vrm)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors"
            >
              <Icon className="h-3 w-3 text-slate-500" />
              {p.label}
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* ─── ToolResultLayout ────────────────────────────────────────────────
 * Composes the standard sequence: vehicle pill → children → reveal CTA →
 * quick pill rail. Each tool only writes the bits in the middle that are
 * specific to its visual personality.
 * ──────────────────────────────────────────────────────────────────── */

export function ToolResultLayout({
  vrm,
  vehicle,
  children,
  excludePill,
  revealPitch,
}: {
  vrm: string;
  vehicle: LookupVehicle;
  children: ReactNode;
  /** Which quick-pill to exclude (i.e. the current tool). */
  excludePill: string;
  /** Custom reveal-CTA copy. */
  revealPitch?: string;
}) {
  const displayReg = vehicle.registrationNumber || vrm;
  const label = vehicleLabel(vehicle);
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-10 sm:pt-8 sm:pb-14">
      <VehiclePill reg={displayReg} label={label} />
      {children}
      <RevealCTA vrm={displayReg} pitch={revealPitch} />
      <QuickPillRail vrm={displayReg} exclude={[excludePill]} />
    </div>
  );
}
