import type { Metadata } from "next";
import Link from "next/link";
import StatsHubFeaturedCard from "@/components/stats/StatsHubFeaturedCard";
import StatsHubCard from "@/components/stats/StatsHubCard";
import StatsHubCategoryGroup from "@/components/stats/StatsHubCategoryGroup";

import FuelPricesSparkline from "@/components/stats/sparklines/FuelPricesSparkline";
import CostOfMotoringSparkline from "@/components/stats/sparklines/CostOfMotoringSparkline";
import RoadTaxSparkline from "@/components/stats/sparklines/RoadTaxSparkline";
import UsedCarPricesSparkline from "@/components/stats/sparklines/UsedCarPricesSparkline";
import FuelTypeSparkline from "@/components/stats/sparklines/FuelTypeSparkline";
import MotPassRatesSparkline from "@/components/stats/sparklines/MotPassRatesSparkline";
import ReliableCarsSparkline from "@/components/stats/sparklines/ReliableCarsSparkline";
import MileageSparkline from "@/components/stats/sparklines/MileageSparkline";
import PopularCarsSparkline from "@/components/stats/sparklines/PopularCarsSparkline";
import EvAdoptionSparkline from "@/components/stats/sparklines/EvAdoptionSparkline";
import CarRegistrationsSparkline from "@/components/stats/sparklines/CarRegistrationsSparkline";
import CarTheftSparkline from "@/components/stats/sparklines/CarTheftSparkline";
import RoadSafetySparkline from "@/components/stats/sparklines/RoadSafetySparkline";

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
      <div className="border-b border-[#2a2a2a] pb-8 pt-10">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="mb-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-300 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400">Statistics</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb] sm:text-4xl">
            UK Motoring Statistics
          </h1>
          <p className="mt-3 text-base text-gray-400 max-w-2xl">
            Interactive charts and data for every UK driver
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              13 interactive charts
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1 text-xs text-gray-400">
              Free &middot; No sign-up required
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1 text-xs text-gray-400">
              Updated 2025
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Featured card — Fuel Prices */}
        <StatsHubFeaturedCard sparkline={<FuelPricesSparkline />} />

        {/* ── Group 1: Costs & Prices ── */}
        <StatsHubCategoryGroup title="Costs &amp; Prices">
          <StatsHubCard
            href="/stats/cost-of-motoring"
            icon="💰"
            title="Cost of Motoring"
            description="Full annual breakdown — fuel, insurance, depreciation, tax and servicing costs since 2010."
            keyStat="~£3,800/yr average"
            keyStatColour="amber"
            sparkline={<CostOfMotoringSparkline />}
          />
          <StatsHubCard
            href="/stats/road-tax-history"
            icon="📋"
            title="Road Tax (VED) History"
            description="How VED rates have changed since 2001 — from CO2 bands to the new EV charges in 2025."
            keyStat="£640 Band M now"
            keyStatColour="amber"
            sparkline={<RoadTaxSparkline />}
          />
          <StatsHubCard
            href="/stats/used-car-prices"
            icon="📈"
            title="Used Car Prices"
            description="Quarterly price index showing the COVID spike, the 2023 correction, and current market."
            keyStat="+38% peak (2022)"
            keyStatColour="red"
            sparkline={<UsedCarPricesSparkline />}
          />
          <StatsHubCard
            href="/stats/fuel-type-comparison"
            icon="⚖️"
            title="Fuel Type Comparison"
            description="Compare running costs for petrol, diesel, hybrid and electric at any annual mileage."
            keyStat="EV breaks even at ~10k miles"
            keyStatColour="emerald"
            sparkline={<FuelTypeSparkline />}
          />
        </StatsHubCategoryGroup>

        {/* ── Group 2: Vehicle Data ── */}
        <StatsHubCategoryGroup title="Vehicle Data">
          <StatsHubCard
            href="/stats/mot-pass-rates"
            icon="🔧"
            title="MOT Pass Rates"
            description="National first-time pass rates by make, plus the most common failure categories."
            keyStat="84.2% avg pass rate"
            keyStatColour="emerald"
            sparkline={<MotPassRatesSparkline />}
          />
          <StatsHubCard
            href="/stats/most-reliable-cars"
            icon="🏆"
            title="Most Reliable Cars"
            description="Rankings based on millions of real MOT test results — which models hold up best?"
            keyStat="Toyota tops the table"
            keyStatColour="emerald"
            sparkline={<ReliableCarsSparkline />}
          />
          <StatsHubCard
            href="/stats/uk-mileage"
            icon="🛣️"
            title="UK Mileage Trends"
            description="Average annual mileage over the decades, plus how mileage varies by vehicle age."
            keyStat="7,400 miles avg (2024)"
            keyStatColour="sky"
            sparkline={<MileageSparkline />}
          />
          <StatsHubCard
            href="/stats/popular-cars"
            icon="🚗"
            title="Most Popular Cars"
            description="The top makes and models on UK roads by fleet size, plus how best-sellers have changed."
            keyStat="Ford #1 for 40 years"
            keyStatColour="amber"
            sparkline={<PopularCarsSparkline />}
          />
        </StatsHubCategoryGroup>

        {/* ── Group 3: Market & Safety ── */}
        <StatsHubCategoryGroup title="Market &amp; Safety">
          <StatsHubCard
            href="/stats/ev-adoption"
            icon="⚡"
            title="EV Adoption"
            description="Electric vehicle fleet growth, new sales share, and regional EV density across the UK."
            keyStat="1.1M+ EVs on UK roads"
            keyStatColour="emerald"
            sparkline={<EvAdoptionSparkline />}
          />
          <StatsHubCard
            href="/stats/car-registrations"
            icon="📊"
            title="Car Registrations"
            description="Annual new car sales since 1990, with fuel type split showing the shift from diesel to electric."
            keyStat="2.69M peak (2016)"
            keyStatColour="sky"
            sparkline={<CarRegistrationsSparkline />}
          />
          <StatsHubCard
            href="/stats/car-theft"
            icon="🔒"
            title="Car Theft Statistics"
            description="The most stolen cars ranked by theft rate, plus national vehicle theft trends over time."
            keyStat="Rising since 2014"
            keyStatColour="red"
            sparkline={<CarTheftSparkline />}
          />
          <StatsHubCard
            href="/stats/road-safety"
            icon="🛡️"
            title="Road Safety"
            description="UK road fatalities since 1970, casualties by road user type, and key safety milestones."
            keyStat="-80% deaths since 1972"
            keyStatColour="emerald"
            sparkline={<RoadSafetySparkline />}
          />
        </StatsHubCategoryGroup>

        {/* ── Bottom CTA ── */}
        <section className="mt-14 rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-8 text-center">
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
