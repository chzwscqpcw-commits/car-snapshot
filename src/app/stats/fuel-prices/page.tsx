import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import ConversionWidget from "@/components/stats/ConversionWidget";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";
import { latestWeek, weeklyData } from "@/lib/stats-data/fuel-prices";

import FuelPriceChart from "@/components/stats/FuelPriceChart";

// Year-on-year diesel change
const oneYearAgo = weeklyData.find((w) => {
  const d = new Date(w.date);
  const target = new Date(latestWeek.date);
  target.setFullYear(target.getFullYear() - 1);
  return Math.abs(d.getTime() - target.getTime()) < 8 * 24 * 60 * 60 * 1000;
});
const dieselYoY = oneYearAgo
  ? ((latestWeek.diesel - oneYearAgo.diesel) / oneYearAgo.diesel * 100).toFixed(0)
  : null;

export const metadata: Metadata = {
  title: `UK Fuel Prices — Petrol ${latestWeek.petrol}p, Diesel ${latestWeek.diesel}p | Weekly Data`,
  description:
    `Live UK petrol (${latestWeek.petrol}p) and diesel (${latestWeek.diesel}p) prices updated weekly from DESNZ. Interactive chart from 2003 to today with fill-cost calculator and event annotations.`,
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/fuel-prices",
  },
  openGraph: {
    title: `UK Fuel Prices — Petrol ${latestWeek.petrol}p, Diesel ${latestWeek.diesel}p | Weekly Data`,
    description:
      `Live UK petrol and diesel prices updated weekly. Diesel ${dieselYoY ? `up ${dieselYoY}% year-on-year` : "surging in 2026"}. Interactive chart with fill-cost calculator.`,
    url: "https://www.freeplatecheck.co.uk/stats/fuel-prices",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `UK Fuel Prices — Petrol ${latestWeek.petrol}p, Diesel ${latestWeek.diesel}p`,
    description:
      `Live weekly UK petrol and diesel prices. Diesel ${dieselYoY ? `up ${dieselYoY}% vs last year` : "surging"}.`,
  },
};

// Compute dynamic callout values at build time
const dieselPeak = 180.3; // 2022 annual average peak
const dieselChangeFromPeak = (
  ((latestWeek.diesel - dieselPeak) / dieselPeak) *
  100
).toFixed(1);
const fillCost50L = ((latestWeek.petrol / 100) * 50).toFixed(0);

const faqItems = [
  {
    question: "What is the average price of petrol in the UK right now?",
    answer: `As of ${latestWeek.date}, the average UK unleaded petrol price is ${latestWeek.petrol}p per litre and diesel is ${latestWeek.diesel}p per litre. These figures are updated weekly from official DESNZ data. Prices remain above pre-pandemic levels of around 125p but have fluctuated sharply in 2026 due to Middle East tensions affecting global oil supply.`,
  },
  {
    question: "Why is diesel more expensive than petrol?",
    answer:
      "Diesel has been consistently more expensive than petrol in the UK since around 2004. This is partly because diesel requires more refining, European demand for diesel is higher (pushing up wholesale costs), and duty rates have historically been the same despite higher production costs. The gap widened sharply during the 2022 energy crisis and has widened again in early 2026.",
  },
  {
    question: "When were UK fuel prices at their highest?",
    answer:
      "UK fuel prices hit record highs in 2022 following Russia's invasion of Ukraine. The annual average reached 165.6p for petrol and 180.3p for diesel, with daily peaks exceeding 190p at some forecourts. Before that, the previous highs were in 2012 at around 134-141p per litre.",
  },
  {
    question: "How much does it cost to fill a typical car?",
    answer: `At current prices of around ${Math.round(latestWeek.petrol)}p per litre, filling a typical 50-litre family car tank with petrol costs roughly £${((latestWeek.petrol / 100) * 50).toFixed(0)}. A larger SUV with a 70-litre tank costs about £${((latestWeek.petrol / 100) * 70).toFixed(0)}. Diesel is more expensive at ${latestWeek.diesel}p per litre. You can use the tank size calculator on this page to see fill costs at any historical price point.`,
  },
  {
    question: "What affects UK fuel prices the most?",
    answer:
      "UK pump prices are driven by three main factors: the global crude oil price (affected by OPEC decisions, geopolitics and demand), fuel duty (currently frozen at 52.95p per litre since 2011, with a 5p cut from March 2022), and VAT at 20% applied on top. The retailer margin is typically 5-10p per litre. Exchange rates also play a role since oil is traded in US dollars.",
  },
  {
    question: "How often is this data updated?",
    answer:
      `The price data on this page is sourced from the DESNZ Weekly Road Fuel Prices publication and is refreshed automatically every time the site is deployed. The latest data point is from ${latestWeek.date}. The underlying government data is published weekly, typically on a Monday.`,
  },
];

