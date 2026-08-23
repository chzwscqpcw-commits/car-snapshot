"use client";

import { useEffect, useMemo, useState } from "react";
import { useScrollReveal } from "@/components/tools/useScrollReveal";
import {
  Calculator,
  Fuel,
  Receipt,
  TrendingDown,
  ShieldCheck,
  Umbrella,
  Loader2,
  Info,
  Gauge,
  ArrowLeftRight,
} from "lucide-react";
import {
  useVehicleLookup,
  LookupSkeleton,
  LookupError,
  ToolResultLayout,
  type LookupVehicle,
} from "@/components/tools/shared";
import { calculateVed } from "@/lib/ved";
import {
  calculateOwnershipCost,
  classifyVehicleSegment,
  type OwnershipCostResult,
  type VehicleSegment,
} from "@/lib/ownership-cost";
import { lookupNewPrice } from "@/lib/valuation";
import { lookupBodyType } from "@/lib/body-type";
import newPricesData from "@/data/new-prices.json";
import type { FuelEconomyResult } from "@/lib/fuel-economy";
import {
  estimateInsurance,
  type InsuranceInputs,
  type InsuranceEstimate,
  type AgeBand,
  type LocationBand,
  type NcdBand,
  type OccupationBand,
} from "@/lib/insurance-estimate";
import { useVehicleValuation } from "@/components/tools/useVehicleValuation";
import CarVerticalReportCTA from "@/components/CarVerticalReportCTA";
import WarrantyCTA from "@/components/WarrantyCTA";
import Button from "@/components/Button";

interface RunningCostsResultProps {
  vrm: string;
  previewVehicle?: LookupVehicle;
}

const NEW_PRICES = newPricesData as Array<{
  make: string;
  model: string;
  newPrice: number;
}>;

const UK_AVG_MILES_PER_YEAR = 7400; // DfT 2025

export default function RunningCostsResult({ vrm, previewVehicle }: RunningCostsResultProps) {
  const state = useVehicleLookup(previewVehicle ? "" : vrm);
  if (previewVehicle) return <Loaded vrm={vrm} vehicle={previewVehicle} />;
  if (state.kind === "loading")
    return <LookupSkeleton vrm={vrm} hint="Calculating fuel, tax and depreciation…" />;
  if (state.kind === "error")
    return <LookupError vrm={vrm} message={state.message} backHref="/running-costs" />;
  return <Loaded vrm={vrm} vehicle={state.vehicle} />;
}

