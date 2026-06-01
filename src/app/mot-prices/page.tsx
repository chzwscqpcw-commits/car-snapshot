import type { Metadata } from "next";
import MotPriceFinder from "@/components/MotPriceFinder";
import { MOT_TOWNS, MOT_REGIONS, formatGBP } from "@/data/mot-locations";

export const metadata: Metadata = {
  title: "Cheap MOT Prices Near You — Compare by Town 2026 | Free Plate Check",
  description:
    "Compare local MOT prices by town across England, Scotland and Wales. See typical regional prices, all below the £54.85 legal maximum. Free comparison, no signup.",
  keywords: [
    "MOT prices near me",
    "cheap MOT near me",
    "MOT prices by town",
    "compare MOT prices UK",
    "MOT cost by area",
    "local MOT prices",
  ],
  alternates: { canonical: "https://www.freeplatecheck.co.uk/mot-prices" },
  openGraph: {
    title: "Cheap MOT Prices Near You — Compare by Town",
    description:
      "Compare local MOT prices by town across England, Scotland and Wales — all below the £54.85 legal maximum. Free, no signup.",
    url: "https://www.freeplatecheck.co.uk/mot-prices",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cheap MOT Prices Near You — Compare by Town",
    description:
      "Compare local MOT prices by town across England, Scotland and Wales — all below the £54.85 legal maximum.",
  },
};

export default function MotPricesHubPage() {
  // Group towns under their region, preserving the region declaration order.
  const byRegion = Object.values(MOT_REGIONS).map((region) => ({
    region,
    towns: MOT_TOWNS.filter((t) => t.region === region.key).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  }));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Cheap MOT", item: "https://www.freeplatecheck.co.uk/cheap-mot" },
      { "@type": "ListItem", position: 3, name: "MOT Prices by Town", item: "https://www.freeplatecheck.co.uk/mot-prices" },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "MOT prices by UK town",
    itemListElement: MOT_TOWNS.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `MOT prices in ${t.name}`,
      url: `https://www.freeplatecheck.co.uk/mot-prices/${t.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      {/* --- HERO --- */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-6 lg:pb-10">
          <a href="/cheap-mot" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
            &larr; Cheap MOT
          </a>
          <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-10 lg:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 leading-tight">
                MOT prices near you
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                MOT prices vary by region &mdash; London and the South East run
                near the <strong className="text-slate-100">&pound;54.85</strong>{" "}
                cap, while the North, Wales and Scotland sit well below. Pick your
                town below, or enter your reg to compare local garages now.
              </p>
            </div>
            <div className="mt-6 lg:mt-0">
              <MotPriceFinder source="mot_prices_hub" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
        <div className="space-y-10">
          {byRegion.map(({ region, towns }) => (
            <section key={region.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4 border-b border-slate-800 pb-2">
                <h2 className="text-xl font-bold text-slate-100">{region.name}</h2>
                <span className="text-sm text-slate-400">
                  typically {formatGBP(region.priceLow)}&ndash;{formatGBP(region.priceHigh)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {towns.map((t) => (
                  <a
                    key={t.slug}
                    href={`/mot-prices/${t.slug}`}
                    className="block rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-700 hover:text-blue-400"
                  >
                    {t.name}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-slate-400">
          Don&apos;t see your town? The{" "}
          <a href="/cheap-mot" className="text-blue-400 hover:text-blue-300">national cheap-MOT comparison</a>{" "}
          works anywhere in Great Britain &mdash; enter your reg and postcode to
          see garages near you.
        </p>
      </div>
    </div>
  );
}
