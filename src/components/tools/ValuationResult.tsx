"use client";

import { useMemo } from "react";
import { PoundSterling, TrendingDown, Sparkles, ArrowRight, Info } from "lucide-react";
import {
  useVehicleLookup,
  LookupSkeleton,
  LookupError,
  ToolResultLayout,
  type LookupVehicle,
} from "@/components/tools/shared";
import {
  lookupNewPrice,
  calculateDepreciationBaseline,
  roundTo50,
} from "@/lib/valuation";
import newPricesData from "@/data/new-prices.json";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";

interface ValuationResultProps {
  vrm: string;
}

interface FocusedValuation {
  newPrice: number | null;
  centre: number | null;
  low: number | null;
  high: number | null;
  age: number | null;
  depreciationPct: number | null;
  mileage: number | null;
  confidence: "estimate-only";
}

export default function ValuationResult({ vrm }: ValuationResultProps) {
  const state = useVehicleLookup(vrm);
  if (state.kind === "loading")
    return <LookupSkeleton vrm={vrm} hint="Running the valuation model…" />;
  if (state.kind === "error")
    return <LookupError vrm={vrm} message={state.message} backHref="/car-valuation" />;
  return <Loaded vrm={vrm} vehicle={state.vehicle} />;
}

function Loaded({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const valuation = useMemo(() => compute(vehicle), [vehicle]);
  return (
    <ToolResultLayout
      vrm={vrm}
      vehicle={vehicle}
      excludePill="valuation"
      revealPitch="The full report adds live eBay listings + community comparables for a tighter range, plus condition adjustment, owner negotiation helpers and the full DVLA report."
    >
      <Hero valuation={valuation} vehicle={vehicle} />
      {valuation.centre !== null && <DepreciationCard valuation={valuation} />}
      <BmgHook vrm={vrm} />
      <Disclaimer />
    </ToolResultLayout>
  );
}

function Hero({
  valuation,
  vehicle,
}: {
  valuation: FocusedValuation;
  vehicle: LookupVehicle;
}) {
  const hasValue = valuation.centre !== null;
  return (
    <section className="relative mt-4 overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-900/25 via-slate-900/80 to-slate-950 p-6 sm:p-8">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-30 pointer-events-none bg-cyan-500/40" />

      <div className="relative">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3 w-3 text-cyan-400" />
          Estimated market value
        </div>

        {hasValue ? (
          <>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight tabular-nums">
                £{valuation.centre!.toLocaleString("en-GB")}
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Typical range:{" "}
              <span className="text-slate-200 font-semibold tabular-nums">
                £{valuation.low!.toLocaleString("en-GB")}
              </span>
              {" – "}
              <span className="text-slate-200 font-semibold tabular-nums">
                £{valuation.high!.toLocaleString("en-GB")}
              </span>
            </p>

            {/* Range bar */}
            <div className="mt-4">
              <RangeBar low={valuation.low!} centre={valuation.centre!} high={valuation.high!} />
            </div>
          </>
        ) : (
          <p className="mt-2 text-xl text-slate-300">
            We couldn't price this vehicle from depreciation alone — the full report pulls
            live eBay comparables for a real number.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <Chip>{vehicle.make ?? "—"} {vehicle.model ?? ""}</Chip>
          {vehicle.yearOfManufacture && <Chip>{vehicle.yearOfManufacture}</Chip>}
          {vehicle.fuelType && <Chip>{vehicle.fuelType}</Chip>}
        </div>
      </div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300">
      {children}
    </span>
  );
}

function RangeBar({
  low,
  centre,
  high,
}: {
  low: number;
  centre: number;
  high: number;
}) {
  const range = high - low || 1;
  const pos = ((centre - low) / range) * 100;
  return (
    <div className="relative">
      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-cyan-500/20 via-cyan-400/40 to-cyan-500/20" />
      </div>
      <div
        className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
        style={{ left: `${pos}%` }}
      >
        <span className="h-3 w-3 -mt-[3px] rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.7)]" />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500 tabular-nums">
        <span>£{low.toLocaleString("en-GB")}</span>
        <span>£{high.toLocaleString("en-GB")}</span>
      </div>
    </div>
  );
}

function DepreciationCard({ valuation }: { valuation: FocusedValuation }) {
  const dep = valuation.depreciationPct !== null ? Math.round(valuation.depreciationPct) : null;
  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-slate-100">How the number breaks down</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Depreciation model
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
        <Stat
          label="New price"
          value={
            valuation.newPrice !== null
              ? `£${valuation.newPrice.toLocaleString("en-GB")}`
              : "—"
          }
        />
        <Stat
          label="Age"
          value={valuation.age !== null ? `${valuation.age} yr${valuation.age === 1 ? "" : "s"}` : "—"}
        />
        <Stat
          label="Depreciated"
          value={dep !== null ? `${dep}%` : "—"}
          tone="cyan"
        />
      </div>
      {valuation.depreciationPct !== null && valuation.depreciationPct > 20 && (
        <div className="mt-3 flex items-start gap-2 text-xs text-slate-400">
          <TrendingDown className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <p>
            Most depreciation has already happened — buying or holding now usually means
            slower future loss-of-value.
          </p>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "cyan";
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        tone === "cyan"
          ? "border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/5"
          : "border-slate-800 bg-slate-950/60"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-1 text-base sm:text-lg font-semibold ${
          tone === "cyan" ? "text-cyan-300" : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BmgHook({ vrm }: { vrm: string }) {
  const href =
    PARTNER_LINKS.bookMyGarageService.buildLink?.(vrm) ??
    PARTNER_LINKS.bookMyGarageService.url;
  const rel = getPartnerRel(PARTNER_LINKS.bookMyGarageService);
  return (
    <section className="mt-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900/70 to-slate-900 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <PoundSterling className="h-5 w-5 flex-shrink-0 text-cyan-300 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">
            Service before selling — boosts your asking price
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            A fresh service stamp and a current MOT typically add £150–£500 to a private
            sale. Compare local servicing prices for {vrm} with your reg pre-loaded.
          </p>
          <a
            href={href}
            target="_blank"
            rel={rel}
            onClick={() => trackPartnerClick("bookMyGarageService", "valuation-result-bmg-hook")}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition-colors"
          >
            Compare service prices for {vrm}
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
      <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
      <p>
        Depreciation-only estimate. The full report adds live eBay comparables + cached
        community valuations, condition adjustment, and a confidence rating that
        tightens this range significantly.
      </p>
    </div>
  );
}

const NEW_PRICES = newPricesData as Array<{ make: string; model: string; newPrice: number }>;
const RANGE_FRACTION = 0.25; // ±25% for depreciation-only confidence

function compute(vehicle: LookupVehicle): FocusedValuation {
  const newPrice = lookupNewPrice(NEW_PRICES, vehicle.make, vehicle.model);
  const age =
    vehicle.yearOfManufacture !== undefined
      ? Math.max(0, new Date().getFullYear() - vehicle.yearOfManufacture)
      : null;

  // Latest mileage from MOT tests if available
  let mileage: number | null = null;
  if (vehicle.motTests && vehicle.motTests.length > 0) {
    const sorted = [...vehicle.motTests].sort(
      (a, b) =>
        new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
    );
    const latest = sorted.find((t) => t.odometer);
    if (latest?.odometer) {
      let miles = latest.odometer.value;
      if (latest.odometer.unit?.toUpperCase() === "KM") miles = Math.round(miles * 0.621371);
      mileage = miles;
    }
  }

  if (newPrice === null || age === null) {
    return {
      newPrice,
      centre: null,
      low: null,
      high: null,
      age,
      depreciationPct: null,
      mileage,
      confidence: "estimate-only",
    };
  }

  const centre = calculateDepreciationBaseline(
    newPrice,
    age,
    vehicle.make,
    vehicle.model,
    mileage
  );
  const low = roundTo50(centre * (1 - RANGE_FRACTION));
  const high = roundTo50(centre * (1 + RANGE_FRACTION));
  const depreciationPct = ((newPrice - centre) / newPrice) * 100;

  return {
    newPrice,
    centre,
    low,
    high,
    age,
    depreciationPct,
    mileage,
    confidence: "estimate-only",
  };
}
