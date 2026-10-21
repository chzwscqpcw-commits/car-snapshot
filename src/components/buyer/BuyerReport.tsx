"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Banknote,
  CarFront,
  CheckCircle2,
  ClipboardList,
  EyeOff,
  FileWarning,
  Info,
  KeyRound,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import {
  useVehicleLookup,
  LookupSkeleton,
  LookupError,
  VehiclePill,
  QuickPillRail,
  vehicleLabel,
  type LookupVehicle,
} from "@/components/tools/shared";
import { analyseMileage } from "@/components/tools/MileageResult";
import MotJourneyTimeline from "@/components/tools/MotJourneyTimeline";
import CarVerticalReportCTA from "@/components/CarVerticalReportCTA";
import InspectionCTA from "@/components/InspectionCTA";
import WarrantyCTA from "@/components/WarrantyCTA";
import { buildBuyerFlags, type BuyerFlag, type FlagSeverity } from "@/lib/buyer-flags";
import { lookupTheftRisk } from "@/lib/theft-risk";
import { lookupMotPassRate } from "@/lib/mot-pass-rate";
import { calculateUlezCompliance } from "@/lib/ulez";
import { CARVERTICAL_PRICING } from "@/config/partners";
import { vehicleNoun } from "@/lib/report-v2/format";
import { trackEvent } from "@/lib/tracking";

/**
 * The buyer check — /check-before-you-buy?vrm=…
 *
 * Every other result page on the site assumes the plate belongs to the person
 * typing it, and in Sep–Oct 2026 that was true for most of them: 58% of
 * sessions landed on the homepage or a valuation page, buyer-intent landings
 * were ~7%, and ~93% of real carVertical clicks came from seller-framed
 * placements. This page is the one surface where the visitor has told us they
 * are buying, so it can be built entirely around that: does the car match the
 * advert, what the free records show, what they can't show (carVertical),
 * and what to do on the day (ClickMechanic, Warrantywise).
 */
export default function BuyerReport({ vrm }: { vrm: string }) {
  const state = useVehicleLookup(vrm);
  if (state.kind === "loading")
    return <LookupSkeleton vrm={vrm} hint="Checking the records a buyer needs…" />;
  if (state.kind === "error")
    return <LookupError vrm={vrm} message={state.message} backHref="/check-before-you-buy" />;
  return <Loaded vrm={vrm} vehicle={state.vehicle} />;
}

