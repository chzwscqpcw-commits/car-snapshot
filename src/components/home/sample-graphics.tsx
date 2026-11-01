"use client";

import { useId, type ReactNode } from "react";
import { Check, Clock, X } from "lucide-react";
import { REF_YEAR, type MotResult, type SampleCar } from "@/components/home/sample-cars";

// The pieces every example card is built from: the row, the verdict pill,
// the headline block, and the little graphics that sit in each row's 72px
// slot. Each animates in with its row (sample-pop: scale up, sample-grow-x:
// wipe from the left, sample-grow-y: rise) — the keyframes live on the card
// in SampleResultCard.tsx and only play once the card is on screen.

export const SLOT = 72;

/** One marker per MOT: green passed first time, amber needed a retest. */
export function MotMarks({ results }: { results: MotResult[] }) {
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
export function MileageChart({ mileage }: { mileage: number[] }) {
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

/**
 * The mileage check's own chart: every reading across the card's width, a
 * dot per MOT, the years underneath, and the latest reading called out.
 */
export function MileageChartWide({ car }: { car: SampleCar }) {
  const fillId = `sample-mileage-wide-${useId().replace(/:/g, "")}`;
  const w = 300;
  const h = 72;
  const padX = 6;
  const padTop = 10;
  const padBottom = 6;
  const { mileage } = car;
  const max = mileage[mileage.length - 1];
  const pts = mileage.map((m, i) => [
    padX + (i / Math.max(1, mileage.length - 1)) * (w - padX * 2),
    h - padBottom - (m / max) * (h - padTop - padBottom),
  ]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const [ex] = pts[pts.length - 1];
  // The first MOT falls in the car's third year; one a year after that.
  const firstYear = car.year + 3;
  const lastYear = firstYear + mileage.length - 1;
  return (
    <div className="sample-row mt-3" style={{ animationDelay: "250ms" }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[72px] overflow-visible" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(34 211 238)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={w - padX}
            y1={h - padBottom - f * (h - padTop - padBottom)}
            y2={h - padBottom - f * (h - padTop - padBottom)}
            stroke="rgb(51 65 85)"
            strokeWidth="0.5"
            strokeDasharray="2 3"
          />
        ))}
        <g className="sample-grow-x" style={{ animationDelay: "450ms" }}>
          <polygon points={`${padX},${h - padBottom} ${line} ${ex},${h - padBottom}`} fill={`url(#${fillId})`} />
          <polyline points={line} fill="none" stroke="rgb(34 211 238)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </g>
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === pts.length - 1 ? 4 : 2.5}
            fill={i === pts.length - 1 ? "rgb(34 211 238)" : "rgb(15 23 42)"}
            stroke="rgb(34 211 238)"
            strokeWidth="1.5"
            className="sample-pop"
            style={{ animationDelay: `${650 + i * 60}ms` }}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500 tabular-nums">
        <span>{firstYear}</span>
        <span>{mileage.length} MOT readings</span>
        <span>{lastYear}</span>
      </div>
    </div>
  );
}

/** Where the car sits in its price range: the band and a marker in it. */
export function ValueRange({ pos }: { pos: number }) {
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

/** What the car was worth each year since new, and where it is heading. */
export function DepreciationCurve({ car }: { car: SampleCar }) {
  const w = SLOT;
  const h = 28;
  const age = Math.max(1, REF_YEAR - car.year);
  const ratio = Math.pow(car.valueMid / car.newPrice, 1 / age);
  const years = age + 2;
  const pt = (y: number): [number, number] => [(y / years) * (w - 4) + 2, h - 3 - Math.pow(ratio, y) * (h - 8)];
  const history = Array.from({ length: age + 1 }, (_, y) => pt(y));
  const future = Array.from({ length: 3 }, (_, i) => pt(age + i));
  const [tx, ty] = pt(age);
  const line = (pts: [number, number][]) => pts.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[72px] h-7 overflow-visible">
      <g className="sample-grow-x" style={{ animationDelay: "550ms" }}>
        <polygon points={`2,${h} ${line(history)} ${tx},${h}`} fill="rgb(251 191 36)" fillOpacity="0.18" />
        <polyline points={line(history)} fill="none" stroke="rgb(251 191 36)" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={line(future)} fill="none" stroke="rgb(251 191 36)" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
      </g>
      <circle cx={tx} cy={ty} r="3" fill="rgb(251 191 36)" stroke="rgb(15 23 42)" strokeWidth="1.5" className="sample-pop" style={{ animationDelay: "1000ms" }} />
    </svg>
  );
}

/** The asking prices behind the figure, as six bands; the busiest is lit. */
export function ListingBars({ bars }: { bars: SampleCar["listingBars"] }) {
  const max = Math.max(...bars);
  const peak = bars.indexOf(max);
  return (
    <div className="flex h-7 w-[72px] items-end gap-[3px]" aria-hidden="true">
      {bars.map((b, i) => (
        <span
          key={i}
          className={`sample-grow-y block flex-1 rounded-sm ${i === peak ? "bg-cyan-300" : "bg-cyan-400/40"}`}
          style={{ height: `${Math.max(12, (b / max) * 100)}%`, animationDelay: `${600 + i * 60}ms` }}
        />
      ))}
    </div>
  );
}

