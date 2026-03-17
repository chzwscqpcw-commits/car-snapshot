import type { Metadata } from "next";
import ServicingCTA from "@/components/ServicingCTA";

export const metadata: Metadata = {
  title: "Car Service Prices UK — Compare Quotes Near You | Free Plate Check",
  description:
    "Compare car service prices from local garages. Interim and full service quotes in seconds. No booking fees, no obligation. Enter your reg to get started.",
  keywords: [
    "car service near me",
    "car service cost",
    "car service prices",
    "car servicing UK",
    "interim service",
    "full service car",
    "compare car service quotes",
    "car service booking",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/servicing",
  },
  openGraph: {
    title: "Car Service Prices UK — Compare Quotes Near You",
    description:
      "Compare car service prices from local garages. Interim and full service quotes in seconds.",
    url: "https://www.freeplatecheck.co.uk/servicing",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Service Prices UK — Compare Quotes Near You",
    description:
      "Compare car service prices from local garages. Interim and full service quotes in seconds.",
  },
};

export default function ServicingPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How often should I service my car?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most manufacturers recommend a service every 12 months or 12,000 miles, whichever comes first. Some modern cars have variable service intervals based on driving conditions — check your owner's manual or service book for your specific schedule.",
        },
      },
      {
        "@type": "Question",
        name: "What is the difference between an interim and full service?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An interim service covers the essentials — oil and oil filter change, fluid top-ups, and a basic safety check. It's typically done at 6 months or 6,000 miles. A full service includes everything in an interim service plus air filter, fuel filter (diesel), spark plugs (petrol), a more thorough inspection of brakes, suspension, exhaust, and steering, and usually takes 2–3 hours.",
        },
      },
      {
        "@type": "Question",
        name: "How much does a car service cost in the UK?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An interim service typically costs between £80 and £150. A full service ranges from £150 to £300+, depending on the make, model, and location. Luxury and performance cars cost more due to specialist parts and labour. Comparing quotes from local garages is the easiest way to find a competitive price.",
        },
      },
      {
        "@type": "Question",
        name: "Will servicing at a non-dealer garage void my warranty?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Under the Block Exemption Regulation (BER), you can have your car serviced at any VAT-registered garage without voiding your manufacturer warranty, as long as the work is carried out to the manufacturer's specifications using parts of matching quality. The dealer cannot refuse a warranty claim simply because the car was serviced elsewhere.",
        },
      },
      {
        "@type": "Question",
        name: "Is a car service the same as an MOT?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. An MOT is a legal inspection that checks your car meets minimum road safety and emissions standards — it's required by law for cars over 3 years old. A service is preventative maintenance: changing oil, filters, and fluids, and checking wear items to keep the car running well. You need both, but they serve different purposes.",
        },
      },
      {
        "@type": "Question",
        name: "What happens if I skip a car service?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Skipping services can lead to accelerated wear on engine components, reduced fuel efficiency, and higher repair costs down the line. It can also void your manufacturer warranty and reduce the car's resale value. A full service history is one of the first things buyers check.",
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
        name: "Car Servicing",
        item: "https://www.freeplatecheck.co.uk/servicing",
      },
    ],
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Car Service Price Comparison",
    url: "https://www.freeplatecheck.co.uk/servicing",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Compare car service prices from local garages across the UK. Enter your registration to get instant quotes.",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to Free Plate Check
          </a>
          <h1 className="text-3xl font-bold text-slate-100">
            Compare Car Service Prices
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Get instant quotes from local garages — no booking fees, no obligation.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Primary CTA */}
        <div className="mb-12">
          <ServicingCTA context="landing" />
        </div>

        <div className="space-y-8 text-slate-300">
          {/* Service intervals */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">When does your car need a service?</h2>
            <p className="leading-relaxed mb-3">
              Most manufacturers recommend servicing every <strong className="text-slate-100">12 months or 12,000 miles</strong>, whichever comes first. Some modern vehicles use variable service intervals that adapt based on driving style and conditions — your dashboard service light or owner&apos;s manual will tell you when it&apos;s due.
            </p>
            <p className="leading-relaxed">
              If you do a lot of short trips, stop-start city driving, or tow heavy loads, more frequent servicing helps protect the engine and drivetrain from accelerated wear.
            </p>
          </section>

          {/* Types of service */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Interim vs full service — what&apos;s included?</h2>

            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
                <h3 className="font-semibold text-slate-100 mb-2">Interim service</h3>
                <p className="text-xs text-slate-400 mb-3">Every 6 months / 6,000 miles</p>
                <ul className="text-sm space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Oil &amp; oil filter change</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Top up all fluids</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Tyre condition &amp; pressure check</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Brake inspection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Lights &amp; wipers check</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-500 mt-3">Typical cost: £80 – £150</p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
                <h3 className="font-semibold text-slate-100 mb-2">Full service</h3>
                <p className="text-xs text-slate-400 mb-3">Every 12 months / 12,000 miles</p>
                <ul className="text-sm space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Everything in an interim service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Air filter replacement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Fuel filter (diesel) / spark plugs (petrol)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Brake, suspension &amp; exhaust inspection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Steering &amp; drivetrain checks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>Battery condition test</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-500 mt-3">Typical cost: £150 – £300+</p>
              </div>
            </div>

            <p className="leading-relaxed text-sm">
              Prices vary by make, model, and location. Luxury and performance vehicles tend to cost more due to specialist parts and longer labour times. Comparing quotes is the easiest way to avoid overpaying.
            </p>
          </section>

          {/* Why service matters */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why regular servicing matters</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Prevents expensive repairs</strong> — Catching worn components early (brake pads, belts, hoses) avoids bigger failures down the line.</li>
              <li><strong className="text-slate-100">Maintains fuel efficiency</strong> — Fresh oil, clean filters, and correct tyre pressures keep running costs down.</li>
              <li><strong className="text-slate-100">Protects your warranty</strong> — Staying on schedule maintains manufacturer warranty coverage. Under the Block Exemption Regulation, you don&apos;t have to use the dealer — any VAT-registered garage using equivalent parts is fine.</li>
              <li><strong className="text-slate-100">Improves resale value</strong> — A full service history is one of the first things buyers check. Gaps in the record lower the car&apos;s value.</li>
              <li><strong className="text-slate-100">Helps pass the MOT</strong> — Many MOT failures are for items that a regular service would catch: worn brakes, blown bulbs, low fluid levels, perished wipers.</li>
            </ul>
          </section>

          {/* Service vs MOT */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Service vs MOT — what&apos;s the difference?</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 pr-4 text-slate-400 font-medium"></th>
                    <th className="text-left py-2 pr-4 text-slate-100 font-medium">Service</th>
                    <th className="text-left py-2 text-slate-100 font-medium">MOT</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-slate-400">Purpose</td>
                    <td className="py-2 pr-4">Preventative maintenance</td>
                    <td className="py-2">Legal safety &amp; emissions inspection</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-slate-400">Required by law?</td>
                    <td className="py-2 pr-4">No (but recommended)</td>
                    <td className="py-2">Yes — vehicles over 3 years old</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-slate-400">Frequency</td>
                    <td className="py-2 pr-4">Every 6–12 months</td>
                    <td className="py-2">Every 12 months</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-slate-400">What it covers</td>
                    <td className="py-2 pr-4">Oil, filters, fluids, wear items</td>
                    <td className="py-2">Brakes, lights, emissions, structure</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-slate-400">Typical cost</td>
                    <td className="py-2 pr-4">£80 – £300+</td>
                    <td className="py-2">Up to £54.85</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-4 leading-relaxed">
              Many garages offer combined service and MOT packages at a discount. If both are due around the same time, booking them together can save money and means you only need one trip to the garage. Check your vehicle&apos;s <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> to see when the next test is due.
            </p>
          </section>

          {/* Tips for saving */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to save money on car servicing</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Compare quotes</strong> — Prices vary significantly between garages, even in the same area. Always get at least 2–3 quotes.</li>
              <li><strong className="text-slate-100">Book online</strong> — Many garages offer lower prices for online bookings compared to walk-ins.</li>
              <li><strong className="text-slate-100">Use independent garages</strong> — Main dealer servicing typically costs 40–60% more than an equivalent independent garage, with no difference in warranty protection.</li>
              <li><strong className="text-slate-100">Combine with MOT</strong> — Booking your service and MOT together often qualifies for a package discount.</li>
              <li><strong className="text-slate-100">Don&apos;t skip the interim</strong> — A £100 interim service every 6 months is cheaper than the engine damage caused by neglected oil changes.</li>
            </ol>
          </section>

          {/* Second CTA */}
          <section>
            <ServicingCTA context="generic" />
          </section>

          {/* FAQ section */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">How often should I service my car?</h3>
                <p className="text-sm mt-1">Most manufacturers recommend every 12 months or 12,000 miles, whichever comes first. Some modern cars use variable intervals based on driving conditions — check your owner&apos;s manual.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What&apos;s the difference between an interim and full service?</h3>
                <p className="text-sm mt-1">An interim service covers the essentials — oil change, fluid top-ups, and a basic safety check. A full service adds air filter, fuel filter (diesel), spark plugs (petrol), and a more thorough inspection of brakes, suspension, exhaust, and steering.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How much does a car service cost?</h3>
                <p className="text-sm mt-1">An interim service typically costs £80–£150. A full service ranges from £150–£300+, depending on the vehicle and location. Comparing quotes is the best way to find a competitive price.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Will using a non-dealer garage void my warranty?</h3>
                <p className="text-sm mt-1">No. Under the Block Exemption Regulation, any VAT-registered garage can service your car without affecting the manufacturer warranty, as long as they use parts of matching quality and follow the service schedule.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Is a service the same as an MOT?</h3>
                <p className="text-sm mt-1">No. An MOT is a legal safety inspection required for cars over 3 years old. A service is preventative maintenance — oil, filters, and fluid changes to keep the car running well. You need both.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What happens if I skip a service?</h3>
                <p className="text-sm mt-1">Skipping services leads to accelerated engine wear, reduced fuel efficiency, and higher repair bills. It can also void your warranty and reduce the car&apos;s resale value.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Related links */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related tools</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/mot-check" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free MOT History Check</p>
            <p className="text-xs text-slate-500 mt-2">See every MOT result, advisory and failure since 2005.</p>
          </a>
          <a href="/mot-reminder" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free MOT Reminder</p>
            <p className="text-xs text-slate-500 mt-2">Get an email 28 days and 7 days before your MOT expires.</p>
          </a>
          <a href="/running-costs" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Running Costs Calculator</p>
            <p className="text-xs text-slate-500 mt-2">Estimate annual fuel, tax, insurance, and servicing costs.</p>
          </a>
          <a href="/car-valuation" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free Car Valuation</p>
            <p className="text-xs text-slate-500 mt-2">Get an instant estimated value based on real market data.</p>
          </a>
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
