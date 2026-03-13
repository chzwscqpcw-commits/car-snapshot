import type { Metadata } from "next";

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
    mainEntity: [
      {
        "@type": "Question",
        name: "How much does it cost to run a car per month in the UK?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The average UK car costs between \u00a3300 and \u00a3600 per month to run, depending on the vehicle. This includes fuel, road tax, insurance, depreciation, MOT and servicing. Smaller, more efficient cars sit at the lower end, while larger SUVs and performance cars can exceed \u00a3700 per month. Enter your registration number to see an estimate tailored to your specific vehicle.",
        },
      },
      {
        "@type": "Question",
        name: "What is the biggest cost of car ownership?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Depreciation is typically the single largest cost of car ownership, especially in the first three years. A new car can lose 40\u201360% of its value in that time. After depreciation, fuel and insurance are usually the next biggest expenses. Our running costs breakdown shows you how each category contributes to your vehicle\u2019s total cost of ownership.",
        },
      },
      {
        "@type": "Question",
        name: "Are electric cars cheaper to run?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Electric cars are generally cheaper to run day-to-day than petrol or diesel equivalents. Electricity costs roughly 3\u20135p per mile compared to 12\u201318p per mile for petrol. EVs also have zero road tax (until 2025), no ULEZ charges, and lower servicing costs due to fewer moving parts. However, higher purchase prices and faster depreciation can offset some of these savings.",
        },
      },
      {
        "@type": "Question",
        name: "How do I reduce my running costs?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can reduce running costs by driving more efficiently (smooth acceleration, correct tyre pressure), shopping around for insurance at renewal, keeping up with servicing to avoid costly repairs, and checking whether a more fuel-efficient vehicle would save you money overall. Our free breakdown helps you identify which cost categories are highest for your car.",
        },
      },
      {
        "@type": "Question",
        name: "Does Free Plate Check include insurance costs?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, we include a segment-based insurance estimate in our running costs breakdown. This is based on typical insurance costs for vehicles in the same category as yours (size, engine, vehicle group). For an accurate personal quote you should always compare prices from insurers directly, as premiums vary based on your age, location, driving history and other personal factors.",
        },
      },
    ],
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

      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to Free Plate Check
          </a>
          <h1 className="text-3xl font-bold text-slate-100">
            What Does It Cost to Run Your Car?
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Get a free breakdown of fuel, tax, depreciation, MOT and servicing costs for any UK vehicle.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Hero CTA */}
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            See your car&apos;s running costs
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter any UK registration number on our homepage to get a personalised running costs breakdown instantly.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Look up a vehicle
          </a>
        </div>

        <div className="space-y-8 text-slate-300">
          {/* What we calculate */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What we calculate</h2>
            <p className="leading-relaxed mb-4">
              Our running costs breakdown covers the five major categories that make up the true cost of owning and running a car in the UK. Each estimate is tailored to your specific vehicle based on its fuel type, engine size, age, mileage and emissions.
            </p>
            <ul className="space-y-4 ml-2">
              <li>
                <strong className="text-slate-100">Fuel costs</strong>
                <p className="text-sm mt-1">Calculated using real-world MPG data for your vehicle and current UK fuel prices. We estimate your annual and monthly fuel spend based on average mileage, so you can see how much you are likely to spend at the pump.</p>
              </li>
              <li>
                <strong className="text-slate-100">Road tax (VED)</strong>
                <p className="text-sm mt-1">Vehicle Excise Duty is calculated based on your car&apos;s CO2 emissions and age. We show both the annual rate and the six-month payment option, including any first-year surcharges for newer vehicles.</p>
              </li>
              <li>
                <strong className="text-slate-100">Depreciation</strong>
                <p className="text-sm mt-1">We estimate how much value your car is likely to lose over the next year using market-based depreciation curves. This is often the single largest cost of car ownership, especially for newer vehicles.</p>
              </li>
              <li>
                <strong className="text-slate-100">MOT &amp; servicing</strong>
                <p className="text-sm mt-1">Average annual MOT and servicing costs based on your vehicle&apos;s segment. This includes the MOT test fee plus typical servicing costs for vehicles of similar size and type.</p>
              </li>
              <li>
                <strong className="text-slate-100">Insurance</strong>
                <p className="text-sm mt-1">A segment-based insurance estimate based on typical premiums for vehicles in the same category. Personal quotes will vary based on your age, location and driving history, but this gives you a realistic ballpark figure.</p>
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
              The purchase price of a car is only part of the story. Running costs can add thousands of pounds per year on top of what you paid, and they vary enormously between vehicles. A car that looks like a bargain to buy can turn out to be expensive to own if it drinks fuel, sits in a high insurance group, or depreciates quickly.
            </p>
            <p className="leading-relaxed mb-3">
              If you are buying a used car, understanding the full cost of ownership helps you budget properly and avoid surprises. A vehicle with slightly higher mileage but lower running costs could save you more in the long run than a low-mileage car with expensive fuel and servicing bills.
            </p>
            <p className="leading-relaxed">
              Our free running costs breakdown gives you the full picture before you commit, helping you compare vehicles on total cost rather than just the sticker price. You can also check a vehicle&apos;s <a href="/car-valuation" className="text-blue-400 hover:text-blue-300">valuation</a> and <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> to build a complete picture.
            </p>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">How much does it cost to run a car per month in the UK?</h3>
                <p className="text-sm mt-1">The average UK car costs between &pound;300 and &pound;600 per month to run, depending on the vehicle. This includes fuel, road tax, insurance, depreciation, MOT and servicing. Smaller, more efficient cars sit at the lower end, while larger SUVs and performance cars can exceed &pound;700 per month. Enter your registration number to see an estimate tailored to your specific vehicle.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What is the biggest cost of car ownership?</h3>
                <p className="text-sm mt-1">Depreciation is typically the single largest cost of car ownership, especially in the first three years. A new car can lose 40&ndash;60% of its value in that time. After depreciation, fuel and insurance are usually the next biggest expenses. Our running costs breakdown shows you how each category contributes to your vehicle&apos;s total cost of ownership.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Are electric cars cheaper to run?</h3>
                <p className="text-sm mt-1">Electric cars are generally cheaper to run day-to-day than petrol or diesel equivalents. Electricity costs roughly 3&ndash;5p per mile compared to 12&ndash;18p per mile for petrol. EVs also have lower servicing costs due to fewer moving parts and no ULEZ charges. However, higher purchase prices and faster depreciation can offset some of these savings.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How do I reduce my running costs?</h3>
                <p className="text-sm mt-1">You can reduce running costs by driving more efficiently (smooth acceleration, correct tyre pressure), shopping around for insurance at renewal, keeping up with servicing to avoid costly repairs, and checking whether a more fuel-efficient vehicle would save you money overall. Our free breakdown helps you identify which cost categories are highest for your car.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Does Free Plate Check include insurance costs?</h3>
                <p className="text-sm mt-1">Yes, we include a segment-based insurance estimate in our running costs breakdown. This is based on typical insurance costs for vehicles in the same category as yours. For an accurate personal quote you should always compare prices from insurers directly, as premiums vary based on your age, location, driving history and other personal factors.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/car-valuation" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free Car Valuation</p>
            <p className="text-xs text-slate-500 mt-2">Get a market-based valuation estimate for any UK vehicle using just the registration number.</p>
          </a>
          <a href="/ulez-check" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">ULEZ Compliance Check</p>
            <p className="text-xs text-slate-500 mt-2">Check if your vehicle meets ULEZ and Clean Air Zone emission standards.</p>
          </a>
        </div>
      </div>

      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">Home</a>
            <span>&bull;</span>
            <a href="/blog" className="hover:text-slate-300">Guides</a>
            <span>&bull;</span>
            <a href="/privacy" className="hover:text-slate-300">Privacy Policy</a>
            <span>&bull;</span>
            <a href="/terms" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}