function Loaded({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const [fuel, setFuel] = useState<FuelEconomyResult | null>(null);
  const [fuelState, setFuelState] = useState<"loading" | "done">("loading");
  const [milesPerYear, setMilesPerYear] = useState<number>(UK_AVG_MILES_PER_YEAR);
  const [insuranceInputs, setInsuranceInputs] = useState<InsuranceInputs>({});
  // Headline toggle: include insurance in the total or not (the report excludes
  // it — this lets users match either view). Defaults to included.
  const [includeInsurance, setIncludeInsurance] = useState(true);

  // Fetch fuel economy
  useEffect(() => {
    if (!vehicle.make || !vehicle.model) {
      // Early-exit state for the fuel-economy fetch this effect performs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFuelState("done");
      return;
    }
    let cancelled = false;
    setFuelState("loading");
    const params = new URLSearchParams({
      make: vehicle.make,
      model: vehicle.model,
    });
    if (vehicle.engineCapacity) params.set("engine", String(vehicle.engineCapacity));
    if (vehicle.fuelType) params.set("fuel", vehicle.fuelType);
    const body = lookupBodyType(vehicle.make, vehicle.model);
    if (body) params.set("bodyStyle", body);

    fetch(`/api/fuel-economy?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: FuelEconomyResult | null) => {
        if (!cancelled) {
          setFuel(data);
          setFuelState("done");
        }
      })
      .catch(() => {
        if (!cancelled) setFuelState("done");
      });
    return () => {
      cancelled = true;
    };
  }, [vehicle.make, vehicle.model, vehicle.engineCapacity, vehicle.fuelType]);

  // Compute everything
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

  const segment: VehicleSegment = useMemo(() => {
    const newPrice = lookupNewPrice(NEW_PRICES, vehicle.make, vehicle.model, vehicle.fuelType);
    return classifyVehicleSegment({
      fuelType: vehicle.fuelType,
      bodyType: lookupBodyType(vehicle.make, vehicle.model) ?? undefined,
      newPrice,
      engineCapacity: vehicle.engineCapacity,
    });
  }, [vehicle.fuelType, vehicle.engineCapacity, vehicle.make, vehicle.model]);

  // Fuel cost scales linearly with annual mileage. The /api/fuel-economy
  // endpoint returns a baseline at 7,400 mi/yr (DfT average); we scale it
  // to whatever the user has set on the slider.
  const scaledFuelCost = useMemo<number | null>(() => {
    if (fuel?.estimatedAnnualCost == null) return null;
    return Math.round(
      fuel.estimatedAnnualCost * (milesPerYear / UK_AVG_MILES_PER_YEAR)
    );
  }, [fuel, milesPerYear]);

  // Shared valuation pipeline — gives us the same blended estimate the report
  // and the valuation tool use, so the depreciation line anchors to it (instead
  // of the raw model) and matches across surfaces.
  const { estimatedValue: blendedValue } = useVehicleValuation(vehicle);

  const ownership = useMemo<OwnershipCostResult | null>(() => {
    if (!vehicle.yearOfManufacture) return null;
    const vehicleAge = new Date().getFullYear() - vehicle.yearOfManufacture;
    const isOver3Years = vehicleAge > 3;
    const newPrice = lookupNewPrice(NEW_PRICES, vehicle.make, vehicle.model, vehicle.fuelType);
    return calculateOwnershipCost({
      vedAnnualRate: ved.estimatedAnnualRate,
      fuelAnnualCost: scaledFuelCost,
      newPrice,
      vehicleAge,
      make: vehicle.make,
      model: vehicle.model,
      isOver3Years,
      segment,
      currentValue: blendedValue,
    });
  }, [vehicle, ved, scaledFuelCost, segment, blendedValue]);

  // Out of factory cover? Drives the warranty placement below — a car still
  // inside its 3-year manufacturer warranty would be buying duplicate cover.
  const outOfWarranty = useMemo(() => {
    if (!vehicle.yearOfManufacture) return false;
    return new Date().getFullYear() - vehicle.yearOfManufacture > 3;
  }, [vehicle.yearOfManufacture]);

  // Insurance (excluded by ownership-cost lib; we layer it on here)
  const insurance = useMemo<InsuranceEstimate>(
    () => estimateInsurance(segment, insuranceInputs, milesPerYear),
    [segment, insuranceInputs, milesPerYear]
  );

  // Headline + breakdown totals — insurance counted only when the toggle is on.
  // Uses the user's actual mileage for the per-mile/monthly/daily figures.
  const totals = useMemo(() => {
    if (!ownership) return null;
    const total = ownership.totalAnnual + (includeInsurance ? insurance.estimatedAnnual : 0);
    return {
      annual: total,
      monthly: Math.round(total / 12),
      daily: Math.round((total / 365) * 100) / 100,
      perMile: milesPerYear > 0 ? total / milesPerYear : 0,
    };
  }, [ownership, insurance.estimatedAnnual, includeInsurance, milesPerYear]);

  return (
    <ToolResultLayout
      vrm={vrm}
      vehicle={vehicle}
      excludePill="valuation"
      revealPitch="Running costs are just one slice — the full report adds MOT history, recalls, ULEZ, valuation and a buying checklist."
    >
      <Hero
        totals={totals}
        loading={fuelState === "loading"}
        fuel={fuel}
        milesPerYear={milesPerYear}
        insuranceIsCustomised={insurance.isCustomised}
        includeInsurance={includeInsurance}
        onToggleInsurance={() => setIncludeInsurance((v) => !v)}
      />
      <MileageSlider
        miles={milesPerYear}
        onChange={setMilesPerYear}
        hasFuelData={fuel?.estimatedAnnualCost != null}
      />
      {ownership && (
        <BreakdownGrid
          ownership={ownership}
          fuel={fuel}
          segment={segment}
          insurance={insurance}
          includeInsurance={includeInsurance}
          totalAnnual={totals?.annual ?? ownership.totalAnnual}
        />
      )}
      {ownership && (
        <StackedBar
          ownership={ownership}
          insurance={insurance}
          includeInsurance={includeInsurance}
          totalAnnual={totals?.annual ?? ownership.totalAnnual}
        />
      )}
      {ownership && vehicle.yearOfManufacture && (
        <CostForecastCard
          vehicle={vehicle}
          ved={ved}
          scaledFuelCost={scaledFuelCost}
          segment={segment}
          insurance={insurance}
        />
      )}
      <InsurancePanel
        inputs={insuranceInputs}
        setInputs={setInsuranceInputs}
        insurance={insurance}
      />
      {/* Running costs are a "should I buy this car?" signal — offer the full
          history check (finance/write-off/stolen/mileage) at that buyer intent. */}
      <CarVerticalReportCTA regNumber={vrm} variant="report" context="running-costs" />
      {/* Repairs are the one line this page forecasts least well — everything
          else here (fuel, tax, insurance, servicing) is modellable, a failed
          gearbox isn't. That gap is the honest case for a warranty, so the
          placement sits directly under the forecast it qualifies. */}
      {outOfWarranty && (
        <div className="mt-4">
          <WarrantyCTA
            layout="inline"
            variant="runningCosts"
            context="running-costs-warranty"
            regNumber={vrm}
          />
        </div>
      )}
      <Disclaimer />
    </ToolResultLayout>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */

function Hero({
  totals,
  loading,
  fuel,
  milesPerYear,
  insuranceIsCustomised,
  includeInsurance,
  onToggleInsurance,
}: {
  totals: { annual: number; monthly: number; daily: number; perMile: number } | null;
  loading: boolean;
  fuel: FuelEconomyResult | null;
  milesPerYear: number;
  insuranceIsCustomised: boolean;
  includeInsurance: boolean;
  onToggleInsurance: () => void;
}) {
  return (
    <section className="relative mt-4 overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-900/25 via-slate-900/80 to-slate-950 p-6 sm:p-8">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-30 pointer-events-none bg-cyan-500/40" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <Calculator className="h-3 w-3 text-cyan-400" />
          Annual running cost
          {loading && (
            <span className="inline-flex items-center gap-1 text-cyan-300 normal-case font-normal tracking-normal">
              <Loader2 className="h-3 w-3 animate-spin" />
              looking up fuel economy…
            </span>
          )}
        </div>

        {totals ? (
          <>
            <p className="mt-2 flex items-baseline gap-3 flex-wrap">
              <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight tabular-nums">
                £{totals.annual.toLocaleString("en-GB")}
              </span>
              <span className="text-base text-slate-400">/year</span>
              <button
                type="button"
                onClick={onToggleInsurance}
                aria-pressed={includeInsurance}
                title={
                  includeInsurance
                    ? "Insurance is included — tap to exclude it"
                    : "Insurance is excluded — tap to include it"
                }
                className="group inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20 cursor-pointer"
              >
                {includeInsurance ? "incl. insurance" : "excl. insurance"}
                <ArrowLeftRight className="h-2.5 w-2.5 opacity-60 transition-opacity group-hover:opacity-100" />
              </button>
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label="Monthly" value={`£${totals.monthly.toLocaleString("en-GB")}`} />
              <Stat label="Daily" value={`£${totals.daily.toFixed(2)}`} />
              <Stat
                label="Per mile"
                value={
                  totals.perMile > 0 ? `${(totals.perMile * 100).toFixed(1)}p` : "—"
                }
                accent
              />
            </div>
            {(fuel?.combinedMpg || !includeInsurance || !insuranceIsCustomised) && (
              <p className="mt-4 text-xs text-slate-500">
                {fuel?.combinedMpg && (
                  <>
                    Based on {fuel.combinedMpg} mpg combined and{" "}
                    <strong className="text-slate-300 tabular-nums">
                      {milesPerYear.toLocaleString("en-GB")}
                    </strong>{" "}
                    miles per year.
                  </>
                )}
                {!includeInsurance ? (
                  <>
                    {" "}Insurance is excluded — tap the badge to add it back in.
                  </>
                ) : !insuranceIsCustomised ? (
                  <>
                    {" "}Insurance uses a segment-median baseline — refine below for a
                    sharper estimate.
                  </>
                ) : null}
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-xl text-slate-300">
            Couldn&#39;t calculate running costs — we&#39;re missing key data for this vehicle.
          </p>
        )}
      </div>
    </section>
  );
}

function Stat({
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
      className={`rounded-lg border p-3 text-center ${
        accent
          ? "border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/5"
          : "border-slate-800 bg-slate-950/60"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-1 text-base sm:text-lg font-semibold tabular-nums ${
          accent ? "text-cyan-300" : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* ─── Mileage slider ──────────────────────────────────────────────────── */

const MILEAGE_MIN = 2000;
const MILEAGE_MAX = 30000;
const MILEAGE_STEP = 500;
const PRESETS = [3000, 7400, 12000, 20000];

function MileageSlider({
  miles,
  onChange,
  hasFuelData,
}: {
  miles: number;
  onChange: (m: number) => void;
  hasFuelData: boolean;
}) {
  const pct = ((miles - MILEAGE_MIN) / (MILEAGE_MAX - MILEAGE_MIN)) * 100;
  const deltaFromAvg = miles - UK_AVG_MILES_PER_YEAR;
  const deltaPct =
    UK_AVG_MILES_PER_YEAR > 0
      ? Math.round((deltaFromAvg / UK_AVG_MILES_PER_YEAR) * 100)
      : 0;

  let context: { label: string; tone: "emerald" | "slate" | "amber" } = {
    label: "UK average",
    tone: "slate",
  };
  if (miles < UK_AVG_MILES_PER_YEAR - 1000) {
    context = { label: `${Math.abs(deltaPct)}% below UK average`, tone: "emerald" };
  } else if (miles > UK_AVG_MILES_PER_YEAR + 1000) {
    context = { label: `${deltaPct}% above UK average`, tone: "amber" };
  }

  const toneClasses = {
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    slate: "bg-slate-700/40 text-slate-300 border-slate-600/40",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  } as const;

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Your annual mileage</h3>
            <p className="text-[11px] text-slate-500">
              {hasFuelData
                ? "Slide to recalculate fuel — the rest of the breakdown updates too."
                : "Slider is informational — we don't have fuel data for this vehicle."}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider border rounded-full ${toneClasses[context.tone]}`}
        >
          {context.label}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span
          className="font-[family-name:var(--font-geist-mono)] text-3xl sm:text-4xl font-bold text-cyan-100 tabular-nums tracking-tight"
          style={{ textShadow: "0 0 14px rgba(34,211,238,0.35)" }}
        >
          {miles.toLocaleString("en-GB")}
        </span>
        <span className="text-[11px] font-semibold tracking-[0.18em] text-cyan-400/70 font-[family-name:var(--font-geist-mono)] uppercase">
          mi / yr
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={MILEAGE_MIN}
          max={MILEAGE_MAX}
          step={MILEAGE_STEP}
          value={miles}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mileage-range w-full"
          aria-label="Annual mileage"
          style={
            {
              ["--range-pct" as string]: `${pct}%`,
            } as React.CSSProperties
          }
        />
        <div className="mt-2 flex justify-between text-[10px] text-slate-500 tabular-nums">
          <span>{MILEAGE_MIN.toLocaleString("en-GB")}</span>
          <span className="text-slate-600">UK avg {UK_AVG_MILES_PER_YEAR.toLocaleString("en-GB")}</span>
          <span>{MILEAGE_MAX.toLocaleString("en-GB")}+</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const active = Math.abs(miles - p) < MILEAGE_STEP / 2;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                active
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200"
                  : "bg-slate-950/50 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
              }`}
            >
              {p === UK_AVG_MILES_PER_YEAR
                ? `UK avg (${p.toLocaleString("en-GB")})`
                : p.toLocaleString("en-GB")}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .mileage-range {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          background: linear-gradient(
            to right,
            rgb(34, 211, 238) 0%,
            rgb(59, 130, 246) var(--range-pct, 50%),
            rgb(30, 41, 59) var(--range-pct, 50%),
            rgb(30, 41, 59) 100%
          );
          outline: none;
          cursor: pointer;
        }
        .mileage-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgb(165, 243, 252);
          border: 2px solid rgb(8, 145, 178);
          box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.15),
            0 0 16px rgba(34, 211, 238, 0.5);
          cursor: pointer;
          transition: transform 0.1s;
        }
        .mileage-range::-webkit-slider-thumb:active {
          transform: scale(1.15);
        }
        .mileage-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgb(165, 243, 252);
          border: 2px solid rgb(8, 145, 178);
          box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.15),
            0 0 16px rgba(34, 211, 238, 0.5);
          cursor: pointer;
        }
        .mileage-range:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.35),
            0 0 16px rgba(34, 211, 238, 0.6);
        }
      `}</style>
    </section>
  );
}

/* ─── Category grid ────────────────────────────────────────────────────── */

function BreakdownGrid({
  ownership,
  fuel,
  segment,
  insurance,
  includeInsurance,
  totalAnnual,
}: {
  ownership: OwnershipCostResult;
  fuel: FuelEconomyResult | null;
  segment: VehicleSegment;
  insurance: InsuranceEstimate;
  includeInsurance: boolean;
  totalAnnual: number;
}) {
  const { breakdown } = ownership;

  const items: CategoryItem[] = [
    {
      key: "fuel",
      label: "Fuel",
      icon: Fuel,
      value: breakdown.fuel,
      tone: "amber",
      sub:
        fuel?.combinedMpg
          ? `${fuel.combinedMpg} mpg combined`
          : ownership.hasFuel
          ? "—"
          : "No fuel data",
    },
    {
      key: "ved",
      label: "Road tax (VED)",
      icon: Receipt,
      value: breakdown.ved,
      tone: "cyan",
      sub: ownership.hasVed ? "Annual rate" : "Not available",
    },
    {
      key: "depreciation",
      label: "Depreciation",
      icon: TrendingDown,
      value: breakdown.depreciation,
      tone: "rose",
      sub: ownership.hasDepreciation ? "Value lost this year" : "Not available",
    },
    {
      key: "maintenance",
      label: "MOT &amp; servicing",
      icon: ShieldCheck,
      value: (breakdown.mot ?? 0) + (breakdown.maintenance ?? 0) || null,
      tone: "emerald",
      sub: `Typical for ${segment} segment`,
    },
    {
      key: "insurance",
      label: "Insurance",
      icon: Umbrella,
      value: insurance.estimatedAnnual,
      tone: "violet",
      sub: insurance.isCustomised
        ? "Custom · refined from your inputs"
        : `Ballpark · ${segment} segment baseline`,
    },
  ];

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-slate-100">Where your money goes</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Annualised
        </span>
      </div>
      <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items
          .filter((item) => item.key !== "insurance" || includeInsurance)
          .map((item) => (
            <CategoryCard
              key={item.key}
              item={item}
              totalAnnual={totalAnnual}
            />
          ))}
      </div>
    </section>
  );
}

interface CategoryItem {
  key: string;
  label: string;
  icon: typeof Fuel;
  value: number | null;
  tone: "amber" | "cyan" | "rose" | "emerald" | "violet";
  sub: string;
}

function CategoryCard({
  item,
  totalAnnual,
}: {
  item: CategoryItem;
  totalAnnual: number;
}) {
  const Icon = item.icon;
  const sharePct =
    item.value && totalAnnual > 0 ? Math.round((item.value / totalAnnual) * 100) : null;
  const colourMap = {
    amber: "text-amber-300 bg-amber-500/15 border-amber-500/25",
    cyan: "text-cyan-300 bg-cyan-500/15 border-cyan-500/25",
    rose: "text-rose-300 bg-rose-500/15 border-rose-500/25",
    emerald: "text-emerald-300 bg-emerald-500/15 border-emerald-500/25",
    violet: "text-violet-300 bg-violet-500/15 border-violet-500/25",
  } as const;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${colourMap[item.tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {sharePct !== null && (
          <span className="text-[10px] font-medium text-slate-500">
            {sharePct}% of total
          </span>
        )}
      </div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500"
         dangerouslySetInnerHTML={{ __html: item.label }} />
      <p className="mt-0.5 text-xl sm:text-2xl font-bold text-white tabular-nums">
        {item.value !== null ? `£${item.value.toLocaleString("en-GB")}` : "—"}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{item.sub}</p>
    </div>
  );
}

/* ─── Stacked bar (proportional) ──────────────────────────────────────── */

function StackedBar({
  ownership,
  insurance,
  includeInsurance,
  totalAnnual,
}: {
  ownership: OwnershipCostResult;
  insurance: InsuranceEstimate;
  includeInsurance: boolean;
  totalAnnual: number;
}) {
  const { breakdown } = ownership;

  const segments = [
    { label: "Depreciation", value: breakdown.depreciation ?? 0, colour: "bg-rose-500/70" },
    { label: "Fuel", value: breakdown.fuel ?? 0, colour: "bg-amber-500/70" },
    { label: "Insurance", value: includeInsurance ? insurance.estimatedAnnual : 0, colour: "bg-violet-500/70" },
    {
      label: "MOT &amp; servicing",
      value: (breakdown.mot ?? 0) + (breakdown.maintenance ?? 0),
      colour: "bg-emerald-500/70",
    },
    { label: "Road tax", value: breakdown.ved ?? 0, colour: "bg-cyan-500/70" },
  ].filter((s) => s.value > 0);

  if (segments.length === 0 || totalAnnual === 0) return null;

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-slate-100">Composition</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Visual breakdown
        </span>
      </div>
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-800">
        {segments.map((s, i) => {
          const w = (s.value / totalAnnual) * 100;
          return <div key={i} className={s.colour} style={{ width: `${w}%` }} />;
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${s.colour}`} />
            <span
              className="text-slate-400 truncate"
              dangerouslySetInnerHTML={{ __html: s.label }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
      <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
      <p>
        Estimates only. Fuel scales linearly with the mileage you set. Insurance is a
        rule-based ballpark — for a real price, always get a live quote from a
        comparison site.
      </p>
    </div>
  );
}

