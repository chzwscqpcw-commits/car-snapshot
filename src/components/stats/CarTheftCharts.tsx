"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import theftData from "@/data/theft-risk.json";
import ChartContainer from "@/components/stats/ChartContainer";

/* ---------- national trend data ---------- */
const nationalTrend = [
  { year: 2014, thefts: 85000 },
  { year: 2015, thefts: 87000 },
  { year: 2016, thefts: 89000 },
  { year: 2017, thefts: 105000 },
  { year: 2018, thefts: 114000 },
  { year: 2019, thefts: 118000 },
  { year: 2020, thefts: 108000 },
  { year: 2021, thefts: 105000 },
  { year: 2022, thefts: 110000 },
  { year: 2023, thefts: 108000 },
  { year: 2024, thefts: 105000 },
];

/* ---------- parse theft data ---------- */
interface TheftEntry {
  make: string;
  model: string;
  thefts: number;
  registered: number;
  rate: number; // per 1,000 vehicles
}

const allEntries: TheftEntry[] = Object.entries(
  theftData as unknown as Record<string, [number, number]>
).map(([key, [thefts, registered]]) => {
  const [make, model] = key.split("|");
  return {
    make,
    model,
    thefts,
    registered,
    rate: parseFloat(((thefts / registered) * 1000).toFixed(2)),
  };
});

const top10ByRate = [...allEntries]
  .sort((a, b) => b.rate - a.rate)
  .slice(0, 10)
  .map((e) => ({
    name: `${titleCase(e.make)} ${titleCase(e.model)}`,
    rate: e.rate,
  }));

const makes = [...new Set(allEntries.map((e) => e.make))].sort();

