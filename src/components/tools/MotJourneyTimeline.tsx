"use client";

import { useMemo } from "react";
import { odometerMiles } from "@/lib/valuation";
import type { MotTest } from "@/components/tools/shared";
import { useScrollReveal } from "@/components/tools/useScrollReveal";

/**
 * MOT journey — replaces the old per-year bar chart (whose length encoded
 * nothing useful: one advisory rendered as a full amber bar while a flawless
 * year was a tiny sliver). Instead, one node per test on a timeline, coloured by
 * outcome, with the advisory/defect count and mileage at each stop — so the
 * car's whole MOT story reads at a glance.
 *
 * The buildup is the point: on scroll-into-view the connecting line draws across
 * (left→right on desktop, top→down on mobile) and each node pops in as the line
 * reaches it, finishing on the latest test as a pulsing beacon. Desktop is a
 * horizontal rail; mobile is a vertical stepper (8 nodes never get crammed into
 * a phone width). Honours prefers-reduced-motion: everything just appears.
 */

type Outcome = "clean" | "advisory" | "fail";

type Stop = {
  key: string;
  year: number;
  passed: boolean;
  advisories: number;
  defects: number;
  outcome: Outcome;
  mileageShort: string | null; // "45k"
  mileageFull: string | null; // "45,102 mi"
  isLatest: boolean;
};

const COLOR: Record<Outcome, { dot: string; glow: string; text: string }> = {
  clean: { dot: "bg-emerald-400", glow: "bg-emerald-400/30", text: "text-emerald-300" },
  advisory: { dot: "bg-amber-400", glow: "bg-amber-400/30", text: "text-amber-300" },
  fail: { dot: "bg-rose-500", glow: "bg-rose-500/30", text: "text-rose-300" },
};

const DRAW_MS = 950; // total line-draw duration; node i pops as the line reaches it

function buildStops(tests: MotTest[]): Stop[] {
  const ordered = [...tests].sort(
    (a, b) => new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime(),
  );
  return ordered.map((t, i) => {
    const advisories = t.rfrAndComments?.filter((r) => r.type === "ADVISORY").length ?? 0;
    const defects = t.rfrAndComments?.filter((r) => r.type === "DEFECT").length ?? 0;
    const passed = t.testResult === "PASSED";
    const outcome: Outcome = !passed ? "fail" : advisories + defects > 0 ? "advisory" : "clean";
    const mi = odometerMiles(t.odometer);
    return {
      key: t.motTestNumber ?? `${t.completedDate}-${i}`,
      year: new Date(t.completedDate).getFullYear(),
      passed,
      advisories,
      defects,
      outcome,
      mileageShort: mi != null ? (mi >= 1000 ? `${Math.round(mi / 1000)}k` : `${mi}`) : null,
      mileageFull: mi != null ? `${mi.toLocaleString("en-GB")} mi` : null,
      isLatest: i === ordered.length - 1,
    };
  });
}

/** Outcome text: "Clean" / "2 adv" / "1 adv · 1 def" / "Fail". */
function OutcomeLabel({ stop, className = "" }: { stop: Stop; className?: string }) {
  const c = COLOR[stop.outcome];
  if (stop.outcome === "fail") {
    return <span className={`font-medium ${c.text} ${className}`}>Fail</span>;
  }
  if (stop.advisories === 0 && stop.defects === 0) {
    return <span className={`font-medium ${c.text} ${className}`}>Clean</span>;
  }
  return (
    <span className={`font-medium tabular-nums ${className}`}>
      {stop.advisories > 0 && <span className="text-amber-300">{stop.advisories} adv</span>}
      {stop.advisories > 0 && stop.defects > 0 && <span className="mx-1 text-slate-600">·</span>}
      {stop.defects > 0 && <span className="text-rose-300">{stop.defects} def</span>}
    </span>
  );
}

