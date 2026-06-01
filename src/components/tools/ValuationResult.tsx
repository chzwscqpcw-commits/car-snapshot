"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PoundSterling,
  Sparkles,
  ArrowRight,
  Info,
  CircleCheck,
  Loader2,
  TrendingDown,
} from "lucide-react";
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
  combineValuationLayers,
  getConditionAdjustment,
  getColourAdjustment,
  getMileageAdjustment,
  getDepreciationMultiplier,
  getMakeRetentionMultiplier,
  latestRecordedMileage,
  type ConditionInputs,
  type ValuationResult as ValuationResultType,
} from "@/lib/valuation";
import { parseModel, expandBaseModelForLookup } from "@/lib/model-parser";
import newPricesData from "@/data/new-prices.json";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick, trackEvent } from "@/lib/tracking";

interface ValuationResultProps {
  vrm: string;
  previewVehicle?: LookupVehicle;
}

interface ServerValuation {
  ebayMedian: number | null;
  ebayQ1Price: number | null;
  ebayQ3Price: number | null;
  ebayListingCount: number;
  ebayMinPrice: number | null;
  ebayMaxPrice: number | null;
  ebayTotalListings: number | null;
  ebayDominantTransmission: string | null;
  ebayDominantBodyType: string | null;
  ebayYearWidened: boolean;
  cacheMedian: number | null;
  cacheEntryCount: number;
  marketcheckMedian: number | null;
  marketcheckQ1: number | null;
  marketcheckQ3: number | null;
  marketcheckListingCount: number;
  marketcheckSource: "cache" | "api" | null;
  sources: string[];
}

const NEW_PRICES = newPricesData as Array<{
  make: string;
  model: string;
  newPrice: number;
}>;

export default function ValuationResult({ vrm, previewVehicle }: ValuationResultProps) {
  const state = useVehicleLookup(previewVehicle ? "" : vrm);
  if (previewVehicle) return <Loaded vrm={vrm} vehicle={previewVehicle} />;
  if (state.kind === "loading")
    return <LookupSkeleton vrm={vrm} hint="Running the valuation model…" />;
  if (state.kind === "error")
    return <LookupError vrm={vrm} message={state.message} backHref="/car-valuation" />;
  return <Loaded vrm={vrm} vehicle={state.vehicle} />;
}

