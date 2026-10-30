"use client";

import { useEffect, useId, useState } from "react";
import { ArrowUp, Check, Gauge, PoundSterling, ShieldCheck, Wind, Wrench, X } from "lucide-react";
import { useScrollReveal } from "@/components/tools/useScrollReveal";
import { SAMPLE_CARS, pageSampleIndex, type MotResult, type SampleCar } from "@/components/home/sample-cars";

// What a lookup returns, shown on the homepage before anyone has searched: one
// of a handful of made-up example cars (sample-cars.ts), clearly labelled as
// such. Wide screens show it beside the hero; narrower ones show it once,
// below the search box.

// Each row's graphic sits in the same 72px slot on the right and animates in
// with the row: sample-pop (scale up), sample-grow-x (wipe from the left).
const SLOT = 72;

/** One marker per MOT: green passed first time, amber needed a retest. */
function MotMarks({ results }: { results: MotResult[] }) {
  const gap = results.length > 6 ? 3 : 5;
  const width = Math.min(7, (SLOT - gap * (results.length - 1)) / results.length);
  return (
    <div className="flex items-center" style={{ gap }}>
      {results.map((r, i) => (
        <span
          key={i}
          className={`sample-pop block h-[14px] rounded-full ${r === "pass" ? "bg-emerald-400" : "bg-amber-400"}`}
          style={{ width, animationDelay: `${450 + i * 50}ms` }}
        />
      ))}
    </div>
  );
}

/** Mileage at each MOT as a small area chart, ending on the latest reading. */
function MileageChart({ mileage }: { mileage: number[] }) {
  // Both copies of the card are in the DOM (one display:none), so the
  // gradient id must be unique per copy.
  const fillId = `sample-mileage-fill-${useId().replace(/:/g, "")}`;
  const w = SLOT;
  const h = 28;
  const max = mileage[mileage.length - 1];
  const pts = mileage.map((m, i) => [(i / Math.max(1, mileage.length - 1)) * (w - 4) + 2, h - 3 - (m / max) * (h - 8)]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[72px] h-7 overflow-visible">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(34 211 238)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="sample-grow-x" style={{ animationDelay: "550ms" }}>
        <polygon points={`2,${h} ${line} ${ex},${h}`} fill={`url(#${fillId})`} />
        <polyline points={line} fill="none" stroke="rgb(34 211 238)" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
        {pts.slice(0, -1).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="rgb(34 211 238)" />
        ))}
      </g>
      <circle cx={ex} cy={ey} r="3" fill="rgb(34 211 238)" stroke="rgb(15 23 42)" strokeWidth="1.5" className="sample-pop" style={{ animationDelay: "1000ms" }} />
    </svg>
  );
}

/** Where the car sits in its price range: the band and a marker in it. */
function ValueRange({ pos }: { pos: number }) {
  const left = 30 + pos * 42;
  return (
    <div className="relative w-[72px] h-7 flex items-center">
      <div className="w-full h-1.5 rounded-full bg-slate-700/80" />
      <div
        className="sample-grow-x absolute h-1.5 rounded-full bg-gradient-to-r from-amber-500/70 to-amber-300"
        style={{ left: "30%", width: "42%", animationDelay: "650ms" }}
      />
      <span
        className="sample-pop absolute w-3 h-3 -ml-1.5 rounded-full bg-white border-2 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
        style={{ left: `${left}%`, animationDelay: "950ms" }}
      />
    </div>
  );
}

/** Taxed, and whether it's clean enough for ULEZ. */
function TaxUlezChips({ ulez }: { ulez: boolean }) {
  const chips = [
    { label: "TAX", ok: true },
    { label: "ULEZ", ok: ulez },
  ];
  return (
    <div className="flex flex-col items-end gap-1">
      {chips.map((c, i) => (
        <span
          key={c.label}
          className={`sample-pop inline-flex items-center gap-0.5 rounded px-1.5 py-px text-[9px] font-bold tracking-wider ring-1 ${
            c.ok ? "text-emerald-300 bg-emerald-500/15 ring-emerald-500/30" : "text-red-300 bg-red-500/15 ring-red-500/40"
          }`}
          style={{ animationDelay: `${750 + i * 90}ms` }}
        >
          {c.ok ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : <X className="w-2.5 h-2.5" strokeWidth={3} />}
          {c.label}
        </span>
      ))}
    </div>
  );
}

