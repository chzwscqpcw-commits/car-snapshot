export type StatTone = "default" | "good" | "warn" | "danger";

export interface Stat {
  value: string;
  label: string;
  tone?: StatTone;
}

const TONE_CLASSES: Record<StatTone, { value: string; border: string }> = {
  default: { value: "text-slate-100", border: "border-slate-800" },
  good: { value: "text-emerald-300", border: "border-emerald-900/60" },
  warn: { value: "text-amber-300", border: "border-amber-900/60" },
  danger: { value: "text-rose-300", border: "border-rose-900/60" },
};

/**
 * Three-up stat row that lives just under the search widget on tool pages.
 * Pulls key facts (max fee, average mileage, daily ULEZ charge, etc.) out
 * of buried prose into something a visitor can read in two seconds.
 */
export default function StatCallouts({ stats }: { stats: Stat[] }) {
  return (
    // 3 columns at every breakpoint — values are short enough to fit on
    // phones, and stacking 1-column was eating 300px of vertical scroll
    // when it should be a scannable strip.
    <div className="my-6 grid grid-cols-3 gap-2 sm:my-8 sm:gap-3">
      {stats.map((s, i) => {
        const tone = TONE_CLASSES[s.tone ?? "default"];
        return (
          <div
            key={i}
            className={`rounded-lg border bg-slate-900/40 px-2 py-3 text-center sm:p-4 ${tone.border}`}
          >
            <p
              className={`text-base font-bold tracking-tight sm:text-2xl ${tone.value}`}
            >
              {s.value}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-slate-500 sm:text-xs sm:uppercase sm:tracking-wider">
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
