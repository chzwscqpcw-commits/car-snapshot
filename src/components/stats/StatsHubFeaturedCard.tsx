import type { ReactNode } from "react";
import Link from "next/link";

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
    </Link>
  );
}
