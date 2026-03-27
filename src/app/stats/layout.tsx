import type { ReactNode } from "react";
import MotReminderBanner from "@/components/MotReminderBanner";

export default function StatsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111111] text-gray-50">
      {children}
      <MotReminderBanner />
    </div>
  );
}
