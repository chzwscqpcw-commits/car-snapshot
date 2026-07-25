import colourData from "@/data/colour-popularity.json";

/** Approximate display hex for each DVLA/SMMT colour so each bar renders in its
 *  own colour — the visual hook that makes this chart shareable. */
const COLOUR_HEX: Record<string, string> = {
  GREY: "#64748b",
  BLACK: "#1e293b",
  BLUE: "#2563eb",
  WHITE: "#f1f5f9",
  SILVER: "#cbd5e1",
  RED: "#dc2626",
  GREEN: "#16a34a",
  YELLOW: "#eab308",
  ORANGE: "#ea580c",
  BRONZE: "#a16207",
  PURPLE: "#7c3aed",
  BROWN: "#78350f",
  BEIGE: "#d6c7a1",
  MAROON: "#7f1d1d",
  GOLD: "#ca8a04",
};

type ColourRow = { rank: number; share: number; label: string };

export default function CarColourCharts() {
  const entries = (Object.entries(colourData as Record<string, ColourRow>)).sort(
    (a, b) => a[1].rank - b[1].rank,
  );
  const max = Math.max(...entries.map(([, v]) => v.share));

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
        New car colour share — UK 2025
      </h2>
      <ul className="space-y-2.5">
        {entries.map(([name, v]) => (
          <li key={name} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs font-medium capitalize text-slate-300">
              {name.toLowerCase()}
            </span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-slate-800/60">
              <div
                className="h-full rounded"
                style={{
                  width: `${(v.share / max) * 100}%`,
                  minWidth: v.share > 0 ? "3px" : 0,
                  backgroundColor: COLOUR_HEX[name] ?? "#64748b",
                }}
                aria-hidden="true"
              />
            </div>
            <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-slate-400">
              {v.share}%
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-slate-500">
        Source: SMMT new-car registration data, 2025 full year (2,020,520 cars).
      </p>
    </div>
  );
}
