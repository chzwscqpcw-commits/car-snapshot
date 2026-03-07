import type { Metadata } from "next";
import Link from "next/link";
import StatsHubFeaturedCard from "@/components/stats/StatsHubFeaturedCard";
import StatsHubCompactCard from "@/components/stats/StatsHubCompactCard";
import StatsHubCategoryGroup from "@/components/stats/StatsHubCategoryGroup";
import FuelPricesSparkline from "@/components/stats/sparklines/FuelPricesSparkline";

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

export default function StatsIndex() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes statsReveal {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes statsSlideIn {
              from { opacity: 0; transform: translateX(-12px); }
              to   { opacity: 1; transform: translateX(0); }
            }
            @keyframes sparklineGlow {
              0%   { box-shadow: inset 0 0 0 rgba(16,185,129,0); }
              50%  { box-shadow: inset 0 -20px 40px rgba(16,185,129,0.08); }
              100% { box-shadow: inset 0 -10px 30px rgba(16,185,129,0.04); }
            }
            .stats-reveal {
              opacity: 0;
              animation: statsReveal 0.5s ease-out forwards;
            }
            .stats-slide-in {
              opacity: 0;
              animation: statsSlideIn 0.4s ease-out forwards;
            }
            .sparkline-glow {
              animation: statsReveal 0.5s ease-out forwards, sparklineGlow 2s ease-in-out 0.6s forwards;
            }
            @media (prefers-reduced-motion: reduce) {
              .stats-reveal, .stats-slide-in, .sparkline-glow {
                animation: none !important;
                opacity: 1 !important;
              }
            }
          `,
        }}
      />

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

      {/* ── Hero ── */}
      <div className="border-b border-[#2a2a2a] pb-5 pt-8">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="stats-reveal mb-4 text-sm text-gray-500" style={{ animationDelay: "0ms" }}>
            <Link href="/" className="hover:text-gray-300 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400">Statistics</span>
          </nav>
          <h1 className="stats-reveal text-3xl font-bold tracking-tight text-[#f9fafb] sm:text-4xl" style={{ animationDelay: "0ms" }}>
            UK Motoring Statistics
          </h1>
          <p className="stats-reveal mt-3 text-base text-gray-400 max-w-2xl" style={{ animationDelay: "50ms" }}>
            Interactive charts and data for every UK driver
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* Featured card — Fuel Prices */}
        <StatsHubFeaturedCard sparkline={<FuelPricesSparkline />} delay={100} />

        {/* ── Group 1: Costs & Prices ── */}
        <StatsHubCategoryGroup title="Costs &amp; Prices" headerDelay={200}>
          <StatsHubCompactCard
            href="/stats/cost-of-motoring"
            icon="💰"
            title="Cost of Motoring"
            description="Full annual breakdown — fuel, insurance, depreciation, tax and servicing costs since 2010."
            keyStat="~£3,800/yr average"
            keyStatColour="amber"
            delay={250}
          />
          <StatsHubCompactCard
            href="/stats/road-tax-history"
            icon="📋"
            title="Road Tax (VED) History"
            description="How VED rates have changed since 2001 — from CO2 bands to the new EV charges in 2025."
            keyStat="£640 Band M now"
            keyStatColour="amber"
            delay={300}
          />
          <StatsHubCompactCard
            href="/stats/used-car-prices"
            icon="📈"
            title="Used Car Prices"
            description="Quarterly price index showing the COVID spike, the 2023 correction, and current market."
            keyStat="+38% peak (2022)"
            keyStatColour="red"
            delay={350}
          />
          <StatsHubCompactCard
            href="/stats/fuel-type-comparison"
            icon="⚖️"
            title="Fuel Type Comparison"
            description="Compare running costs for petrol, diesel, hybrid and electric at any annual mileage."
            keyStat="EV breaks even ~10k mi"
            keyStatColour="emerald"
            delay={400}
          />
        </StatsHubCategoryGroup>

        {/* ── Group 2: Vehicle Data ── */}
        <StatsHubCategoryGroup title="Vehicle Data" headerDelay={450}>
          <StatsHubCompactCard
            href="/stats/mot-pass-rates"
            icon="🔧"
            title="MOT Pass Rates"
            description="National first-time pass rates by make, plus the most common failure categories."
            keyStat="84.2% avg pass rate"
            keyStatColour="emerald"
            delay={500}
          />
          <StatsHubCompactCard
            href="/stats/most-reliable-cars"
            icon="🏆"
            title="Most Reliable Cars"
            description="Rankings based on millions of real MOT test results — which models hold up best?"
            keyStat="Toyota tops the table"
            keyStatColour="emerald"
            delay={550}
          />
          <StatsHubCompactCard
            href="/stats/uk-mileage"
            icon="🛣️"
            title="UK Mileage Trends"
            description="Average annual mileage over the decades, plus how mileage varies by vehicle age."
            keyStat="7,400 miles avg (2024)"
            keyStatColour="sky"
            delay={600}
          />
          <StatsHubCompactCard
            href="/stats/popular-cars"
            icon="🚗"
            title="Most Popular Cars"
            description="The top makes and models on UK roads by fleet size, plus how best-sellers have changed."
            keyStat="Ford #1 for 40 years"
            keyStatColour="amber"
            delay={650}
          />
        </StatsHubCategoryGroup>

        {/* ── Group 3: Market & Safety ── */}
        <StatsHubCategoryGroup title="Market &amp; Safety" headerDelay={700}>
          <StatsHubCompactCard
            href="/stats/ev-adoption"
            icon="⚡"
            title="EV Adoption"
            description="Electric vehicle fleet growth, new sales share, and regional EV density across the UK."
            keyStat="1.1M+ EVs on UK roads"
            keyStatColour="emerald"
            delay={750}
          />
          <StatsHubCompactCard
            href="/stats/car-registrations"
            icon="📊"
            title="Car Registrations"
            description="Annual new car sales since 1990, with fuel type split showing the shift from diesel to electric."
            keyStat="2.69M peak (2016)"
            keyStatColour="sky"
            delay={800}
          />
          <StatsHubCompactCard
            href="/stats/car-theft"
            icon="🔒"
            title="Car Theft Statistics"
            description="The most stolen cars ranked by theft rate, plus national vehicle theft trends over time."
            keyStat="Rising since 2014"
            keyStatColour="red"
            delay={850}
          />
          <StatsHubCompactCard
            href="/stats/road-safety"
            icon="🛡️"
            title="Road Safety"
            description="UK road fatalities since 1970, casualties by road user type, and key safety milestones."
            keyStat="-80% deaths since 1972"
            keyStatColour="emerald"
            delay={900}
          />
        </StatsHubCategoryGroup>

        {/* ── Bottom CTA ── */}
        <section
          className="stats-reveal mt-10 rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-8 text-center"
          style={{ animationDelay: "950ms" }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            Check Your Own Vehicle
          </h2>
          <p className="text-gray-400 mb-6">
            Run a free MOT history check, see tax status, mileage records and
            more — instantly, no sign-up required.
          </p>
          <Link
            href="/"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg px-10 py-4 rounded-lg transition-colors"
          >
            Search UK Vehicles Free &rarr;
          </Link>
          <p className="text-gray-500 text-sm mt-3">
            Covers MOT history &middot; Tax status &middot; Mileage &middot;
            ULEZ &middot; Safety recalls
          </p>
        </section>
      </div>
    </>
  );
}
