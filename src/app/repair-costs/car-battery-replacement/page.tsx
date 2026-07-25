import type { Metadata } from "next";
import Link from "next/link";
import { BatteryCharging, AlertTriangle, CheckCircle2 } from "lucide-react";
import PersonalisedCostLookup from "@/components/PersonalisedCostLookup";
import RepairCostCTA from "@/components/RepairCostCTA";

const TITLE = "Car Battery Replacement Cost UK 2026: £80–£250 Fitted";
const DESCRIPTION =
  "A new car battery costs £80–£250 fitted in the UK. Find out if your car needs AGM, EFB or standard, how long batteries last, and why the wrong type fails fast.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "car battery replacement cost UK",
    "car battery price",
    "AGM battery cost",
    "EFB battery cost",
    "how much does a car battery cost",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/repair-costs/car-battery-replacement",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.freeplatecheck.co.uk/repair-costs/car-battery-replacement",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Battery Replacement Cost UK 2026: £80–£250 Fitted",
    description: DESCRIPTION,
  },
};

const FAQ = [
  {
    q: "How much does a car battery cost in the UK?",
    a: "A new car battery typically costs £80–£250 including fitting, depending on the battery type. Standard lead-acid batteries are £80–£120; EFB (Enhanced Flooded Battery) for cars with stop-start is £120–£170; and AGM batteries for more demanding stop-start systems run £160–£250.",
  },
  {
    q: "How long do car batteries last?",
    a: "Most car batteries last 4–5 years. Modern batteries in cars with stop-start technology can last slightly less because of the greater number of cycles. Heavy short-trip use, very cold winters, and electrical accessories left running all shorten battery life. A battery showing weakness at 3+ years old is normal.",
  },
  {
    q: "Can I fit my own car battery?",
    a: "On older cars (pre-2010), yes — many were straightforward DIY jobs. On modern cars it's risky: most need battery 'coding' or 'registration' with diagnostic equipment after fitting so the charging system knows what battery is installed. Skipping this step shortens the new battery's life. A garage with the right diagnostic kit charges £20–£40 for the coding alone.",
  },
  {
    q: "Does my car need an AGM, EFB or standard battery?",
    a: "It depends on whether your car has stop-start. Cars without stop-start: standard lead-acid is fine. Cars with basic stop-start: EFB is the right choice. Cars with energy-recovery and full stop-start (most premium cars from 2014 onwards): AGM. Fitting a cheaper type than your car needs will shorten its life dramatically.",
  },
  {
    q: "What are the signs my car battery is failing?",
    a: "Slow engine cranking (the starter motor sounds sluggish), dashboard warning lights, headlights dimmer at idle than when revving, electronics behaving oddly (stereo resetting, windows slow), or needing a jump-start to get going. Cold mornings often expose a battery that's nearly done.",
  },
  {
    q: "Is it cheaper to get a battery from Halfords than a garage?",
    a: "Halfords offers free fitting if you buy the battery from them and the fitting is straightforward — that can be cheaper than an independent garage for older cars. For newer cars needing coding, an independent specialist with the right diagnostic tools often beats Halfords on total price. Always compare both.",
  },
];