function Loaded({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const [serverData, setServerData] = useState<ServerValuation | null>(null);
  const [serverState, setServerState] = useState<"loading" | "ok" | "skipped">(
    "loading"
  );
  const [condition, setCondition] = useState<ConditionInputs | null>(null);

  // ── Derived inputs ─────────────────────────────────────────────────────
  const newPrice = useMemo(() => {
    if (!vehicle.make || !vehicle.model) return null;
    // Expanded/parsed model (e.g. "320d" → "3 Series") for the new-price lookup,
    // matching the full report so the same car finds the same new price.
    const parsed = parseModel(vehicle.model, vehicle.make);
    const lookupModel = expandBaseModelForLookup(vehicle.make, parsed);
    return lookupNewPrice(NEW_PRICES, vehicle.make, lookupModel || vehicle.model);
  }, [vehicle.make, vehicle.model]);
  const age = useMemo(
    () =>
      vehicle.yearOfManufacture
        ? Math.max(0, new Date().getFullYear() - vehicle.yearOfManufacture)
        : null,
    [vehicle.yearOfManufacture]
  );
  const mileage = useMemo(() => latestRecordedMileage(vehicle.motTests), [vehicle.motTests]);
  const advisoryCount = useMemo(
    () =>
      vehicle.motTests?.[0]?.rfrAndComments?.filter((r) => r.type === "ADVISORY")
        .length ?? 0,
    [vehicle.motTests]
  );
  const recentFailure = vehicle.motTests?.[0]?.testResult === "FAILED";

  const depEstimate = useMemo(() => {
    if (newPrice === null || age === null) return null;
    return calculateDepreciationBaseline(newPrice, age, vehicle.make, vehicle.model, mileage);
  }, [newPrice, age, vehicle.make, vehicle.model, mileage]);

  // ── Server call for live listings + cache ──────────────────────────────
  useEffect(() => {
    if (!vehicle.make || !vehicle.model || !vehicle.yearOfManufacture || depEstimate === null) {
      // Skip/early-exit state for the valuation fetch this effect performs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerState("skipped");
      return;
    }
    let cancelled = false;
    setServerState("loading");
    const params = new URLSearchParams({
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.yearOfManufacture),
      depreciationEstimate: String(depEstimate),
    });
    if (newPrice) params.set("newPrice", String(newPrice));
    if (vehicle.fuelType) params.set("fuelType", vehicle.fuelType);
    if (vehicle.engineCapacity) params.set("engineCapacity", String(vehicle.engineCapacity));
    if (mileage) params.set("mileage", String(mileage));
    if (vehicle.colour) params.set("colour", String(getColourAdjustment(vehicle.colour)));

    fetch(`/api/valuation?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ServerValuation | null) => {
        if (!cancelled) {
          setServerData(data);
          setServerState("ok");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerData(null);
          setServerState("ok");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    vehicle.make,
    vehicle.model,
    vehicle.yearOfManufacture,
    vehicle.fuelType,
    vehicle.engineCapacity,
    vehicle.colour,
    mileage,
    newPrice,
    depEstimate,
  ]);

  // ── Combined valuation ─────────────────────────────────────────────────
  const valuation = useMemo<ValuationResultType | null>(() => {
    if (depEstimate === null) return null;
    const { total: condAdj, motAuto } = getConditionAdjustment(
      condition,
      advisoryCount,
      recentFailure
    );
    const colourAdj = getColourAdjustment(vehicle.colour);
    const result = combineValuationLayers(
      depEstimate,
      serverData?.ebayMedian ?? null,
      serverData?.ebayListingCount ?? 0,
      serverData?.cacheMedian ?? null,
      serverData?.cacheEntryCount ?? 0,
      condAdj,
      colourAdj,
      serverData?.ebayTotalListings ?? null,
      serverData?.ebayMinPrice ?? null,
      serverData?.ebayMaxPrice ?? null,
      serverData?.ebayDominantTransmission ?? null,
      serverData?.ebayDominantBodyType ?? null,
      serverData?.ebayYearWidened ?? false,
      serverData?.ebayQ1Price ?? null,
      serverData?.ebayQ3Price ?? null,
      serverData?.marketcheckMedian ?? null,
      serverData?.marketcheckListingCount ?? 0,
      serverData?.marketcheckQ1 ?? null,
      serverData?.marketcheckQ3 ?? null
    );
    if (result) {
      result.mileageAdjustmentPercent = getMileageAdjustment(mileage, age ?? 0);
      result.motAutoAdjustmentPercent = motAuto;
    }
    return result;
  }, [
    depEstimate,
    serverData,
    condition,
    advisoryCount,
    recentFailure,
    vehicle.colour,
    mileage,
    age,
  ]);

  return (
    <ToolResultLayout
      vrm={vrm}
      vehicle={vehicle}
      excludePill="valuation"
      revealPitch="Valuation is just one piece — the full report adds MOT history, recalls, ULEZ, running costs and negotiation helpers, all on one page."
    >
      <Hero
        valuation={valuation}
        depEstimate={depEstimate}
        newPrice={newPrice}
        age={age}
        vehicle={vehicle}
        serverState={serverState}
      />
      {valuation && (
        <SourceBreakdown
          valuation={valuation}
          serverData={serverData}
          condition={condition}
        />
      )}
      {newPrice !== null && age !== null && (
        <DepreciationCurveCard
          newPrice={newPrice}
          age={age}
          make={vehicle.make}
          model={vehicle.model}
          currentEstimate={valuation?.estimatedValue ?? depEstimate}
        />
      )}
      <ConditionPanel condition={condition} setCondition={setCondition} />
      <BmgHook vrm={vrm} />
      <Disclaimer />
    </ToolResultLayout>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */

function Hero({
  valuation,
  depEstimate,
  newPrice,
  age,
  vehicle,
  serverState,
}: {
  valuation: ValuationResultType | null;
  depEstimate: number | null;
  newPrice: number | null;
  age: number | null;
  vehicle: LookupVehicle;
  serverState: "loading" | "ok" | "skipped";
}) {
  const value = valuation?.estimatedValue ?? depEstimate;
  const low = valuation?.rangeLow ?? null;
  const high = valuation?.rangeHigh ?? null;
  const hasValue = value !== null;
  const stillLoading = serverState === "loading" && !valuation;

  return (
    <section className="relative mt-4 overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-900/25 via-slate-900/80 to-slate-950 p-6 sm:p-8">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-30 pointer-events-none bg-cyan-500/40" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3 w-3 text-cyan-400" />
          Estimated market value
          {stillLoading && (
            <span className="inline-flex items-center gap-1 text-cyan-300 normal-case font-normal tracking-normal">
              <Loader2 className="h-3 w-3 animate-spin" /> calibrating from live listings…
            </span>
          )}
        </div>

        {hasValue ? (
          <>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight tabular-nums">
                £{value!.toLocaleString("en-GB")}
              </span>
              {valuation && (
                <ConfidenceChip
                  confidence={valuation.confidence}
                  rangePct={getRangePct(valuation)}
                />
              )}
            </p>
            {low !== null && high !== null && (
              <>
                <p className="mt-1 text-sm text-slate-400">
                  Typical range:{" "}
                  <span className="text-slate-200 font-semibold tabular-nums">
                    £{low.toLocaleString("en-GB")}
                  </span>
                  {" – "}
                  <span className="text-slate-200 font-semibold tabular-nums">
                    £{high.toLocaleString("en-GB")}
                  </span>
                </p>
                <div className="mt-4">
                  <RangeBar low={low} centre={value!} high={high} />
                </div>
              </>
            )}
          </>
        ) : (
          <p className="mt-2 text-xl text-slate-300">
            Couldn&#39;t price this vehicle — we don&#39;t have a new-price record for {vehicle.make} {vehicle.model}.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Chip>{vehicle.make ?? "—"} {vehicle.model ?? ""}</Chip>
          {age !== null && <Chip>{age} yr{age === 1 ? "" : "s"} old</Chip>}
          {vehicle.fuelType && <Chip>{vehicle.fuelType}</Chip>}
          {newPrice && <Chip>New ~£{newPrice.toLocaleString("en-GB")}</Chip>}
        </div>
      </div>
    </section>
  );
}

function ConfidenceChip({
  confidence,
  rangePct,
}: {
  confidence: ValuationResultType["confidence"];
  rangePct: number | null;
}) {
  const labelMap = {
    high: { label: "High confidence", colour: "emerald" },
    medium: { label: "Medium confidence", colour: "cyan" },
    low: { label: "Lower confidence", colour: "amber" },
    "estimate-only": { label: "Rough estimate", colour: "amber" },
  } as const;
  const meta = labelMap[confidence];
  const colourClasses =
    meta.colour === "emerald"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : meta.colour === "cyan"
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
      : "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${colourClasses}`}
    >
      <CircleCheck className="h-3 w-3" />
      {meta.label}
      {rangePct !== null && <span className="font-normal opacity-80">±{rangePct}%</span>}
    </span>
  );
}

function getRangePct(v: ValuationResultType): number | null {
  if (!v.estimatedValue) return null;
  const halfRange = (v.rangeHigh - v.rangeLow) / 2;
  return Math.round((halfRange / v.estimatedValue) * 100);
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300">
      {children}
    </span>
  );
}

