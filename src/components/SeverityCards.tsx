export type SeverityTone = "default" | "good" | "warn" | "danger" | "info";

export interface SeverityCard {
  tone?: SeverityTone;
  title: string;
  description: string;
}

const TONE_CLASSES: Record<SeverityTone, { border: string; bg: string; title: string; dot: string }> = {
  default: {
    border: "border-slate-700/60",
    bg: "bg-slate-900/40",
    title: "text-slate-100",
    dot: "bg-slate-400",
  },
  good: {
    border: "border-emerald-700/50",
    bg: "bg-emerald-900/15",
    title: "text-emerald-200",
    dot: "bg-emerald-400",
  },
  warn: {
    border: "border-amber-700/50",
    bg: "bg-amber-900/15",
    title: "text-amber-200",
    dot: "bg-amber-400",
  },
  danger: {
    border: "border-rose-700/50",
    bg: "bg-rose-900/15",
    title: "text-rose-200",
    dot: "bg-rose-400",
  },
  info: {
    border: "border-blue-700/50",
    bg: "bg-blue-900/15",
    title: "text-blue-200",
    dot: "bg-blue-400",
  },
};

/**
 * Three-up severity / category card row. Used to replace prose definitions
 * of category sets (MOT dangerous/major/minor, ULEZ compliance brackets,
 * VED bands) with a scannable visual layout.
 */
export default function SeverityCards({ cards }: { cards: SeverityCard[] }) {
  return (
    <div className="my-4 grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map((card, i) => {
        const tone = TONE_CLASSES[card.tone ?? "default"];
        return (
          <div
            key={i}
            className={`rounded-lg border ${tone.border} ${tone.bg} p-3 sm:p-4`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className={`block h-1.5 w-1.5 rounded-full ${tone.dot} shrink-0`}
                aria-hidden="true"
              />
              <h3
                className={`text-xs font-bold uppercase tracking-wider sm:text-sm ${tone.title}`}
              >
                {card.title}
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
