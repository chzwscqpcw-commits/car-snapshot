import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free ULEZ Check — Is My Car ULEZ Compliant? | Free Plate Check",
  description:
    "Check if your car is ULEZ compliant for free. See Euro status, Clean Air Zone charges and exemptions. Enter a registration number to check instantly.",
  keywords: [
    "ULEZ check",
    "is my car ULEZ compliant",
    "free ULEZ check",
    "clean air zone check",
    "ULEZ compliant",
    "London ULEZ",
    "ULEZ checker",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/ulez-check",
  },
  openGraph: {
    title: "Free ULEZ Check — Is My Car ULEZ Compliant?",
    description:
      "Check if your car is ULEZ compliant for free. See Euro status, Clean Air Zone charges and exemptions. Enter a registration number to check instantly.",
    url: "https://www.freeplatecheck.co.uk/ulez-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free ULEZ Check — Is My Car ULEZ Compliant?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free ULEZ Check — Is My Car ULEZ Compliant?",
    description:
      "Check if your car is ULEZ compliant for free. See Euro status, Clean Air Zone charges and exemptions. Enter a registration number to check instantly.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

export default function UlezCheckPage() {
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — ULEZ Compliance Check",
    url: "https://www.freeplatecheck.co.uk/ulez-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Check if your vehicle meets ULEZ emission standards for free. See Euro status and Clean Air Zone charges instantly.",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
          "@type": "Question",
          name: "Is the ULEZ check free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free. No signup, no payment, no hidden charges. Enter any UK registration number and we will show you the vehicle's Euro emission standard and ULEZ compliance status instantly.",
          },
        },
        {
          "@type": "Question",
          name: "What Euro standard do I need to be ULEZ compliant?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Petrol vehicles need to meet Euro 4 or later (generally from 2006 onwards). Diesel vehicles need to meet Euro 6 or later (generally from September 2015 onwards). Electric and hydrogen fuel cell vehicles are exempt from ULEZ charges.",
          },
        },
        {
          "@type": "Question",
          name: "Does ULEZ apply outside London?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "London has the ULEZ, but other UK cities operate their own Clean Air Zones (CAZs) with similar emission-based charging. Cities including Birmingham, Bath, Bradford, Bristol, and Sheffield have active or planned Clean Air Zones with varying requirements.",
          },
        },
        {
          "@type": "Question",
          name: "How much is the ULEZ charge?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The ULEZ daily charge is £12.50 for non-compliant cars, motorcycles, and vans. Failure to pay results in a penalty charge notice of £180, reduced to £90 if paid within 14 days. The charge applies every day the vehicle is driven within the zone.",
          },
        },
        {
          "@type": "Question",
          name: "Are hybrid cars ULEZ exempt?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hybrid cars are not automatically exempt. They must still meet the relevant Euro emission standard — Euro 4 for petrol hybrids or Euro 6 for diesel hybrids. Most modern hybrids meet these standards, but older models may not. Check by entering your registration number.",
          },
        },
        {
          "@type": "Question",
          name: "Do other cities have clean air zones?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Birmingham, Bath, Bradford, Bristol, Portsmouth, and Sheffield have implemented or planned Clean Air Zones with similar emission-based charging. The specific standards and charges vary by city, but the Euro emission standards used are generally the same as ULEZ.",
          },
        },
      ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
            Free ULEZ Compliance Check
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Check if any UK vehicle is ULEZ compliant using just the registration number.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Check a vehicle&apos;s ULEZ compliance now
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter any UK registration number on our homepage to see Euro emission status and ULEZ compliance instantly.
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
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is ULEZ?</h2>
            <p className="leading-relaxed mb-3">
              The Ultra Low Emission Zone (ULEZ) is a charging zone in London designed to reduce air pollution by discouraging the most polluting vehicles from driving in the area. Since 29 August 2023, ULEZ covers all London boroughs — meaning every road within the Greater London boundary is included.
            </p>
            <p className="leading-relaxed mb-3">
              Vehicles that do not meet the required emission standards are charged a daily fee to drive within the zone. The scheme is enforced 24 hours a day, 365 days a year, using automatic number plate recognition (ANPR) cameras throughout London.
            </p>
            <p className="leading-relaxed">
              London is not the only city with emission-based charging. Other UK cities have introduced Clean Air Zones (CAZs) with similar rules. Birmingham, Bath, Bradford, Bristol, and Sheffield all operate or have planned Clean Air Zones, each with their own boundaries and vehicle requirements. Our free check helps you understand whether your vehicle meets the emission standards used across these schemes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">ULEZ charges and exemptions</h2>
            <p className="leading-relaxed mb-3">
              The London ULEZ daily charge is <strong className="text-slate-100">&pound;12.50</strong> for cars, motorcycles, and vans that do not meet the emission standards. This applies every day the vehicle is driven within the zone. Failure to pay results in a penalty charge notice of &pound;180 (reduced to &pound;90 if paid within 14 days).
            </p>
            <p className="leading-relaxed mb-3">
              Other UK Clean Air Zones have their own charging structures. Birmingham charges up to &pound;8 per day for non-compliant cars, while Bath and Bristol have similar schemes targeting older, more polluting vehicles.
            </p>
            <p className="leading-relaxed mb-4">
              To be ULEZ compliant, your vehicle generally needs to meet these standards:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li><strong className="text-slate-100">Petrol vehicles</strong> — Euro 4 or later (typically vehicles registered from around 2006 onwards).</li>
              <li><strong className="text-slate-100">Diesel vehicles</strong> — Euro 6 or later (typically vehicles registered from September 2015 onwards).</li>
              <li><strong className="text-slate-100">Electric &amp; hydrogen</strong> — Fully exempt. Zero-emission vehicles do not pay the ULEZ charge.</li>
              <li><strong className="text-slate-100">Historic vehicles</strong> — Vehicles manufactured before 1 January 1973 and registered as historic are exempt from the charge.</li>
            </ul>
            <p className="leading-relaxed">
              Some vehicles also qualify for discounts, exemptions, or grace periods — for example, disabled tax class vehicles and certain military vehicles. Our check shows you the Euro emission standard recorded against your vehicle so you can quickly determine compliance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to check your vehicle</h2>
            <p className="leading-relaxed mb-3">
              Checking your vehicle&apos;s ULEZ compliance with Free Plate Check takes seconds. Simply enter your registration number on our homepage and we will show you the vehicle&apos;s recorded Euro emission standard alongside its tax, MOT, and specification data.
            </p>
            <p className="leading-relaxed">
              If your vehicle is listed as Euro 4 or later (petrol) or Euro 6 or later (diesel), it meets the ULEZ standard. Electric and hydrogen vehicles are automatically compliant. No signup or payment is required — our check is completely free. You can also see the full vehicle specification including Euro emission standard on our <a href="/car-check" className="text-blue-400 hover:text-blue-300">free car check</a> page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">Is the ULEZ check free?</h3>
                <p className="text-sm mt-1">Yes, completely free. No signup, no payment, no hidden charges. Enter any UK registration number and we will show you the vehicle&apos;s Euro emission standard and ULEZ compliance status instantly.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What Euro standard do I need to be ULEZ compliant?</h3>
                <p className="text-sm mt-1">Petrol vehicles need to meet Euro 4 or later (generally from 2006 onwards). Diesel vehicles need to meet Euro 6 or later (generally from September 2015 onwards). Electric and hydrogen fuel cell vehicles are exempt from ULEZ charges.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Does ULEZ apply outside London?</h3>
                <p className="text-sm mt-1">London has the ULEZ, but other UK cities operate their own Clean Air Zones (CAZs) with similar emission-based charging. Cities including Birmingham, Bath, Bradford, Bristol, and Sheffield have active or planned Clean Air Zones with varying requirements.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How much is the ULEZ charge?</h3>
                <p className="text-sm mt-1">The ULEZ daily charge is &pound;12.50 for non-compliant cars, motorcycles, and vans. Failure to pay results in a penalty charge notice of &pound;180, reduced to &pound;90 if paid within 14 days. The charge applies every day the vehicle is driven within the zone.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Are hybrid cars ULEZ exempt?</h3>
                <p className="text-sm mt-1">Hybrid cars are not automatically exempt. They must still meet the relevant Euro emission standard — Euro 4 for petrol hybrids or Euro 6 for diesel hybrids. Most modern hybrids meet these standards, but older models may not. Check by entering your registration number.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Do other cities have clean air zones?</h3>
                <p className="text-sm mt-1">Yes. Birmingham, Bath, Bradford, Bristol, Portsmouth, and Sheffield have implemented or planned Clean Air Zones with similar emission-based charging. The specific standards and charges vary by city, but the Euro emission standards used are generally the same as ULEZ.</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              For a comprehensive guide to ULEZ compliance, read our <a href="/blog/is-my-car-ulez-compliant" className="text-blue-400 hover:text-blue-300">complete ULEZ guide</a>.
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
