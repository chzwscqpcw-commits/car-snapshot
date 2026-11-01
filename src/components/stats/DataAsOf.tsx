import Link from "next/link";
import { dataProvenance } from "@/lib/data-provenance";

/**
 * "Data as of <date> · Source <name> · Next update <month>" for any section
 * backed by a dataset in src/data/: the /stats pages (near the charts and in
 * the citation box), the results page's recalls and insights, the buyer's
 * check and the running-cost forecast.
 *
 * These pages state the period their figures COVER (via `temporalCoverage`
 * and the prose), but said nothing about when our copy was last refreshed,
 * and the two are not the same thing. Several datasets are refreshed by
 * hand, and mot-pass-rates.json and theft-risk.json had sat unchanged since
 * February 2026 while the pages presented their numbers as current fact. A
 * stale figure with a visible date is a usable figure; a stale figure
 * presented as current is a wrong one.
 *
 * Fed by src/lib/data-provenance.ts: the registry for source and cadence, the
 * freshness manifest for the date. Where a section draws on several
 * datasets, pass them all and the OLDEST date is shown.
 */
export default function DataAsOf({
  files,
  className = "",
  compact = false,
}: {
  /** Data file names as in the registry, e.g. "theft-risk.json". */
  files: string[];
  className?: string;
  /** Smaller type and no trailing link — for inside a result card. */
  compact?: boolean;
}) {
  const p = dataProvenance(files);
  // No manifest entry (a newly added file that has never been committed) —
  // render nothing rather than an empty or wrong date.
  if (!p.asOf || !p.asOfLabel) return null;

  const sep = <span className="mx-1.5 text-slate-700" aria-hidden="true">·</span>;
  return (
    <p className={`${compact ? "text-[11px]" : "text-xs"} leading-relaxed text-slate-500 ${className}`}>
      <span className="whitespace-nowrap">
        Data as of{" "}
        <time dateTime={p.asOf.slice(0, 10)} className="text-slate-400">
          {p.asOfLabel}
        </time>
      </span>
      {p.sources.length > 0 && (
        <>
          {sep}
          <span>
            Source <span className="text-slate-400">{p.sources.join(", ")}</span>
          </span>
        </>
      )}
      {sep}
      <span className="whitespace-nowrap">
        Next update <span className="text-slate-400">{p.nextUpdate}</span>
      </span>
      {!compact && (
        <>
          {sep}
          <Link
            href="/about/data"
            prefetch={false}
            className="whitespace-nowrap underline decoration-slate-700 underline-offset-2 hover:text-slate-300"
          >
            About our data
          </Link>
        </>
      )}
    </p>
  );
}
