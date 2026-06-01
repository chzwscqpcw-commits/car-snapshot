"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import BoltMark from "@/components/BoltMark";
import ScanBeamReveal from "@/components/ScanBeamReveal";
import { RegPlate } from "@/components/RegPlate";
import { calculateVed } from "@/lib/ved";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";

interface TaxResultProps {
  vrm: string;
  previewVehicle?: LookupVehicle;
}

interface LookupVehicle {
  registrationNumber: string;
  make?: string;
  model?: string;
  yearOfManufacture?: number;
  fuelType?: string;
  engineCapacity?: number;
  co2Emissions?: number;
  monthOfFirstRegistration?: string;
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
}

type FetchState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; vehicle: LookupVehicle };

const DAY_MS = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date): number {
  const start = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const end = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((end - start) / DAY_MS);
}

function formatLongDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface StatusVisual {
  label: string;
  tone: "good" | "warn" | "risk" | "info";
  helper: string;
}

function deriveStatus(v: LookupVehicle): StatusVisual {
  const raw = (v.taxStatus ?? "").toLowerCase();
  const due = v.taxDueDate ? new Date(v.taxDueDate) : null;
  const days = due ? daysBetween(new Date(), due) : null;

  if (raw.includes("sorn")) {
    return {
      label: "SORN",
      tone: "info",
      helper: "Declared off-road — cannot be driven on public roads.",
    };
  }
  if (raw.includes("untaxed") || raw.includes("not taxed")) {
    return {
      label: "Untaxed",
      tone: "risk",
      helper: "This vehicle is currently untaxed. Taxing is required before driving.",
    };
  }
  if (raw.includes("taxed")) {
    if (days === null) {
      return { label: "Taxed", tone: "good", helper: "Tax is current." };
    }
    if (days < 0) {
      return {
        label: "Expired",
        tone: "risk",
        helper: `Tax expired ${Math.abs(days)} days ago. Risk of £80–£1,000 fine.`,
      };
    }
    if (days <= 14) {
      return {
        label: "Taxed",
        tone: "warn",
        helper: `Renews in ${days} day${days === 1 ? "" : "s"} — set a reminder.`,
      };
    }
    if (days <= 30) {
      return {
        label: "Taxed",
        tone: "warn",
        helper: `Renews in ${days} days — plenty of time, but don't forget.`,
      };
    }
    return {
      label: "Taxed",
      tone: "good",
      helper: `Valid for another ${days} days.`,
    };
  }
  return { label: v.taxStatus || "Unknown", tone: "info", helper: "" };
}

const TONE_CLASSES: Record<
  StatusVisual["tone"],
  { ring: string; badge: string; dot: string; chip: string }
> = {
  good: {
    ring: "border-emerald-500/40 from-emerald-900/30",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    chip: "text-emerald-300",
  },
  warn: {
    ring: "border-amber-500/40 from-amber-900/30",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
    chip: "text-amber-300",
  },
  risk: {
    ring: "border-rose-500/40 from-rose-900/30",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
    chip: "text-rose-300",
  },
  info: {
    ring: "border-slate-500/40 from-slate-800/40",
    badge: "bg-slate-700/40 text-slate-300 border-slate-600/40",
    dot: "bg-slate-400",
    chip: "text-slate-300",
  },
};

