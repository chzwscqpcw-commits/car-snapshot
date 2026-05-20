import type { Metadata } from "next";
import ConversionWidget from "@/components/stats/ConversionWidget";
import LandingHero from "@/components/LandingHero";
import MotReminderBanner from "@/components/MotReminderBanner";
import WarrantyCTA from "@/components/WarrantyCTA";
import ServicingCTA from "@/components/ServicingCTA";
import RecallResult from "@/components/tools/RecallResult";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is the recall check free?",
    answer:
      "Yes — no signup, no payment. Enter a reg, we check against the DVSA recall database.",
  },
  {
    question: "Are recall repairs free?",
    answer:
      "Always. Manufacturers are legally required to fix safety recalls at no cost, regardless of vehicle age or warranty status.",
  },
  {
    question: "What should I do if my car has a recall?",
    answer:
      "Contact the manufacturer or an authorised dealer to book the free repair. No time limit.",
  },
  {
    question: "How accurate is the recall check?",
    answer:
      "We match make, model, and year against the DVSA database — model-level, not VIN-specific. For your individual vehicle's exact status, verify with the manufacturer.",
  },
  {
    question: "Does a recall affect my car's value?",
    answer:
      "An outstanding recall can hurt resale. Once completed (free at a franchised dealer), it shouldn't affect value — and documentation of completed recall work is a plus.",
  },
];

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export const metadata: Metadata = {
  title: "Free Car Recall Check — Safety Recalls UK | Free Plate Check",
  description:
    "Check if your car has any outstanding safety recalls for free. See recall details, defects and remedies. Enter a registration number to check now.",
  keywords: [
    "car recall check",
    "vehicle recall check",
    "safety recall UK",
    "free recall check",
    "DVSA recalls",
    "car safety recall",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/recall-check",
  },
  openGraph: {
    title: "Free Car Recall Check — Safety Recalls UK",
    description:
      "Check if your car has any outstanding safety recalls for free. See recall details, defects and remedies.",
    url: "https://www.freeplatecheck.co.uk/recall-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Car Recall Check — Safety Recalls UK",
    description:
      "Check if your car has any outstanding safety recalls for free. See recall details, defects and remedies.",
  },
};

export default async function RecallCheckPage({
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
        name: "Recall Check",
        item: "https://www.freeplatecheck.co.uk/recall-check",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Safety Recall Check",
    url: "https://www.freeplatecheck.co.uk/recall-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Check for safety recalls on any UK vehicle. See if the manufacturer has issued a recall and what action to take. Free, instant results.",
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
          <RecallResult vrm={cleanedVrm!} />
          <MotReminderBanner />
        </>
      ) : (
        <>
      <LandingHero
        h1="Free Car Recall Check"
        subtitle="Check any UK vehicle for outstanding safety recalls from the DVSA database — repairs are always free, even on older cars. Free, instant, no signup."
        badgeText="Free · No signup · DVSA recall database"
        previewImage="recall-check.png"
        bullets={[
          "Cross-checked against the full DVSA recall database",
          "Recall repairs are always free — regardless of vehicle age",
          "Free MOT reminders so you never miss a related safety check",
        ]}
        exampleCard={
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Example</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                DVSA-verified
              </span>
            </div>
            <p className="text-sm text-slate-400">
              <span className="font-mono uppercase tracking-wider text-slate-200">AB12 CDE</span>
              <span className="mx-1.5 text-slate-600">&middot;</span>
              2018 VW Golf 1.4 TSI
            </p>
            <p className="text-xs text-slate-500">Make-model match &middot; cross-referenced</p>

            <div className="mt-4 rounded-lg border border-emerald-700/30 bg-gradient-to-br from-emerald-900/30 to-slate-900/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Outstanding recalls</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  NONE
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                All clear
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Checked 14 Jan 2026 &middot; DVSA database
              </p>
            </div>

            <p className="mt-4 text-[10px] font-medium uppercase tracking-wider text-slate-500">Past recalls (completed)</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-2 text-xs">
                <div>
                  <span className="text-slate-300">2020 &middot; Airbag inflator</span>
                  <p className="text-[10px] text-slate-500">VW notice R/2020/123</p>
                </div>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>
                  Done
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-2 text-xs">
                <div>
                  <span className="text-slate-300">2022 &middot; Fuel pump seal</span>
                  <p className="text-[10px] text-slate-500">VW notice R/2022/045</p>
                </div>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>
                  Done
                </span>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-slate-500 text-center">
              Recall repairs are always <span className="font-bold text-emerald-400">free</span>, no time limit
            </p>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-12 sm:py-12">
        <ConversionWidget
          headline="Check your vehicle for safety recalls"
          subtext="Enter a reg plate to see known recalls for your make and model, plus full MOT history and vehicle health data."
          reminderHeadline="Never miss your MOT"
          targetPath="/recall-check"
        />

        <StatCallouts
          stats={[
            { value: "£0", label: "Repairs always free", tone: "good" },
            { value: "12,700+", label: "DVSA recalls on record" },
            { value: "No limit", label: "Time to claim a fix", tone: "good" },
          ]}
        />

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is a vehicle safety recall?</h2>
            <p className="leading-relaxed mb-3">
              When a manufacturer discovers a defect that risks driver, passenger, or road-user safety, they issue a recall. Faulty airbags, brakes, electricals, structural issues — even brand-new models from major makers get them.
            </p>
            <p className="leading-relaxed">
              The DVSA manages UK recalls and maintains a public database (which we draw from). Recall repairs are <strong className="text-slate-100">always free</strong>, regardless of vehicle age or warranty — no time limit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How do recalls work?</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Defect identified</strong> via quality monitoring, customer reports, or testing.</li>
              <li><strong className="text-slate-100">DVSA notified</strong> — affected models, dates, and safety risk recorded.</li>
              <li><strong className="text-slate-100">Owners contacted</strong> by letter at the registered keeper address.</li>
              <li><strong className="text-slate-100">Free repair</strong> at an authorised dealer — defect fixed or part replaced.</li>
              <li><strong className="text-slate-100">No deadline</strong> — manufacturer must do the work years later if needed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What our check shows</h2>
            <p className="leading-relaxed mb-3">
              We match your reg&apos;s make, model, and year against the DVSA database. Any matching recalls appear with the defect description, safety risk, and recommended remedy.
            </p>
            <p className="leading-relaxed">
              Important caveat: model-level matching, not VIN-specific. We can tell you a recall was issued for your model; we can&apos;t confirm whether the repair has already been done on your particular car. For that, ask the manufacturer or an authorised dealer for a VIN check. Worth also reviewing your <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> for recall-related advisories.
            </p>
          </section>

          <section>
            <ServicingCTA context="generic" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
            <p className="text-sm text-slate-400 mt-4">
              More in our <a href="/blog/car-safety-recalls-guide" className="text-blue-400 hover:text-blue-300">complete guide to vehicle safety recalls</a>.
            </p>
          </section>
        </div>
      </div>

      {/* Warrantywise affiliate CTA — renders null until partners.ts pending flag flipped */}
      <div className="max-w-3xl mx-auto px-4 mt-12">
        <WarrantyCTA context="recall-check" />
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/blog/used-car-checks-before-buying" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">10 Essential Checks Before Buying a Used Car</p>
            <p className="text-xs text-slate-500 mt-2">A practical checklist — from MOT history to mileage red flags.</p>
          </a>
          <a href="/blog/first-car-checklist-new-drivers" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">First Car Checklist for New Drivers</p>
            <p className="text-xs text-slate-500 mt-2">Insurance, tax, MOT, running costs, and the checks that could save you money.</p>
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
