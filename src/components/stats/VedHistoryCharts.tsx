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
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  vedBandData,
  vedFirstYearData,
  lastUpdated,
  source,
} from "@/lib/stats-data/ved-history";
import ChartContainer from "@/components/stats/ChartContainer";
import CustomTooltip from "@/components/stats/CustomTooltip";

/* ---------- VED band lookup for calculator ---------- */

interface BandDefinition {
  letter: string;
  minCo2: number;
  maxCo2: number;
  field: keyof (typeof vedBandData)[0];
}

const BAND_DEFINITIONS: BandDefinition[] = [
  { letter: "A", minCo2: 0, maxCo2: 0, field: "bandA" },
  { letter: "B", minCo2: 1, maxCo2: 50, field: "bandB" },
  { letter: "D", minCo2: 76, maxCo2: 90, field: "bandD" },
  { letter: "G", minCo2: 131, maxCo2: 150, field: "bandG" },
  { letter: "K", minCo2: 186, maxCo2: 200, field: "bandK" },
  { letter: "M", minCo2: 226, maxCo2: 255, field: "bandM" },
];

function findBand(co2: number): BandDefinition | null {
  // Map CO2 to the nearest tracked band
  if (co2 === 0) return BAND_DEFINITIONS[0];
  if (co2 >= 1 && co2 <= 50) return BAND_DEFINITIONS[1];
  if (co2 >= 51 && co2 <= 90) return BAND_DEFINITIONS[2];
  if (co2 >= 91 && co2 <= 150) return BAND_DEFINITIONS[3];
  if (co2 >= 151 && co2 <= 200) return BAND_DEFINITIONS[4];
  if (co2 >= 201) return BAND_DEFINITIONS[5];
  return null;
}

/* ---------- chart data transforms ---------- */

const barChartData = vedBandData.map((d) => ({
  year: d.year,
  "Band A (0 g/km)": d.bandA,
  "Band M (226+ g/km)": d.bandM,
}));

const lineChartData = vedFirstYearData.map((d) => ({
  year: d.year,
  "Zero CO2": d.zeroCo2,
  "Low (1-50)": d.low,
  "Mid (101-150)": d.mid,
  "High (171-190)": d.high,
  "Very High (255+)": d.veryHigh,
}));

const FIRST_YEAR_COLORS: Record<string, string> = {
  "Zero CO2": "#10b981",
  "Low (1-50)": "#38bdf8",
  "Mid (101-150)": "#f59e0b",
  "High (171-190)": "#ef4444",
  "Very High (255+)": "#a78bfa",
};

/* ---------- component ---------- */

export default function VedHistoryCharts() {
  const [regYear, setRegYear] = useState(2025);
  const [co2Input, setCo2Input] = useState("");

  const calcResult = useMemo(() => {
    const co2 = parseInt(co2Input, 10);
    if (isNaN(co2) || co2 < 0) return null;

    const band = findBand(co2);
    if (!band) return null;

    const yearData = vedBandData.find((d) => d.year === regYear);
    if (!yearData) return null;

    const cost = yearData[band.field] as number;
    return { band: band.letter, co2, cost };
  }, [regYear, co2Input]);

  const regYears = useMemo(() => {
    const years: number[] = [];
    for (let y = 2025; y >= 2017; y--) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div className="space-y-8">
      {/* Chart 1: Band A vs Band M grouped bar */}
      <ChartContainer
        title="Band A vs Band M Annual Rates"
        subtitle={`Zero-emission vs highest-emission VED rates 2001\u20132025 \u00b7 Last updated ${lastUpdated}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barChartData}
            margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
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
              tickFormatter={(v: number) => `\u00a3${v}`}
            />
            <Tooltip
              content={
                <CustomTooltip
                  formatter={(v: number) => `\u00a3${v}`}
                />
              }
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
            />
            <Bar
              dataKey="Band A (0 g/km)"
              fill="#10b981"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="Band M (226+ g/km)"
              fill="#ef4444"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Chart 2: First-year rates line chart */}
      <ChartContainer
        title="First-Year VED Rates Since 2017"
        subtitle="One-off first-year rate by CO2 emission bracket"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={lineChartData}
            margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
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
              tickFormatter={(v: number) => `\u00a3${v.toLocaleString()}`}
            />
            <Tooltip
              content={
                <CustomTooltip
                  formatter={(v: number) => `\u00a3${v.toLocaleString()}`}
                />
              }
            />
            {Object.entries(FIRST_YEAR_COLORS).map(([name, color]) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Line legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
        {Object.entries(FIRST_YEAR_COLORS).map(([name, color]) => (
          <span key={name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            {name}
          </span>
        ))}
      </div>

      {/* Interactive VED calculator */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-100">
          VED Rate Calculator
        </h3>
        <p className="mb-4 text-sm text-gray-400">
          Select a registration year and enter CO2 emissions to find the
          approximate annual VED rate.
        </p>

        <div className="flex flex-wrap items-end gap-4">
          {/* Registration year dropdown */}
          <div>
            <label
              htmlFor="ved-reg-year"
              className="mb-1 block text-xs font-medium text-gray-400"
            >
              Registration year
            </label>
            <select
              id="ved-reg-year"
              value={regYear}
              onChange={(e) => setRegYear(Number(e.target.value))}
              className="rounded-lg border border-[#2a2a2a] bg-[#232323] px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {regYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* CO2 input */}
          <div>
            <label
              htmlFor="ved-co2"
              className="mb-1 block text-xs font-medium text-gray-400"
            >
              CO2 emissions (g/km)
            </label>
            <input
              id="ved-co2"
              type="number"
              placeholder="e.g. 120"
              value={co2Input}
              onChange={(e) => setCo2Input(e.target.value)}
              min={0}
              max={999}
              className="w-32 rounded-lg border border-[#2a2a2a] bg-[#232323] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Result */}
        {calcResult && (
          <div className="mt-4 rounded-lg border border-emerald-800/40 bg-emerald-900/20 p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-emerald-400">
                {"\u00a3"}{calcResult.cost}/yr
              </span>
              <span className="text-sm text-gray-400">
                Band {calcResult.band} &middot; {calcResult.co2} g/km CO2
                &middot; {regYear} rate
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              This shows the standard annual rate for the selected year. Actual
              rates may vary for vehicles with a list price over {"\u00a3"}40,000
              (premium supplement applies from April 2017).
            </p>
          </div>
        )}

        {co2Input !== "" && !calcResult && (
          <p className="mt-4 text-sm text-gray-500">
            Enter a valid CO2 figure (0 or above) to see the rate.
          </p>
        )}
      </div>

      <p className="text-xs text-gray-500 text-right">
        Source:{" "}
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-400 transition-colors"
        >
          DVLA / HMRC Vehicle Excise Duty
        </a>
      </p>
    </div>
  );
}
