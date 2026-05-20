import type { Metadata } from "next";
import Image from "next/image";
import ConversionWidget from "@/components/stats/ConversionWidget";
import MobileSearchCue from "@/components/MobileSearchCue";
import MotReminderBanner from "@/components/MotReminderBanner";
import TempInsuranceCTA from "@/components/TempInsuranceCTA";
import ServicingCTA from "@/components/ServicingCTA";
import ValuationResult from "@/components/tools/ValuationResult";

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export const metadata: Metadata = {
  title: "Free Car Valuation — How Much Is My Car Worth? | Free Plate Check",
  description:
    "Get a free instant car valuation with no signup. Enter any UK registration number to see an estimated value based on depreciation, mileage and live UK market data.",
  keywords: [
    "free car valuation",
    "how much is my car worth",
    "car value check",
    "car valuation UK",
    "vehicle valuation free",
    "car worth calculator",
    "free car value",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/car-valuation",
  },
  openGraph: {
    title: "Free Car Valuation — How Much Is My Car Worth?",
    description:
      "Get a free instant car valuation with no signup. Enter any UK registration number to see an estimated value based on depreciation, mileage and live UK market data.",
    url: "https://www.freeplatecheck.co.uk/car-valuation",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Car Valuation — How Much Is My Car Worth?",
    description:
      "Get a free instant car valuation with no signup. Enter any UK registration number to see an estimated value based on depreciation, mileage and live UK market data.",
  },
};

