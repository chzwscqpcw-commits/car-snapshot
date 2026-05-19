"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Fuel,
  Receipt,
  TrendingDown,
  ShieldCheck,
  Umbrella,
  Loader2,
  Info,
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

interface RunningCostsResultProps {
  vrm: string;
}

const NEW_PRICES = newPricesData as Array<{
  make: string;
  model: string;
  newPrice: number;
}>;

export default function RunningCostsResult({ vrm }: RunningCostsResultProps) {
  const state = useVehicleLookup(vrm);
  if (state.kind === "loading")
    return <LookupSkeleton vrm={vrm} hint="Calculating fuel, tax and depreciation…" />;
  if (state.kind === "error")
    return <LookupError vrm={vrm} message={state.message} backHref="/running-costs" />;
  return <Loaded vrm={vrm} vehicle={state.vehicle} />;
}

function Loaded({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const [fuel, setFuel] = useState<FuelEconomyResult | null>(null);
  const [fuelState, setFuelState] = useState<"loading" | "done">("loading");

  // Fetch fuel economy
  useEffect(() => {
    if (!vehicle.make || !vehicle.model) {
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
    const newPrice = lookupNewPrice(NEW_PRICES, vehicle.make, vehicle.model);
    return classifyVehicleSegment({
      fuelType: vehicle.fuelType,
      bodyType: lookupBodyType(vehicle.make, vehicle.model) ?? undefined,
      newPrice,
      engineCapacity: vehicle.engineCapacity,
    });
  }, [vehicle.fuelType, vehicle.engineCapacity, vehicle.make, vehicle.model]);

  const ownership = useMemo<OwnershipCostResult | null>(() => {
    if (!vehicle.yearOfManufacture) return null;
    const vehicleAge = new Date().getFullYear() - vehicle.yearOfManufacture;
    const isOver3Years = vehicleAge > 3;
    const newPrice = lookupNewPrice(NEW_PRICES, vehicle.make, vehicle.model);
    return calculateOwnershipCost({
      vedAnnualRate: ved.estimatedAnnualRate,
      fuelAnnualCost: fuel?.estimatedAnnualCost ?? null,
      newPrice,
      vehicleAge,
      make: vehicle.make,
      model: vehicle.model,
      isOver3Years,
      segment,
    });
  }, [vehicle, ved, fuel, segment]);

  return (
    <ToolResultLayout
      vrm={vrm}
      vehicle={vehicle}
      excludePill="valuation"
      revealPitch="Running costs are just one slice — the full report adds MOT history, recalls, ULEZ, valuation and a buying checklist."
    >
      <Hero ownership={ownership} loading={fuelState === "loading"} fuel={fuel} />
      {ownership && <BreakdownGrid ownership={ownership} fuel={fuel} segment={segment} />}
      {ownership && <StackedBar ownership={ownership} />}
      <Disclaimer />
    </ToolResultLayout>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */

function Hero({
  ownership,
  loading,
  fuel,
}: {
  ownership: OwnershipCostResult | null;
  loading: boolean;
  fuel: FuelEconomyResult | null;
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

        {ownership ? (
          <>
            <p className="mt-2 flex items-baseline gap-3 flex-wrap">
              <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight tabular-nums">
                £{ownership.totalAnnual.toLocaleString("en-GB")}
              </span>
              <span className="text-base text-slate-400">/year</span>
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label="Monthly" value={`£${ownership.monthlyCost.toLocaleString("en-GB")}`} />
              <Stat label="Daily" value={`£${ownership.dailyCost.toFixed(2)}`} />
              <Stat
                label="Per mile"
                value={
                  ownership.costPerMile > 0
                    ? `${(ownership.costPerMile * 100).toFixed(1)}p`
                    : "—"
                }
                accent
              />
            </div>
            {fuel?.combinedMpg && (
              <p className="mt-4 text-xs text-slate-500">
                Based on a typical {fuel.combinedMpg} mpg combined and current UK fuel
                prices.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-xl text-slate-300">
            Couldn't calculate running costs — we're missing key data for this vehicle.
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

/* ─── Category grid ────────────────────────────────────────────────────── */

function BreakdownGrid({
  ownership,
  fuel,
  segment,
}: {
  ownership: OwnershipCostResult;
  fuel: FuelEconomyResult | null;
  segment: VehicleSegment;
}) {
  const { breakdown, totalAnnual } = ownership;

  // Insurance is the residual portion that ownership-cost includes via segment
  // medians. Surface it separately so the user sees all five categories.
  const knownCategories =
    (breakdown.fuel ?? 0) +
    (breakdown.ved ?? 0) +
    (breakdown.depreciation ?? 0) +
    (breakdown.mot ?? 0) +
    (breakdown.maintenance ?? 0);
  const insuranceEstimate = Math.max(0, totalAnnual - knownCategories);

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
      value: insuranceEstimate > 0 ? insuranceEstimate : null,
      tone: "violet",
      sub: `Estimate · ${segment} segment`,
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
        {items.map((item) => (
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

function StackedBar({ ownership }: { ownership: OwnershipCostResult }) {
  const { breakdown, totalAnnual } = ownership;
  const knownCategories =
    (breakdown.fuel ?? 0) +
    (breakdown.ved ?? 0) +
    (breakdown.depreciation ?? 0) +
    (breakdown.mot ?? 0) +
    (breakdown.maintenance ?? 0);
  const insurance = Math.max(0, totalAnnual - knownCategories);

  const segments = [
    { label: "Depreciation", value: breakdown.depreciation ?? 0, colour: "bg-rose-500/70" },
    { label: "Fuel", value: breakdown.fuel ?? 0, colour: "bg-amber-500/70" },
    { label: "Insurance", value: insurance, colour: "bg-violet-500/70" },
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
        Estimates only. Fuel calculation assumes 7,400 miles per year (DfT 2025 UK
        average) and current pump prices. Insurance is segment-based — your actual
        premium varies with age, location and driving history.
      </p>
    </div>
  );
}
