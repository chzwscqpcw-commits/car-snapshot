import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UK Motoring Statistics 2025 | Free Plate Check",
  description:
    "Explore the latest UK motoring statistics — fuel prices, MOT pass rates, car theft, EV adoption, road safety and more. Interactive charts updated regularly.",
  alternates: { canonical: "https://www.freeplatecheck.co.uk/stats" },
  openGraph: {
    title: "UK Motoring Statistics 2025",
    description:
      "Interactive charts and data covering every aspect of UK motoring.",
    url: "https://www.freeplatecheck.co.uk/stats",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
};

const statsPages = [
  {
    slug: "fuel-prices",
    title: "UK Fuel Prices",
    description: "Track petrol and diesel prices from 1988 to today, with fill-cost calculator and key event annotations.",
  },
  {
    slug: "most-reliable-cars",
    title: "Most Reliable Cars",
    description: "See which cars top the MOT reliability table. Rankings based on millions of real MOT test results.",
  },
  {
    slug: "used-car-prices",
    title: "Used Car Prices",
    description: "Quarterly price index showing the COVID spike, correction and current market trends.",
  },
  {
    slug: "mot-pass-rates",
    title: "MOT Pass Rates",
    description: "National MOT pass rates by make, plus the most common failure reasons across all vehicles.",
  },
  {
    slug: "cost-of-motoring",
    title: "Cost of Motoring",
    description: "Full annual breakdown — fuel, insurance, depreciation, tax and servicing costs since 2010.",
  },
  {
    slug: "car-theft",
    title: "Car Theft Statistics",
    description: "The most stolen cars in the UK ranked by theft rate, plus national theft trends over time.",
  },
  {
    slug: "fuel-type-comparison",
    title: "Fuel Type Comparison",
    description: "Compare running costs for petrol, diesel, hybrid and electric at any annual mileage.",
  },
  {
    slug: "ev-adoption",
    title: "EV Adoption",
    description: "Electric vehicle fleet growth, new sales share, and regional EV density across the UK.",
  },
  {
    slug: "car-registrations",
    title: "Car Registrations",
    description: "Annual new car sales since 1990, with fuel type split showing the shift from diesel to electric.",
  },
  {
    slug: "road-tax-history",
    title: "Road Tax (VED) History",
    description: "VED band rates from 2001 to today — see how road tax has changed for low and high-emission vehicles.",
  },
  {
    slug: "uk-mileage",
    title: "UK Mileage Trends",
    description: "Average annual mileage over the decades, plus how mileage varies by vehicle age.",
  },
  {
    slug: "road-safety",
    title: "Road Safety",
    description: "UK road fatalities since 1970, casualties by road user type, and key safety milestones.",
  },
  {
    slug: "popular-cars",
    title: "Most Popular Cars",
    description: "The top makes and models on UK roads by fleet size, plus how best-sellers have changed over time.",
  },
];

export default function StatsIndex() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
              { "@type": "ListItem", position: 2, name: "Statistics" },
            ],
          }),
        }}
      />
      <div className="border-b border-[#2a2a2a] pb-8 pt-10">
        <div className="mx-auto max-w-3xl px-4">
          <nav className="mb-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400">Statistics</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-gray-50 sm:text-4xl">
            UK Motoring Statistics 2025
          </h1>
          <p className="mt-3 text-base text-gray-400 max-w-2xl">
            Interactive charts and data covering every aspect of owning and running a car in the UK.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statsPages.map((page) => (
            <Link
              key={page.slug}
              href={`/stats/${page.slug}`}
              className="group rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 transition-colors hover:border-emerald-700/50"
            >
              <h2 className="font-semibold text-gray-100 group-hover:text-emerald-400 transition-colors">
                {page.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {page.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-emerald-800/40 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold text-gray-100">
            Check Your Own Vehicle
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            Enter any UK reg plate for a free instant check — MOT history, tax
            status, mileage, valuations and more.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Look up a vehicle free
          </Link>
        </div>
      </div>
    </>
  );
}
