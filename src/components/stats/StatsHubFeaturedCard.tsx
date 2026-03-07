import type { ReactNode } from "react";
import Link from "next/link";

const badgeColourMap = {
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  red: "bg-red-500/10 border-red-500/20 text-red-400",
  sky: "bg-sky-500/10 border-sky-500/20 text-sky-400",
};

interface StatsHubFeaturedCardProps {
  sparkline: ReactNode;
  delay?: number;
}

export default function StatsHubFeaturedCard({
  sparkline,
  delay = 100,
}: StatsHubFeaturedCardProps) {
  return (
    <Link
      href="/stats/fuel-prices"
      className="stats-reveal sparkline-glow group block rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden mb-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-full h-[100px] bg-[#161616]">{sparkline}</div>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">&#9981;</span>
          <h2 className="text-sm font-bold text-white">
            UK Petrol &amp; Diesel Price History
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-black font-semibold text-xs px-4 py-2 rounded-lg transition-colors group-hover:bg-emerald-400">
          Explore &rarr;
        </span>
      </div>
      {/* Stat badges */}
      <div className="flex flex-wrap gap-2 px-4 pb-4 -mt-1">
        {([
          { value: "139.8p", label: "petrol now", colour: "amber" as const },
          { value: "180.3p", label: "all-time high", colour: "red" as const },
          { value: "36p", label: "in 1988", colour: "sky" as const },
        ]).map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg border px-2.5 py-1.5 ${badgeColourMap[stat.colour]}`}
          >
            <div className="text-xs font-bold leading-tight">{stat.value}</div>
            <div className="text-[10px] opacity-60 leading-tight">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}