/* ─── Insurance Q&A panel ─────────────────────────────────────────────── */

const INSURANCE_FIELDS: Array<{
  key: keyof InsuranceInputs;
  label: string;
  helper: string;
  options: { value: string; label: string }[];
}> = [
  {
    key: "ageBand",
    label: "Driver age",
    helper: "Younger drivers pay significantly more.",
    options: (
      ["17-21", "22-24", "25-29", "30-49", "50-65", "65+"] satisfies AgeBand[]
    ).map((v) => ({ value: v, label: v })),
  },
  {
    key: "locationBand",
    label: "Where you live",
    helper: "Postcode is the second-biggest premium driver.",
    options: (
      [
        ["inner-london", "Inner London"],
        ["outer-london", "Outer London / big city"],
        ["suburban", "Suburban"],
        ["rural", "Small town / rural"],
      ] as Array<[LocationBand, string]>
    ).map(([v, l]) => ({ value: v, label: l })),
  },
  {
    key: "ncdBand",
    label: "No-claims years",
    helper: "Consecutive years without a claim — usually on your renewal letter.",
    options: (
      ["0", "1-2", "3-5", "6-9", "10+"] satisfies NcdBand[]
    ).map((v) => ({ value: v, label: v })),
  },
  {
    key: "occupationBand",
    label: "Occupation risk",
    helper:
      "Lower-risk = office, teacher, civil servant. Higher-risk = delivery, taxi, trades.",
    options: (
      [
        ["lower", "Lower"],
        ["standard", "Standard"],
        ["higher", "Higher"],
      ] as Array<[OccupationBand, string]>
    ).map(([v, l]) => ({ value: v, label: l })),
  },
];

