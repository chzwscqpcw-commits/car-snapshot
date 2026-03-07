import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";

import EvAdoptionCharts from "@/components/stats/EvAdoptionCharts";

export const metadata: Metadata = {
  title: "UK Electric Vehicle Adoption 2025 | EV Growth Statistics",
  description:
    "Interactive charts tracking UK EV fleet growth, BEV sales share and regional adoption density. Data from DfT and SMMT covering 2010-2025.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/ev-adoption",
  },
  openGraph: {
    title: "UK Electric Vehicle Adoption 2025 | EV Growth Statistics",
    description:
      "Interactive charts tracking UK EV fleet growth, BEV sales share and regional adoption density.",
    url: "https://www.freeplatecheck.co.uk/stats/ev-adoption",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UK Electric Vehicle Adoption 2025 | EV Growth Statistics",
    description:
      "Interactive charts tracking UK EV fleet growth, BEV sales share and regional adoption density.",
  },
};

const faqItems = [
  {
    question: "How many electric cars are there in the UK?",
    answer:
      "As of Q4 2025, there are approximately 1.58 million battery electric vehicles (BEVs) registered in the UK, alongside around 500,000 plug-in hybrids and 1.31 million conventional hybrids. The total electrified fleet (all three categories combined) stands at roughly 3.39 million vehicles, representing about 9% of all cars on UK roads.",
  },
  {
    question: "What is the average range of an electric car in 2025?",
    answer:
      "The average real-world range of a new BEV sold in the UK in 2025 is around 250-280 miles on a full charge. Premium models like the Mercedes EQS and BMW iX can exceed 350 miles, while more affordable options like the MG4 and BYD Atto 3 typically deliver 250-300 miles. Real-world range can drop by 15-25% in cold winter conditions due to battery chemistry and cabin heating demands.",
  },
  {
    question: "How long does it take to charge an electric car?",
    answer:
      "Charging time depends on the charger type and battery size. A typical 60kWh EV takes around 8 hours on a 7kW home wallbox (empty to full), roughly 30-40 minutes on a 50kW public rapid charger (20-80%), or as little as 15-20 minutes on a 150kW+ ultra-rapid charger (20-80%). Most EV owners charge at home overnight, treating it much like charging a phone.",
  },
  {
    question: "Are there still government grants for electric cars?",
    answer:
      "The UK Plug-in Car Grant ended in June 2022, but several incentives remain. EVs are exempt from Vehicle Excise Duty (VED) until April 2025, after which they pay a reduced first-year rate. Company car drivers benefit from a Benefit-in-Kind (BiK) rate of just 2% for BEVs (rising to 3% in 2025/26 and 4% in 2026/27). The OZEV Workplace Charging Scheme and EV Chargepoint Grant for renters and flat owners are still available.",
  },
  {
    question: "Which UK regions have the most electric cars?",
    answer:
      "London leads EV adoption with approximately 28.5 EVs per 1,000 people, followed by the South East (24.2) and East of England (21.3). Northern Ireland has the lowest density at 8.3 per 1,000. The disparity is driven by factors including income levels, charging infrastructure availability, the London ULEZ, and the proportion of households with off-street parking for home charging.",
  },
];

export default function EvAdoptionPage() {
  return (
    <>
      <StatsHeroSection
        title="UK Electric Vehicle Adoption 2025"
        subtitle="Track the growth of battery electric, plug-in hybrid and conventional hybrid vehicles on UK roads. Explore fleet size, new sales share and regional EV density."
        breadcrumb="EV Adoption"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <StatCallout
            value="1.58M"
            label="Total BEV fleet (Q4 2025)"
            color="emerald"
          />
          <StatCallout
            value="22.8%"
            label="BEV share of new sales"
            color="amber"
          />
          <StatCallout
            value="+16.3%"
            label="Sales share YoY growth"
            color="sky"
          />
        </div>

        {/* Charts */}
        <EvAdoptionCharts />

        {/* Insight copy */}
        <div className="prose-invert mt-10 max-w-none space-y-4 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            The UK&apos;s Electric Vehicle Transition
          </h2>
          <p>
            The UK&apos;s shift toward electric motoring has accelerated
            dramatically over the past five years. From a standing start of
            just 1,100 battery electric vehicles on the road in 2010, the
            BEV fleet has grown to 1.58 million by the end of 2025 — a
            compound annual growth rate of over 60%. This trajectory places
            the UK among the fastest-adopting EV markets in Europe, behind
            only Norway and the Netherlands in per-capita terms.
          </p>
          <p>
            The inflection point came in 2020, when BEV sales surged from
            3.1% to 6.6% of new registrations in a single year. The
            COVID-19 pandemic, rather than slowing adoption, appeared to
            accelerate it. Buyers who deferred purchases returned to a
            market with a wider choice of compelling electric models, from
            the affordable MG ZS EV and Vauxhall Corsa-e to the premium
            Tesla Model 3 and Hyundai Ioniq 5. The combination of
            improving range, falling battery costs and generous company car
            tax incentives created a perfect storm for fleet and private
            buyers alike.
          </p>
          <p>
            Government policy has played a central role. The Zero Emission
            Vehicle (ZEV) mandate, introduced in January 2024, requires
            manufacturers to ensure that a rising proportion of new car
            sales are zero-emission — starting at 22% in 2024 and climbing
            to 80% by 2030. Non-compliant manufacturers face fines of up
            to £15,000 per vehicle, creating a strong incentive to push
            EV models. This regulatory framework, combined with the 2030
            ban on new petrol and diesel car sales (with hybrids allowed
            until 2035), has given both industry and consumers a clear
            signal of the direction of travel.
          </p>
          <p>
            Charging infrastructure remains the most frequently cited
            barrier to adoption. The UK had approximately 70,000 public
            charge points by mid-2025, of which around 15,000 were rapid
            or ultra-rapid (50kW and above). While this represents a
            threefold increase since 2022, distribution is uneven.
            London alone accounts for roughly 20% of all public chargers,
            while rural areas and parts of the North and Midlands have
            significantly fewer per capita. The government&apos;s target
            of 300,000 public charge points by 2030 will require
            continued investment from both the public and private sectors.
          </p>
          <p>
            Regional disparities in EV adoption reflect a combination of
            economic and practical factors. London&apos;s high EV density
            (28.5 per 1,000 people) is boosted by the Ultra Low Emission
            Zone, which charges non-compliant vehicles £12.50 per day,
            and by higher average incomes. In contrast, areas with lower
            household incomes, fewer off-street parking spaces, and less
            developed charging networks lag behind. Northern Ireland, at
            just 8.3 EVs per 1,000, faces the additional challenge of a
            land border with the Republic of Ireland and distinct
            regulatory arrangements.
          </p>
          <p>
            Looking ahead, most industry forecasts expect BEV sales to
            account for 30-35% of new registrations by the end of 2026,
            driven by a wave of more affordable models entering the
            market below £25,000. The arrival of Chinese manufacturers
            such as BYD, GWM Ora and XPENG is intensifying competition
            and putting downward pressure on prices. Meanwhile, the
            second-hand EV market is maturing rapidly, with three-year-old
            models now available from around £15,000 — making electric
            ownership accessible to a far wider section of the population
            than even two years ago.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <StatsCTA />

        {/* Related stats */}
        <StatsRelated exclude="ev-adoption" />
      </div>
    </>
  );
}