export default async function CarValuationPage({
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
        name: "Car Valuation",
        item: "https://www.freeplatecheck.co.uk/car-valuation",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Car Valuation",
    url: "https://www.freeplatecheck.co.uk/car-valuation",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Get a free instant car valuation based on live market data. No signup, no email required. Just enter your reg.",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
          "@type": "Question",
          name: "How much is my car worth?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Enter your registration number on Free Plate Check to get an instant estimated value. Our tool uses depreciation modelling, mileage analysis, and live market data to calculate a value range — no signup or personal details required.",
          },
        },
        {
          "@type": "Question",
          name: "Is this car valuation free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free. No signup, no email address, no payment required. Enter any UK registration number and see an instant valuation alongside full vehicle details, MOT history, and more.",
          },
        },
        {
          "@type": "Question",
          name: "How accurate is a free car valuation?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Our valuations combine a depreciation model with live market data from similar vehicles for sale. The estimate is a guide — actual value depends on condition, specification, service history, and local demand. Use our condition questionnaire to refine the estimate further.",
          },
        },
        {
          "@type": "Question",
          name: "What affects my car's value?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Key factors include: age and mileage, make and model (some brands hold value better), service history, bodywork and interior condition, number of previous owners, accident history, MOT advisories and failures, and current market demand.",
          },
        },
        {
          "@type": "Question",
          name: "Why do you show a range instead of one number?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No two used cars are identical. A valuation range accounts for differences in condition, specification, service history, and local demand that we cannot determine from registration data alone. Use our condition questionnaire to narrow the range based on your vehicle's specific state.",
          },
        },
        {
          "@type": "Question",
          name: "Does mileage affect my car's value?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, significantly. Lower-than-average mileage adds value, while higher mileage reduces it. The UK average is around 8,000 miles per year. However, a high-mileage car with full service history can be worth more than a low-mileage car with gaps in its records.",
          },
        },
        {
          "@type": "Question",
          name: "Does an MOT advisory or failure affect my car's value?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. A clean MOT history is a strong selling point. Recent failures, repeated advisories on the same item, or a long advisory list can knock hundreds of pounds off the price a buyer is willing to pay. Letting your MOT lapse can be worse — a vehicle with an expired MOT is harder to sell, can't be test driven legally, and signals neglect to buyers.",
          },
        },
      ],
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
        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-10">
          <a
            href="/tools"
            className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block"
          >
            &larr; Back to all tools
          </a>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-900/20 px-3 py-1 text-xs font-medium text-emerald-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Free · No signup · Live UK market data
                </span>
                <a
                  href="#mot-reminder"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/60 bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/50 hover:border-emerald-600"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Set free MOT reminder &rarr;
                </a>
              </div>
              <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-slate-100 leading-tight">
                What&apos;s your car worth?
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                A free, instant valuation range for any UK vehicle — built from
                live market listings, real mileage records, and depreciation
                modelling. No email, no phone number, no marketing calls.
              </p>

              <ul className="mt-5 space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                  Pulls real DVLA mileage so the estimate reflects your actual car
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                  Cross-checked against live listings for the same make &amp; model
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                  Condition questionnaire narrows the range to your spec
                </li>
              </ul>
            </div>

            {/* Preview card — example of what the valuation looks like */}
            <div className="hidden lg:block">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-blue-500/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Example
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                    Live market data
                  </span>
                </div>
                <p className="text-sm text-slate-400">2019 Ford Fiesta 1.0 Titanium</p>
                <p className="text-xs text-slate-500">68,200 miles · full history</p>

                <div className="mt-4 rounded-lg border border-blue-700/30 bg-gradient-to-br from-blue-900/30 to-cyan-900/20 p-4">
                  <p className="text-xs text-slate-400">Estimated value</p>
                  <p className="mt-1 text-3xl font-bold text-slate-100">
                    £6,800 <span className="text-slate-500 text-xl font-normal">–</span> £8,400
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-3/5 bg-gradient-to-r from-blue-500 to-cyan-400" />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Mid-estimate · high confidence
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-slate-800/60 p-2">
                    <p className="text-[10px] text-slate-500">vs. avg mileage</p>
                    <p className="text-xs font-semibold text-emerald-400">+£320</p>
                  </div>
                  <div className="rounded-md bg-slate-800/60 p-2">
                    <p className="text-[10px] text-slate-500">brand retention</p>
                    <p className="text-xs font-semibold text-slate-300">Average</p>
                  </div>
                  <div className="rounded-md bg-slate-800/60 p-2">
                    <p className="text-[10px] text-slate-500">market trend</p>
                    <p className="text-xs font-semibold text-amber-400">Softening</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-only screenshot thumbnail of the actual valuation result */}
          <div className="lg:hidden mt-6 flex justify-center">
            <div className="relative">
              <Image
                src="/previews/car-valuation.png"
                alt="Sample valuation result"
                width={172}
                height={228}
                className="rounded-xl border border-slate-700/60 shadow-xl shadow-cyan-500/10 -rotate-2 object-cover object-top"
                style={{ height: 228 }}
              />
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-lg rotate-3">
                Sample
              </span>
            </div>
          </div>

          {/* Mobile-only A/B/C test affordance pointing to the search input below */}
          <MobileSearchCue />
        </div>
      </div>

      {/* --- MAIN: Reg lookup + reminder bridge --- */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <ConversionWidget
          headline="Get your free valuation now"
          subtext="Enter any UK registration number to see an estimated value range, plus full vehicle history, MOT records and more — no signup."
          reminderHeadline="Already own this car? Protect its value with a free MOT reminder"
          targetPath="/car-valuation"
        />

        {/* Bridge: Why MOT reminders matter to anyone checking a valuation */}
        <div className="mt-12 rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/30 to-slate-900/30 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-100">
            A lapsed MOT can knock hundreds off your car&apos;s value
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Buyers walk away from cars with an expired MOT or a long list of
            advisories. A clean MOT history is one of the simplest things
            you can do to protect your resale price — and reminders are
            free.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold text-emerald-400">£1,000</p>
              <p className="mt-1 text-xs text-slate-400">
                Maximum fine for driving without a valid MOT.
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">28 + 7</p>
              <p className="mt-1 text-xs text-slate-400">
                Days&apos; notice before expiry — plenty of time to book.
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">£0</p>
              <p className="mt-1 text-xs text-slate-400">
                Cost of a reminder. Unsubscribe with one click any time.
              </p>
            </div>
          </div>

          <a
            href="#mot-reminder"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-cyan-500/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            Set my free MOT reminder
          </a>
        </div>

        {/* --- Long-form copy --- */}
        <div className="mt-12 space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How much is my car worth?</h2>
            <p className="leading-relaxed mb-3">
              &ldquo;How much is my car worth?&rdquo; is one of the most common questions asked by UK car owners. Whether you are thinking about selling, part-exchanging, or just curious, knowing your vehicle&apos;s current market value gives you a stronger negotiating position and helps you make informed decisions.
            </p>
            <p className="leading-relaxed mb-3">
              Most free valuation tools online require you to hand over personal details — email address, phone number, postcode — before they show you a figure. Free Plate Check is different. Enter a registration number and get an instant estimated value with no signup, no email, and no personal data collected.
            </p>
            <p className="leading-relaxed">
              Our valuation combines a depreciation model calibrated for UK vehicles with live market data from similar cars currently for sale. As more users look up vehicles, our estimates improve through an accumulating dataset of comparable values.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What affects a car&apos;s value?</h2>
            <p className="leading-relaxed mb-4">
              Several factors determine what a used car is worth on the UK market. Our valuation model accounts for the main ones automatically, and you can refine further using our condition questionnaire:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li><strong className="text-slate-100">Age and depreciation</strong> — New cars lose roughly 15-35% of their value in the first year alone. Depreciation slows with age but never fully stops.</li>
              <li><strong className="text-slate-100">Mileage</strong> — Lower-than-average mileage adds value; higher-than-average reduces it. The UK average is around 8,000 miles per year. Use our <a href="/mileage-check" className="text-blue-400 hover:text-blue-300">mileage check</a> to verify consistent mileage progression.</li>
              <li><strong className="text-slate-100">Make and model</strong> — Some brands hold their value better than others. Porsche, Toyota, and Tesla tend to retain value well, while some volume brands depreciate faster.</li>
              <li><strong className="text-slate-100">Service history</strong> — A full service history (especially from main dealers) adds significant value. Missing records raise questions for buyers.</li>
              <li><strong className="text-slate-100">Condition</strong> — Bodywork, interior wear, tyre condition, and general upkeep all affect what a buyer will pay.</li>
              <li><strong className="text-slate-100">MOT history</strong> — Frequent failures and long advisory lists can reduce value. A clean <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> is a selling point — and a lapsed MOT actively damages resale price.</li>
              <li><strong className="text-slate-100">Previous owners</strong> — Fewer owners generally means better value retention. One-owner cars command a premium.</li>
            </ul>
            <p className="leading-relaxed">
              Our valuation tool pulls mileage and MOT data automatically from DVLA and MOT records, giving you an adjusted estimate without any manual input. Use the condition questionnaire to further refine the figure based on factors we cannot see from the data alone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How our valuation works</h2>
            <p className="leading-relaxed mb-3">
              Our valuation estimate is built from multiple data layers. The base layer is a depreciation model that factors in vehicle age, make, and recorded mileage. This is combined with live market data from similar vehicles currently listed for sale, plus an accumulating cache of recent valuations for the same make, model, and year.
            </p>
            <p className="leading-relaxed mb-3">
              When we have strong market data, the estimate narrows to a tighter range with higher confidence. When market data is limited, the estimate relies more on the depreciation model and shows a wider range. We always display the confidence level so you know how strong the estimate is.
            </p>
            <p className="leading-relaxed">
              This is not a formal valuation. For insurance, finance, or legal purposes, always obtain a professional valuation. Our figure is a useful starting point for understanding roughly what your car is worth on the open market.
            </p>
          </section>

          <section>
            <ServicingCTA context="generic" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">How much is my car worth?</h3>
                <p className="text-sm mt-1">Enter your registration number on Free Plate Check to get an instant estimated value. Our tool uses depreciation modelling, mileage analysis, and live market data to calculate a value range — no signup or personal details required.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Is this car valuation free?</h3>
                <p className="text-sm mt-1">Yes, completely free. No signup, no email address, no payment required. Enter any UK registration number and see an instant valuation alongside full vehicle details, MOT history, and more.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How accurate is a free car valuation?</h3>
                <p className="text-sm mt-1">Our valuations combine a depreciation model with live market data from similar vehicles for sale. The estimate is a guide — actual value depends on condition, specification, service history, and local demand. Use our condition questionnaire to refine the estimate further.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What affects my car&apos;s value?</h3>
                <p className="text-sm mt-1">Key factors include: age and mileage, make and model (some brands hold value better), service history, bodywork and interior condition, number of previous owners, accident history, MOT advisories and failures, and current market demand.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Why do you show a range instead of one number?</h3>
                <p className="text-sm mt-1">No two used cars are identical. A valuation range accounts for differences in condition, specification, service history, and local demand that we cannot determine from registration data alone. Use our condition questionnaire to narrow the range based on your vehicle&apos;s specific state.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Does mileage affect my car&apos;s value?</h3>
                <p className="text-sm mt-1">Yes, significantly. Lower-than-average mileage adds value, while higher mileage reduces it. The UK average is around 8,000 miles per year. However, a high-mileage car with full service history can be worth more than a low-mileage car with gaps in its records.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Does an MOT advisory or failure affect my car&apos;s value?</h3>
                <p className="text-sm mt-1">Yes. A clean MOT history is a strong selling point. Recent failures, repeated advisories on the same item, or a long advisory list can knock hundreds of pounds off the price a buyer is willing to pay. Letting your MOT lapse can be worse — a vehicle with an expired MOT is harder to sell, can&apos;t be test driven legally, and signals neglect to buyers. <a href="/mot-check" className="text-blue-400 hover:text-blue-300">Check your MOT history</a> or <a href="#mot-reminder" className="text-blue-400 hover:text-blue-300">set a free reminder</a>.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Cuvva affiliate CTA — renders null until partners.ts pending flag flipped */}
      <div className="max-w-3xl mx-auto px-4 mt-12">
        <TempInsuranceCTA
          context="car-valuation"
          headline="Buying or selling this car? Sort the test-drive insurance."
          body="Cuvva offers hourly, daily and weekly cover bought in 90 seconds from your phone — ideal for the test-drive moment, or for driving a just-bought car home before your annual policy starts."
        />
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/blog/car-valuation-guide" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How Much Is My Car Worth? A Valuation Guide</p>
            <p className="text-xs text-slate-500 mt-2">How valuations work, what affects your vehicle&apos;s value, and how to get the best price.</p>
          </a>
          <a href="/blog/how-to-check-car-service-history" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Check a Car&apos;s Service History</p>
            <p className="text-xs text-slate-500 mt-2">What a full service history means and why gaps should raise red flags.</p>
          </a>
          <a href="/blog/what-to-check-on-a-test-drive" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">What to Check on a Test Drive</p>
            <p className="text-xs text-slate-500 mt-2">Engine, brakes, steering, gearbox, and the warning signs to walk away from.</p>
          </a>
          <a href="/blog/cars-that-hold-value-best-uk" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Cars That Hold Their Value Best in the UK</p>
            <p className="text-xs text-slate-500 mt-2">Which makes and models depreciate slowest, and why.</p>
          </a>
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
      <MotReminderBanner />
        </>
      )}
    </div>
  );
}
