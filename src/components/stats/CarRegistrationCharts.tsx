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
  registrationData,
  registrationAnnotations,
  lastUpdated,
  source,
} from "@/lib/stats-data/car-registrations";
import ChartContainer from "@/components/stats/ChartContainer";
import { annotationLabel, annotatedChartProps } from "@/lib/chart-theme";

const FUEL_COLORS: Record<string, string> = {
  petrol: "#f59e0b",
  diesel: "#ef4444",
  bev: "#10b981",
  phev: "#a78bfa",
  hybrid: "#38bdf8",
};

const FUEL_LABELS: Record<string, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  bev: "BEV",
  phev: "PHEV",
  hybrid: "Hybrid",
};

const fuelSplitData = registrationData.filter(
  (d) => d.petrol !== undefined
);

export default function CarRegistrationCharts() {
  return (
    <div className="space-y-8">
      {/* Chart 1: Annual registrations area chart */}
      <ChartContainer
        title="UK Annual New Car Registrations"
        subtitle={`Thousands of vehicles registered per year · Last updated ${lastUpdated}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={registrationData}
            margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
            {...annotatedChartProps}
          >
            <defs>
              <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={50}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              tickFormatter={(v: number) => `${v}k`}
              label={{
                value: "Registrations (000s)",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 11 },
                offset: 10,
              }}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 10 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-[#374151] bg-[#1f2937] px-3 py-2 shadow-lg">
                    <div className="border-b border-emerald-500/40 pb-1 mb-2 text-xs font-medium text-gray-300">
                      {label}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-200">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-gray-400">Registrations:</span>
                      <span className="font-medium">
                        {((payload[0].value as number) * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            {registrationAnnotations.map((a, i) => (
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
              dataKey="total"
              name="Total"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#regFill)"
              activeDot={{ r: 4, fill: "#10b981" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Chart 2: Fuel type split stacked bar */}
      <ChartContainer
        title="New Car Registrations by Fuel Type"
        subtitle="Percentage share of annual registrations 2015–2025"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={fuelSplitData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            stackOffset="expand"
            barCategoryGap="20%"
          >
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 10 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
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
                          {typeof entry.value === "number"
                            ? entry.value.toFixed(1)
                            : entry.value}
                          %
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
              iconType="circle"
              iconSize={8}
            />
            {Object.entries(FUEL_COLORS).map(([key, color]) => (
              <Bar
                key={key}
                dataKey={key}
                name={FUEL_LABELS[key]}
                stackId="fuel"
                fill={color}
              />
            ))}
          </BarChart>
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
          SMMT Vehicle Registration Data
        </a>
      </p>
    </div>
  );
}
