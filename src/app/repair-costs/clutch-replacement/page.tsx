import type { Metadata } from "next";
import Link from "next/link";
import { Gauge, AlertTriangle, CheckCircle2 } from "lucide-react";
import PersonalisedCostLookup from "@/components/PersonalisedCostLookup";
import RepairCostCTA from "@/components/RepairCostCTA";

const TITLE = "Clutch Replacement Cost UK 2026 — Free Price Guide | Free Plate Check";
const DESCRIPTION =
  "Clutch replacement in the UK typically costs £400–£1,200 depending on car, transmission and labour rates. Find out the signs of clutch wear, what's included, and compare quotes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "clutch replacement cost UK",
    "clutch repair cost",
    "how much does a clutch cost",
    "dual mass flywheel cost",
    "slipping clutch repair price",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/repair-costs/clutch-replacement",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.freeplatecheck.co.uk/repair-costs/clutch-replacement",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clutch Replacement Cost UK — Free Price Guide",
    description: DESCRIPTION,
  },
};

const FAQ = [
  {
    q: "How much does a clutch replacement cost in the UK?",
    a: "A clutch replacement typically costs £400–£1,200 in the UK. Small petrol hatchbacks are at the lower end (£400–£600); diesel cars and most cars with a dual-mass flywheel (DMF) are mid-range (£700–£950); larger SUVs, premium cars and 4WD vehicles push past £1,000 routinely.",
  },
  {
    q: "How long does a clutch last?",
    a: "A typical clutch lasts 70,000–100,000 miles in normal driving. Heavy stop-start traffic, aggressive gear changes, riding the clutch pedal, or towing all shorten its life — some clutches fail at 40,000 miles. Drivers with smooth technique on motorway-biased commutes often get past 150,000 miles.",
  },
  {
    q: "What is a dual-mass flywheel and why does it matter?",
    a: "A dual-mass flywheel (DMF) is a vibration-damping flywheel used on most modern diesels and many turbo petrols. They're not cheap (£200–£500 in parts) and they're a wear item — most garages will recommend replacing the DMF with the clutch since you're already in there. Refusing to replace a worn DMF can mean another £700+ bill 6 months later.",
  },
  {
    q: "What are the signs of clutch wear?",
    a: "A high biting point (the clutch engages near the top of pedal travel rather than the middle), slipping under load (revs rise but acceleration doesn't match), juddering as you set off, difficulty engaging gears especially reverse, a burning smell after hill starts, or grating noises when you press the pedal.",
  },
  {
    q: "Can I keep driving with a slipping clutch?",
    a: "You can — for a while — but it's a false economy. A slipping clutch will overheat and damage the flywheel, turning a £600 clutch job into a £1,200 clutch-and-flywheel job. Worse, a clutch can fail completely without warning, leaving you stranded. Once you've identified slip, book a replacement within weeks not months.",
  },
  {
    q: "Are clutch replacements cheaper at independent garages than dealers?",
    a: "Yes — often by 30–50%. The job is mechanically the same and independent specialists do hundreds of clutches a year. Use a garage that specifies OEM-equivalent parts (LUK, Sachs, or Valeo are all top-tier) and you'll get dealer-quality work at a much lower price.",
  },
];

