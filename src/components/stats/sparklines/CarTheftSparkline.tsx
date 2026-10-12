"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import theftStats from "@/data/theft-stats.json";

// Cars recorded stolen by the DVLA per year (FOIR13058), oldest first.
const data = Object.values(theftStats.cars.byYear).map((v) => ({ v }));

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
