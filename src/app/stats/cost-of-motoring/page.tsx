import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import FaqAccordion from "@/components/stats/FaqAccordion";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";

import CostOfMotoringChart from "@/components/stats/CostOfMotoringChart";

export const metadata: Metadata = {
  title: "Cost of Motoring UK 2025 | Annual Running Cost Breakdown",
  description:
    "Full annual breakdown of UK motoring costs including fuel, insurance, depreciation, road tax and servicing. Interactive calculator to estimate your own running costs.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/cost-of-motoring",
  },
  openGraph: {
    title: "Cost of Motoring UK 2025 | Annual Running Cost Breakdown",
    description:
      "Full annual breakdown of fuel, insurance, depreciation, tax and servicing costs for UK motorists.",
    url: "https://www.freeplatecheck.co.uk/stats/cost-of-motoring",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
};

const faqItems = [
  {
    question: "How much does it cost to run a car in the UK per year?",
    answer:
      "The average annual cost of running a car in the UK in 2025 is approximately £6,980. This includes fuel (£2,180), insurance (£1,120), depreciation (£2,550), road tax/VED (£270) and servicing and repairs (£860). Actual costs vary significantly depending on vehicle age, mileage, fuel type and where you live.",
  },
  {
    question: "What is the biggest cost of owning a car?",
    answer:
      "Depreciation is consistently the single largest cost of car ownership, accounting for roughly 37% of the total annual running cost. A typical car loses between 15–20% of its value each year in the first few years, with the steepest drop occurring in the first twelve months. Buying a car that is two or three years old is one of the most effective ways to reduce this cost.",
  },
  {
    question: "Why has car insurance gone up so much?",
    answer:
      "UK car insurance premiums have risen sharply since 2022, driven by several factors: higher repair costs due to parts inflation and supply-chain disruption, increased labour rates at bodyshops, more expensive technology in modern vehicles (cameras, sensors, ADAS systems), and rising personal injury claim values. Younger drivers and urban areas have seen the steepest increases.",
  },
  {
    question: "Are electric cars cheaper to run than petrol?",
    answer:
      "Electric vehicles are significantly cheaper to fuel — typically costing around 5p per mile compared to 14–16p for petrol or diesel. Servicing costs are also lower because EVs have fewer moving parts and do not need oil changes. However, EVs tend to have higher insurance premiums and steeper initial depreciation. Over a five-year ownership period, an EV can save £2,000–£4,000 in running costs compared to an equivalent petrol car.",
  },
  {
    question: "How can I reduce my annual motoring costs?",
    answer:
      "There are several practical ways to cut your running costs. Buy a two or three year old car to avoid the worst depreciation. Shop around for insurance each year rather than auto-renewing. Drive smoothly and keep tyres correctly inflated to improve fuel economy. Consider a telematics policy if you are a low-mileage driver. Service your car on schedule to prevent expensive repairs. Finally, compare fuel prices locally — supermarket stations are often 3–5p per litre cheaper than branded forecourts.",
  },
];

