import type { ReactNode } from "react";

interface StatsHubCategoryGroupProps {
  title: string;
  children: ReactNode;
}

export default function StatsHubCategoryGroup({
  title,
  children,
}: StatsHubCategoryGroupProps) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-5 mt-10">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
          {title}
        </h2>
        <div className="h-px flex-1 bg-[#2a2a2a]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </section>
  );
}
