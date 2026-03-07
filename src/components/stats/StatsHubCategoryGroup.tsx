import type { ReactNode } from "react";

interface StatsHubCategoryGroupProps {
  title: string;
  headerDelay?: number;
  children: ReactNode;
}

export default function StatsHubCategoryGroup({
  title,
  headerDelay = 0,
  children,
}: StatsHubCategoryGroupProps) {
  return (
    <section>
      <div
        className="stats-slide-in flex items-center gap-4 mb-3 mt-8"
        style={headerDelay ? { animationDelay: `${headerDelay}ms` } : undefined}
      >
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
          {title}
        </h2>
        <div className="h-px flex-1 bg-[#2a2a2a]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {children}
      </div>
    </section>
  );
}
