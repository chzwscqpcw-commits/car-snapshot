import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import freshness from "@/data/_freshness.json";
import { DATASETS, describeMethod, type DatasetEntry } from "@/data/_registry";
import { formatDay, formatMonth, nextUpdateLabel } from "@/lib/data-provenance";

const URL = "https://www.freeplatecheck.co.uk/about/data";
const TITLE = "Where our data comes from | Free Plate Check";
const DESCRIPTION =
  "Every dataset behind Free Plate Check's checks and statistics: the source, how often it is refreshed, when our copy was last updated, and what it feeds.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
};

type Group = { key: "auto" | "manual" | "editorial"; title: string; blurb: string; entries: DatasetEntry[] };

/**
 * The public data page: no PIN, one card per registry entry. The dashboard
 * at /data-health shows the same facts with thresholds and job results; this
 * is the reader's version — what the figure is, where it came from, when we
 * last took a copy, and when the next one is due.
 */
export default function AboutDataPage() {
  const manifest = freshness as Record<string, string>;
  const groups: Group[] = [
    {
      key: "auto",
      title: "Refreshed automatically",
      blurb: "Scheduled jobs fetch these, compare every file with the previous version (counts, key sets and headline figures must stay within bands) and commit only what passes.",
      entries: DATASETS.filter((d) => d.method !== "manual"),
    },
    {
      key: "manual",
      title: "Refreshed by hand",
      blurb: "Annual releases and a Freedom of Information request. Each has a due date; a calendar reminds us, and the dates below are the proof.",
      entries: DATASETS.filter((d) => d.method === "manual" && d.kind === "json"),
    },
    {
      key: "editorial",
      title: "Written and checked by us",
      blurb: "Reference lists we maintain against official pages and published sources, revised when something changes.",
      entries: DATASETS.filter((d) => d.method === "manual" && d.kind === "module"),
    },
  ];

  const dated = DATASETS.map((d) => manifest[d.file]).filter(Boolean).sort();
  const newest = dated.length ? formatDay(dated[dated.length - 1]) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Where our data comes from",
    description: DESCRIPTION,
    url: URL,
    isPartOf: { "@type": "WebSite", name: "Free Plate Check", url: "https://www.freeplatecheck.co.uk" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
        { "@type": "ListItem", position: 2, name: "About", item: "https://www.freeplatecheck.co.uk/about" },
        { "@type": "ListItem", position: 3, name: "Our data", item: URL },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <nav className="mb-4 text-sm text-slate-500">
            <Link href="/" className="transition-colors hover:text-slate-300">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/about" className="transition-colors hover:text-slate-300">About</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-400">Our data</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-100">Where our data comes from</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            The vehicle you look up comes live from the DVLA and the DVSA. The statistics around it — recalls,
            pass rates, theft rates, how many are left, fuel prices — come from the {DATASETS.length} datasets below.
            Each card says where the figures come from, how often we refresh them and when we last did.
            {newest ? ` Most recent refresh: ${newest}.` : ""}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <section className="mb-10 rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="mb-2 text-base font-semibold text-slate-100">How we keep it current</h2>
          <p>
            Automated datasets are fetched on a schedule and compared with the previous copy before anything is
            published: entry counts, the set of makes and models and a few headline figures have to stay within
            bands, or a person looks first. Hand-run datasets have due dates and a calendar. Every page that uses a
            dataset shows a &ldquo;Data as of&rdquo; line with the same date you see here, so a figure is never
            presented as more current than it is. The live lookups — DVLA Vehicle Enquiry Service, the DVSA MOT
            history and eBay listings for valuations — are described on the{" "}
            <Link href="/about" className="text-cyan-300 underline decoration-cyan-800 underline-offset-2 hover:text-cyan-200">
              About page
            </Link>
            .
          </p>
        </section>

        {groups.map((g) => (
          <section key={g.key} className="mb-12">
            <h2 className="text-xl font-bold text-slate-100">{g.title}</h2>
            <p className="mt-1 mb-5 text-sm text-slate-400">{g.blurb}</p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {g.entries.map((d) => (
                <DatasetCard key={d.file} entry={d} lastRefreshed={manifest[d.file]} />
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-6 text-xs text-slate-500">
          Dates are when our copy of each file last changed. &ldquo;Covers&rdquo; is the period the figures describe,
          which for annual releases is earlier than the refresh date.
        </p>
      </div>
    </div>
  );
}

function DatasetCard({ entry, lastRefreshed }: { entry: DatasetEntry; lastRefreshed?: string }) {
  const refreshed = lastRefreshed ? formatDay(lastRefreshed) : null;
  const next = entry.method === "manual" && entry.nextDue ? formatMonth(entry.nextDue) : nextUpdateLabel(entry);
  return (
    <li className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-100">{entry.label}</h3>
      <p className="mt-1 text-xs text-slate-400">
        Source:{" "}
        {entry.source.url ? (
          <a
            href={entry.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cyan-300 underline decoration-cyan-900 underline-offset-2 hover:text-cyan-200"
          >
            {entry.source.name}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : (
          <span className="text-slate-300">{entry.source.name}</span>
        )}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-slate-500">Updated</dt>
        <dd className="text-slate-300">{describeMethod(entry)}</dd>
        <dt className="text-slate-500">Last refreshed</dt>
        <dd className="text-slate-300">
          {refreshed ? <time dateTime={lastRefreshed!.slice(0, 10)}>{refreshed}</time> : "—"}
        </dd>
        <dt className="text-slate-500">Next</dt>
        <dd className="text-slate-300">{next}</dd>
        {entry.covers && (
          <>
            <dt className="text-slate-500">Covers</dt>
            <dd className="text-slate-300">{entry.covers}</dd>
          </>
        )}
      </dl>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Feeds: {entry.feeds.join(" · ")}</p>
    </li>
  );
}