export default function CarBatteryPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Repair Costs", item: "https://www.freeplatecheck.co.uk/repair-costs" },
      { "@type": "ListItem", position: 3, name: "Car Battery Replacement Cost", item: "https://www.freeplatecheck.co.uk/repair-costs/car-battery-replacement" },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-8">
          <Link href="/repair-costs" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            &larr; All repair cost guides
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-900/20 px-3 py-1 text-xs font-medium text-emerald-300">
            <BatteryCharging className="h-3 w-3" />
            UK price guide · Updated 2026
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
            Car battery replacement cost UK
          </h1>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Most car batteries fail at 4–5 years old, and almost always on a
            cold morning when you&apos;re trying to leave the house. The good
            news is that battery replacement is one of the more transparent
            jobs to price — provided you fit the right type.
          </p>

          <div className="mt-5 inline-block rounded-xl border border-emerald-700/40 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Typical UK price</p>
            <p className="mt-1 text-3xl font-bold text-emerald-400">£80 &ndash; £250</p>
            <p className="mt-1 text-xs text-slate-500">
              Including battery, fitting, and coding where required
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 text-slate-300">
        <PersonalisedCostLookup
          slug="car-battery-replacement"
          jobName="car battery replacement"
          partner="bookMyGarageRepair"
        />

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Cost by battery type</h2>
          <p className="leading-relaxed mb-4">
            The price difference between battery types is significant — and
            fitting the wrong type to save money will shorten its life
            dramatically. Match your car&apos;s requirement first, then
            shop around.
          </p>

          <div className="space-y-4 mt-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Standard lead-acid</h3>
                <span className="text-lg font-bold text-emerald-400">£80–£120</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                For cars without stop-start. Most cars built before 2010 fall
                here. Fitting is usually free or under £20 at a parts shop.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">EFB (Enhanced Flooded Battery)</h3>
                <span className="text-lg font-bold text-amber-400">£120–£170</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                For cars with basic stop-start. Designed to handle the more
                frequent charge/discharge cycles of stop-start traffic
                driving.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">AGM (Absorbed Glass Mat)</h3>
                <span className="text-lg font-bold text-red-400">£160–£250</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                For cars with brake-energy recovery and demanding stop-start
                — common on premium German cars from 2014, plus many newer
                family cars. Coding is almost always required after fitting.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed">
            <strong className="text-slate-100">How to tell which you need:</strong>{" "}
            check your handbook, or look at the label on the battery currently
            in the car — it will say AGM, EFB, or neither. A reputable garage
            will check the car&apos;s electrical system requirements before
            quoting.
          </p>
        </section>

        {/* Partner CTA — moved up after the price section; reg entry lives in
            the PersonalisedCostLookup above, hence hideRegLookup. */}
        <RepairCostCTA jobName="car battery replacement" partner="bookMyGarageRepair" hideRegLookup />

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Signs your battery is on the way out</h2>
          <ul className="space-y-2 text-sm">
            {[
              "Engine cranks slowly when starting, especially first thing on a cold morning",
              "Dashboard battery warning light appears intermittently",
              "Stop-start system stops working — usually the first warning sign",
              "Headlights and interior lights noticeably dim at idle",
              "Electronic accessories reset or behave oddly (radio, dash clock)",
              "Needed a jump-start in the last month",
              "Battery is 4+ years old and approaching winter",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">What a good fitting includes</h2>
          <ul className="space-y-2 text-sm">
            {[
              "Battery test before replacement — confirming the battery is actually the issue, not the alternator",
              "Memory saver to keep settings and immobiliser data during the swap",
              "Coding/registration where required (most cars from 2010 onwards)",
              "Terminal clean and corrosion check",
              "Warranty — 3–5 years from most reputable suppliers (Bosch, Yuasa, Varta)",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed">
            <strong className="text-slate-100">Be wary of &#34;battery dead&#34; diagnoses without a test.</strong>{" "}
            Many alternator and starter-motor issues mimic a flat battery.
            Replacing a healthy battery won&apos;t fix an alternator that
            isn&apos;t charging.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-4">FAQ</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-slate-100">{f.q}</h3>
                <p className="text-sm mt-1 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/repair-costs/brake-pads-replacement" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Brake pads replacement cost UK</p>
              <p className="text-xs text-slate-500 mt-2">Another routine job — £90–£350 per axle.</p>
            </Link>
            <Link href="/blog/dashboard-warning-lights" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Dashboard warning lights guide</p>
              <p className="text-xs text-slate-500 mt-2">What the battery, alternator, and charging warnings mean.</p>
            </Link>
            <Link href="/blog/prepare-car-for-winter-uk" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Winter car prep checklist</p>
              <p className="text-xs text-slate-500 mt-2">Battery is the #1 winter breakdown cause — pre-emptive checks.</p>
            </Link>
            <Link href="/repair-costs" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">All repair cost guides</p>
              <p className="text-xs text-slate-500 mt-2">Compare the cost of every common car repair.</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
