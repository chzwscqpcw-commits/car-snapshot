import type { Metadata } from "next";
import MotPriceFinder from "@/components/MotPriceFinder";
import MOTBookingCTA from "@/components/MOTBookingCTA";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";
import SeverityCards from "@/components/SeverityCards";

// Single source of truth for FAQ content — used both for the visible
// accordion and the FAQPage JSON-LD below.
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is the cheapest an MOT can be?",
    answer:
      "There's no legal minimum — only a maximum of £54.85 for a Class 4 car. Independent garages often charge £30–£45, and some chains run promotional MOTs as low as £20–£25 to win your business (hoping you'll book repairs or a service with them too). Comparing local garages is the only way to see who's cheapest near you.",
  },
  {
    question: "Why are some MOTs so cheap?",
    answer:
      "A cheap or even free MOT is usually a loss-leader: the garage makes its money on any repairs, servicing or future visits. The test itself is identical wherever you go — it follows the same DVSA standard and is logged to the same national database — so a £25 MOT is exactly as valid as a £54.85 one.",
  },
  {
    question: "Is a cheap MOT lower quality than an expensive one?",
    answer:
      "No. Every MOT follows the same DVSA inspection manual and the tester records the result on the same government system. A garage cannot legally do a 'lighter' test for less money. What varies is repair labour rates if your car fails — so it's worth checking those too, not just the headline test price.",
  },
  {
    question: "Can I get a free MOT?",
    answer:
      "Sometimes. Garages offer free MOTs as a promotion, often bundled with a paid service. You may also qualify for a free partial retest if your car fails and you fix the faults within 10 working days. Always confirm what's included before booking a 'free' MOT — the saving can disappear if it's tied to expensive add-ons.",
  },
  {
    question: "How much does an MOT cost in 2026?",
    answer:
      "The maximum fee for a Class 4 vehicle (most cars) is £54.85, set by the DVSA and unchanged for years. Many garages charge below it. Motorcycles are capped lower (£29.65) and larger vans (Class 7) higher (£58.60).",
  },
  {
    question: "Does booking through Free Plate Check cost more?",
    answer:
      "No. Comparing and booking through us is free and the price you pay the garage is exactly the same as going direct. We earn a small affiliate commission from BookMyGarage when you book — it never changes your price.",
  },
];

export const metadata: Metadata = {
  title: "Cheap MOT Near You — Compare Local Garage Prices 2026 | Free Plate Check",
  description:
    "Find a cheap MOT near you. Compare local garage prices in seconds — many charge well below the £54.85 legal maximum. Free comparison, no signup, no email.",
  keywords: [
    "cheap MOT",
    "cheap MOT near me",
    "discount MOT",
    "MOT prices",
    "compare MOT prices",
    "MOT cost near me",
    "MOT deals",
    "cheapest MOT",
    "MOT offers",
    "book MOT online",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/cheap-mot",
  },
  openGraph: {
    title: "Cheap MOT Near You — Compare Local Garage Prices",
    description:
      "Compare local MOT prices in seconds — many garages charge well below the £54.85 legal maximum. Free, no signup.",
    url: "https://www.freeplatecheck.co.uk/cheap-mot",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cheap MOT Near You — Compare Local Garage Prices",
    description:
      "Compare local MOT prices in seconds — many garages charge well below the £54.85 legal maximum.",
  },
};

