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
];

export default function StatsRelated({ exclude }: { exclude: string }) {
  const cards = allStats.filter((s) => s.slug !== exclude).slice(0, 3);
  return (
    <div className="my-10">
      <h3 className="mb-4 text-lg font-semibold text-gray-100">
        Related Statistics
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((s) => (
          <Link
            key={s.slug}
            href={`/stats/${s.slug}`}
            className="group rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 transition-colors hover:border-emerald-700/50"
          >
            <div className="font-medium text-gray-100 group-hover:text-emerald-400 transition-colors">
              {s.title}
            </div>
            <div className="mt-1 text-sm text-gray-400">{s.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
