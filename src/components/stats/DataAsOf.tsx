import freshness from "@/data/_freshness.json";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Format deterministically rather than via toLocaleDateString, which varies
 * with the runtime's ICU data and would risk a server/client mismatch.
 */
function formatDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * "Last refreshed" line for the /stats data-story pages.
 *
 * These pages state the period their figures COVER (via `temporalCoverage` and
 * the prose), but said nothing about when our copy was last updated — and the
 * two are not the same thing. Several of these datasets are refreshed by hand,
 * and mot-pass-rates.json and theft-risk.json had sat unchanged since February
 * while the pages presented their numbers as current fact. A reader, or a
 * journalist taking the citation box up on its offer, had no way to tell.
 *
 * This is the honest, cheap half of the fix: say when the data was last
 * refreshed. It does not make the data fresher, and is not a substitute for
 * refreshing it — but a stale figure with a visible date is a usable figure,
 * whereas a stale figure presented as current is a wrong one.
 *
 * Reads `src/data/_freshness.json`, the same manifest /data-health uses, which
 * is rebuilt from git history whenever a data file changes. Where a page draws
 * on several datasets, pass them all and the OLDEST is shown — that is the
 * date the whole page is honest to.
 */
export default function DataAsOf({
  files,
  className = "",
}: {
  /** Data file names as they appear in _freshness.json, e.g. "theft-risk.json". */
  files: string[];
  className?: string;
}) {
  const manifest = freshness as Record<string, string>;
  const dates = files
    .map((f) => manifest[f])
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .sort();

  // No manifest entry (a newly added file that has never been committed) —
  // render nothing rather than an empty or wrong date.
  if (dates.length === 0) return null;
  const formatted = formatDate(dates[0]);
  if (!formatted) return null;

  return (
    <p className={`text-xs text-slate-500 ${className}`}>
      Dataset last refreshed{" "}
      <time dateTime={dates[0].slice(0, 10)} className="text-slate-400">
        {formatted}
      </time>
      . We update these figures periodically; the underlying statistics are
      published less often than that.
    </p>
  );
}
