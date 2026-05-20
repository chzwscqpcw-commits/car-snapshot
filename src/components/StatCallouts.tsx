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
    <div className="my-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((s, i) => {
        const tone = TONE_CLASSES[s.tone ?? "default"];
        return (
          <div
            key={i}
            className={`rounded-lg border bg-slate-900/40 p-4 text-center ${tone.border}`}
          >
            <p className={`text-2xl font-bold tracking-tight ${tone.value}`}>{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}
