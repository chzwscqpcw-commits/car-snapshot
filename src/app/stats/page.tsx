import type { Metadata } from "next";
import Link from "next/link";
import StatsHubFeaturedCard from "@/components/stats/StatsHubFeaturedCard";
import StatsHubPreviewCard from "@/components/stats/StatsHubPreviewCard";
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
          <StatsHubPreviewCard
            href="/stats/cost-of-motoring"
            icon="💰"
            title="Cost of Motoring"
            description="Full annual breakdown — fuel, insurance, depreciation, tax and servicing costs since 2010."
            stats={[
              { value: "~£6,980/yr", label: "average", colour: "amber" },
              { value: "£2,550", label: "depreciation", colour: "red" },
              { value: "£1,120", label: "insurance", colour: "amber" },
            ]}
            delay={250}
          />
          <StatsHubPreviewCard
            href="/stats/road-tax-history"
            icon="📋"
            title="Road Tax (VED) History"
            description="How VED rates have changed since 2001 — from CO₂ bands to the new EV charges in 2025."
            stats={[
              { value: "£640", label: "Band M", colour: "amber" },
              { value: "2025", label: "EVs now taxed", colour: "red" },
            ]}
            delay={300}
          />
          <StatsHubPreviewCard
            href="/stats/used-car-prices"
            icon="📈"
            title="Used Car Prices"
            description="Quarterly price index showing the COVID spike, the 2023 correction, and current market."
            stats={[
              { value: "+38%", label: "peak 2022", colour: "red" },
              { value: "+13%", label: "vs pre-COVID", colour: "amber" },
            ]}
            delay={350}
          />
          <StatsHubPreviewCard
            href="/stats/fuel-type-comparison"
            icon="⚖️"
            title="Fuel Type Comparison"
            description="Compare running costs for petrol, diesel, hybrid and electric at any annual mileage."
            stats={[
              { value: "~10k mi", label: "EV break-even", colour: "emerald" },
              { value: "5p/mi", label: "EV", colour: "emerald" },
              { value: "15p/mi", label: "petrol", colour: "amber" },
            ]}
            delay={400}
          />
        </StatsHubCategoryGroup>

        {/* ── Group 2: Vehicle Data ── */}
        <StatsHubCategoryGroup title="Vehicle Data" headerDelay={450}>
          <StatsHubPreviewCard
            href="/stats/mot-pass-rates"
            icon="🔧"
            title="MOT Pass Rates"
            description="National first-time pass rates by make, plus the most common failure categories."
            stats={[
              { value: "84.2%", label: "avg pass", colour: "emerald" },
              { value: "1 in 5", label: "fail", colour: "red" },
              { value: "#1", label: "suspension", colour: "amber" },
            ]}
            delay={500}
          />
          <StatsHubPreviewCard
            href="/stats/most-reliable-cars"
            icon="🏆"
            title="Most Reliable Cars"
            description="Rankings based on millions of real MOT test results — which models hold up best?"
            stats={[
              { value: "Toyota", label: "tops table", colour: "emerald" },
              { value: "EVs", label: "outperform", colour: "emerald" },
            ]}
            delay={550}
          />
          <StatsHubPreviewCard
            href="/stats/uk-mileage"
            icon="🛣️"
            title="UK Mileage Trends"
            description="Average annual mileage over the decades, plus how mileage varies by vehicle age."
            stats={[
              { value: "7,400", label: "avg miles 2024", colour: "sky" },
              { value: "-20%", label: "since 2002", colour: "amber" },
            ]}
            delay={600}
          />
          <StatsHubPreviewCard
            href="/stats/popular-cars"
            icon="🚗"
            title="Most Popular Cars"
            description="The top makes and models on UK roads by fleet size, plus how best-sellers have changed."
            stats={[
              { value: "Ford", label: "#1 for 40 yrs", colour: "amber" },
              { value: "Fiesta", label: "most registered", colour: "sky" },
            ]}
            delay={650}
          />
        </StatsHubCategoryGroup>

        {/* ── Group 3: Market & Safety ── */}
        <StatsHubCategoryGroup title="Market &amp; Safety" headerDelay={700}>
          <StatsHubPreviewCard
            href="/stats/ev-adoption"
            icon="⚡"
            title="EV Adoption"
            description="Electric vehicle fleet growth, new sales share, and regional EV density across the UK."
            stats={[
              { value: "1.58M", label: "EVs", colour: "emerald" },
              { value: "22.8%", label: "new sales", colour: "emerald" },
              { value: "60%", label: "CAGR", colour: "sky" },
            ]}
            delay={750}
          />
          <StatsHubPreviewCard
            href="/stats/car-registrations"
            icon="📊"
            title="Car Registrations"
            description="Annual new car sales since 1990, with fuel type split showing the shift from diesel to electric."
            stats={[
              { value: "2.69M", label: "peak 2016", colour: "sky" },
              { value: "2025", label: "recovery year", colour: "emerald" },
            ]}
            delay={800}
          />
          <StatsHubPreviewCard
            href="/stats/car-theft"
            icon="🔒"
            title="Car Theft Statistics"
            description="The most stolen cars ranked by theft rate, plus national vehicle theft trends over time."
            stats={[
              { value: "105k", label: "thefts/yr", colour: "red" },
              { value: "Range Rover", label: "most stolen", colour: "red" },
              { value: "<60s", label: "keyless", colour: "amber" },
            ]}
            delay={850}
          />
          <StatsHubPreviewCard
            href="/stats/road-safety"
            icon="🛡️"
            title="Road Safety"
            description="UK road fatalities since 1970, casualties by road user type, and key safety milestones."
            stats={[
              { value: "-79%", label: "deaths since 1970", colour: "emerald" },
              { value: "3x", label: "more cars", colour: "sky" },
            ]}
            delay={900}
          />
        </StatsHubCategoryGroup>

        {/* ── Bottom CTA — Premium Gradient ── */}
        <section
          className="stats-reveal relative mt-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-px overflow-hidden"
          style={{ animationDelay: "950ms" }}
        >
          {/* Corner glows */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative rounded-2xl bg-[#141414] p-8 text-center">
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Check Your Own Vehicle
            </h2>
            <p className="text-gray-400 mb-6">
              Run a free MOT history check, see tax status, mileage records and
              more — instantly, no sign-up required.
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold text-lg px-10 py-4 rounded-lg transition-all active:scale-95"
            >
              Search UK Vehicles Free &rarr;
            </Link>
            <p className="text-gray-500 text-sm mt-3">
              Covers MOT history &middot; Tax status &middot; Mileage &middot;
              ULEZ &middot; Safety recalls
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
