"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const data = [
  { v: 5685 }, { v: 6320 }, { v: 6255 }, { v: 6090 }, { v: 5965 },
  { v: 5800 }, { v: 5875 }, { v: 6080 }, { v: 6255 }, { v: 6360 },
  { v: 5155 }, { v: 5500 }, { v: 6865 }, { v: 7170 }, { v: 7045 },
  { v: 6980 },
];

export default function CostOfMotoringSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#38bdf8" strokeWidth={2} fill="url(#costGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
