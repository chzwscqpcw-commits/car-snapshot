"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  roadSafetyData,
  casualtyByTypeData,
  safetyAnnotations,
  lastUpdated,
  source,
} from "@/lib/stats-data/road-safety";
import ChartContainer from "@/components/stats/ChartContainer";
import { annotationLabel, annotatedChartProps } from "@/lib/chart-theme";

export default function RoadSafetyCharts() {
  return (
    <div className="space-y-6">
      {/* Chart 1: Road Fatalities Area Chart */}
      <ChartContainer
        title="UK Road Fatalities 1970-2024"
        subtitle={`Annual fatalities on British roads · Last updated ${lastUpdated}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={roadSafetyData}
            margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
            {...annotatedChartProps}
          >
            <defs>
              <linearGradient id="fatalityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              label={{
                value: "Fatalities",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 11 },
                offset: 10,
              }}
              tickFormatter={(v: number) => v.toLocaleString()}
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
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-gray-400">Fatalities:</span>
                      <span className="font-medium">
                        {(payload[0].value as number).toLocaleString()}
                      </span>
                    </div>
                    {payload[1]?.value != null && (
                      <div className="flex items-center gap-2 text-xs text-gray-200">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-gray-400">Serious injuries:</span>
                        <span className="font-medium">
                          {(payload[1].value as number).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {safetyAnnotations.map((a, i) => (
              <ReferenceLine
                key={a.year}
                x={a.year}
                stroke="#4b5563"
                strokeDasharray="4 4"
                label={annotationLabel(a.label, i)}
              />
            ))}
            <Area
              type="monotone"
              dataKey="fatalities"
              name="Fatalities"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#fatalityFill)"
              activeDot={{ r: 4, fill: "#10b981" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <p className="text-xs text-gray-500 text-right">
        Source:{" "}
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-400 transition-colors"
        >
          DfT STATS19 Road Accident Statistics
        </a>
      </p>

      {/* Chart 2: Casualties by Road User Type (Stacked Bar) */}
      <ChartContainer
        title="Fatalities by Road User Type"
        subtitle="Annual fatalities broken down by road user category (last 10 years)"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={casualtyByTypeData}
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
              label={{
                value: "Fatalities",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 11 },
                offset: 10,
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const total = payload.reduce(
                  (sum, entry) => sum + (entry.value as number),
                  0
                );
                return (
                  <div className="rounded-lg border border-[#374151] bg-[#1f2937] px-3 py-2 shadow-lg">
                    <div className="border-b border-emerald-500/40 pb-1 mb-2 text-xs font-medium text-gray-300">
                      {label}
                    </div>
                    {payload.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-gray-200"
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-400">{entry.name}:</span>
                        <span className="font-medium">
                          {(entry.value as number).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="mt-1 border-t border-gray-600 pt-1 flex items-center gap-2 text-xs text-gray-300">
                      <span className="text-gray-400">Total:</span>
                      <span className="font-medium">
                        {total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
              iconType="square"
              iconSize={10}
            />
            <Bar
              dataKey="carOccupants"
              name="Car Occupants"
              stackId="casualties"
              fill="#38bdf8"
            />
            <Bar
              dataKey="pedestrians"
              name="Pedestrians"
              stackId="casualties"
              fill="#f59e0b"
            />
            <Bar
              dataKey="cyclists"
              name="Cyclists"
              stackId="casualties"
              fill="#10b981"
            />
            <Bar
              dataKey="motorcyclists"
              name="Motorcyclists"
              stackId="casualties"
              fill="#ef4444"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
