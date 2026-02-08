import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Car Tax Check — Is My Car Taxed? | Free Plate Check",
  description:
    "Check if any UK vehicle is taxed. See current tax status, expiry date and whether a SORN is in place. Free, instant, no signup required.",
  keywords: [
    "car tax check",
    "is my car taxed",
    "check vehicle tax",
    "tax check by reg",
    "DVLA tax check",
    "vehicle tax status",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/tax-check",
  },
  openGraph: {
    title: "Free Car Tax Check — Is My Car Taxed?",
    description:
      "Check if any UK vehicle is taxed. See current tax status, expiry date and whether a SORN is in place. Free and instant.",
    url: "https://www.freeplatecheck.co.uk/tax-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Car Tax Check — Is My Car Taxed?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Car Tax Check — Is My Car Taxed?",
    description:
      "Check if any UK vehicle is taxed. See current tax status, expiry date and whether a SORN is in place. Free and instant.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

export default function TaxCheckPage() {
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
            Free Car Tax Check
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Check if any UK vehicle is currently taxed, SORN&apos;d or untaxed.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Check a vehicle&apos;s tax status now
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter any UK registration number to see tax status and expiry date instantly.
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
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What does a car tax check show?</h2>
            <p className="leading-relaxed mb-3">
              Our free tax check shows you the current Vehicle Excise Duty (VED) status for any UK-registered vehicle. You&apos;ll see whether the vehicle is taxed, when the tax expires, and whether a SORN declaration is in place.
            </p>
            <p className="leading-relaxed">
              This is especially useful when buying a used car — remember, tax doesn&apos;t transfer with a sale, so you&apos;ll need to tax the vehicle yourself before driving it away.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Tax statuses explained</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Taxed</strong> — The vehicle has valid tax and is legal to drive on public roads.</li>
              <li><strong className="text-slate-100">SORN</strong> — The vehicle has been declared off the road. It cannot be driven or kept on a public road.</li>
              <li><strong className="text-slate-100">Untaxed</strong> — Tax has expired and no SORN has been made. This is an offence and can result in fines.</li>
              <li><strong className="text-slate-100">Tax not due</strong> — The vehicle is exempt from VED (e.g. historic vehicles or certain zero-emission cars).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why check tax status?</h2>
            <p className="leading-relaxed mb-3">
              Driving without valid tax can result in a fine of up to £1,000, and the DVLA can clamp or impound your vehicle. Since there&apos;s no physical tax disc anymore, the only way to confirm a vehicle&apos;s tax status is to check online.
            </p>
            <p className="leading-relaxed">
              If you&apos;re buying a used car, always check the tax status before agreeing to a sale. If you see a potentially abandoned vehicle on your street, a quick tax check can help you decide whether to report it to the council.
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
