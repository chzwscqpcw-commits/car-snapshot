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

// Companion page to /car-valuation and /value-my-car targeting the
// question-format query cluster — "how much is my car worth" variants.
// Content angle: answer the question with methodology and data, build
// trust by being transparent about how the number is calculated.

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How much is my car worth right now?",
    answer:
      "Enter your registration above and you'll see an estimated value range in about 30 seconds. The range — not a single number — reflects honest uncertainty: condition, spec, and local demand can move the price by ±10% without changing anything else about the car.",
  },
  {
    question: "Why a range instead of one number?",
    answer:
      "Because no two used cars are identical and the market never quotes one price either. Trade-in buyers pay 10–20% below private-sale value. Private buyers pay near asking price for clean cars and 5–10% under for ones with question marks. Showing one number would be misleading; a range lets you negotiate from a defensible position.",
  },
  {
    question: "What's my car worth if I sell privately?",
    answer:
      "Usually the upper half of our range. Private buyers pay closer to asking price than trade-in centres do — but only for cars with full service history, recent MOT, and no obvious issues. Cars with gaps in any of those areas tend to land in the middle or lower half of the range.",
  },
  {
    question: "What's my car worth as a part-exchange?",
    answer:
      "Typically 10–20% below the lower bound of our range. Dealers need margin to remarket the car. Part-ex is the most convenient option but the most expensive in terms of price taken — convenience cost. If you have time, a private sale or a Motorway/Cazoo auction usually nets noticeably more.",
  },
  {
    question: "Why is my car worth less than I thought?",
    answer:
      "Three common reasons. (1) Memory bias — the price you paid was inflated by dealer margin; the resale value is closer to what the dealer paid for it, not what they sold it for. (2) Depreciation accelerates in years 3–5 for many models. (3) Mileage above the UK average (~8,000/year) compounds with age. Check your mileage trajectory on our MOT history tool — if it's well above average, that explains a lot.",
  },
  {
    question: "How accurate is this estimate?",
    answer:
      "Accurate enough to set a sensible asking price for a private sale or sense-check a part-ex offer. Not accurate enough for insurance write-off claims, finance settlements, or legal proceedings — those need a paid professional valuation that includes inspection.",
  },
  {
    question: "How do I get the highest possible price?",
    answer:
      "Clean it properly (£100 professional valet pays for itself), fix small cosmetic issues, gather your service history into a folder, get any outstanding MOT advisories sorted, take good photos in daylight against a plain background, and list at our upper range. Private sale on AutoTrader or eBay Motors typically nets the most. Be patient — pricing right and waiting beats pricing low and rushing.",
  },
  {
    question: "Should I sell to We Buy Any Car or Motorway?",
    answer:
      "We Buy Any Car is the fastest and easiest, but typically the lowest offer (often 15–20% below private-sale value). Motorway runs an auction across dealers — usually nets a higher price than We Buy Any Car but still 5–15% below private sale. For a clean, in-demand car, private sale is worth the effort. For older, higher-mileage cars or quick-turnaround needs, Motorway is often the best compromise.",
  },
];

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export const metadata: Metadata = {
  title: "How Much Is My Car Worth? 2026 — Free UK Valuation, No Email | Free Plate Check",
  description:
    "Find out how much your car is worth in 30 seconds — free, no email, no signup. Live UK market data, real DVLA mileage, transparent depreciation model.",
  keywords: [
    "how much is my car worth",
    "how much is my car worth uk",
    "how much is my car worth without email",
    "how much is my car worth no email",
    "how much is my car worth uk without email",
    "whats my car worth",
    "what is my car worth uk",
    "car worth calculator",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/how-much-is-my-car-worth",
  },
  openGraph: {
    title: "How Much Is My Car Worth? 2026 — Free UK Valuation, No Email",
    description:
      "Find out how much your car is worth in 30 seconds — free, no email, no signup.",
    url: "https://www.freeplatecheck.co.uk/how-much-is-my-car-worth",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How Much Is My Car Worth? 2026 — Free UK Valuation, No Email",
    description:
      "Find out how much your car is worth in 30 seconds — free, no email, no signup.",
  },
};

