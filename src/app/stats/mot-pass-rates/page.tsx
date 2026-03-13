import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import FaqAccordion from "@/components/stats/FaqAccordion";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";
import passRateData from "@/data/mot-pass-rates.json";

import MotPassRateCharts from "@/components/stats/MotPassRateCharts";

export const metadata: Metadata = {
  title: "MOT Pass Rates by Make & Model 2025 | UK Statistics",
  description:
    "Interactive UK MOT pass rate statistics by make and model. See national averages, top failure reasons, and find out how your car compares — based on millions of real MOT tests.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/mot-pass-rates",
  },
  openGraph: {
    title: "MOT Pass Rates by Make & Model 2025 | UK Statistics",
    description:
      "National pass rates and top failure reasons — interactive UK MOT statistics based on millions of tests.",
    url: "https://www.freeplatecheck.co.uk/stats/mot-pass-rates",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
};

/* ---------- compute callout stats from data ---------- */
const passRates = passRateData as unknown as Record<string, [number, number]>;

function computeStats() {
  const makeMap = new Map<string, { total: number; weighted: number }>();
  let totalTests = 0;
  let totalWeighted = 0;

  for (const [key, [count, rate]] of Object.entries(passRates)) {
    const make = key.split("|")[0];
    totalTests += count;
    totalWeighted += count * rate;

    const existing = makeMap.get(make) ?? { total: 0, weighted: 0 };
    existing.total += count;
    existing.weighted += count * rate;
    makeMap.set(make, existing);
  }

  const nationalAvg = parseFloat((totalWeighted / totalTests).toFixed(1));

  let bestMake = "";
  let bestRate = 0;
  let worstMake = "";
  let worstRate = 100;

  for (const [make, { total, weighted }] of makeMap.entries()) {
    const rate = weighted / total;
    if (rate > bestRate) {
      bestRate = rate;
      bestMake = make;
    }
    if (rate < worstRate) {
      worstRate = rate;
      worstMake = make;
    }
  }

  return {
    nationalAvg,
    totalTests,
    bestMake,
    bestRate: parseFloat(bestRate.toFixed(1)),
    worstMake,
    worstRate: parseFloat(worstRate.toFixed(1)),
  };
}

const stats = computeStats();

const faqItems = [
  {
    question: "What is the national MOT pass rate in the UK?",
    answer: `The national average MOT first-time pass rate is approximately ${stats.nationalAvg}%, based on data from the 2024/25 DVSA test year. This means roughly 1 in 5 vehicles fails its MOT on the first attempt. Pass rates vary significantly by make, model and vehicle age.`,
  },
  {
    question: "Which car make has the highest MOT pass rate?",
    answer: `${stats.bestMake} currently leads with an average pass rate of ${stats.bestRate}% across all its models. Japanese and Korean manufacturers generally perform well in MOT testing due to their reputation for reliability and build quality.`,
  },
  {
    question: "What are the most common MOT failure reasons?",
    answer:
      "The most common MOT failure categories are lighting (bulbs, alignment), suspension (worn bushes, springs, shock absorbers), brakes (discs, pads, pipes), tyres (tread depth, condition, pressure) and exhaust emissions. Many of these are relatively inexpensive to fix and could be caught with a pre-MOT check.",
  },
  {
    question: "How are MOT pass rates calculated?",
    answer:
      "Pass rates are calculated from real MOT test results recorded by the DVSA (Driver and Vehicle Standards Agency). The rate represents the percentage of vehicles that pass their MOT on the first attempt within a given test year, without requiring any repair and retest.",
  },
  {
    question: "Does my car's age affect its MOT pass rate?",
    answer:
      "Yes, vehicle age has a significant impact on MOT pass rates. Newer vehicles (3-5 years old) typically have much higher pass rates than older vehicles. Wear and tear on suspension, brakes and other components increases with age and mileage, leading to more failures.",
  },
  {
    question: "Can I check the MOT history for a specific vehicle?",
    answer:
      "Yes. You can enter any UK registration plate on Free Plate Check to see the full MOT history for that specific vehicle, including previous test results, advisories, failure reasons, and recorded mileage at each test. This gives you a much more detailed picture than make-level averages.",
  },
];