const COMPARE_THE_MARKET_URL = "https://www.comparethemarket.com/car-insurance/";

function InsurancePanel({
  inputs,
  setInputs,
  insurance,
}: {
  inputs: InsuranceInputs;
  setInputs: (i: InsuranceInputs) => void;
  insurance: InsuranceEstimate;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-900/15 via-slate-900/70 to-slate-950 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/15 text-violet-300">
            <Umbrella className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100">
              Refine your insurance estimate — 30s Q&amp;A
            </h3>
            <p className="text-[11px] text-slate-500">
              Tap a pill in each row to recompute. Every answer optional.
            </p>
          </div>
        </div>
        {insurance.isCustomised && (
          <button
            type="button"
            onClick={() => setInputs({})}
            className="text-[11px] text-slate-400 hover:text-slate-200 self-start"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-4">
        {INSURANCE_FIELDS.map((field) => (
          <InsuranceField
            key={field.key}
            field={field}
            value={inputs[field.key]}
            onChange={(v) =>
              setInputs({
                ...inputs,
                [field.key]: v as InsuranceInputs[typeof field.key],
              })
            }
          />
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-violet-500/20 bg-slate-950/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-[family-name:var(--font-geist-mono)]">
            Current estimate
          </p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span
              className="text-2xl sm:text-3xl font-bold text-violet-200 tabular-nums"
              style={{ textShadow: "0 0 14px rgba(167,139,250,0.35)" }}
            >
              £{insurance.estimatedAnnual.toLocaleString("en-GB")}
            </span>
            <span className="text-xs text-slate-400">/ year</span>
          </p>
          {insurance.isCustomised && (
            <p className="mt-1 text-[11px] text-slate-500">
              {(insurance.multiplier * 100 - 100 > 0 ? "+" : "") +
                ((insurance.multiplier - 1) * 100).toFixed(0)}
              % vs baseline (£{insurance.baseline.toLocaleString("en-GB")})
            </p>
          )}
        </div>
        <Button
          href={COMPARE_THE_MARKET_URL}
          target="_blank"
          rel="noopener nofollow noreferrer"
          size="sm"
        >
          Get real quotes →
        </Button>
      </div>

      <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        Ballpark only — real premiums depend on dozens of personal factors. Use this to
        budget; use a comparison site to actually buy.
      </p>
    </section>
  );
}

function InsuranceField({
  field,
  value,
  onChange,
}: {
  field: (typeof INSURANCE_FIELDS)[number];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-200 mb-2">{field.label}</p>
      <div className="flex flex-wrap gap-1.5">
        {field.options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                selected
                  ? "bg-violet-500/15 border-violet-500/40 text-violet-200"
                  : "bg-slate-950/50 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] text-slate-500">{field.helper}</p>
    </div>
  );
}

/**
 * Five-year cost forecast. Matches the visual language of the year-by-year
 * cards on Mileage / Tax / Valuation / MOT — one row per future year,
 * gradient bar scaled to the most-expensive year, total at the bottom.
 *
 * Methodology: re-runs the existing calculateOwnershipCost model with an
 * incremented vehicleAge for each future year. That picks up the natural
 * curve baked into the model:
 *   - depreciation per year falls as the car ages (steeper losses are
 *     already behind us)
 *   - maintenance per year rises (older cars need more work)
 *   - VED + fuel are held constant at today's figures (rates can change
 *     at Budget time; fuel prices fluctuate unpredictably)
 *
 * Insurance is handwritten in the forecast because the insurance lib
 * doesn't model "next year". We apply a -3% per-year drift (replacement
 * cost falls as the car depreciates, so premiums typically ease slightly)
 * — rough but more honest than holding it flat.
 */
function CostForecastCard({
  vehicle,
  ved,
  scaledFuelCost,
  segment,
  insurance,
}: {
  vehicle: LookupVehicle;
  ved: { estimatedAnnualRate: number | null };
  scaledFuelCost: number | null;
  segment: VehicleSegment;
  insurance: InsuranceEstimate;
}) {
  const { ref, revealed, reduced } = useScrollReveal(); // before the early return (rules of hooks)
  if (!vehicle.yearOfManufacture) return null;

  const HORIZON = 5;
  const thisYear = new Date().getFullYear();
  const currentAge = thisYear - vehicle.yearOfManufacture;
  const newPrice = lookupNewPrice(NEW_PRICES, vehicle.make, vehicle.model, vehicle.fuelType);

  const rows = Array.from({ length: HORIZON }, (_, i) => {
    const offset = i + 1; // next year, 2 years out, etc.
    const futureAge = currentAge + offset;
    const calendarYear = thisYear + offset;
    const isOver3Years = futureAge > 3;

    const own = calculateOwnershipCost({
      vedAnnualRate: ved.estimatedAnnualRate,
      fuelAnnualCost: scaledFuelCost,
      newPrice,
      vehicleAge: futureAge,
      make: vehicle.make,
      model: vehicle.model,
      isOver3Years,
      segment,
    });

    // Insurance — assume a gentle drift down as the car ages. Floor at
    // 70% of today's premium so the forecast doesn't claim insurance
    // halves over five years (it doesn't).
    const insuranceDrift = Math.max(0.7, 1 - 0.03 * offset);
    const futureInsurance = Math.round(insurance.estimatedAnnual * insuranceDrift);

    const total = (own?.totalAnnual ?? 0) + futureInsurance;
    return {
      year: calendarYear,
      total,
      fuel: own?.breakdown.fuel ?? 0,
      ved: own?.breakdown.ved ?? 0,
      depreciation: own?.breakdown.depreciation ?? 0,
      maintenance: own?.breakdown.maintenance ?? 0,
      mot: own?.breakdown.mot ?? 0,
      insurance: futureInsurance,
    };
  });

  const maxTotal = Math.max(...rows.map((r) => r.total), 1);
  const fiveYearTotal = rows.reduce((s, r) => s + r.total, 0);

  // Anchor the forecast in today's actual cost (solid bar) so the projected
  // years read as a trend from a real number, not free-floating guesses.
  const todayOwn = calculateOwnershipCost({
    vedAnnualRate: ved.estimatedAnnualRate,
    fuelAnnualCost: scaledFuelCost,
    newPrice,
    vehicleAge: currentAge,
    make: vehicle.make,
    model: vehicle.model,
    isOver3Years: currentAge > 3,
    segment,
  });
  const todayTotal = (todayOwn?.totalAnnual ?? 0) + insurance.estimatedAnnual;
  const maxAll = Math.max(todayTotal, maxTotal);
  const delay = (i: number) => (reduced ? 0 : i * 60);

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-slate-100">Cost forecast</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Next {HORIZON} years
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Projected total annual cost — fuel, road tax, maintenance, depreciation
        and insurance. Depreciation per year eases as the car ages; maintenance
        gently rises. Fuel and VED held constant at today&apos;s rates.
      </p>

      <div ref={ref} className="space-y-2">
        {/* Today's actual cost — the solid anchor the projection extends from */}
        <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-2 sm:gap-3 py-1">
          <span className="font-mono text-xs sm:text-sm text-slate-400 tabular-nums">
            {thisYear}
          </span>
          <div className="relative h-6 sm:h-7 rounded-md bg-slate-800/60 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-cyan-400 to-blue-400"
              style={{
                width: `${Math.max(5, Math.round((todayTotal / maxAll) * 100))}%`,
                transformOrigin: "left",
                transform: revealed ? "scaleX(1)" : "scaleX(0)",
                transition: "transform 600ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-100">
              Today
            </span>
          </div>
          <span
            className="font-mono text-xs sm:text-sm font-bold text-cyan-300 tabular-nums tracking-tight whitespace-nowrap"
            style={{ opacity: revealed ? 1 : 0, transition: "opacity 400ms ease-out 120ms" }}
          >
            £{todayTotal.toLocaleString("en-GB")}
          </span>
        </div>

        {/* Break so the forecast years never read as measured costs */}
        <div className="flex items-center gap-2 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <span className="h-px flex-1 bg-slate-800" />
          Projected
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Forecast — dashed outline + "~", visibly a projection */}
        {rows.map((row, j) => {
          const widthPct = Math.max(5, Math.round((row.total / maxAll) * 100));
          const gi = j + 1;
          return (
            <div
              key={row.year}
              className="grid grid-cols-[3rem_1fr_auto] items-center gap-2 sm:gap-3"
            >
              <span className="font-mono text-xs sm:text-sm text-slate-500 tabular-nums">
                {row.year}
              </span>
              <div className="relative h-6 sm:h-7 rounded-md bg-slate-800/40 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-md border border-dashed border-slate-500/60 bg-slate-600/15"
                  style={{
                    width: `${widthPct}%`,
                    transformOrigin: "left",
                    transform: revealed ? "scaleX(1)" : "scaleX(0)",
                    transition: `transform 600ms cubic-bezier(0.22,1,0.36,1) ${delay(gi)}ms`,
                  }}
                />
              </div>
              <span
                className="font-mono text-xs sm:text-sm font-medium text-slate-400 tabular-nums tracking-tight whitespace-nowrap"
                style={{ opacity: revealed ? 1 : 0, transition: `opacity 400ms ease-out ${delay(gi) + 120}ms` }}
              >
                ~£{row.total.toLocaleString("en-GB")}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Projected {HORIZON}-year total
        </span>
        <span className="font-mono text-base sm:text-lg font-bold text-cyan-300 tabular-nums">
          £{fiveYearTotal.toLocaleString("en-GB")}
        </span>
      </div>

      <p className="mt-3 text-[10px] text-slate-500 leading-relaxed">
        Excludes parking, finance and unforeseen repairs. Insurance assumed to
        drift -3%/year as the replacement value falls. Actual costs depend on
        your driving habits, postcode and the car&apos;s specific condition.
      </p>
    </section>
  );
}
