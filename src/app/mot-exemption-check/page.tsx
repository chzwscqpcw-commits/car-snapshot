import Link from "next/link";
import type { Metadata } from "next";
import LandingHero from "@/components/LandingHero";
import ExemptionResult from "@/components/tools/ExemptionResult";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import WarrantyCTA from "@/components/WarrantyCTA";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is my car MOT exempt?",
    answer:
      "If it was built or first registered more than 40 years ago and hasn't been substantially changed in the last 30 years, it's exempt from the annual MOT. The exemption rolls forward each year, so cars become eligible on their 40th birthday. Enter your reg above to see the exact date for your vehicle.",
  },
  {
    question: "Does MOT exemption mean I don't pay road tax either?",
    answer:
      "Not necessarily, and this is the most common mix-up. The two rules run on different clocks. MOT exemption starts on the vehicle's 40th birthday. The historic tax class is only claimable from 1 April, and only once the vehicle was built before 1 January of the year 40 years earlier — so a car can be MOT-exempt for more than a year while still needing to be taxed normally.",
  },
  {
    question: "What counts as a 'substantial change'?",
    answer:
      "Broadly: a replaced chassis or monocoque body, altered axles or running gear that changes how the vehicle steers, brakes or suspends, or an engine change beyond what was available in period. DVLA holds no data field for this — it's a declaration you make yourself on form V112 when you tax the vehicle. If you're unsure, the DfT's guidance on vehicles of historical interest is the reference.",
  },
  {
    question: "Do I still need to keep an exempt car roadworthy?",
    answer:
      "Yes. Exemption removes the test, not the legal duty. Driving an unroadworthy vehicle is an offence whether or not it needs an MOT, and you can be prosecuted for it. Many owners of exempt cars keep testing voluntarily for that reason — it's still available if you want it.",
  },
  {
    question: "How do I claim MOT exemption?",
    answer:
      "You declare it when you tax the vehicle, using form V112 (reason 'R' — vehicle of historical interest). There's nothing to apply for in advance and no certificate issued. If you tax online, the system will ask you to confirm the vehicle hasn't been substantially changed.",
  },
  {
    question: "Can I still get an MOT if my car is exempt?",
    answer:
      "Yes. Testing stations will still test an exempt vehicle if you ask, and the result is recorded in the MOT history like any other. Some owners do it annually as an independent safety check, and it can help when selling — a recent pass is evidence of condition that an exempt car otherwise lacks.",
  },
];

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

const TITLE = "Is My Car MOT Exempt? Free 40-Year Exemption Check | Free Plate Check";
const DESCRIPTION =
  "Check if your car is MOT exempt by registration. See the exact date it turns 40, when the historic tax class starts, and why the two dates aren't the same. Free and instant.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "is my car mot exempt",
    "mot exemption check",
    "40 year mot exemption",
    "classic car mot exemption",
    "historic vehicle tax class",
    "v112 mot exemption",
    "do i need an mot",
  ],
  alternates: { canonical: "https://www.freeplatecheck.co.uk/mot-exemption-check" },
  openGraph: {
    title: "Is My Car MOT Exempt? Free 40-Year Exemption Check",
    description: DESCRIPTION,
    url: "https://www.freeplatecheck.co.uk/mot-exemption-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Is My Car MOT Exempt? Free 40-Year Exemption Check",
    description: DESCRIPTION,
  },
};

