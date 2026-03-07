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
import rawData from "@/data/mot-pass-rates.json";
import ChartContainer from "@/components/stats/ChartContainer";
import CustomTooltip from "@/components/stats/CustomTooltip";

/* ---------- helpers ---------- */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ---------- types ---------- */
interface ModelEntry {
  rank: number;
  make: string;
  model: string;
  label: string;
  tests: number;
  passRate: number;
}

type SortKey = "rank" | "label" | "tests" | "passRate";

/* ---------- tier colour helper ---------- */
function tierColor(rate: number): string {
  if (rate >= 85) return "#10b981"; // emerald-500
  if (rate >= 80) return "#0ea5e9"; // sky-500
  if (rate >= 75) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

/* ---------- age-degradation simulation ---------- */
const AGE_PROFILES: Record<string, number[]> = {
  "Toyota Yaris": [97, 95, 92, 89, 86, 83, 80, 77, 74, 72],
  "VW Golf": [96, 93, 89, 85, 81, 78, 75, 72, 69, 66],
  "Ford Fiesta": [95, 92, 88, 84, 80, 77, 74, 71, 68, 65],
  "Vauxhall Corsa": [95, 91, 87, 83, 79, 76, 73, 70, 67, 64],
  "Audi A3": [96, 93, 89, 85, 81, 77, 74, 71, 68, 65],
};

const LINE_COLORS: Record<string, string> = {
  "Toyota Yaris": "#10b981",
  "VW Golf": "#0ea5e9",
  "Ford Fiesta": "#f59e0b",
  "Vauxhall Corsa": "#ef4444",
  "Audi A3": "#a78bfa",
};

const ageData = Array.from({ length: 10 }, (_, i) => {
  const point: Record<string, string | number> = { age: `${i + 1} yr` };
  for (const [name, rates] of Object.entries(AGE_PROFILES)) {
    point[name] = rates[i];
  }
  return point;
});

/* ---------- component ---------- */
export default function ReliabilityCharts() {
  const top20 = useMemo<ModelEntry[]>(() => {
    const entries = Object.entries(
      rawData as unknown as Record<string, [number, number]>
    )
      .map(([key, [tests, passRate]]) => {
        const [make, model] = key.split("|");
        return {
          make,
          model,
          label: `${titleCase(make)} ${titleCase(model)}`,
          tests,
          passRate,
        };
      })
      .filter((e) => e.tests > 50000)
      .sort((a, b) => b.passRate - a.passRate)
      .slice(0, 20)
      .map((e, i) => ({ ...e, rank: i + 1 }));
    return entries;
  }, []);

  /* --- sortable table state --- */
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...top20];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av;
      }
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [top20, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "label");
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return "";
    return sortAsc ? " \u25B2" : " \u25BC";
  }

  /* --- chart data (reversed so highest appears at top of horizontal bar) --- */
  const barData = useMemo(
    () => [...top20].reverse(),
    [top20]
  );

  return (
    <div className="space-y-8">
      {/* Chart 1: Top 20 horizontal bar */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-100">
          Top 20 Most Reliable Cars
        </h3>
        <p className="mb-4 text-sm text-gray-400">
          Models with 50,000+ MOT tests, ranked by pass rate
        </p>
        <div className="w-full h-[420px] sm:h-[520px] md:h-[620px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
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
                domain={[70, 90]}
                tickFormatter={(v: number) => `${v}%`}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
                stroke="#6b7280"
                fontSize={11}
                tick={{ fill: "#d1d5db" }}
              />
              <Tooltip
                wrapperStyle={{ zIndex: 10 }}
                content={
                  <CustomTooltip
                    formatter={(v: number) => `${v.toFixed(1)}%`}
                  />
                }
              />
              <Bar dataKey="passRate" name="Pass Rate" radius={[0, 4, 4, 0]}>
                {barData.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={tierColor(entry.passRate)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tier legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          85%+ Excellent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" />
          80-84% Good
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          75-79% Average
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          Below 75%
        </span>
      </div>

      {/* Chart 2: Reliability by age */}
      <ChartContainer
        title="How Reliability Drops With Age"
        subtitle="Simulated MOT pass rate by vehicle age for 5 popular models"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={ageData}
            margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#9ca3af" }}
            />
            <YAxis
              domain={[60, 100]}
              tickFormatter={(v: number) => `${v}%`}
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#9ca3af" }}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 10 }}
              content={
                <CustomTooltip
                  formatter={(v: number) => `${v}%`}
                />
              }
            />
            {Object.keys(AGE_PROFILES).map((name) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={LINE_COLORS[name]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Line legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
        {Object.entries(LINE_COLORS).map(([name, color]) => (
          <span key={name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            {name}
          </span>
        ))}
      </div>

      {/* League table */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
        <div className="px-4 py-4 sm:px-6">
          <h3 className="text-lg font-semibold text-gray-100">
            Reliability League Table
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Click column headers to sort. Only models with 50,000+ MOT tests
            included.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-[#2a2a2a] bg-[#141414] text-left text-xs uppercase tracking-wider text-gray-500">
                <th
                  className="cursor-pointer select-none px-4 py-3 sm:px-6 hover:text-gray-300 transition-colors"
                  onClick={() => toggleSort("rank")}
                >
                  Rank{sortIndicator("rank")}
                </th>
                <th
                  className="cursor-pointer select-none px-4 py-3 sm:px-6 hover:text-gray-300 transition-colors"
                  onClick={() => toggleSort("label")}
                >
                  Model{sortIndicator("label")}
                </th>
                <th
                  className="cursor-pointer select-none px-4 py-3 sm:px-6 text-right hover:text-gray-300 transition-colors"
                  onClick={() => toggleSort("tests")}
                >
                  Tests{sortIndicator("tests")}
                </th>
                <th
                  className="cursor-pointer select-none px-4 py-3 sm:px-6 text-right hover:text-gray-300 transition-colors"
                  onClick={() => toggleSort("passRate")}
                >
                  Pass Rate{sortIndicator("passRate")}
                </th>
                <th className="px-4 py-3 sm:px-6 text-right">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {sorted.map((entry) => (
                <tr
                  key={entry.label}
                  className="transition-colors hover:bg-[#1f1f1f]"
                >
                  <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-gray-400 font-medium">
                    {entry.rank}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-gray-100 font-medium">
                    {entry.label}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-right text-gray-400">
                    {entry.tests.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-right font-semibold">
                    <span style={{ color: tierColor(entry.passRate) }}>
                      {entry.passRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-right">
                    <Link
                      href={`/?reg=${entry.make}+${entry.model}`}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors text-xs font-medium"
                    >
                      Check &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