function RangeBar({ low, centre, high }: { low: number; centre: number; high: number }) {
  const range = high - low || 1;
  const pos = Math.max(0, Math.min(100, ((centre - low) / range) * 100));
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

/* ─── Source breakdown (transparency) ─────────────────────────────────── */

function SourceBreakdown({
  valuation,
  serverData,
  condition,
}: {
  valuation: ValuationResultType;
  serverData: ServerValuation | null;
  condition: ConditionInputs | null;
}) {
  // Combined live comparable pool — eBay + MarketCheck (the two fused signals).
  const liveCount = (serverData?.ebayListingCount ?? 0) + (serverData?.marketcheckListingCount ?? 0);
  const cacheCount = serverData?.cacheEntryCount ?? 0;
  const hasLive = liveCount > 0;
  const hasCache = cacheCount > 0;
  const hasCondition = !!condition;
  const conditionPct = valuation.conditionAdjustmentPercent;

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-slate-100">How we got to this number</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {valuation.sources.length} source
          {valuation.sources.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <SourceTile
          enabled
          icon={TrendingDown}
          label="Depreciation model"
          value="Age + make + mileage"
          tone="slate"
        />
        <SourceTile
          enabled={hasLive}
          icon={Sparkles}
          label="Live online listings"
          value={
            hasLive
              ? `${liveCount} comparable${liveCount === 1 ? "" : "s"} analysed`
              : "Not enough live data"
          }
          tone="cyan"
        />
        <SourceTile
          enabled={hasCache}
          icon={CircleCheck}
          label="Recent community valuations"
          value={
            hasCache
              ? `${cacheCount} cached estimate${cacheCount === 1 ? "" : "s"}`
              : "No cached data yet"
          }
          tone="emerald"
        />
      </div>

      {hasCondition && (
        <div className="mt-3 rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2.5 text-xs text-slate-300 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 mt-0.5 text-cyan-400 flex-shrink-0" />
          <p>
            Your condition inputs adjusted the figure by{" "}
            <strong
              className={
                conditionPct >= 0 ? "text-emerald-300" : "text-rose-300"
              }
            >
              {conditionPct > 0 ? "+" : ""}
              {conditionPct.toFixed(1)}%
            </strong>{" "}
            from the market median.
          </p>
        </div>
      )}
    </section>
  );
}

function SourceTile({
  enabled,
  icon: Icon,
  label,
  value,
  tone,
}: {
  enabled: boolean;
  icon: typeof Sparkles;
  label: string;
  value: string;
  tone: "slate" | "cyan" | "emerald";
}) {
  const colour = !enabled
    ? "border-slate-800 bg-slate-950/40 text-slate-500"
    : tone === "cyan"
    ? "border-cyan-500/25 bg-cyan-500/5"
    : tone === "emerald"
    ? "border-emerald-500/25 bg-emerald-500/5"
    : "border-slate-700 bg-slate-950/60";

  return (
    <div className={`rounded-lg border p-3 ${colour}`}>
      <div className="flex items-center gap-2">
        <Icon
          className={`h-3.5 w-3.5 ${
            !enabled
              ? "text-slate-600"
              : tone === "cyan"
              ? "text-cyan-300"
              : tone === "emerald"
              ? "text-emerald-300"
              : "text-slate-300"
          }`}
        />
        <p className={`text-[10px] uppercase tracking-wider ${!enabled ? "text-slate-600" : "text-slate-400"}`}>
          {label}
        </p>
      </div>
      <p className={`mt-1 text-xs font-medium ${!enabled ? "text-slate-600" : "text-slate-200"}`}>
        {value}
      </p>
    </div>
  );
}

/* ─── Condition fine-tuning ───────────────────────────────────────────── */

const CONDITION_FIELDS: Array<{
  key: keyof ConditionInputs;
  label: string;
  helper: string;
  options: { value: string; label: string }[];
}> = [
  {
    key: "serviceHistory",
    label: "Service history",
    helper: "Full = stamped logbook or printouts for every service interval.",
    options: [
      { value: "full", label: "Full" },
      { value: "partial", label: "Partial" },
      { value: "none", label: "None" },
    ],
  },
  {
    key: "bodywork",
    label: "Bodywork",
    helper: "Honest assessment — small dents and scuffs add up.",
    options: [
      { value: "excellent", label: "Excellent" },
      { value: "good", label: "Good" },
      { value: "fair", label: "Fair" },
      { value: "poor", label: "Poor" },
    ],
  },
  {
    key: "interior",
    label: "Interior",
    helper: "Worn = scuffed leather, faded plastics, stained fabric.",
    options: [
      { value: "excellent", label: "Excellent" },
      { value: "good", label: "Good" },
      { value: "worn", label: "Worn" },
    ],
  },
  {
    key: "owners",
    label: "Previous owners",
    helper: "Fewer owners = stronger resale; details on the V5C.",
    options: [
      { value: "1", label: "1" },
      { value: "2-3", label: "2–3" },
      { value: "4+", label: "4+" },
    ],
  },
  {
    key: "accidents",
    label: "Accident history",
    helper: "Significant = chassis repair, airbag deployment, recorded write-off.",
    options: [
      { value: "none", label: "None" },
      { value: "minor", label: "Minor" },
      { value: "significant", label: "Significant" },
    ],
  },
];

const DEFAULT_CONDITION: ConditionInputs = {
  serviceHistory: "partial",
  bodywork: "good",
  interior: "good",
  owners: "2-3",
  accidents: "none",
};

function ConditionPanel({
  condition,
  setCondition,
}: {
  condition: ConditionInputs | null;
  setCondition: (c: ConditionInputs | null) => void;
}) {
  const active = condition !== null;
  const current = condition ?? DEFAULT_CONDITION;

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-slate-100">
          Refine the figure for your car&#39;s condition
        </h3>
        {active && (
          <button
            type="button"
            onClick={() => setCondition(null)}
            className="text-[11px] text-slate-400 hover:text-slate-200"
          >
            Reset
          </button>
        )}
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Optional — the more accurate you are, the tighter the range gets.
      </p>

      <div className="space-y-4">
        {CONDITION_FIELDS.map((field) => (
          <ConditionField
            key={field.key}
            field={field}
            value={current[field.key]}
            onChange={(value) =>
              setCondition({ ...current, [field.key]: value as ConditionInputs[typeof field.key] })
            }
            highlight={active}
          />
        ))}
      </div>
    </section>
  );
}

