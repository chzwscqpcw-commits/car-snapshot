"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  costOfMotoringData,
  lastUpdated,
  source,
} from "@/lib/stats-data/cost-of-motoring";
import ChartContainer from "@/components/stats/ChartContainer";

const COLORS = {
  fuel: "#f59e0b",
  insurance: "#ef4444",
  depreciation: "#38bdf8",
  ved: "#a78bfa",
  servicing: "#84cc16",
  total: "#d1d5db",
};

const CATEGORY_LABELS: Record<string, string> = {
  fuel: "Fuel",
  insurance: "Insurance",
  depreciation: "Depreciation",
  ved: "VED (Road Tax)",
  servicing: "Servicing & Repairs",
  total: "Total",
};

const MILEAGE_STEPS = [
  3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000,
  15000, 16000, 17000, 18000, 19000, 20000, 21000, 22000, 23000, 24000, 25000,
];

type FuelType = "petrol" | "diesel" | "hybrid" | "ev";
type ValueBand = "under10k" | "10to20k" | "20to30k" | "over30k";
type AreaType = "urban" | "suburban" | "rural";

// Base costs for personalised calculator (2025 averages)
const FUEL_COST_PER_MILE: Record<FuelType, number> = {
  petrol: 0.16,
  diesel: 0.14,
  hybrid: 0.10,
  ev: 0.05,
};

const INSURANCE_BASE: Record<FuelType, number> = {
  petrol: 1050,
  diesel: 1100,
  hybrid: 1150,
  ev: 1250,
};

const INSURANCE_AREA_MULT: Record<AreaType, number> = {
  urban: 1.25,
  suburban: 1.0,
  rural: 0.8,
};

const DEPRECIATION_RATE: Record<ValueBand, number> = {
  under10k: 0.12,
  "10to20k": 0.14,
  "20to30k": 0.16,
  "over30k": 0.18,
};

const VALUE_MIDPOINTS: Record<ValueBand, number> = {
  under10k: 7000,
  "10to20k": 15000,
  "20to30k": 25000,
  over30k: 40000,
};

const VED_COST: Record<FuelType, number> = {
  petrol: 190,
  diesel: 190,
  hybrid: 180,
  ev: 10,
};

const SERVICING_BASE: Record<FuelType, number> = {
  petrol: 820,
  diesel: 860,
  hybrid: 780,
  ev: 520,
};

const VALUE_BAND_LABELS: Record<ValueBand, string> = {
  under10k: "Under \u00a310k",
  "10to20k": "\u00a310\u201320k",
  "20to30k": "\u00a320\u201330k",
  over30k: "\u00a330k+",
};

interface ChartDataPoint {
  year: number;
  fuel: number;
  insurance: number;
  depreciation: number;
  ved: number;
  servicing: number;
  total: number;
}