/* ---------- helpers ---------- */
function titleCase(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getRiskLevel(rate: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (rate > 20)
    return {
      label: "High Risk",
      color: "text-red-400",
      bgColor: "bg-red-500/10 border-red-500/30",
    };
  if (rate > 10)
    return {
      label: "Medium Risk",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/30",
    };
  return {
    label: "Low Risk",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
  };
}

/* ---------- red gradient for bar chart ---------- */
const barColors = [
  "#ef4444",
  "#f05252",
  "#f16060",
  "#f26e6e",
  "#f37c7c",
  "#f48a8a",
  "#f59898",
  "#f6a6a6",
  "#f7b4b4",
  "#f8c2c2",
];

/* ---------- component ---------- */
export default function CarTheftCharts() {
  const [selectedMake, setSelectedMake] = useState<string>("");

  const makeModels = useMemo(() => {
    if (!selectedMake) return [];
    return allEntries
      .filter((e) => e.make === selectedMake)
      .sort((a, b) => b.rate - a.rate);
  }, [selectedMake]);

  const makeAvgRate = useMemo(() => {
    if (!makeModels.length) return 0;
    const totalThefts = makeModels.reduce((sum, m) => sum + m.thefts, 0);
    const totalReg = makeModels.reduce((sum, m) => sum + m.registered, 0);
    return parseFloat(((totalThefts / totalReg) * 1000).toFixed(2));
  }, [makeModels]);

  return (
    <div className="space-y-8">
      {/* Chart 1: National theft trend */}
      <ChartContainer
        title="Vehicle Theft Incidents (England & Wales)"
        subtitle="Annual recorded vehicle thefts 2014 - 2024"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={nationalTrend}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
              }
              label={{
                value: "Thefts per year",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 11 },
                offset: 10,
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-[#374151] bg-[#1f2937] px-3 py-2 shadow-lg">
                    <div className="border-b border-emerald-500/40 pb-1 mb-2 text-xs font-medium text-gray-300">
                      {label}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-200">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-gray-400">Thefts:</span>
                      <span className="font-medium">
                        {(payload[0].value as number).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="thefts"
              name="Thefts"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <p className="text-xs text-gray-500 text-right">
        Source: ONS Crime Survey for England and Wales
      </p>

      {/* Chart 2: Top 10 most stolen models by rate */}
      <ChartContainer
        title="Top 10 Most Stolen Models by Theft Rate"
        subtitle="Thefts per 1,000 registered vehicles"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top10ByRate}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              stroke="#2a2a2a"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              label={{
                value: "Per 1,000 vehicles",
                position: "insideBottom",
                style: { fill: "#6b7280", fontSize: 11 },
                offset: -2,
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#6b7280"
              tick={{ fill: "#d1d5db", fontSize: 11 }}
              tickLine={false}
              width={160}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const entry = payload[0];
                return (
                  <div className="rounded-lg border border-[#374151] bg-[#1f2937] px-3 py-2 shadow-lg">
                    <div className="border-b border-red-500/40 pb-1 mb-2 text-xs font-medium text-gray-300">
                      {entry.payload.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-200">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                      <span className="text-gray-400">Theft rate:</span>
                      <span className="font-medium">
                        {(entry.value as number).toFixed(1)} per 1,000
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
              {top10ByRate.map((_, index) => (
                <Cell key={`cell-${index}`} fill={barColors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Interactive: Is my car at risk? */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-100">
          Is My Car at Risk?
        </h3>
        <p className="mb-4 text-sm text-gray-400">
          Select your car&apos;s make to see how its models rank for theft risk.
        </p>

        <select
          value={selectedMake}
          onChange={(e) => setSelectedMake(e.target.value)}
          className="w-full sm:w-72 rounded-lg border border-[#374151] bg-[#232323] px-3 py-2.5 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Choose a make...</option>
          {makes.map((make) => (
            <option key={make} value={make}>
              {titleCase(make)}
            </option>
          ))}
        </select>

        {selectedMake && makeModels.length > 0 && (
          <div className="mt-5 space-y-4">
            {/* Overall make summary */}
            <div
              className={`rounded-lg border p-4 ${getRiskLevel(makeAvgRate).bgColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-100">
                    {titleCase(selectedMake)} Overall
                  </h4>
                  <p className="mt-0.5 text-sm text-gray-400">
                    Average theft rate:{" "}
                    <span className="font-medium text-gray-200">
                      {makeAvgRate.toFixed(1)} per 1,000
                    </span>
                  </p>
                </div>
                <span
                  className={`text-sm font-bold ${getRiskLevel(makeAvgRate).color}`}
                >
                  {getRiskLevel(makeAvgRate).label}
                </span>
              </div>
            </div>

            {/* Model breakdown */}
            <div className="space-y-2">
              {makeModels.map((m) => {
                const risk = getRiskLevel(m.rate);
                return (
                  <div
                    key={m.model}
                    className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#161616] px-4 py-3"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-200">
                        {titleCase(m.model)}
                      </span>
                      <span className="ml-3 text-xs text-gray-500">
                        {m.thefts.toLocaleString()} thefts /{" "}
                        {m.registered.toLocaleString()} registered
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-300">
                        {m.rate.toFixed(1)}/1k
                      </span>
                      <span className={`text-xs font-bold ${risk.color}`}>
                        {risk.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommendations */}
            <div className="rounded-lg border border-[#2a2a2a] bg-[#161616] p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-100">
                Theft Prevention Tips
              </h4>
              <ul className="space-y-1.5 text-sm text-gray-400">
                {makeAvgRate > 20 && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-red-400">!</span>
                    <span>
                      Your make is in the high-risk category. Consider fitting
                      an aftermarket tracking device (Tracker, Vodafone
                      Automotive) for faster recovery.
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">&bull;</span>
                  <span>
                    Use a physical steering wheel lock (Disklok, Stoplock) as a
                    visible deterrent — especially effective against keyless
                    relay attacks.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">&bull;</span>
                  <span>
                    Store key fobs in a Faraday pouch at home to block relay
                    signal amplification used by keyless theft gangs.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">&bull;</span>
                  <span>
                    Park in well-lit areas or a locked garage wherever possible.
                    CCTV and motion-sensor lights are proven to reduce
                    opportunistic theft.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">&bull;</span>
                  <span>
                    Check with your insurer whether fitting approved security
                    devices qualifies you for a premium discount.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
