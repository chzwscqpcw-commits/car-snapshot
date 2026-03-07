"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import {
  popularMakesData,
  popularModelTrend,
} from "@/lib/stats-data/popular-cars";
import colourData from "@/data/colour-popularity.json";
import ChartContainer from "@/components/stats/ChartContainer";
import CustomTooltip from "@/components/stats/CustomTooltip";

/* ---------- colour chart data ---------- */
const COLOUR_HEX: Record<string, string> = {
  WHITE: "#e5e7eb",
  BLACK: "#374151",
  GREY: "#6b7280",
  BLUE: "#3b82f6",
  RED: "#ef4444",
  SILVER: "#94a3b8",
  GREEN: "#10b981",
  ORANGE: "#f97316",
  BRONZE: "#b45309",
  YELLOW: "#eab308",
  BEIGE: "#d4a76a",
  BROWN: "#78350f",
  PURPLE: "#a855f7",
  MAROON: "#881337",
  GOLD: "#ca8a04",
};

const colourChartData = Object.entries(
  colourData as Record<string, { rank: number; share: number; label: string }>
)
  .sort((a, b) => a[1].rank - b[1].rank)
  .map(([name, d]) => ({
    colour: name.charAt(0) + name.slice(1).toLowerCase(),
    share: d.share,
    fill: COLOUR_HEX[name] ?? "#6b7280",
  }));

/* ---------- makes bar chart data ---------- */
const top10Makes = popularMakesData.slice(0, 10);
const makesBarData = [...top10Makes].reverse();

/* ---------- model trend line data ---------- */
const MODEL_COLORS: Record<string, string> = {
  fiesta: "#f59e0b",
  golf: "#0ea5e9",
  corsa: "#10b981",
  polo: "#a78bfa",
  focus: "#ef4444",
};

const MODEL_LABELS: Record<string, string> = {
  fiesta: "Ford Fiesta",
  golf: "VW Golf",
  corsa: "Vauxhall Corsa",
  polo: "VW Polo",
  focus: "Ford Focus",
};

/* ---------- component ---------- */
export default function PopularCarsCharts() {
  const [selectedMake, setSelectedMake] = useState("");

  const selectedInfo = useMemo(() => {
    if (!selectedMake) return null;
    const idx = popularMakesData.findIndex(
      (m) => m.make === selectedMake
    );
    if (idx === -1) return null;
    const entry = popularMakesData[idx];
    const rank = idx + 1;
    const ordinal =
      rank === 1
        ? "1st"
        : rank === 2
        ? "2nd"
        : rank === 3
        ? "3rd"
        : `${rank}th`;
    return { ...entry, rank, ordinal };
  }, [selectedMake]);

  return (
    <div className="space-y-8">
      {/* Chart 1: Top 10 makes by fleet size */}
      <ChartContainer
        title="Top 10 Makes by Fleet Size"
        subtitle="Number of registered vehicles in the UK (thousands)"
        className="[&>div:last-child]:!h-[320px] sm:[&>div:last-child]:!h-[380px] md:[&>div:last-child]:!h-[420px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={makesBarData}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              stroke="#2a2a2a"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 5000]}
              tickFormatter={(v: number) => `${v.toLocaleString()}k`}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="make"
              width={120}
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#d1d5db" }}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 10 }}
              content={
                <CustomTooltip
                  formatter={(v: number) =>
                    `${v.toLocaleString()}k (${(v * 1000).toLocaleString()} vehicles)`
                  }
                />
              }
            />
            <Bar
              dataKey="fleetSize"
              name="Fleet Size"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Chart 2: Top 5 models over time */}
      <ChartContainer
        title="Top 5 Models: New Registrations Over Time"
        subtitle="Annual new registrations (thousands) showing the decline of Ford Fiesta and Focus"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={popularModelTrend}
            margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#9ca3af" }}
            />
            <YAxis
              domain={[0, 140]}
              tickFormatter={(v: number) => `${v}k`}
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#9ca3af" }}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 10 }}
              content={
                <CustomTooltip
                  formatter={(v: number) =>
                    v === 0 ? "Discontinued" : `${v}k registrations`
                  }
                />
              }
            />
            {Object.keys(MODEL_COLORS).map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={MODEL_LABELS[key]}
                stroke={MODEL_COLORS[key]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Line legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
        {Object.entries(MODEL_COLORS).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            {MODEL_LABELS[key]}
          </span>
        ))}
      </div>

      {/* Chart 3: Colour popularity */}
      <ChartContainer
        title="Most Popular Car Colours"
        subtitle="Share of UK registered vehicles by colour"
        className="[&>div:last-child]:!h-[380px] sm:[&>div:last-child]:!h-[440px] md:[&>div:last-child]:!h-[500px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={colourChartData}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              stroke="#2a2a2a"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 30]}
              tickFormatter={(v: number) => `${v}%`}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="colour"
              width={80}
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#d1d5db" }}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 10 }}
              content={
                <CustomTooltip
                  formatter={(v: number) => `${v}%`}
                />
              }
            />
            <Bar dataKey="share" name="Market Share" radius={[0, 4, 4, 0]}>
              {colourChartData.map((entry) => (
                <Cell key={entry.colour} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Interactive: How popular is my car? */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-100">
          How Popular Is My Car?
        </h3>
        <p className="mb-4 text-sm text-gray-400">
          Select a make to see its rank and fleet size on UK roads.
        </p>

        <select
          value={selectedMake}
          onChange={(e) => setSelectedMake(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-[#374151] bg-[#111111] px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-600 transition-colors"
        >
          <option value="">Choose a make...</option>
          {popularMakesData.map((m) => (
            <option key={m.make} value={m.make}>
              {m.make}
            </option>
          ))}
        </select>

        {selectedInfo && (
          <div className="mt-4 rounded-lg border border-emerald-800/40 bg-emerald-900/20 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">
                  UK Fleet Size
                </div>
                <div className="mt-1 text-2xl font-bold text-emerald-400">
                  {(selectedInfo.fleetSize * 1000).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">registered vehicles</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">
                  Popularity Rank
                </div>
                <div className="mt-1 text-2xl font-bold text-emerald-400">
                  {selectedInfo.ordinal}
                </div>
                <div className="text-xs text-gray-400">
                  out of all makes in the UK
                </div>
              </div>
            </div>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              Check a {selectedInfo.make} vehicle &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
