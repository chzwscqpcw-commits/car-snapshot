import Link from "next/link";
import type { Metadata } from "next";
import ConversionWidget from "@/components/stats/ConversionWidget";
import LandingHero from "@/components/LandingHero";
import MotReminderBanner from "@/components/MotReminderBanner";
import TempInsuranceCTA from "@/components/TempInsuranceCTA";
import MOTBookingCTA from "@/components/MOTBookingCTA";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is this really free?",
    answer:
      "Yes — no signup, no account, no payment. Free Plate Check pulls from official DVLA and MOT data.",
  },
  {
    question: "What data sources do you use?",
    answer:
      "DVLA Vehicle Enquiry Service for vehicle spec and tax, plus the MOT History API for test results. Both are official UK government feeds.",
  },
  {
    question: "Do you store my registration number?",
    answer:
      "No. Lookups are processed in real time and not retained. See our privacy policy for details.",
  },
  {
    question: "Can I check vans and motorcycles?",
    answer:
      "Yes — any UK-registered vehicle (cars, vans, motorcycles, motorhomes). Same details, same MOT history.",
  },
  {
    question: "What should I do if the details don't match the seller's description?",
    answer:
      "It's a serious red flag. Walk away, or ask for an explanation before proceeding.",
  },
  {
    question: "How often is the data updated?",
    answer:
      "Real-time DVLA and MOT APIs. Tax and MOT status updates typically appear within 24 hours of any change.",
  },
];

export const metadata: Metadata = {
  title: "Free Car Check 2026 — UK Vehicle Lookup | Free Plate Check",
  description:
    "Look up any UK vehicle by reg. See make, model, colour, engine size, fuel type and more from official DVLA data. Free, no signup.",
  keywords: [
    "free car check",
    "car reg check",
    "vehicle check free",
    "number plate lookup",
    "vehicle registration check",
    "car details by reg",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/car-check",
  },
  openGraph: {
    title: "Free Car Check 2026 — UK Vehicle Lookup",
    description:
      "Look up any UK vehicle by reg. See make, model, colour, engine size, fuel type and more from official DVLA data. Free, no signup.",
    url: "https://www.freeplatecheck.co.uk/car-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Car Check 2026 — UK Vehicle Lookup",
    description:
      "Look up any UK vehicle by reg. See make, model, colour, engine size, fuel type and more from official DVLA data. Free, no signup.",
  },
};