/** Outstanding recalls: green at zero, amber otherwise. */
function RecallBadge({ open }: { open: number }) {
  const tone = open === 0 ? "ring-emerald-400/50 bg-emerald-500/10" : "ring-amber-400/60 bg-amber-500/15";
  const text = open === 0 ? "text-emerald-300" : "text-amber-300";
  return (
    <div
      className={`sample-pop w-7 h-7 rounded-full flex flex-col items-center justify-center ring-2 leading-none ${tone}`}
      style={{ animationDelay: "850ms" }}
    >
      <span className={`text-[11px] font-bold ${text}`}>{open}</span>
      <span className={`text-[6px] font-semibold uppercase tracking-wide ${text} opacity-80`}>open</span>
    </div>
  );
}

/** The year's cost, split into fuel, insurance, servicing and tax. */
function CostSplit({ split }: { split: SampleCar["costSplit"] }) {
  const colours = ["bg-cyan-400", "bg-violet-400", "bg-amber-400", "bg-sky-300"];
  return (
    <div className="sample-grow-x flex w-[72px] h-2 rounded-full overflow-hidden gap-px" style={{ animationDelay: "950ms" }}>
      {split.map((share, i) => (
        <span key={i} className={`block h-full ${colours[i]}`} style={{ width: `${share}%` }} />
      ))}
    </div>
  );
}

const RING_R = 22;
const RING_C = 2 * Math.PI * RING_R;

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r={RING_R} fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-800" />
        <circle
          cx="28"
          cy="28"
          r={RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          className={`sample-ring ${score >= 80 ? "text-emerald-400" : "text-amber-400"}`}
          style={{ strokeDasharray: RING_C, ["--ring-to" as string]: RING_C * (1 - score / 100) }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-base font-bold text-white">{score}</div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  note,
  delay,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  delay: number;
  extra?: React.ReactNode;
}) {
  return (
    <div className="sample-row flex items-center gap-3 py-2" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-100 truncate">{value}</div>
        <div className="text-xs text-slate-400 truncate">{note}</div>
      </div>
      {extra && (
        <div className="w-[72px] shrink-0 flex items-center justify-end" aria-hidden="true">
          {extra}
        </div>
      )}
    </div>
  );
}

function motNote(mot: MotResult[]): string {
  const first = mot.filter((r) => r === "pass").length;
  const tests = `${mot.length} test${mot.length === 1 ? "" : "s"}`;
  return first === mot.length ? `${tests} · all passed first time` : `${tests} · passed ${first} first time`;
}

