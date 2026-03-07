"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Steep decline from high left to low right — dramatic improvement
const data = [
  { v: 7499 }, { v: 6366 }, { v: 5953 }, { v: 5445 }, { v: 5165 },
  { v: 5052 }, { v: 5217 }, { v: 4229 }, { v: 3807 }, { v: 3598 },
  { v: 3421 }, { v: 3409 }, { v: 3172 }, { v: 2538 }, { v: 1857 },
  { v: 1754 }, { v: 1793 }, { v: 1752 }, { v: 1460 }, { v: 1590 },
];

export default function RoadSafetySparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="safetyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#38bdf8" strokeWidth={2} fill="url(#safetyGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
