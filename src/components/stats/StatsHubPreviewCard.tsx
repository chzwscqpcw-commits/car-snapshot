import Link from "next/link";

export interface StatBadge {
  value: string;
  label: string;
  colour: "emerald" | "amber" | "red" | "sky";
}

const badgeColourMap = {
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  red: "bg-red-500/10 border-red-500/20 text-red-400",
  sky: "bg-sky-500/10 border-sky-500/20 text-sky-400",
};

interface StatsHubPreviewCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  stats: StatBadge[];
  delay: number;
}

export default function StatsHubPreviewCard({
  href,
  icon,
  title,
  description,
  stats,
  delay,
}: StatsHubPreviewCardProps) {
  return (
    <Link
      href={href}
      className="stats-reveal group block rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-emerald-500/30 hover:bg-[#1e1e1e] transition-all duration-300 hover:-translate-y-0.5 p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Row 1: Icon + Title + Arrow */}
      <div className="flex items-center gap-2.5">
        <span className="text-base shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold text-white flex-1">{title}</h3>
        <span className="text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all text-sm shrink-0">
          &rarr;
        </span>
      </div>

      {/* Row 2: Description (not truncated) */}
      <p className="text-xs text-gray-400 mt-2 pl-[30px] leading-relaxed">
        {description}
      </p>

      {/* Row 3: Stat badges */}
      <div className="flex flex-wrap gap-2 mt-3 pl-[30px]">
        {stats.map((stat) => (
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
