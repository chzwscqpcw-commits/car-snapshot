"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const data = [
  { v: 100 }, { v: 99 }, { v: 98 }, { v: 97 }, { v: 96 },
  { v: 91 }, { v: 104 }, { v: 108 }, { v: 112 }, { v: 122 },
  { v: 132 }, { v: 138 }, { v: 143 }, { v: 146 }, { v: 141 },
  { v: 136 }, { v: 132 }, { v: 127 }, { v: 124 }, { v: 122 },
  { v: 119 }, { v: 117 }, { v: 116 }, { v: 115 }, { v: 113 },
];

export default function UsedCarPricesSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="usedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} fill="url(#usedGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
