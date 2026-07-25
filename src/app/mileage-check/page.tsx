import Link from "next/link";
import type { Metadata } from "next";
import ConversionWidget from "@/components/stats/ConversionWidget";
import LandingHero from "@/components/LandingHero";
import MotReminderBanner from "@/components/MotReminderBanner";
import WarrantyCTA from "@/components/WarrantyCTA";
import ServicingCTA from "@/components/ServicingCTA";
import MileageResult from "@/components/tools/MileageResult";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";
import CarVerticalReportCTA from "@/components/CarVerticalReportCTA";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I check if a car has been clocked?",
    answer:
      "Run a free check here — you'll see the mileage at every MOT since 2005. Drops or large gaps point to tampering. Also look for physical wear (pedals, steering wheel, seat bolsters) inconsistent with a 'low mileage' claim.",
  },
  {
    question: "Is mileage clocking illegal in the UK?",
    answer:
      "Yes — under the Consumer Protection from Unfair Trading Regulations 2008 and the Fraud Act 2006. Misrepresenting mileage carries criminal prosecution and unlimited fines.",
  },
  {
    question: "What is the average mileage per year in the UK?",
    answer:
      "7,000–10,000 miles. A 5-year-old car typically shows 35,000–50,000. Significantly higher or lower deserves a second look.",
  },
  {
    question: "Can Free Plate Check detect clocking?",
    answer:
      "We show every MOT mileage reading and auto-flag drops between tests. MOT history is the most reliable free method — though no tool catches every case.",
  },
  {
    question: "What should I do if the mileage doesn't add up?",
    answer:
      "Don't proceed until the seller can explain it. Ask for service records to corroborate. If you suspect fraud, report to Action Fraud (0300 123 2040) and Trading Standards.",
  },
];

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export const metadata: Metadata = {
  title: "Free Mileage Check 2026 — Spot Clocking | Free Plate Check",
  description:
    "Track odometer readings across MOT tests to spot mileage fraud. See if a car has been clocked before you buy. Free, no signup required.",
  keywords: [
    "mileage check",
    "car mileage history",
    "check mileage by reg",
    "mileage verification",
    "has my car been clocked",
    "odometer check",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/mileage-check",
  },
  openGraph: {
    title: "Free Mileage Check 2026 — Spot Clocking",
    description:
      "Track odometer readings across MOT tests to spot mileage fraud. See if a car has been clocked before you buy. Free, no signup required.",
    url: "https://www.freeplatecheck.co.uk/mileage-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Mileage Check 2026 — Spot Clocking",
    description:
      "Track odometer readings across MOT tests to spot mileage fraud. See if a car has been clocked before you buy. Free, no signup required.",
  },
};

