import type { Metadata } from "next";
import Image from "next/image";
import ConversionWidget from "@/components/stats/ConversionWidget";
import MobileSearchCue from "@/components/MobileSearchCue";
import MotReminderBanner from "@/components/MotReminderBanner";
import TempInsuranceCTA from "@/components/TempInsuranceCTA";
import ServicingCTA from "@/components/ServicingCTA";
import ValuationResult from "@/components/tools/ValuationResult";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How much is my car worth?",
    answer:
      "Enter your reg above for an instant estimate based on depreciation modelling, mileage, and live UK market data. No signup, no personal details.",
  },
  {
    question: "Is this car valuation free?",
    answer:
      "Completely free. No signup, no email, no payment. Just enter the reg.",
  },
  {
    question: "How accurate is a free car valuation?",
    answer:
      "We combine a depreciation model with live comparable listings. It's a guide — actual value depends on condition, spec, service history, and local demand. The condition questionnaire helps narrow it.",
  },
  {
    question: "What affects my car's value?",
    answer:
      "Age, mileage, make and model (some brands hold value better), service history, bodywork and interior condition, previous owners, accident history, MOT record, current demand.",
  },
  {
    question: "Why do you show a range instead of one number?",
    answer:
      "No two used cars are identical. The range covers differences in condition, spec, and local demand we can't see from reg data alone. Use the condition questionnaire to narrow it.",
  },
  {
    question: "Does mileage affect my car's value?",
    answer:
      "Yes, significantly. Below the UK average (~8,000/year) adds value; above it reduces. But a high-mileage car with full service history beats a low-mileage one with gaps.",
  },
  {
    question: "Does an MOT advisory or failure affect my car's value?",
    answer:
      "Yes. Recent failures and recurring advisories can knock hundreds off the price. A lapsed MOT is worse — harder to sell, no legal test drive, signals neglect. Run an MOT check or set a free reminder from our MOT tools.",
  },
];

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

          {/* MOBILE LAYOUT (<lg) */}
          <div className="lg:hidden">
            <div className="grid gap-3 grid-cols-[1fr_110px] sm:grid-cols-[1fr_135px] items-start">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
                  What&apos;s your car worth?
                </h1>
                <a
                  href="#mot-reminder"
                  className="inline-flex items-center gap-1.5 mt-3 rounded-full border border-emerald-700/60 bg-emerald-900/30 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/50 hover:border-emerald-600"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Set free MOT reminder &rarr;
                </a>
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
              A free, instant valuation range for any UK vehicle — built from
              live market listings, real mileage records, and depreciation
              modelling.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                Real DVLA mileage feeds your estimate
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                Cross-checked against live UK listings
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                Condition questionnaire narrows the range
              </li>
            </ul>
          </div>

          {/* DESKTOP LAYOUT (≥lg) */}
          <div className="hidden lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:items-center">
            <div>
              <h1 className="text-5xl font-bold text-slate-100 leading-tight">
                What&apos;s your car worth?
              </h1>
              <a
                href="#mot-reminder"
                className="inline-flex items-center gap-1.5 mt-4 rounded-full border border-emerald-700/60 bg-emerald-900/30 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/50 hover:border-emerald-600"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                Set free MOT reminder &rarr;
              </a>
              <p className="mt-4 text-lg text-slate-300 leading-relaxed max-w-xl">
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

          {/* Mobile-only A/B/C test affordance pointing to the search input below */}
          <MobileSearchCue />
        </div>
      </div>

      {/* --- MAIN: Reg lookup + reminder bridge --- */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-10 sm:py-10">
        <ConversionWidget
          headline="Get your free valuation now"
          subtext="Enter any UK registration number to see an estimated value range, plus full vehicle history, MOT records and more — no signup."
          reminderHeadline="Already own this car? Protect its value with a free MOT reminder"
          targetPath="/car-valuation"
        />

        <StatCallouts
          stats={[
            { value: "15-35%", label: "Year 1 depreciation", tone: "warn" },
            { value: "8,000 mi", label: "UK avg mileage/year" },
            { value: "£0", label: "Free, no signup", tone: "good" },
          ]}
        />

        {/* --- Long-form copy --- */}
        <div className="mt-12 space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How much is my car worth?</h2>
            <p className="leading-relaxed mb-3">
              Most free valuation tools online want your email, phone, and postcode before they show you a number. We don&apos;t. Enter a reg, get an estimate — no signup, no personal data.
            </p>
            <p className="leading-relaxed">
              The figure combines a UK-calibrated depreciation model with live market data from similar cars currently listed. Estimates improve as more users look up vehicles and the comparable dataset grows.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What affects a car&apos;s value?</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li><strong className="text-slate-100">Age and depreciation</strong> — 15–35% lost in year one. Slows after, but never stops.</li>
              <li><strong className="text-slate-100">Mileage</strong> — UK average ~8,000/year. Below adds value; above reduces it. Verify with our <a href="/mileage-check" className="text-blue-400 hover:text-blue-300">mileage check</a>.</li>
              <li><strong className="text-slate-100">Make and model</strong> — Porsche, Toyota, Tesla retain value. Some volume brands depreciate faster.</li>
              <li><strong className="text-slate-100">Service history</strong> — full main-dealer history adds significant value. Gaps raise questions.</li>
              <li><strong className="text-slate-100">Condition</strong> — bodywork, interior, tyres, general upkeep.</li>
              <li><strong className="text-slate-100">MOT record</strong> — clean <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> is a selling point; a lapsed MOT damages resale.</li>
              <li><strong className="text-slate-100">Previous owners</strong> — fewer is better. One-owner commands a premium.</li>
            </ul>
            <p className="leading-relaxed">
              We pull mileage and MOT data automatically. The condition questionnaire lets you refine for what we can&apos;t see from records alone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How our valuation works</h2>
            <p className="leading-relaxed mb-3">
              Three data layers: a depreciation model based on age/make/mileage, live market data from similar listings, and an accumulating cache of recent valuations for the same make/model/year.
            </p>
            <p className="leading-relaxed mb-3">
              Strong market data → tighter range, higher confidence. Limited data → wider range, more reliance on the depreciation model. We always show the confidence level so you know how strong the signal is.
            </p>
            <p className="leading-relaxed">
              Not a formal valuation. For insurance, finance, or legal purposes get a professional one. This figure is the starting point for understanding roughly what your car&apos;s worth on the open market.
            </p>
          </section>

          <section>
            <ServicingCTA context="generic" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
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
