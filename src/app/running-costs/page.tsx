import type { Metadata } from "next";
import MOTBookingCTA from "@/components/MOTBookingCTA";
import ConversionWidget from "@/components/stats/ConversionWidget";
import LandingHero from "@/components/LandingHero";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";
import PlateSwitch from "@/components/tools/PlateSwitch";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How much does it cost to run a car per month in the UK?",
    answer:
      "£300-£600 average, including fuel, tax, insurance, depreciation, MOT and servicing. Small efficient cars at the low end; large SUVs and performance can top £700. Enter a reg for a vehicle-specific estimate.",
  },
  {
    question: "What is the biggest cost of car ownership?",
    answer:
      "Depreciation — a new car can lose 40-60% of its value in the first 3 years. Fuel and insurance follow. Our breakdown shows how each category contributes.",
  },
  {
    question: "Are electric cars cheaper to run?",
    answer:
      "Day-to-day, yes — electricity is ~3-5p/mile vs 12-18p for petrol. EVs registered before April 2025 paid no road tax (newer EVs pay the £195 standard rate), no ULEZ, lower servicing. Higher purchase prices and faster depreciation can offset some savings.",
  },
  {
    question: "How do I reduce my running costs?",
    answer:
      "Drive smoothly (acceleration + tyre pressures), shop insurance at renewal, stay on top of servicing to avoid bigger bills, and consider switching to a more efficient vehicle if your current one is expensive. Our breakdown highlights which categories are biggest.",
  },
  {
    question: "Does Free Plate Check include insurance costs?",
    answer:
      "Yes — a segment-based estimate from typical premiums for similar vehicles. For an accurate personal quote, always compare insurers directly; premiums depend on age, location, driving history etc.",
  },
];


export const metadata: Metadata = {
  title: "Car Running Costs Calculator | Free Plate Check",
  description:
    "Find out how much it costs to run any UK car. Enter a reg for a free breakdown of fuel, tax, depreciation, MOT and servicing costs.",
  keywords: [
    "running costs",
    "cost to run car",
    "car expenses UK",
    "annual car costs",
    "car running costs calculator",
    "how much does it cost to run a car",
    "monthly car costs UK",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/running-costs",
  },
  openGraph: {
    title: "Car Running Costs Calculator | Free Plate Check",
    description:
      "Find out how much it costs to run any UK car. Enter a reg for a free breakdown of fuel, tax, depreciation, MOT and servicing costs.",
    url: "https://www.freeplatecheck.co.uk/running-costs",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Running Costs Calculator | Free Plate Check",
    description:
      "Find out how much it costs to run any UK car. Enter a reg for a free breakdown of fuel, tax, depreciation, MOT and servicing costs.",
  },
};

