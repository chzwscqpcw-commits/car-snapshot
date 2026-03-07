"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const data = [
  { v: 38 }, { v: 42 }, { v: 45 }, { v: 48 }, { v: 52 }, { v: 55 },
  { v: 60 }, { v: 68 }, { v: 72 }, { v: 85 }, { v: 88 },
  { v: 78 }, { v: 80 }, { v: 86 }, { v: 95 }, { v: 103 },
  { v: 113 }, { v: 99 }, { v: 112 }, { v: 119 }, { v: 131 },
  { v: 135 }, { v: 129 }, { v: 111 }, { v: 102 }, { v: 119 },
  { v: 123 }, { v: 127 }, { v: 107 }, { v: 128 }, { v: 168 },
  { v: 148 }, { v: 140 },
];

export default function FuelPricesSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#fuelGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