export default function FuelPricesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Dataset",
              name: "UK Fuel Prices 2003-2026",
              description:
                "Weekly UK petrol and diesel pump prices from DESNZ, updated automatically. Covers 2003 to present with over 1,100 weekly data points.",
              url: "https://www.freeplatecheck.co.uk/stats/fuel-prices",
              license:
                "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
              creator: {
                "@type": "Organization",
                name: "Free Plate Check",
                url: "https://www.freeplatecheck.co.uk",
              },
              temporalCoverage: "2003/2026",
              spatialCoverage: "United Kingdom",
              variableMeasured:
                "Petrol and diesel pump prices in pence per litre",
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
        title="UK Fuel Prices — Live Weekly Data"
        subtitle="Track petrol and diesel prices week by week, with data updated automatically from official DESNZ figures. Switch between weekly, monthly and annual views."
        breadcrumb="Fuel Prices"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCallout
            value={`${latestWeek.petrol}p`}
            label="Latest petrol (PPL)"
            color="emerald"
          />
          <StatCallout
            value={`${latestWeek.diesel}p`}
            label="Latest diesel (PPL)"
            color="amber"
          />
          <StatCallout
            value={`£${fillCost50L}`}
            label="50L petrol fill cost"
            color="red"
          />
          <StatCallout
            value={dieselYoY ? `+${dieselYoY}%` : `${dieselChangeFromPeak}%`}
            label={dieselYoY ? "Diesel vs last year" : "Diesel vs 2022 peak"}
            color="sky"
          />
        </div>

        {/* Chart */}
        <FuelPriceChart />

        {/* Insight copy */}
        <div className="prose-invert mt-10 max-w-none space-y-4 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            Understanding UK Fuel Price Trends
          </h2>
          <p>
            UK fuel prices have followed a dramatic trajectory since government
            weekly records began in 2003, with earlier annual data stretching
            back to 1988 when a litre of unleaded petrol cost just 36p. Over the
            following decades, a combination of rising global oil demand,
            successive fuel duty escalators, and geopolitical shocks pushed
            prices to levels that would have been unimaginable to drivers in the
            late 1980s.
          </p>
          <p>
            The 2008 financial crisis brought severe volatility. Oil prices hit
            $147 a barrel in July before crashing below $40 by December,
            dragging pump prices on a rollercoaster ride. The UK
            government&apos;s fuel duty escalator continued to push prices higher
            through the early 2010s, with petrol breaching 134p in 2012.
          </p>
          <p>
            A period of relative stability followed, with drivers enjoying lower
            prices between 2015 and 2020 as oil markets softened and the
            COVID-19 pandemic slashed global demand. Petrol fell below 113p in
            2020 — its lowest level since 2016.
          </p>
          <p>
            The post-pandemic recovery, compounded by Russia&apos;s invasion of
            Ukraine in February 2022, triggered the most severe price shock in
            UK motoring history. Diesel surged past 180p on an annual average
            basis, with daily peaks above 199p at some forecourts. The
            government responded with a 5p fuel duty cut, but the gap between
            petrol and diesel prices widened to its largest ever margin as
            European diesel supply tightened.
          </p>
          <p>
            Prices eased through 2023-2025 but remained firmly above
            pre-pandemic levels. In early 2026, escalating tensions in the
            Middle East have driven a sharp upward move in crude oil prices,
            with diesel particularly affected — rising from around 141p in
            February to {latestWeek.diesel}p by mid-March. The weekly data on
            this page captures these movements as they happen.
          </p>
        </div>

        {/* Mid-content CTA — capitalise on fuel price concern */}
        <div className="my-10 rounded-xl border border-amber-700/40 bg-gradient-to-r from-amber-900/20 to-orange-900/20 p-6">
          <h3 className="text-lg font-bold text-gray-100">Worried about rising fuel costs?</h3>
          <p className="mt-2 text-sm text-gray-400">
            With petrol at {latestWeek.petrol}p and diesel at {latestWeek.diesel}p per litre,
            running costs matter more than ever. Check your car&apos;s real fuel economy and see
            how much it actually costs to run — or compare it against more efficient alternatives.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-cyan-600"
            >
              Check your car&apos;s running costs
            </a>
            <a
              href="/stats/fuel-type-comparison"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Compare fuel types
            </a>
          </div>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <ConversionWidget headline="What does your car cost to run?" subtext="Enter any UK reg to see your vehicle's fuel economy, running costs, and real-world data from MOT records — calculated using the latest fuel prices." />

        {/* Related stats */}
        <StatsRelated exclude="fuel-prices" />
      </div>
    </>
  );
}