export default function RunningCostsPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.freeplatecheck.co.uk",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Running Costs",
        item: "https://www.freeplatecheck.co.uk/running-costs",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Car Running Costs Calculator",
    url: "https://www.freeplatecheck.co.uk/running-costs",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Calculate the true cost of running any UK car for free. See fuel, tax, depreciation, MOT and servicing costs in one breakdown.",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      <PlateSwitch tool="runningCosts">
        <>
      <LandingHero
        h1="What Does It Cost to Run Your Car?"
        searchTargetPath="/running-costs"
        searchCtaLabel="Check running costs free"
        subtitle="Get a free breakdown of fuel, tax, depreciation, MOT and servicing costs for any UK vehicle."
        bullets={[
          "Fuel, tax, insurance, servicing and depreciation, itemised",
          "Worked from the car's real MOT mileage and DVLA record",
          "Free, instant, no signup",
        ]}
        sample="running-costs"
        tool="running-costs"
      />

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-12 sm:py-12">
        <ConversionWidget
          headline="See your car's running costs"
          subtext="Enter any UK reg plate for a personalised breakdown of fuel, road tax, depreciation, MOT, servicing and insurance."
          reminderHeadline="While you're here — set a free MOT reminder"
          targetPath="/running-costs"
          showLookup={false}
        />

        <StatCallouts
          stats={[
            { value: "£300-£600", label: "Avg UK monthly cost" },
            { value: "40-60%", label: "Year 1-3 depreciation", tone: "warn" },
            { value: "5 categories", label: "Tailored to your reg" },
          ]}
        />

        <div className="space-y-8 text-slate-300">
          {/* What we calculate */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What we calculate</h2>
            <p className="leading-relaxed mb-4">
              Five major cost categories, each tailored to your reg&apos;s fuel type, engine, age, mileage, and emissions:
            </p>
            <ul className="space-y-4 ml-2">
              <li>
                <strong className="text-slate-100">Fuel costs</strong>
                <p className="text-sm mt-1">Real-world MPG × current UK fuel prices × average mileage.</p>
              </li>
              <li>
                <strong className="text-slate-100">Road tax (VED)</strong>
                <p className="text-sm mt-1">Based on CO₂ and registration year. Annual + 6-month rates, with first-year surcharges where they apply.</p>
              </li>
              <li>
                <strong className="text-slate-100">Depreciation</strong>
                <p className="text-sm mt-1">Estimated value loss over the next year using market-based curves. Often the single biggest cost.</p>
              </li>
              <li>
                <strong className="text-slate-100">MOT &amp; servicing</strong>
                <p className="text-sm mt-1">MOT fee plus typical servicing costs for vehicles in your segment.</p>
              </li>
              <li>
                <strong className="text-slate-100">Insurance</strong>
                <p className="text-sm mt-1">Segment-based estimate. Personal quotes will vary by age, location, history — this is a realistic ballpark.</p>
              </li>
            </ul>
          </section>

          {/* How it works */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How it works</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
                <p className="text-lg font-bold text-blue-400 mb-1">1</p>
                <p className="font-semibold text-slate-100 text-sm">Enter your reg</p>
                <p className="text-xs text-slate-400 mt-1">Type any UK registration number into the search box on our homepage.</p>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
                <p className="text-lg font-bold text-blue-400 mb-1">2</p>
                <p className="font-semibold text-slate-100 text-sm">We calculate the costs</p>
                <p className="text-xs text-slate-400 mt-1">We use your vehicle&apos;s real specs, fuel data, emissions and market values to build a personalised estimate.</p>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
                <p className="text-lg font-bold text-blue-400 mb-1">3</p>
                <p className="font-semibold text-slate-100 text-sm">See the breakdown</p>
                <p className="text-xs text-slate-400 mt-1">Get a clear monthly and annual breakdown across fuel, tax, depreciation, servicing and insurance.</p>
              </div>
            </div>
          </section>

          {/* Why it matters */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why running costs matter</h2>
            <p className="leading-relaxed mb-3">
              Purchase price is only part of the story. A car that looks cheap to buy can be expensive to own if it drinks fuel, sits in a high insurance group, or depreciates quickly.
            </p>
            <p className="leading-relaxed">
              For buyers, total cost of ownership matters more than sticker price. Pair this with the vehicle&apos;s <a href="/value-my-car" className="text-blue-400 hover:text-blue-300">valuation</a> and <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> for the full picture.
            </p>
          </section>

          {/* MOT booking CTA */}
          <section>
            <MOTBookingCTA regNumber="" context="neutral" placement="running-costs" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </section>
        </div>
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/value-my-car" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free Car Valuation</p>
            <p className="text-xs text-slate-500 mt-2">Get a market-based valuation estimate for any UK vehicle using just the registration number.</p>
          </a>
          <a href="/ulez-check" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">ULEZ Compliance Check</p>
            <p className="text-xs text-slate-500 mt-2">Check if your vehicle meets ULEZ and Clean Air Zone emission standards.</p>
          </a>
        </div>
      </div>
        </>
      </PlateSwitch>
    </div>
  );
}
