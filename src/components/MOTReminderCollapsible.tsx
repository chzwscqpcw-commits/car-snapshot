"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import MOTReminderSignup from "@/components/MOTReminderSignup";
import { trackEvent } from "@/lib/tracking";

type Context = "generic" | "due-soon" | "expired" | "post-lookup";

interface Props {
  context: Context;
  triggerVariant?: string;
  regNumber?: string;
  motExpiryDate?: string;
  makeModel?: string;
}

/**
 * Two-click MOT reminder: tap the chip, the inline form opens. Built so the
 * primary slot on the results page doesn't dominate the view above the rich
 * data sections; the user still sees the affordance, just doesn't get a wall.
 */
export default function MOTReminderCollapsible({
  context,
  triggerVariant,
  regNumber,
  motExpiryDate,
  makeModel,
}: Props) {
  // High-intent contexts open the form by default — users with an expired
  // MOT or one due within 60 days are precisely the audience the reminder
  // is built for, and the tap-to-expand step was costing us ~90% of them.
  // For "post-lookup" (MOT >60 days away), the chip stays collapsed so the
  // results page isn't dominated by a form for users who don't need it
  // urgently. See dashboard funnel: chip_view → tap → form_view was the
  // pinch point.
  const autoOpen = context === "expired" || context === "due-soon";
  const [open, setOpen] = useState(autoOpen);
  const chipRef = useRef<HTMLButtonElement | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (open || viewedRef.current) return;
    const node = chipRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            trackEvent("mot_reminder_chip_view", { context, trigger_variant: triggerVariant ?? null });
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.6 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [open, context, triggerVariant]);

  const accent =
    context === "expired"
      ? { border: "border-rose-500/30", chip: "text-rose-300", bg: "bg-rose-500/10", icon: "text-rose-400" }
      : context === "due-soon"
      ? { border: "border-amber-500/30", chip: "text-amber-300", bg: "bg-amber-500/10", icon: "text-amber-400" }
      : { border: "border-cyan-500/25", chip: "text-cyan-300", bg: "bg-cyan-500/10", icon: "text-cyan-400" };

  const headline =
    context === "expired"
      ? "MOT expired — set a free reminder for the next one"
      : context === "due-soon"
      ? "MOT due soon — set a free email reminder"
      : `Set a free MOT reminder${regNumber ? ` for ${regNumber}` : ""}`;

  if (open) {
    return (
      <div className="animate-mot-collapse-open">
        <MOTReminderSignup
          context={context}
          triggerVariant={triggerVariant}
          regNumber={regNumber}
          motExpiryDate={motExpiryDate}
          makeModel={makeModel}
        />
        <style jsx>{`
          @keyframes motCollapseOpen {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          :global(.animate-mot-collapse-open) {
            animation: motCollapseOpen 0.18s ease-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <button
      ref={chipRef}
      type="button"
      onClick={() => {
        trackEvent("mot_reminder_chip_click", { context, trigger_variant: triggerVariant ?? null });
        setOpen(true);
      }}
      className={`group w-full rounded-xl border ${accent.border} ${accent.bg} px-4 py-3 flex items-center gap-3 hover:bg-slate-900/40 transition-colors`}
      aria-expanded="false"
    >
      <Bell className={`h-4 w-4 flex-shrink-0 ${accent.icon}`} />
      <span className="flex-1 text-left">
        <span className="block text-sm font-semibold text-white">{headline}</span>
        <span className="block text-[11px] text-slate-400 mt-0.5">
          One tap to expand · 28 + 7 day email alerts · no spam
        </span>
      </span>
      <span
        className={`flex items-center gap-1 text-[11px] font-medium ${accent.chip} group-hover:translate-x-0.5 transition-transform`}
      >
        Set up
        <ChevronDown className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
