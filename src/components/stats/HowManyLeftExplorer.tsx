"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Share2, RotateCcw, Check, Search } from "lucide-react";
import { lookupRarity, suggestModels, type RarityResult } from "@/lib/how-many-left";

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}
function isValidReg(reg: string): boolean {
  const c = cleanReg(reg);
  return c.length >= 2 && c.length <= 8;
}
function titleCase(s: string): string {
  return s
    .split(" ")
    .map((t) => (/\d/.test(t) || t.length <= 3 ? t : t[0] + t.slice(1).toLowerCase()))
    .join(" ");
}
function modelLabel(make: string, model: string): string {
  return `${titleCase(make)} ${titleCase(model)}`;
}

// Verified classics (present in the dataset) cycled through the search
// placeholder to jog memories and seed searches.
const PLACEHOLDERS = [
  "Ford Sierra",
  "Vauxhall Cavalier",
  "Austin Metro",
  "Morris Marina",
  "Fiat Uno",
  "Ford Cortina",
  "Nissan Sunny",
  "Renault 5",
  "Triumph Acclaim",
  "Peugeot 205",
  "MG Maestro",
  "Vauxhall Nova",
];

// Animated count-up (requestAnimationFrame, cubic ease-out).
function useCountUp(target: number, durationMs: number, run: boolean): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, run]);
  return val;
}

type Vehicle = { reg: string; make: string; model: string; year?: number };

const RARITY: Record<
  RarityResult["category"],
  { label: string; color: string; bg: string; ring: string; pct: number; blurb: string }
> = {
  "very-rare": { label: "Endangered", color: "#f87171", bg: "rgba(248,113,113,0.12)", ring: "rgba(248,113,113,0.5)", pct: 12, blurb: "A genuine rarity — you don't see many of these anymore." },
  rare: { label: "Rare", color: "#fb923c", bg: "rgba(251,146,60,0.12)", ring: "rgba(251,146,60,0.5)", pct: 32, blurb: "Getting hard to find on Britain's roads." },
  uncommon: { label: "Uncommon", color: "#fbbf24", bg: "rgba(251,191,36,0.12)", ring: "rgba(251,191,36,0.5)", pct: 55, blurb: "Still around, but not an everyday sight." },
  common: { label: "Common", color: "#34d399", bg: "rgba(52,211,153,0.12)", ring: "rgba(52,211,153,0.5)", pct: 78, blurb: "A familiar face — plenty still on the road." },
  "very-common": { label: "Everywhere", color: "#22d3ee", bg: "rgba(34,211,238,0.12)", ring: "rgba(34,211,238,0.5)", pct: 100, blurb: "One of Britain's most common cars." },
};

