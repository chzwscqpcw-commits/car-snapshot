import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Car Check — Vehicle Registration Lookup | Free Plate Check",
  description:
    "Run a free car check on any UK vehicle. See make, model, colour, engine size, fuel type, tax status and MOT history. Just enter the registration number.",
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
    title: "Free Car Check — Vehicle Registration Lookup",
    description:
      "Run a free car check on any UK vehicle. See make, model, colour, engine size, fuel type, tax status and MOT history.",
    url: "https://www.freeplatecheck.co.uk/car-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Car Check — Vehicle Registration Lookup",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Car Check — Vehicle Registration Lookup",
    description:
      "Run a free car check on any UK vehicle. See make, model, colour, engine size, fuel type, tax status and MOT history.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

export default function CarCheckPage() {
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
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What does a free car check include?</h2>
            <p className="leading-relaxed mb-3">
              Enter a registration number and you&apos;ll see the vehicle&apos;s key details: make, model, colour, year of manufacture, engine size, fuel type, CO2 emissions and more. All sourced from official DVLA data.
            </p>
            <p className="leading-relaxed">
              You&apos;ll also see the current tax and MOT status, full MOT history with advisories and mileage records, and practical checklists tailored to whether you&apos;re buying, selling or maintaining the vehicle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">When should you run a car check?</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Before buying a used car</strong> — Verify the advert matches the official records. Check mileage, MOT history and tax status.</li>
              <li><strong className="text-slate-100">Before selling your car</strong> — Know exactly what a buyer will find when they check your vehicle.</li>
              <li><strong className="text-slate-100">When your MOT or tax is due</strong> — Quick way to confirm dates and plan ahead.</li>
              <li><strong className="text-slate-100">Checking a parked vehicle</strong> — See if an abandoned or suspicious vehicle is taxed and MOT&apos;d.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Is it really free?</h2>
            <p className="leading-relaxed">
              Yes. Free Plate Check is completely free to use — no signup, no account, no payment required. We use official DVLA and MOT data to provide accurate vehicle information at no cost to you.
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