export default function CostOfMotoringPage() {
  return (
    <>
      <StatsHeroSection
        title="Cost of Motoring UK 2025"
        subtitle="Full annual breakdown of what it really costs to own and run a car in the UK — from fuel and insurance to depreciation and road tax."
        breadcrumb="Cost of Motoring"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat Callouts */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
          <StatCallout
            value="£6,980"
            label="Avg. annual cost (2025)"
            color="emerald"
          />
          <StatCallout
            value="£2,180"
            label="Avg. fuel cost"
            color="amber"
          />
          <StatCallout
            value="£1,120"
            label="Avg. insurance"
            color="red"
          />
          <StatCallout
            value="£2,550"
            label="Avg. depreciation"
            color="sky"
          />
        </div>

        {/* Chart */}
        <CostOfMotoringChart />

        {/* Insight copy */}
        <article className="prose prose-invert mt-10 max-w-none text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            The Rising Cost of Motoring in 2025
          </h2>
          <p>
            Running a car in the UK has never been cheap, but the total cost of
            motoring has climbed steadily over the past decade. The average
            motorist now spends around <strong>&pound;6,980 per year</strong> to
            keep their car on the road &mdash; roughly &pound;580 per month or
            &pound;134 per week. That figure encompasses fuel, insurance,
            depreciation, VED (road tax) and routine servicing.
          </p>

          <h3 className="text-lg font-semibold text-gray-100 mt-6">
            Depreciation: the hidden heavyweight
          </h3>
          <p>
            Depreciation remains the single largest expense for most car owners,
            accounting for approximately 37% of total running costs. A brand-new
            car typically loses 15&ndash;35% of its value in the first year
            alone, and a further 50&ndash;60% over three years. The used car
            market correction that followed the post-COVID price spike has
            normalised somewhat, but average depreciation in 2025 still sits
            at around &pound;2,550 per year for a mid-range vehicle. Buyers who
            choose a car that is two to three years old can avoid the worst of
            this initial hit.
          </p>

          <h3 className="text-lg font-semibold text-gray-100 mt-6">
            Insurance premiums continue to climb
          </h3>
          <p>
            Car insurance has been the fastest-rising component of motoring costs
            since 2022. The average comprehensive premium in 2025 stands at
            around &pound;1,120 &mdash; up 44% compared to the &pound;780
            motorists were paying just five years earlier. Several structural
            factors are behind the increase: vehicle repair costs have surged
            because of parts inflation and the growing complexity of modern
            cars. Advanced driver-assistance systems (ADAS), such as cameras
            and parking sensors, make even minor bumper repairs significantly
            more expensive. At the same time, personal injury claim values have
            risen, pushing up the overall claims pool.
          </p>

          <h3 className="text-lg font-semibold text-gray-100 mt-6">
            Fuel costs: lower than the 2022 peak but still elevated
          </h3>
          <p>
            After reaching record highs in 2022 when petrol briefly topped
            190p per litre, pump prices have retreated but remain well above
            pre-pandemic levels. The average UK motorist covering 10,000 miles
            per year now spends approximately &pound;2,180 on fuel. Electric
            vehicle owners enjoy substantially lower energy costs &mdash;
            typically around &pound;500 per year &mdash; though higher insurance
            and purchase prices partially offset this saving.
          </p>

          <h3 className="text-lg font-semibold text-gray-100 mt-6">
            VED and servicing
          </h3>
          <p>
            Vehicle Excise Duty (VED) and servicing make up a smaller but still
            meaningful share of the total. Standard-rate VED for most petrol and
            diesel cars is &pound;190 per year, with first-year rates varying by
            CO2 emissions. From April 2025, zero-emission vehicles will begin
            paying VED for the first time, albeit at a reduced rate. Servicing
            and repair costs have nudged upward in line with wage inflation in
            the motor trade, averaging around &pound;860 per year.
          </p>

          <h3 className="text-lg font-semibold text-gray-100 mt-6">
            Tips to reduce your motoring costs
          </h3>
          <p>
            While some costs are difficult to avoid, there are practical steps
            every driver can take. Buying a car that is two to three years old
            significantly reduces depreciation. Shopping around for insurance
            each renewal &mdash; rather than auto-renewing &mdash; can save
            &pound;200&ndash;&pound;400. Maintaining correct tyre pressures and
            adopting a smooth driving style can improve fuel economy by
            10&ndash;15%. Finally, sticking to the manufacturer&rsquo;s service
            schedule helps prevent small issues from becoming expensive repairs.
            Use the calculator above to estimate your own annual costs based on
            your mileage, fuel type, vehicle value and location.
          </p>
        </article>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <StatsCTA />

        {/* Related stats */}
        <StatsRelated exclude="cost-of-motoring" />
      </div>
    </>
  );
}
