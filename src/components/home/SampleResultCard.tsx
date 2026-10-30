"use client";

import { ArrowUp, Check, Gauge, PoundSterling, ShieldCheck, Wind, Wrench } from "lucide-react";
import { useScrollReveal } from "@/components/tools/useScrollReveal";

// What a lookup returns, shown on the homepage before anyone has searched: a
// made-up example car, clearly labelled as one. Desktop puts it in a sticky
// rail beside the hero; mobile shows it once, below the search box.

const MILEAGE = [8200, 15600, 22900, 29400, 35800, 41250]; // one reading per MOT
const SCORE = 86;

function Sparkline() {
  const w = 120;
  const h = 32;
  const max = MILEAGE[MILEAGE.length - 1];
  const points = MILEAGE.map((m, i) => `${(i / (MILEAGE.length - 1)) * w},${h - (m / max) * (h - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-24 h-7" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sample-draw text-cyan-400"
        pathLength={1}
      />
    </svg>
  );
}

function ScoreRing() {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-800" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          className="sample-ring text-emerald-400"
          style={{ strokeDasharray: c, ["--ring-to" as string]: c * (1 - SCORE / 100) }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-base font-bold text-white">{SCORE}</div>
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
    <div className="sample-row flex items-center gap-3 py-2.5" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-100 truncate">{value}</div>
        <div className="text-xs text-slate-400 truncate">{note}</div>
      </div>
      {extra}
    </div>
  );
}

export default function SampleResultCard({ onTry, className = "" }: { onTry: () => void; className?: string }) {
  // Play the entrance once, when the card is actually on screen (mobile shows
  // it below the fold).
  const { ref, revealed: shown } = useScrollReveal(0.25);

  return (
    <div
      ref={ref}
      className={`sample-card relative rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur shadow-[0_20px_60px_-20px_rgba(34,211,238,0.25)] p-5 ${shown ? "is-shown" : ""} ${className}`}
    >
      <style>{`
        .sample-card .sample-row { opacity: 0; transform: translateY(6px); }
        .sample-card.is-shown .sample-row { animation: sampleRowIn 0.45s ease-out forwards; }
        .sample-card .sample-draw { stroke-dasharray: 1; stroke-dashoffset: 1; }
        .sample-card.is-shown .sample-draw { animation: sampleDraw 1.2s ease-out 0.5s forwards; }
        .sample-card .sample-ring { stroke-dashoffset: ${2 * Math.PI * 22}; }
        .sample-card.is-shown .sample-ring { animation: sampleRing 1.2s ease-out 0.2s forwards; }
        @keyframes sampleRowIn { to { opacity: 1; transform: none; } }
        @keyframes sampleDraw { to { stroke-dashoffset: 0; } }
        @keyframes sampleRing { to { stroke-dashoffset: var(--ring-to); } }
        @media (prefers-reduced-motion: reduce) {
          .sample-card .sample-row, .sample-card.is-shown .sample-row { animation: none; opacity: 1; transform: none; }
          .sample-card .sample-draw, .sample-card.is-shown .sample-draw { animation: none; stroke-dashoffset: 0; }
          .sample-card .sample-ring, .sample-card.is-shown .sample-ring { animation: none; stroke-dashoffset: var(--ring-to); }
        }
      `}</style>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">What you&apos;ll see</span>
        <span className="text-[11px] text-slate-500">Example result</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="inline-block rounded-md bg-[#f6d33a] px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-slate-900">
            AB19 CDE
          </div>
          <div className="mt-1.5 text-base font-semibold text-white truncate">2019 Ford Fiesta Titanium</div>
          <div className="text-xs text-slate-400">1.0 EcoBoost · Petrol · Blue</div>
        </div>
        <div className="text-center">
          <ScoreRing />
          <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Health</div>
        </div>
      </div>

      <div className="mt-3 divide-y divide-slate-800/80">
        <Row
          icon={<Check className="w-4 h-4 text-emerald-400" />}
          label="MOT"
          value="Valid until 14 Mar 2027"
          note="6 tests · passed 5 first time"
          delay={150}
        />
        <Row
          icon={<Gauge className="w-4 h-4 text-cyan-400" />}
          label="Mileage"
          value="41,250 miles"
          note="Steady, no signs of clocking"
          delay={250}
          extra={<Sparkline />}
        />
        <Row
          icon={<PoundSterling className="w-4 h-4 text-amber-400" />}
          label="Value"
          value="£8,400 – £9,600"
          note="Private sale, from market data"
          delay={350}
        />
        <Row
          icon={<Wind className="w-4 h-4 text-sky-400" />}
          label="Tax & ULEZ"
          value="Taxed · ULEZ compliant"
          note="Euro 6 petrol"
          delay={450}
        />
        <Row
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          label="Recalls"
          value="None outstanding"
          note="Checked against DVSA records"
          delay={550}
        />
        <Row
          icon={<Wrench className="w-4 h-4 text-violet-400" />}
          label="Running costs"
          value="About £1,640 a year"
          note="Fuel, tax, insurance and servicing"
          delay={650}
        />
      </div>

      <button
        type="button"
        onClick={onTry}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
      >
        <ArrowUp className="w-4 h-4 text-cyan-400" />
        Check your own car, free
      </button>
    </div>
  );
}
