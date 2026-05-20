import type { Metadata } from "next";
import ConversionWidget from "@/components/stats/ConversionWidget";
import LandingHero from "@/components/LandingHero";
import MotReminderBanner from "@/components/MotReminderBanner";
import ServicingCTA from "@/components/ServicingCTA";
import UlezResult from "@/components/tools/UlezResult";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is the ULEZ check free?",
    answer:
      "Yes — no signup, no payment. Enter a UK reg, see the vehicle's Euro standard and ULEZ status instantly.",
  },
  {
    question: "What Euro standard do I need to be ULEZ compliant?",
    answer:
      "Petrol: Euro 4 or later (~2006 onwards). Diesel: Euro 6 or later (~September 2015 onwards). EVs and hydrogen are exempt.",
  },
  {
    question: "Does ULEZ apply outside London?",
    answer:
      "London has ULEZ; other UK cities (Birmingham, Bath, Bradford, Bristol, Sheffield) run their own Clean Air Zones with similar emission-based charging.",
  },
  {
    question: "How much is the ULEZ charge?",
    answer:
      "£12.50/day for non-compliant cars, motorcycles, and vans. Miss it and the penalty is £180 (£90 if paid within 14 days).",
  },
  {
    question: "Are hybrid cars ULEZ exempt?",
    answer:
      "Not automatically. Hybrids still need to meet the relevant Euro standard for their fuel type. Most modern hybrids do; older ones may not — check the reg.",
  },
  {
    question: "Do other cities have clean air zones?",
    answer:
      "Yes — Birmingham, Bath, Bradford, Bristol, Portsmouth, Sheffield. Charges vary; the Euro emission standards used are largely the same as ULEZ.",
  },
];

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export const metadata: Metadata = {
  title: "Free ULEZ Check — Is My Car ULEZ Compliant? | Free Plate Check",
  description:
    "Check if your car is ULEZ compliant for free. See Euro status, Clean Air Zone charges and exemptions. Enter a registration number to check instantly.",
  keywords: [
    "ULEZ check",
    "is my car ULEZ compliant",
    "free ULEZ check",
    "clean air zone check",
    "ULEZ compliant",
    "London ULEZ",
    "ULEZ checker",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/ulez-check",
  },
  openGraph: {
    title: "Free ULEZ Check — Is My Car ULEZ Compliant?",
    description:
      "Check if your car is ULEZ compliant for free. See Euro status, Clean Air Zone charges and exemptions. Enter a registration number to check instantly.",
    url: "https://www.freeplatecheck.co.uk/ulez-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free ULEZ Check — Is My Car ULEZ Compliant?",
    description:
      "Check if your car is ULEZ compliant for free. See Euro status, Clean Air Zone charges and exemptions. Enter a registration number to check instantly.",
  },
};

