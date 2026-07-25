import type { ReactNode } from "react";
import MotReminderBanner from "@/components/MotReminderBanner";

export default function StatsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      {children}
      <MotReminderBanner />
    </div>
  );
}