export default function MotJourneyTimeline({ tests }: { tests: MotTest[] }) {
  const stops = useMemo(() => buildStops(tests), [tests]);
  const { ref, revealed, reduced } = useScrollReveal(0.35);

  const n = stops.length;
  const inset = `${50 / n}%`; // line spans first node-centre → last node-centre
  const delay = (i: number) => (reduced ? 0 : Math.round((i / Math.max(1, n - 1)) * DRAW_MS));

  return (
    <section
      ref={ref}
      aria-label="MOT journey timeline"
      className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6"
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-100">MOT journey</h3>
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {n} test{n === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mb-5 text-xs text-slate-500">
        Every test, oldest to newest — outcome and mileage at each stop.
      </p>

      {/* ── Desktop: horizontal rail ─────────────────────────────── */}
      <div className="hidden sm:block">
        <div className="relative flex items-center py-2">
          <div
            aria-hidden="true"
            className="absolute top-1/2 z-0 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-emerald-500/40 ease-out"
            style={{
              left: inset,
              right: inset,
              transformOrigin: "left",
              transform: `scaleX(${revealed ? 1 : 0})`,
              transition: `transform ${DRAW_MS}ms ease-out`,
            }}
          />
          {stops.map((s, i) => {
            const c = COLOR[s.outcome];
            return (
              <div key={s.key} className="relative z-10 flex flex-1 items-center justify-center">
                {/* soft glow */}
                <span
                  className={`absolute rounded-full blur-md ${c.glow} ${s.isLatest ? "h-9 w-9" : "h-6 w-6"}`}
                  style={{ opacity: revealed ? 1 : 0, transition: `opacity 500ms ease-out ${delay(i)}ms` }}
                />
                {/* beacon on the latest node */}
                {s.isLatest && revealed && !reduced && (
                  <span
                    className={`absolute h-5 w-5 rounded-full ${c.dot} opacity-60 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite]`}
                  />
                )}
                {/* node */}
                <span
                  className={`relative rounded-full ring-4 ring-slate-900 ${c.dot} ${s.isLatest ? "h-5 w-5" : "h-3.5 w-3.5"}`}
                  style={{
                    transform: revealed ? "scale(1)" : "scale(0)",
                    opacity: revealed ? 1 : 0,
                    transition: `transform 320ms cubic-bezier(0.34,1.56,0.64,1) ${delay(i)}ms, opacity 220ms ease-out ${delay(i)}ms`,
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* labels under each node */}
        <div className="mt-2.5 flex">
          {stops.map((s, i) => (
            <div
              key={s.key}
              className="flex flex-1 flex-col items-center gap-0.5 text-center"
              style={{ opacity: revealed ? 1 : 0, transition: `opacity 500ms ease-out ${delay(i) + 140}ms` }}
            >
              <span className="font-mono text-xs tabular-nums text-slate-300">{s.year}</span>
              <OutcomeLabel stop={s} className="text-[11px]" />
              {s.mileageShort && (
                <span className="text-[10px] tabular-nums text-slate-500">{s.mileageShort}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: vertical stepper ─────────────────────────────── */}
      <ol className="relative sm:hidden">
        <div
          aria-hidden="true"
          className="absolute left-[8px] top-2 bottom-2 z-0 w-[3px] rounded-full bg-gradient-to-b from-emerald-500/40 via-cyan-500/40 to-emerald-500/40 ease-out"
          style={{
            transformOrigin: "top",
            transform: `scaleY(${revealed ? 1 : 0})`,
            transition: `transform ${DRAW_MS}ms ease-out`,
          }}
        />
        {stops.map((s, i) => {
          const c = COLOR[s.outcome];
          return (
            <li
              key={s.key}
              className="relative flex items-center gap-3 py-1.5"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateX(0)" : "translateX(-6px)",
                transition: `opacity 400ms ease-out ${delay(i)}ms, transform 400ms cubic-bezier(0.34,1.56,0.64,1) ${delay(i)}ms`,
              }}
            >
              <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center">
                {s.isLatest && revealed && !reduced && (
                  <span
                    className={`absolute h-4 w-4 rounded-full ${c.dot} opacity-60 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite]`}
                  />
                )}
                <span className={`relative rounded-full ring-4 ring-slate-900 ${c.dot} ${s.isLatest ? "h-4 w-4" : "h-3 w-3"}`} />
              </span>
              <div className="flex flex-1 items-baseline justify-between gap-2 border-b border-slate-800/70 pb-1.5">
                <span className="font-mono text-sm tabular-nums text-slate-300">{s.year}</span>
                <div className="flex items-center gap-2 text-xs">
                  <OutcomeLabel stop={s} />
                  {s.mileageFull && (
                    <span className="tabular-nums text-slate-500">{s.mileageFull}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Clean pass</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Advisory</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Fail</span>
      </div>
    </section>
  );
}
