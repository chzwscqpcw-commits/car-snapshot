"use client";

import { useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  ArrowRight,
  ChevronDown,
  History,
  Bell,
} from "lucide-react";
import {
  useVehicleLookup,
  LookupSkeleton,
  LookupError,
  ToolResultLayout,
  daysBetween,
  formatLongDate,
  type LookupVehicle,
  type MotTest,
} from "@/components/tools/shared";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
import { odometerMiles } from "@/lib/valuation";
import MOTReminderSignup from "@/components/MOTReminderSignup";

interface MotResultProps {
  vrm: string;
  previewVehicle?: LookupVehicle;
}

interface MotStats {
  total: number;
  passed: number;
  failed: number;
  passRate: number | null; // 0..1
  latest: MotTest | null;
  nextExpiry: Date | null;
  daysToExpiry: number | null;
  advisoryPreview: string[];
  defectPreview: string[];
}

export default function MotResult({ vrm, previewVehicle }: MotResultProps) {
  const state = useVehicleLookup(previewVehicle ? "" : vrm);
  if (previewVehicle) return <Loaded vrm={vrm} vehicle={previewVehicle} />;
  if (state.kind === "loading")
    return <LookupSkeleton vrm={vrm} hint="Reading the MOT history…" />;
  if (state.kind === "error")
    return <LookupError vrm={vrm} message={state.message} backHref="/mot-check" />;
  return <Loaded vrm={vrm} vehicle={state.vehicle} />;
}

