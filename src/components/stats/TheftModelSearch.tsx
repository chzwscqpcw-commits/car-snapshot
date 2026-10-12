"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { listRatedModels, lookupTheftRisk, type TheftModelOption, type TheftRiskResult } from "@/lib/theft-risk";

const MODELS = listRatedModels();
const UPPER = new Set(["BMW", "MG", "DS", "BYD", "GLA", "GLC", "GLE", "CLA", "AMG", "GTI"]);

/** "LAND ROVER|RANGE ROVER EVOQUE" → "Land Rover Range Rover Evoque" (same rules as the build script). */
function display(o: TheftModelOption): string {
  const make = o.make === "MERCEDES BENZ" ? "MERCEDES-BENZ" : o.make;
  return `${make} ${o.model}`
    .split(" ")
    .map((w) => {
      if (/^I\d+$/.test(w)) return w.toLowerCase();
      if (UPPER.has(w) || w.length <= 2 || /\d/.test(w) || !/[AEIOU]/.test(w)) return w;
      return w
        .split("-")
        .map((p) => (p.length <= 2 ? p : p[0] + p.slice(1).toLowerCase()))
        .join("-");
    })
    .join(" ");
}

const LABELS: Record<TheftRiskResult["riskCategory"], { text: string; tone: string }> = {
  "very-high": { text: "Very high", tone: "text-red-400 border-red-500/40 bg-red-500/10" },
  high: { text: "High", tone: "text-orange-400 border-orange-500/40 bg-orange-500/10" },
  moderate: { text: "Moderate", tone: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  low: { text: "Low", tone: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  "very-low": { text: "Very low", tone: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
};

const fmt = (v: number) => v.toLocaleString("en-GB");

/**
 * "Is my car a theft target?" — searches every rated car and van and shows its
 * rate against the fleet average. Uses the same lookup as reg-check results,
 * so the two can never disagree.
 */
export default function TheftModelSearch({ year }: { year: number }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<TheftModelOption | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toUpperCase().replace(/[-.]/g, " ").replace(/\s+/g, " ");
    if (q.length < 2) return [];
    return MODELS.filter((m) => `${m.make} ${m.model}`.includes(q) || m.model.includes(q)).slice(0, 8);
  }, [query]);

  const result = picked ? lookupTheftRisk(picked.make, picked.model) : null;

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 sm:p-6">
      <h2 className="mb-1 text-lg font-semibold text-slate-100">Is your car a theft target?</h2>
      <p className="mb-4 text-sm text-slate-400">
        Search {fmt(MODELS.length)} cars and vans for their {year} theft rate.
      </p>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPicked(null);
          }}
          placeholder="e.g. Range Rover Sport, Fiesta, Transit"
          aria-label="Search for a make or model"
          className="w-full rounded-lg border border-[#334155] bg-[#020617] py-2 pl-9 pr-3 text-base text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
        />
        {!picked && matches.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#334155] bg-[#0f172a] shadow-xl">
            {matches.map((m) => (
              <li key={m.key}>
                <button
                  type="button"
                  onClick={() => {
                    setPicked(m);
                    setQuery(display(m));
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200 hover:bg-[#1e293b]"
                >
                  <span>{display(m)}</span>
                  {m.fleet === "vans" && <span className="text-xs text-slate-500">van</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!picked && query.trim().length >= 2 && matches.length === 0 && (
          <p className="mt-2 text-xs text-slate-500">
            No rated model matches. Models with fewer than 10,000 cars (5,000 vans) on the road aren&apos;t rated.
          </p>
        )}
      </div>

      {picked && result && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className={`rounded-lg border p-4 text-center ${LABELS[result.riskCategory].tone}`}>
            <div className="text-2xl font-bold">{LABELS[result.riskCategory].text}</div>
            <div className="mt-1 text-xs text-slate-400">Theft risk</div>
          </div>
          <div className="rounded-lg border border-[#1e293b] bg-[#020617] p-4 text-center">
            <div className="text-2xl font-bold text-slate-100">{result.theftsPer1000}</div>
            <div className="mt-1 text-xs text-slate-400">
              stolen per 1,000 ({result.rateMultiplier}× the {result.nationalAverage} average for {result.fleet})
            </div>
          </div>
          <div className="rounded-lg border border-[#1e293b] bg-[#020617] p-4 text-center">
            <div className="text-2xl font-bold text-slate-100">{fmt(result.theftCount)}</div>
            <div className="mt-1 text-xs text-slate-400">
              stolen in {year}, of {fmt(result.registeredCount)} licensed
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
