"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  evAdoptionData,
  evRegionData,
} from "@/lib/stats-data/ev-adoption";
import ChartContainer from "@/components/stats/ChartContainer";
import CustomTooltip from "@/components/stats/CustomTooltip";

const NATIONAL_AVERAGE =
  evRegionData.reduce((sum, r) => sum + r.evPer1000, 0) / evRegionData.length;

export default function EvAdoptionCharts() {
  const [selectedRegion, setSelectedRegion] = useState("");

  const regionEntry = useMemo(
    () => evRegionData.find((r) => r.region === selectedRegion),
    [selectedRegion]
  );

  const salesData = useMemo(
    () => evAdoptionData.filter((d) => d.year >= 2019),
    []
  );

  return (
    <div className="space-y-8">
      {/* Chart 1: Cumulative fleet size line chart */}
      <ChartContainer
        title="UK Electric & Hybrid Vehicle Fleet"
        subtitle="Cumulative registered vehicles by powertrain, 2010-2025"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={evAdoptionData}
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
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000
                    ? `${(v / 1_000).toFixed(0)}k`
                    : `${v}`
              }
            />
            <Tooltip
              content={
                <CustomTooltip
                  formatter={(v: number) => v.toLocaleString()}
                />
              }
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
            />
            <Line
              type="monotone"
              dataKey="bev"
              name="BEV"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
            <Line
              type="monotone"
              dataKey="phev"
              name="PHEV"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#f59e0b" }}
            />
            <Line
              type="monotone"
              dataKey="hybrid"
              name="Hybrid"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#38bdf8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Chart 2: BEV new sales share bar chart */}
      <ChartContainer
        title="BEV Share of New Car Sales"
        subtitle="Percentage of new registrations that are battery electric, 2019-2025"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={salesData}
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
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              content={
                <CustomTooltip
                  formatter={(v: number) => `${v}%`}
                />
              }
            />
            <Bar
              dataKey="bevSalesPercent"
              name="BEV Sales Share"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Interactive: Regional EV density */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-100">
          How Many EVs in Your Area?
        </h3>
        <p className="mb-4 text-sm text-gray-400">
          Select a region to see EV density compared to the national average.
        </p>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="w-full rounded-lg border border-[#374151] bg-[#232323] px-3 py-2.5 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500 sm:w-64"
        >
          <option value="">Choose a region...</option>
          {evRegionData.map((r) => (
            <option key={r.region} value={r.region}>
              {r.region}
            </option>
          ))}
        </select>

        {regionEntry && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Region density */}
              <div className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {regionEntry.evPer1000.toFixed(1)}
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  EVs per 1,000 people in {regionEntry.region}
                </div>
              </div>
              {/* National average */}
              <div className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-4 text-center">
                <div className="text-2xl font-bold text-gray-300">
                  {NATIONAL_AVERAGE.toFixed(1)}
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  National average (EVs per 1,000)
                </div>
              </div>
            </div>

            {/* Comparison bars */}
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                  <span>{regionEntry.region}</span>
                  <span>{regionEntry.evPer1000.toFixed(1)} per 1,000</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#232323]">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min((regionEntry.evPer1000 / 30) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                  <span>National average</span>
                  <span>{NATIONAL_AVERAGE.toFixed(1)} per 1,000</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#232323]">
                  <div
                    className="h-full rounded-full bg-gray-500 transition-all duration-500"
                    style={{
                      width: `${Math.min((NATIONAL_AVERAGE / 30) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {regionEntry.evPer1000 > NATIONAL_AVERAGE ? (
              <p className="text-sm text-gray-400">
                {regionEntry.region} has{" "}
                <span className="font-medium text-emerald-400">
                  {((regionEntry.evPer1000 / NATIONAL_AVERAGE - 1) * 100).toFixed(0)}% more
                </span>{" "}
                EVs per capita than the national average.
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                {regionEntry.region} has{" "}
                <span className="font-medium text-amber-400">
                  {((1 - regionEntry.evPer1000 / NATIONAL_AVERAGE) * 100).toFixed(0)}% fewer
                </span>{" "}
                EVs per capita than the national average.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
