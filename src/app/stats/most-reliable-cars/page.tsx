import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";

import ReliabilityCharts from "@/components/stats/ReliabilityCharts";

export const metadata: Metadata = {
  title: "Most Reliable Cars in the UK 2025 | MOT Pass Rate Rankings",
  description:
    "See which UK cars are the most reliable based on millions of real MOT test results. Top 20 rankings, reliability by age, and sortable league tables.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/most-reliable-cars",
  },
  openGraph: {
    title: "Most Reliable Cars in the UK 2025 | MOT Pass Rate Rankings",
    description:
      "See which UK cars are the most reliable based on millions of real MOT test results.",
    url: "https://www.freeplatecheck.co.uk/stats/most-reliable-cars",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
};

const faqs = [
  {
    question: "How are the reliability rankings calculated?",
    answer:
      "Rankings are based on MOT pass rates drawn from real DVSA test data. We filter for models with at least 50,000 recorded MOT tests to ensure statistical significance, then sort by the percentage of vehicles that passed their MOT first time. This gives a robust, data-driven view of which cars are most likely to stay roadworthy year after year.",
  },
  {
    question: "Why do Japanese cars dominate the top of the table?",
    answer:
      "Japanese manufacturers like Toyota, Honda, Mazda and Suzuki have consistently invested in build quality, tight manufacturing tolerances and conservative engineering. Their engines and transmissions tend to be over-engineered for the loads they face in everyday driving, which means fewer mechanical failures as the car ages. This philosophy translates directly into higher MOT pass rates.",
  },
  {
    question: "Does a high MOT pass rate mean low running costs?",
    answer:
      "A high MOT pass rate is a strong indicator of mechanical reliability, which usually correlates with fewer unexpected repair bills. However, running costs also include fuel economy, insurance, road tax and depreciation. A reliable car can still be expensive to run if it has a large engine or high insurance group. Use our free vehicle check to get the full picture for any specific car.",
  },
  {
    question: "How does vehicle age affect MOT pass rates?",
    answer:
      "All cars become less likely to pass their MOT as they age. Wear items like tyres, brakes, suspension bushes and exhaust components degrade over time. The age-degradation chart on this page shows that even the most reliable models see their pass rate drop from the mid-90s to the low-70s over a 10-year period. The key difference is how quickly that decline happens -- reliable cars degrade more slowly.",
  },
  {
    question: "Can I check the MOT history of a specific car?",
    answer:
      "Yes. Enter any UK registration number on our homepage to instantly view the full MOT history for that vehicle, including every pass, fail, advisory and mileage reading. It is completely free and takes just a few seconds.",
  },
];

export default function MostReliableCarsPage() {
  return (
    <>
      <StatsHeroSection
        title="Most Reliable Cars in the UK 2025"
        subtitle="MOT pass rate rankings based on millions of real test results. Find out which models are built to last."
        breadcrumb="Most Reliable Cars"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <StatCallout
            value="85.1%"
            label="Top pass rate (Toyota C-HR / Ford Puma)"
            color="emerald"
          />
          <StatCallout
            value="78.5%"
            label="Lowest in top 20 (Nissan Qashqai)"
            color="amber"
          />
          <StatCallout
            value="~78%"
            label="National average MOT pass rate"
            color="sky"
          />
        </div>

        {/* Interactive charts + table */}
        <ReliabilityCharts />

        {/* Insight copy */}
        <article className="my-10 space-y-5 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            What Makes a Car Reliable?
          </h2>
          <p>
            Reliability is the single most important factor for the majority of
            UK car buyers, yet it is also one of the hardest qualities to assess
            before you buy. Manufacturer brochures talk about technology and
            performance, but they rarely mention how well a car will hold up
            after five, eight or ten years on British roads. That is where MOT
            data becomes invaluable. Every car over three years old in the UK
            must pass an annual MOT test, and the results of every test are
            recorded by the DVSA. By analysing millions of these results we can
            build an objective, data-driven picture of which makes and models
            are genuinely built to last.
          </p>
          <p>
            The rankings on this page filter for models with at least 50,000
            recorded MOT tests. This threshold ensures the data is
            statistically meaningful -- a model with only a few thousand tests
            could be skewed by a single batch of well-maintained fleet cars or
            an unusually young age profile. Once that filter is applied, the
            results paint a clear picture: Japanese and Korean manufacturers
            dominate the upper reaches of the table, with Toyota, Honda, Mazda,
            Suzuki, Hyundai and Kia all placing multiple models in the top 20.
          </p>
          <p>
            Toyota&apos;s reputation for bulletproof engineering is well earned.
            The Yaris, Corolla, Auris, C-HR and Aygo all sit comfortably above
            the 82% mark, with the C-HR matching the Ford Puma at 85.1%. What
            sets Toyota apart is the consistency across its entire range --
            there is no weak link. Honda follows a similar pattern; the Jazz,
            Civic and CR-V all score above 80%, reflecting the brand&apos;s
            long-standing focus on powertrain durability.
          </p>
          <p>
            Interestingly, the data also reveals that reliability is not
            solely a function of price. The Suzuki Swift and Dacia Sandero,
            both budget models, outperform several premium-brand cars. Equally,
            some expensive SUVs from Land Rover and Jaguar sit well below the
            national average. This suggests that engineering philosophy and
            manufacturing quality matter far more than badge prestige when it
            comes to long-term dependability.
          </p>
          <p>
            Our age-degradation chart highlights another crucial dimension.
            Every car&apos;s MOT pass rate declines as it ages, but the rate of
            decline varies significantly between models. The Toyota Yaris, for
            example, still maintains a pass rate above 70% at ten years old,
            while the Vauxhall Corsa has dropped to around 64% by the same
            age. For used-car buyers, this gap translates directly into fewer
            garage visits, lower repair bills and greater peace of mind.
          </p>
          <p>
            Several factors contribute to high pass rates. Simpler, proven
            powertrains tend to be more reliable than complex turbocharged or
            dual-clutch setups. Cars designed for high-mileage use -- such as
            Japanese kei-car-derived city cars -- often have overbuilt
            components that cope easily with UK driving conditions.
            Corrosion-resistant body panels and galvanised steel also play a
            role; cars that resist rust are far less likely to fail on
            structural MOT items.
          </p>
          <p>
            Maintenance history matters too. A well-serviced car of any make
            will outperform a neglected one. But the data here reflects the
            population average, which means it captures the typical ownership
            experience, not the best-case scenario. When a model ranks highly
            on a population basis, it usually means even average owners find it
            easy to keep roadworthy.
          </p>
          <p>
            Whether you are buying your first car or choosing your next family
            runabout, these rankings offer a practical, evidence-based starting
            point. Combine them with a free vehicle check on our homepage to
            see the full MOT history, tax status, mileage record and estimated
            valuation for any specific registration.
          </p>
        </article>

        {/* FAQ */}
        <FaqAccordion items={faqs} />

        {/* CTA */}
        <StatsCTA />

        {/* Related */}
        <StatsRelated exclude="most-reliable-cars" />
      </div>
    </>
  );
}
