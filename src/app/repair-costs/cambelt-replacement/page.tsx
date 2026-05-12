import type { Metadata } from "next";
import Link from "next/link";
import { Cog, AlertTriangle, CheckCircle2 } from "lucide-react";
import PersonalisedCostLookup from "@/components/PersonalisedCostLookup";
import RepairCostCTA from "@/components/RepairCostCTA";

const TITLE = "Cambelt Replacement Cost UK 2026 — Free Price Guide | Free Plate Check";
const DESCRIPTION =
  "Cambelt replacement costs in the UK typically run £300–£950 depending on engine, model and labour rates. Find out when to change a cambelt, why the water pump matters, and compare quotes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "cambelt replacement cost UK",
    "timing belt replacement cost",
    "when to change cambelt",
    "cambelt change price",
    "cambelt water pump cost",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/repair-costs/cambelt-replacement",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.freeplatecheck.co.uk/repair-costs/cambelt-replacement",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cambelt Replacement Cost UK — Free Price Guide",
    description: DESCRIPTION,
  },
};

const FAQ = [
  {
    q: "How much does a cambelt replacement cost in the UK?",
    a: "A cambelt (timing belt) replacement typically costs £300–£950 in the UK, with most jobs landing between £450 and £700. The price varies hugely depending on engine layout — transverse engines are quicker to access than longitudinal ones — and whether you replace the water pump at the same time.",
  },
  {
    q: "When should I change my cambelt?",
    a: "The general rule is every 5 years or 50,000–60,000 miles, whichever comes first — but always check your car's handbook. Some modern engines stretch to 100,000 miles; some performance engines need it every 40,000. A cambelt doesn't fail at a predictable mileage like a brake pad — it fails suddenly.",
  },
  {
    q: "Should I replace the water pump when I change the cambelt?",
    a: "Almost always yes. The water pump is usually driven by the same cambelt, so it's already exposed when the timing cover is off. Replacing it adds £60–£120 to the parts bill but saves you paying £300+ in labour again later when the pump fails — which it usually does within 20,000 miles of a new cambelt.",
  },
  {
    q: "What happens if my cambelt snaps?",
    a: "On most modern engines, a snapped cambelt means the pistons hit the valves at high speed. The result is bent valves at minimum and a destroyed engine at worst — repair bills of £2,000–£5,000 are common, and many cars are written off. That's why preventive replacement is essential.",
  },
  {
    q: "How can I tell if my cambelt needs changing?",
    a: "You usually can't — there are no reliable visible signs of cambelt wear, which is why it's replaced on age and mileage rather than condition. Some cars show a small belt-change indicator light, but most don't. Check the service history for the last replacement date, and your handbook for the interval.",
  },
  {
    q: "Does my car even have a cambelt? Some use chains.",
    a: "Many modern engines use a timing chain instead of a belt — chains last the life of the engine in most cases and don't need scheduled replacement. Generally: most Mercedes-Benz, BMW, and many newer petrol engines use chains; most Ford, Vauxhall, VAG diesels and older petrols use belts. Check your handbook to be sure.",
  },
];

