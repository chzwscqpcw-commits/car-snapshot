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
  fuelPriceAnnotations,
  lastUpdated,
  source,
} from "@/lib/stats-data/fuel-prices";
import ChartContainer from "@/components/stats/ChartContainer";

type Range = "1Y" | "5Y" | "10Y" | "All";
const TANK_PRESETS = [30, 40, 50, 60, 70, 80] as const;

interface ChartDataPoint {
  year: number;
  petrol: number;
  diesel: number;
}

function tooltipFormatter(
  value: number,
  name: string,
  tankLitres: number | null
) {
  if (tankLitres) {
    // chartData is already converted to £ when tankLitres is set
    return `\u00a3${value.toFixed(2)}`;
  }
  return `${value.toFixed(1)}p`;
}

export default function FuelPriceChart() {
  const [range, setRange] = useState<Range>("All");
  const [tankLitres, setTankLitres] = useState<number | null>(null);
  const [customTank, setCustomTank] = useState("");

  const latestYear = fuelPriceData[fuelPriceData.length - 1].year;

  const filteredData = useMemo<ChartDataPoint[]>(() => {
    const cutoff =
      range === "1Y"
        ? latestYear - 1
        : range === "5Y"
          ? latestYear - 5
          : range === "10Y"
            ? latestYear - 10
            : 0;
    return fuelPriceData.filter((d) => d.year >= cutoff);
  }, [range, latestYear]);

  const chartData = useMemo(() => {
    if (!tankLitres) return filteredData;
    return filteredData.map((d) => ({
      year: d.year,
      petrol: parseFloat(((d.petrol / 100) * tankLitres).toFixed(2)),
      diesel: parseFloat(((d.diesel / 100) * tankLitres).toFixed(2)),
    }));
  }, [filteredData, tankLitres]);

  const visibleAnnotations = useMemo(() => {
    const minYear = filteredData[0]?.year ?? 0;
    return fuelPriceAnnotations.filter((a) => a.year >= minYear);
  }, [filteredData]);

  const yLabel = tankLitres ? `Fill cost (\u00a3)` : "Pence per litre (PPL)";

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

  return (
    <div className="space-y-4">
      {/* Controls above the chart card */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 sm:px-6 sm:py-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Range:</span>
          {(["1Y", "5Y", "10Y", "All"] as Range[]).map((r) => (
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
        subtitle={`Annual average prices \u00b7 Last updated ${lastUpdated}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
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
                value: yLabel,
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 11 },
                offset: 10,
              }}
              tickFormatter={(v: number) =>
                tankLitres ? `\u00a3${v}` : `${v}p`
              }
            />
            <Tooltip
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
                            entry.name as string,
                            tankLitres
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            {visibleAnnotations.map((a) => (
              <ReferenceLine
                key={a.year}
                x={a.year}
                stroke="#4b5563"
                strokeDasharray="4 4"
                label={{
                  value: a.label,
                  position: "top",
                  fill: "#9ca3af",
                  fontSize: 10,
                }}
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
