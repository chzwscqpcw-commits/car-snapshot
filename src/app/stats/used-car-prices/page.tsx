import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import FaqAccordion from "@/components/stats/FaqAccordion";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";

import UsedCarPriceChart from "@/components/stats/UsedCarPriceChart";

export const metadata: Metadata = {
  title: "Used Car Prices UK 2025 | Market Index & Depreciation Trends",
  description:
    "Track UK used car prices with our quarterly market index, interactive depreciation calculator and expert analysis of COVID-era price spikes and the ongoing market correction.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/used-car-prices",
  },
  openGraph: {
    title: "Used Car Prices UK 2025 | Market Index & Depreciation Trends",
    description:
      "Quarterly price index, depreciation calculator and market trend analysis for UK used cars.",
    url: "https://www.freeplatecheck.co.uk/stats/used-car-prices",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
};

const peakIndex = 145.8;
const currentIndex = 113.2;
const percentBelowPeak = (((peakIndex - currentIndex) / peakIndex) * 100).toFixed(1);

const faqItems = [
  {
    question: "When is the best time to buy a used car in the UK?",
    answer:
      "Historically, late autumn and early winter (October to December) tend to offer the best used car prices. Demand drops as buyers prioritise Christmas spending, and dealers are keen to clear stock before year-end. March and September also see increased part-exchange supply as new registration plates launch, pushing more stock into the used market.",
  },
  {
    question: "Will used car prices drop further in 2025?",
    answer:
      "Industry forecasts suggest prices will continue to soften gradually through 2025 as new car supply normalises and the post-COVID demand surge fully unwinds. However, a sharp crash is unlikely. Strong demand for affordable transport, combined with fewer new cars entering the market during 2020-2022, means used stock remains relatively tight for certain age groups.",
  },
  {
    question: "Why did used car prices spike so dramatically in 2021-2022?",
    answer:
      "A perfect storm of factors drove prices up: COVID-19 lockdowns paused new car production, a global semiconductor shortage severely restricted new vehicle supply, and consumer demand surged as people avoided public transport. With fewer new cars available, buyers turned to the used market, pushing the price index to a peak of 145.8 in Q2 2022 — nearly 46% above pre-pandemic levels.",
  },
  {
    question: "How quickly do cars depreciate on average?",
    answer:
      "The steepest depreciation occurs in the first three years. A new car typically loses around 28% of its value after one year, 42% after two years, and 53% after three years. After five years the rate slows considerably. Economy cars tend to depreciate faster, while premium and luxury marques with strong brand loyalty often retain value better.",
  },
  {
    question: "How can I check if a used car is priced fairly?",
    answer:
      "Use our free plate check tool to get an instant valuation estimate alongside MOT history, mileage verification, tax status and more. Compare the asking price against our depreciation calculator and similar listings on major classifieds. Key factors that affect fair value include mileage, service history completeness, number of previous owners, and overall condition.",
  },
];

export default function UsedCarPricesPage() {
  return (
    <>
      <StatsHeroSection
        title="Used Car Prices UK 2025"
        subtitle="Quarterly market index tracking used car values since 2019, with an interactive depreciation calculator and expert analysis of pricing trends."
        breadcrumb="Used Car Prices"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat Callouts */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCallout
            value={currentIndex.toString()}
            label="Current Price Index (Q1 2025)"
            color="emerald"
          />
          <StatCallout
            value={peakIndex.toString()}
            label="Peak Index (Q2 2022)"
            color="amber"
          />
          <StatCallout
            value={`${percentBelowPeak}%`}
            label="Below Peak"
            color="red"
          />
        </div>

        {/* Interactive Charts */}
        <UsedCarPriceChart />

        {/* Insight Copy */}
        <div className="my-10 space-y-5 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            Understanding the UK Used Car Market
          </h2>

          <p>
            The UK used car market has experienced unprecedented volatility over
            the past five years. Our price index, benchmarked to Q1 2019 as a
            baseline of 100, tells a story of disruption, excess demand, and a
            market slowly finding its footing again. Before the pandemic, used
            car values had been gently declining as they traditionally do,
            sitting around 97-98 by late 2019. That gentle erosion was about to
            give way to a shock nobody predicted.
          </p>

          <h3 className="text-base font-semibold text-gray-200">
            The COVID Effect and Semiconductor Shortage
          </h3>

          <p>
            When COVID-19 lockdowns hit in Q2 2020, the index briefly dipped to
            91.5 as showrooms closed and consumer confidence collapsed. But the
            recovery was swift and dramatic. A confluence of factors created the
            perfect conditions for a price surge: factory shutdowns slashed new
            car production, a global semiconductor shortage meant manufacturers
            could not keep up even when demand returned, and buyers who had
            accumulated lockdown savings flooded back into the market. By Q3
            2020, the index had already climbed above its pre-pandemic level.
          </p>

          <p>
            The upward trajectory accelerated through 2021 as the chip shortage
            intensified. New car waiting lists stretched from weeks to months,
            and in some cases over a year. Desperate buyers turned to the used
            market, where supply was equally constrained — fewer part-exchanges
            were feeding through because fewer new cars were being sold. The
            result was a bidding war that pushed the index to 132.5 by Q3 2021,
            with some models actually appreciating above their original list
            price — an almost unheard-of phenomenon in the automotive world.
          </p>

          <h3 className="text-base font-semibold text-gray-200">
            Peak Prices and the Correction
          </h3>

          <p>
            The market peaked in Q2 2022 at an index of 145.8, meaning used cars
            were on average nearly 46% more expensive than they had been just
            three years earlier. Since then, a steady correction has been
            underway. New car supply has gradually improved as semiconductor
            production ramped up and manufacturers cleared their order backlogs.
            Rising interest rates and cost-of-living pressures have also cooled
            demand, with some buyers delaying purchases or opting for cheaper
            alternatives.
          </p>

          <p>
            By Q1 2025, the index has settled at 113.2 — still 13% above
            pre-pandemic levels but {percentBelowPeak}% below the peak. This
            suggests the market has corrected roughly three-quarters of the
            COVID-era price inflation. Analysts expect further gradual softening
            through 2025, though a return to pre-pandemic price levels appears
            unlikely in the near term. The years of reduced new car production
            mean there is a genuine gap in the supply pipeline for 2-4 year old
            used cars, which continues to support values in that age bracket.
          </p>

          <h3 className="text-base font-semibold text-gray-200">
            What This Means for Buyers and Sellers
          </h3>

          <p>
            For buyers, the market is moving in a favourable direction. Patience
            is being rewarded as each quarter brings marginally lower prices. The
            sweet spot for value remains cars aged 3-5 years, where the steepest
            depreciation has already occurred but the vehicle still has years of
            reliable service ahead. For sellers, the window of inflated
            trade-in values is closing, making it worth considering whether to
            sell sooner rather than later if you are planning to change vehicles.
            Use our free plate check and valuation tool to see exactly where your
            vehicle sits in the current market.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <StatsCTA />

        {/* Related Stats */}
        <StatsRelated exclude="used-car-prices" />
      </div>
    </>
  );
}