/** Model recalls, fetched once. A failure just means no recall flag. */
function useRecallCount(vehicle: LookupVehicle): number {
  const [count, setCount] = useState(0);
  const { make, model, yearOfManufacture } = vehicle;
  useEffect(() => {
    if (!make) return;
    let cancelled = false;
    const qs = new URLSearchParams({ make });
    if (model) qs.set("model", model);
    if (yearOfManufacture) qs.set("year", String(yearOfManufacture));
    fetch(`/api/recalls?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: unknown) => {
        if (!cancelled && Array.isArray(list)) setCount(list.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [make, model, yearOfManufacture]);
  return count;
}

function Loaded({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const reg = vehicle.registrationNumber || vrm;
  const recallCount = useRecallCount(vehicle);

  const mileage = useMemo(() => analyseMileage(vehicle), [vehicle]);
  const theft = useMemo(() => lookupTheftRisk(vehicle.make, vehicle.model), [vehicle]);
  const passRate = useMemo(() => lookupMotPassRate(vehicle.make, vehicle.model), [vehicle]);
  const ulez = useMemo(
    () =>
      calculateUlezCompliance({
        fuelType: vehicle.fuelType,
        euroStatus: vehicle.euroStatus,
        monthOfFirstRegistration: vehicle.monthOfFirstRegistration,
        co2Emissions: vehicle.co2Emissions,
        yearOfManufacture: vehicle.yearOfManufacture,
      }),
    [vehicle],
  );

  const flags = useMemo(
    () =>
      buildBuyerFlags({
        motStatus: vehicle.motStatus,
        motExpiryDate: vehicle.motExpiryDate,
        taxStatus: vehicle.taxStatus,
        yearOfManufacture: vehicle.yearOfManufacture,
        dateOfLastV5CIssued:
          typeof vehicle.dateOfLastV5CIssued === "string" ? vehicle.dateOfLastV5CIssued : undefined,
        markedForExport: vehicle.markedForExport === true,
        motTests: vehicle.motTests,
        clockingFlags: mileage.clockingFlags,
        recallCount,
        theftRiskCategory: theft?.riskCategory ?? null,
        ulezStatus: ulez.status,
      }),
    [vehicle, mileage, recallCount, theft, ulez],
  );

  const age = vehicle.yearOfManufacture ? new Date().getFullYear() - vehicle.yearOfManufacture : null;
  // DVLA covers bikes and vans too. The copy says what the vehicle is, and the
  // warranty and inspection partners only cover cars and vans.
  const noun = vehicleNoun({
    wheelplan: typeof vehicle.wheelplan === "string" ? vehicle.wheelplan : undefined,
    typeApproval: typeof vehicle.typeApproval === "string" ? vehicle.typeApproval : undefined,
  });
  const isBike = noun === "motorbike";

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-10 sm:pt-8 sm:pb-14">
      <VehiclePill reg={reg} label={vehicleLabel(vehicle)} />

      <header className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
          Buyer&apos;s check
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          Before you buy {reg}
        </h1>
        <Verdict flags={flags} />
      </header>

      <Step n={1} title="Does it match the advert?">
        <AdvertMatch vehicle={vehicle} reg={reg} noun={noun} />
      </Step>

      <Step n={2} title="What the free records show">
        <FlagList flags={flags} />
        <MileageLine mileage={mileage} compareToUkAverage={!isBike} />
      </Step>

      <Step n={3} title="What the free records can't show">
        <HiddenRisks reg={reg} noun={noun} />
      </Step>

      <Step n={4} title="On the day you view it">
        <ViewingChecklist
          failureAreas={passRate?.commonFailureReasons ?? null}
          model={vehicle.model}
          isBike={isBike}
        />
        {!isBike && (
          <div className="mt-4 space-y-4">
            <InspectionCTA context="buyer-check-inspection" regNumber={reg} />
            {age !== null && age >= 3 && (
              <WarrantyCTA context="buyer-check-warranty" regNumber={reg} variant="report" layout="inline" />
            )}
          </div>
        )}
      </Step>

      {vehicle.motTests && vehicle.motTests.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Full MOT history</h2>
          <MotJourneyTimeline tests={vehicle.motTests} />
        </section>
      )}

      <QuickPillRail vrm={reg} />
    </div>
  );
}

/* ─── Layout ─────────────────────────────────────────────────────────── */

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold text-white">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 text-sm font-bold text-cyan-300">
          {n}
        </span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Verdict({ flags }: { flags: BuyerFlag[] }) {
  const stops = flags.filter((f) => f.severity === "stop").length;
  const asks = flags.filter((f) => f.severity === "ask").length;
  if (stops > 0) {
    return (
      <p className="mt-2 text-sm text-rose-200">
        <strong className="font-semibold">
          {stops} serious warning{stops === 1 ? "" : "s"}
        </strong>{" "}
        in the free records. Read them before you go any further.
      </p>
    );
  }
  if (asks > 0) {
    return (
      <p className="mt-2 text-sm text-amber-200">
        Nothing alarming, but{" "}
        <strong className="font-semibold">
          {asks} thing{asks === 1 ? "" : "s"} to ask the seller about
        </strong>
        .
      </p>
    );
  }
  return (
    <p className="mt-2 text-sm text-emerald-200">
      The free records look clean. The checks that catch most bad buys aren&apos;t in them, though —
      see step 3.
    </p>
  );
}

/* ─── Step 1: advert match ───────────────────────────────────────────── */

type Answer = "yes" | "no";

function AdvertMatch({ vehicle, reg, noun }: { vehicle: LookupVehicle; reg: string; noun: string }) {
  const rows = [
    { key: "make-model", label: "Make & model", value: [vehicle.make, vehicle.model].filter(Boolean).join(" ") },
    { key: "colour", label: "Colour", value: vehicle.colour },
    { key: "year", label: "Year", value: vehicle.yearOfManufacture ? String(vehicle.yearOfManufacture) : undefined },
    { key: "fuel", label: "Fuel", value: vehicle.fuelType },
    {
      key: "engine",
      label: "Engine size",
      value: vehicle.engineCapacity ? `${vehicle.engineCapacity.toLocaleString("en-GB")} cc` : undefined,
    },
  ].filter((r): r is { key: string; label: string; value: string } => Boolean(r.value));

  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const mismatches = rows.filter((r) => answers[r.key] === "no");

  function answer(key: string, a: Answer) {
    setAnswers((prev) => ({ ...prev, [key]: a }));
    if (a === "no") trackEvent("buyer_check_mismatch", { field: key });
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <p className="text-sm text-slate-400">
        This is what DVLA holds for <span className="font-mono text-slate-200">{reg}</span>. Check
        each line against the advert and the {noun} in front of you.
      </p>
      <ul className="mt-3 divide-y divide-slate-800">
        {rows.map((r) => {
          const a = answers[r.key];
          return (
            <li key={r.key} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">{r.label}</p>
                <p className="truncate text-sm font-medium text-slate-100">{r.value}</p>
              </div>
              <div className="flex shrink-0 gap-1.5" role="group" aria-label={`Does the ${r.label.toLowerCase()} match?`}>
                <button
                  type="button"
                  onClick={() => answer(r.key, "yes")}
                  aria-pressed={a === "yes"}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    a === "yes"
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                      : "border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Matches
                </button>
                <button
                  type="button"
                  onClick={() => answer(r.key, "no")}
                  aria-pressed={a === "no"}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    a === "no"
                      ? "border-rose-500/50 bg-rose-500/15 text-rose-200"
                      : "border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <X className="h-3.5 w-3.5" /> Doesn&apos;t
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {mismatches.length > 0 && (
        <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-rose-100">
            <AlertOctagon className="h-4 w-4 shrink-0" /> Don&apos;t hand over any money yet
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-rose-100/80">
            When the {mismatches.map((m) => m.label.toLowerCase()).join(" and ")} on the plate&apos;s
            record doesn&apos;t match the {noun}, it can be an honest mistake in the advert — or a
            cloned {noun} wearing another vehicle&apos;s plates. Compare the VIN stamped on the{" "}
            {noun} with the logbook, and run a stolen/cloned check before going further.
          </p>
          <a
            href="#full-history"
            className="mt-2 inline-block text-xs font-semibold text-rose-200 underline underline-offset-2"
          >
            Check for stolen, cloned and written-off records ↓
          </a>
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: red flags ──────────────────────────────────────────────── */

const SEVERITY_STYLE: Record<FlagSeverity, { wrap: string; icon: typeof AlertOctagon; iconClass: string }> = {
  stop: { wrap: "border-rose-500/40 bg-rose-950/40", icon: AlertOctagon, iconClass: "text-rose-400" },
  ask: { wrap: "border-amber-500/30 bg-amber-950/30", icon: AlertTriangle, iconClass: "text-amber-400" },
  note: { wrap: "border-slate-700 bg-slate-900/60", icon: Info, iconClass: "text-slate-400" },
};

function FlagList({ flags }: { flags: BuyerFlag[] }) {
  if (flags.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-emerald-100">No red flags in the MOT, DVLA or mileage records</p>
          <p className="mt-1 text-xs text-emerald-100/70">
            Valid MOT, a consistent mileage trail and nothing odd on the DVLA record.
          </p>
        </div>
      </div>
    );
  }
  return (
    <ul className="space-y-2.5">
      {flags.map((f) => {
        const s = SEVERITY_STYLE[f.severity];
        const Icon = s.icon;
        return (
          <li key={f.id} className={`flex items-start gap-3 rounded-xl border p-3.5 ${s.wrap}`}>
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.iconClass}`} />
            <div>
              <p className="text-sm font-semibold text-slate-100">{f.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{f.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function MileageLine({
  mileage,
  compareToUkAverage,
}: {
  mileage: ReturnType<typeof analyseMileage>;
  /** The UK average is a car figure — meaningless against a motorbike. */
  compareToUkAverage: boolean;
}) {
  if (mileage.current === null) return null;
  return (
    <p className="mt-3 text-xs text-slate-400">
      Last recorded mileage{" "}
      <strong className="text-slate-200">{mileage.current.toLocaleString("en-GB")} mi</strong>
      {mileage.avgPerYear !== null && (
        <>
          {" "}· about <strong className="text-slate-200">{mileage.avgPerYear.toLocaleString("en-GB")} a year</strong>
          {compareToUkAverage && <> (UK average {mileage.ukAverage.toLocaleString("en-GB")})</>}
        </>
      )}
      . If the dashboard shows less than this, walk away.
    </p>
  );
}

/* ─── Step 3: what the free records can't show ───────────────────────── */

/** Keep factual (carVertical agreement 3.1) — these describe the risk, not the
 *  report's findings. Worded for the vehicle in front of them: the same risks
 *  apply to a bike or a van. */
const hiddenRisks = (noun: string): { Icon: typeof Banknote; title: string; why: string }[] => [
  {
    Icon: Banknote,
    title: "Outstanding finance",
    why: `If the seller still owes on a finance deal, the lender can take the ${noun} back from you.`,
  },
  {
    Icon: FileWarning,
    title: "Insurance write-off",
    why: `A Cat S or N ${noun} can be legal to drive, but it's worth far less and some insurers won't cover it.`,
  },
  {
    Icon: ShieldAlert,
    title: "Stolen or cloned",
    why: `A stolen ${noun} is returned to its owner — and you lose what you paid.`,
  },
  {
    Icon: Users,
    title: "Number of previous keepers",
    why: "Lots of owners in a short time can mean a problem each one passed on.",
  },
  {
    Icon: CarFront,
    title: "Damage & import history",
    why: "Accident records and a life abroad don't appear on a UK MOT record.",
  },
  {
    Icon: KeyRound,
    title: "Plate changes",
    why: `A private plate can hide a ${noun}'s original registration and its history.`,
  },
];

function HiddenRisks({ reg, noun }: { reg: string; noun: string }) {
  const [askingRaw, setAskingRaw] = useState("");
  const asking = Number(askingRaw.replace(/[^0-9.]/g, ""));
  const reportPrice = CARVERTICAL_PRICING.single * (1 - CARVERTICAL_PRICING.discountPct / 100);
  const share = asking >= 500 ? (reportPrice / asking) * 100 : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm text-slate-300">
          <EyeOff className="h-4 w-4 shrink-0 text-slate-500" />
          No free check — ours included — can see these. They&apos;re the most expensive things to get wrong.
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {hiddenRisks(noun).map(({ Icon, title, why }) => (
            <li key={title} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#7da2ff]" />
              <div>
                <p className="text-sm font-medium text-slate-100">{title}</p>
                <p className="text-xs leading-relaxed text-slate-400">{why}</p>
              </div>
            </li>
          ))}
        </ul>

        <label className="mt-4 block text-xs text-slate-400" htmlFor="asking-price">
          What&apos;s the asking price? <span className="text-slate-500">(optional)</span>
        </label>
        <div className="mt-1.5 flex items-center gap-3">
          <div className="relative w-40">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
            <input
              id="asking-price"
              inputMode="numeric"
              autoComplete="off"
              value={askingRaw}
              onChange={(e) => setAskingRaw(e.target.value)}
              placeholder="8,500"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-7 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          {share !== null && (
            <p className="text-xs text-slate-300">
              A full history check is{" "}
              <strong className="text-white">
                {share < 0.1 ? "under 0.1" : share.toFixed(1)}%
              </strong>{" "}
              of the price.
            </p>
          )}
        </div>
      </div>

      <div id="full-history" className="scroll-mt-24">
        <CarVerticalReportCTA context="buyer-check-carvertical" variant="report" regNumber={reg} motorbike={noun === "motorbike"} />
      </div>
    </div>
  );
}

/* ─── Step 4: viewing checklist ──────────────────────────────────────── */

function ViewingChecklist({
  failureAreas,
  model,
  isBike,
}: {
  failureAreas: string[] | null;
  model?: string;
  isBike: boolean;
}) {
  const items = [
    isBike
      ? "Frame and engine numbers on the bike match the V5C logbook"
      : "VIN on the car (windscreen base, door pillar) matches the V5C logbook",
    "Name and address on the V5C match the seller — and you're viewing at that address",
    "Service history: stamps or invoices, with mileages that fit the MOT record",
    "Start it from cold — listen for rattles and watch for smoke",
    "Test drive at road speed: brakes pull straight, gears change cleanly, no warning lights",
    isBike ? "Both keys and the manuals" : "Two keys, the locking wheel-nut key and the manuals",
  ];
  const areas = (failureAreas ?? []).slice(0, 3);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <ClipboardList className="h-4 w-4 text-cyan-300" /> Take this with you
      </p>
      {areas.length > 0 && (
        <p className="mt-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100">
          Where {model ? `the ${model}` : "this model"} most often fails its MOT (DVSA data):{" "}
          <strong>{areas.join(", ")}</strong>. Look closely at these.
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
