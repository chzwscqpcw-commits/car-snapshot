import Link from "next/link";

const colourMap = {
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  red: "bg-red-500/10 border-red-500/20 text-red-400",
  sky: "bg-sky-500/10 border-sky-500/20 text-sky-400",
};

interface StatsHubCompactCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  keyStat: string;
  keyStatColour?: keyof typeof colourMap;
  delay: number;
}

export default function StatsHubCompactCard({
  href,
  icon,
  title,
  description,
  keyStat,
  keyStatColour = "emerald",
  delay,
}: StatsHubCompactCardProps) {
  return (
    <Link
      href={href}
      className="stats-reveal group block rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-emerald-500/30 hover:bg-[#1e1e1e] transition-all duration-300 hover:-translate-y-0.5 p-3 sm:p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="text-base shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold text-white truncate flex-1">
          {title}
        </h3>
        <span
          className={`text-[11px] rounded-full px-2 py-0.5 border whitespace-nowrap shrink-0 ${colourMap[keyStatColour]}`}
        >
          {keyStat}
        </span>
        <span className="text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all text-sm shrink-0">
          &rarr;
        </span>
      </div>
      <p className="text-xs text-gray-500 truncate mt-1.5 pl-7">
        {description}
      </p>
    </Link>
  );
}
