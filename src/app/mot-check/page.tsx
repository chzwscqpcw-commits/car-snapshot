import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free MOT Check — Check MOT History by Reg | Free Plate Check",
  description:
    "Check any vehicle's MOT history free. See pass/fail results, advisories, mileage records and next MOT due date. Enter a registration number to get started.",
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
    title: "Free MOT Check — Check MOT History by Reg",
    description:
      "Check any vehicle's MOT history free. See pass/fail results, advisories, mileage records and next MOT due date.",
    url: "https://www.freeplatecheck.co.uk/mot-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
};

export default function MotCheckPage() {
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
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What does an MOT history check show?</h2>
            <p className="leading-relaxed mb-3">
              Our free MOT check gives you the complete test history for any UK vehicle registered since 2005. You&apos;ll see every test result — pass or fail — along with the date, recorded mileage, and any advisories or defects noted by the tester.
            </p>
            <p className="leading-relaxed">
              This includes major and dangerous defects, recurring advisories, and the mileage recorded at each test — which is invaluable for spotting odometer tampering.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why check MOT history?</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Buying a used car</strong> — Verify the vehicle&apos;s condition and spot red flags before you commit.</li>
              <li><strong className="text-slate-100">Checking mileage</strong> — MOT records create a mileage timeline that helps detect clocking.</li>
              <li><strong className="text-slate-100">Maintenance planning</strong> — See what advisories have been flagged so you know what&apos;s likely to need attention.</li>
              <li><strong className="text-slate-100">Peace of mind</strong> — Confirm your own car&apos;s history is clean and consistent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">Is the MOT check free?</h3>
                <p className="text-sm mt-1">Yes, completely free. No signup, no payment, no hidden charges.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How far back does MOT history go?</h3>
                <p className="text-sm mt-1">MOT test results are available from 2005 onwards for most vehicles.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Do I need to own the vehicle?</h3>
                <p className="text-sm mt-1">No. MOT history is public information. You can check any UK-registered vehicle.</p>
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
