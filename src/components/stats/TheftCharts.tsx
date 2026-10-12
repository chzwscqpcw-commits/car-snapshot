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
  ReferenceLine,
} from "recharts";
import ChartContainer from "@/components/stats/ChartContainer";

// Charts shared by the /stats theft pages (cars, vans, motorbikes, least
// stolen). Pages pass slices of theft-stats.json as props.

type RateRow = { name: string; thefts: number; licensed: number; per1000: number };

const fmt = (v: number) => v.toLocaleString("en-GB");

function rateColor(per1000: number, national: number): string {
  if (per1000 > national * 3) return "#ef4444"; // red-500: "very high"
  if (per1000 > national * 2) return "#f97316"; // orange-500: "high"
  if (per1000 > national) return "#f59e0b"; // amber-500
  return "#10b981"; // emerald-500: below average
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 shadow-lg">
      <div className="border-b border-red-500/40 pb-1 mb-2 text-xs font-medium text-slate-300">{title}</div>
      {children}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs text-slate-200">
      <span className="text-slate-400">{label}:</span> <span className="font-medium">{value}</span>
    </div>
  );
}

function RateTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: RateRow }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Panel title={d.name}>
      <Line label="Theft rate" value={`${d.per1000} per 1,000`} />
      <Line label="Stolen" value={`${fmt(d.thefts)} of ${fmt(d.licensed)}`} />
    </Panel>
  );
}

const axis = { stroke: "#64748b", tick: { fill: "#64748b", fontSize: 12 }, tickLine: false } as const;
const categoryAxis = { stroke: "#64748b", tick: { fill: "#9ca3af", fontSize: 11 }, tickLine: false } as const;
const cursor = { fill: "rgba(255,255,255,0.03)" };

/** Horizontal bars of per-1,000 theft rates, coloured against the fleet average. */
export function TheftRateChart({
  rows,
  national,
  title,
  subtitle,
}: {
  rows: RateRow[];
  national: number;
  title: string;
  subtitle: string;
}) {
  return (
    // Ten horizontal bars with two-line names need more than the default
    // 240px on a phone.
    <ChartContainer title={title} subtitle={subtitle} className="[&>div:last-child]:!h-[380px] sm:[&>div:last-child]:!h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" {...axis} />
          <YAxis type="category" dataKey="name" width={130} {...categoryAxis} interval={0} />
          <Tooltip wrapperStyle={{ zIndex: 10 }} content={<RateTooltip />} cursor={cursor} />
          <ReferenceLine x={national} stroke="#94a3b8" strokeDasharray="4 4" />
          <Bar dataKey="per1000" name="Per 1,000" radius={[0, 4, 4, 0]}>
            {rows.map((r) => (
              <Cell key={r.name} fill={rateColor(r.per1000, national)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function CountTooltip({
  active,
  payload,
  label,
  noun,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  noun: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <Panel title={String(label)}>
      <Line label={noun} value={fmt(payload[0].value)} />
    </Panel>
  );
}

/** Vertical bars of a count per category (year, age band). */
export function TheftCountChart({
  data,
  title,
  subtitle,
  noun,
}: {
  data: { label: string; value: number }[];
  title: string;
  subtitle: string;
  /** Tooltip label, e.g. "Cars stolen". */
  noun: string;
}) {
  return (
    <ChartContainer title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...axis} />
          <YAxis
            {...axis}
            width={48}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip wrapperStyle={{ zIndex: 10 }} content={<CountTooltip noun={noun} />} cursor={cursor} />
          <Bar dataKey="value" name={noun} fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

/** Per-1,000 rate by fuel type, vertical bars with the average marked. */
export function TheftFuelChart({
  rows,
  national,
  title,
  subtitle,
}: {
  rows: { fuel: string; thefts: number; licensed: number; per1000: number }[];
  national: number;
  title: string;
  subtitle: string;
}) {
  const data = rows.map((r) => ({ ...r, name: r.fuel }));
  return (
    <ChartContainer title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" {...axis} interval={0} tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis {...axis} width={36} />
          <Tooltip wrapperStyle={{ zIndex: 10 }} content={<RateTooltip />} cursor={cursor} />
          <ReferenceLine y={national} stroke="#94a3b8" strokeDasharray="4 4" />
          <Bar dataKey="per1000" name="Per 1,000" radius={[4, 4, 0, 0]}>
            {data.map((r) => (
              <Cell key={r.name} fill={rateColor(r.per1000, national)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
