import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free MOT History Check — Full MOT Results | Free Plate Check",
  description:
    "See every MOT result, advisory and failure since 2005. Check mileage history and spot problems before buying. Free, no signup required.",
  keywords: [
    "MOT check",
    "MOT history check",
    "free MOT check",
    "check MOT history",
    "MOT history by reg",
    "MOT test results",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/mot-check",
  },
  openGraph: {
    title: "Free MOT History Check — Full MOT Results",
    description:
      "See every MOT result, advisory and failure since 2005. Check mileage history and spot problems before buying.",
    url: "https://www.freeplatecheck.co.uk/mot-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free MOT History Check — Full MOT Results | Free Plate Check",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free MOT History Check — Full MOT Results",
    description:
      "See every MOT result, advisory and failure since 2005. Check mileage history and spot problems before buying.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

export default function MotCheckPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What does an MOT advisory mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An MOT advisory is a note about a component that isn't bad enough to cause a failure but needs monitoring. Common examples include brake pads wearing thin, tyres approaching the 1.6mm legal tread depth limit, or minor corrosion on structural components.",
        },
      },
      {
        "@type": "Question",
        name: "How far back does MOT history go?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MOT test results are available from 2005 onwards. The DVSA has digitally recorded every MOT test since then, including pass/fail results, mileage readings, advisories, and failure reasons.",
        },
      },
      {
        "@type": "Question",
        name: "Can I drive to an MOT test without a valid MOT?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you can drive directly to a pre-booked MOT test at a registered test centre without a valid MOT. However, the vehicle must be roadworthy and insured. You cannot make any detours — the journey must be directly to the test centre.",
        },
      },
      {
        "@type": "Question",
        name: "How much does an MOT cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The maximum fee for a car MOT is £54.85, set by the DVSA. Many garages charge less than this as a competitive rate. The test itself takes around 45 minutes to an hour.",
        },
      },
      {
        "@type": "Question",
        name: "What's the difference between a dangerous, major, and minor defect?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Since May 2018, MOT defects are classified into three categories. A dangerous defect is an immediate risk to road safety and means the vehicle must not be driven. A major defect is a failure that needs repair before the vehicle can pass. A minor defect is a less serious issue that should be repaired but does not cause a failure.",
        },
      },
    ],
  };

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
        name: "MOT History Check",
        item: "https://www.freeplatecheck.co.uk/mot-check",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — MOT History Check",
    url: "https://www.freeplatecheck.co.uk/mot-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Check any UK vehicle's full MOT history for free. See every test result, advisory and failure since 2005.",
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
            Free MOT History Check
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Check any UK vehicle&apos;s full MOT history using just the registration number.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Check a vehicle&apos;s MOT history now
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter any UK registration number on our homepage to see the full MOT history instantly.
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
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is an MOT history check?</h2>
            <p className="leading-relaxed mb-3">
              The DVSA (Driver and Vehicle Standards Agency) has digitally recorded every MOT test carried out in the UK since 2005. An MOT history check lets you access this full record for any vehicle, showing every test result — pass or fail — along with the date, recorded mileage, advisory notes, and failure reasons.
            </p>
            <p className="leading-relaxed mb-3">
              Since May 2018, the MOT testing system classifies defects into three categories: <strong className="text-slate-100">dangerous</strong> (an immediate risk to road safety — the vehicle must not be driven), <strong className="text-slate-100">major</strong> (a failure item that must be repaired before the vehicle can pass), and <strong className="text-slate-100">minor</strong> (a less serious issue that should be repaired but does not cause a failure). Before this date, items were simply recorded as passes, failures, or advisories.
            </p>
            <p className="leading-relaxed">
              Our free MOT check gives you the complete test history in seconds. Enter a registration number and you&apos;ll see every test result, the mileage recorded at each test, and all advisories and defects — making it an essential tool for anyone buying a used car or monitoring their own vehicle&apos;s condition.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What can you learn from MOT history?</h2>
            <p className="leading-relaxed mb-3">
              An MOT history check reveals far more than just whether a vehicle passed or failed. By examining the full timeline of test results, you can build a detailed picture of how the vehicle has been maintained — and spot warning signs that might not be obvious from a physical inspection alone.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Mileage discrepancies</strong> — Every MOT records the odometer reading, creating a mileage timeline. If the recorded mileage drops between tests, the odometer may have been tampered with. Average UK annual mileage is around 7,000 to 10,000 miles, so large jumps or unexpected drops are worth investigating.</li>
              <li><strong className="text-slate-100">Recurring problems</strong> — If the same component appears in advisories or failures year after year, it suggests the owner hasn&apos;t addressed the issue. Persistent brake, suspension, or corrosion problems can indicate neglect.</li>
              <li><strong className="text-slate-100">Advisory patterns</strong> — Check whether advisories noted in one year were resolved by the next test. A responsible owner addresses advisories before they become failures.</li>
              <li><strong className="text-slate-100">Failure history</strong> — A pattern of repeated failures, especially on safety-critical items like brakes, tyres, or lights, paints a very different picture to a vehicle with clean passes year after year.</li>
            </ul>
            <p className="leading-relaxed">
              You can also use the <a href="/mileage-check" className="text-blue-400 hover:text-blue-300">mileage check</a> to see odometer readings plotted across every MOT test, making it easier to spot clocking at a glance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Understanding MOT advisories</h2>
            <p className="leading-relaxed mb-3">
              An advisory is an item that the MOT tester has noted as not yet bad enough to fail the test, but that needs monitoring or attention. Advisories don&apos;t prevent a pass, but they give you valuable insight into what might need replacing or repairing in the near future.
            </p>
            <p className="leading-relaxed mb-3">
              Common advisory items include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li>Brake pads or discs wearing thin but still above the minimum limit</li>
              <li>Tyres approaching the legal tread depth limit of 1.6mm</li>
              <li>Minor corrosion on structural or body panels</li>
              <li>Slight oil leaks that haven&apos;t yet reached a level to cause a failure</li>
              <li>Worn suspension bushes or components with minor play</li>
              <li>Light scratches or damage to windscreen outside the driver&apos;s critical viewing area</li>
            </ul>
            <p className="leading-relaxed">
              If you see the same advisory appearing across multiple years of MOT tests, it likely means the owner has not addressed the issue. Recurring advisories are a red flag when buying a used car — they often point to deferred maintenance that could turn into costly repairs. For a deeper dive into what advisories mean, read our <a href="/blog/what-does-mot-advisory-mean" className="text-blue-400 hover:text-blue-300">guide to MOT advisories</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">When is an MOT due?</h2>
            <p className="leading-relaxed mb-3">
              Vehicles in the UK need their first MOT by the third anniversary of their date of registration. After that, an MOT is required every 12 months. You can check your vehicle&apos;s current MOT status and expiry date by entering the registration number on our homepage.
            </p>
            <p className="leading-relaxed mb-3">
              You can have your MOT carried out up to one month (minus a day) before the current certificate expires without losing any time — the new certificate will run from the existing expiry date, not the date of the test. This gives you flexibility to book ahead without penalty.
            </p>
            <p className="leading-relaxed">
              Vehicles over 40 years old that have not been substantially changed from their original specification may be exempt from the MOT requirement. This historic vehicle exemption has applied since May 2018. However, the vehicle must still be roadworthy if used on public roads.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What happens if you drive without an MOT?</h2>
            <p className="leading-relaxed mb-3">
              Driving without a valid MOT certificate is illegal and can result in a fine of up to &pound;1,000. Police can issue a fixed penalty notice on the spot, and ANPR (Automatic Number Plate Recognition) cameras across the UK actively flag vehicles without a valid MOT.
            </p>
            <p className="leading-relaxed mb-3">
              Beyond the fine, most car insurance policies require the vehicle to have a valid MOT. If you&apos;re involved in an accident while driving without an MOT, your insurer may refuse to pay out — leaving you personally liable for any damage or injury caused.
            </p>
            <p className="leading-relaxed">
              The only exception is driving directly to a pre-booked MOT test at a registered test centre. You can drive to the test without a valid MOT, but the vehicle must be insured and roadworthy, and you cannot make any other stops or detours along the way. You can also check your vehicle&apos;s <a href="/tax-check" className="text-blue-400 hover:text-blue-300">tax status</a> to make sure everything else is in order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">What does an MOT advisory mean?</h3>
                <p className="text-sm mt-1">An MOT advisory is a note about a component that isn&apos;t bad enough to cause a failure but needs monitoring. Common examples include brake pads wearing thin, tyres approaching the 1.6mm legal tread depth limit, or minor corrosion on structural components.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How far back does MOT history go?</h3>
                <p className="text-sm mt-1">MOT test results are available from 2005 onwards. The DVSA has digitally recorded every MOT test since then, including pass/fail results, mileage readings, advisories, and failure reasons.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Can I drive to an MOT test without a valid MOT?</h3>
                <p className="text-sm mt-1">Yes, you can drive directly to a pre-booked MOT test at a registered test centre without a valid MOT. However, the vehicle must be roadworthy and insured. You cannot make any detours — the journey must be directly to the test centre.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How much does an MOT cost?</h3>
                <p className="text-sm mt-1">The maximum fee for a car MOT is &pound;54.85, set by the DVSA. Many garages charge less than this as a competitive rate. The test itself takes around 45 minutes to an hour.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What&apos;s the difference between a dangerous, major, and minor defect?</h3>
                <p className="text-sm mt-1">Since May 2018, MOT defects are classified into three categories. A dangerous defect is an immediate risk to road safety and means the vehicle must not be driven. A major defect is a failure that needs repair before the vehicle can pass. A minor defect is a less serious issue that should be repaired but does not cause a failure.</p>
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
