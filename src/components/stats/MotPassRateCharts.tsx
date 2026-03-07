"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import passRateData from "@/data/mot-pass-rates.json";
import failureReasonData from "@/data/mot-failure-reasons.json";
import ChartContainer from "@/components/stats/ChartContainer";
import Link from "next/link";

/* ---------- types ---------- */
interface MakeAggregate {
  make: string;
  totalVehicles: number;
  weightedPassRate: number;
}

interface FailureCategory {
  name: string;
  count: number;
  percentage: number;
}

/* ---------- colour helpers ---------- */
function barColor(rate: number): string {
  if (rate >= 80) return "#10b981"; // emerald-500
  if (rate >= 75) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

const PIE_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#a855f7", // purple
  "#64748b", // slate
];

/* ---------- data processing ---------- */
const passRates = passRateData as unknown as Record<string, [number, number]>;
const failureReasons = failureReasonData as Record<string, string[]>;

function aggregateByMake(): MakeAggregate[] {
  const map = new Map<string, { total: number; weighted: number }>();

  for (const [key, [count, rate]] of Object.entries(passRates)) {
    const make = key.split("|")[0];
    const existing = map.get(make) ?? { total: 0, weighted: 0 };
    existing.total += count;
    existing.weighted += count * rate;
    map.set(make, existing);
  }

  return Array.from(map.entries()).map(([make, { total, weighted }]) => ({
    make,
    totalVehicles: total,
    weightedPassRate: parseFloat((weighted / total).toFixed(1)),
  }));
}

