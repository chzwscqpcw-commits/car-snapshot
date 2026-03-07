import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";

import FuelPriceChart from "@/components/stats/FuelPriceChart";

export const metadata: Metadata = {
  title: "UK Fuel Prices 1988-2025 | Petrol & Diesel Price History",
  description:
    "Interactive chart of UK petrol and diesel prices from 1988 to 2025. Includes fill-cost calculator, key event annotations and historical price data from DESNZ.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/fuel-prices",
  },
  openGraph: {
    title: "UK Fuel Prices 1988-2025 | Petrol & Diesel Price History",
    description:
      "Interactive chart of UK petrol and diesel prices from 1988 to 2025. Includes fill-cost calculator, key event annotations and historical price data.",
    url: "https://www.freeplatecheck.co.uk/stats/fuel-prices",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UK Fuel Prices 1988-2025 | Petrol & Diesel Price History",
    description:
      "Interactive chart of UK petrol and diesel prices from 1988 to 2025.",
  },
};

const faqItems = [
  {
    question: "What is the average price of petrol in the UK right now?",
    answer:
      "As of early 2025, the average UK unleaded petrol price is around 139.8p per litre. This is down from the record highs seen in mid-2022 when prices peaked above 190p at some forecourts, but still significantly higher than pre-pandemic levels of around 125p.",
  },
  {
    question: "Why is diesel more expensive than petrol?",
    answer:
      "Diesel has been consistently more expensive than petrol in the UK since around 2004. This is partly because diesel requires more refining, European demand for diesel is higher (pushing up wholesale costs), and duty rates have historically been the same despite higher production costs. The gap widened sharply during the 2022 energy crisis.",
  },
  {
    question: "When were UK fuel prices at their highest?",
    answer:
      "UK fuel prices hit record highs in 2022 following Russia's invasion of Ukraine. The annual average reached 165.6p for petrol and 180.3p for diesel, with daily peaks exceeding 190p at some forecourts. Before that, the previous highs were in 2012 at around 134-141p per litre.",
  },
  {
    question: "How much does it cost to fill a typical car?",
    answer:
      "At current prices of around 140p per litre, filling a typical 50-litre family car tank costs roughly \u00a370. A larger SUV with a 70-litre tank costs about \u00a398. You can use the tank size calculator on this page to see fill costs at any historical price point.",
  },
  {
    question: "What affects UK fuel prices the most?",
    answer:
      "UK pump prices are driven by three main factors: the global crude oil price (affected by OPEC decisions, geopolitics and demand), fuel duty (currently frozen at 52.95p per litre since 2011, with a 5p cut from March 2022), and VAT at 20% applied on top. The retailer margin is typically 5-10p per litre. Exchange rates also play a role since oil is traded in US dollars.",
  },
];

export default function FuelPricesPage() {
  return (
    <>
      <StatsHeroSection
        title="UK Fuel Prices 1988-2025"
        subtitle="Track how petrol and diesel prices have changed over nearly four decades. Use the fill-cost calculator to see what a full tank would have cost at any point in history."
        breadcrumb="Fuel Prices"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCallout
            value="139.8p"
            label="Latest petrol (PPL)"
            color="emerald"
          />
          <StatCallout
            value="147.2p"
            label="Latest diesel (PPL)"
            color="amber"
          />
          <StatCallout
            value="180.3p"
            label="All-time high (diesel 2022)"
            color="red"
          />
          <StatCallout
            value="-22.5%"
            label="Diesel down from peak"
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
            UK fuel prices have followed a dramatic upward trajectory since
            government records began in 1988, when a litre of unleaded petrol
            cost just 36p. Over the following decades, a combination of rising
            global oil demand, successive fuel duty escalators, and geopolitical
            shocks pushed prices to levels that would have been unimaginable to
            drivers in the late 1980s.
          </p>
          <p>
            The first major spike came during the 1990 Gulf War, when Iraq's
            invasion of Kuwait disrupted global oil supply and sent crude prices
            surging. A decade later, the 2000 fuel protests saw UK hauliers and
            farmers blockade refineries in response to pump prices that had
            climbed above 76p per litre — a figure that seems modest by today's
            standards but represented a sharp jump at the time.
          </p>
          <p>
            The 2008 financial crisis brought another wave of volatility. Oil
            prices hit $147 a barrel in July before crashing below $40 by
            December, dragging pump prices on a rollercoaster ride. The UK
            government's fuel duty escalator continued to push prices higher
            through the early 2010s, with petrol breaching 134p in 2012.
          </p>
          <p>
            A period of relative stability followed, with drivers enjoying lower
            prices between 2015 and 2020 as oil markets softened and the
            COVID-19 pandemic slashed global demand. Petrol fell below 113p in
            2020 — its lowest level since 2016.
          </p>
          <p>
            The post-pandemic recovery, compounded by Russia's invasion of
            Ukraine in February 2022, triggered the most severe price shock in
            UK motoring history. Diesel surged past 180p on an annual average
            basis, with daily peaks above 199p at some forecourts. The
            government responded with a 5p fuel duty cut, but the gap between
            petrol and diesel prices widened to its largest ever margin as
            European diesel supply tightened.
          </p>
          <p>
            By 2025, prices have eased from those peaks but remain firmly above
            pre-pandemic levels. With fuel duty frozen since 2011 and the
            temporary 5p cut still in place, the primary driver of pump prices
            remains the global oil market. For UK motorists, fuel continues to
            represent one of the largest variable costs of car ownership —
            making it worth understanding both the historical trends and the
            factors that drive prices at the forecourt.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <StatsCTA />

        {/* Related stats */}
        <StatsRelated exclude="fuel-prices" />
      </div>
    </>
  );
}
