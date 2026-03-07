"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Exponential curve — near flat until 2019, then sharply rising
const data = [
  { v: 1 }, { v: 2 }, { v: 4 }, { v: 7 }, { v: 13 },
  { v: 24 }, { v: 31 }, { v: 42 }, { v: 56 }, { v: 91 },
  { v: 168 }, { v: 355 }, { v: 590 }, { v: 870 }, { v: 1200 },
  { v: 1580 },
];

export default function EvAdoptionSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#evGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
