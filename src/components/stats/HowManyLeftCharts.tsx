"use client";

import { useState, useEffect, useRef } from "react";

export type CarRow = { name: string; licensed: number; sorn: number };
export type MothRow = { name: string; licensed: number; sornPct: number };

// Reveal-on-scroll: returns true once the element enters the viewport.
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);
  return { ref, inView };
}

function useCountUp(target: number, run: boolean, durationMs = 1500): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setVal(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, durationMs]);
  return val;
}

function CountCell({ value, run, suffix = "" }: { value: number; run: boolean; suffix?: string }) {
  const v = useCountUp(value, run);
  return (
    <span className="font-[family-name:var(--font-geist-mono)] tabular-nums">
      {v.toLocaleString()}
      {suffix}
    </span>
  );
}

export function MostCommonChart({ rows }: { rows: CarRow[] }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const max = rows[0]?.licensed || 1;
  return (
    <div ref={ref} className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.name} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-sm text-slate-300 sm:w-44">{r.name}</span>
          <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-slate-800/60">
            <div
              className="h-full rounded-md bg-gradient-to-r from-cyan-600 to-blue-500 transition-[width] duration-[1400ms] ease-out"
              style={{ width: inView ? `${(r.licensed / max) * 100}%` : "0%", transitionDelay: `${i * 60}ms` }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
              <CountCell value={r.licensed} run={inView} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EndangeredList({ rows }: { rows: CarRow[] }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="grid gap-3 sm:grid-cols-2">
      {rows.map((r, i) => (
        <div
          key={r.name}
          className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/30 to-slate-900/40 p-4 transition-all duration-500"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(12px)",
            transitionDelay: `${i * 70}ms`,
          }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold text-white">{r.name}</span>
            <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-300">
              Endangered
            </span>
          </div>
          <p className="mt-2 font-[family-name:var(--font-geist-mono)] text-3xl font-bold text-red-300">
            <CountCell value={r.licensed} run={inView} />
          </p>
          <p className="text-xs text-slate-500">left on UK roads</p>
        </div>
      ))}
    </div>
  );
}

export function MothballedList({ rows }: { rows: MothRow[] }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.name} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-sm text-slate-300 sm:w-44">{r.name}</span>
          <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-slate-800/60">
            <div
              className="h-full rounded-md bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-[1400ms] ease-out"
              style={{ width: inView ? `${r.sornPct}%` : "0%", transitionDelay: `${i * 60}ms` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-semibold text-amber-300">
            <CountCell value={r.sornPct} run={inView} suffix="%" />
          </span>
        </div>
      ))}
    </div>
  );
}