function ConditionField({
  field,
  value,
  onChange,
  highlight,
}: {
  field: (typeof CONDITION_FIELDS)[number];
  value: string;
  onChange: (v: string) => void;
  highlight: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-200 mb-2">{field.label}</p>
      <div className="flex flex-wrap gap-1.5">
        {field.options.map((opt) => {
          const selected = highlight && opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                selected
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200"
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

/* ─── BMG + disclaimer ────────────────────────────────────────────────── */

function BmgHook({ vrm }: { vrm: string }) {
  const href =
    PARTNER_LINKS.bookMyGarageService.buildLink?.(vrm, "valuation-result-bmg-hook") ??
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
            onClick={() =>
              trackPartnerClick("bookMyGarageService", "valuation-result-bmg-hook")
            }
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition-colors"
          >
            Compare service prices for {vrm}
            <ArrowRight className="h-3 w-3" />
          </a>
          {/* Secondary path: valuation visitors arrive via "what's my car
              worth" intent, but most own a car that needs an annual MOT.
              Bridge that audience into the MOT booking flow with the reg
              pre-filled. source=valuation_result keeps attribution distinct
              from the service hook above. */}
          <p className="mt-3 text-xs text-slate-400">
            Just need an MOT?{" "}
            <a
              href={`/booking?vrm=${encodeURIComponent(vrm)}&type=mot&source=valuation_result`}
              onClick={() =>
                trackEvent("cheap_mot_compare_click", {
                  has_reg: true,
                  source: "valuation_result",
                })
              }
              className="font-semibold text-cyan-300 underline-offset-2 hover:underline"
            >
              Compare cheap MOT prices for {vrm} &rarr;
            </a>
          </p>
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
        Estimated guide value. Live online comparables reflect asking prices, adjusted
        toward typical transaction values. Actual sale price depends on the exact spec,
        condition, service history and local market — get an in-person quote before
        committing.
      </p>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */


/**
 * Depreciation curve: shows the year-by-year journey from new price
 * (year 0) through today, plus three years of projected future value.
 * Each row is one year of ownership; the bar length scales to the new
 * price so the visual is the curve itself. The current year is
 * highlighted with a cyan dot + "Today" tag so the user can immediately
 * locate where the vehicle is on its curve.
 *
 * The numbers come from the same depreciation + retention model the
 * Hero card uses, so this card is an honest visualisation of how we
 * arrived at the headline figure — not a separate calculation.
 */
function DepreciationCurveCard({
  newPrice,
  age,
  make,
  model,
  currentEstimate,
}: {
  newPrice: number;
  age: number;
  make?: string;
  model?: string;
  currentEstimate: number | null;
}) {
  const HISTORY = age;
  const FORECAST = 3;
  const totalYears = HISTORY + FORECAST + 1; // +1 for year 0 (new)
  const retention = getMakeRetentionMultiplier(make, model);

  const rawValue = (y: number) =>
    Math.round(newPrice * getDepreciationMultiplier(y) * retention);
  const rawNow = rawValue(HISTORY); // the model's raw "today" value (pre-market)

  // Anchor the curve to the blended headline estimate. The generic depreciation
  // model often disagrees with the live market (e.g. premium German diesels
  // depreciate harder than average), which left the curve's "today" bar
  // contradicting the headline figure. We bend the curve so the current year
  // lands exactly on our actual estimate: the new-price anchor (year 0) is
  // preserved and the correction factor is interpolated across the history
  // years, so the curve gets steeper/shallower to reflect how THIS car really
  // depreciated — and now agrees with the headline. Forecast years extend
  // forward from the anchored value at the model's rate. Falls back to the raw
  // model when no estimate is available.
  const anchorFactor =
    currentEstimate != null && rawNow > 0 ? currentEstimate / rawNow : 1;

  const rows = Array.from({ length: totalYears }, (_, y) => {
    const raw = rawValue(y);
    let value: number;
    if (y <= HISTORY) {
      const t = HISTORY === 0 ? 1 : y / HISTORY; // 0 at new → 1 at today
      value = Math.round(raw * (1 + (anchorFactor - 1) * t));
    } else {
      value = Math.round((currentEstimate ?? raw) * (raw / (rawNow || 1)));
    }
    return {
      year: y,
      value,
      isNow: y === HISTORY,
      isFuture: y > HISTORY,
    };
  });

  const max = rows[0].value; // year 0 — the new price — is always the max
  const thisYear = new Date().getFullYear();

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-slate-100">Depreciation curve</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {HISTORY} yr history · {FORECAST} yr forecast
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Estimated value each year of ownership, anchored to today&apos;s market estimate. Current year highlighted.
      </p>

      <div className="space-y-2">
        {rows.map((row) => {
          const widthPct = Math.max(3, Math.round((row.value / max) * 100));
          const calendarYear = thisYear - HISTORY + row.year;
          const barClass = row.isFuture
            ? "from-slate-600/60 to-slate-500/60"
            : row.isNow
            ? "from-cyan-400 to-blue-400"
            : "from-cyan-500/70 to-blue-500/70";
          return (
            <div
              key={row.year}
              className={`grid grid-cols-[4rem_1fr_auto] items-center gap-2 sm:gap-3 ${
                row.isNow ? "py-1" : ""
              }`}
            >
              <span className="font-mono text-xs sm:text-sm text-slate-400 tabular-nums flex items-center gap-1">
                {calendarYear}
                {row.isNow && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </span>
              <div className="relative h-6 sm:h-7 rounded-md bg-slate-800/60 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-md bg-gradient-to-r transition-all ${barClass}`}
                  style={{ width: `${widthPct}%` }}
                />
                {row.isNow && (
                  <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-100">
                    Today
                  </span>
                )}
              </div>
              <span
                className={`font-mono text-xs sm:text-sm tabular-nums tracking-tight whitespace-nowrap ${
                  row.isNow ? "font-bold text-cyan-300" : "font-semibold text-slate-100"
                } ${row.isFuture ? "text-slate-400" : ""}`}
              >
                £{row.value.toLocaleString("en-GB")}
              </span>
            </div>
          );
        })}
      </div>

      {currentEstimate !== null && (
        <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
          The current-year bar is our headline estimate of £{currentEstimate.toLocaleString("en-GB")} —
          the curve is anchored to it (and to the original new price), so the earlier
          years show this car&apos;s likely path to today and the later years project
          forward. Forecasts assume no major market shift, model discontinuation or
          accident history.
        </p>
      )}
    </section>
  );
}
