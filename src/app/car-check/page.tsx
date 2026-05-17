import type { Metadata } from "next";
import ConversionWidget from "@/components/stats/ConversionWidget";
import LandingHero from "@/components/LandingHero";
import MotReminderBanner from "@/components/MotReminderBanner";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Car Check — UK Vehicle Lookup",
    description:
      "Look up any UK vehicle by reg. See make, model, colour, engine size, fuel type and more from official DVLA data. Free, no signup.",
  },
};

export default function CarCheckPage() {
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
        name: "Free Car Check",
        item: "https://www.freeplatecheck.co.uk/car-check",
      },
    ],
  };

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

      <LandingHero
        h1="Free Car Check"
        subtitle="Look up any UK vehicle by registration — DVLA spec, MOT history, tax, mileage, recalls and more. Free, instant, no signup required."
        badgeText="Free · No signup · Official DVLA data"
        bullets={[
          "Official DVLA, DVSA and MOT data — never third-party scrapes",
          "Verify make, model, mileage and history before you buy",
          "Free email reminders 28 + 7 days before your next MOT",
        ]}
        exampleCard={
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Example</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                DVLA-verified
              </span>
            </div>
            <p className="text-sm text-slate-400">
              <span className="font-mono uppercase tracking-wider text-slate-200">AB12 CDE</span>
              <span className="mx-1.5 text-slate-600">&middot;</span>
              2018 VW Golf 1.4 TSI
            </p>
            <p className="text-xs text-slate-500">Petrol &middot; 1.4L &middot; Manual</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-emerald-700/30 bg-emerald-900/15 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">MOT</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-300">VALID</p>
                <p className="text-[9px] text-slate-500">to Jan 2027</p>
              </div>
              <div className="rounded-md border border-emerald-700/30 bg-emerald-900/15 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Tax</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-300">TAXED</p>
                <p className="text-[9px] text-slate-500">&pound;190/yr</p>
              </div>
              <div className="rounded-md border border-emerald-700/30 bg-emerald-900/15 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Recalls</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-300">NONE</p>
                <p className="text-[9px] text-slate-500">All clear</p>
              </div>
              <div className="rounded-md border border-emerald-700/30 bg-emerald-900/15 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">ULEZ</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-300">EURO 6</p>
                <p className="text-[9px] text-slate-500">Compliant</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">mileage</p>
                <p className="text-xs font-semibold text-slate-300">56,400 mi</p>
              </div>
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">valuation</p>
                <p className="text-xs font-semibold text-emerald-400">&pound;6.8k&ndash;&pound;8.4k</p>
              </div>
            </div>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <ConversionWidget
          headline="Check a vehicle now"
          subtext="Enter any UK registration number to see full vehicle details, MOT history, tax status, mileage, and more — instantly."
          reminderHeadline="Keep on top of your MOT"
        />

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

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/blog/what-is-hpi-check" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">What Is an HPI Check?</p>
            <p className="text-xs text-slate-500 mt-2">How HPI compares to free car checks and when you should pay for a full report.</p>
          </a>
          <a href="/blog/how-to-check-if-car-is-stolen" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Check if a Car Is Stolen</p>
            <p className="text-xs text-slate-500 mt-2">Warning signs and how to protect yourself when buying privately.</p>
          </a>
          <a href="/blog/what-does-cat-n-s-mean" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">What Does Cat N and Cat S Mean?</p>
            <p className="text-xs text-slate-500 mt-2">Insurance write-off categories explained — Cat A, B, S and N.</p>
          </a>
          <a href="/blog/how-to-spot-a-clocked-car" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Spot a Clocked Car</p>
            <p className="text-xs text-slate-500 mt-2">8 warning signs to watch for using MOT history and wear patterns.</p>
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
      <MotReminderBanner />
    </div>
  );
}
