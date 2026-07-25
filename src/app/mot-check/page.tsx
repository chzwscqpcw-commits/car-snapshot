import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import MOTBookingCTA from "@/components/MOTBookingCTA";
import ConversionWidget from "@/components/stats/ConversionWidget";
import HeroRegSearch from "@/components/HeroRegSearch";
import TrustBar from "@/components/TrustBar";
import MotReminderBanner from "@/components/MotReminderBanner";
import MotResult from "@/components/tools/MotResult";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";
import SeverityCards from "@/components/SeverityCards";

// Single source of truth for FAQ content — used both for the visible
// accordion and the FAQPage JSON-LD below.
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What does an MOT advisory mean?",
    answer:
      "A note about a component that's not yet bad enough to fail, but needs monitoring. Brake pads wearing thin, tyres near the 1.6mm tread limit, or minor corrosion are typical examples.",
  },
  {
    question: "How far back does MOT history go?",
    answer:
      "Results are available from 2005 onwards — the DVSA has digitally recorded every test since.",
  },
  {
    question: "Can I drive to an MOT test without a valid MOT?",
    answer:
      "Yes — direct to a pre-booked MOT test at a registered centre. The car must still be insured and roadworthy, and you can't make detours.",
  },
  {
    question: "How much does an MOT cost?",
    answer:
      "Maximum £54.85 (set by the DVSA). Many garages undercut this. The test itself takes 45–60 minutes.",
  },
  {
    question: "What's the difference between dangerous, major, and minor defects?",
    answer:
      "Three categories since May 2018. Dangerous = immediate safety risk, don't drive. Major = a failure that must be repaired. Minor = worth fixing but doesn't fail the test.",
  },
];

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export const metadata: Metadata = {
  title: "Free MOT History Check 2026 — Full MOT Results | Free Plate Check",
  description:
    "See every MOT result, advisory and failure since 2005. Check mileage history and spot problems before buying. Free, no signup required.",
  keywords: [
    "MOT check",
    "MOT history check",
    "free MOT check",
    "check MOT history",
    "MOT history by reg",
    "MOT test results",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/mot-check",
  },
  openGraph: {
    title: "Free MOT History Check 2026 — Full MOT Results",
    description:
      "See every MOT result, advisory and failure since 2005. Check mileage history and spot problems before buying.",
    url: "https://www.freeplatecheck.co.uk/mot-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free MOT History Check 2026 — Full MOT Results",
    description:
      "See every MOT result, advisory and failure since 2005. Check mileage history and spot problems before buying.",
  },
};