function countFailureReasons(): FailureCategory[] {
  const counts = new Map<string, number>();
  let total = 0;

  for (const reasons of Object.values(failureReasons)) {
    for (const reason of reasons) {
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
      total++;
    }
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: parseFloat(((count / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);
}

function getTopFailureReasonsForMake(make: string): string[] {
  const counts = new Map<string, number>();

  for (const [key, reasons] of Object.entries(failureReasons)) {
    if (key.split("|")[0] === make) {
      for (const reason of reasons) {
        counts.set(reason, (counts.get(reason) ?? 0) + 1);
      }
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);
}

const allMakes = aggregateByMake().sort((a, b) =>
  a.make.localeCompare(b.make)
);
const failureCategories = countFailureReasons();

/* ---------- custom tooltip ---------- */
function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: MakeAggregate }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#374151] bg-[#1f2937] px-3 py-2 shadow-lg">
      <div className="border-b border-emerald-500/40 pb-1 mb-2 text-xs font-medium text-gray-300">
        {label}
      </div>
      <div className="text-xs text-gray-200">
        <span className="text-gray-400">Pass rate:</span>{" "}
        <span className="font-medium">{d.weightedPassRate}%</span>
      </div>
      <div className="text-xs text-gray-200">
        <span className="text-gray-400">Tests:</span>{" "}
        <span className="font-medium">
          {d.totalVehicles.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: FailureCategory;
  }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#374151] bg-[#1f2937] px-3 py-2 shadow-lg">
      <div className="border-b border-emerald-500/40 pb-1 mb-2 text-xs font-medium text-gray-300">
        {d.name}
      </div>
      <div className="text-xs text-gray-200">
        <span className="text-gray-400">Share:</span>{" "}
        <span className="font-medium">{d.percentage}%</span>
      </div>
      <div className="text-xs text-gray-200">
        <span className="text-gray-400">Mentions:</span>{" "}
        <span className="font-medium">{d.count.toLocaleString()}</span>
      </div>
    </div>
  );
}

/* ---------- component ---------- */
export default function MotPassRateCharts() {
  const [selectedMake, setSelectedMake] = useState<string>("");

  const top20 = useMemo(() => {
    return [...allMakes]
      .sort((a, b) => b.totalVehicles - a.totalVehicles)
      .slice(0, 20)
      .sort((a, b) => b.weightedPassRate - a.weightedPassRate);
  }, []);

  const selectedData = useMemo(() => {
    if (!selectedMake) return null;
    const agg = allMakes.find((m) => m.make === selectedMake);
    if (!agg) return null;
    return {
      ...agg,
      topFailures: getTopFailureReasonsForMake(selectedMake),
    };
  }, [selectedMake]);

  return (
    <div className="space-y-6">
      {/* Interactive make finder */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-100">
          Find Your Car&apos;s Pass Rate
        </h3>
        <p className="mb-4 text-sm text-gray-400">
          Select a make to see its average MOT pass rate and top failure reasons.
        </p>

        <select
          value={selectedMake}
          onChange={(e) => setSelectedMake(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-[#374151] bg-[#232323] px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Choose a make...</option>
          {allMakes.map((m) => (
            <option key={m.make} value={m.make}>
              {m.make}
            </option>
          ))}
        </select>

        {selectedData && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4 text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: barColor(selectedData.weightedPassRate) }}
              >
                {selectedData.weightedPassRate}%
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Average pass rate
              </div>
            </div>
            <div className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4 text-center">
              <div className="text-2xl font-bold text-sky-400">
                {selectedData.totalVehicles.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-gray-400">Total MOT tests</div>
            </div>
            <div className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
              <div className="text-xs font-medium text-gray-300 mb-2">
                Top failure reasons
              </div>
              <div className="space-y-1">
                {selectedData.topFailures.map((reason, i) => (
                  <div
                    key={reason}
                    className="flex items-center gap-2 text-xs text-gray-400"
                  >
                    <span className="text-gray-500">{i + 1}.</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart 1: Horizontal bar chart - Top 20 makes */}
      <ChartContainer
        title="MOT Pass Rates by Make"
        subtitle="Top 20 makes by volume, ranked by pass rate"
        className={top20.length > 15 ? "[&>div:last-child]:!h-[500px] sm:[&>div:last-child]:!h-[600px]" : ""}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top20}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
          >
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[60, 90]}
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="make"
              width={120}
              stroke="#6b7280"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickLine={false}
            />
            <Tooltip
              content={<BarTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="weightedPassRate" name="Pass rate" radius={[0, 4, 4, 0]}>
              {top20.map((entry) => (
                <Cell
                  key={entry.make}
                  fill={
                    selectedMake && selectedMake === entry.make
                      ? "#38bdf8"
                      : barColor(entry.weightedPassRate)
                  }
                  opacity={
                    selectedMake && selectedMake !== entry.make ? 0.4 : 1
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <p className="text-xs text-gray-500 text-right">
        Source: DVSA MOT testing data (2024/25 test year)
      </p>

      {/* Mid-page CTA */}
      <div className="rounded-xl border border-emerald-800/40 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 p-6 text-center">
        <h3 className="text-lg font-bold text-gray-100">
          How does your car compare?
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
          Enter your reg plate for a full MOT history, health score and
          personalised insights.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Check your vehicle free
        </Link>
      </div>

      {/* Chart 2: Donut chart - Failure reasons */}
      <ChartContainer
        title="Most Common MOT Failure Reasons"
        subtitle="Distribution of failure categories across all models tested"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={failureCategories}
              dataKey="percentage"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="75%"
              paddingAngle={2}
              label={(props: PieLabelRenderProps) => {
                const name = props.name as string;
                const pct = (props as unknown as FailureCategory).percentage;
                return `${name} (${pct}%)`;
              }}
              labelLine={{ stroke: "#4b5563" }}
            >
              {failureCategories.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      <p className="text-xs text-gray-500 text-right">
        Source: DVSA MOT testing data (2024/25 test year)
      </p>

      {/* Failure reasons table */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-100">
          Failure Reason Breakdown
        </h3>
        <p className="mb-4 text-sm text-gray-400">
          How often each category appears as a failure reason across all tested
          models.
        </p>
        <div className="space-y-2">
          {failureCategories.map((cat, i) => (
            <div key={cat.name} className="flex items-center gap-3">
              <span className="w-5 text-right text-xs text-gray-500">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-200">{cat.name}</span>
                  <span className="text-xs text-gray-400">
                    {cat.percentage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#232323]">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(cat.percentage / failureCategories[0].percentage) * 100}%`,
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
