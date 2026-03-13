import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import FaqAccordion from "@/components/stats/FaqAccordion";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";

import FuelComparisonChart from "@/components/stats/FuelComparisonChart";

export const metadata: Metadata = {
  title: "Petrol vs Diesel vs Electric Running Costs 2025 | UK Comparison",
  description:
    "Compare annual running costs for petrol, diesel, hybrid and electric cars at any mileage. Interactive charts, per-mile costs and EV break-even calculator.",
  alternates: {
    canonical:
      "https://www.freeplatecheck.co.uk/stats/fuel-type-comparison",
  },
  openGraph: {
    title: "Petrol vs Diesel vs Electric Running Costs 2025",
    description:
      "Compare running costs by fuel type at any annual mileage.",
    url: "https://www.freeplatecheck.co.uk/stats/fuel-type-comparison",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
};

const faqItems = [
  {
    question: "Is an electric car really cheaper to run than petrol?",
    answer:
      "Yes, on a per-mile basis electric cars are significantly cheaper to run. At typical home electricity rates, an EV costs around 5p per mile compared to 16p for petrol. Even with higher purchase prices, most EV owners recoup the difference within 5-7 years depending on annual mileage. Higher-mileage drivers break even faster because the savings compound with every mile driven.",
  },
  {
    question: "Why is diesel more expensive per litre but cheaper per mile than petrol?",
    answer:
      "Diesel engines are more thermally efficient than petrol engines, meaning they extract more energy from each litre of fuel. A typical diesel car achieves 50-60 mpg compared to 35-45 mpg for an equivalent petrol model. This efficiency advantage more than offsets the higher pump price, resulting in a lower cost per mile of around 14p versus 16p for petrol.",
  },
  {
    question: "How do hybrid running costs compare to pure electric?",
    answer:
      "Hybrids sit between conventional and electric vehicles for running costs. A typical hybrid costs around 10.4p per mile, roughly double the 5p per mile of a pure EV. However, hybrids have a lower purchase price than EVs and don't require charging infrastructure, making them a practical middle ground for drivers who aren't ready to go fully electric or who regularly drive long distances.",
  },
  {
    question: "What is the total cost of ownership for an EV vs petrol car?",
    answer:
      "Total cost of ownership includes purchase price, fuel, insurance, maintenance, tax and depreciation. While EVs have higher upfront costs (typically £8,000-£12,000 more), they benefit from zero road tax, lower servicing costs (no oil changes, fewer brake replacements), and substantially cheaper fuel. Over a typical 5-year ownership period at average mileage, an EV can save £3,000-£6,000 compared to an equivalent petrol car.",
  },
  {
    question: "Should I buy a diesel car in 2025?",
    answer:
      "Diesel still makes financial sense for high-mileage drivers (over 15,000 miles per year) who need long range without stops, particularly those towing or driving larger vehicles. However, diesel faces growing restrictions: many cities have Clean Air Zones charging older diesels, resale values are declining, and new diesel car sales have dropped below 5% market share. For most buyers, a hybrid or EV is now the better long-term choice.",
  },
];

export default function FuelTypeComparisonPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Dataset",
              name: "Petrol vs Diesel vs Electric Running Costs 2025",
              description:
                "Compare annual running costs for petrol, diesel, hybrid and electric cars at any mileage. Interactive charts, per-mile costs and EV break-even calculator.",
              url: "https://www.freeplatecheck.co.uk/stats/fuel-type-comparison",
              license:
                "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
              creator: {
                "@type": "Organization",
                name: "Free Plate Check",
                url: "https://www.freeplatecheck.co.uk",
              },
              temporalCoverage: "2025",
              spatialCoverage: "United Kingdom",
              variableMeasured:
                "Per-mile and annual running costs in pence and GBP by fuel type",
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            },
          ]),
        }}
      />
      <StatsHeroSection
        title="Petrol vs Diesel vs Electric: Running Cost Comparison"
        subtitle="Interactive comparison of fuel costs by type and mileage. See which fuel type saves you the most money at your annual mileage."
        breadcrumb="Fuel Type Comparison"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-10">
          <StatCallout value="16p" label="Petrol per mile" color="amber" />
          <StatCallout value="14p" label="Diesel per mile" color="red" />
          <StatCallout value="10.4p" label="Hybrid per mile" color="sky" />
          <StatCallout value="5p" label="Electric per mile" color="emerald" />
        </div>

        {/* Chart */}
        <FuelComparisonChart />

        {/* Insight copy */}
        <div className="my-10 space-y-5 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            Understanding UK Fuel Type Running Costs
          </h2>

          <p>
            The cost of running a car varies enormously depending on its fuel
            type. At 2025 rates, a petrol car costs roughly 16p per mile in fuel
            alone, while a fully electric vehicle costs just 5p per mile when
            charged at home on a standard tariff. That difference may sound
            small, but over 10,000 miles a year it adds up to more than
            {"£"}1,100 in annual savings -- enough to cover a year of car
            insurance for many drivers.
          </p>

          <p>
            Diesel has traditionally been the choice for high-mileage drivers,
            and the numbers still support that logic. Despite costing more per
            litre at the pump, diesel engines squeeze more miles from each litre,
            bringing the per-mile cost down to around 14p. For drivers covering
            20,000 miles or more annually, diesel saves roughly {"£"}400
            over petrol each year. However, diesel&apos;s advantage is
            narrowing as pump prices converge and clean air zones penalise older
            diesel vehicles with daily charges of {"£"}12.50 or more.
          </p>

          <p>
            Hybrid vehicles occupy a useful middle ground. With a per-mile cost
            of around 10.4p, they offer meaningful savings over both petrol and
            diesel without the range anxiety or charging infrastructure
            requirements of pure electric cars. Plug-in hybrids can push this
            figure even lower for drivers who regularly charge at home and make
            mostly short journeys, though real-world economy depends heavily on
            how often the battery is topped up.
          </p>

          <h3 className="text-lg font-semibold text-gray-100 pt-2">
            When Does an EV Make Financial Sense?
          </h3>

          <p>
            The total cost of ownership (TCO) calculation goes well beyond fuel.
            Electric vehicles benefit from zero road tax (VED), lower servicing
            costs due to fewer moving parts, and reduced brake wear thanks to
            regenerative braking. Against this, EVs carry a purchase price
            premium of around {"£"}8,000 to {"£"}12,000 over an
            equivalent petrol car. Using a conservative {"£"}8,000 premium
            and fuel savings of 11p per mile, a driver covering 10,000 miles
            annually would break even in roughly 7.3 years. At 20,000 miles a
            year, that drops to under 4 years.
          </p>

          <p>
            The financial case for EVs strengthens further when you factor in
            off-peak electricity tariffs (some as low as 7p per kWh), salary
            sacrifice schemes that eliminate benefit-in-kind tax, and the
            growing network of free workplace chargers. For company car drivers,
            the 2% BIK rate on EVs versus 20-37% for petrol cars can save
            thousands per year in tax alone.
          </p>

          <h3 className="text-lg font-semibold text-gray-100 pt-2">
            The Decline of Diesel
          </h3>

          <p>
            Diesel&apos;s share of new car sales has fallen dramatically, from a
            peak of nearly 50% in 2012 to below 5% in 2025. The
            &ldquo;Dieselgate&rdquo; emissions scandal, tightening Euro emission
            standards, and the expansion of Clean Air Zones across UK cities have
            all contributed to a rapid shift away from diesel. Resale values for
            diesel cars have softened accordingly, adding depreciation as a
            hidden cost for current owners. While diesel remains a rational
            choice for a shrinking pool of use cases -- long-distance motorway
            driving, towing, and commercial vehicles -- the writing is on the
            wall for diesel as a mainstream passenger car fuel.
          </p>

          <p>
            For most UK drivers doing the national average of around 7,400 miles
            per year, the decision increasingly favours electrification. If an EV
            fits your budget and lifestyle, the running cost savings are
            substantial. If not, a hybrid offers a pragmatic stepping stone with
            noticeably lower fuel bills and emissions than either petrol or
            diesel.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <StatsCTA />

        {/* Related stats */}
        <StatsRelated exclude="fuel-type-comparison" />
      </div>
    </>
  );
}