export default function CambeltReplacementPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Repair Costs", item: "https://www.freeplatecheck.co.uk/repair-costs" },
      { "@type": "ListItem", position: 3, name: "Cambelt Replacement Cost", item: "https://www.freeplatecheck.co.uk/repair-costs/cambelt-replacement" },
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/40 bg-amber-900/20 px-3 py-1 text-xs font-medium text-amber-300">
            <Cog className="h-3 w-3" />
            UK price guide · Updated 2026
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
            Cambelt replacement cost UK
          </h1>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            A cambelt (or timing belt) keeps your engine&apos;s valves and
            pistons in time. Replace it on schedule and it&apos;s a
            straightforward big-ticket service job; ignore it and you risk
            destroying the engine entirely.
          </p>

          <div className="mt-5 inline-block rounded-xl border border-amber-700/40 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Typical UK price</p>
            <p className="mt-1 text-3xl font-bold text-amber-400">£300 &ndash; £950</p>
            <p className="mt-1 text-xs text-slate-500">
              Most cars: £450–£700 with water pump included
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 text-slate-300">
        <PersonalisedCostLookup
          slug="cambelt-replacement"
          jobName="cambelt replacement"
          partner="bookMyGarageRepair"
        />

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">What affects the price</h2>
          <p className="leading-relaxed mb-4">
            Cambelt prices vary more than almost any other routine job — a
            small petrol Fiesta can come in at £350, while a transverse-V6
            Audi can push past £900. Three things drive the spread:
          </p>

          <div className="space-y-4 mt-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="text-base font-semibold text-slate-100">1. Engine access</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                On a transverse 4-cylinder (most family cars), the cambelt is
                accessible after removing engine mounts and covers — maybe 3
                hours&apos; labour. On longitudinal V6 or V8 engines, the
                front of the engine sometimes needs to come out — 6+ hours.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="text-base font-semibold text-slate-100">2. Water pump included</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Replacing the water pump while the timing cover is open is
                strongly recommended. Parts: £60–£120. Labour: practically
                nothing extra. Skipping it saves a small amount now and risks
                a £300 repeat job later.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="text-base font-semibold text-slate-100">3. Labour rates</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Greater London garages typically charge £100–£140/hour;
                independent garages in the North or rural areas often £55–£80.
                A 4-hour job at those rates is a £240 swing on labour alone.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">When to change it</h2>
          <p className="leading-relaxed mb-4">
            Cambelts are replaced on{" "}
            <strong className="text-slate-100">time and mileage, not condition</strong>.
            Most car handbooks specify one of these intervals:
          </p>
          <ul className="space-y-2 text-sm">
            {[
              "Every 5 years or 60,000 miles (whichever first) — most modern petrol and diesel",
              "Every 4 years or 40,000 miles — some performance engines and older diesels",
              "Every 10 years or 100,000 miles — newer long-life belts (Ford EcoBoost, some VAG)",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed">
            Note that the <strong className="text-slate-100">time interval matters even at low mileage</strong>.
            A belt that&apos;s done 20,000 miles in 8 years is still 8 years
            old — the rubber compound degrades with heat cycles regardless of
            distance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">What happens if it snaps</h2>
          <div className="rounded-xl border border-red-700/40 bg-red-950/30 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-200">
                  On most modern engines: catastrophic damage
                </p>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Most modern engines are{" "}
                  <em>interference engines</em> — the valves and pistons share
                  the same physical space and rely on the cambelt to keep them
                  out of each other&apos;s way. When the belt snaps, valves
                  bend, pistons crack, and in worst cases the cylinder head
                  needs replacing. Repair bills of £2,000–£5,000 are typical;
                  many older cars are simply written off because the repair
                  costs more than the car is worth.
                </p>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  A handful of older non-interference engines escape with no
                  damage when the belt goes — but if you have to ask, assume
                  yours isn&apos;t one of them.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">How to save money</h2>
          <ul className="space-y-3 text-sm leading-relaxed">
            <li>
              <strong className="text-slate-100">Get 3+ quotes.</strong>{" "}
              Variance on cambelt jobs is huge. The same car can be quoted
              £450 at one independent garage and £900 at a main dealer for
              identical work.
            </li>
            <li>
              <strong className="text-slate-100">Always replace the water pump too.</strong>{" "}
              Refuse the &ldquo;just the belt&rdquo; quote — it&apos;s false
              economy unless your water pump is genuinely brand new.
            </li>
            <li>
              <strong className="text-slate-100">Use an independent specialist, not a main dealer.</strong>{" "}
              Independent garages charge much less and the quality is
              identical when they use OEM-equivalent parts (Gates, Dayco,
              Continental).
            </li>
            <li>
              <strong className="text-slate-100">Combine with other belt-area work.</strong>{" "}
              If you&apos;re due an alternator or aircon compressor — both
              accessory belt items — combine them. The labour overlap saves
              real money.
            </li>
          </ul>
        </section>

        <RepairCostCTA jobName="cambelt replacement" partner="bookMyGarageRepair" hideRegLookup />

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
            <Link href="/repair-costs/clutch-replacement" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Clutch replacement cost UK</p>
              <p className="text-xs text-slate-500 mt-2">Another major service item — typical £400–£1,200.</p>
            </Link>
            <Link href="/repair-costs/dpf-cleaning" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">DPF cleaning cost UK</p>
              <p className="text-xs text-slate-500 mt-2">For diesel owners — cleaning vs replacement costs.</p>
            </Link>
            <Link href="/blog/how-to-check-car-service-history" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to check car service history</p>
              <p className="text-xs text-slate-500 mt-2">Find out when the cambelt was last changed.</p>
            </Link>
            <Link href="/blog/how-to-spot-garage-overcharging" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to spot garage overcharging</p>
              <p className="text-xs text-slate-500 mt-2">Big-ticket jobs are where overcharging happens — what to watch for.</p>
            </Link>
          </div>
        </section>
      </div>

      <div className="border-t border-slate-800 mt-8 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <Link href="/" className="hover:text-slate-300">Home</Link>
            <span>&bull;</span>
            <Link href="/repair-costs" className="hover:text-slate-300">Repair costs</Link>
            <span>&bull;</span>
            <Link href="/servicing" className="hover:text-slate-300">Servicing</Link>
            <span>&bull;</span>
            <Link href="/blog" className="hover:text-slate-300">Guides</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