export default function CheapMotPage() {
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
        name: "Cheap MOT — Compare Prices",
        item: "https://www.freeplatecheck.co.uk/cheap-mot",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  // Service schema — appropriate for a commercial booking/comparison surface
  // (vs the WebApplication schema used on the data-lookup tool pages). The
  // priceSpecification anchors the regulated £0–£54.85 MOT price band.
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "MOT test price comparison and booking",
    name: "Compare cheap MOT prices near you",
    provider: {
      "@type": "Organization",
      name: "Free Plate Check",
      url: "https://www.freeplatecheck.co.uk",
    },
    areaServed: { "@type": "Country", name: "United Kingdom" },
    description:
      "Compare MOT prices from local garages across the UK. Many charge below the £54.85 legal maximum. Free comparison, no signup.",
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "GBP",
        minPrice: "0",
        maxPrice: "54.85",
      },
    },
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

      {/* --- HERO --- */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-6 lg:pb-10">
          <a
            href="/tools"
            className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block"
          >
            &larr; Back to all tools
          </a>

          <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-10 lg:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 leading-tight">
                Cheap MOT near you
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                Compare MOT prices from local garages in seconds. The legal
                maximum is <strong className="text-slate-100">&pound;54.85</strong>{" "}
                &mdash; but many garages charge a lot less, and the test is
                identical wherever you go.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-400">
                {[
                  "Compare local garage prices — many beat the £54.85 cap",
                  "Same DVSA test everywhere — cheaper doesn't mean lighter",
                  "Free comparison, no signup, no email",
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tool-first: price finder sits in the hero on desktop, directly
                under the headline on mobile. */}
            <div className="mt-6 lg:mt-0">
              <MotPriceFinder source="cheap_mot_hero" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8 pb-12 sm:py-12">
        <StatCallouts
          stats={[
            { value: "£54.85", label: "Legal max (Class 4)" },
            { value: "from ~£30", label: "Typical local price", tone: "good" },
            { value: "£0", label: "Free retest if fixed in 10 days", tone: "good" },
          ]}
        />

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How much should an MOT cost?</h2>
            <p className="leading-relaxed mb-3">
              The MOT fee is capped, not fixed. The DVSA sets a{" "}
              <strong className="text-slate-100">maximum of &pound;54.85</strong>{" "}
              for a Class 4 vehicle (most cars and small vans), and garages are
              free to charge anything up to that. In practice, plenty charge well
              below it &mdash; independents are often &pound;30&ndash;&pound;45,
              and some test centres run promotional MOTs as low as
              &pound;20&ndash;&pound;25.
            </p>
            <p className="leading-relaxed">
              Other classes are capped differently: motorcycles at &pound;29.65,
              and larger vans (Class 7) at &pound;58.60. For the full breakdown,
              see our guide to{" "}
              <a href="/blog/how-much-does-mot-cost" className="text-blue-400 hover:text-blue-300">how much an MOT costs</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to find a cheap MOT near you</h2>
            <p className="leading-relaxed mb-3">
              The single biggest saving comes from comparing, not from any one
              trick &mdash; prices for the exact same test vary by &pound;30+
              between garages a mile apart. Beyond that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Use independents, not just chains.</strong> Local garages often undercut the big names and aren&apos;t targeting upsells.</li>
              <li><strong className="text-slate-100">Combine MOT and service.</strong> Booking both together usually unlocks a discounted or free MOT.</li>
              <li><strong className="text-slate-100">Avoid the plate-change rush.</strong> March and September are MOT peaks (cars first registered then come due) &mdash; quieter weeks can be cheaper.</li>
              <li><strong className="text-slate-100">Test up to a month early.</strong> You keep your renewal date and have breathing room to shop around rather than booking in a panic.</li>
            </ul>
            <p className="leading-relaxed">
              Enter your reg above to compare what garages near you are actually
              charging right now.
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Are cheap MOT deals worth it?</h2>
            <p className="leading-relaxed mb-3">
              Almost always &mdash; with one thing to watch. The test is
              identical wherever you go, so a cheap MOT is a genuine saving, not a
              corner cut. A garage cannot legally do a &ldquo;lighter&rdquo; test
              for less money.
            </p>
            <p className="leading-relaxed mb-3">
              The catch is what happens <em>after</em> a fail. A &pound;20 MOT is
              no bargain if the garage&apos;s repair labour rate is high and they
              find work to do. So compare two things, not one:
            </p>
            <SeverityCards
              cards={[
                { tone: "good", title: "The test fee", description: "The headline price — cap is £54.85, often much less." },
                { tone: "warn", title: "Repair labour rate", description: "What you'll pay per hour if it fails — varies far more than the test." },
                { tone: "info", title: "What's bundled", description: "‘Free’ MOTs are often tied to a paid service — check the total." },
              ]}
            />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Free retests &mdash; don&apos;t pay twice</h2>
            <p className="leading-relaxed mb-3">
              If your car fails, you may not need to pay for a second full test.
              Leave it at the test centre for repair and the retest is free.
              Take it away and bring it back within{" "}
              <strong className="text-slate-100">10 working days</strong>, and
              many failure items qualify for a free or reduced-fee partial
              retest.
            </p>
            <p className="leading-relaxed">
              Always ask the garage to confirm the retest terms before you collect
              the car &mdash; it can save the whole test fee again. More on what to
              do in our guide to{" "}
              <a href="/blog/what-to-do-if-car-fails-mot" className="text-blue-400 hover:text-blue-300">what to do if your car fails its MOT</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Check before you book</h2>
            <p className="leading-relaxed mb-3">
              Before paying for a test, it&apos;s worth a 10-second check of the
              vehicle&apos;s record. Our free{" "}
              <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history check</a>{" "}
              shows past advisories so you know what a tester is likely to flag,
              and{" "}
              <a href="/tax-check" className="text-blue-400 hover:text-blue-300">tax status</a>{" "}
              confirms the car is legal to drive to the test in the first place.
            </p>
            <p className="leading-relaxed">
              Not sure when yours is due? Set a free{" "}
              <a href="/mot-reminder" className="text-blue-400 hover:text-blue-300">MOT reminder</a>{" "}
              and we&apos;ll email you 28 and 7 days before it expires.
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </section>
        </div>
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16 pb-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/blog/how-much-does-mot-cost" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How Much Does an MOT Cost in 2026?</p>
            <p className="text-xs text-slate-500 mt-2">The maximum fee, typical garage prices, free retests, and practical ways to save.</p>
          </a>
          <a href="/blog/spring-mot-rush-beat-the-queues" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Spring MOT Rush: How to Beat the Queues</p>
            <p className="text-xs text-slate-500 mt-2">Why March and September are MOT peaks and how to book around them.</p>
          </a>
          <a href="/blog/mot-vs-service" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">MOT vs Service — Do You Need Both?</p>
            <p className="text-xs text-slate-500 mt-2">The difference, and why bundling them often unlocks a cheaper MOT.</p>
          </a>
          <a href="/blog/can-you-get-mot-done-early" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Can You Get Your MOT Done Early?</p>
            <p className="text-xs text-slate-500 mt-2">How early you can test without losing time on your certificate.</p>
          </a>
        </div>
      </div>
    </div>
  );
}
