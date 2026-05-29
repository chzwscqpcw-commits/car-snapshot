interface Props {
  current: 1 | 2 | 3 | 4;
}

const LABELS: Record<number, string> = {
  1: "Vehicle",
  2: "Service",
  3: "Location",
  4: "Review",
};

export default function BookingProgress({ current }: Props) {
  return (
    <ol
      className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-medium"
      aria-label="Booking progress"
    >
      {[1, 2, 3, 4].map((step) => {
        const isCurrent = step === current;
        const isPast = step < current;
        return (
          <li key={step} className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span
              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full font-mono text-[11px] font-semibold shrink-0 transition-colors ${
                isPast
                  ? "bg-cyan-500/80 text-slate-950"
                  : isCurrent
                    ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.45)]"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
              }`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {isPast ? "✓" : step}
            </span>
            <span
              className={`hidden sm:inline truncate ${
                isCurrent ? "text-cyan-300" : isPast ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {LABELS[step]}
            </span>
            {step < 4 && (
              <span
                className={`hidden sm:block h-px w-6 lg:w-10 shrink-0 ${
                  isPast ? "bg-cyan-500/60" : "bg-slate-800"
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