export default async function UlezCheckPage({
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
        name: "ULEZ Check",
        item: "https://www.freeplatecheck.co.uk/ulez-check",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — ULEZ Compliance Check",
    url: "https://www.freeplatecheck.co.uk/ulez-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Check if your vehicle meets ULEZ emission standards for free. See Euro status and Clean Air Zone charges instantly.",
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
          <UlezResult vrm={cleanedVrm!} />
          <MotReminderBanner />
        </>
      ) : (
        <>
      <LandingHero
        h1="Free ULEZ Compliance Check"
        subtitle="Instantly check if your car meets London ULEZ and other UK Clean Air Zone standards — see if you'll pay the £12.50/day charge. Free, no signup."
        badgeText="Free · No signup · Real DVLA emissions data"
        previewImage="ulez-check.png"
        bullets={[
          "Euro emission standard pulled straight from DVLA",
          "Covers London ULEZ + Birmingham, Bath, Bristol, Sheffield CAZs",
          "Daily charge calculator — non-compliance can cost £4,500/year",
        ]}
        exampleCard={
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Example</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                DVLA-verified
              </span>
            </div>
            <p className="text-sm text-slate-400">
              <span className="font-mono uppercase tracking-wider text-slate-200">AB12 CDE</span>
              <span className="mx-1.5 text-slate-600">&middot;</span>
              2018 VW Golf 1.4 TSI
            </p>
            <p className="text-xs text-slate-500">Petrol &middot; Euro 6 standard</p>

            <div className="mt-4 rounded-lg border border-emerald-700/30 bg-gradient-to-br from-emerald-900/30 to-slate-900/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">London ULEZ</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  COMPLIANT
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                &pound;0 / day
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                No daily charge applies
              </p>
            </div>

            <p className="mt-4 text-[10px] font-medium uppercase tracking-wider text-slate-500">Other Clean Air Zones</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-2 text-xs">
                <span className="text-slate-300">Birmingham CAZ</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>
                  Compliant
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-2 text-xs">
                <span className="text-slate-300">Bath / Bristol CAZ</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>
                  Compliant
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-2 text-xs">
                <span className="text-slate-300">Sheffield CAZ</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>
                  Compliant
                </span>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-slate-500 text-center">
              Non-compliant: &pound;12.50/day London ULEZ = up to <span className="font-bold text-amber-400">&pound;4,562/yr</span>
            </p>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-12 sm:py-12">
        <ConversionWidget
          headline="Check your vehicle's ULEZ compliance"
          subtext="Enter a reg plate to see if your vehicle meets ULEZ standards — plus full MOT history, tax status, and more."
          reminderHeadline="Stay on top of your MOT"
          targetPath="/ulez-check"
        />

        <StatCallouts
          stats={[
            { value: "£12.50/day", label: "London ULEZ charge", tone: "warn" },
            { value: "£4,562", label: "Annual cost if driven daily", tone: "danger" },
            { value: "£0", label: "EVs & hydrogen", tone: "good" },
          ]}
        />

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is ULEZ?</h2>
            <p className="leading-relaxed mb-3">
              London&apos;s Ultra Low Emission Zone — since 29 August 2023 covering all 32 boroughs. Non-compliant vehicles pay a daily charge to drive within the zone. 24/7, ANPR-enforced.
            </p>
            <p className="leading-relaxed">
              Other UK cities (Birmingham, Bath, Bradford, Bristol, Sheffield) run similar Clean Air Zones with their own boundaries. Our check shows whether your vehicle meets the shared Euro standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">ULEZ charges and exemptions</h2>
            <p className="leading-relaxed mb-3">
              London ULEZ is <strong className="text-slate-100">£12.50/day</strong> for non-compliant cars, motorcycles, and vans. Miss the payment and it&apos;s £180 (£90 if paid within 14 days). Birmingham CAZ is up to £8/day; Bath and Bristol similar.
            </p>
            <p className="leading-relaxed mb-4">
              To be compliant:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li><strong className="text-slate-100">Petrol</strong> — Euro 4 or later (~2006+).</li>
              <li><strong className="text-slate-100">Diesel</strong> — Euro 6 or later (~Sept 2015+).</li>
              <li><strong className="text-slate-100">Electric &amp; hydrogen</strong> — exempt.</li>
              <li><strong className="text-slate-100">Historic</strong> — pre-1 Jan 1973 and registered as historic.</li>
            </ul>
            <p className="leading-relaxed">
              Discounts and grace periods exist (disabled tax class, some military). We show the Euro standard on file so you can determine compliance at a glance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to check your vehicle</h2>
            <p className="leading-relaxed">
              Enter your reg above. You&apos;ll see the recorded Euro emission standard alongside tax, MOT, and full spec. Euro 4+ (petrol) or Euro 6+ (diesel) means compliant. EVs and hydrogen are automatically clear. Full vehicle spec on our <a href="/car-check" className="text-blue-400 hover:text-blue-300">car check</a>.
            </p>
          </section>

          <section>
            <ServicingCTA context="generic" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
            <p className="text-sm text-slate-400 mt-4">
              For the full breakdown, read our <a href="/blog/is-my-car-ulez-compliant" className="text-blue-400 hover:text-blue-300">complete ULEZ guide</a>.
            </p>
          </section>
        </div>
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/blog/euro-emission-standards-explained" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Euro Emission Standards Explained</p>
            <p className="text-xs text-slate-500 mt-2">Euro 1 to Euro 6 — what they are, which standard your car meets, and what it means.</p>
          </a>
          <a href="/blog/how-to-check-car-co2-emissions" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Check a Car&apos;s CO2 Emissions</p>
            <p className="text-xs text-slate-500 mt-2">Why CO2 figures matter for road tax, ULEZ, and running costs.</p>
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