export default async function HowMuchIsMyCarWorthPage({
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
        name: "How Much Is My Car Worth",
        item: "https://www.freeplatecheck.co.uk/how-much-is-my-car-worth",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — How Much Is My Car Worth",
    url: "https://www.freeplatecheck.co.uk/how-much-is-my-car-worth",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Find out how much your car is worth in 30 seconds — free, no email, no signup.",
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
                      How much is your car worth?
                    </h1>
                    <p className="mt-2 text-sm font-medium text-emerald-300">
                      Free · No email · 30 seconds
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
                  Enter your reg. We&apos;ll show what your car is worth on
                  the UK market today — backed by live listings, your real
                  DVLA mileage, and a depreciation model calibrated against
                  thousands of recent sales.
                </p>
              </div>

              {/* DESKTOP LAYOUT */}
              <div className="hidden lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:items-center">
                <div>
                  <h1 className="text-5xl font-bold text-slate-100 leading-tight">
                    How much is your car worth?
                  </h1>
                  <p className="mt-3 text-sm font-medium text-emerald-300">
                    Free · No email · No signup · 30 seconds
                  </p>
                  <p className="mt-4 text-lg text-slate-300 leading-relaxed max-w-xl">
                    Enter your reg. We show what your car is worth on the UK
                    market today — backed by live listings, your real DVLA
                    mileage, and a depreciation model calibrated against
                    thousands of recent sales. No email, no marketing, no
                    follow-up calls.
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                      Live UK market data, not stale dealer lists
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                      Real mileage from DVLA records
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                      Honest range — no fake precision
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
              headline="Check what your car's worth"
              subtext="Enter any UK registration to see an estimated value range, plus full MOT history, tax status and more. No signup, no email."
              reminderHeadline="Own this car? Protect its value with a free MOT reminder"
              targetPath="/how-much-is-my-car-worth"
            />

            <StatCallouts
              stats={[
                { value: "±10%", label: "Typical range width" },
                { value: "£0", label: "Free, no email", tone: "good" },
                { value: "15–35%", label: "Year 1 depreciation", tone: "warn" },
              ]}
            />

            {/* --- Long-form copy --- */}
            <div className="mt-12 space-y-8 text-slate-300">
              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  How the number is calculated
                </h2>
                <p className="leading-relaxed mb-3">
                  Three signals combine into the estimate you see:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2 mb-3">
                  <li className="leading-relaxed">
                    <strong className="text-slate-100">
                      Live market listings
                    </strong>{" "}
                    — currently-advertised prices for the same make, model,
                    fuel, year, and mileage band. This is the most important
                    signal but only available when enough comparable cars are
                    listed. For rare cars the dataset is thin and the range
                    widens.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-slate-100">
                      UK depreciation model
                    </strong>{" "}
                    — calibrated against thousands of UK sales, factoring
                    age, make-level retention rates, and average annual
                    mileage. Provides the anchor when market data is sparse.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-slate-100">
                      Recent valuation cache
                    </strong>{" "}
                    — as more people use the tool, we accumulate same-make/
                    same-year data points that smooth the estimate further.
                  </li>
                </ol>
                <p className="leading-relaxed">
                  When all three signals agree, the range tightens and the
                  confidence rating goes up. When they diverge or one is
                  missing, the range widens to be honest about uncertainty.
                  We&apos;d rather show a wide range that&apos;s right than a
                  narrow one that&apos;s wrong.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  The three different &quot;worth&quot; numbers
                </h2>
                <p className="leading-relaxed mb-3">
                  When you ask &quot;how much is my car worth&quot;, you might
                  mean any of three different prices. The gap between them is
                  often 20–30% on the same car:
                </p>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-3">
                  <table className="w-full text-sm border border-slate-800 rounded-lg overflow-hidden">
                    <thead className="bg-slate-900/80 text-slate-200">
                      <tr>
                        <th className="text-left px-3 py-2 border-b border-slate-800">Sale type</th>
                        <th className="text-left px-3 py-2 border-b border-slate-800">Typical % of our range</th>
                        <th className="text-left px-3 py-2 border-b border-slate-800">Convenience</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      <tr className="border-b border-slate-800/60">
                        <td className="px-3 py-2 font-semibold text-slate-100">Private sale (AutoTrader, eBay Motors)</td>
                        <td className="px-3 py-2">Top half of range, ~95-100%</td>
                        <td className="px-3 py-2">Slow, time-consuming</td>
                      </tr>
                      <tr className="border-b border-slate-800/60">
                        <td className="px-3 py-2 font-semibold text-slate-100">Online auction (Motorway, Cazoo)</td>
                        <td className="px-3 py-2">Middle, ~85-95%</td>
                        <td className="px-3 py-2">Fast, one transaction</td>
                      </tr>
                      <tr className="border-b border-slate-800/60">
                        <td className="px-3 py-2 font-semibold text-slate-100">Dealer part-exchange</td>
                        <td className="px-3 py-2">Lower, ~80-90%</td>
                        <td className="px-3 py-2">Instant, settled at purchase</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold text-slate-100">Walk-in (We Buy Any Car)</td>
                        <td className="px-3 py-2">Floor, ~75-85%</td>
                        <td className="px-3 py-2">Fastest, today</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="leading-relaxed">
                  Our estimate covers the realistic private-sale to part-ex
                  band. Walk-in offers tend to come in below, which is the
                  price you pay for &quot;sold today, money in your account
                  tomorrow.&quot;
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  What makes your car worth more (or less)
                </h2>
                <p className="leading-relaxed mb-3">
                  Beyond the basics (age, mileage, make), buyers pay close
                  attention to signals that suggest the car has been well kept:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
                  <li>
                    <strong className="text-slate-100">
                      Service history
                    </strong>{" "}
                    — a full main-dealer history can add 5–10% on a premium
                    brand. Stamps from a recognised independent specialist
                    are almost as good for many models. Gaps cost.
                  </li>
                  <li>
                    <strong className="text-slate-100">
                      Recent MOT
                    </strong>{" "}
                    — a fresh pass with no advisories adds confidence. A long
                    list of advisories signals trouble. Check yours on our{" "}
                    <a href="/mot-check" className="text-blue-400 hover:text-blue-300">
                      free MOT history check
                    </a>{" "}
                    before listing.
                  </li>
                  <li>
                    <strong className="text-slate-100">
                      One careful owner
                    </strong>{" "}
                    — fewer owners = higher value. The first owner generally
                    treats the car best.
                  </li>
                  <li>
                    <strong className="text-slate-100">
                      Mileage trajectory
                    </strong>{" "}
                    — steady annual mileage suggests regular use. Sudden
                    drops can signal it&apos;s been laid up (engine seals,
                    flat batteries) and don&apos;t add value.
                  </li>
                  <li>
                    <strong className="text-slate-100">
                      Cosmetic presentation
                    </strong>{" "}
                    — clean bodywork, intact alloys, and a tidy interior can
                    add 5% over identical specs. A £100 professional valet
                    is the highest-ROI thing you can do before selling.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Why your car might be worth less than you expect
                </h2>
                <p className="leading-relaxed mb-3">
                  Three common mismatches between owner expectations and the
                  market:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
                  <li>
                    <strong className="text-slate-100">
                      You remember what you paid, not what the dealer paid
                    </strong>{" "}
                    — the price on the dealer windscreen included their
                    margin. Resale value is closer to what they paid for it.
                  </li>
                  <li>
                    <strong className="text-slate-100">
                      Years 3–5 see the steepest depreciation
                    </strong>{" "}
                    on most brands — especially premium German saloons and
                    medium-spec petrol family cars. A 4-year-old car is often
                    worth 40–50% of its new price.
                  </li>
                  <li>
                    <strong className="text-slate-100">
                      Mileage above the UK average compounds
                    </strong>{" "}
                    — a 5-year-old car with 70,000 miles is worth notably
                    less than one with 40,000, even though both are
                    &quot;well-used.&quot; The above-average mileage discount
                    grows with age.
                  </li>
                </ul>
                <p className="leading-relaxed">
                  Knowing this in advance lets you set a realistic asking
                  price and avoid the frustration of weeks of low offers.
                </p>
              </section>

              <section>
                <ServicingCTA context="generic" />
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
              context="how-much-is-my-car-worth"
              headline="Selling or buying this car? Sort the test-drive insurance."
              body="Cuvva offers hourly, daily and weekly cover bought in 90 seconds — ideal for the test-drive moment, or for driving a just-bought car home before your annual policy starts."
            />
          </div>

          {/* Related pages */}
          <div className="max-w-3xl mx-auto px-4 mt-16">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">More ways to value your car</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <a href="/car-valuation" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free car valuation — without email</p>
                <p className="text-xs text-slate-500 mt-2">The main valuation page — focused on the &quot;free car valuation&quot; cluster.</p>
              </a>
              <a href="/value-my-car" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Value my car — 30 seconds, no email</p>
                <p className="text-xs text-slate-500 mt-2">The valuation framed as an action — same tool, when-to-sell timing detail.</p>
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
