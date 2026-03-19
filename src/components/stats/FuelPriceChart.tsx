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
  ReferenceLine,
} from "recharts";
import {
  fuelPriceData,
  weeklyData,
  getMonthlyData,
  fuelPriceAnnotations,
  lastUpdated,
  latestWeek,
  source,
} from "@/lib/stats-data/fuel-prices";
import ChartContainer from "@/components/stats/ChartContainer";
import { annotationLabel, annotatedChartProps } from "@/lib/chart-theme";

type Granularity = "weekly" | "monthly" | "annual";
type Range = "3M" | "6M" | "1Y" | "5Y" | "10Y" | "All";
const TANK_PRESETS = [30, 40, 50, 60, 70, 80] as const;

interface ChartPoint {
  label: string; // x-axis label
  sortKey: string; // for filtering
  petrol: number;
  diesel: number;
}

function tooltipFormatter(value: number, tankLitres: number | null) {
  if (tankLitres) return `£${value.toFixed(2)}`;
  return `${value.toFixed(1)}p`;
}

function formatWeekLabel(date: string): string {
  const d = new Date(date);
  const day = d.getDate();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

export default function FuelPriceChart() {
  const [granularity, setGranularity] = useState<Granularity>("weekly");
  const [range, setRange] = useState<Range>("1Y");
  const [tankLitres, setTankLitres] = useState<number | null>(null);
  const [customTank, setCustomTank] = useState("");

  const monthlyData = useMemo(() => getMonthlyData(), []);

  // Build full dataset for the selected granularity
  const fullData = useMemo<ChartPoint[]>(() => {
    if (granularity === "annual") {
      return fuelPriceData.map((d) => ({
        label: String(d.year),
        sortKey: String(d.year),
        petrol: d.petrol,
        diesel: d.diesel,
      }));
    }
    if (granularity === "monthly") {
      return monthlyData.map((d) => ({
        label: formatMonthLabel(d.month),
        sortKey: d.month,
        petrol: d.petrol,
        diesel: d.diesel,
      }));
    }
    // weekly
    return weeklyData.map((d) => ({
      label: formatWeekLabel(d.date),
      sortKey: d.date,
      petrol: d.petrol,
      diesel: d.diesel,
    }));
  }, [granularity, monthlyData]);

  // Apply range filter
  const filteredData = useMemo(() => {
    if (range === "All") return fullData;

    const now = new Date();
    let cutoff: Date;
    switch (range) {
      case "3M": cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
      case "6M": cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); break;
      case "1Y": cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
      case "5Y": cutoff = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()); break;
      case "10Y": cutoff = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate()); break;
      default: return fullData;
    }

    const cutoffStr = cutoff.toISOString().slice(0, 10);

    if (granularity === "annual") {
      const cutoffYear = String(cutoff.getFullYear());
      return fullData.filter((d) => d.sortKey >= cutoffYear);
    }

    return fullData.filter((d) => d.sortKey >= cutoffStr);
  }, [fullData, range, granularity]);

  // Apply tank conversion
  const chartData = useMemo(() => {
    if (!tankLitres) return filteredData;
    return filteredData.map((d) => ({
      ...d,
      petrol: parseFloat(((d.petrol / 100) * tankLitres).toFixed(2)),
      diesel: parseFloat(((d.diesel / 100) * tankLitres).toFixed(2)),
    }));
  }, [filteredData, tankLitres]);

  // Annotations visible in current range
  const visibleAnnotations = useMemo(() => {
    if (granularity === "annual") {
      const minYear = parseInt(filteredData[0]?.sortKey ?? "0", 10);
      return fuelPriceAnnotations.filter((a) => a.year >= minYear);
    }
    const minDate = filteredData[0]?.sortKey ?? "";
    return fuelPriceAnnotations.filter((a) => a.date >= minDate);
  }, [filteredData, granularity]);

  // Map annotation to the x-axis label of the nearest data point
  function annotationX(a: typeof fuelPriceAnnotations[0]): string | number {
    if (granularity === "annual") return a.year;
    // Use string comparison on sortKeys — both YYYY-MM-DD and YYYY-MM sort correctly
    const target = a.date;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < filteredData.length; i++) {
      // Pad monthly sortKeys (YYYY-MM) to YYYY-MM-01 for consistent comparison
      const sk = filteredData[i].sortKey.length === 7
        ? filteredData[i].sortKey + "-01"
        : filteredData[i].sortKey;
      const dist = Math.abs(
        new Date(sk).getTime() - new Date(target).getTime()
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return filteredData[bestIdx]?.label ?? "";
  }

  const yLabel = tankLitres ? "Fill cost (£)" : "Pence per litre (PPL)";

  const rangeOptions: Range[] = granularity === "annual"
    ? ["5Y", "10Y", "All"]
    : ["3M", "6M", "1Y", "5Y", "10Y", "All"];

  // Auto-select sensible range when switching granularity
  function handleGranularity(g: Granularity) {
    setGranularity(g);
    if (g === "weekly" && (range === "10Y" || range === "All" || range === "5Y")) setRange("1Y");
    if (g === "annual" && (range === "3M" || range === "6M")) setRange("5Y");
  }

  function handleTankPreset(litres: number) {
    setTankLitres(tankLitres === litres ? null : litres);
    setCustomTank("");
  }

  function handleCustomTank(val: string) {
    setCustomTank(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 200) {
      setTankLitres(parsed);
    } else if (val === "") {
      setTankLitres(null);
    }
  }

  // Determine tick interval based on data points
  const tickInterval = useMemo(() => {
    const len = chartData.length;
    if (len <= 15) return 0;
    if (len <= 30) return 1;
    if (len <= 60) return 3;
    if (len <= 120) return 7;
    return Math.floor(len / 15);
  }, [chartData]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 sm:px-6 sm:py-4 space-y-3">
        {/* Granularity toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">View:</span>
          {(["weekly", "monthly", "annual"] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => handleGranularity(g)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                granularity === g
                  ? "bg-blue-600 text-white"
                  : "bg-[#232323] text-gray-400 hover:text-gray-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Range selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Range:</span>
          {rangeOptions.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                range === r
                  ? "bg-emerald-600 text-white"
                  : "bg-[#232323] text-gray-400 hover:text-gray-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Tank size */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Tank size:</span>
          {TANK_PRESETS.map((litres) => (
            <button
              key={litres}
              onClick={() => handleTankPreset(litres)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                tankLitres === litres
                  ? "bg-amber-600 text-white"
                  : "bg-[#232323] text-gray-400 hover:text-gray-200"
              }`}
            >
              {litres}L
            </button>
          ))}
          <input
            type="number"
            placeholder="Custom"
            value={customTank}
            onChange={(e) => handleCustomTank(e.target.value)}
            className="w-20 rounded-md bg-[#232323] px-2 py-1 text-xs text-gray-200 placeholder-gray-500 outline-none focus:ring-1 focus:ring-emerald-500"
            min={1}
            max={200}
          />
          {tankLitres && (
            <button
              onClick={() => {
                setTankLitres(null);
                setCustomTank("");
              }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <ChartContainer
        title="UK Fuel Prices Over Time"
        subtitle={`${granularity === "weekly" ? "Weekly" : granularity === "monthly" ? "Monthly average" : "Annual average"} prices · Updated ${lastUpdated}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
            {...annotatedChartProps}
          >
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={50}
              interval={tickInterval}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              label={{
                value: yLabel,
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 11 },
                offset: 10,
              }}
              tickFormatter={(v: number) =>
                tankLitres ? `£${v}` : `${v}p`
              }
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
                          {tooltipFormatter(
                            entry.value as number,
                            tankLitres
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            {visibleAnnotations.map((a, i) => (
              <ReferenceLine
                key={`${a.label}-${i}`}
                x={annotationX(a)}
                stroke="#4b5563"
                strokeDasharray="4 4"
                label={annotationLabel(a.label, i)}
              />
            ))}
            <Line
              type="monotone"
              dataKey="petrol"
              name="Petrol"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
            <Line
              type="monotone"
              dataKey="diesel"
              name="Diesel"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#f59e0b" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Latest price callout */}
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="text-gray-500">Latest ({latestWeek.date}):</span>
        <span className="text-emerald-400 font-medium">Petrol {latestWeek.petrol}p</span>
        <span className="text-amber-400 font-medium">Diesel {latestWeek.diesel}p</span>
      </div>

      <p className="text-xs text-gray-500 text-right">
        Source:{" "}
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-400 transition-colors"
        >
          DESNZ Weekly Road Fuel Prices
        </a>
      </p>
    </div>
  );
}
