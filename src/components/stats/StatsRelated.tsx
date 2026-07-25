import Link from "next/link";

interface StatsPage {
  slug: string;
  title: string;
  description: string;
}

const allStats: StatsPage[] = [
  { slug: "fuel-prices", title: "UK Fuel Prices", description: "Petrol & diesel price trends since 1988" },
  { slug: "most-reliable-cars", title: "Most Reliable Cars", description: "MOT pass rates ranked by make & model" },
  { slug: "used-car-prices", title: "Used Car Prices", description: "Market index & depreciation trends" },
  { slug: "mot-pass-rates", title: "MOT Pass Rates", description: "National pass rates & top failure reasons" },
  { slug: "cost-of-motoring", title: "Cost of Motoring", description: "Full annual breakdown of running costs" },
  { slug: "car-theft", title: "Car Theft Statistics", description: "Most stolen cars & theft trends" },
  { slug: "fuel-type-comparison", title: "Fuel Type Comparison", description: "Petrol vs diesel vs EV running costs" },
  { slug: "ev-adoption", title: "EV Adoption", description: "Electric vehicle growth & fleet numbers" },
  { slug: "car-registrations", title: "Car Registrations", description: "New car sales & fuel type split" },
  { slug: "road-tax-history", title: "Road Tax (VED) History", description: "VED band rates over time" },
  { slug: "uk-mileage", title: "UK Mileage Trends", description: "Average annual mileage over the decades" },
  { slug: "road-safety", title: "Road Safety", description: "Fatalities & casualties since 1970" },
  { slug: "popular-cars", title: "Most Popular Cars", description: "Top makes & models on UK roads" },
  { slug: "car-colours", title: "Car Colours", description: "Most popular new car colours in the UK" },
  { slug: "how-many-left", title: "How Many Are Left?", description: "UK car survivors & near-extinct models by reg" },
];

// Topic-aware related sets — keyed by the current page's slug, in priority
// order. Slugs not listed fall back to the first three other stats pages.
// Keeps cross-linking topically relevant (helps both UX and internal-link SEO)
// instead of always surfacing the same three.
const RELATED: Record<string, string[]> = {
  "car-theft": ["popular-cars", "how-many-left", "used-car-prices"],
  "uk-mileage": ["used-car-prices", "cost-of-motoring", "most-reliable-cars"],
  "how-many-left": ["popular-cars", "car-registrations", "used-car-prices"],
  "most-reliable-cars": ["mot-pass-rates", "used-car-prices", "uk-mileage"],
  "used-car-prices": ["most-reliable-cars", "cost-of-motoring", "how-many-left"],
  "fuel-prices": ["cost-of-motoring", "fuel-type-comparison", "road-tax-history"],
  "road-tax-history": ["cost-of-motoring", "fuel-prices", "ev-adoption"],
};

const bySlug = new Map(allStats.map((s) => [s.slug, s] as const));

export default function StatsRelated({ exclude }: { exclude: string }) {
  const curated = RELATED[exclude]
    ?.map((slug) => bySlug.get(slug))
    .filter((s): s is StatsPage => Boolean(s) && s!.slug !== exclude);
  const cards =
    curated && curated.length > 0
      ? curated.slice(0, 3)
      : allStats.filter((s) => s.slug !== exclude).slice(0, 3);
  return (
    <div className="my-10">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">
        Related Statistics
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((s) => (
          <Link
            key={s.slug}
            href={`/stats/${s.slug}`}
            className="group rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 transition-colors hover:border-emerald-700/50"
          >
            <div className="font-medium text-slate-100 group-hover:text-emerald-400 transition-colors">
              {s.title}
            </div>
            <div className="mt-1 text-sm text-slate-400">{s.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
