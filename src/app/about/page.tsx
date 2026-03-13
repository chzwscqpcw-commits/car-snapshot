import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Free Plate Check | Free UK Vehicle Check Service",
  description:
    "Free Plate Check provides instant MOT history, tax status, mileage records, ULEZ compliance, safety recalls, and valuations for any UK vehicle. No signup required.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/about",
  },
  openGraph: {
    title: "About Free Plate Check | Free UK Vehicle Check Service",
    description:
      "Free instant vehicle checks for UK cars. MOT history, tax status, mileage, ULEZ compliance, safety recalls, valuations, and downloadable PDF reports.",
    url: "https://www.freeplatecheck.co.uk/about",
    siteName: "Free Plate Check",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Plate Check — Free UK Vehicle Check Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Free Plate Check | Free UK Vehicle Check Service",
    description:
      "Free instant vehicle checks for UK cars. MOT history, tax status, mileage, ULEZ compliance, safety recalls, valuations, and downloadable PDF reports.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      name: "About Free Plate Check",
      description:
        "Free Plate Check provides instant MOT history, tax status, mileage records, ULEZ compliance, safety recalls, and valuations for any UK vehicle.",
      url: "https://www.freeplatecheck.co.uk/about",
      mainEntity: {
        "@type": "WebSite",
        name: "Free Plate Check",
        url: "https://www.freeplatecheck.co.uk",
      },
    },
    {
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
          name: "About",
          item: "https://www.freeplatecheck.co.uk/about",
        },
      ],
    },
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            &larr; Back to Free Plate Check
          </a>
          <h1 className="text-3xl font-bold text-slate-100">About Free Plate Check</h1>
          <p className="text-sm text-slate-400 mt-2">Free vehicle checks for UK cars</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none space-y-8 text-slate-300">

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What Free Plate Check Does</h2>
            <p>
              Free Plate Check is a <strong>free vehicle check service for UK cars</strong>. Enter any UK registration
              number and get an instant, comprehensive report covering MOT history, tax status, mileage records,
              ULEZ compliance, safety recalls, vehicle valuations, running costs, and more.
            </p>
            <p>
              There is no signup required and no hidden fees. You can also download a full PDF report to take with
              you when viewing a car or to keep for your records.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Where the Data Comes From</h2>
            <p>
              All data displayed on Free Plate Check is sourced from <strong>official UK government APIs and
              trusted databases</strong>. We do not fabricate or estimate core vehicle data — it comes directly
              from the following sources:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-4">
              <li>
                <strong>DVLA Vehicle Enquiry Service</strong> — Vehicle details including make, model, colour,
                engine size, fuel type, date of first registration, and current tax status
              </li>
              <li>
                <strong>DVSA MOT History API</strong> — Full MOT test history including pass/fail results,
                advisories, failure reasons, and recorded mileage at each test
              </li>
              <li>
                <strong>DVSA Safety Recall Database</strong> — Known safety recalls issued by manufacturers,
                matched to your vehicle&apos;s make and model
              </li>
              <li>
                <strong>Government Emission Data</strong> — Used to calculate ULEZ compliance based on your
                vehicle&apos;s Euro emission standard and fuel type
              </li>
              <li>
                <strong>eBay Browse API</strong> — Real market listing data used to support vehicle valuations,
                combined with depreciation modelling
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why It&apos;s Free</h2>
            <p>
              Free Plate Check is free to use and always will be. We believe everyone should have access to
              essential vehicle information without having to pay for it.
            </p>
            <p>
              The service is supported by <strong>affiliate partnerships</strong>. For example, when we link to
              garage booking services or vehicle history check providers, we may earn a small commission if you
              choose to use them. This is how we keep the lights on.
            </p>
            <p>
              We do <strong>not</strong> sell your personal data, and we do not charge for any of the information
              displayed on this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Privacy Commitment</h2>
            <p>
              Your privacy matters. Free Plate Check follows a <strong>privacy-first approach</strong>:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-4">
              <li>We do <strong>not</strong> store registration numbers from vehicle lookups</li>
              <li>We do <strong>not</strong> track which vehicles individual users look up</li>
              <li>We do <strong>not</strong> sell or share your personal data</li>
            </ul>
            <p className="mt-4">
              For full details, read our{" "}
              <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                Privacy Policy
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What You Can Check</h2>
            <p>
              Every vehicle check on Free Plate Check includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-4">
              <li><strong>MOT History</strong> — Full test history with pass/fail results, advisories, and failure items</li>
              <li><strong>Tax Status</strong> — Current vehicle tax status and expiry date</li>
              <li><strong>Mileage Verification</strong> — Recorded mileage at each MOT test to spot anomalies</li>
              <li><strong>ULEZ Compliance</strong> — Check if a vehicle meets Ultra Low Emission Zone standards</li>
              <li><strong>Safety Recalls</strong> — Known manufacturer safety recalls matched to the vehicle</li>
              <li><strong>Vehicle Valuation</strong> — Estimated market value based on depreciation and real listings</li>
              <li><strong>Running Costs</strong> — Estimated annual fuel, tax, and insurance costs</li>
              <li><strong>NCAP Safety Ratings</strong> — Euro NCAP crash test ratings where available</li>
              <li><strong>PDF Report</strong> — Download a full vehicle report to keep or share</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Contact</h2>
            <p>
              Questions or feedback? Email us at{" "}
              <a href="mailto:hello@freeplatecheck.co.uk" className="text-blue-400 hover:text-blue-300 underline">
                hello@freeplatecheck.co.uk
              </a>
            </p>
          </section>

        </div>
      </div>

      {/* Footer */}
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