function Loaded({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const stats = useMemo(() => analyse(vehicle), [vehicle]);
  const tests = useMemo(
    () =>
      [...(vehicle.motTests ?? [])]
        .filter((t) => t.testResult === "PASSED" || t.testResult === "FAILED")
        .sort(
          (a, b) =>
            new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
        ),
    [vehicle]
  );
  return (
    <ToolResultLayout vrm={vrm} vehicle={vehicle} excludePill="mot">
      <Hero stats={stats} vrm={vrm} />
      {stats.advisoryPreview.length > 0 && (
        <AdvisoryPreview items={stats.advisoryPreview} kind="advisory" />
      )}
      {stats.defectPreview.length > 0 && (
        <AdvisoryPreview items={stats.defectPreview} kind="defect" />
      )}
      {tests.length >= 2 && <YearlyTrackRecord tests={tests} />}
      {tests.length > 0 && <FullHistory tests={tests} />}
      <ReminderHook vrm={vrm} vehicle={vehicle} />
      <BmgHook vrm={vrm} stats={stats} />
    </ToolResultLayout>
  );
}

/**
 * Year-by-year track record — for cars with multiple MOTs, surface
 * the pattern. Each row is one calendar year of testing, showing
 * pass/fail outcome and advisory/defect counts. Worsening patterns
 * (e.g. 2 advisories in 2022, 5 in 2023, 8 in 2024) are exactly the
 * kind of signal buyers want surfaced before they look at the full
 * chronological history. Hidden when there's only one test — a
 * one-row "trend" is a non-statement.
 */
function YearlyTrackRecord({ tests }: { tests: MotTest[] }) {
  // tests are sorted newest-first by Loaded(). Reverse for chronological
  // display so the visual reads left-to-right in time.
  const ordered = [...tests].sort(
    (a, b) =>
      new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime(),
  );
  const rows = ordered.map((t) => {
    const d = new Date(t.completedDate);
    const advisories = t.rfrAndComments?.filter((r) => r.type === "ADVISORY").length ?? 0;
    const defects = t.rfrAndComments?.filter((r) => r.type === "DEFECT").length ?? 0;
    return {
      key: t.motTestNumber ?? t.completedDate,
      year: d.getFullYear(),
      passed: t.testResult === "PASSED",
      advisories,
      defects,
      noteCount: advisories + defects,
    };
  });
  const maxNotes = Math.max(1, ...rows.map((r) => r.noteCount));

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-slate-100">Track record by year</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {rows.length} test{rows.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Outcome and issue count for each MOT. Trend reads left-to-right (oldest to newest).
      </p>

      <div className="space-y-2">
        {rows.map((row) => {
          const widthPct = Math.max(3, Math.round((row.noteCount / maxNotes) * 100));
          return (
            <div
              key={row.key}
              className="grid grid-cols-[3rem_5rem_1fr_auto] items-center gap-2 sm:gap-3"
            >
              <span className="font-mono text-xs sm:text-sm text-slate-400 tabular-nums">
                {row.year}
              </span>
              <span
                className={`inline-flex justify-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                  row.passed
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                }`}
              >
                {row.passed ? "Pass" : "Fail"}
              </span>
              <div className="relative h-5 sm:h-6 rounded-md bg-slate-800/60 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-md transition-all ${
                    row.defects > 0
                      ? "bg-gradient-to-r from-rose-500/70 to-amber-500/70"
                      : row.advisories > 0
                      ? "bg-gradient-to-r from-amber-500/60 to-amber-400/60"
                      : "bg-emerald-500/40"
                  }`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="text-[11px] font-medium tabular-nums tracking-tight whitespace-nowrap text-slate-300">
                {row.advisories > 0 && (
                  <span className="text-amber-300">
                    {row.advisories} adv
                  </span>
                )}
                {row.advisories > 0 && row.defects > 0 && (
                  <span className="text-slate-600 mx-1">·</span>
                )}
                {row.defects > 0 && (
                  <span className="text-rose-300">
                    {row.defects} def
                  </span>
                )}
                {row.advisories === 0 && row.defects === 0 && (
                  <span className="text-emerald-300">Clean</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FullHistory({ tests }: { tests: MotTest[] }) {
  return (
    <section className="mt-4 group rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <details className="[&[open]>summary>svg.chev]:rotate-180">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-slate-900/80 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-cyan-300">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Full MOT history ({tests.length} tests)
              </h3>
              <p className="text-xs text-slate-500">
                Every test, every advisory, every defect — chronological.
              </p>
            </div>
          </div>
          <ChevronDown className="chev h-4 w-4 text-slate-500 transition-transform" />
        </summary>
        <div className="border-t border-slate-800 px-2 sm:px-4 py-3 space-y-3">
          {tests.map((t, i) => (
            <TestCard key={t.motTestNumber ?? `${t.completedDate}-${i}`} test={t} />
          ))}
        </div>
      </details>
    </section>
  );
}

function TestCard({ test }: { test: MotTest }) {
  const passed = test.testResult === "PASSED";
  const advisories = test.rfrAndComments?.filter((r) => r.type === "ADVISORY") ?? [];
  const defects = test.rfrAndComments?.filter((r) => r.type === "DEFECT") ?? [];
  const date = new Date(test.completedDate);
  const dateLabel = !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : test.completedDate;
  return (
    <article
      className={`rounded-xl border p-4 ${
        passed
          ? "border-emerald-500/15 bg-emerald-950/10"
          : "border-rose-500/25 bg-rose-950/20"
      }`}
    >
      <header className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-100">{dateLabel}</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
              passed
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-300 border-rose-500/30"
            }`}
          >
            {test.testResult}
          </span>
          {test.odometer && (
            <span className="text-xs text-slate-400 tabular-nums">
              {test.odometer.value.toLocaleString("en-GB")}{" "}
              {test.odometer.unit?.toUpperCase() === "KM" ? "km" : "mi"}
            </span>
          )}
        </div>
        {test.motTestNumber && (
          <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
            #{test.motTestNumber}
          </span>
        )}
      </header>

      {defects.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-300 mb-1">
            Defects ({defects.length})
          </p>
          <ul className="space-y-1">
            {defects.map((d, i) => (
              <li key={i} className="text-xs text-rose-100/90 flex gap-1.5">
                <span className="text-rose-400 mt-0.5">•</span>
                <span className="leading-relaxed">{d.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {advisories.length > 0 && (
        <div className="mt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 mb-1">
            Advisories ({advisories.length})
          </p>
          <ul className="space-y-1">
            {advisories.map((a, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                <span className="leading-relaxed">{a.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {advisories.length === 0 && defects.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">No advisories or defects recorded.</p>
      )}
    </article>
  );
}

function Hero({ stats, vrm }: { stats: MotStats; vrm: string }) {
  const passing = (stats.passRate ?? 1) >= 0.8;
  const colour = passing ? "emerald" : "amber";
  const tone = TONES[colour];
  const passPct = stats.passRate !== null ? Math.round(stats.passRate * 100) : null;

  return (
    <section
      className={`relative mt-4 overflow-hidden rounded-2xl border bg-gradient-to-br ${tone.border} ${tone.bg} to-slate-950 p-6 sm:p-8`}
    >
      <div
        className={`absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-30 pointer-events-none ${tone.glow}`}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
        {/* Pass-rate ring */}
        <PassRing percent={passPct} colour={colour} />

        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            MOT history
          </div>
          {stats.total > 0 ? (
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {stats.passed} of {stats.total} tests passed
            </p>
          ) : (
            <p className="mt-1 text-xl text-slate-300">No MOT tests yet</p>
          )}

          {stats.nextExpiry && (
            <div className="mt-3 flex flex-wrap items-baseline gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300">
                <Calendar className="h-3 w-3" />
                Next due {formatLongDate(stats.nextExpiry.toISOString())}
              </span>
              {stats.daysToExpiry !== null && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    stats.daysToExpiry < 0
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      : stats.daysToExpiry <= 30
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {stats.daysToExpiry < 0
                    ? `Expired ${Math.abs(stats.daysToExpiry)}d ago`
                    : stats.daysToExpiry === 0
                    ? "Due today"
                    : `${stats.daysToExpiry} days`}
                </span>
              )}
            </div>
          )}

          {stats.latest && (
            <p className="mt-2 text-sm text-slate-400">
              Latest test:{" "}
              <span
                className={`font-semibold ${
                  stats.latest.testResult === "PASSED"
                    ? "text-emerald-300"
                    : "text-rose-300"
                }`}
              >
                {stats.latest.testResult}
              </span>{" "}
              · {formatLongDate(stats.latest.completedDate)}
              {odometerMiles(stats.latest.odometer) != null &&
                ` · ${odometerMiles(stats.latest.odometer)!.toLocaleString("en-GB")} mi`}
            </p>
          )}
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
        <Stat label="Passed" value={stats.passed} tone="emerald" />
        <Stat label="Failed" value={stats.failed} tone="rose" />
        <Stat label="Pass rate" value={passPct !== null ? `${passPct}%` : "—"} />
      </div>

      <p className="sr-only">Vehicle reg: {vrm}</p>
    </section>
  );
}

function PassRing({
  percent,
  colour,
}: {
  percent: number | null;
  colour: "emerald" | "amber";
}) {
  const size = 88;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const value = percent ?? 0;
  const dash = C * (value / 100);

  const gradFrom = colour === "emerald" ? "rgb(16,185,129)" : "rgb(245,158,11)";
  const gradTo = colour === "emerald" ? "rgb(34,211,238)" : "rgb(244,63,94)";

  return (
    <div className="relative flex h-[88px] w-[88px] flex-shrink-0 items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`pass-ring-${colour}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradFrom} />
            <stop offset="100%" stopColor={gradTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgb(30,41,59)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#pass-ring-${colour})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="relative text-center">
        {percent === null ? (
          <span className="text-xs text-slate-500">N/A</span>
        ) : (
          <>
            <span
              className={`block text-xl font-bold ${
                colour === "emerald" ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {percent}%
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-500">
              pass
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "emerald" | "rose";
}) {
  const colour =
    tone === "emerald" ? "text-emerald-300" : tone === "rose" ? "text-rose-300" : "text-slate-200";
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${colour}`}>{value}</p>
    </div>
  );
}

function AdvisoryPreview({
  items,
  kind,
}: {
  items: string[];
  kind: "advisory" | "defect";
}) {
  const isAdvisory = kind === "advisory";
  return (
    <section
      className={`mt-4 rounded-2xl border p-5 sm:p-6 ${
        isAdvisory
          ? "border-amber-500/30 bg-amber-950/20"
          : "border-rose-500/40 bg-rose-950/25"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className={`text-sm font-semibold ${isAdvisory ? "text-amber-200" : "text-rose-200"}`}>
          {isAdvisory ? "Recent advisories" : "Recent defects"}
        </h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {items.length} {items.length === 1 ? "item" : "items"} · latest test
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.slice(0, 4).map((t, i) => (
          <li key={i} className="text-xs text-slate-300 flex gap-2">
            <span className={isAdvisory ? "text-amber-400" : "text-rose-400"}>•</span>
            <span className="leading-relaxed">{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Free email MOT-reminder capture on the MOT-check result — the highest-intent
 * moment (the user is looking at this car's MOT history + next-due date) but
 * previously had no reminder ask, only the paid BmgHook. The reg is known, so
 * this is an email-only (`hideReg`) one-tap ask, with a no-email "add to
 * calendar" fallback (`showCalendar`). Placed BEFORE BmgHook so the free action
 * leads and the paid booking follows. Fires mot_reminder tagged
 * triggerVariant="mot_result" so this surface is measurable in Supabase.
 */
function ReminderHook({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const makeModel = vehicle.make
    ? `${vehicle.make}${vehicle.model ? ` ${vehicle.model}` : ""}`
    : undefined;
  return (
    <section className="mt-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-slate-900/70 to-slate-900 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 flex-shrink-0 text-emerald-300 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">
            Never miss {vrm}&apos;s next MOT
          </h3>
          <p className="mt-1 mb-3 text-xs text-slate-400 leading-relaxed">
            Set a free email reminder — we&apos;ll nudge you in good time to test
            early and keep the renewal date. No signup, unsubscribe any time.
          </p>
          <MOTReminderSignup
            context="post-lookup"
            triggerVariant="mot_result"
            regNumber={vrm}
            motExpiryDate={vehicle.motExpiryDate}
            makeModel={makeModel}
            compact
            hideReg
            showCalendar
          />
        </div>
      </div>
    </section>
  );
}

function BmgHook({ vrm, stats }: { vrm: string; stats: MotStats }) {
  const urgent =
    stats.daysToExpiry !== null && stats.daysToExpiry <= 30;
  const href = PARTNER_LINKS.bookMyGarage.buildLink?.(vrm, "mot-result-bmg-hook") ?? PARTNER_LINKS.bookMyGarage.url;
  const rel = getPartnerRel(PARTNER_LINKS.bookMyGarage);
  return (
    <section
      className={`mt-4 rounded-2xl border p-5 sm:p-6 ${
        urgent
          ? "border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/70 to-slate-900"
          : "border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900/70 to-slate-900"
      }`}
    >
      <div className="flex items-start gap-3">
        {urgent ? (
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-300 mt-0.5" />
        ) : (
          <ShieldCheck className="h-5 w-5 flex-shrink-0 text-cyan-300 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">
            {urgent
              ? `Book ${vrm}'s MOT — due in ${
                  stats.daysToExpiry === null ? "—" : Math.max(0, stats.daysToExpiry)
                } days`
              : `Compare MOT prices for ${vrm}`}
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            BookMyGarage shows local prices and availability — your reg is pre-loaded,
            no booking fee, no obligation.
          </p>
          <a
            href={href}
            target="_blank"
            rel={rel}
            onClick={() => trackPartnerClick("bookMyGarage", "mot-result-bmg-hook")}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-md shadow-cyan-500/20"
          >
            Compare quotes for {vrm}
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  );
}

const TONES = {
  emerald: {
    border: "border-emerald-500/40",
    bg: "from-emerald-900/25",
    glow: "bg-emerald-500/30",
  },
  amber: {
    border: "border-amber-500/40",
    bg: "from-amber-900/25",
    glow: "bg-amber-500/30",
  },
} as const;

function analyse(vehicle: LookupVehicle): MotStats {
  const tests = (vehicle.motTests ?? [])
    .filter((t) => t.testResult === "PASSED" || t.testResult === "FAILED")
    .sort(
      (a, b) =>
        new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
    );
  const passed = tests.filter((t) => t.testResult === "PASSED").length;
  const failed = tests.filter((t) => t.testResult === "FAILED").length;
  const total = tests.length;
  const passRate = total > 0 ? passed / total : null;
  const latest = tests[0] ?? null;

  let nextExpiry: Date | null = null;
  if (vehicle.motExpiryDate) {
    const d = new Date(vehicle.motExpiryDate);
    if (!Number.isNaN(d.getTime())) nextExpiry = d;
  }
  if (!nextExpiry && latest?.expiryDate) {
    const d = new Date(latest.expiryDate);
    if (!Number.isNaN(d.getTime())) nextExpiry = d;
  }
  const daysToExpiry = nextExpiry ? daysBetween(new Date(), nextExpiry) : null;

  const advisoryPreview =
    latest?.rfrAndComments
      ?.filter((r) => r.type === "ADVISORY")
      .map((r) => r.text) ?? [];
  const defectPreview =
    latest?.rfrAndComments
      ?.filter((r) => r.type === "DEFECT")
      .map((r) => r.text) ?? [];

  return {
    total,
    passed,
    failed,
    passRate,
    latest,
    nextExpiry,
    daysToExpiry,
    advisoryPreview,
    defectPreview,
  };
}
