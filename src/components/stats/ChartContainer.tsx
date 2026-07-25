"use client";

import type { ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function ChartContainer({
  title,
  subtitle,
  children,
  className = "",
}: ChartContainerProps) {
  return (
    <div
      className={`rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 sm:p-6 ${className}`}
    >
      <h3 className="mb-1 text-lg font-semibold text-slate-100">{title}</h3>
      {subtitle && (
        <p className="mb-4 text-sm text-slate-400">{subtitle}</p>
      )}
      <div className="h-[240px] sm:h-[320px] md:h-[400px] w-full">{children}</div>
    </div>
  );
}
