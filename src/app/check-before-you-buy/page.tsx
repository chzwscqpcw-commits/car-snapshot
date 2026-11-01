import Link from "next/link";
import type { Metadata } from "next";
import LandingHero from "@/components/LandingHero";
import CarVerticalReportCTA from "@/components/CarVerticalReportCTA";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";
import PlateSwitch from "@/components/tools/PlateSwitch";

const PAGE_URL = "https://www.freeplatecheck.co.uk/check-before-you-buy";
const TITLE = "Check a Used Car Before You Buy — Free Buyer's Check | Free Plate Check";
const DESCRIPTION =
  "Buying a used car? Enter the reg from the advert. See if it matches DVLA's record, spot mileage and MOT red flags, and know what a free check can't show. Free, no signup.";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What should I check before buying a used car?",
    answer:
      "Start with the reg from the advert: make sure DVLA's record (make, model, colour, year, engine) matches the car, then read the MOT history for failures, recurring advisories and mileage that goes backwards. Then check what free records can't show — outstanding finance, write-offs and stolen markers — and finish with a proper viewing and test drive.",
  },
  {
    question: "Is this buyer's check really free?",
    answer:
      "Yes. Everything on the buyer's check comes from official DVLA and DVSA MOT data and costs nothing. We point to a paid history report only for the things free government data doesn't hold.",
  },
  {
    question: "Can a free check tell me if a car has outstanding finance?",
    answer:
      "No. Finance agreements, insurance write-offs and police stolen markers aren't in the public DVLA or MOT data, so no free check can show them. You need a paid vehicle history report for those.",
  },
  {
    question: "What does it mean if the details don't match the advert?",
    answer:
      "Sometimes it's a mistake in the advert. But a colour, model or engine size that doesn't match the plate's record is also the classic sign of a cloned car — one wearing another vehicle's plates. Check the VIN on the car against the logbook before you go any further.",
  },
  {
    question: "How can I tell if a car has been clocked?",
    answer:
      "Every MOT since 2005 records the mileage. If a later reading is lower than an earlier one, the buyer's check flags it. A drop can be a recording error or a clocked car — ask the seller and check service records before you buy.",
  },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "check car before buying",
    "used car check",
    "buying a used car checks",
    "free used car check",
    "check a car before you buy it",
    "car check before buying uk",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Check a Used Car Before You Buy",
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Check a Used Car Before You Buy",
    description: DESCRIPTION,
  },
};


export default function CheckBeforeYouBuyPage() {

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Check Before You Buy", item: PAGE_URL },
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

      <PlateSwitch tool="buyer">
        <>
          <LandingHero
            h1="Check a Used Car Before You Buy"
            searchTargetPath="/check-before-you-buy"
            searchCtaLabel="Check this car"
            subtitle="Enter the reg from the advert. We'll show you whether the car matches its DVLA record, every red flag in its MOT and mileage history, and what free records can't tell you."
            badgeText="For buyers · Free · No signup"
            bullets={[
              "Does the car match the advert? Spot clones before you travel",
              "Mileage rollbacks, MOT failures and advisories that keep coming back",
              "A viewing-day checklist built for this model",
            ]}
            sample="buyer"
            tool="check-before-you-buy"
          />

          <div className="mx-auto max-w-3xl px-4 pt-6 pb-12 sm:py-12">
            <StatCallouts
              stats={[
                { value: "4 steps", label: "from advert to handshake" },
                { value: "Since 2005", label: "MOT mileage on record" },
                { value: "£0", label: "for every free check" },
              ]}
            />

            <div className="mt-12 space-y-8 text-slate-300">
              <section>
                <h2 className="mb-4 text-2xl font-bold text-slate-100">How the buyer&apos;s check works</h2>
                <ol className="ml-2 list-inside list-decimal space-y-2">
                  <li>
                    <strong className="text-slate-100">Match the advert.</strong> We show what DVLA holds for the plate.
                    You tick off each detail against the car — a mismatch is the classic sign of a clone.
                  </li>
                  <li>
                    <strong className="text-slate-100">Read the red flags.</strong> Mileage that goes backwards, a
                    failed or expiring MOT, advisories nobody fixed, a logbook issued last month, recalls on the model.
                  </li>
                  <li>
                    <strong className="text-slate-100">Know the blind spots.</strong> Finance, write-offs and stolen
                    markers aren&apos;t in any free record. We tell you plainly, and what it costs to find out.
                  </li>
                  <li>
                    <strong className="text-slate-100">View it properly.</strong> A checklist for the day, including
                    where this model most often fails its MOT.
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-slate-100">What a free check can and can&apos;t tell you</h2>
                <p className="mb-3 leading-relaxed">
                  Government data covers a lot: the vehicle&apos;s identity, tax, every MOT result since 2005 and the
                  mileage at each one. That&apos;s enough to catch clocking, neglected repairs and a car that
                  doesn&apos;t match its plate.
                </p>
                <p className="leading-relaxed">
                  It can&apos;t tell you if the seller still owes money on it, whether an insurer wrote it off, or if
                  it&apos;s been reported stolen. Those are the expensive mistakes — a finance company can repossess a
                  car from its new owner. Our <Link href="/blog/used-car-buying-guide" className="text-blue-400 hover:text-blue-300">used car buying guide</Link>{" "}
                  covers each one.
                </p>
              </section>

              <CarVerticalReportCTA context="buyer-check-carvertical" variant="report" />

              <section>
                <h2 className="mb-4 text-2xl font-bold text-slate-100">Frequently asked questions</h2>
                <FaqAccordion items={FAQ_ITEMS} />
              </section>
            </div>

            <div className="mt-16">
              <h2 className="mb-4 text-lg font-semibold text-slate-200">Related guides</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/blog/how-to-check-if-car-has-finance" className="group block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
                  <p className="text-sm font-semibold text-slate-100 transition-colors group-hover:text-blue-400">How to Check if a Car Has Finance</p>
                  <p className="mt-2 text-xs text-slate-500">Why outstanding finance follows the car, not the seller.</p>
                </Link>
                <Link href="/blog/how-to-spot-a-clocked-car" className="group block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
                  <p className="text-sm font-semibold text-slate-100 transition-colors group-hover:text-blue-400">How to Spot a Clocked Car</p>
                  <p className="mt-2 text-xs text-slate-500">The signs a mileage reading has been wound back.</p>
                </Link>
                <Link href="/blog/should-i-buy-car-with-mot-advisories" className="group block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
                  <p className="text-sm font-semibold text-slate-100 transition-colors group-hover:text-blue-400">Should I Buy a Car With MOT Advisories?</p>
                  <p className="mt-2 text-xs text-slate-500">Which advisories matter and which are routine.</p>
                </Link>
                <Link href="/blog/how-to-check-if-car-is-stolen" className="group block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
                  <p className="text-sm font-semibold text-slate-100 transition-colors group-hover:text-blue-400">How to Check if a Car is Stolen</p>
                  <p className="mt-2 text-xs text-slate-500">Cloning, VIN checks and what to do if you&apos;re suspicious.</p>
                </Link>
              </div>
            </div>
          </div>
        </>
      </PlateSwitch>
    </div>
  );
}
