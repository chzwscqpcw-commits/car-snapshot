"use client";

import { useMemo } from "react";
import { Gauge, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import {
  useVehicleLookup,
  LookupSkeleton,
  LookupError,
  ToolResultLayout,
  daysBetween,
  type LookupVehicle,
  type MotTest,
} from "@/components/tools/shared";

interface MileageResultProps {
  vrm: string;
}

interface Reading {
  date: Date;
  value: number; // miles
}

interface MileageAnalysis {
  readings: Reading[];
  current: number | null;
  ageYears: number | null;
  avgPerYear: number | null;
  ukAverage: number; // benchmark
  delta: number | null; // pct above/below UK avg
  clockingFlags: ClockingFlag[];
}

interface ClockingFlag {
  kind: "rollback" | "implausible_jump";
  message: string;
  fromValue: number;
  toValue: number;
}

const UK_AVG_MILES_PER_YEAR = 7400; // 2025 DfT figure for cars

export default function MileageResult({ vrm }: MileageResultProps) {
  const state = useVehicleLookup(vrm);
  if (state.kind === "loading")
    return <LookupSkeleton vrm={vrm} hint="Reading every MOT mileage record…" />;
  if (state.kind === "error")
    return <LookupError vrm={vrm} message={state.message} backHref="/mileage-check" />;
  return <Loaded vrm={vrm} vehicle={state.vehicle} />;
}

function Loaded({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const analysis = useMemo(() => analyseMileage(vehicle), [vehicle]);

  return (
    <ToolResultLayout vrm={vrm} vehicle={vehicle} excludePill="mileage">
      <MileageHero analysis={analysis} />
      {analysis.readings.length >= 2 && (
        <SparklineCard analysis={analysis} />
      )}
      {analysis.clockingFlags.length > 0 && (
        <ClockingCard flags={analysis.clockingFlags} />
      )}
      {analysis.readings.length === 0 && <NoReadings />}
    </ToolResultLayout>
  );
}

function MileageHero({ analysis }: { analysis: MileageAnalysis }) {
  const hasReadings = analysis.current !== null;
  const aboveAvg = analysis.delta !== null && analysis.delta > 0;
  const deltaPct = analysis.delta !== null ? Math.abs(Math.round(analysis.delta * 100)) : null;
  const flagged = analysis.clockingFlags.length > 0;

  return (
    <section
      className={`relative mt-4 overflow-hidden rounded-2xl border bg-gradient-to-br to-slate-950 p-6 sm:p-8 ${
        flagged ? "border-rose-500/40 from-rose-900/30" : "border-cyan-500/30 from-cyan-900/20"
      }`}
    >
      <div
        className={`absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-30 pointer-events-none ${
          flagged ? "bg-rose-500/40" : "bg-cyan-500/40"
        }`}
      />
      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20">
          <Gauge className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Latest recorded mileage
          </div>
          {hasReadings ? (
            <>
              <OdometerDisplay value={analysis.current!} />
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {analysis.avgPerYear !== null && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300">
                    {analysis.avgPerYear.toLocaleString("en-GB")} mi/yr average
                  </span>
                )}
                {deltaPct !== null && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${
                      aboveAvg
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {aboveAvg ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {deltaPct}% {aboveAvg ? "above" : "below"} UK avg
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                UK average for cars: ~{UK_AVG_MILES_PER_YEAR.toLocaleString("en-GB")} miles per year
                (DfT 2025).
              </p>
            </>
          ) : (
            <p className="mt-2 text-xl text-slate-300">No MOT mileage records yet</p>
          )}
        </div>
      </div>
    </section>
  );
}

function OdometerDisplay({ value }: { value: number }) {
  // Pad to a minimum of 6 digits for a real-dashboard feel without overflowing
  // 7-digit cars. Geist Mono + cyan-glow text-shadow renders the digits like
  // a modern EV instrument cluster.
  const formatted = value.toLocaleString("en-GB");
  return (
    <div className="relative mt-2 inline-block">
      <div className="rounded-xl bg-gradient-to-b from-slate-700/70 via-slate-800/70 to-slate-900 p-[1px] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)]">
        <div className="relative overflow-hidden rounded-[11px] bg-gradient-to-b from-slate-950 via-[#04080f] to-slate-950 px-4 sm:px-5 pt-3 pb-2.5">
          {/* Top edge gleam */}
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          {/* Faint scan-lines for the LCD feel */}
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(34,211,238,0.035) 2px, rgba(34,211,238,0.035) 3px)",
            }}
          />
          {/* ODO label, like the corner of a real dashboard */}
          <div className="absolute top-1 left-3 text-[8px] font-semibold tracking-[0.25em] text-amber-400/70 font-[family-name:var(--font-geist-mono)]">
            ODO
          </div>
          <div className="relative flex items-baseline gap-2">
            <span
              className="font-[family-name:var(--font-geist-mono)] text-4xl sm:text-5xl font-bold text-cyan-50 tabular-nums leading-none"
              style={{
                textShadow:
                  "0 0 18px rgba(34,211,238,0.45), 0 0 3px rgba(165,243,252,0.7)",
                letterSpacing: "0.04em",
              }}
            >
              {formatted}
            </span>
            <span className="text-[11px] font-semibold tracking-[0.2em] text-cyan-400/70 font-[family-name:var(--font-geist-mono)] uppercase pb-1">
              mi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklineCard({ analysis }: { analysis: MileageAnalysis }) {
  const { readings } = analysis;
  const min = Math.min(...readings.map((r) => r.value));
  const max = Math.max(...readings.map((r) => r.value));
  const range = max - min || 1;
  const tMin = readings[0].date.getTime();
  const tMax = readings[readings.length - 1].date.getTime();
  const tRange = tMax - tMin || 1;
  const w = 600;
  const h = 140;
  const pad = 8;

  const points = readings.map((r) => {
    const x = pad + ((r.date.getTime() - tMin) / tRange) * (w - pad * 2);
    const y = h - pad - ((r.value - min) / range) * (h - pad * 2);
    return { x, y, r };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  // Build a closed area under the line for the gradient fill
  const fillPath =
    path +
    ` L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`;

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-slate-100">Mileage trajectory</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {readings.length} readings
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-32 sm:h-36"
      >
        <defs>
          <linearGradient id="mileage-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mileage-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(34,211,238)" />
            <stop offset="100%" stopColor="rgb(59,130,246)" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#mileage-fill)" />
        <path
          d={path}
          stroke="url(#mileage-stroke)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="rgb(8,145,178)"
            stroke="rgb(165,243,252)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 tabular-nums">
        <span>
          {readings[0].date.getFullYear()} · {readings[0].value.toLocaleString("en-GB")} mi
        </span>
        <span>
          {readings[readings.length - 1].date.getFullYear()} ·{" "}
          {readings[readings.length - 1].value.toLocaleString("en-GB")} mi
        </span>
      </div>
    </section>
  );
}

function ClockingCard({ flags }: { flags: ClockingFlag[] }) {
  return (
    <section className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-rose-200">
            {flags.length === 1 ? "Mileage anomaly detected" : `${flags.length} mileage anomalies detected`}
          </h3>
          <p className="mt-1 text-xs text-rose-200/80">
            These are signals worth investigating — they can indicate clocking,
            transcription errors, or major repairs.
          </p>
          <ul className="mt-3 space-y-2">
            {flags.map((f, i) => (
              <li
                key={i}
                className="rounded-lg border border-rose-500/20 bg-rose-950/40 px-3 py-2 text-xs text-rose-100"
              >
                <span className="font-semibold mr-1">
                  {f.kind === "rollback" ? "Rollback:" : "Implausible jump:"}
                </span>
                {f.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function NoReadings() {
  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 text-sm text-slate-400">
      No MOT mileage readings yet — this is normal for vehicles under three years old.
      The full report has manufacturer data and ownership context if available.
    </section>
  );
}

function analyseMileage(vehicle: LookupVehicle): MileageAnalysis {
  const tests = vehicle.motTests ?? [];
  const readings: Reading[] = tests
    .filter((t): t is MotTest & { odometer: { value: number; unit: string } } =>
      Boolean(t.odometer)
    )
    .map((t) => {
      let miles = t.odometer.value;
      if (t.odometer.unit?.toUpperCase() === "KM") miles = Math.round(miles * 0.621371);
      return { date: new Date(t.completedDate), value: miles };
    })
    .filter((r) => !Number.isNaN(r.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const current = readings.length > 0 ? readings[readings.length - 1].value : null;

  let ageYears: number | null = null;
  if (vehicle.yearOfManufacture) {
    ageYears = new Date().getFullYear() - vehicle.yearOfManufacture;
  }
  const avgPerYear =
    current !== null && ageYears !== null && ageYears > 0
      ? Math.round(current / ageYears)
      : null;
  const delta =
    avgPerYear !== null ? (avgPerYear - UK_AVG_MILES_PER_YEAR) / UK_AVG_MILES_PER_YEAR : null;

  // Clocking detection
  const clockingFlags: ClockingFlag[] = [];
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];
    if (curr.value < prev.value) {
      clockingFlags.push({
        kind: "rollback",
        message: `${prev.value.toLocaleString("en-GB")} mi (${prev.date.toLocaleDateString(
          "en-GB",
          { month: "short", year: "numeric" }
        )}) → ${curr.value.toLocaleString("en-GB")} mi (${curr.date.toLocaleDateString(
          "en-GB",
          { month: "short", year: "numeric" }
        )})`,
        fromValue: prev.value,
        toValue: curr.value,
      });
      continue;
    }
    // Implausible jump: > 40k miles between two consecutive MOTs
    const gapDays = daysBetween(prev.date, curr.date);
    const milesAdded = curr.value - prev.value;
    if (gapDays > 0 && gapDays < 400 && milesAdded > 40000) {
      clockingFlags.push({
        kind: "implausible_jump",
        message: `+${milesAdded.toLocaleString("en-GB")} mi between ${prev.date.toLocaleDateString(
          "en-GB",
          { month: "short", year: "numeric" }
        )} and ${curr.date.toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        })} (${gapDays} day${gapDays === 1 ? "" : "s"})`,
        fromValue: prev.value,
        toValue: curr.value,
      });
    }
  }

  return {
    readings,
    current,
    ageYears,
    avgPerYear,
    ukAverage: UK_AVG_MILES_PER_YEAR,
    delta,
    clockingFlags,
  };
}
