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
  previewVehicle?: LookupVehicle;
}

interface Reading {
  date: Date;
  value: number; // miles
}

interface YearlyMileage {
  /** Calendar year of the end-reading. The "miles driven in 2018" header. */
  year: number;
  /** Miles between the previous reading and the end reading. */
  miles: number;
  /** Number of days covered by the interval — surfaced when not roughly 12 months so the user can interpret unusual periods. */
  daysCovered: number;
  /** Pct above (+) or below (-) the UK-average yearly mileage. Scaled to a full-year-equivalent so short or long intervals are still comparable. */
  deltaPct: number;
  /** Date of the end reading — used as a stable React key and surfaced in the tooltip. */
  endDate: Date;
}

interface MileageAnalysis {
  readings: Reading[];
  current: number | null;
  ageYears: number | null;
  avgPerYear: number | null;
  ukAverage: number; // benchmark
  delta: number | null; // pct above/below UK avg
  clockingFlags: ClockingFlag[];
  /** Per-year mileage between consecutive readings. Empty when fewer than 2 readings exist. */
  yearly: YearlyMileage[];
}

interface ClockingFlag {
  kind: "rollback" | "implausible_jump";
  message: string;
  fromValue: number;
  toValue: number;
}

const UK_AVG_MILES_PER_YEAR = 7400; // 2025 DfT figure for cars

export default function MileageResult({ vrm, previewVehicle }: MileageResultProps) {
  const state = useVehicleLookup(previewVehicle ? "" : vrm);
  if (previewVehicle) return <Loaded vrm={vrm} vehicle={previewVehicle} />;
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
      {analysis.yearly.length > 0 && (
        <YearByYearCard analysis={analysis} />
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

/**
 * Year-by-year mileage breakdown. For most cars with annual MOTs this
 * surfaces twelve+ rows showing exactly how many miles were driven each
 * year, sorted oldest to newest, with a UK-average comparison badge.
 * Unique granularity vs every competing reg-check site we've looked at,
 * and the most-requested kind of detail from buyers checking a used car.
 */
function YearByYearCard({ analysis }: { analysis: MileageAnalysis }) {
  const { yearly, ukAverage } = analysis;
  const maxMiles = Math.max(...yearly.map((y) => y.miles), ukAverage);
  // UK-average reference line position as a percent of the bar width.
  const ukAvgPct = Math.round((ukAverage / maxMiles) * 100);

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-slate-100">Year-by-year mileage</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {yearly.length} year{yearly.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Miles driven between each MOT. Yellow line marks the UK average of{" "}
        {ukAverage.toLocaleString("en-GB")} mi/yr.
      </p>

      <div className="space-y-2">
        {yearly.map((y) => {
          const widthPct = Math.max(2, Math.round((y.miles / maxMiles) * 100));
          const aboveAvg = y.deltaPct > 0;
          const partial = y.daysCovered < 305 || y.daysCovered > 425;
          return (
            <div
              key={y.endDate.toISOString()}
              className="grid grid-cols-[3rem_1fr_auto] items-center gap-2 sm:gap-3"
            >
              <span className="font-mono text-xs sm:text-sm text-slate-400 tabular-nums">
                {y.year}
              </span>
              <div className="relative h-6 sm:h-7 rounded-md bg-slate-800/60 overflow-hidden">
                {/* The mileage bar — cyan→blue gradient matching the sparkline. */}
                <div
                  className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-cyan-500/80 to-blue-500/80 transition-all"
                  style={{ width: `${widthPct}%` }}
                />
                {/* UK average reference line — sits on top of the bar, vertical amber stripe. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 w-px bg-amber-400/70"
                  style={{ left: `${ukAvgPct}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-right">
                <span className="font-mono text-xs sm:text-sm font-semibold text-slate-100 tabular-nums tracking-tight whitespace-nowrap">
                  {y.miles.toLocaleString("en-GB")}
                  <span className="text-[10px] text-slate-500 ml-0.5">mi</span>
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    aboveAvg
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-emerald-500/10 text-emerald-300"
                  }`}
                  title={partial ? `${y.daysCovered} days covered` : undefined}
                >
                  {aboveAvg ? "+" : ""}
                  {y.deltaPct}%
                </span>
              </div>
            </div>
          );
        })}
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

  // Year-by-year miles between consecutive readings. We skip rollback
  // pairs (already flagged separately) to keep the breakdown chart
  // free of negative bars. The "year" label is the calendar year of
  // the END reading — for an annual MOT cycle this maps cleanly to
  // "miles driven during 2018" etc. deltaPct is scaled to a
  // full-year-equivalent so periods that aren't exactly 365 days
  // (skipped tests, SORN gaps, registration partial years) still
  // compare meaningfully against the UK average.
  const yearly: YearlyMileage[] = [];
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];
    const miles = curr.value - prev.value;
    if (miles < 0) continue; // rollback — covered by clocking flags
    const daysCovered = Math.max(1, daysBetween(prev.date, curr.date));
    const annualisedRate = (miles / daysCovered) * 365;
    const deltaPct = Math.round(
      ((annualisedRate - UK_AVG_MILES_PER_YEAR) / UK_AVG_MILES_PER_YEAR) * 100,
    );
    yearly.push({
      year: curr.date.getFullYear(),
      miles,
      daysCovered,
      deltaPct,
      endDate: curr.date,
    });
  }

  return {
    readings,
    current,
    ageYears,
    avgPerYear,
    ukAverage: UK_AVG_MILES_PER_YEAR,
    delta,
    clockingFlags,
    yearly,
  };
}
