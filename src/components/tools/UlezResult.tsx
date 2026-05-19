"use client";

import { useEffect, useMemo, useState } from "react";
import { Wind, Leaf, CircleCheck, CircleAlert, MapPin } from "lucide-react";
import {
  useVehicleLookup,
  LookupSkeleton,
  LookupError,
  ToolResultLayout,
  type LookupVehicle,
} from "@/components/tools/shared";
import { calculateUlezCompliance, type UlezResult as UlezData } from "@/lib/ulez";

interface UlezResultProps {
  vrm: string;
}

export default function UlezResult({ vrm }: UlezResultProps) {
  const state = useVehicleLookup(vrm);
  if (state.kind === "loading")
    return <LookupSkeleton vrm={vrm} hint="Checking clean-air zone compliance…" />;
  if (state.kind === "error")
    return <LookupError vrm={vrm} message={state.message} backHref="/ulez-check" />;
  return <Loaded vrm={vrm} vehicle={state.vehicle} />;
}

function Loaded({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const ulez: UlezData = useMemo(
    () =>
      calculateUlezCompliance({
        fuelType: vehicle.fuelType,
        euroStatus: vehicle.euroStatus,
        monthOfFirstRegistration: vehicle.monthOfFirstRegistration,
        co2Emissions: vehicle.co2Emissions,
        yearOfManufacture: vehicle.yearOfManufacture,
      }),
    [vehicle]
  );

  return (
    <ToolResultLayout vrm={vrm} vehicle={vehicle} excludePill="ulez">
      <StatusMist status={ulez.status} />
      <UlezHero ulez={ulez} />
      {ulez.cleanAirZones && ulez.cleanAirZones.length > 0 && (
        <ZonesGrid zones={ulez.cleanAirZones} status={ulez.status} />
      )}
      <Footnote />
    </ToolResultLayout>
  );
}

function StatusMist({ status }: { status: UlezData["status"] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Defer one frame so the animation fires after layout, not during SSR hydration
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (status === "unknown") return null;
  const palette = MIST_PALETTE[status];

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[70] overflow-hidden ${
        mounted ? "" : "opacity-0"
      }`}
    >
      {/* Colour wash */}
      <div
        className="absolute inset-0 mix-blend-screen animate-mist-wash"
        style={{ background: palette.wash }}
      />
      {/* Sweeping mist blob */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -left-[40vw] h-[140vh] w-[80vw] rounded-[50%] blur-3xl animate-mist-sweep"
        style={{ background: palette.blob }}
      />
      {/* Vignette edge so the centre stays readable */}
      <div className="absolute inset-0 animate-mist-wash" style={{ background: palette.edge }} />

      <style jsx>{`
        @keyframes mistWash {
          0%   { opacity: 0; }
          25%  { opacity: 1; }
          75%  { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @keyframes mistSweep {
          0%   { transform: translate(0, -50%) scale(0.9); opacity: 0; }
          30%  { opacity: 0.8; }
          70%  { opacity: 0.8; }
          100% { transform: translate(180vw, -50%) scale(1.1); opacity: 0; }
        }
        :global(.animate-mist-wash) {
          animation: mistWash 1.6s ease-out forwards;
        }
        :global(.animate-mist-sweep) {
          animation: mistSweep 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.animate-mist-wash),
          :global(.animate-mist-sweep) {
            animation-duration: 0.1s !important;
            opacity: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

const MIST_PALETTE: Record<
  "compliant" | "exempt" | "non-compliant",
  { wash: string; blob: string; edge: string }
> = {
  compliant: {
    wash: "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.18), transparent 65%)",
    blob: "radial-gradient(circle, rgba(16,185,129,0.55), rgba(34,211,238,0.25) 40%, transparent 65%)",
    edge: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(2,6,23,0.4) 100%)",
  },
  exempt: {
    wash: "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.22), transparent 65%)",
    blob: "radial-gradient(circle, rgba(34,211,238,0.6), rgba(16,185,129,0.3) 40%, transparent 65%)",
    edge: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(2,6,23,0.4) 100%)",
  },
  "non-compliant": {
    wash: "radial-gradient(circle at 50% 50%, rgba(244,63,94,0.22), transparent 65%)",
    blob: "radial-gradient(circle, rgba(244,63,94,0.6), rgba(249,115,22,0.3) 40%, transparent 65%)",
    edge: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(2,6,23,0.4) 100%)",
  },
};

function UlezHero({ ulez }: { ulez: UlezData }) {
  const skin = SKINS[ulez.status];
  const Icon = skin.icon;
  return (
    <section
      className={`relative mt-4 overflow-hidden rounded-2xl border bg-gradient-to-br ${skin.gradient} to-slate-950 p-6 sm:p-8`}
    >
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: skin.glow }} />

      <div className="relative flex items-start gap-4 sm:gap-6">
        <div
          className={`flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-2xl ${skin.iconBg} shadow-lg`}
          style={{ boxShadow: skin.iconShadow }}
        >
          <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <span>Clean-air zone status</span>
            <span className="text-slate-700">·</span>
            <span className={skin.chip}>{skin.confidenceLabel(ulez.confidence)}</span>
          </div>
          <p className={`mt-2 text-3xl sm:text-4xl font-bold tracking-tight ${skin.headline}`}>
            {skin.headlineText}
          </p>
          <p className="mt-2 text-sm text-slate-300 font-medium">{ulez.reason}</p>
          <p className="mt-1 text-sm text-slate-400 leading-relaxed">{ulez.details}</p>

          {ulez.status === "non-compliant" && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              <CircleAlert className="h-3.5 w-3.5" />
              Driving into London ULEZ on a non-compliant car: <strong>£12.50/day</strong>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ZonesGrid({
  zones,
  status,
}: {
  zones: NonNullable<UlezData["cleanAirZones"]>;
  status: UlezData["status"];
}) {
  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-100">UK clean-air zones</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {zones.length} zones
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {zones.map((z) => {
          const charged = z.carsCharged && status === "non-compliant";
          return (
            <a
              key={z.name}
              href={z.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin
                  className={`h-3.5 w-3.5 flex-shrink-0 ${
                    charged ? "text-rose-400" : "text-emerald-400"
                  }`}
                />
                <span className="text-sm font-medium text-slate-200 truncate">
                  {z.name}
                </span>
              </div>
              <span
                className={`text-xs font-semibold ${
                  charged ? "text-rose-300" : "text-emerald-300"
                }`}
              >
                {charged ? z.dailyCharge : "free"}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function Footnote() {
  return (
    <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
      Compliance is determined from the vehicle's Euro standard, fuel type and
      registration date. If your Euro standard isn't in the DVLA record we estimate
      from registration date — check the official TfL ULEZ checker for the final word.
    </p>
  );
}

const SKINS: Record<
  UlezData["status"],
  {
    gradient: string;
    glow: string;
    iconBg: string;
    iconShadow: string;
    icon: typeof Wind;
    headline: string;
    headlineText: string;
    chip: string;
    confidenceLabel: (c: UlezData["confidence"]) => string;
  }
> = {
  compliant: {
    gradient: "border-emerald-500/40 from-emerald-900/30",
    glow: "radial-gradient(circle, rgba(16,185,129,0.4), transparent 70%)",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
    iconShadow: "0 8px 24px rgba(16,185,129,0.25)",
    icon: CircleCheck,
    headline: "text-emerald-300",
    headlineText: "ULEZ compliant",
    chip: "text-emerald-400",
    confidenceLabel: (c) => (c === "confirmed" ? "Confirmed by DVLA" : "Estimated from registration"),
  },
  exempt: {
    gradient: "border-emerald-500/40 from-emerald-900/30",
    glow: "radial-gradient(circle, rgba(16,185,129,0.45), transparent 70%)",
    iconBg: "bg-gradient-to-br from-emerald-500 to-cyan-500",
    iconShadow: "0 8px 24px rgba(16,185,129,0.3)",
    icon: Leaf,
    headline: "text-emerald-300",
    headlineText: "Exempt — zero charges",
    chip: "text-emerald-400",
    confidenceLabel: () => "Confirmed",
  },
  "non-compliant": {
    gradient: "border-rose-500/40 from-rose-900/30",
    glow: "radial-gradient(circle, rgba(244,63,94,0.4), transparent 70%)",
    iconBg: "bg-gradient-to-br from-rose-500 to-orange-500",
    iconShadow: "0 8px 24px rgba(244,63,94,0.25)",
    icon: CircleAlert,
    headline: "text-rose-300",
    headlineText: "Not ULEZ compliant",
    chip: "text-rose-400",
    confidenceLabel: (c) => (c === "confirmed" ? "Confirmed by DVLA" : "Estimated from registration"),
  },
  unknown: {
    gradient: "border-slate-500/40 from-slate-800/40",
    glow: "radial-gradient(circle, rgba(148,163,184,0.3), transparent 70%)",
    iconBg: "bg-gradient-to-br from-slate-500 to-slate-700",
    iconShadow: "0 8px 24px rgba(0,0,0,0.3)",
    icon: Wind,
    headline: "text-slate-200",
    headlineText: "Compliance unclear",
    chip: "text-slate-400",
    confidenceLabel: () => "Insufficient data",
  },
};
