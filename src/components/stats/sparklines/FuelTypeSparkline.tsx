"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// EV cost curve falling relative to petrol — show diverging lines
const data = [
  { v: 20 }, { v: 22 }, { v: 25 }, { v: 30 }, { v: 38 },
  { v: 48 }, { v: 58 }, { v: 68 }, { v: 76 }, { v: 82 },
  { v: 86 }, { v: 90 },
];

export default function FuelTypeSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="fuelTypeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#fuelTypeGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
