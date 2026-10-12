"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import theftStats from "@/data/theft-stats.json";
import ChartContainer from "@/components/stats/ChartContainer";

type RateRow = (typeof theftStats.topByRate)[number];

const trend = Object.entries(theftStats.carsByYear).map(([year, cars]) => ({ year, cars }));
const national = theftStats.nationalPer1000;

function rateColor(per1000: number): string {
  if (per1000 > national * 3) return "#ef4444"; // red-500: "very high"
  if (per1000 > national * 2) return "#f97316"; // orange-500: "high"
  return "#f59e0b"; // amber-500
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 shadow-lg">
      <div className="border-b border-red-500/40 pb-1 mb-2 text-xs font-medium text-slate-300">
        {label}
      </div>
      <div className="text-xs text-slate-200">
        <span className="text-slate-400">Cars stolen:</span>{" "}
        <span className="font-medium">{payload[0].value.toLocaleString("en-GB")}</span>
      </div>
    </div>
  );
}

function RateTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RateRow }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 shadow-lg">
      <div className="border-b border-red-500/40 pb-1 mb-2 text-xs font-medium text-slate-300">
        {d.name}
      </div>
      <div className="text-xs text-slate-200">
        <span className="text-slate-400">Theft rate:</span>{" "}
        <span className="font-medium">{d.per1000} per 1,000</span>
      </div>
      <div className="text-xs text-slate-200">
        <span className="text-slate-400">Stolen:</span>{" "}
        <span className="font-medium">
          {d.thefts.toLocaleString("en-GB")} of {d.licensed.toLocaleString("en-GB")}
        </span>
      </div>
    </div>
  );
}

export default function CarTheftCharts() {
  return (
    <div className="space-y-6">
      <ChartContainer
        title="Highest Theft Rates"
        subtitle={`Cars stolen in ${theftStats.year} per 1,000 licensed (models with 20,000+ on the road). UK average: ${national}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={theftStats.topByRate}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
          >
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              stroke="#64748b"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickLine={false}
              interval={0}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 10 }}
              content={<RateTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="per1000" name="Per 1,000" radius={[0, 4, 4, 0]}>
              {theftStats.topByRate.map((r) => (
                <Cell key={r.name} fill={rateColor(r.per1000)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <ChartContainer
        title="Cars Stolen per Year"
        subtitle={`Cars recorded stolen by the DVLA, ${trend[0].year}–${trend[trend.length - 1].year}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              width={48}
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 10 }}
              content={<TrendTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="cars" name="Cars stolen" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
