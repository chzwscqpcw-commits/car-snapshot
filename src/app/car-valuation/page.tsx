import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Car Valuation — How Much Is My Car Worth? | Free Plate Check",
  description:
    "Get a free instant car valuation with no signup. Enter any UK registration number to see an estimated value based on depreciation, mileage and market data.",
  keywords: [
    "free car valuation",
    "how much is my car worth",
    "car value check",
    "car valuation UK",
    "vehicle valuation free",
    "car worth calculator",
    "free car value",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/car-valuation",
  },
  openGraph: {
    title: "Free Car Valuation — How Much Is My Car Worth?",
    description:
      "Get a free instant car valuation with no signup. Enter any UK registration number to see an estimated value based on depreciation, mileage and market data.",
    url: "https://www.freeplatecheck.co.uk/car-valuation",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Car Valuation — How Much Is My Car Worth?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Car Valuation — How Much Is My Car Worth?",
    description:
      "Get a free instant car valuation with no signup. Enter any UK registration number to see an estimated value based on depreciation, mileage and market data.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

export default function CarValuationPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Free Car Valuation — How Much Is My Car Worth?",
    description:
      "Get a free instant car valuation with no signup. Enter any UK registration number to see an estimated value based on depreciation, mileage and market data.",
    url: "https://www.freeplatecheck.co.uk/car-valuation",
    publisher: {
      "@type": "Organization",
      name: "Free Plate Check",
      url: "https://www.freeplatecheck.co.uk",
    },
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How much is my car worth?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Enter your registration number on Free Plate Check to get an instant estimated value. Our tool uses depreciation modelling, mileage analysis, and live market data to calculate a value range — no signup or personal details required.",
          },
        },
        {
          "@type": "Question",
          name: "Is this car valuation free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free. No signup, no email address, no payment required. Enter any UK registration number and see an instant valuation alongside full vehicle details, MOT history, and more.",
          },
        },
        {
          "@type": "Question",
          name: "How accurate is a free car valuation?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Our valuations combine a depreciation model with live market data from similar vehicles for sale. The estimate is a guide — actual value depends on condition, specification, service history, and local demand. Use our condition questionnaire to refine the estimate further.",
          },
        },
        {
          "@type": "Question",
          name: "What affects my car's value?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Key factors include: age and mileage, make and model (some brands hold value better), service history, bodywork and interior condition, number of previous owners, accident history, MOT advisories and failures, and current market demand.",
          },
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
            Free Car Valuation
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Find out how much any UK car is worth — instantly, for free.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Value a vehicle now
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter any UK registration number on our homepage to get a free instant valuation alongside full vehicle details.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Look up a vehicle
          </a>
        </div>

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How much is my car worth?</h2>
            <p className="leading-relaxed mb-3">
              &ldquo;How much is my car worth?&rdquo; is one of the most common questions asked by UK car owners. Whether you are thinking about selling, part-exchanging, or just curious, knowing your vehicle&apos;s current market value gives you a stronger negotiating position and helps you make informed decisions.
            </p>
            <p className="leading-relaxed mb-3">
              Most free valuation tools online require you to hand over personal details — email address, phone number, postcode — before they show you a figure. Free Plate Check is different. Enter a registration number and get an instant estimated value with no signup, no email, and no personal data collected.
            </p>
            <p className="leading-relaxed">
              Our valuation combines a depreciation model calibrated for UK vehicles with live market data from similar cars currently for sale. As more users look up vehicles, our estimates improve through an accumulating dataset of comparable values.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What affects a car&apos;s value?</h2>
            <p className="leading-relaxed mb-4">
              Several factors determine what a used car is worth on the UK market. Our valuation model accounts for the main ones automatically, and you can refine further using our condition questionnaire:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li><strong className="text-slate-100">Age and depreciation</strong> — New cars lose roughly 15-35% of their value in the first year alone. Depreciation slows with age but never fully stops.</li>
              <li><strong className="text-slate-100">Mileage</strong> — Lower-than-average mileage adds value; higher-than-average reduces it. The UK average is around 8,000 miles per year.</li>
              <li><strong className="text-slate-100">Make and model</strong> — Some brands hold their value better than others. Porsche, Toyota, and Tesla tend to retain value well, while some volume brands depreciate faster.</li>
              <li><strong className="text-slate-100">Service history</strong> — A full service history (especially from main dealers) adds significant value. Missing records raise questions for buyers.</li>
              <li><strong className="text-slate-100">Condition</strong> — Bodywork, interior wear, tyre condition, and general upkeep all affect what a buyer will pay.</li>
              <li><strong className="text-slate-100">MOT history</strong> — Frequent failures and long advisory lists can reduce value. A clean MOT history is a selling point.</li>
              <li><strong className="text-slate-100">Previous owners</strong> — Fewer owners generally means better value retention. One-owner cars command a premium.</li>
            </ul>
            <p className="leading-relaxed">
              Our valuation tool pulls mileage and MOT data automatically from DVLA and MOT records, giving you an adjusted estimate without any manual input. Use the condition questionnaire to further refine the figure based on factors we cannot see from the data alone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How our valuation works</h2>
            <p className="leading-relaxed mb-3">
              Our valuation estimate is built from multiple data layers. The base layer is a depreciation model that factors in vehicle age, make, and recorded mileage. This is combined with live market data from similar vehicles currently listed for sale, plus an accumulating cache of recent valuations for the same make, model, and year.
            </p>
            <p className="leading-relaxed mb-3">
              When we have strong market data, the estimate narrows to a tighter range with higher confidence. When market data is limited, the estimate relies more on the depreciation model and shows a wider range. We always display the confidence level so you know how strong the estimate is.
            </p>
            <p className="leading-relaxed">
              This is not a formal valuation. For insurance, finance, or legal purposes, always obtain a professional valuation. Our figure is a useful starting point for understanding roughly what your car is worth on the open market.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">How much is my car worth?</h3>
                <p className="text-sm mt-1">Enter your registration number on Free Plate Check to get an instant estimated value. Our tool uses depreciation modelling, mileage analysis, and live market data to calculate a value range — no signup or personal details required.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Is this car valuation free?</h3>
                <p className="text-sm mt-1">Yes, completely free. No signup, no email address, no payment required. Enter any UK registration number and see an instant valuation alongside full vehicle details, MOT history, and more.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How accurate is a free car valuation?</h3>
                <p className="text-sm mt-1">Our valuations combine a depreciation model with live market data from similar vehicles for sale. The estimate is a guide — actual value depends on condition, specification, service history, and local demand. Use our condition questionnaire to refine the estimate further.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What affects my car&apos;s value?</h3>
                <p className="text-sm mt-1">Key factors include: age and mileage, make and model (some brands hold value better), service history, bodywork and interior condition, number of previous owners, accident history, MOT advisories and failures, and current market demand.</p>
              </div>
            </div>
          </section>
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