export default function ClutchReplacementPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Repair Costs", item: "https://www.freeplatecheck.co.uk/repair-costs" },
      { "@type": "ListItem", position: 3, name: "Clutch Replacement Cost", item: "https://www.freeplatecheck.co.uk/repair-costs/clutch-replacement" },
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-700/40 bg-purple-900/20 px-3 py-1 text-xs font-medium text-purple-300">
            <Gauge className="h-3 w-3" />
            UK price guide · Updated 2026
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
            Clutch replacement cost UK
          </h1>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            A worn clutch is one of the bigger surprise bills a manual car
            will throw at you. The good news: it&apos;s a job where shopping
            around makes a real difference — the same clutch job can vary by
            £300+ between garages.
          </p>

          <div className="mt-5 inline-block rounded-xl border border-purple-700/40 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Typical UK price</p>
            <p className="mt-1 text-3xl font-bold text-purple-400">£400 &ndash; £1,200</p>
            <p className="mt-1 text-xs text-slate-500">
              Add £200–£500 if the dual-mass flywheel needs replacing too
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 text-slate-300">
        <PersonalisedCostLookup
          slug="clutch-replacement"
          jobName="clutch replacement"
          partner="bookMyGarageRepair"
        />

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Cost by car type</h2>
          <p className="leading-relaxed mb-4">
            The two biggest cost drivers are{" "}
            <strong className="text-slate-100">whether the car has a dual-mass flywheel</strong>{" "}
            and <strong className="text-slate-100">how easy it is to access the gearbox</strong>.
            Most modern diesels need both expensive parts and longer labour.
          </p>

          <div className="space-y-4 mt-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Small petrol hatchback</h3>
                <span className="text-lg font-bold text-emerald-400">£400–£600</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Ford Fiesta, Vauxhall Corsa, VW Polo. Single-mass flywheel,
                straightforward gearbox removal, 4–5 hours&apos; labour.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Diesel saloon / estate</h3>
                <span className="text-lg font-bold text-amber-400">£700–£950</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Most VAG TDIs, BMW 3-series, Ford Mondeo. Dual-mass flywheel
                is the price kicker — almost always recommended to replace it
                alongside.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Large SUV / 4x4</h3>
                <span className="text-lg font-bold text-red-400">£900–£1,400</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Range Rover, Discovery, larger BMWs. Transfer cases and 4WD
                drivetrains add hours of labour. Some need engine subframe
                removal.
              </p>
            </div>
          </div>
        </section>

        {/* Partner CTA — moved up after the price section; reg entry lives in
            the PersonalisedCostLookup above, hence hideRegLookup. */}
        <RepairCostCTA jobName="clutch replacement" partner="bookMyGarageRepair" hideRegLookup />

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">How a clutch wears out — signs to spot early</h2>
          <ul className="space-y-2 text-sm">
            {[
              "Biting point creeps up the pedal travel — fully engaged near the top",
              "Slipping: revs rise under acceleration but speed doesn't match",
              "Judder as you set off in first gear",
              "Difficulty engaging gears, especially reverse",
              "Burning smell after hill starts or stop-go traffic",
              "Grating, rattling or chirping noise when the clutch pedal is depressed",
              "Pedal feels heavy, soft, or sticks to the floor",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed">
            None of these are reasons to panic — a clutch usually gives you
            weeks or months of warning. But once you&apos;ve identified
            slip, plan the replacement. Driving on a slipping clutch
            overheats the flywheel and can double your bill.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">What a good clutch job includes</h2>
          <ul className="space-y-2 text-sm">
            {[
              "Full clutch kit: friction plate, pressure plate, release bearing — all replaced together",
              "Dual-mass flywheel replaced if worn (essential on most diesels)",
              "Concentric slave cylinder replaced where fitted (£60–£120 in parts, but breaks within 50k miles after a clutch job if reused)",
              "Pilot bearing replaced or inspected (rear-wheel-drive only)",
              "Spigot bushing where fitted",
              "Inspection of the input shaft seal and gearbox oil top-up",
              "Quote in writing before starting — including what gets replaced and what is reused",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
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
            <Link href="/repair-costs/cambelt-replacement" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Cambelt replacement cost UK</p>
              <p className="text-xs text-slate-500 mt-2">Another big-ticket service job — £300–£950.</p>
            </Link>
            <Link href="/blog/how-to-spot-garage-overcharging" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to spot garage overcharging</p>
              <p className="text-xs text-slate-500 mt-2">Big-ticket jobs are where dodgy garages add phantom work.</p>
            </Link>
            <Link href="/car-valuation" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Get a free car valuation</p>
              <p className="text-xs text-slate-500 mt-2">If the repair costs more than the car is worth — see what it&apos;s worth.</p>
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
