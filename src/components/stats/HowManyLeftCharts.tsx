"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export type CarRow = { name: string; licensed: number; sorn: number; img?: string; credit?: string };
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
      // threshold 0 + rootMargin so it fires as soon as any part enters — a tall
      // single-column grid on mobile never reaches a 0.25 ratio, which would
      // otherwise leave the content stuck hidden.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
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
  const credited = rows.filter((r) => r.credit);
  return (
    <>
      <div ref={ref} className="grid gap-2.5 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div
            key={r.name}
            className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-gradient-to-br from-red-950/25 to-slate-900/40 p-2.5 transition-all duration-500"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(10px)",
              transitionDelay: `${i * 45}ms`,
            }}
          >
            {r.img && (
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={`/cars/${r.img}.webp`}
                  alt={`${r.name} — a now-rare UK car`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{r.name}</p>
              <p className="text-[11px] text-slate-500">left on UK roads</p>
            </div>
            <p className="shrink-0 font-[family-name:var(--font-geist-mono)] text-2xl font-bold text-red-300">
              <CountCell value={r.licensed} run={inView} />
            </p>
          </div>
        ))}
      </div>
      {credited.length > 0 && (
        <details className="mt-4 text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-slate-300">Image credits</summary>
          <p className="mt-2 leading-relaxed">
            Photos via Wikimedia Commons:{" "}
            {credited.map((r, i) => (
              <span key={r.name}>
                {i > 0 && "; "}
                {r.name} © {r.credit}
              </span>
            ))}
            .
          </p>
        </details>
      )}
    </>
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
