import type { ReactNode } from "react";

export default function StatsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111111] text-gray-50">
      {children}
    </div>
  );
}
