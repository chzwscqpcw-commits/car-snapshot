"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Band M staircase: flat→jump→flat→jump pattern
const data = [
  { v: 160 }, { v: 160 }, { v: 165 }, { v: 185 }, { v: 210 },
  { v: 255 }, { v: 300 }, { v: 370 }, { v: 440 }, { v: 460 },
  { v: 475 }, { v: 490 }, { v: 500 }, { v: 505 }, { v: 510 },
  { v: 515 }, { v: 515 }, { v: 535 }, { v: 555 }, { v: 570 },
  { v: 580 }, { v: 585 }, { v: 600 }, { v: 620 }, { v: 640 },
];

export default function RoadTaxSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="vedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} fill="url(#vedGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
