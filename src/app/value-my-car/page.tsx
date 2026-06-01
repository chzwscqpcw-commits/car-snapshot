import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import ConversionWidget from "@/components/stats/ConversionWidget";
import MobileSearchCue from "@/components/MobileSearchCue";
import MotReminderBanner from "@/components/MotReminderBanner";
import ServicingCTA from "@/components/ServicingCTA";
import TempInsuranceCTA from "@/components/TempInsuranceCTA";
import ValuationResult from "@/components/tools/ValuationResult";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";

// Companion page to /car-valuation targeting the "value my car" query
// cluster — distinct intent (action verb) from the "free car valuation"
// query cluster that the main valuation page owns. Content is unique to
// avoid duplicate-content penalties; the underlying tool (ValuationResult)
// is shared.

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I value my car for free?",
    answer:
      "Enter your registration above. We use DVLA mileage records, a UK depreciation model, and live market listings to produce a value range in about 30 seconds — no email, no signup, no personal details.",
  },
  {
    question: "Can I value my car without giving an email address?",
    answer:
      "Yes. We never ask for an email to show you the valuation. The number appears on screen as soon as the lookup completes — no gated forms, no marketing emails, no follow-up calls.",
  },
  {
    question: "What's the most accurate way to value my car?",
    answer:
      "Combine three sources: an automated tool like ours (instant, free, market-anchored), the asking price of similar cars on AutoTrader or eBay Motors that match your mileage and condition, and a quick walk-in offer from We Buy Any Car or Motorway as a floor. The truth usually sits between the trade offer and the asking-price midpoint.",
  },
  {
    question: "Should I value my car before selling it privately?",
    answer:
      "Yes — knowing the range helps you set a realistic asking price and spot lowball offers. Listing 5–10% above your target gives room to negotiate. Listing below market because you guessed will leave money on the table.",
  },
  {
    question: "How often should I value my car?",
    answer:
      "Recheck whenever you're thinking about selling, part-exchanging, or insuring. Values shift with the season, fuel prices, and market conditions — a winter quote can differ from a spring one by 5% or more on the same vehicle.",
  },
  {
    question: "Does the time of year affect my car's value?",
    answer:
      "Yes. 4×4s and large SUVs tend to peak in autumn/winter. Convertibles peak in spring/early summer. Family hatchbacks are steadier year-round. If you have flexibility on when to sell, timing the market right is worth a few hundred pounds.",
  },
  {
    question: "Can I trust an online car valuation?",
    answer:
      "As a starting point, yes — provided it draws from live market data, not stale dealer listings. For an insurance write-off claim, a finance settlement, or any legal use, get a paid professional valuation. For a private sale, a free tool is enough to set the price.",
  },
];

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export const metadata: Metadata = {
  title: "Value My Car 2026 — Free Instant UK Valuation, No Email | Free Plate Check",
  description:
    "Value your car in 30 seconds with just your registration. Free, no email, no signup. Live market data plus depreciation modelling for an honest estimate.",
  keywords: [
    "value my car",
    "value my car uk",
    "value my car free",
    "value my car without email",
    "value my car no signup",
    "value my car by registration",
    "value my car by reg",
    "value my car free uk",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/value-my-car",
  },
  openGraph: {
    title: "Value My Car 2026 — Free Instant UK Valuation, No Email",
    description:
      "Value your car in 30 seconds with just your registration. Free, no email, no signup.",
    url: "https://www.freeplatecheck.co.uk/value-my-car",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Value My Car 2026 — Free Instant UK Valuation, No Email",
    description:
      "Value your car in 30 seconds with just your registration. Free, no email, no signup.",
  },
};

