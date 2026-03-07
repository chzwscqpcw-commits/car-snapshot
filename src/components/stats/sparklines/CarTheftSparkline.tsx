"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Decline to 2014 trough, then rising again
const data = [
  { v: 110 }, { v: 100 }, { v: 92 }, { v: 85 }, { v: 85 },
  { v: 87 }, { v: 89 }, { v: 105 }, { v: 114 }, { v: 118 },
  { v: 108 }, { v: 105 }, { v: 110 }, { v: 108 }, { v: 105 },
];

export default function CarTheftSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="theftGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={2} fill="url(#theftGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