/** A small pass/fail chip; stacks of them show tax + ULEZ, or the clean-air zones. */
export function OkChip({ label, ok, warn = false, delay }: { label: string; ok: boolean; /** Amber instead of red when not ok: a wait, not a fail. */ warn?: boolean; delay: number }) {
  const tone = ok
    ? "text-emerald-300 bg-emerald-500/15 ring-emerald-500/30"
    : warn
      ? "text-amber-300 bg-amber-500/15 ring-amber-500/40"
      : "text-red-300 bg-red-500/15 ring-red-500/40";
  return (
    <span
      className={`sample-pop inline-flex items-center gap-0.5 rounded px-1.5 py-px text-[9px] font-bold tracking-wider ring-1 ${tone}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {ok ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : warn ? <Clock className="w-2.5 h-2.5" strokeWidth={3} /> : <X className="w-2.5 h-2.5" strokeWidth={3} />}
      {label}
    </span>
  );
}

/** Taxed, and whether it's clean enough for ULEZ. */
export function TaxUlezChips({ ulez }: { ulez: boolean }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <OkChip label="TAX" ok delay={750} />
      <OkChip label="ULEZ" ok={ulez} delay={840} />
    </div>
  );
}

/** Outstanding recalls: green at zero, amber otherwise. */
export function RecallBadge({ open, caption = "open" }: { open: number; caption?: string }) {
  const tone = open === 0 ? "ring-emerald-400/50 bg-emerald-500/10" : "ring-amber-400/60 bg-amber-500/15";
  const text = open === 0 ? "text-emerald-300" : "text-amber-300";
  return (
    <div
      className={`sample-pop w-7 h-7 rounded-full flex flex-col items-center justify-center ring-2 leading-none ${tone}`}
      style={{ animationDelay: "850ms" }}
    >
      <span className={`text-[11px] font-bold ${text}`}>{open}</span>
      <span className={`text-[6px] font-semibold uppercase tracking-wide ${text} opacity-80`}>{caption}</span>
    </div>
  );
}

export const COST_COLOURS = ["bg-cyan-400", "bg-violet-400", "bg-amber-400", "bg-sky-300"];
export const COST_LABELS = ["Fuel", "Insurance", "Servicing", "Tax"];

/** The year's cost, split into fuel, insurance, servicing and tax. */
export function CostSplit({ split, wide = false, delay = 950 }: { split: SampleCar["costSplit"]; wide?: boolean; delay?: number }) {
  return (
    <div
      className={`sample-grow-x flex ${wide ? "w-full h-2.5" : "w-[72px] h-2"} rounded-full overflow-hidden gap-px`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {split.map((share, i) => (
        <span key={i} className={`block h-full ${COST_COLOURS[i]}`} style={{ width: `${share}%` }} />
      ))}
    </div>
  );
}

/** One category's share of the year, as a bar in the row slot. */
export function CostBar({ share, colour, delay }: { share: number; colour: string; delay: number }) {
  return (
    <div className="relative w-[72px] h-2 rounded-full bg-slate-700/80 overflow-hidden">
      <span
        className={`sample-grow-x absolute inset-y-0 left-0 rounded-full ${colour}`}
        style={{ width: share === 0 ? 0 : `${Math.max(6, share)}%`, animationDelay: `${delay}ms` }}
      />
    </div>
  );
}

/** The year's VED on a 0–£600 scale, with the standard rate marked. */
export function VedBar({ ved }: { ved: number }) {
  const scale = 600;
  const standard = 195;
  return (
    <div className="relative w-[72px] h-7 flex items-center">
      <div className="w-full h-1.5 rounded-full bg-slate-700/80" />
      <span
        className="sample-grow-x absolute left-0 h-1.5 rounded-full bg-gradient-to-r from-emerald-500/70 to-emerald-300"
        style={{ width: `${Math.max(4, (ved / scale) * 100)}%`, animationDelay: "650ms" }}
      />
      <span
        className="sample-pop absolute top-1 h-5 w-px bg-slate-400/70"
        style={{ left: `${(standard / scale) * 100}%`, animationDelay: "900ms" }}
        title="Standard rate"
      />
    </div>
  );
}

const RING_R = 22;
const RING_C = 2 * Math.PI * RING_R;
export { RING_C };

export function ScoreRing({ score }: { score: number }) {
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

const MINI_R = 11;
const MINI_C = 2 * Math.PI * MINI_R;

/** A 28px ring for a percentage in a row slot (the model's MOT pass rate). */
export function MiniRing({ pct }: { pct: number }) {
  return (
    <div className="relative w-7 h-7 shrink-0">
      <svg viewBox="0 0 28 28" className="w-7 h-7 -rotate-90" aria-hidden="true">
        <circle cx="14" cy="14" r={MINI_R} fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-800" />
        <circle
          cx="14"
          cy="14"
          r={MINI_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={`sample-ring ${pct >= 80 ? "text-emerald-400" : "text-amber-400"}`}
          style={{ strokeDasharray: MINI_C, ["--ring-to" as string]: MINI_C * (1 - pct / 100) }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white tabular-nums">{pct}</div>
    </div>
  );
}

/**
 * Forty years on one line: first registration at the left, the MOT exemption
 * at the 40-year mark, and the historic tax class a little further on.
 */
export function ExemptionTimeline({ year, exemptFrom, historicTaxFrom }: { year: number; exemptFrom: string; historicTaxFrom: string }) {
  // Registration at the left, the exemption at 40 years, the tax class a
  // little over a year on — spaced so the two markers read as two.
  const exemptAt = 84;
  const taxAt = 96;
  return (
    <div className="sample-row mt-3" style={{ animationDelay: "250ms" }}>
      <div className="relative h-2 rounded-full bg-slate-700/80">
        <span
          className="sample-grow-x absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-slate-500 via-emerald-500/80 to-emerald-300"
          style={{ width: `${exemptAt}%`, animationDelay: "450ms" }}
        />
        <span
          className="sample-pop absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 -ml-[7px] rounded-full bg-white border-2 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
          style={{ left: `${exemptAt}%`, animationDelay: "1050ms" }}
        />
        <span
          className="sample-pop absolute top-1/2 h-3 w-3 -translate-y-1/2 -ml-1.5 rounded-full bg-slate-900 border-2 border-amber-400"
          style={{ left: `${taxAt}%`, animationDelay: "1250ms" }}
        />
      </div>
      <div className="relative mt-1.5 h-8 text-[10px] tabular-nums">
        <span className="absolute left-0 text-slate-500">
          Registered
          <br />
          {year}
        </span>
        <span className="absolute right-0 text-right text-slate-400">
          <span className="text-emerald-300">MOT exempt {exemptFrom.replace(/^\d+ /, "")}</span>
          <br />
          <span className="text-amber-300">Historic tax {historicTaxFrom.replace(/^\d+ /, "")}</span>
        </span>
      </div>
    </div>
  );
}

/** A verdict pill for the card header: the tool's one-word answer. */
export function Verdict({ tone, label, delay = 700 }: { tone: "good" | "warn" | "bad" | "info"; label: string; delay?: number }) {
  const styles = {
    good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    bad: "border-red-500/30 bg-red-500/10 text-red-300",
    info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  }[tone];
  return (
    <span
      className={`sample-pop inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {tone === "good" ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      {tone === "bad" ? <X className="h-3 w-3" strokeWidth={3} /> : null}
      {label}
    </span>
  );
}

/** The tool's headline figure in a tinted block: label, big value, a note. */
export function Headline({
  eyebrow,
  value,
  note,
  tone = "cyan",
  children,
}: {
  eyebrow: ReactNode;
  value: ReactNode;
  note?: ReactNode;
  tone?: "cyan" | "emerald" | "amber" | "red";
  children?: ReactNode;
}) {
  const border = {
    cyan: "border-cyan-500/30 from-cyan-900/25",
    emerald: "border-emerald-500/30 from-emerald-900/25",
    amber: "border-amber-500/30 from-amber-900/25",
    red: "border-red-500/30 from-red-900/25",
  }[tone];
  return (
    <div className={`sample-row mt-3 rounded-xl border bg-gradient-to-br via-slate-900/80 to-slate-950 p-4 ${border}`} style={{ animationDelay: "100ms" }}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{eyebrow}</div>
      <div className="mt-1 text-2xl font-bold text-white tracking-tight tabular-nums leading-tight">{value}</div>
      {note ? <div className="mt-0.5 text-xs text-slate-400">{note}</div> : null}
      {children}
    </div>
  );
}

export function Row({
  icon,
  label,
  value,
  note,
  delay,
  extra,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  delay: number;
  extra?: ReactNode;
}) {
  return (
    <div className="sample-row flex items-center gap-3 py-2 border-t border-slate-800/80" style={{ animationDelay: `${delay}ms` }}>
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

export function motNote(mot: MotResult[]): string {
  const first = mot.filter((r) => r === "pass").length;
  const tests = `${mot.length} test${mot.length === 1 ? "" : "s"}`;
  return first === mot.length ? `${tests} · all passed first time` : `${tests} · passed ${first} first time`;
}

export function mileageVsAverage(car: SampleCar): string {
  const miles = car.mileage[car.mileage.length - 1];
  const expected = Math.max(1, REF_YEAR - car.year) * 8000;
  const diff = (miles - expected) / expected;
  if (diff < -0.12) return "Below average for its age";
  if (diff > 0.12) return "Above average for its age";
  return "About average for its age";
}

export function latestMiles(car: SampleCar): string {
  return `${car.mileage[car.mileage.length - 1].toLocaleString("en-GB")} miles`;
}

export function milesPerYear(car: SampleCar): number {
  const span = Math.max(1, car.mileage.length - 1);
  return Math.round((car.mileage[car.mileage.length - 1] - car.mileage[0]) / span / 100) * 100;
}

export function pounds(n: number): string {
  return `£${n.toLocaleString("en-GB")}`;
}