export default function HowManyLeftExplorer() {
  const [reg, setReg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [rarity, setRarity] = useState<RarityResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"reg" | "model">("model");
  const [modelQuery, setModelQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ make: string; model: string }[]>([]);
  const [phIdx, setPhIdx] = useState(0);
  const meterRef = useRef<HTMLDivElement>(null);

  function pickModel(s: { make: string; model: string }) {
    setVehicle({ reg: "", make: s.make, model: s.model });
    setRarity(lookupRarity(s.make, s.model));
    setSuggestions([]);
    setModelQuery("");
    setError("");
  }

  const count = useCountUp(rarity?.licensed ?? 0, 1600, !!rarity);
  const sornCount = useCountUp(rarity?.sorn ?? 0, 1600, !!rarity);

  // animate the rarity meter fill after a result lands
  useEffect(() => {
    if (rarity && meterRef.current) {
      const el = meterRef.current;
      el.style.width = "0%";
      const id = requestAnimationFrame(() => {
        el.style.width = `${RARITY[rarity.category].pct}%`;
      });
      return () => cancelAnimationFrame(id);
    }
  }, [rarity]);

  // cycle the search placeholder through classic models (model mode only)
  useEffect(() => {
    if (mode !== "model") return;
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 2400);
    return () => clearInterval(id);
  }, [mode]);

  async function handleLookup() {
    if (!isValidReg(reg)) {
      setError("That doesn't look like a valid UK reg.");
      return;
    }
    setError("");
    setSubmitting(true);
    setRarity(null);
    setVehicle(null);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm: cleanReg(reg) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error || "Couldn't find that vehicle — check the reg.");
        return;
      }
      const payload = await res.json();
      const data = payload?.data;
      if (!data?.make) {
        setError("Couldn't read the vehicle details — try again.");
        return;
      }
      const v: Vehicle = {
        reg: data.registrationNumber || cleanReg(reg),
        make: data.make,
        model: data.model || "",
        year: data.yearOfManufacture,
      };
      setVehicle(v);
      setRarity(lookupRarity(v.make, v.model));
    } catch {
      setError("Couldn't reach the lookup service — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setVehicle(null);
    setRarity(null);
    setReg("");
    setError("");
    setCopied(false);
  }

  async function share() {
    const name = vehicle ? `${vehicle.year ?? ""} ${vehicle.make} ${vehicle.model}`.trim() : "my car";
    const text = rarity
      ? `There are only ${rarity.licensed.toLocaleString()} ${name} left on UK roads. How many of yours survive?`
      : `How many of your car are left on UK roads?`;
    const url = "https://www.freeplatecheck.co.uk/stats/how-many-left";
    if (navigator.share) {
      try {
        await navigator.share({ title: "How Many Left?", text, url });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* no-op */
    }
  }

  // ── RESULT ──
  if (vehicle) {
    const r = rarity ? RARITY[rarity.category] : null;
    const name = `${vehicle.year ?? ""} ${vehicle.make} ${vehicle.model}`.trim();
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: r ? `radial-gradient(circle, ${r.ring}, transparent 70%)` : "transparent", opacity: 0.4 }}
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <span className="font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-widest text-slate-400">
              {name || vehicle.reg}
            </span>
            <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-white">
              <RotateCcw className="h-3.5 w-3.5" /> {vehicle.reg ? "Another reg" : "Another car"}
            </button>
          </div>

          {r && rarity ? (
            <>
              <p className="mt-6 text-center text-sm uppercase tracking-[0.2em] text-slate-500">Still on UK roads</p>
              <p
                className="mt-1 text-center font-[family-name:var(--font-geist-mono)] text-6xl font-bold tabular-nums sm:text-7xl"
                style={{ color: r.color, textShadow: `0 0 30px ${r.ring}` }}
              >
                {count.toLocaleString()}
              </p>
              <div className="mt-4 flex justify-center">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
                  style={{ backgroundColor: r.bg, color: r.color, boxShadow: `inset 0 0 0 1px ${r.ring}` }}
                >
                  {r.label}
                </span>
              </div>

              {/* rarity meter */}
              <div className="mx-auto mt-5 h-2.5 max-w-sm overflow-hidden rounded-full bg-slate-800">
                <div
                  ref={meterRef}
                  className="h-full rounded-full transition-[width] duration-[1600ms] ease-out"
                  style={{ width: "0%", background: `linear-gradient(90deg, ${r.color}, ${r.color})` }}
                />
              </div>
              <p className="mx-auto mt-3 max-w-md text-center text-sm text-slate-300">{r.blurb}</p>
              <p className="mt-2 text-center text-xs text-slate-500">
                Plus {sornCount.toLocaleString()} more declared off-road (SORN).
              </p>
            </>
          ) : (
            <p className="mt-6 text-center text-sm text-slate-300">
              We found your {vehicle.make} {vehicle.model}, but don&apos;t have survivor
              figures for this exact model yet. The full report still has everything
              else on it.
            </p>
          )}

          {/* upsell + share */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {vehicle.reg ? (
              <a
                href={`/?vrm=${vehicle.reg}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]"
              >
                See the full check on this car <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Link
                href="/"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]"
              >
                Got one? Check it by reg <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <button
              onClick={share}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            MOT history, tax, mileage, valuation, recalls &amp; more — free, no signup.
          </p>
        </div>
      </div>
    );
  }

  // ── FORM ──
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-5 sm:p-7">
      <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden />
      <div className="relative text-center">
        {mode === "reg" ? (
          <>
            {/* UK plate-styled input */}
            <div className="mx-auto flex max-w-md overflow-hidden rounded-xl shadow-xl ring-1 ring-black/40">
              <span className="flex items-center bg-[#0a3bb0] px-2.5 font-[family-name:var(--font-geist-mono)] text-xs font-bold text-white sm:text-sm">
                GB
              </span>
              <input
                type="text"
                value={reg}
                onChange={(e) => {
                  setReg(e.target.value.toUpperCase());
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="YOUR REG"
                maxLength={10}
                disabled={submitting}
                aria-label="Enter your registration"
                className="min-w-0 flex-1 bg-[#f7d40a] px-3 py-3.5 text-center font-[family-name:var(--font-geist-mono)] text-xl font-bold uppercase tracking-[0.2em] text-black placeholder:text-black/40 placeholder:tracking-[0.15em] focus:outline-none sm:text-2xl"
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={submitting}
              className="mx-auto mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking the records&hellip;
                </>
              ) : (
                <>How many are left? <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </>
        ) : (
          <div className="relative mx-auto max-w-md text-left">
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 transition-colors focus-within:border-cyan-500/70">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                type="text"
                value={modelQuery}
                onChange={(e) => {
                  setModelQuery(e.target.value);
                  setSuggestions(suggestModels(e.target.value));
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestions[0]) pickModel(suggestions[0]);
                }}
                placeholder={`e.g. ${PLACEHOLDERS[phIdx]}`}
                aria-label="Search by make and model"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            {suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                {suggestions.map((s) => (
                  <li key={`${s.make}|${s.model}`}>
                    <button
                      type="button"
                      onClick={() => pickModel(s)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800"
                    >
                      {modelLabel(s.make, s.model)}
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setMode(mode === "reg" ? "model" : "reg");
            setError("");
            setSuggestions([]);
            setModelQuery("");
          }}
          className="mx-auto mt-4 block text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          {mode === "reg" ? "No reg? Look up by make & model →" : "← Look up by reg plate instead"}
        </button>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <p className="mt-3 text-xs text-slate-500">Free · No signup · Official DVLA &amp; DVLA-licensing data</p>
      </div>
    </div>
  );
}
