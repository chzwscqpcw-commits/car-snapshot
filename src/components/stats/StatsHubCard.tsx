import type { ReactNode } from "react";
import Link from "next/link";

const colourMap = {
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  red: "bg-red-500/10 border-red-500/20 text-red-400",
  sky: "bg-sky-500/10 border-sky-500/20 text-sky-400",
};

interface StatsHubCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  keyStat: string;
  keyStatColour?: keyof typeof colourMap;
  sparkline: ReactNode;
}

export default function StatsHubCard({
  href,
  icon,
  title,
  description,
  keyStat,
  keyStatColour = "emerald",
  sparkline,
}: StatsHubCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
    >
      <div className="w-full h-[88px] bg-[#161616]">{sparkline}</div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <h3 className="font-semibold text-white text-sm">{title}</h3>
          </div>
          <span className="text-gray-600 group-hover:text-emerald-400 transition-colors text-sm">
            &rarr;
          </span>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed mb-3">
          {description}
        </p>
        <span
          className={`text-xs rounded-full px-2.5 py-0.5 border ${colourMap[keyStatColour]}`}
        >
          {keyStat}
        </span>
      </div>
    </Link>
  );
}