export default function SampleResultCard({
  onTry,
  className = "",
}: {
  onTry: (car: string) => void;
  className?: string;
}) {
  // The server renders the first car; the visitor's car is picked after
  // mount (deferred, as useScrollReveal does), while everything is still
  // hidden waiting for the entrance.
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIndex(pageSampleIndex()));
    return () => cancelAnimationFrame(raf);
  }, []);
  const car = SAMPLE_CARS[index];

  // Play the entrance once, when the card is actually on screen.
  const { ref, revealed: shown } = useScrollReveal(0.25);

  return (
    <div
      ref={ref}
      className={`sample-card relative rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur shadow-[0_20px_60px_-20px_rgba(34,211,238,0.25)] p-5 ${shown ? "is-shown" : ""} ${className}`}
    >
      <style>{`
        .sample-card .sample-row { opacity: 0; transform: translateY(6px); }
        .sample-card.is-shown .sample-row { animation: sampleRowIn 0.45s ease-out forwards; }
        .sample-card .sample-pop { opacity: 0; transform: scale(0.4); transform-box: fill-box; transform-origin: center; }
        .sample-card.is-shown .sample-pop { animation: samplePop 0.35s cubic-bezier(.34,1.56,.64,1) forwards; }
        .sample-card .sample-grow-x { transform: scaleX(0); transform-box: fill-box; transform-origin: left center; }
        .sample-card.is-shown .sample-grow-x { animation: sampleGrowX 0.6s ease-out forwards; }
        .sample-card .sample-ring { stroke-dashoffset: ${RING_C}; }
        .sample-card.is-shown .sample-ring { animation: sampleRing 1.2s ease-out 0.2s forwards; }
        @keyframes sampleRowIn { to { opacity: 1; transform: none; } }
        @keyframes samplePop { to { opacity: 1; transform: none; } }
        @keyframes sampleGrowX { to { transform: none; } }
        @keyframes sampleRing { to { stroke-dashoffset: var(--ring-to); } }
        @media (prefers-reduced-motion: reduce) {
          .sample-card .sample-row, .sample-card.is-shown .sample-row { animation: none; opacity: 1; transform: none; }
          .sample-card .sample-pop, .sample-card.is-shown .sample-pop,
          .sample-card .sample-grow-x, .sample-card.is-shown .sample-grow-x { animation: none; opacity: 1; transform: none; }
          .sample-card .sample-ring, .sample-card.is-shown .sample-ring { animation: none; stroke-dashoffset: var(--ring-to); }
        }
      `}</style>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">What you&apos;ll see</span>
        <span className="text-[11px] text-slate-500">Example result</span>
      </div>

      <div className="sample-row flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="inline-block rounded-md bg-[#f6d33a] px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-slate-900">
            {car.plate}
          </div>
          <div className="mt-1.5 text-base font-semibold text-white truncate">{car.title}</div>
          <div className="text-xs text-slate-400">{car.spec}</div>
        </div>
        <div className="text-center">
          <ScoreRing score={car.score} />
          <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Health</div>
        </div>
      </div>

      <div className="mt-3 divide-y divide-slate-800/80">
        <Row
          icon={<Check className="w-4 h-4 text-emerald-400" />}
          label="MOT"
          value={`Valid until ${car.motUntil}`}
          note={motNote(car.mot)}
          delay={150}
          extra={<MotMarks results={car.mot} />}
        />
        <Row
          icon={<Gauge className="w-4 h-4 text-cyan-400" />}
          label="Mileage"
          value={`${car.mileage[car.mileage.length - 1].toLocaleString("en-GB")} miles`}
          note={car.mileageNote}
          delay={250}
          extra={<MileageChart mileage={car.mileage} />}
        />
        <Row
          icon={<PoundSterling className="w-4 h-4 text-amber-400" />}
          label="Value"
          value={car.value}
          note="Private sale, from market data"
          delay={350}
          extra={<ValueRange pos={car.valuePos} />}
        />
        <Row
          icon={<Wind className="w-4 h-4 text-sky-400" />}
          label="Tax & ULEZ"
          value={car.ulez ? "Taxed · ULEZ compliant" : "Taxed · Fails ULEZ"}
          note={car.taxNote}
          delay={450}
          extra={<TaxUlezChips ulez={car.ulez} />}
        />
        <Row
          icon={<ShieldCheck className={`w-4 h-4 ${car.openRecalls === 0 ? "text-emerald-400" : "text-amber-400"}`} />}
          label="Recalls"
          value={car.openRecalls === 0 ? "None outstanding" : `${car.openRecalls} outstanding`}
          note={car.openRecalls === 0 ? "Checked with DVSA" : "Free fix at a dealer"}
          delay={550}
          extra={<RecallBadge open={car.openRecalls} />}
        />
        <Row
          icon={<Wrench className="w-4 h-4 text-violet-400" />}
          label="Running costs"
          value={car.runningCost}
          note="Fuel, insurance and more"
          delay={650}
          extra={<CostSplit split={car.costSplit} />}
        />
      </div>

      <button
        type="button"
        onClick={() => onTry(car.id)}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
      >
        <ArrowUp className="w-4 h-4 text-cyan-400" />
        Check your own car, free
      </button>
    </div>
  );
}