export default async function MotCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ vrm?: string }>;
}) {
  const params = await searchParams;
  const rawVrm = params?.vrm;
  const cleanedVrm = rawVrm ? cleanReg(rawVrm) : null;
  const hasResult = !!cleanedVrm && cleanedVrm.length >= 2 && cleanedVrm.length <= 8;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

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
        name: "MOT History Check",
        item: "https://www.freeplatecheck.co.uk/mot-check",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — MOT History Check",
    url: "https://www.freeplatecheck.co.uk/mot-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Check any UK vehicle's full MOT history for free. See every test result, advisory and failure since 2005.",
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
          <MotResult vrm={cleanedVrm!} />
          <MotReminderBanner />
        </>
      ) : (
        <>
      {/* --- HERO --- */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_60%)]" />
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
                  Free MOT History Check
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
                    src="/previews/mot-check.png"
                    alt="Sample MOT history result"
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
              Every MOT result, advisory and failure for any UK vehicle since 2005 &mdash; pulled directly from the DVSA.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                Every test result since 2005 with full advisory notes
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                Spot recurring problems and mileage tampering
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                Free MOT reminders — timed how you like
              </li>
            </ul>
          </div>

          {/* DESKTOP LAYOUT (≥lg) */}
          <div className="hidden lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:items-center">
            <div>
              {/* Desktop hero heading — a <p>, not a second <h1>: the mobile
                  layout above already carries the page's single <h1> (one h1
                  per page; fixes Bing's "multiple <h1>" flag). */}
              <p className="text-5xl font-bold text-slate-100 leading-tight">
                Free MOT History Check
              </p>
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
                Every MOT result, advisory and failure for any UK vehicle since 2005 &mdash; pulled directly from the DVSA. Spot recurring issues, verify mileage, and never miss your next MOT.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                  Every test result since 2005 with full advisory notes
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                  Spot recurring problems, mileage tampering and deferred maintenance
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                  Free MOT reminders — you choose when, before it&apos;s due
                </li>
              </ul>
            </div>
            <div className="relative w-fit mx-auto lg:mx-0">
              <Image
                src="/previews/mot-check.png"
                alt="Sample MOT history result"
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

          {/* Hero reg box (graduated valuation_hero_reg_v1 winner). Lower widget
              hides its duplicate lookup (showLookup={false}). */}
          <HeroRegSearch targetPath="/mot-check" ctaLabel="Check MOT history free" className="mt-6" />

          <TrustBar className="mt-7 border-t border-slate-800/70 pt-5" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-12 sm:py-12">
        <ConversionWidget
          headline="Check a vehicle's MOT history"
          subtext="Enter any UK reg plate to see every MOT result, advisory, and mileage reading since 2005 — free and instant."
          reminderHeadline="Never miss your MOT again"
          targetPath="/mot-check"
          showLookup={false}
        />

        <StatCallouts
          stats={[
            { value: "£54.85", label: "Max MOT fee" },
            { value: "3 yrs", label: "First MOT due" },
            { value: "12 mo", label: "Then yearly" },
          ]}
        />

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is an MOT history check?</h2>
            <p className="leading-relaxed mb-3">
              Every UK MOT since 2005 sits in the DVSA&apos;s database. An MOT history check gives you the full record for any vehicle: every test result, mileage reading, advisory, and failure reason.
            </p>
            <p className="leading-relaxed mb-2">
              Since May 2018, defects fall into one of three categories:
            </p>
            <SeverityCards
              cards={[
                { tone: "danger", title: "Dangerous", description: "Immediate safety risk — don't drive." },
                { tone: "warn", title: "Major", description: "Must be repaired before the MOT can pass." },
                { tone: "info", title: "Minor", description: "Worth fixing but doesn't cause a failure." },
              ]}
            />
            <p className="leading-relaxed text-sm text-slate-400 mt-2">
              Before then it was just pass, fail, or advisory.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What can you learn from MOT history?</h2>
            <p className="leading-relaxed mb-3">
              More than pass or fail — the timeline reveals how well a car has been looked after. Watch for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Mileage drops</strong> between tests — possible clocking. UK average is 7,000–10,000 miles per year, so big jumps stand out.</li>
              <li><strong className="text-slate-100">Recurring faults</strong> — the same component flagged year after year points to neglect.</li>
              <li><strong className="text-slate-100">Unresolved advisories</strong> that carry over between tests are a deferred-maintenance flag.</li>
              <li><strong className="text-slate-100">Repeat failures</strong> on safety items (brakes, tyres, lights) vs clean passes — very different stories.</li>
            </ul>
            <p className="leading-relaxed">
              For a year-by-year mileage chart, see the <a href="/mileage-check" className="text-blue-400 hover:text-blue-300">mileage check</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Understanding MOT advisories</h2>
            <p className="leading-relaxed mb-3">
              An advisory is a heads-up: not bad enough to fail, but worth watching. Typical examples:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li>Brake pads or discs wearing thin but above the minimum</li>
              <li>Tyres approaching the 1.6mm legal tread limit</li>
              <li>Minor corrosion on structural or body panels</li>
              <li>Slight oil leaks not yet at failure level</li>
              <li>Worn suspension bushes with minor play</li>
              <li>Scratches outside the driver&apos;s critical viewing area</li>
            </ul>
            <p className="leading-relaxed">
              Same advisory year after year? The owner&apos;s been ignoring it — often a sign of deferred maintenance. More in our <Link href="/blog/what-does-mot-advisory-mean" className="text-blue-400 hover:text-blue-300">guide to MOT advisories</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">When is an MOT due?</h2>
            <p className="leading-relaxed mb-3">
              First MOT is due on the third anniversary of registration. After that, every 12 months.
            </p>
            <p className="leading-relaxed mb-3">
              You can test up to a month minus a day early without losing time — the next certificate still runs from your original expiry date.
            </p>
            <p className="leading-relaxed">
              Vehicles over 40 years old that haven&apos;t been substantially modified are exempt (since 2018), but still need to be roadworthy on public roads.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What happens if you drive without an MOT?</h2>
            <p className="leading-relaxed mb-3">
              Up to &pound;1,000 fine. ANPR cameras flag uninsured vehicles automatically — fixed penalty on the spot.
            </p>
            <p className="leading-relaxed mb-3">
              Your insurance likely voids too. Crash without a valid MOT and you may be personally liable for any damage or injury.
            </p>
            <p className="leading-relaxed">
              One exception: driving directly to a pre-booked test at a registered centre, with no detours. Also worth checking <a href="/tax-check" className="text-blue-400 hover:text-blue-300">tax status</a> while you&apos;re at it.
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" placement="mot-check" />
            <p className="mt-3 text-sm text-slate-400">
              Shopping on price? See how to{" "}
              <a href="/cheap-mot" className="text-blue-400 hover:text-blue-300">find a cheap MOT near you</a>{" "}
              and what garages actually charge.
            </p>
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
          <Link href="/blog/how-much-does-mot-cost" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How Much Does an MOT Cost in 2026?</p>
            <p className="text-xs text-slate-500 mt-2">The maximum fee, typical garage prices, free retests, and how to pay less for your annual test.</p>
          </Link>
          <Link href="/blog/how-to-read-mot-history" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Read a Car&apos;s MOT History</p>
            <p className="text-xs text-slate-500 mt-2">Understand test results, advisories, and how to spot red flags in a vehicle&apos;s history.</p>
          </Link>
          <Link href="/blog/when-is-my-mot-due" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">When Is My MOT Due?</p>
            <p className="text-xs text-slate-500 mt-2">How to check when your MOT is due and make sure you never miss it.</p>
          </Link>
          <Link href="/blog/what-happens-driving-without-mot" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">What Happens if You Drive Without an MOT?</p>
            <p className="text-xs text-slate-500 mt-2">Penalties, insurance issues, and the exceptions you need to know about.</p>
          </Link>
          <Link href="/blog/how-to-appeal-mot-failure" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Appeal an MOT Failure</p>
            <p className="text-xs text-slate-500 mt-2">Your rights explained — how the appeal process works and when it&apos;s worth challenging.</p>
          </Link>
        </div>
      </div>
      <MotReminderBanner />
        </>
      )}
    </div>
  );
}
