import Link from "next/link";
import type { Metadata } from "next";
import ConversionWidget from "@/components/stats/ConversionWidget";
import LandingHero from "@/components/LandingHero";
import MotReminderBanner from "@/components/MotReminderBanner";
import MOTBookingCTA from "@/components/MOTBookingCTA";
import TaxResult from "@/components/tools/TaxResult";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";
import SeverityCards from "@/components/SeverityCards";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I tax my car?",
    answer:
      "Online at GOV.UK, by phone (0300 123 4321), or at a participating Post Office. You'll need the V5C logbook (or the green new-keeper slip), plus a valid MOT if the car is 3+ years old.",
  },
  {
    question: "Can I drive a SORN'd car to an MOT?",
    answer:
      "No. SORN means strictly off-road. Trailer it to the test centre, or tax + insure it before driving.",
  },
  {
    question: "Do electric cars need road tax?",
    answer:
      "EVs registered before April 2025 were exempt. From April 2025, newly-registered EVs pay the standard rate. All EVs must still be registered for tax to be road-legal.",
  },
  {
    question: "What happens if I buy a car that isn't taxed?",
    answer:
      "Road tax doesn't transfer with a sale. Tax it in your name (using the V5C new-keeper slip) before driving away.",
  },
  {
    question: "How much is road tax for my car?",
    answer:
      "Depends on registration date. April 2017+ cars pay a flat £195 standard rate after year one. Pre-April-2017 cars are banded by CO₂. Look up your reg to see the exact figure.",
  },
];

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export const metadata: Metadata = {
  title: "Free Car Tax Check 2026 — Is My Car Taxed? | Free Plate Check",
  description:
    "Check if any UK vehicle is taxed, SORN'd or untaxed. See the expiry date and VED band. Free instant results.",
  keywords: [
    "car tax check",
    "is my car taxed",
    "check vehicle tax",
    "tax check by reg",
    "DVLA tax check",
    "vehicle tax status",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/tax-check",
  },
  openGraph: {
    title: "Free Car Tax Check 2026 — Is My Car Taxed?",
    description:
      "Check if any UK vehicle is taxed, SORN'd or untaxed. See the expiry date and VED band. Free and instant.",
    url: "https://www.freeplatecheck.co.uk/tax-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Car Tax Check 2026 — Is My Car Taxed?",
    description:
      "Check if any UK vehicle is taxed, SORN'd or untaxed. See the expiry date and VED band. Free and instant.",
  },
};

