import type { ReactNode } from "react";
import Link from "next/link";

interface StatsHubFeaturedCardProps {
  sparkline: ReactNode;
}

export default function StatsHubFeaturedCard({
  sparkline,
}: StatsHubFeaturedCardProps) {
  return (
    <Link
      href="/stats/fuel-prices"
      className="group block rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden mb-10"
    >
      <div className="w-full h-36 bg-[#161616]">{sparkline}</div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">&#9981;</span>
            <h2 className="text-lg font-bold text-white">
              UK Petrol &amp; Diesel Price History
            </h2>
          </div>
          <span className="text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
            Featured
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-4 max-w-2xl">
          Track petrol and diesel prices from 1988 to today. Includes a
          fill-cost calculator — select your tank size to see exactly how much
          it would have cost to fill up in any year since 1988.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-xs bg-[#222] border border-[#2a2a2a] rounded-full px-3 py-1 text-gray-400">
            191.5p all-time high
          </span>
          <span className="text-xs bg-[#222] border border-[#2a2a2a] rounded-full px-3 py-1 text-gray-400">
            38p/litre in 1988
          </span>
          <span className="text-xs bg-[#222] border border-[#2a2a2a] rounded-full px-3 py-1 text-gray-400">
            Tank fill calculator
          </span>
        </div>
        <span className="inline-flex items-center gap-2 bg-emerald-500 text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors group-hover:bg-emerald-400">
          Explore fuel price history &rarr;
        </span>
      </div>
    </Link>
  );
}