export default async function MileageCheckPage({
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
        name: "Mileage Check",
        item: "https://www.freeplatecheck.co.uk/mileage-check",
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

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Mileage Check",
    url: "https://www.freeplatecheck.co.uk/mileage-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Track odometer readings across MOT tests to spot mileage fraud. Check any UK vehicle's mileage history for free.",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      {hasResult ? (
        <>
          <MileageResult vrm={cleanedVrm!} />
          {/* High-intent: they've just seen the mileage records — offer the full
              history check (clocking/rollback) right here. */}
          <div className="mx-auto max-w-3xl px-4 -mt-2 pb-10">
            <CarVerticalReportCTA
              variant="mileage"
              context="mileage-result-carvertical"
              regNumber={cleanedVrm!}
            />
          </div>
          <MotReminderBanner />
        </>
      ) : (
        <>
      <LandingHero
        h1="Free Mileage Check"
        searchTargetPath="/mileage-check"
        searchCtaLabel="Check mileage free"
        subtitle="Every odometer reading from every MOT test since 2005 — verify mileage and spot clocking instantly. Free, no signup."
        badgeText="Free · No signup · MOT mileage records"
        previewImage="mileage-check.png"
        bullets={[
          "Mileage timeline from every MOT test since 2005",
          "Automatic anomaly flag for potential odometer tampering",
          "Annual mileage trend vs. the UK average",
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
            <p className="text-xs text-slate-500">8 MOT records since 2018</p>

            <div className="mt-4 rounded-lg border border-emerald-700/30 bg-gradient-to-br from-emerald-900/30 to-slate-900/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Latest reading</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  CONSISTENT
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                56,400 mi
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                14 Jan 2026 &middot; no anomalies detected
              </p>
            </div>

            <p className="mt-4 text-[10px] font-medium uppercase tracking-wider text-slate-500">Annual progression</p>
            <div className="mt-2 flex items-end gap-1 h-12 border-b border-slate-800">
              <div className="flex-1 bg-blue-500/40" style={{ height: "20%" }} />
              <div className="flex-1 bg-blue-500/50" style={{ height: "30%" }} />
              <div className="flex-1 bg-blue-500/60" style={{ height: "45%" }} />
              <div className="flex-1 bg-blue-500/65" style={{ height: "52%" }} />
              <div className="flex-1 bg-blue-500/75" style={{ height: "65%" }} />
              <div className="flex-1 bg-blue-500/85" style={{ height: "78%" }} />
              <div className="flex-1 bg-blue-500/95" style={{ height: "90%" }} />
              <div className="flex-1 bg-blue-500" style={{ height: "100%" }} />
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-slate-500">
              <span>2018</span>
              <span>2026</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">avg per year</p>
                <p className="text-xs font-semibold text-slate-300">~7,500 mi</p>
              </div>
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">vs UK avg</p>
                <p className="text-xs font-semibold text-emerald-400">Below</p>
              </div>
            </div>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-12 sm:py-12">
        <ConversionWidget
          headline="Check any vehicle's mileage history"
          subtext="Enter a reg plate to see full MOT mileage records since 2005 — spot clocking and verify the odometer reading."
          reminderHeadline="Stay on top of your MOT"
          targetPath="/mileage-check"
          showLookup={false}
        />

        <div className="mt-8 mb-10">
          <CarVerticalReportCTA variant="mileage" context="mileage-carvertical" />
        </div>

        <StatCallouts
          stats={[
            { value: "1 in 16", label: "cars are clocked", tone: "warn" },
            { value: "7-10k", label: "UK avg miles/year" },
            { value: "Since 2005", label: "MOT mileage on record" },
          ]}
        />

        <div className="mt-12 space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is a mileage check?</h2>
            <p className="leading-relaxed mb-3">
              Every UK MOT records the odometer reading. Stored digitally since 2005, those readings form a mileage timeline for every tested vehicle.
            </p>
            <p className="leading-relaxed">
              It&apos;s the most reliable free way to spot clocking. We show every reading, calculate average annual mileage, and auto-flag drops between tests. Pair it with the full <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> to see advisories and failures alongside.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to spot a clocked car</h2>
            <p className="leading-relaxed mb-3">
              An estimated 1 in 16 UK used cars has been clocked. Illegal, but tough to prosecute. Warning signs:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Mileage drops between MOT tests</strong> — the clearest indicator.</li>
              <li><strong className="text-slate-100">Large gaps without MOT</strong> — possibly off-road specifically to obscure mileage.</li>
              <li><strong className="text-slate-100">Wear inconsistent with stated mileage</strong> — worn pedals, shiny wheel, sagging seats on a &quot;low miles&quot; car.</li>
              <li><strong className="text-slate-100">Unusually low for the age</strong> — UK average is 7,000–10,000/year. A 5-year-old with 15k deserves questions.</li>
              <li><strong className="text-slate-100">Service stamps that don&apos;t match MOT mileage</strong> — story doesn&apos;t add up.</li>
            </ul>
            <p className="leading-relaxed">
              More detail in our <Link href="/blog/how-to-spot-a-clocked-car" className="text-blue-400 hover:text-blue-300">buyer&apos;s guide to clocked cars</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What to do if you suspect clocking</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Review the timeline</strong> — every reading; check annual increases for consistency.</li>
              <li><strong className="text-slate-100">Inspect physical wear</strong> — pedals, wheel, gear knob, bolsters, door handles.</li>
              <li><strong className="text-slate-100">Confront the seller</strong> — ask them to explain. Legitimate sellers should have docs.</li>
              <li><strong className="text-slate-100">Cross-reference service records</strong> — stamps and invoices give an independent paper trail.</li>
              <li><strong className="text-slate-100">Walk away</strong> if the seller can&apos;t explain.</li>
            </ul>
            <p className="leading-relaxed">
              Suspect fraud? Report to Action Fraud (0300 123 2040) and Trading Standards. Already bought? You may have a claim under the Consumer Rights Act 2015.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why mileage matters</h2>
            <p className="leading-relaxed mb-3">
              Mileage drives a used car&apos;s value, insurance, warranty remaining, and service-cost expectations. Brakes, clutches, suspension, timing belts — most service intervals are mileage-based.
            </p>
            <p className="leading-relaxed">
              A high-mileage car with full service history beats a low-mileage one that&apos;s been neglected. Pattern matters more than the number on the clock. Pair this with our <a href="/car-valuation" className="text-blue-400 hover:text-blue-300">free valuation</a> to see how mileage affects market value.
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

      {/* Warrantywise affiliate CTA — renders null until partners.ts pending flag flipped */}
      <div className="max-w-3xl mx-auto px-4 mt-12">
        <WarrantyCTA context="mileage-check" />
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/blog/how-to-check-mileage-used-car" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Check Mileage on a Used Car</p>
            <p className="text-xs text-slate-500 mt-2">Verify mileage history using MOT records and protect yourself from fraud.</p>
          </Link>
          <Link href="/blog/how-to-check-car-service-history" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Check a Car&apos;s Service History</p>
            <p className="text-xs text-slate-500 mt-2">What a full service history means and why gaps should raise red flags.</p>
          </Link>
          <Link href="/blog/how-to-read-mot-history" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Read a Car&apos;s MOT History</p>
            <p className="text-xs text-slate-500 mt-2">Understand test results, advisories, and how to spot red flags.</p>
          </Link>
        </div>
      </div>
      <MotReminderBanner />
        </>
      )}
    </div>
  );
}
