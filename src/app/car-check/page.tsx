import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Car Check — UK Vehicle Lookup | Free Plate Check",
  description:
    "Look up any UK vehicle by reg. See make, model, colour, engine size, fuel type and more from official DVLA data. Free, no signup.",
  keywords: [
    "free car check",
    "car reg check",
    "vehicle check free",
    "number plate lookup",
    "vehicle registration check",
    "car details by reg",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/car-check",
  },
  openGraph: {
    title: "Free Car Check — UK Vehicle Lookup",
    description:
      "Look up any UK vehicle by reg. See make, model, colour, engine size, fuel type and more from official DVLA data. Free, no signup.",
    url: "https://www.freeplatecheck.co.uk/car-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Car Check — UK Vehicle Lookup | Free Plate Check",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Car Check — UK Vehicle Lookup",
    description:
      "Look up any UK vehicle by reg. See make, model, colour, engine size, fuel type and more from official DVLA data. Free, no signup.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

export default function CarCheckPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is this really free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, completely free. Free Plate Check uses official DVLA and MOT data to provide vehicle information at no cost. There is no signup, no account creation, and no payment required.",
        },
      },
      {
        "@type": "Question",
        name: "What data sources do you use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We use the DVLA Vehicle Enquiry Service for vehicle specifications and tax status, and the MOT History API for MOT test results. Both are official UK government data sources, updated regularly.",
        },
      },
      {
        "@type": "Question",
        name: "Do you store my registration number?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. We do not store registration numbers or link them to any personal data. Your lookup is processed in real time and not retained. See our privacy policy for full details.",
        },
      },
      {
        "@type": "Question",
        name: "Can I check vans and motorcycles?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Free Plate Check works for any UK-registered vehicle including cars, vans, motorcycles, and motorhomes. Enter the registration number and you will see the same vehicle details and MOT history.",
        },
      },
      {
        "@type": "Question",
        name: "What should I do if the details don't match the seller's description?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "If the DVLA data does not match what the seller has told you — for example, the colour, engine size, or fuel type is different — this is a serious red flag. Walk away from the sale or ask the seller to explain the discrepancy before proceeding.",
        },
      },
      {
        "@type": "Question",
        name: "How often is the data updated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Vehicle data comes directly from the DVLA and MOT APIs in real time. Tax status and MOT results are typically updated within 24 hours of any change, such as a new MOT test or tax renewal.",
        },
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Free Car Check",
    url: "https://www.freeplatecheck.co.uk/car-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Look up any UK vehicle by registration number. See make, model, colour, engine size, fuel type, tax status and MOT history for free.",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
            Free Car Check
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Look up any UK vehicle by registration number — free, private and instant.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Check a vehicle now
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter any UK registration number to see full vehicle details instantly.
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
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is a free car check?</h2>
            <p className="leading-relaxed mb-3">
              A free car check lets you look up any UK-registered vehicle using its registration number and see official data from the DVLA Vehicle Enquiry Service. This includes the vehicle&apos;s make, model, colour, fuel type, engine size, CO2 emissions, date of first registration, year of manufacture, and more.
            </p>
            <p className="leading-relaxed mb-3">
              You&apos;ll also see the current tax and MOT status, the full MOT history with advisories and mileage records, and practical information like whether the vehicle is ULEZ compliant. All of this data comes from official government sources — it&apos;s not estimated or scraped from third-party listings.
            </p>
            <p className="leading-relaxed">
              Free Plate Check gives you all of this in one place, instantly, with no signup or payment required. Enter a registration number on our homepage and the results appear in seconds.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why check a vehicle before buying?</h2>
            <p className="leading-relaxed mb-3">
              Buying a used car without checking its history is a gamble. The AA estimates that around 1 in 3 used cars has some form of hidden history issue — from mileage discrepancies to undisclosed damage. A free car check is the essential first step before committing any money.
            </p>
            <p className="leading-relaxed mb-3">
              Running a check helps you identify several key risks:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Mileage fraud (clocking)</strong> — By reviewing the <a href="/mileage-check" className="text-blue-400 hover:text-blue-300">mileage history</a> from MOT records, you can spot odometers that have been wound back.</li>
              <li><strong className="text-slate-100">Incorrect descriptions</strong> — Verify the seller&apos;s claims about the make, model, colour, engine size, and fuel type against official DVLA data.</li>
              <li><strong className="text-slate-100">Expired tax or MOT</strong> — Check the <a href="/tax-check" className="text-blue-400 hover:text-blue-300">tax status</a> and <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> to make sure the vehicle is legal to drive.</li>
              <li><strong className="text-slate-100">ULEZ charges</strong> — If you drive in London or other Clean Air Zones, check <a href="/ulez-check" className="text-blue-400 hover:text-blue-300">ULEZ compliance</a> before buying to avoid daily charges.</li>
              <li><strong className="text-slate-100">Safety recalls</strong> — Our <a href="/recall-check" className="text-blue-400 hover:text-blue-300">recall check</a> shows whether the manufacturer has issued any safety recalls for the vehicle&apos;s make and model.</li>
            </ul>
            <p className="leading-relaxed">
              A free check won&apos;t tell you everything — for high-value purchases, a paid HPI-type check adds finance, write-off, and stolen vehicle data. But a free check is a comprehensive starting point that covers more than most buyers realise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What a free check shows vs. a paid check</h2>
            <p className="leading-relaxed mb-3">
              Free Plate Check includes more than most free vehicle check tools. You get DVLA vehicle specifications, full MOT history, tax status, mileage tracking, ULEZ compliance, safety recall matching, and even a <a href="/car-valuation" className="text-blue-400 hover:text-blue-300">free valuation estimate</a>. These cover the essential checks any buyer should make.
            </p>
            <p className="leading-relaxed mb-3">
              Paid services like HPI Check, AA Vehicle Check, or RAC Vehicle History add another layer of data that isn&apos;t available through government APIs. This typically includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li>Outstanding finance checks (whether the car is still being paid for)</li>
              <li>Insurance write-off history (categories S, N, B, A)</li>
              <li>Stolen vehicle checks against the Police National Computer</li>
              <li>V5C logbook verification</li>
            </ul>
            <p className="leading-relaxed">
              For everyday checks, our free tool covers everything you need. For high-value purchases or vehicles with a suspicious history, a paid check gives you the full picture. We&apos;d always recommend starting with a free check — if anything looks off, that&apos;s your cue to dig deeper.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to read your results</h2>
            <p className="leading-relaxed mb-3">
              When you enter a registration number, your results are organised into clear sections. Here&apos;s what to look for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Vehicle details</strong> — Verify these match the V5C logbook (registration document) that the seller should show you. Check the make, model, colour, engine size, and fuel type all match.</li>
              <li><strong className="text-slate-100">MOT status</strong> — Confirm the vehicle has a current MOT if it&apos;s being driven. Note the expiry date so you know when the next test is due.</li>
              <li><strong className="text-slate-100">Tax status</strong> — Check the vehicle is taxed, not SORN&apos;d (declared off the road). If it&apos;s SORN, you&apos;ll need to tax it before driving it away from a sale.</li>
              <li><strong className="text-slate-100">Mileage history</strong> — Look for consistent, steady increases in mileage across MOT tests. Drops or large unexplained jumps are red flags.</li>
            </ul>
            <p className="leading-relaxed">
              For a full step-by-step guide to what to check when buying a used car, read our <a href="/blog/used-car-checks-before-buying" className="text-blue-400 hover:text-blue-300">complete buying checklist</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">Is this really free?</h3>
                <p className="text-sm mt-1">Yes, completely free. Free Plate Check uses official DVLA and MOT data to provide vehicle information at no cost. There is no signup, no account creation, and no payment required.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What data sources do you use?</h3>
                <p className="text-sm mt-1">We use the DVLA Vehicle Enquiry Service for vehicle specifications and tax status, and the MOT History API for MOT test results. Both are official UK government data sources, updated regularly.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Do you store my registration number?</h3>
                <p className="text-sm mt-1">No. We do not store registration numbers or link them to any personal data. Your lookup is processed in real time and not retained. See our privacy policy for full details.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Can I check vans and motorcycles?</h3>
                <p className="text-sm mt-1">Yes. Free Plate Check works for any UK-registered vehicle including cars, vans, motorcycles, and motorhomes. Enter the registration number and you&apos;ll see the same vehicle details and MOT history.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What should I do if the details don&apos;t match the seller&apos;s description?</h3>
                <p className="text-sm mt-1">If the DVLA data does not match what the seller has told you — for example, the colour, engine size, or fuel type is different — this is a serious red flag. Walk away from the sale or ask the seller to explain the discrepancy before proceeding.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How often is the data updated?</h3>
                <p className="text-sm mt-1">Vehicle data comes directly from the DVLA and MOT APIs in real time. Tax status and MOT results are typically updated within 24 hours of any change, such as a new MOT test or tax renewal.</p>
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
