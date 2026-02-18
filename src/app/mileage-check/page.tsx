import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Mileage Check — Spot Clocking | Free Plate Check",
  description:
    "Track odometer readings across MOT tests to spot mileage fraud. See if a car has been clocked before you buy. Free, no signup required.",
  keywords: [
    "mileage check",
    "car mileage history",
    "check mileage by reg",
    "mileage verification",
    "has my car been clocked",
    "odometer check",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/mileage-check",
  },
  openGraph: {
    title: "Free Mileage Check — Spot Clocking",
    description:
      "Track odometer readings across MOT tests to spot mileage fraud. See if a car has been clocked before you buy. Free, no signup required.",
    url: "https://www.freeplatecheck.co.uk/mileage-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Mileage Check — Spot Clocking",
    description:
      "Track odometer readings across MOT tests to spot mileage fraud. See if a car has been clocked before you buy. Free, no signup required.",
  },
};

export default function MileageCheckPage() {
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
        name: "Mileage Check",
        item: "https://www.freeplatecheck.co.uk/mileage-check",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I check if a car has been clocked?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Enter the registration number on Free Plate Check to see the mileage recorded at every MOT test since 2005. If the mileage drops between tests, or if there are unusually large gaps, the odometer may have been tampered with. Also check for physical signs like worn pedals, steering wheel, and seat bolsters on a supposedly low-mileage car.",
        },
      },
      {
        "@type": "Question",
        name: "Is mileage clocking illegal in the UK?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Clocking is illegal under the Consumer Protection from Unfair Trading Regulations 2008 and the Fraud Act 2006. Sellers who misrepresent a vehicle's mileage can face criminal prosecution and unlimited fines.",
        },
      },
      {
        "@type": "Question",
        name: "What is the average mileage per year in the UK?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The average UK car covers around 7,000 to 10,000 miles per year. A five-year-old car would typically show 35,000 to 50,000 miles. Figures significantly lower or higher than this are worth investigating further.",
        },
      },
      {
        "@type": "Question",
        name: "Can Free Plate Check detect clocking?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Free Plate Check shows the mileage recorded at every MOT test and automatically flags anomalies such as mileage decreases between tests. While no tool can guarantee detection in every case, MOT mileage history is the most reliable free method for identifying potential clocking.",
        },
      },
      {
        "@type": "Question",
        name: "What should I do if the mileage doesn't add up?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "If you spot a mileage discrepancy, do not proceed with the purchase until the seller can explain it satisfactorily. Ask for service records to corroborate the claimed mileage. If you suspect fraud, report it to Action Fraud (0300 123 2040) and your local Trading Standards office.",
        },
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Mileage Check",
    url: "https://www.freeplatecheck.co.uk/mileage-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Track odometer readings across MOT tests to spot mileage fraud. Check any UK vehicle's mileage history for free.",
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
            Free Mileage Check
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            See recorded mileage from every MOT test to verify a vehicle&apos;s true history.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Check a vehicle&apos;s mileage history now
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter any UK registration number to see mileage recorded at every MOT test.
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
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is a mileage check?</h2>
            <p className="leading-relaxed mb-3">
              Every time a vehicle has an MOT test in the UK, the tester records the odometer reading. These readings have been digitally stored since 2005, creating a mileage timeline for every vehicle that has had an MOT. A mileage check lets you view this timeline to see whether the recorded mileage has increased consistently over time.
            </p>
            <p className="leading-relaxed mb-3">
              This is the most reliable free method for spotting mileage fraud. By comparing odometer readings across years of MOT tests, you can see whether the figures make sense — or whether someone has wound back the clock.
            </p>
            <p className="leading-relaxed">
              Free Plate Check shows you every recorded reading, calculates the average annual mileage, and automatically flags anomalies like mileage decreases between tests. You can also view the full <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> to see test results, advisories, and failures alongside the mileage data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to spot a clocked car</h2>
            <p className="leading-relaxed mb-3">
              Mileage clocking — winding back the odometer to make a vehicle appear lower-mileage — remains a widespread problem in the UK used car market. Estimates suggest that as many as 1 in 16 used cars may have been clocked, costing buyers millions of pounds every year. Clocking is illegal under the Consumer Protection from Unfair Trading Regulations 2008 and the Fraud Act 2006, but it remains difficult to prosecute.
            </p>
            <p className="leading-relaxed mb-3">
              Here are the key warning signs to look for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Mileage decreasing between MOT tests</strong> — This is the clearest indicator. If the odometer shows fewer miles at a later test than an earlier one, the reading has been tampered with.</li>
              <li><strong className="text-slate-100">Large gaps with no MOT</strong> — If the vehicle has periods with no MOT record, it may have been taken off the road specifically to obscure a mileage discrepancy — or it may have been abroad.</li>
              <li><strong className="text-slate-100">Physical condition vs. stated mileage</strong> — A car claiming 30,000 miles but with heavily worn pedal rubbers, a shiny steering wheel, sagging seat bolsters, or scuffed door handles may have covered far more.</li>
              <li><strong className="text-slate-100">Unusually low mileage for the age</strong> — The average UK car covers around 7,000 to 10,000 miles per year. A five-year-old car with just 15,000 miles should raise questions — is it genuine, or has the clock been wound back?</li>
              <li><strong className="text-slate-100">Inconsistent service history</strong> — If the service book shows stamps at different mileage intervals than the MOT records suggest, something doesn&apos;t add up.</li>
            </ul>
            <p className="leading-relaxed">
              For a more detailed guide to spotting clocked cars, including what to look for during a physical inspection, read our <a href="/blog/how-to-spot-a-clocked-car" className="text-blue-400 hover:text-blue-300">buyer&apos;s guide to clocked cars</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What to do if you suspect clocking</h2>
            <p className="leading-relaxed mb-3">
              If the MOT mileage history shows discrepancies, take these steps before committing to a purchase:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Compare carefully</strong> — Use Free Plate Check to review the full mileage timeline. Look at every reading and calculate whether the annual increases are consistent and realistic.</li>
              <li><strong className="text-slate-100">Check physical wear</strong> — Inspect the condition of the pedals, steering wheel, gear knob, seat bolsters, and door handles. These wear items tell a story that an odometer cannot hide.</li>
              <li><strong className="text-slate-100">Ask the seller</strong> — Put the discrepancy to the seller directly and ask them to explain it. A legitimate seller should have documentation to support their claimed mileage.</li>
              <li><strong className="text-slate-100">Request service records</strong> — Service stamps and invoices record mileage independently. Cross-reference these with the MOT readings.</li>
              <li><strong className="text-slate-100">Walk away if in doubt</strong> — If the seller cannot satisfactorily explain a mileage discrepancy, do not proceed with the purchase.</li>
            </ul>
            <p className="leading-relaxed">
              If you believe you have encountered mileage fraud, report it to Action Fraud on 0300 123 2040 and contact your local Trading Standards office. If you have already bought the vehicle, you may have a claim under the Consumer Rights Act 2015.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why mileage matters when buying</h2>
            <p className="leading-relaxed mb-3">
              Mileage is one of the biggest factors affecting a used car&apos;s value, insurance premiums, remaining warranty, and likely maintenance costs. Higher-mileage vehicles typically need more frequent servicing and are more likely to require component replacements — brakes, clutches, suspension bushes, and timing belts all have service intervals tied to mileage.
            </p>
            <p className="leading-relaxed mb-3">
              That said, a high-mileage car with a full service history can be a better buy than a low-mileage car that has been neglected. The pattern matters more than the number. Consistent mileage increases, regular servicing, and clean MOT passes are all positive signs — regardless of the total on the clock.
            </p>
            <p className="leading-relaxed">
              Use a mileage check alongside our <a href="/car-valuation" className="text-blue-400 hover:text-blue-300">free car valuation</a> to understand how the mileage affects the vehicle&apos;s market value.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">How do I check if a car has been clocked?</h3>
                <p className="text-sm mt-1">Enter the registration number on Free Plate Check to see the mileage recorded at every MOT test since 2005. If the mileage drops between tests, or if there are unusually large gaps, the odometer may have been tampered with. Also check for physical signs like worn pedals, steering wheel, and seat bolsters on a supposedly low-mileage car.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Is mileage clocking illegal in the UK?</h3>
                <p className="text-sm mt-1">Yes. Clocking is illegal under the Consumer Protection from Unfair Trading Regulations 2008 and the Fraud Act 2006. Sellers who misrepresent a vehicle&apos;s mileage can face criminal prosecution and unlimited fines.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What is the average mileage per year in the UK?</h3>
                <p className="text-sm mt-1">The average UK car covers around 7,000 to 10,000 miles per year. A five-year-old car would typically show 35,000 to 50,000 miles. Figures significantly lower or higher than this are worth investigating further.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Can Free Plate Check detect clocking?</h3>
                <p className="text-sm mt-1">Free Plate Check shows the mileage recorded at every MOT test and automatically flags anomalies such as mileage decreases between tests. While no tool can guarantee detection in every case, MOT mileage history is the most reliable free method for identifying potential clocking.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What should I do if the mileage doesn&apos;t add up?</h3>
                <p className="text-sm mt-1">If you spot a mileage discrepancy, do not proceed with the purchase until the seller can explain it satisfactorily. Ask for service records to corroborate the claimed mileage. If you suspect fraud, report it to Action Fraud (0300 123 2040) and your local Trading Standards office.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/blog/how-to-check-mileage-used-car" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Check Mileage on a Used Car</p>
            <p className="text-xs text-slate-500 mt-2">Verify mileage history using MOT records and protect yourself from fraud.</p>
          </a>
          <a href="/blog/how-to-check-car-service-history" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Check a Car&apos;s Service History</p>
            <p className="text-xs text-slate-500 mt-2">What a full service history means and why gaps should raise red flags.</p>
          </a>
          <a href="/blog/how-to-read-mot-history" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Read a Car&apos;s MOT History</p>
            <p className="text-xs text-slate-500 mt-2">Understand test results, advisories, and how to spot red flags.</p>
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
