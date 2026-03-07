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
    <div className="rounded-lg border border-[#374151] bg-[#1f2937] px-3 py-2 shadow-lg">
      <div className="border-b border-emerald-500/40 pb-1 mb-2 text-xs font-medium text-gray-300">
        {label}
      </div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-gray-200">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="font-medium">
            {formatter
              ? formatter(entry.value, entry.name)
              : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
