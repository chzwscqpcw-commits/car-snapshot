import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";

import CarRegistrationCharts from "@/components/stats/CarRegistrationCharts";

export const metadata: Metadata = {
  title: "UK New Car Registrations 2025 | Sales Statistics & Fuel Split",
  description:
    "Interactive charts showing UK new car registrations from 1990 to 2025, including annual sales trends and fuel type market share. Data sourced from the SMMT.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/car-registrations",
  },
  openGraph: {
    title: "UK New Car Registrations 2025 | Sales Statistics & Fuel Split",
    description:
      "Interactive charts showing UK new car registrations from 1990 to 2025, including annual sales trends and fuel type market share.",
    url: "https://www.freeplatecheck.co.uk/stats/car-registrations",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UK New Car Registrations 2025 | Sales Statistics & Fuel Split",
    description:
      "Interactive charts showing UK new car registrations from 1990 to 2025, with fuel type breakdown.",
  },
};

const faqItems = [
  {
    question: "How many new cars are registered in the UK each year?",
    answer:
      "In a typical year the UK registers between 1.6 and 2.7 million new cars. The market peaked at 2.69 million in 2016 before declining due to diesel uncertainty, Brexit-related caution and then COVID-19. By 2025, registrations have recovered to around 1.89 million, still below pre-pandemic levels but trending upward.",
  },
  {
    question: "What percentage of new cars are electric?",
    answer:
      "Battery electric vehicles (BEVs) accounted for approximately 22.8% of new UK registrations in 2025. When you include plug-in hybrids (7.8%) and conventional hybrids (31.5%), electrified powertrains now make up over 60% of new car sales. This is a dramatic shift from 2015 when BEVs represented just 1.1% of the market.",
  },
  {
    question: "Why did diesel car sales decline?",
    answer:
      "Diesel's share of new car registrations fell from nearly 48% in 2016 to around 7% in 2025. The decline began with the Volkswagen emissions scandal in 2015, accelerated by government policy shifts including higher VED rates for diesel, Clean Air Zone charges, and the announcement of the 2030 petrol and diesel ban. Many manufacturers have now stopped offering diesel variants of their mainstream models entirely.",
  },
  {
    question: "What is the ZEV mandate and how does it affect registrations?",
    answer:
      "The Zero Emission Vehicle (ZEV) mandate requires manufacturers to ensure that a rising percentage of their new car sales are zero-emission. Targets started at 22% in 2024 and will increase annually, reaching 80% by 2030 and 100% by 2035. Manufacturers that miss targets face fines of up to £15,000 per non-compliant vehicle, which is driving rapid growth in BEV offerings and marketing incentives.",
  },
  {
    question: "Where does UK car registration data come from?",
    answer:
      "The primary source is the Society of Motor Manufacturers and Traders (SMMT), which collects registration data directly from the DVLA. The SMMT publishes monthly and annual figures broken down by fuel type, body style, manufacturer and model. The Department for Transport (DfT) also publishes quarterly statistics in its VEH series, which includes both new registrations and the total licensed vehicle fleet.",
  },
];

export default function CarRegistrationsPage() {
  return (
    <>
      <StatsHeroSection
        title="UK New Car Registrations 1990–2025"
        subtitle="Explore how many new cars the UK buys each year and how the fuel type mix has shifted from petrol and diesel dominance toward electrified powertrains."
        breadcrumb="Car Registrations"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <StatCallout
            value="1.89M"
            label="2025 new registrations"
            color="emerald"
          />
          <StatCallout
            value="2.69M"
            label="Peak year (2016)"
            color="amber"
          />
          <StatCallout
            value="22.8%"
            label="BEV share in 2025"
            color="sky"
          />
        </div>

        {/* Charts */}
        <CarRegistrationCharts />

        {/* Insight copy */}
        <div className="prose-invert mt-10 max-w-none space-y-4 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            UK Car Registration Trends: From Peak Diesel to the Electric Mandate
          </h2>
          <p>
            The UK new car market has undergone a structural transformation over
            the past decade. Annual registrations climbed steadily through the
            early 2000s, driven by cheap PCP finance deals and a strong economy,
            before peaking at 2.69 million units in 2016. That year marked the
            high-water mark for both total volume and diesel&apos;s market
            share, which stood at nearly 48%.
          </p>
          <p>
            The Volkswagen emissions scandal, first exposed in September 2015,
            planted the seeds of diesel&apos;s decline. By 2017 the shift was
            unmistakable: diesel registrations fell by over five percentage
            points in a single year. Government policy amplified the trend, with
            higher first-year VED rates for diesel from April 2018, the
            expansion of Clean Air Zones across major cities, and the headline
            announcement that sales of new petrol and diesel cars would be
            banned from 2030.
          </p>
          <p>
            The COVID-19 pandemic added another shock, cutting 2020 registrations
            to just 1.63 million &mdash; the lowest figure since the early
            1990s. Showroom closures, supply chain disruptions and the global
            semiconductor shortage meant the market did not begin to recover
            until late 2022. Even now, registrations remain around 30% below
            the 2016 peak, partly because the second-hand market has absorbed
            some demand and leasing cycles have lengthened.
          </p>
          <p>
            While overall volumes have fallen, the fuel type composition has
            changed dramatically. Battery electric vehicles (BEVs) went from a
            niche 1.1% share in 2015 to 22.8% in 2025. Including plug-in
            hybrids and conventional hybrids, electrified powertrains now
            account for over 60% of new registrations. This acceleration is
            being driven by the Zero Emission Vehicle (ZEV) mandate, which
            requires manufacturers to hit escalating BEV sales targets or face
            fines of up to &pound;15,000 per non-compliant car.
          </p>
          <p>
            The mandate has produced visible market effects. Manufacturers are
            offering aggressive finance deals and cashback incentives on
            electric models to hit their quotas, making some EVs cheaper to
            lease than their petrol equivalents. At the same time, the rapid
            expansion of the public charging network &mdash; now exceeding
            70,000 charge points &mdash; has reduced one of the key barriers to
            adoption for buyers without home charging.
          </p>
          <p>
            Looking ahead, the trajectory is clear. The ZEV mandate targets rise
            to 80% by 2030 and 100% by 2035, which means petrol and diesel will
            continue to shrink as a proportion of new sales. The SMMT forecasts
            that total registrations will stabilise around 1.9&ndash;2.0 million
            per year through the mid-2020s, with growth in BEVs offsetting
            declines in internal combustion engines. For consumers, this means
            an ever-widening choice of electric models across all segments
            &mdash; from superminis to large SUVs &mdash; and continuing
            downward pressure on EV prices as battery costs fall and competition
            intensifies.
          </p>
          <p>
            The data on this page is sourced from the Society of Motor
            Manufacturers and Traders (SMMT), which publishes monthly and annual
            registration figures based on DVLA records. Fuel type breakdowns
            are available from 2015 onward, when the SMMT began separately
            reporting BEV, PHEV and hybrid categories.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <StatsCTA />

        {/* Related stats */}
        <StatsRelated exclude="car-registrations" />
      </div>
    </>
  );
}
