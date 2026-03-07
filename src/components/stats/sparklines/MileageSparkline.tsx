"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Gradual decline, sharp COVID dip, partial recovery
const data = [
  { v: 9900 }, { v: 9500 }, { v: 9100 }, { v: 8800 }, { v: 8600 },
  { v: 8400 }, { v: 8100 }, { v: 7900 }, { v: 7700 }, { v: 7600 },
  { v: 7500 }, { v: 7400 }, { v: 7400 }, { v: 7400 },
  { v: 5300 }, { v: 6400 }, { v: 7000 }, { v: 7100 }, { v: 7200 },
];

export default function MileageSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="mileageGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#38bdf8" strokeWidth={2} fill="url(#mileageGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
