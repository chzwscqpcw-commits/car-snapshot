"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Wrench,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  useVehicleLookup,
  LookupSkeleton,
  LookupError,
  ToolResultLayout,
  formatLongDate,
  type LookupVehicle,
} from "@/components/tools/shared";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
import type { Recall } from "@/lib/recalls";

interface RecallResultProps {
  vrm: string;
  previewVehicle?: LookupVehicle;
}

type RecallState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; recalls: Recall[] }
  | { kind: "error"; message: string };

export default function RecallResult({ vrm, previewVehicle }: RecallResultProps) {
  const vehicleState = useVehicleLookup(previewVehicle ? "" : vrm);
  if (previewVehicle) return <Loaded vrm={vrm} vehicle={previewVehicle} />;
  if (vehicleState.kind === "loading")
    return <LookupSkeleton vrm={vrm} hint="Reading vehicle details…" />;
  if (vehicleState.kind === "error")
    return <LookupError vrm={vrm} message={vehicleState.message} backHref="/recall-check" />;
  return <Loaded vrm={vrm} vehicle={vehicleState.vehicle} />;
}

function Loaded({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const [state, setState] = useState<RecallState>({ kind: "idle" });

  useEffect(() => {
    if (!vehicle.make) {
      // Early-exit state for the recalls fetch this effect performs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ kind: "ok", recalls: [] });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    const params = new URLSearchParams();
    params.set("make", vehicle.make);
    if (vehicle.model) params.set("model", vehicle.model);
    if (vehicle.yearOfManufacture) params.set("year", String(vehicle.yearOfManufacture));

    fetch(`/api/recalls?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Recall service unavailable — try again in a moment.");
        const data = (await r.json()) as Recall[];
        if (!cancelled) setState({ kind: "ok", recalls: data });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ kind: "error", message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [vehicle.make, vehicle.model, vehicle.yearOfManufacture]);

  return (
    <ToolResultLayout
      vrm={vrm}
      vehicle={vehicle}
      excludePill="recall"
      revealPitch="Recalls are just one layer — the full report adds MOT history, ULEZ, valuation, running costs and more."
    >
      <Hero state={state} vrm={vrm} />
      {state.kind === "ok" && state.recalls.length > 0 && (
        <RecallList recalls={state.recalls} />
      )}
      {state.kind === "ok" && state.recalls.length > 0 && (
        <BmgHook vrm={vrm} />
      )}
    </ToolResultLayout>
  );
}

function Hero({ state, vrm }: { state: RecallState; vrm: string }) {
  if (state.kind === "loading" || state.kind === "idle") {
    return (
      <section className="relative mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
          Searching DVSA recall database…
        </div>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section className="relative mt-4 overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-amber-200">
              Couldn&#39;t reach the recall service
            </h2>
            <p className="mt-1 text-sm text-amber-200/80">{state.message}</p>
          </div>
        </div>
      </section>
    );
  }

  const clear = state.recalls.length === 0;
  const tone = clear ? CLEAR : OPEN;
  const Icon = tone.icon;
  return (
    <section
      className={`relative mt-4 overflow-hidden rounded-2xl border ${tone.border} bg-gradient-to-br ${tone.bg} to-slate-950 p-6 sm:p-8`}
    >
      <div className={`absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-30 pointer-events-none ${tone.glow}`} />

      <div className="relative flex items-start gap-4 sm:gap-6">
        <div
          className={`flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-2xl ${tone.iconBg} shadow-lg`}
          style={{ boxShadow: tone.iconShadow }}
        >
          <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Safety recall status
          </div>
          {clear ? (
            <>
              <p className="mt-2 text-3xl sm:text-4xl font-bold text-emerald-300 tracking-tight">
                All clear
              </p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                No open DVSA safety recalls match this vehicle&#39;s make
                {state.recalls.length > 0 ? "" : ", model"} and year. We check the official
                UK recalls database, refreshed weekly.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-3xl sm:text-4xl font-bold text-rose-300 tracking-tight">
                {state.recalls.length} open recall
                {state.recalls.length === 1 ? "" : "s"}
              </p>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Manufacturer repairs are free for the life of the vehicle. Contact a
                franchised dealer with {vrm} to get the work booked in — no charge to you.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function RecallList({ recalls }: { recalls: Recall[] }) {
  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-slate-100 mb-3">Open recalls</h3>
      <ul className="space-y-3">
        {recalls.map((r) => (
          <li
            key={r.recallNumber}
            className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <p className="text-sm font-semibold text-rose-100 leading-snug">
                {r.defect}
              </p>
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
                {formatLongDate(r.recallDate)}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Remedy:</span> {r.remedy}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-500 font-mono">
              {r.recallNumber}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
        Match is based on make, model and year — your individual VIN may or may not be
        affected. Confirm with a franchised dealer before assuming the work is required.{" "}
        <a
          href="https://www.gov.uk/check-vehicle-recall"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-cyan-300 inline-flex items-center gap-0.5"
        >
          GOV.UK recall checker
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </p>
    </section>
  );
}

function BmgHook({ vrm }: { vrm: string }) {
  const href = PARTNER_LINKS.bookMyGarageRepair.buildLink?.(vrm, "recall-result-bmg-hook") ?? PARTNER_LINKS.bookMyGarageRepair.url;
  const rel = getPartnerRel(PARTNER_LINKS.bookMyGarageRepair);
  return (
    <section className="mt-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900/70 to-slate-900 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Wrench className="h-5 w-5 flex-shrink-0 text-cyan-300 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">
            Get this checked at a trusted garage
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Recalls are best handled by a franchised dealer (free), but if you&#39;d like a
            second opinion or an unrelated repair quote, BookMyGarage compares local
            prices with {vrm} pre-loaded.
          </p>
          <a
            href={href}
            target="_blank"
            rel={rel}
            onClick={() => trackPartnerClick("bookMyGarageRepair", "recall-result-bmg-hook")}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition-colors"
          >
            Compare repair quotes for {vrm}
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  );
}

const CLEAR = {
  border: "border-emerald-500/40",
  bg: "from-emerald-900/25",
  glow: "bg-emerald-500/30",
  iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
  iconShadow: "0 8px 24px rgba(16,185,129,0.25)",
  icon: ShieldCheck,
};

const OPEN = {
  border: "border-rose-500/40",
  bg: "from-rose-900/25",
  glow: "bg-rose-500/30",
  iconBg: "bg-gradient-to-br from-rose-500 to-orange-500",
  iconShadow: "0 8px 24px rgba(244,63,94,0.25)",
  icon: AlertTriangle,
};
