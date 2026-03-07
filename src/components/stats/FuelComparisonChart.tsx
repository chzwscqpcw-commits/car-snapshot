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
} from "recharts";
import {
  fuelComparisonData,
  perMileCosts,
} from "@/lib/stats-data/fuel-comparison";
import ChartContainer from "@/components/stats/ChartContainer";

const EV_PREMIUM = 8000; // assumed extra purchase price for EV vs petrol

export default function FuelComparisonChart() {
  const [mileage, setMileage] = useState(10000);

  // Interpolate annual costs for the selected mileage
  const costAtMileage = useMemo(() => {
    return perMileCosts.map((fuel) => ({
      fuelType: fuel.fuelType,
      annualCost: Math.round((fuel.pencePerMile / 100) * mileage),
      perMile: fuel.pencePerMile,
      annualCO2: Math.round((fuel.co2PerMile * mileage) / 1000), // kg
      color: fuel.color,
    }));
  }, [mileage]);

  const cheapest = useMemo(
    () =>
      costAtMileage.reduce((min, c) =>
        c.annualCost < min.annualCost ? c : min
      ),
    [costAtMileage]
  );

  // Break-even: at what mileage does EV total cost match petrol?
  // Savings per mile = petrol pence - EV pence
  const petrolPPM =
    perMileCosts.find((f) => f.fuelType === "Petrol")?.pencePerMile ?? 16;
  const evPPM =
    perMileCosts.find((f) => f.fuelType === "Electric")?.pencePerMile ?? 5;
  const savingsPerMile = (petrolPPM - evPPM) / 100; // in pounds
  const breakEvenMiles = Math.round(EV_PREMIUM / savingsPerMile);
  const breakEvenYears = (breakEvenMiles / mileage).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Chart */}
      <ChartContainer
        title="Annual Fuel Cost by Mileage"
        subtitle="Estimated annual running cost for each fuel type"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={fuelComparisonData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis
              dataKey="annualMiles"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${v / 1000}k` : `${v}`
              }
              label={{
                value: "Annual mileage",
                position: "insideBottom",
                offset: -2,
                style: { fill: "#6b7280", fontSize: 11 },
              }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              tickFormatter={(v: number) => `£${v.toLocaleString()}`}
              label={{
                value: "Annual cost (£)",
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
                      {Number(label).toLocaleString()} miles/year
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
                          {"£"}
                          {(entry.value as number).toLocaleString()}
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
            <Line
              type="monotone"
              dataKey="petrol"
              name="Petrol"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#f59e0b" }}
            />
            <Line
              type="monotone"
              dataKey="diesel"
              name="Diesel"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#ef4444" }}
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
            <Line
              type="monotone"
              dataKey="ev"
              name="Electric"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Mileage slider */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Your annual mileage:{" "}
          <span className="text-emerald-400 font-bold">
            {mileage.toLocaleString()} miles
          </span>
        </label>
        <input
          type="range"
          min={3000}
          max={30000}
          step={1000}
          value={mileage}
          onChange={(e) => setMileage(Number(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>3,000</span>
          <span>15,000</span>
          <span>30,000</span>
        </div>
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-100">
          Cost Comparison at {mileage.toLocaleString()} Miles/Year
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-gray-400">
                <th className="pb-2 text-left font-medium">Fuel Type</th>
                <th className="pb-2 text-right font-medium">Annual Cost</th>
                <th className="pb-2 text-right font-medium">Per Mile</th>
                <th className="pb-2 text-right font-medium">
                  CO<sub>2</sub>/Year
                </th>
              </tr>
            </thead>
            <tbody>
              {costAtMileage.map((row) => {
                const isCheapest = row.fuelType === cheapest.fuelType;
                return (
                  <tr
                    key={row.fuelType}
                    className={`border-b border-[#2a2a2a] last:border-b-0 ${
                      isCheapest ? "bg-emerald-900/20" : ""
                    }`}
                  >
                    <td className="py-3 text-left">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span
                          className={
                            isCheapest
                              ? "font-semibold text-emerald-400"
                              : "text-gray-200"
                          }
                        >
                          {row.fuelType}
                          {isCheapest && (
                            <span className="ml-2 text-[10px] uppercase tracking-wider bg-emerald-800/50 text-emerald-300 px-1.5 py-0.5 rounded">
                              Cheapest
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td
                      className={`py-3 text-right font-medium ${
                        isCheapest ? "text-emerald-400" : "text-gray-200"
                      }`}
                    >
                      {"£"}
                      {row.annualCost.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-gray-300">
                      {row.perMile}p
                    </td>
                    <td className="py-3 text-right text-gray-300">
                      {row.annualCO2 > 0 ? `${row.annualCO2.toLocaleString()} kg` : "0 kg"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Break-even summary */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-100">
          EV Break-Even Analysis
        </h3>
        <p className="text-sm leading-relaxed text-gray-400">
          Assuming an EV costs around{" "}
          <span className="text-gray-200 font-medium">
            {"£"}
            {EV_PREMIUM.toLocaleString()}
          </span>{" "}
          more than an equivalent petrol car, and you save{" "}
          <span className="text-gray-200 font-medium">
            {(petrolPPM - evPPM).toFixed(1)}p per mile
          </span>{" "}
          on fuel, you would need to drive{" "}
          <span className="text-emerald-400 font-bold">
            {breakEvenMiles.toLocaleString()} miles
          </span>{" "}
          to recoup the higher purchase price through fuel savings alone.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          At your selected mileage of{" "}
          <span className="text-gray-200 font-medium">
            {mileage.toLocaleString()} miles/year
          </span>
          , that would take approximately{" "}
          <span className="text-emerald-400 font-bold">
            {breakEvenYears} years
          </span>
          . After that point, every mile driven saves you money compared to
          petrol.
        </p>
      </div>
    </div>
  );
}
