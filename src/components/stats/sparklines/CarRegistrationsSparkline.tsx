"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Peak 2003, dip 2008-09, recovery, peak 2016, COVID cliff, recovery
const data = [
  { v: 2009 }, { v: 1911 }, { v: 2025 }, { v: 2247 }, { v: 2222 },
  { v: 2563 }, { v: 2579 }, { v: 2567 }, { v: 2440 }, { v: 2345 },
  { v: 2404 }, { v: 2132 }, { v: 1995 }, { v: 2031 }, { v: 1941 },
  { v: 2045 }, { v: 2265 }, { v: 2477 }, { v: 2633 }, { v: 2693 },
  { v: 2541 }, { v: 2367 }, { v: 2311 }, { v: 1631 }, { v: 1647 },
  { v: 1614 }, { v: 1904 }, { v: 1953 }, { v: 1890 },
];

export default function CarRegistrationsSparkline() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="regsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#regsGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
