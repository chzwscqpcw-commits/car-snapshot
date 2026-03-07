"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Dominant flat line (Ford) with gentle decline — stacked feel
const data = [
  { v: 131 }, { v: 120 }, { v: 95 }, { v: 96 }, { v: 77 },
  { v: 52 }, { v: 40 }, { v: 31 }, { v: 5 }, { v: 0 },
];

export default function PopularCarsSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="popularGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} fill="url(#popularGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
