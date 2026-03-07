"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Flat area with subtle undulation — implies horizontal bar rankings
const data = [
  { v: 85 }, { v: 84 }, { v: 83 }, { v: 82 }, { v: 83 },
  { v: 81 }, { v: 80 }, { v: 79 }, { v: 78 }, { v: 77 },
  { v: 76 }, { v: 75 }, { v: 74 }, { v: 73 }, { v: 72 },
];

export default function ReliableCarsSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="reliableGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#reliableGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
