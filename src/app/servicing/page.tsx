import type { Metadata } from "next";
import ServicingCTA from "@/components/ServicingCTA";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How often should I service my car?",
    answer:
      "Every 12 months or 12,000 miles — whichever comes first. Some modern cars use variable intervals based on conditions; check the manual.",
  },
  {
    question: "What's the difference between an interim and full service?",
    answer:
      "Interim covers the essentials — oil, fluids, basic safety check. Full adds air filter, fuel filter (diesel) or spark plugs (petrol), plus a thorough brake/suspension/exhaust/steering inspection.",
  },
  {
    question: "How much does a car service cost?",
    answer:
      "Interim £80–£150. Full £150–£300+. Luxury and performance cars cost more (specialist parts and labour). Compare quotes locally for the best price.",
  },
  {
    question: "Will using a non-dealer garage void my warranty?",
    answer:
      "No — under the Block Exemption Regulation, any VAT-registered garage can service your car without affecting warranty, as long as they use equivalent parts and follow the schedule.",
  },
  {
    question: "Is a service the same as an MOT?",
    answer:
      "No. MOT is a legal safety inspection required for cars 3+ years old. Service is preventative maintenance — oil, filters, fluids. You need both.",
  },
  {
    question: "What happens if I skip a service?",
    answer:
      "Accelerated engine wear, lower fuel efficiency, bigger bills later. Can void warranty and hurts resale — buyers check service history first.",
  },
];

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
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
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
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/tools"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to all tools
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
        <div className="mb-8">
          <ServicingCTA context="landing" />
        </div>

        <StatCallouts
          stats={[
            { value: "12 mo", label: "Typical interval" },
            { value: "£80-£300", label: "Interim → full service" },
            { value: "40-60%", label: "Independent vs dealer", tone: "good" },
          ]}
        />

        <div className="space-y-8 text-slate-300">
          {/* Service intervals */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">When does your car need a service?</h2>
            <p className="leading-relaxed mb-3">
              Most manufacturers recommend <strong className="text-slate-100">12 months or 12,000 miles</strong>, whichever first. Some modern cars use variable intervals — the dashboard light or owner&apos;s manual tells you when.
            </p>
            <p className="leading-relaxed">
              Lots of short trips, stop-start city driving, or heavy towing? Service more often to protect the engine and drivetrain.
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
              Prices vary by make, model, and location. Compare local quotes to avoid overpaying.
            </p>
          </section>

          {/* Why service matters */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why regular servicing matters</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Prevents expensive repairs</strong> — catching worn brake pads, belts, hoses early.</li>
              <li><strong className="text-slate-100">Keeps fuel efficiency up</strong> — fresh oil, clean filters, correct tyre pressures.</li>
              <li><strong className="text-slate-100">Protects warranty</strong> — Block Exemption rules mean any VAT-registered garage works.</li>
              <li><strong className="text-slate-100">Improves resale</strong> — full service history is the first thing buyers check.</li>
              <li><strong className="text-slate-100">Helps pass MOT</strong> — many MOT fails are routine service items left to fester.</li>
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
              Many garages offer a combined service + MOT discount. Worth bundling if both are due. Check the next MOT date via our <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a>.
            </p>
          </section>

          {/* Tips for saving */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to save money on servicing</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Compare quotes</strong> — prices vary widely between garages, even in the same area. Get 2–3.</li>
              <li><strong className="text-slate-100">Book online</strong> — usually cheaper than walk-ins.</li>
              <li><strong className="text-slate-100">Use independents</strong> — main dealer servicing is 40–60% more, with no warranty advantage.</li>
              <li><strong className="text-slate-100">Combine with MOT</strong> — often a package discount.</li>
              <li><strong className="text-slate-100">Don&apos;t skip the interim</strong> — £100 every 6 months beats the engine damage from neglected oil.</li>
            </ol>
          </section>

          {/* Second CTA */}
          <section>
            <ServicingCTA context="generic" />
          </section>

          {/* FAQ section */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
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
          <a href="/repair-costs" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Car Repair Cost Guides</p>
            <p className="text-xs text-slate-500 mt-2">Free UK price guides for cambelt, DPF, aircon, brakes, battery and clutch.</p>
          </a>
          <a href="/blog/mot-vs-service" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">MOT vs Service Guide</p>
            <p className="text-xs text-slate-500 mt-2">Understand what's covered by each — and whether to combine them.</p>
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