export default async function MotExemptionCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ vrm?: string }>;
}) {
  const params = await searchParams;
  const cleanedVrm = params?.vrm ? cleanReg(params.vrm) : null;
  const hasResult = !!cleanedVrm && cleanedVrm.length >= 2 && cleanedVrm.length <= 8;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      {
        "@type": "ListItem",
        position: 2,
        name: "MOT Exemption Check",
        item: "https://www.freeplatecheck.co.uk/mot-exemption-check",
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {hasResult ? (
        <>
          <ExemptionResult vrm={cleanedVrm!} />
          <div className="border-t border-slate-800/60 bg-slate-900/40">
            <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-slate-500">
              Dates are calculated from the DVLA build year and first-registration date. Whether a
              vehicle has been substantially changed is a self-declaration on form V112 — check
              GOV.UK if you&apos;re unsure.
            </div>
          </div>
        </>
      ) : (
        <>
          <LandingHero
            h1="Is My Car MOT Exempt?"
            searchTargetPath="/mot-exemption-check"
            searchCtaLabel="Check exemption free"
            subtitle="Cars over 40 years old don't need an annual MOT. Enter a reg to see the exact date yours qualifies — and why the historic tax class starts on a different day."
            badgeText="Free · No signup · DVLA build data"
            bullets={[
              "The exact date your car turns 40 and the MOT stops being due",
              "When the historic tax class actually starts — it isn't the same date",
              "The substantial-changes condition, in plain English",
            ]}
            exampleCard={
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-emerald-500/5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Example</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                    DVLA build data
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  <span className="font-mono uppercase tracking-wider text-slate-200">XYZ 123K</span>
                  <span className="mx-1.5 text-slate-600">&middot;</span>
                  1986 Ford Escort 1.6
                </p>
                <p className="text-xs text-slate-500">Registered March 1986</p>

                <div className="mt-4 rounded-lg border border-emerald-700/30 bg-gradient-to-br from-emerald-900/30 to-slate-900/20 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">MOT exemption</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      ELIGIBLE
                    </span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-slate-100">Since 1 March 2026</p>
                </div>

                <div className="mt-3 rounded-lg border border-amber-700/30 bg-amber-950/20 p-4">
                  <p className="text-xs text-slate-400">Historic tax class</p>
                  <p className="mt-1 text-lg font-bold text-amber-200">Not until 1 April 2027</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Still has to be taxed for another 13 months
                  </p>
                </div>
              </div>
            }
          />

          <div className="mx-auto max-w-3xl px-4 py-12 space-y-10">
            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-100">
                Two 40-year rules, two different dates
              </h2>
              <p className="leading-relaxed text-slate-300">
                Almost every guide to classic-car exemption blurs these together. They aren&apos;t
                the same rule and they don&apos;t start on the same day.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                  <h3 className="text-sm font-semibold text-slate-100">MOT exemption</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    Starts on the vehicle&apos;s <strong className="text-slate-200">40th birthday</strong>,
                    counted from when it was built or first registered. Rolling — a new cohort
                    qualifies every year.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                  <h3 className="text-sm font-semibold text-slate-100">Historic tax class</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    Claimable from <strong className="text-slate-200">1 April</strong>, and only
                    once the vehicle was built before 1 January of the year 40 years earlier. It can
                    lag the MOT date by more than a year.
                  </p>
                </div>
              </div>
              <p className="mt-5 leading-relaxed text-slate-300">
                The practical consequence: there is a window where your car legally needs no MOT but
                still has to be taxed like any other vehicle. Owners get caught by this every year.
                Run your reg above and we&apos;ll show both dates and the gap between them.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-100">Exempt isn&apos;t the same as fine to ignore</h2>
              <p className="leading-relaxed text-slate-300">
                Exemption removes the annual test, not the duty to keep the car roadworthy — that
                obligation is unchanged, and driving an unroadworthy vehicle is an offence either
                way. It also removes the yearly inspection that used to catch corrosion, brake wear
                and perished rubber before they became expensive. If you stop testing, it&apos;s
                worth replacing that check with something: a voluntary MOT, or a proper annual
                service.
              </p>
            </section>

            <section>
              <WarrantyCTA context="exemption-landing-classic" variant="classic" />
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-100">Frequently asked questions</h2>
              <FaqAccordion items={FAQ_ITEMS} />
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-200">Related tools</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/mot-check" className="group block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
                  <p className="text-sm font-semibold text-slate-100 transition-colors group-hover:text-blue-400">MOT History Check</p>
                  <p className="mt-2 text-xs text-slate-500">Every test, advisory and defect on record.</p>
                </Link>
                <Link href="/tax-check" className="group block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
                  <p className="text-sm font-semibold text-slate-100 transition-colors group-hover:text-blue-400">Car Tax Check</p>
                  <p className="mt-2 text-xs text-slate-500">Live DVLA tax status and the VED band.</p>
                </Link>
                <Link href="/stats/how-many-left" className="group block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
                  <p className="text-sm font-semibold text-slate-100 transition-colors group-hover:text-blue-400">How Many Left?</p>
                  <p className="mt-2 text-xs text-slate-500">How many of your model survive on UK roads.</p>
                </Link>
                <Link href="/servicing" className="group block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
                  <p className="text-sm font-semibold text-slate-100 transition-colors group-hover:text-blue-400">Servicing Costs</p>
                  <p className="mt-2 text-xs text-slate-500">What a service should cost, and how to spot overcharging.</p>
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