export default async function ValueMyCarPage({
  searchParams,
}: {
  searchParams: Promise<{ vrm?: string }>;
}) {
  const params = await searchParams;
  const rawVrm = params?.vrm;
  const cleanedVrm = rawVrm ? cleanReg(rawVrm) : null;
  const hasResult = !!cleanedVrm && cleanedVrm.length >= 2 && cleanedVrm.length <= 8;
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
        name: "Value My Car",
        item: "https://www.freeplatecheck.co.uk/value-my-car",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Value My Car",
    url: "https://www.freeplatecheck.co.uk/value-my-car",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Value your car in 30 seconds with just your registration. Free, no email, no signup.",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      {hasResult ? (
        <>
          <ValuationResult vrm={cleanedVrm!} />
          <MotReminderBanner />
        </>
      ) : (
        <>
          {/* --- HERO --- */}
          <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_60%)]" />
            <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-6 lg:pb-10">
              <a
                href="/tools"
                className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block"
              >
                &larr; Back to all tools
              </a>

              {/* MOBILE LAYOUT */}
              <div className="lg:hidden">
                <div className="grid gap-3 grid-cols-[1fr_110px] sm:grid-cols-[1fr_135px] items-start">
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
                      Value your car in 30 seconds
                    </h1>
                    <p className="mt-2 text-sm font-medium text-emerald-300">
                      Reg only · No email · No signup
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <div className="relative">
                      <Image
                        src="/previews/car-valuation.png"
                        alt=""
                        width={110}
                        height={145}
                        className="rounded-lg border border-slate-700/60 shadow-xl shadow-cyan-500/15 -rotate-2 object-cover object-top"
                        style={{ width: 110, height: 145 }}
                      />
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[9px] font-bold uppercase tracking-wider shadow-lg rotate-3">
                        Sample
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-base text-slate-300 leading-relaxed">
                  Type your reg above. We pull live UK market data, your
                  actual MOT-recorded mileage, and a calibrated depreciation
                  model to estimate a real-world value range — instantly,
                  with nothing held back behind a signup wall.
                </p>
              </div>

              {/* DESKTOP LAYOUT */}
              <div className="hidden lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:items-center">
                <div>
                  <h1 className="text-5xl font-bold text-slate-100 leading-tight">
                    Value your car in 30 seconds
                  </h1>
                  <p className="mt-3 text-sm font-medium text-emerald-300">
                    Reg only · No email · No signup · No marketing calls
                  </p>
                  <p className="mt-4 text-lg text-slate-300 leading-relaxed max-w-xl">
                    Type your reg, get an honest estimate. We combine live UK
                    market listings, your real DVLA-recorded mileage, and a
                    calibrated depreciation model to estimate a value range —
                    instantly, with nothing held back behind a signup wall.
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                      Average response time: 30 seconds
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                      No email, ever — your inbox stays clean
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                      Free MOT history, recall &amp; tax check included
                    </li>
                  </ul>
                </div>
                <div className="relative w-fit mx-auto lg:mx-0">
                  <Image
                    src="/previews/car-valuation.png"
                    alt="Sample valuation result"
                    width={280}
                    height={365}
                    className="rounded-2xl border border-slate-700/60 shadow-2xl shadow-cyan-500/10 object-cover object-top -rotate-2"
                    style={{ width: 280, height: 365 }}
                  />
                  <span className="absolute -top-3 -right-3 px-2.5 py-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-lg rotate-3">
                    Sample
                  </span>
                </div>
              </div>

              <MobileSearchCue />
            </div>
          </div>

          {/* --- MAIN: Reg lookup --- */}
          <div className="max-w-3xl mx-auto px-4 pt-6 pb-10 sm:py-10">
            <ConversionWidget
              headline="Value your car now"
              subtext="Enter any UK registration. We'll show the estimated value, full MOT history, tax status, recall record and more. No email needed."
              reminderHeadline="Own this car? Protect its value with a free MOT reminder"
              targetPath="/value-my-car"
            />

            <StatCallouts
              stats={[
                { value: "30 sec", label: "Average valuation", tone: "good" },
                { value: "£0", label: "Free, no email", tone: "good" },
                { value: "8,000 mi", label: "UK avg per year" },
              ]}
            />

            {/* --- Long-form copy --- */}
            <div className="mt-12 space-y-8 text-slate-300">
              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Why we don&apos;t ask for your email
                </h2>
                <p className="leading-relaxed mb-3">
                  Almost every other free car valuation site in the UK gates
                  the number behind a form. They want your email, your phone,
                  and often your postcode — supposedly to give you a
                  &quot;personalised&quot; quote. What actually happens: your
                  details are sold or passed to a network of car-buying
                  services, who&apos;ll then call you for weeks trying to buy
                  the car for less than it&apos;s worth.
                </p>
                <p className="leading-relaxed">
                  We built this tool the opposite way round. The reg is the
                  only thing we need. Mileage comes from DVLA records.
                  Market context comes from live listings. The number appears
                  on screen, you read it, and that&apos;s the end of the
                  transaction. No email collected, no follow-up, no
                  inbox-clogging.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  How to value your car in three steps
                </h2>
                <ol className="list-decimal list-inside space-y-3 ml-2">
                  <li className="leading-relaxed">
                    <strong className="text-slate-100">Type your reg.</strong>{" "}
                    The lookup pulls vehicle data from DVLA — make, model,
                    fuel, engine, year — and any MOT-recorded mileage. This
                    sets the baseline.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-slate-100">
                      Refine with the condition questionnaire.
                    </strong>{" "}
                    Service history, bodywork, interior, owners, accident
                    record — five quick questions that narrow the range from
                    market-average to your specific car.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-slate-100">
                      Use the number with eyes open.
                    </strong>{" "}
                    Cross-check with current AutoTrader or eBay Motors
                    listings for the same make/model/year/mileage. The truth
                    sits between the trade-in offer and the private-sale
                    asking-price midpoint.
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  What changes the value most
                </h2>
                <p className="leading-relaxed mb-3">
                  Six factors do nearly all the work in a UK used-car
                  valuation:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
                  <li>
                    <strong className="text-slate-100">Mileage</strong> — the
                    single largest variable for most cars. UK average is
                    ~8,000/year. Below adds value, above reduces it. A
                    10,000-mile difference can swing the price by £500–£2,000
                    depending on the car. Verify yours with our{" "}
                    <a href="/mileage-check" className="text-blue-400 hover:text-blue-300">
                      free mileage check
                    </a>{" "}
                    if you&apos;re buying.
                  </li>
                  <li>
                    <strong className="text-slate-100">Service history</strong>{" "}
                    — a full main-dealer history can add 5–10% on a premium
                    brand. Independent specialist history is almost as good
                    for many models. Gaps raise questions.
                  </li>
                  <li>
                    <strong className="text-slate-100">MOT record</strong> —
                    consistent passes with low advisory counts signals a
                    well-kept car. Recent failures or recurring advisories
                    knock hundreds off. Check yours with our{" "}
                    <a href="/mot-check" className="text-blue-400 hover:text-blue-300">
                      MOT history check
                    </a>
                    .
                  </li>
                  <li>
                    <strong className="text-slate-100">Make and model</strong>{" "}
                    — Toyota, Lexus, Porsche, and most Tesla models depreciate
                    slowly. Premium German saloons depreciate fastest in
                    years 3–6. Knowing where your car sits on the curve
                    matters.
                  </li>
                  <li>
                    <strong className="text-slate-100">Condition</strong> —
                    bodywork (especially the bumpers and corner panels),
                    interior wear, tyres, and alloy-wheel condition. A
                    professional valet before sale pays for itself.
                  </li>
                  <li>
                    <strong className="text-slate-100">Previous owners</strong>{" "}
                    — fewer is better. One-owner cars command a noticeable
                    premium, especially on premium brands.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  When to value your car
                </h2>
                <p className="leading-relaxed mb-3">
                  Timing matters more than most sellers realise. A few
                  patterns worth knowing:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong className="text-slate-100">SUVs and 4×4s</strong>{" "}
                    typically peak in autumn and early winter as buyers
                    prepare for bad weather. Selling in September or October
                    can earn 3–5% over a March sale.
                  </li>
                  <li>
                    <strong className="text-slate-100">Convertibles</strong>{" "}
                    peak in spring and early summer. The same MX-5 sells for
                    notably more in April than November.
                  </li>
                  <li>
                    <strong className="text-slate-100">
                      Family hatchbacks
                    </strong>{" "}
                    are steady year-round but see a small bump in late summer
                    around new-plate change as part-exchanges flood the market.
                  </li>
                  <li>
                    <strong className="text-slate-100">EVs</strong> have been
                    volatile — battery-tech generations affect resale heavily.
                    Re-value before selling rather than relying on a quote
                    from six months ago.
                  </li>
                </ul>
              </section>

              <section>
                <ServicingCTA context="generic" />
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Online valuation vs trade-in offer vs walk-in
                </h2>
                <p className="leading-relaxed mb-3">
                  Three numbers, three purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
                  <li>
                    <strong className="text-slate-100">Online valuation</strong>{" "}
                    (this tool) — a market estimate. Use it to set your
                    private-sale asking price or to sense-check a part-ex
                    offer.
                  </li>
                  <li>
                    <strong className="text-slate-100">Trade-in offer</strong>{" "}
                    (We Buy Any Car, Motorway, dealer part-ex) — typically
                    10–20% below the online estimate. That gap is the dealer
                    or buyer&apos;s margin. Convenience cost.
                  </li>
                  <li>
                    <strong className="text-slate-100">Private sale</strong>{" "}
                    (AutoTrader, eBay Motors, Gumtree, Facebook Marketplace) —
                    the highest number, usually within 5% of the online
                    estimate. Costs you time and the risk of bad buyers.
                  </li>
                </ul>
                <p className="leading-relaxed">
                  Knowing all three lets you decide whether the convenience
                  of a trade-in is worth the discount.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Frequently asked questions
                </h2>
                <FaqAccordion items={FAQ_ITEMS} />
              </section>
            </div>
          </div>

          {/* Cuvva affiliate */}
          <div className="max-w-3xl mx-auto px-4 mt-12">
            <TempInsuranceCTA
              context="value-my-car"
              headline="Buying or selling this car? Sort the test-drive insurance."
              body="Cuvva offers hourly, daily and weekly cover bought in 90 seconds — ideal for the test-drive moment, or for driving a just-bought car home before your annual policy starts."
            />
          </div>

          {/* Related pages */}
          <div className="max-w-3xl mx-auto px-4 mt-16">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">More ways to value your car</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <a href="/car-valuation" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free car valuation — without email</p>
                <p className="text-xs text-slate-500 mt-2">The main valuation page — same tool, focused on the &quot;free car valuation&quot; cluster.</p>
              </a>
              <a href="/how-much-is-my-car-worth" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How much is my car worth?</p>
                <p className="text-xs text-slate-500 mt-2">The valuation framed as a question — covers the methodology behind the number.</p>
              </a>
              <a href="/car-valuation-no-signup" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Car valuation — no signup, no marketing</p>
                <p className="text-xs text-slate-500 mt-2">Privacy-first framing of the same tool — what other sites do with your details, and why we don&apos;t ask for them.</p>
              </a>
              <Link href="/blog/car-valuation-guide" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Complete car valuation guide</p>
                <p className="text-xs text-slate-500 mt-2">How valuations work, what affects value, and how to get the best price.</p>
              </Link>
              <Link href="/blog/cars-that-hold-value-best-uk" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Cars that hold their value best</p>
                <p className="text-xs text-slate-500 mt-2">Which makes and models depreciate slowest, and why.</p>
              </Link>
            </div>
          </div>
          <MotReminderBanner />
        </>
      )}
    </div>
  );
}
