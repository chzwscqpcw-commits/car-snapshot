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
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { mileageData, mileageByAgeData } from "@/lib/stats-data/uk-mileage";
import ChartContainer from "@/components/stats/ChartContainer";

/* ---------- age-group average lookup ---------- */
function getExpectedMileage(ageYears: number): number {
  if (ageYears <= 1) return 12500;
  if (ageYears <= 3) return 10800;
  if (ageYears <= 5) return 9200;
  if (ageYears <= 7) return 8100;
  if (ageYears <= 9) return 7200;
  if (ageYears <= 11) return 6500;
  if (ageYears <= 13) return 5800;
  return 4200;
}

function getAgeGroupLabel(ageYears: number): string {
  if (ageYears <= 1) return "0-1 years";
  if (ageYears <= 3) return "1-3 years";
  if (ageYears <= 5) return "3-5 years";
  if (ageYears <= 7) return "5-7 years";
  if (ageYears <= 9) return "7-9 years";
  if (ageYears <= 11) return "9-11 years";
  if (ageYears <= 13) return "11-13 years";
  return "13+ years";
}

export default function MileageCharts() {
  const [vehicleAge, setVehicleAge] = useState<string>("");
  const [totalMileage, setTotalMileage] = useState<string>("");

  const result = useMemo(() => {
    const age = parseInt(vehicleAge, 10);
    const miles = parseInt(totalMileage, 10);
    if (isNaN(age) || isNaN(miles) || age < 0 || age > 15 || miles < 0)
      return null;

    const effectiveAge = Math.max(age, 1); // avoid divide by zero
    const avgPerYear = Math.round(miles / effectiveAge);
    const expected = getExpectedMileage(age);
    const ratio = avgPerYear / expected;

    let verdict: string;
    let color: string;
    if (ratio <= 0.85) {
      verdict = "Below average";
      color = "text-emerald-400";
    } else if (ratio <= 1.15) {
      verdict = "Average";
      color = "text-amber-400";
    } else {
      verdict = "Above average";
      color = "text-red-400";
    }

    return {
      avgPerYear,
      expected,
      ageGroup: getAgeGroupLabel(age),
      verdict,
      color,
    };
  }, [vehicleAge, totalMileage]);

  return (
    <div className="space-y-8">
      {/* Chart 1: Annual mileage trend 1990-2024 */}
      <ChartContainer
        title="Average Annual Car Mileage 1990-2024"
        subtitle="UK average miles per car per year (DfT National Travel Survey)"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mileageData}
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
              domain={[4000, 11000]}
              tickFormatter={(v: number) => v.toLocaleString()}
              label={{
                value: "Miles per year",
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
                        <span className="text-gray-400">{entry.name}:</span>
                        <span className="font-medium">
                          {(entry.value as number).toLocaleString()} miles
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <ReferenceLine
              x={2020}
              stroke="#4b5563"
              strokeDasharray="4 4"
              label={{
                value: "COVID-19",
                position: "top",
                fill: "#9ca3af",
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="avgMiles"
              name="Avg. Annual Mileage"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Chart 2: Mileage by vehicle age group */}
      <ChartContainer
        title="Average Mileage by Vehicle Age"
        subtitle="Annual miles driven by vehicle age group — newer cars are driven further"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={mileageByAgeData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis
              dataKey="ageGroup"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              domain={[0, 14000]}
              tickFormatter={(v: number) => v.toLocaleString()}
              label={{
                value: "Miles per year",
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
                        <span className="text-gray-400">{entry.name}:</span>
                        <span className="font-medium">
                          {(entry.value as number).toLocaleString()} miles/year
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Bar
              dataKey="avgMiles"
              name="Avg. Annual Mileage"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Interactive: Is my mileage normal? */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-100">
          Is My Mileage Normal?
        </h3>
        <p className="mb-5 text-sm text-gray-400">
          Enter your vehicle&apos;s age and total mileage to see how it compares
          to the national average.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="vehicle-age"
              className="mb-1.5 block text-xs font-medium text-gray-400"
            >
              Vehicle age (years)
            </label>
            <input
              id="vehicle-age"
              type="number"
              min={0}
              max={15}
              placeholder="e.g. 5"
              value={vehicleAge}
              onChange={(e) => setVehicleAge(e.target.value)}
              className="w-full rounded-lg bg-[#232323] px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label
              htmlFor="total-mileage"
              className="mb-1.5 block text-xs font-medium text-gray-400"
            >
              Current total mileage
            </label>
            <input
              id="total-mileage"
              type="number"
              min={0}
              placeholder="e.g. 45000"
              value={totalMileage}
              onChange={(e) => setTotalMileage(e.target.value)}
              className="w-full rounded-lg bg-[#232323] px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {result && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-[#232323] p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {result.avgPerYear.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Your avg. miles/year
              </div>
            </div>
            <div className="rounded-lg bg-[#232323] p-4 text-center">
              <div className="text-2xl font-bold text-sky-400">
                {result.expected.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Expected for {result.ageGroup}
              </div>
            </div>
            <div className="rounded-lg bg-[#232323] p-4 text-center">
              <div className={`text-2xl font-bold ${result.color}`}>
                {result.verdict}
              </div>
              <div className="mt-1 text-xs text-gray-400">Verdict</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