export default function CarCheckPage() {
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
        name: "Free Car Check",
        item: "https://www.freeplatecheck.co.uk/car-check",
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
    name: "Free Plate Check — Free Car Check",
    url: "https://www.freeplatecheck.co.uk/car-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Look up any UK vehicle by registration number. See make, model, colour, engine size, fuel type, tax status and MOT history for free.",
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

      <LandingHero
        h1="Free Car Check"
        subtitle="Look up any UK vehicle by registration — DVLA spec, MOT history, tax, mileage, recalls and more. Free, instant, no signup required."
        badgeText="Free · No signup · Official DVLA data"
        bullets={[
          "Official DVLA, DVSA and MOT data — never third-party scrapes",
          "Verify make, model, mileage and history before you buy",
          "Free email reminders 28 + 7 days before your next MOT",
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
            <p className="text-xs text-slate-500">Petrol &middot; 1.4L &middot; Manual</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-emerald-700/30 bg-emerald-900/15 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">MOT</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-300">VALID</p>
                <p className="text-[9px] text-slate-500">to Jan 2027</p>
              </div>
              <div className="rounded-md border border-emerald-700/30 bg-emerald-900/15 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Tax</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-300">TAXED</p>
                <p className="text-[9px] text-slate-500">&pound;190/yr</p>
              </div>
              <div className="rounded-md border border-emerald-700/30 bg-emerald-900/15 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Recalls</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-300">NONE</p>
                <p className="text-[9px] text-slate-500">All clear</p>
              </div>
              <div className="rounded-md border border-emerald-700/30 bg-emerald-900/15 p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">ULEZ</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-300">EURO 6</p>
                <p className="text-[9px] text-slate-500">Compliant</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">mileage</p>
                <p className="text-xs font-semibold text-slate-300">56,400 mi</p>
              </div>
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">valuation</p>
                <p className="text-xs font-semibold text-emerald-400">&pound;6.8k&ndash;&pound;8.4k</p>
              </div>
            </div>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <ConversionWidget
          headline="Check a vehicle now"
          subtext="Enter any UK registration number to see full vehicle details, MOT history, tax status, mileage, and more — instantly."
          reminderHeadline="Keep on top of your MOT"
        />

        <StatCallouts
          stats={[
            { value: "1 in 3", label: "used cars hide history", tone: "warn" },
            { value: "2005", label: "MOT records start" },
            { value: "£0", label: "no signup needed", tone: "good" },
          ]}
        />

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is a free car check?</h2>
            <p className="leading-relaxed mb-3">
              A look-up of any UK reg, drawing on official DVLA data: make, model, colour, fuel type, engine size, CO2, first registration date, year of manufacture, and more.
            </p>
            <p className="leading-relaxed">
              You also get current tax and MOT status, the full MOT history with advisories and mileage, and ULEZ compliance. All from government sources — no third-party scrapes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why check a vehicle before buying?</h2>
            <p className="leading-relaxed mb-3">
              The AA estimates around 1 in 3 used cars has a hidden history issue — clocked mileage, undisclosed damage, the lot. A check is the cheap first step. What it catches:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Mileage fraud</strong> — see clocked odometers via the <a href="/mileage-check" className="text-blue-400 hover:text-blue-300">mileage history</a>.</li>
              <li><strong className="text-slate-100">Wrong description</strong> — verify make/model/colour/engine against DVLA records.</li>
              <li><strong className="text-slate-100">Expired tax or MOT</strong> — confirm via <a href="/tax-check" className="text-blue-400 hover:text-blue-300">tax</a> and <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT</a> status.</li>
              <li><strong className="text-slate-100">ULEZ charges</strong> — check <a href="/ulez-check" className="text-blue-400 hover:text-blue-300">compliance</a> if you drive in clean-air zones.</li>
              <li><strong className="text-slate-100">Safety recalls</strong> — our <a href="/recall-check" className="text-blue-400 hover:text-blue-300">recall check</a> matches against DVSA records.</li>
            </ul>
            <p className="leading-relaxed">
              For high-value purchases, a paid HPI-type check adds finance, write-off, and stolen-vehicle data. For most buyers, the free check is the right starting point.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Free check vs. paid check</h2>
            <p className="leading-relaxed mb-3">
              Free Plate Check includes DVLA spec, full MOT history, tax, mileage, ULEZ, recalls, and a <a href="/car-valuation" className="text-blue-400 hover:text-blue-300">valuation estimate</a>. Paid services (HPI, AA, RAC) add data government APIs don&apos;t expose:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li>Outstanding finance</li>
              <li>Insurance write-off categories (S, N, B, A)</li>
              <li>Stolen vehicle check against the Police National Computer</li>
              <li>V5C logbook verification</li>
            </ul>
            <p className="leading-relaxed">
              Start free. If anything looks off, that&apos;s your cue to spring for the paid one.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to read your results</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Vehicle details</strong> — should match the V5C logbook the seller shows you.</li>
              <li><strong className="text-slate-100">MOT status</strong> — current cert, plus expiry date.</li>
              <li><strong className="text-slate-100">Tax status</strong> — confirm not SORN&apos;d before driving away.</li>
              <li><strong className="text-slate-100">Mileage history</strong> — steady increases across MOTs are healthy. Drops or unexplained jumps are red flags.</li>
            </ul>
            <p className="leading-relaxed">
              For the full pre-purchase checklist see our <Link href="/blog/used-car-checks-before-buying" className="text-blue-400 hover:text-blue-300">buying guide</Link>.
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" />
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
          context="car-check"
          headline="Test-driving this car? Get cover in 90 seconds."
          body="If you're about to test-drive or take delivery of this vehicle, Cuvva offers hourly, daily and weekly insurance you can buy from your phone — no need to wait for an annual policy to start."
        />
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/blog/what-is-hpi-check" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">What Is an HPI Check?</p>
            <p className="text-xs text-slate-500 mt-2">How HPI compares to free car checks and when you should pay for a full report.</p>
          </Link>
          <Link href="/blog/how-to-check-if-car-is-stolen" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Check if a Car Is Stolen</p>
            <p className="text-xs text-slate-500 mt-2">Warning signs and how to protect yourself when buying privately.</p>
          </Link>
          <Link href="/blog/what-does-cat-n-s-mean" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">What Does Cat N and Cat S Mean?</p>
            <p className="text-xs text-slate-500 mt-2">Insurance write-off categories explained — Cat A, B, S and N.</p>
          </Link>
          <Link href="/blog/how-to-spot-a-clocked-car" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Spot a Clocked Car</p>
            <p className="text-xs text-slate-500 mt-2">8 warning signs to watch for using MOT history and wear patterns.</p>
          </Link>
        </div>
      </div>
      <MotReminderBanner />
    </div>
  );
}
