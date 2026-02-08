import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Mileage Check — Car Mileage History by Reg | Free Plate Check",
  description:
    "Check a vehicle's recorded mileage history free. See odometer readings from every MOT test to spot clocking and verify genuine mileage. No signup required.",
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
    title: "Free Mileage Check — Car Mileage History by Reg",
    description:
      "Check a vehicle's recorded mileage history free. See odometer readings from every MOT test to spot clocking and verify genuine mileage.",
    url: "https://www.freeplatecheck.co.uk/mileage-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Mileage Check — Car Mileage History by Reg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Mileage Check — Car Mileage History by Reg",
    description:
      "Check a vehicle's recorded mileage history free. See odometer readings from every MOT test to spot clocking and verify genuine mileage.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

export default function MileageCheckPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How does a mileage check work?</h2>
            <p className="leading-relaxed mb-3">
              Every time a vehicle has an MOT test, the odometer reading is recorded. Our mileage check shows you every recorded reading since 2005, creating a timeline that reveals how the vehicle has been used.
            </p>
            <p className="leading-relaxed">
              You&apos;ll see the mileage at each test date, the average annual mileage, and — critically — whether the mileage has ever decreased between tests, which is a strong indicator of odometer tampering (clocking).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why check mileage history?</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Spot clocking</strong> — Mileage fraud affects an estimated 1 in 16 used cars in the UK. A mileage check is your best defence.</li>
              <li><strong className="text-slate-100">Verify seller claims</strong> — If the advert says 40,000 miles but the MOT records show 70,000, you&apos;ll know immediately.</li>
              <li><strong className="text-slate-100">Assess wear and tear</strong> — High-mileage cars may need more maintenance. Low-mileage cars that sat unused can have their own issues.</li>
              <li><strong className="text-slate-100">Negotiate price</strong> — Accurate mileage data helps you determine a fair price.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What to look for</h2>
            <p className="leading-relaxed mb-3">
              A healthy mileage history shows steady, consistent increases — typically 7,000 to 10,000 miles per year for an average UK car. Watch out for sudden drops (possible clocking), unusually low annual mileage (the car may have sat unused), or large jumps that don&apos;t match the vehicle&apos;s typical usage pattern.
            </p>
            <p className="leading-relaxed">
              Our tool automatically flags mileage anomalies and calculates the average annual mileage, so you can assess a vehicle&apos;s history at a glance.
            </p>
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
