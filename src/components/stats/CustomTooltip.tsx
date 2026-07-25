"use client";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number, name: string) => string;
}

export default function CustomTooltip({
  active,
  payload,
  label,
  formatter,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/95 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur-sm">
      <div className="border-b border-slate-600/50 pb-1 mb-2 text-xs font-semibold text-slate-200">
        {label}
      </div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="ml-auto font-semibold tabular-nums text-slate-100">
            {formatter
              ? formatter(entry.value, entry.name)
              : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
