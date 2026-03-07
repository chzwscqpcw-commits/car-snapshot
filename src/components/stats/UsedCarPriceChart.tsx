"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  usedCarPriceData,
  avgDepreciationCurve,
  lastUpdated,
  source,
} from "@/lib/stats-data/used-car-prices";
import ChartContainer from "@/components/stats/ChartContainer";

const CATEGORY_MULTIPLIERS = [
  { label: "Economy", value: 0.85 },
  { label: "Mid-range", value: 1.0 },
  { label: "Premium", value: 1.1 },
  { label: "Luxury", value: 1.2 },
] as const;

const PURCHASE_YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i);

function formatCurrency(value: number): string {
  return `£${value.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

export default function UsedCarPriceChart() {
  const [purchaseYear, setPurchaseYear] = useState(2020);
  const [purchasePrice, setPurchasePrice] = useState("15000");
  const [categoryMultiplier, setCategoryMultiplier] = useState(1.0);

  const currentYear = 2025;

  const depreciationResult = useMemo(() => {
    const price = parseFloat(purchasePrice);
    if (isNaN(price) || price <= 0) return null;

    const ageNow = currentYear - purchaseYear;
    const agePlus3 = ageNow + 3;

    // Find the retention percentages using the depreciation curve
    const getRetention = (age: number) => {
      if (age <= 0) return 100;
      if (age >= 10) return avgDepreciationCurve[10].percentRetained;
      return avgDepreciationCurve[age].percentRetained;
    };

    const retentionNow = getRetention(ageNow);
    const retentionPlus3 = getRetention(agePlus3);

    // Apply category multiplier to slow or speed depreciation
    // Higher multiplier means better retention (premium/luxury hold value better)
    const adjustedRetentionNow = Math.min(
      100,
      retentionNow * categoryMultiplier
    );
    const adjustedRetentionPlus3 = Math.min(
      100,
      retentionPlus3 * categoryMultiplier
    );

    const currentValue = price * (adjustedRetentionNow / 100);
    const projectedValue = price * (adjustedRetentionPlus3 / 100);
    const totalDepreciation = price - currentValue;
    const furtherDepreciation = currentValue - projectedValue;

    return {
      currentValue,
      projectedValue,
      adjustedRetentionNow,
      adjustedRetentionPlus3,
      totalDepreciation,
      furtherDepreciation,
      ageNow,
      agePlus3,
    };
  }, [purchaseYear, purchasePrice, categoryMultiplier, currentYear]);

  // Annotated data points for reference lines
  const annotations = usedCarPriceData.filter((d) => d.label);

  return (
    <div className="space-y-6">
      {/* Chart 1: Price Index Area Chart */}
      <ChartContainer
        title="UK Used Car Price Index"
        subtitle={`Quarterly index (100 = Q1 2019) · Last updated ${lastUpdated}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={usedCarPriceData}
            margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="indexFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis
              dataKey="quarter"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              interval={3}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              domain={[80, 160]}
              label={{
                value: "Price Index",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 11 },
                offset: 10,
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const dataPoint = usedCarPriceData.find(
                  (d) => d.quarter === label
                );
                return (
                  <div className="rounded-lg border border-[#374151] bg-[#1f2937] px-3 py-2 shadow-lg">
                    <div className="border-b border-emerald-500/40 pb-1 mb-2 text-xs font-medium text-gray-300">
                      {label}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-200">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-gray-400">Index:</span>
                      <span className="font-medium">
                        {(payload[0].value as number).toFixed(1)}
                      </span>
                    </div>
                    {dataPoint?.label && (
                      <div className="mt-1 text-xs text-amber-400">
                        {dataPoint.label}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {/* Baseline reference line at 100 */}
            <ReferenceLine
              y={100}
              stroke="#6b7280"
              strokeDasharray="6 4"
              label={{
                value: "Baseline (100)",
                position: "right",
                fill: "#6b7280",
                fontSize: 10,
              }}
            />
            {/* Event annotation reference lines */}
            {annotations.map((a) => (
              <ReferenceLine
                key={a.quarter}
                x={a.quarter}
                stroke="#4b5563"
                strokeDasharray="4 4"
                label={{
                  value: a.label!,
                  position: "top",
                  fill: "#9ca3af",
                  fontSize: 10,
                }}
              />
            ))}
            <Area
              type="monotone"
              dataKey="index"
              name="Price Index"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#indexFill)"
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
          AutoTrader / Cap HPI Price Index
        </a>
      </p>

      {/* Chart 2: Depreciation Calculator */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-100">
          Depreciation Calculator
        </h3>
        <p className="mb-5 text-sm text-gray-400">
          Estimate how much value a used car has lost and will lose over the next
          3 years.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Purchase Year */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Purchase Year
            </label>
            <select
              value={purchaseYear}
              onChange={(e) => setPurchaseYear(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#232323] px-3 py-2.5 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {PURCHASE_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Price */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Purchase Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {"£"}
              </span>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="15000"
                min={500}
                max={500000}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#232323] py-2.5 pl-7 pr-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_MULTIPLIERS.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setCategoryMultiplier(cat.value)}
                  className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    categoryMultiplier === cat.value
                      ? "bg-emerald-600 text-white"
                      : "bg-[#232323] text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {depreciationResult && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">
                Estimated Value Today
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatCurrency(depreciationResult.currentValue)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {depreciationResult.adjustedRetentionNow.toFixed(0)}% retained
                after {depreciationResult.ageNow}{" "}
                {depreciationResult.ageNow === 1 ? "year" : "years"}
              </div>
            </div>

            <div className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">
                Projected Value in 3 Years
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {formatCurrency(depreciationResult.projectedValue)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {depreciationResult.adjustedRetentionPlus3.toFixed(0)}% retained
                after {depreciationResult.agePlus3} years
              </div>
            </div>

            <div className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">
                3-Year Depreciation Cost
              </div>
              <div className="text-2xl font-bold text-red-400">
                {formatCurrency(depreciationResult.furtherDepreciation)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {formatCurrency(
                  Math.round(depreciationResult.furtherDepreciation / 36)
                )}{" "}
                per month
              </div>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Estimates based on industry-average depreciation curves. Actual values
          depend on mileage, condition, service history and market demand.
        </p>
      </div>
    </div>
  );
}
