import type { Metadata } from "next";
import ConversionWidget from "@/components/stats/ConversionWidget";
import LandingHero from "@/components/LandingHero";
import MotReminderBanner from "@/components/MotReminderBanner";
import WarrantyCTA from "@/components/WarrantyCTA";
import ServicingCTA from "@/components/ServicingCTA";
import RecallResult from "@/components/tools/RecallResult";

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
    mainEntity: [
        {
          "@type": "Question",
          name: "Is the recall check free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free. No signup, no payment, no hidden charges. Enter any UK registration number and we will check for known safety recalls.",
          },
        },
        {
          "@type": "Question",
          name: "Are recall repairs free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, always. Manufacturers are legally required to repair safety recall defects at no cost to the vehicle owner, regardless of the age of the vehicle or whether it is still under warranty.",
          },
        },
        {
          "@type": "Question",
          name: "What should I do if my car has a recall?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Contact your vehicle manufacturer or an authorised dealer to arrange the free repair. You can usually book directly through the dealer. There is no time limit on recall repairs.",
          },
        },
        {
          "@type": "Question",
          name: "How accurate is the recall check?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We match your vehicle's make, model and year against the DVSA recall database. This is model-level matching rather than VIN-specific, so we recommend verifying with the manufacturer for complete records specific to your individual vehicle.",
          },
        },
        {
          "@type": "Question",
          name: "Does a recall affect my car's value?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "An outstanding recall can affect resale value and buyer confidence. However, once the recall repair has been completed (for free at a franchised dealer), it should not negatively affect the vehicle's value. Having documentation of completed recall work is a positive when selling.",
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
          <RecallResult vrm={cleanedVrm!} />
          <MotReminderBanner />
        </>
      ) : (
        <>
      <LandingHero
        h1="Free Car Recall Check"
        subtitle="Check any UK vehicle for outstanding safety recalls from the DVSA database — repairs are always free, even on older cars. Free, instant, no signup."
        badgeText="Free · No signup · DVSA recall database"
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

      <div className="max-w-3xl mx-auto px-4 py-12">
        <ConversionWidget
          headline="Check your vehicle for safety recalls"
          subtext="Enter a reg plate to see known recalls for your make and model, plus full MOT history and vehicle health data."
          reminderHeadline="Never miss your MOT"
          targetPath="/recall-check"
        />

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is a vehicle safety recall?</h2>
            <p className="leading-relaxed mb-3">
              A vehicle safety recall is issued when a manufacturer discovers a defect that could pose a risk to the driver, passengers, or other road users. These defects can range from faulty airbags and braking systems to electrical faults and structural weaknesses. Recalls are not uncommon — even brand-new models from major manufacturers can be subject to them.
            </p>
            <p className="leading-relaxed mb-3">
              In the UK, the Driver and Vehicle Standards Agency (DVSA) manages the vehicle recall process. When a manufacturer identifies a safety-critical defect, they notify the DVSA, which records the recall and helps coordinate the response. The DVSA maintains a public database of all vehicle recalls, which our check draws from.
            </p>
            <p className="leading-relaxed">
              Crucially, recall repairs are always free of charge to the vehicle owner. The manufacturer bears the full cost, regardless of the vehicle&apos;s age or warranty status. There is no time limit — you can have a recall repair carried out years after the notice was first issued.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How do recalls work?</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Manufacturer identifies the defect</strong> — The issue is typically discovered through quality monitoring, customer reports, or regulatory testing.</li>
              <li><strong className="text-slate-100">DVSA is notified</strong> — The manufacturer formally reports the defect to the DVSA, including the affected models, production dates, and the nature of the safety risk.</li>
              <li><strong className="text-slate-100">Owners are contacted</strong> — The manufacturer writes to registered keepers by letter, informing them of the recall and what action to take.</li>
              <li><strong className="text-slate-100">Free repair at an authorised dealer</strong> — Owners book their vehicle into an authorised dealer, where the defect is repaired or the faulty part is replaced entirely free of charge.</li>
              <li><strong className="text-slate-100">No time limit</strong> — There is no deadline for getting a recall repair done. Even if the notice was issued years ago, the manufacturer must still carry out the work at no cost.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What our check shows</h2>
            <p className="leading-relaxed mb-3">
              When you enter a registration number, we identify the vehicle&apos;s make, model, and year of manufacture, then match these details against the DVSA recall database. If any recalls have been issued for that model, you&apos;ll see the recall details including the defect description, the safety risk involved, and the recommended remedy.
            </p>
            <p className="leading-relaxed mb-3">
              It&apos;s important to understand that our check uses model-level matching rather than VIN-specific matching. This means we can tell you whether recalls have been issued for your type of vehicle, but we cannot confirm whether the specific repair has already been carried out on your individual car.
            </p>
            <p className="leading-relaxed">
              For the most complete and vehicle-specific recall information, we always recommend checking directly with the manufacturer or an authorised dealer. They can run a VIN check against their internal records and confirm whether any outstanding work is needed on your particular vehicle. Your <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> may also show recall-related advisories that are worth reviewing.
            </p>
          </section>

          <section>
            <ServicingCTA context="generic" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">Is the recall check free?</h3>
                <p className="text-sm mt-1">Yes, completely free. No signup, no payment, no hidden charges. Enter any UK registration number and we&apos;ll check for known safety recalls.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Are recall repairs free?</h3>
                <p className="text-sm mt-1">Yes, always. Manufacturers are legally required to repair safety recall defects at no cost to the vehicle owner, regardless of the age of the vehicle or whether it is still under warranty.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What should I do if my car has a recall?</h3>
                <p className="text-sm mt-1">Contact your vehicle manufacturer or an authorised dealer to arrange the free repair. You can usually book directly through the dealer. There is no time limit on recall repairs.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How accurate is the recall check?</h3>
                <p className="text-sm mt-1">We match your vehicle&apos;s make, model and year against the DVSA recall database. This is model-level matching rather than VIN-specific, so we recommend verifying with the manufacturer for complete records specific to your individual vehicle.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Does a recall affect my car&apos;s value?</h3>
                <p className="text-sm mt-1">An outstanding recall can affect resale value and buyer confidence. However, once the recall repair has been completed (for free at a franchised dealer), it should not negatively affect the vehicle&apos;s value. Having documentation of completed recall work is a positive when selling.</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              For more details on how recalls work, read our <a href="/blog/car-safety-recalls-guide" className="text-blue-400 hover:text-blue-300">complete guide to vehicle safety recalls</a>.
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