export default async function TaxCheckPage({
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
        name: "Car Tax Check",
        item: "https://www.freeplatecheck.co.uk/tax-check",
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
    name: "Free Plate Check — Car Tax Check",
    url: "https://www.freeplatecheck.co.uk/tax-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Check if any UK vehicle is taxed, SORN'd or untaxed. See the tax expiry date and VED band for free.",
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
          <TaxResult vrm={cleanedVrm!} />
          {/* Slim trust footer below the result */}
          <div className="border-t border-slate-800/60 bg-slate-900/40">
            <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-slate-500">
              Tax status comes from the DVLA&#39;s live VED database. VED rate is
              estimated from current GOV.UK bands — your renewal letter is the
              authoritative figure.
            </div>
          </div>
          <MotReminderBanner />
        </>
      ) : (
        <>
      <LandingHero
        h1="Free Car Tax Check"
        searchTargetPath="/tax-check"
        searchCtaLabel="Check tax status"
        subtitle="Real-time DVLA tax status for any UK vehicle — see if it's taxed, SORN, or due. Plus VED band and annual cost. Free, instant, no signup."
        badgeText="Free · No signup · Real-time DVLA tax data"
        previewImage="tax-check.png"
        bullets={[
          "Real-time DVLA status — taxed, SORN or untaxed",
          "Annual VED rate based on CO₂ band and registration year",
          "Free MOT reminders — timed how you like, before it's due",
        ]}
        exampleCard={
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Example</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                DVLA live
              </span>
            </div>
            <p className="text-sm text-slate-400">
              <span className="font-mono uppercase tracking-wider text-slate-200">AB12 CDE</span>
              <span className="mx-1.5 text-slate-600">&middot;</span>
              2018 VW Golf 1.4 TSI
            </p>
            <p className="text-xs text-slate-500">Petrol &middot; 1.4L &middot; CO₂ 121g/km</p>

            <div className="mt-4 rounded-lg border border-emerald-700/30 bg-gradient-to-br from-emerald-900/30 to-slate-900/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Tax status</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  TAXED
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                Expires 30 Aug 2026
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                123 days remaining
              </p>
            </div>

            <p className="mt-4 text-[10px] font-medium uppercase tracking-wider text-slate-500">Annual VED</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">band</p>
                <p className="text-xs font-semibold text-slate-300">Std</p>
              </div>
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">12 month</p>
                <p className="text-xs font-semibold text-emerald-400">&pound;190</p>
              </div>
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">6 month</p>
                <p className="text-xs font-semibold text-slate-300">&pound;104.50</p>
              </div>
            </div>

            <p className="mt-3 rounded-md bg-amber-500/10 border border-amber-700/30 px-3 py-2 text-[11px] text-amber-300">
              &#9888; Driving untaxed: fine up to &pound;1,000
            </p>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-12 sm:py-12">
        <ConversionWidget
          headline="Check your vehicle's tax status"
          subtext="Enter any UK reg plate to see current tax status, VED band, and MOT expiry — free and instant."
          reminderHeadline="Never miss your MOT or tax renewal"
          targetPath="/tax-check"
          showLookup={false}
        />

        <StatCallouts
          stats={[
            { value: "£195/yr", label: "Standard VED rate" },
            { value: "£80", label: "Untaxed penalty", tone: "warn" },
            { value: "£1,000", label: "Max court fine", tone: "danger" },
          ]}
        />

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is a car tax check?</h2>
            <p className="leading-relaxed mb-3">
              Vehicle Excise Duty (VED) — road tax — is required for any vehicle used or parked on public roads. A check shows current status: taxed, expired, or SORN&apos;d (off-road).
            </p>
            <p className="leading-relaxed">
              The physical tax disc went in October 2014, so online is the only way to confirm. You also get CO₂, fuel type, and the VED band. For the full spec, see our <a href="/car-check" className="text-blue-400 hover:text-blue-300">car check</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How is road tax calculated?</h2>
            <p className="leading-relaxed mb-2">
              Three regimes depending on when the car was first registered:
            </p>
            <SeverityCards
              cards={[
                { tone: "info", title: "Pre-Apr 2017", description: "CO₂-banded A–M. £0 for Band A, up to £600+ for the highest." },
                { tone: "default", title: "Apr 2017+", description: "First year CO₂-based. Then £195/yr flat. £40k+ cars pay £620/yr in years 2–6." },
                { tone: "good", title: "Electric", description: "£0 if registered pre-April 2025. New EVs from Apr 2025 pay the standard rate." },
              ]}
            />
            <p className="leading-relaxed text-sm text-slate-400 mt-2">
              Rates change each Budget. See your reg&apos;s <a href="/car-check" className="text-blue-400 hover:text-blue-300">CO₂ + fuel type</a> to confirm the band.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What does SORN mean?</h2>
            <p className="leading-relaxed mb-3">
              Statutory Off Road Notification — the car&apos;s off the public road. Once SORN&apos;d, it can&apos;t be driven or parked on public roads. Stays in place until taxed, sold, scrapped, or exported.
            </p>
            <p className="leading-relaxed">
              Buying a SORN&apos;d car? Tax it before driving away. It also needs insurance and a valid MOT (if 3+ years old). More in our <Link href="/blog/what-is-sorn-and-when-do-you-need-one" className="text-blue-400 hover:text-blue-300">SORN guide</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What happens if you don&apos;t tax your car?</h2>
            <p className="leading-relaxed mb-3">
              Automatic £80 penalty (£40 if paid within 28 days). Up to £1,000 if it goes to court.
            </p>
            <p className="leading-relaxed">
              The DVLA can also clamp, impound, or crush untaxed vehicles. ANPR enforcement is largely automated. If you&apos;re not using the car, declare a SORN — free, online at GOV.UK or by phone (0300 123 4321).
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" placement="tax-check" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </section>
        </div>
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/blog/how-to-tax-a-car-online" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Tax a Car Online</p>
            <p className="text-xs text-slate-500 mt-2">Step-by-step guide to taxing your car with the DVLA, what you need, and what it costs.</p>
          </Link>
          <Link href="/blog/cheapest-cars-to-tax-uk" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Cheapest Cars to Tax in the UK</p>
            <p className="text-xs text-slate-500 mt-2">Which vehicles pay zero or low road tax, how VED bands work, and how to check.</p>
          </Link>
          <Link href="/blog/how-to-sorn-a-car" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to SORN a Car Online</p>
            <p className="text-xs text-slate-500 mt-2">When you need a SORN and how to declare one — a quick step-by-step guide.</p>
          </Link>
        </div>
      </div>
      <MotReminderBanner />
        </>
      )}
    </div>
  );
}
