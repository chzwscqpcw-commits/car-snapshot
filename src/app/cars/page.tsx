import type { Metadata } from "next";
import {
  getUniqueMakes,
  getModelsForMake,
  getDisplayModel,
} from "@/lib/model-guides";

// ── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Car Guides — Reliability, Safety & Running Costs | Free Plate Check",
  description:
    "Free buyer's guides for the UK's most popular cars. Compare MOT pass rates, NCAP safety ratings, running costs, depreciation and more.",
  keywords: [
    "car buyer guide",
    "car reliability",
    "MOT pass rates by model",
    "car running costs UK",
    "NCAP safety ratings",
    "used car guide",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/cars",
  },
  openGraph: {
    title: "Car Guides — Reliability, Safety & Running Costs",
    description:
      "Free buyer's guides for the UK's most popular cars. Compare MOT pass rates, safety ratings and running costs.",
    url: "https://www.freeplatecheck.co.uk/cars",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Guides — Reliability, Safety & Running Costs",
    description:
      "Free buyer's guides for the UK's most popular cars. Compare MOT pass rates, safety ratings and running costs.",
  },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CarsIndexPage() {
  const makes = getUniqueMakes();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Cars", item: "https://www.freeplatecheck.co.uk/cars" },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to Free Plate Check
          </a>
          <h1 className="text-3xl font-bold text-slate-100">
            Car Buyer&apos;s Guides
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Free reliability, safety and running cost guides for the UK&apos;s
            most popular cars.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Check a specific vehicle
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter any UK registration number to see the full MOT history, tax
            status, mileage, recalls and estimated value.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Look up a vehicle
          </a>
        </div>

        {/* ── Makes grid ───────────────────────────────────────────────── */}
        <div className="space-y-8">
          {makes
            .sort((a, b) => a.displayMake.localeCompare(b.displayMake))
            .map((m) => {
              const models = getModelsForMake(m.makeSlug);
              return (
                <section key={m.makeSlug}>
                  <a
                    href={`/cars/${m.makeSlug}`}
                    className="group flex items-baseline gap-3 mb-3"
                  >
                    <h2 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                      {m.displayMake}
                    </h2>
                    <span className="text-xs text-slate-500">
                      {m.modelCount} model{m.modelCount !== 1 ? "s" : ""}
                    </span>
                  </a>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {models.map((model) => (
                      <a
                        key={model.modelSlug}
                        href={`/cars/${model.makeSlug}/${model.modelSlug}`}
                        className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                      >
                        <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {m.displayMake} {getDisplayModel(model.model)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Reliability, safety &amp; running costs
                        </p>
                      </a>
                    ))}
                  </div>
                </section>
              );
            })}
        </div>

        {/* ── Intro content ────────────────────────────────────────────── */}
        <section className="mt-16 space-y-6 text-slate-300">
          <h2 className="text-2xl font-bold text-slate-100">
            How to use these guides
          </h2>
          <p className="leading-relaxed">
            Each guide pulls together data from official UK sources to give you a
            clear picture of what a model is really like to own. We cover Euro
            NCAP safety ratings, first-time MOT pass rates, estimated running
            costs, depreciation curves, safety recalls and theft risk — all in
            one place.
          </p>
          <p className="leading-relaxed">
            These guides are a starting point. Once you find a specific car
            you&apos;re interested in, enter its registration number on our{" "}
            <a href="/" className="text-blue-400 hover:text-blue-300">
              homepage
            </a>{" "}
            to see the full individual vehicle check — including its complete MOT
            history, tax status, mileage timeline and more.
          </p>
        </section>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">Home</a>
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