export default function TaxResult({ vrm, previewVehicle }: TaxResultProps) {
  const [state, setState] = useState<FetchState>({ kind: "loading" });

  useEffect(() => {
    if (previewVehicle) return; // preview mode skips the lookup
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
        if (!cancelled) setState({ kind: "ok", vehicle: v });
      })
      .catch((err: Error) => {
        if (!cancelled)
          setState({
            kind: "error",
            message: err.message || "Lookup failed — try again.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [vrm, previewVehicle]);

  if (previewVehicle) return <Loaded vehicle={previewVehicle} vrm={vrm} />;
  if (state.kind === "loading") {
    return <Skeleton vrm={vrm} />;
  }
  if (state.kind === "error") {
    return <ErrorState vrm={vrm} message={state.message} />;
  }
  return <Loaded vehicle={state.vehicle} vrm={vrm} />;
}

function Skeleton({ vrm }: { vrm: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-12">
      <VehiclePill reg={vrm} />
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 animate-pulse">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
          <span className="text-sm text-slate-400">Reading DVLA & MOT records…</span>
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

function ErrorState({ vrm, message }: { vrm: string; message: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-12">
      <VehiclePill reg={vrm} />
      <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-rose-200">
              Couldn&#39;t pull this tax check
            </h2>
            <p className="mt-1 text-sm text-rose-200/80">{message}</p>
            <a
              href="/tax-check"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-rose-300 hover:text-rose-200"
            >
              ← Try a different registration
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Loaded({ vehicle, vrm }: { vehicle: LookupVehicle; vrm: string }) {
  const status = useMemo(() => deriveStatus(vehicle), [vehicle]);
  const tone = TONE_CLASSES[status.tone];
  const ved = useMemo(
    () =>
      calculateVed({
        co2Emissions: vehicle.co2Emissions,
        engineCapacity: vehicle.engineCapacity,
        fuelType: vehicle.fuelType,
        monthOfFirstRegistration: vehicle.monthOfFirstRegistration,
      }),
    [vehicle]
  );

  // Days until MOT expiry — drives contextual BMG hook
  const motDays = useMemo(() => {
    if (!vehicle.motExpiryDate) return null;
    const d = new Date(vehicle.motExpiryDate);
    if (Number.isNaN(d.getTime())) return null;
    return daysBetween(new Date(), d);
  }, [vehicle.motExpiryDate]);

  const taxDays = useMemo(() => {
    if (!vehicle.taxDueDate) return null;
    const d = new Date(vehicle.taxDueDate);
    if (Number.isNaN(d.getTime())) return null;
    return daysBetween(new Date(), d);
  }, [vehicle.taxDueDate]);

  const motDueSoon = motDays !== null && motDays <= 60;

  const bmgLink = PARTNER_LINKS.bookMyGarage.buildLink?.(vrm, "tax-result-bmg-hook") ?? PARTNER_LINKS.bookMyGarage.url;
  const bmgRel = getPartnerRel(PARTNER_LINKS.bookMyGarage);

  const vehicleLabel = [
    vehicle.yearOfManufacture,
    vehicle.make,
    vehicle.model,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-10 sm:pt-8 sm:pb-14">
      <VehiclePill reg={vehicle.registrationNumber || vrm} label={vehicleLabel} />

      {/* Status hero */}
      <section
        className={`relative mt-4 overflow-hidden rounded-2xl border bg-gradient-to-br ${tone.ring} to-slate-950 p-6 sm:p-8`}
      >
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-30 pointer-events-none [background:radial-gradient(circle,rgba(34,211,238,0.4),transparent_70%)]" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Tax status</span>
              <span className="text-slate-700">·</span>
              <span className="font-mono text-slate-400">DVLA live</span>
              <span className={`h-1 w-1 rounded-full ${tone.dot} animate-pulse`} />
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border rounded-full ${tone.badge}`}
              >
                {status.label}
              </span>
              {taxDays !== null && taxDays >= 0 && (
                <span className={`text-sm ${tone.chip}`}>
                  {taxDays === 0
                    ? "Expires today"
                    : `${taxDays} day${taxDays === 1 ? "" : "s"} remaining`}
                </span>
              )}
            </div>
            <p className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {vehicle.taxDueDate
                ? `Expires ${formatLongDate(vehicle.taxDueDate)}`
                : status.label}
            </p>
            {status.helper && (
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {status.helper}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* VED rate breakdown */}
      {ved.estimatedAnnualRate !== null && (
        <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-100">Annual VED rate</h3>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Estimated · 2025/26 rates
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <RateTile label="Band" value={ved.band ?? "—"} />
            <RateTile
              label="12 month"
              value={
                ved.estimatedAnnualRate != null
                  ? `£${ved.estimatedAnnualRate.toLocaleString("en-GB")}`
                  : "—"
              }
              accent
            />
            <RateTile
              label="6 month"
              value={
                ved.estimatedSixMonthRate != null
                  ? `£${ved.estimatedSixMonthRate.toLocaleString("en-GB")}`
                  : "—"
              }
            />
          </div>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            {ved.details}
          </p>
        </section>
      )}

      {/* Year-by-year VED forecast */}
      {ved.estimatedAnnualRate !== null && (
        <VedForecastCard
          currentRate={ved.estimatedAnnualRate}
          registrationYear={
            vehicle.monthOfFirstRegistration
              ? Number(vehicle.monthOfFirstRegistration.split("-")[0])
              : vehicle.yearOfManufacture ?? null
          }
          isPostApril2017={ved.rateType === "post-2017"}
        />
      )}

      {/* Contextual BMG hook — only when MOT is also due soon */}
      {motDueSoon && (
        <section className="mt-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900/70 to-slate-900 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 flex-shrink-0 text-cyan-300 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-white">
                MOT due in {motDays} day{motDays === 1 ? "" : "s"} too
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Tax renewal and MOT often overlap — book the MOT now to keep both
                tied to the same date. Compare local garages with your reg pre-loaded.
              </p>
              <a
                href={bmgLink}
                target="_blank"
                rel={bmgRel}
                onClick={() => trackPartnerClick("bookMyGarage", "tax-result-bmg-hook")}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition-colors"
              >
                Compare MOT prices for {vrm} →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Reveal CTA */}
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
            MOT history, recalls, ULEZ, valuation, running costs, owner negotiation
            helpers — every piece of data we hold, on one page.
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

      {/* Quick checks rail */}
      <section className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Or run a different check on {vrm}
        </p>
        <div className="flex flex-wrap gap-2">
          <QuickPill href={`/mot-check?vrm=${vrm}`} icon={CheckCircle2}>
            MOT history
          </QuickPill>
          <QuickPill href={`/mileage-check?vrm=${vrm}`} icon={Calendar}>
            Mileage
          </QuickPill>
          <QuickPill href={`/ulez-check?vrm=${vrm}`} icon={CheckCircle2}>
            ULEZ
          </QuickPill>
          <QuickPill href={`/recall-check?vrm=${vrm}`} icon={AlertTriangle}>
            Recalls
          </QuickPill>
          <QuickPill href={`/car-valuation?vrm=${vrm}`} icon={CheckCircle2}>
            Valuation
          </QuickPill>
        </div>
      </section>
    </div>
  );
}

/**
 * Five-year VED forecast. Most cars roll the same standard rate each
 * year, so the chart looks flat — but it answers the question users
 * actually ask ("what am I going to pay over the next five years?")
 * with a single number rendered as bars, a total at the bottom, and
 * an honest disclaimer about budget-driven rate changes.
 *
 * Special handling for post-2017 vehicles where the year-2-to-year-6
 * window may have included the £40k "expensive car supplement". We
 * don't have list-price data so can't apply the supplement directly,
 * but we surface a note explaining the supplement when relevant
 * (i.e. when the vehicle's reg year places years 2-6 partly in the
 * forecast window).
 */
function VedForecastCard({
  currentRate,
  registrationYear,
  isPostApril2017,
}: {
  currentRate: number;
  registrationYear: number | null;
  isPostApril2017: boolean;
}) {
  const thisYear = new Date().getFullYear();
  const HORIZON = 5;
  const forecast = Array.from({ length: HORIZON }, (_, i) => ({
    year: thisYear + i,
    rate: currentRate,
  }));
  const total = forecast.reduce((s, r) => s + r.rate, 0);
  const maxRate = Math.max(...forecast.map((r) => r.rate));

  // Whether the £40k supplement window (years 2-6 of registration) overlaps
  // the forecast horizon. Shown as a contextual note, not applied.
  const supplementEndsYear =
    registrationYear !== null ? registrationYear + 6 : null;
  const supplementOverlaps =
    isPostApril2017 &&
    supplementEndsYear !== null &&
    supplementEndsYear >= thisYear;

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-slate-100">VED forecast</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Next {HORIZON} years
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Estimated annual road tax over the next {HORIZON} years at today&apos;s rate.
        Actual rates can change each Budget — typically rising 2-3% with inflation.
      </p>

      <div className="space-y-2">
        {forecast.map((row) => {
          const widthPct = Math.max(5, Math.round((row.rate / maxRate) * 100));
          return (
            <div
              key={row.year}
              className="grid grid-cols-[3rem_1fr_auto] items-center gap-2 sm:gap-3"
            >
              <span className="font-mono text-xs sm:text-sm text-slate-400 tabular-nums">
                {row.year}
              </span>
              <div className="relative h-6 sm:h-7 rounded-md bg-slate-800/60 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-cyan-500/80 to-blue-500/80 transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="font-mono text-xs sm:text-sm font-semibold text-slate-100 tabular-nums tracking-tight whitespace-nowrap">
                £{row.rate.toLocaleString("en-GB")}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {HORIZON}-year total
        </span>
        <span className="font-mono text-base sm:text-lg font-bold text-cyan-300 tabular-nums">
          £{total.toLocaleString("en-GB")}
        </span>
      </div>

      {supplementOverlaps && (
        <p className="mt-3 text-[11px] text-amber-300/80 leading-relaxed">
          Note: vehicles with a list price over £40,000 pay an additional ~£425/year
          supplement for years 2-6 of registration (
          {supplementEndsYear && supplementEndsYear >= thisYear
            ? `ends ${supplementEndsYear}`
            : "already ended"}
          ). We don&apos;t have list-price data so this isn&apos;t included in the
          totals above — add it manually if your car had a list price over £40k.
        </p>
      )}
    </section>
  );
}

function VehiclePill({ reg, label }: { reg: string; label?: string }) {
  return (
    <div className="inline-flex items-center gap-3">
      <RegPlate reg={reg} size="sm" />
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </div>
  );
}

function RateTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        accent
          ? "border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/5"
          : "border-slate-800 bg-slate-950/60"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-1 text-base sm:text-lg font-semibold ${
          accent ? "text-cyan-300" : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function QuickPill({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof CheckCircle2;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors"
    >
      <Icon className="h-3 w-3 text-slate-500" />
      {children}
    </a>
  );
}