export default function MotPassRatesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Dataset",
              name: "MOT Pass Rates by Make & Model 2025",
              description:
                "Interactive UK MOT pass rate statistics by make and model. See national averages, top failure reasons, and find out how your car compares — based on millions of real MOT tests.",
              url: "https://www.freeplatecheck.co.uk/stats/mot-pass-rates",
              license:
                "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
              creator: {
                "@type": "Organization",
                name: "Free Plate Check",
                url: "https://www.freeplatecheck.co.uk",
              },
              temporalCoverage: "2024/2025",
              spatialCoverage: "United Kingdom",
              variableMeasured:
                "MOT first-time pass rate percentage by vehicle make and model",
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
        title="MOT Pass Rates by Make & Model"
        subtitle="How likely is your car to pass its MOT? Explore national pass rates, failure reasons and make-by-make comparisons based on millions of real DVSA test results."
        breadcrumb="MOT Pass Rates"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCallout
            value={`${stats.nationalAvg}%`}
            label="National avg pass rate"
            color="emerald"
          />
          <StatCallout
            value={`${(stats.totalTests / 1_000_000).toFixed(1)}m`}
            label="Total tests analysed"
            color="sky"
          />
          <StatCallout
            value={stats.bestMake}
            label={`Best make (${stats.bestRate}%)`}
            color="emerald"
          />
          <StatCallout
            value={stats.worstMake}
            label={`Worst make (${stats.worstRate}%)`}
            color="red"
          />
        </div>

        {/* Charts */}
        <MotPassRateCharts />

        {/* Insight copy */}
        <div className="my-10 space-y-4 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            Understanding UK MOT Pass Rates
          </h2>
          <p>
            Every vehicle over three years old in the UK must pass an annual MOT
            test to confirm it meets minimum road safety and environmental
            standards. The test covers everything from lights and brakes to
            exhaust emissions and structural integrity. With over{" "}
            {(stats.totalTests / 1_000_000).toFixed(0)} million tests carried
            out each year, the data paints a clear picture of which cars hold up
            best over time and which areas cause the most problems.
          </p>
          <p>
            The national first-time pass rate sits at around {stats.nationalAvg}
            %, meaning roughly one in five vehicles fails its MOT on the first
            attempt. That figure might sound high, but many failures are for
            relatively minor issues: a blown bulb, worn wiper blade, or a tyre
            just below the legal tread depth. These are cheap and quick to fix,
            which is why the retest pass rate is significantly higher.
          </p>
          <p>
            Japanese and Korean manufacturers consistently top the reliability
            charts. Brands like Toyota, Honda, Hyundai and Kia regularly achieve
            pass rates above 80%, reflecting their engineering focus on
            durability and lower maintenance costs. At the other end, vehicles
            that are typically higher-mileage or used commercially, such as
            vans and larger SUVs, tend to have lower pass rates due to harder
            working lives.
          </p>
          <p>
            Suspension is the single most common failure category, accounting
            for the largest share of MOT failures across all makes. This
            includes worn bushes, damaged springs, leaking shock absorbers and
            corroded components. Brakes come a close second, with worn pads,
            scored discs, and corroded brake lines being frequent issues,
            particularly on older vehicles.
          </p>
          <p>
            Lighting failures remain extremely common and are among the easiest
            to prevent. A quick walk-around check before your MOT can catch
            blown bulbs, cracked lenses or misaligned headlamps. Similarly, tyre
            issues, including tread depth below the 1.6mm legal minimum and
            sidewall damage, are a major contributor to first-time failures.
          </p>
          <p>
            Electric vehicles are beginning to show notably higher pass rates
            than their petrol and diesel counterparts. With fewer mechanical
            components, no exhaust system and regenerative braking that reduces
            pad wear, EVs like the Tesla Model 3 and Nissan Leaf consistently
            achieve pass rates above 84%. As the EV fleet grows, this trend is
            expected to push the national average upward.
          </p>
          <p>
            If you want to maximise your chances of passing first time, a
            pre-MOT inspection can make a real difference. Focus on the
            big-ticket items: check all lights, inspect tyre condition and
            tread, test your brakes, and listen for suspension knocks. Many
            garages offer a free or low-cost pre-MOT check that can save you the
            cost and inconvenience of a failure and retest.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* Bottom CTA */}
        <StatsCTA />

        {/* Related stats */}
        <StatsRelated exclude="mot-pass-rates" />
      </div>
    </>
  );
}