export default function CostOfMotoringChart() {
  const [mileage, setMileage] = useState(10000);
  const [fuelType, setFuelType] = useState<FuelType>("petrol");
  const [valueBand, setValueBand] = useState<ValueBand>("10to20k");
  const [area, setArea] = useState<AreaType>("suburban");

  const chartData = useMemo<ChartDataPoint[]>(() => {
    return costOfMotoringData.map((d) => ({
      ...d,
      total: d.fuel + d.insurance + d.depreciation + d.ved + d.servicing,
    }));
  }, []);

  // Personalised cost breakdown
  const personalCosts = useMemo(() => {
    const fuel = Math.round(mileage * FUEL_COST_PER_MILE[fuelType]);
    const insurance = Math.round(
      INSURANCE_BASE[fuelType] * INSURANCE_AREA_MULT[area]
    );
    const depreciation = Math.round(
      VALUE_MIDPOINTS[valueBand] * DEPRECIATION_RATE[valueBand]
    );
    const ved = VED_COST[fuelType];
    const servicing = Math.round(
      SERVICING_BASE[fuelType] * (1 + (mileage - 10000) * 0.00003)
    );
    const total = fuel + insurance + depreciation + ved + servicing;
    return { fuel, insurance, depreciation, ved, servicing, total };
  }, [mileage, fuelType, valueBand, area]);

  const maxBarValue = Math.max(
    personalCosts.fuel,
    personalCosts.insurance,
    personalCosts.depreciation,
    personalCosts.ved,
    personalCosts.servicing
  );

  return (
    <div className="space-y-6">
      <ChartContainer
        title="Annual Cost of Motoring (2010\u20132025)"
        subtitle={`Stacked breakdown by category \u00b7 Last updated ${lastUpdated}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
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
              tickFormatter={(v: number) => `\u00a3${(v / 1000).toFixed(0)}k`}
              label={{
                value: "Annual cost (\u00a3)",
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
                    {payload.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-gray-200"
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-400">
                          {CATEGORY_LABELS[entry.dataKey as string] ??
                            entry.name}
                          :
                        </span>
                        <span className="font-medium">
                          {"\u00a3"}
                          {(entry.value as number).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="servicing"
              name="Servicing"
              stackId="1"
              fill={COLORS.servicing}
              fillOpacity={0.7}
              stroke={COLORS.servicing}
              strokeWidth={0}
            />
            <Area
              type="monotone"
              dataKey="ved"
              name="VED"
              stackId="1"
              fill={COLORS.ved}
              fillOpacity={0.7}
              stroke={COLORS.ved}
              strokeWidth={0}
            />
            <Area
              type="monotone"
              dataKey="insurance"
              name="Insurance"
              stackId="1"
              fill={COLORS.insurance}
              fillOpacity={0.7}
              stroke={COLORS.insurance}
              strokeWidth={0}
            />
            <Area
              type="monotone"
              dataKey="fuel"
              name="Fuel"
              stackId="1"
              fill={COLORS.fuel}
              fillOpacity={0.7}
              stroke={COLORS.fuel}
              strokeWidth={0}
            />
            <Area
              type="monotone"
              dataKey="depreciation"
              name="Depreciation"
              stackId="1"
              fill={COLORS.depreciation}
              fillOpacity={0.7}
              stroke={COLORS.depreciation}
              strokeWidth={0}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke={COLORS.total}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 4, fill: COLORS.total }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {(
          Object.entries(COLORS) as [keyof typeof COLORS, string][]
        ).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundColor: color,
                ...(key === "total"
                  ? { background: "none", borderTop: `2px dashed ${color}`, borderRadius: 0, height: 0, width: 10 }
                  : {}),
              }}
            />
            {CATEGORY_LABELS[key]}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-right">
        Source:{" "}
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-400 transition-colors"
        >
          RAC Foundation Running Costs
        </a>
      </p>

      {/* Personalised Calculator */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-100">
          Your Car Cost Calculator
        </h3>
        <p className="mb-5 text-sm text-gray-400">
          Adjust the inputs below to estimate your personalised annual motoring
          costs.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Annual Mileage */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Annual Mileage
            </label>
            <input
              type="range"
              min={3000}
              max={25000}
              step={1000}
              value={mileage}
              onChange={(e) => setMileage(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>3,000</span>
              <span className="font-medium text-emerald-400">
                {mileage.toLocaleString()} miles
              </span>
              <span>25,000</span>
            </div>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Fuel Type
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["petrol", "diesel", "hybrid", "ev"] as FuelType[]).map(
                (ft) => (
                  <button
                    key={ft}
                    onClick={() => setFuelType(ft)}
                    className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      fuelType === ft
                        ? "bg-emerald-600 text-white"
                        : "bg-[#232323] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {ft === "ev" ? "EV" : ft.charAt(0).toUpperCase() + ft.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Vehicle Value */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Vehicle Value
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {(
                ["under10k", "10to20k", "20to30k", "over30k"] as ValueBand[]
              ).map((vb) => (
                <button
                  key={vb}
                  onClick={() => setValueBand(vb)}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    valueBand === vb
                      ? "bg-emerald-600 text-white"
                      : "bg-[#232323] text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {VALUE_BAND_LABELS[vb]}
                </button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Area
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["urban", "suburban", "rural"] as AreaType[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setArea(a)}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    area === a
                      ? "bg-emerald-600 text-white"
                      : "bg-[#232323] text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result breakdown */}
        <div className="mt-6 rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm font-medium text-gray-300">
              Estimated Annual Cost
            </span>
            <span className="text-2xl font-bold text-emerald-400">
              {"\u00a3"}
              {personalCosts.total.toLocaleString()}
            </span>
          </div>
          <div className="space-y-2">
            {(
              [
                { key: "depreciation", label: "Depreciation", color: COLORS.depreciation },
                { key: "fuel", label: "Fuel", color: COLORS.fuel },
                { key: "insurance", label: "Insurance", color: COLORS.insurance },
                { key: "servicing", label: "Servicing & Repairs", color: COLORS.servicing },
                { key: "ved", label: "VED (Road Tax)", color: COLORS.ved },
              ] as const
            ).map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs text-gray-400">
                  {label}
                </span>
                <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-[#1f1f1f]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                    style={{
                      width: `${(personalCosts[key] / maxBarValue) * 100}%`,
                      backgroundColor: color,
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs font-medium text-gray-200">
                  {"\u00a3"}
                  {personalCosts[key].toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-[#2a2a2a] pt-2 text-xs text-gray-500">
            {"\u00a3"}
            {Math.round(personalCosts.total / 12).toLocaleString()} per month
            {" \u00b7 \u00a3"}
            {Math.round(personalCosts.total / 52).toLocaleString()} per week
            {" \u00b7 "}
            {(personalCosts.total / mileage).toFixed(2)}p per mile
          </div>
        </div>
      </div>
    </div>
  );
}
