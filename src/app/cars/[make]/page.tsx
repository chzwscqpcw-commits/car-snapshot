import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  MODEL_REGISTRY,
  getModelsForMake,
  getUniqueMakes,
  getDisplayMake,
  getDisplayModel,
  getModelGuideData,
} from "@/lib/model-guides";

// ── Static generation ────────────────────────────────────────────────────────

export function generateStaticParams() {
  const makes = new Set(MODEL_REGISTRY.map((m) => m.makeSlug));
  return Array.from(makes).map((make) => ({ make }));
}

// ── Metadata ─────────────────────────────────────────────────────────────────

type PageProps = { params: Promise<{ make: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { make } = await params;
  const models = getModelsForMake(make);
  if (models.length === 0) return {};

  const displayMake = getDisplayMake(models[0].make);
  const title = `${displayMake} — Buyer's Guides for Every Model | Free Plate Check`;
  const description = `Free ${displayMake} buyer's guides. Reliability, safety ratings, running costs and what to check for ${models.length} popular ${displayMake} models.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.freeplatecheck.co.uk/cars/${make}`,
    },
    openGraph: {
      title: `${displayMake} Car Guides`,
      description,
      url: `https://www.freeplatecheck.co.uk/cars/${make}`,
      siteName: "Free Plate Check",
      locale: "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayMake} Car Guides`,
      description,
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function MakeIndexPage({ params }: PageProps) {
  const { make } = await params;
  const models = getModelsForMake(make);
  if (models.length === 0) notFound();

  const displayMake = getDisplayMake(models[0].make);

  // Get summary data for each model
  const modelSummaries = models.map((m) => {
    const data = getModelGuideData(m.makeSlug, m.modelSlug);
    return { entry: m, data };
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Cars", item: "https://www.freeplatecheck.co.uk/cars" },
      { "@type": "ListItem", position: 3, name: displayMake, item: `https://www.freeplatecheck.co.uk/cars/${make}` },
    ],
  };

  // Other makes for cross-linking
  const allMakes = getUniqueMakes().filter((m) => m.makeSlug !== make);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <a href="/cars" className="text-blue-400 hover:text-blue-300">
              Cars
            </a>
            <span>/</span>
            <span className="text-slate-300">{displayMake}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">
            {displayMake} — Buyer&apos;s Guides
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Reliability, safety and running cost guides for {models.length}{" "}
            popular {displayMake} models.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Check a specific {displayMake}
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter a registration number to see the full MOT history, tax status,
            recalls and more for any {displayMake}.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Look up a vehicle
          </a>
        </div>

        {/* ── Model cards ──────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {modelSummaries.map(({ entry, data }) => (
            <a
              key={entry.modelSlug}
              href={`/cars/${entry.makeSlug}/${entry.modelSlug}`}
              className="group block p-5 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
            >
              <p className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                {displayMake} {getDisplayModel(entry.model)}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                {data?.ncap && (
                  <span>
                    {data.ncap.overallStars}&#9733; NCAP
                  </span>
                )}
                {data?.motPassRate && (
                  <span>{data.motPassRate.passRate}% MOT pass</span>
                )}
                {data?.runningCosts && (
                  <span>&pound;{data.runningCosts.monthlyCost}/mo</span>
                )}
                {data?.bodyType && <span>{data.bodyType}</span>}
              </div>
              {data?.recalls && data.recalls.length > 0 && (
                <p className="text-xs text-amber-500 mt-2">
                  {data.recalls.length} recall
                  {data.recalls.length !== 1 ? "s" : ""}
                </p>
              )}
            </a>
          ))}
        </div>

        {/* ── Other makes ──────────────────────────────────────────────── */}
        <section className="mt-16">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            Other makes
          </h2>
          <div className="flex flex-wrap gap-2">
            {allMakes.map((m) => (
              <a
                key={m.makeSlug}
                href={`/cars/${m.makeSlug}`}
                className="px-3 py-1.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-blue-400 transition-colors"
              >
                {m.displayMake}
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">Home</a>
            <span>&bull;</span>
            <a href="/cars" className="hover:text-slate-300">Car Guides</a>
            <span>&bull;</span>
            <a href="/blog" className="hover:text-slate-300">Guides</a>
            <span>&bull;</span>
            <a href="/privacy" className="hover:text-slate-300">Privacy Policy</a>
            <span>&bull;</span>
            <a href="/terms" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}
