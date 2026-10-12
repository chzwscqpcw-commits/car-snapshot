import { fmt, THEFT_YEAR, type TheftRow } from "@/lib/theft-stats";

interface TheftTableProps {
  rows: TheftRow[];
  /** Fleet-wide per-1,000 rate; rates over 2× it are flagged red. */
  national: number;
  /** "least" flags rates under half the average green instead. */
  mode?: "most" | "least";
  /** Show last year's count column (hidden on phones either way). */
  showPrevious?: boolean;
}

/**
 * Server-rendered league table for the theft pages: crawlable, and readable
 * without the chart bundle.
 */
export default function TheftTable({ rows, national, mode = "most", showPrevious = true }: TheftTableProps) {
  const rateClass = (per1000: number) =>
    mode === "most"
      ? per1000 > national * 2 ? "text-red-400" : ""
      : per1000 < national / 2 ? "text-emerald-400" : "";
  return (
    <div className="mb-3 overflow-x-auto rounded-xl border border-[#1e293b]">
      <table className="w-full text-sm">
        <thead className="bg-[#0f172a] text-left text-xs text-slate-400">
          <tr>
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Model</th>
            <th className="px-3 py-2 text-right font-medium">Stolen</th>
            {showPrevious && (
              <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">{THEFT_YEAR - 1}</th>
            )}
            <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Licensed</th>
            <th className="px-3 py-2 text-right font-medium">Per 1,000</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e293b] text-slate-300">
          {rows.map((r, i) => (
            <tr key={r.name}>
              <td className="px-3 py-2 text-slate-500">{i + 1}</td>
              <td className="px-3 py-2 text-slate-100">{r.name}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmt(r.thefts)}</td>
              {showPrevious && (
                <td className="hidden px-3 py-2 text-right tabular-nums text-slate-500 sm:table-cell">
                  {fmt(r.previous)}
                </td>
              )}
              <td className="hidden px-3 py-2 text-right tabular-nums text-slate-500 sm:table-cell">
                {fmt(r.licensed)}
              </td>
              <td className={`px-3 py-2 text-right tabular-nums ${rateClass(r.per1000)}`}>{r.per1000}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
