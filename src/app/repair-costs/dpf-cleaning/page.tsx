import type { Metadata } from "next";
import Link from "next/link";
import { Filter, AlertTriangle, CheckCircle2 } from "lucide-react";
import PersonalisedCostLookup from "@/components/PersonalisedCostLookup";
import RepairCostCTA from "@/components/RepairCostCTA";

const TITLE = "DPF Cleaning Cost UK 2026 — Free Price Guide | Free Plate Check";
const DESCRIPTION =
  "DPF cleaning in the UK costs £150–£500 depending on method, while replacement costs £1,000–£3,500. See cleaning vs replacement, when to clean, and compare local garage quotes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "DPF cleaning cost UK",
    "DPF cleaning price",
    "diesel particulate filter cost",
    "DPF replacement cost",
    "DPF regeneration cost",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/repair-costs/dpf-cleaning",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.freeplatecheck.co.uk/repair-costs/dpf-cleaning",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "DPF Cleaning Cost UK — Free Price Guide",
    description: DESCRIPTION,
  },
};

const FAQ = [
  {
    q: "How much does DPF cleaning cost in the UK?",
    a: "DPF cleaning typically costs £150–£500 in the UK, depending on the method used. Forced regeneration (the cheapest option) is £80–£150. Chemical cleaning is £200–£400. Off-car ultrasonic cleaning — the most thorough method — costs £250–£500. DPF replacement, if cleaning isn't possible, is £1,000–£3,500.",
  },
  {
    q: "Can I clean a DPF myself?",
    a: "You can sometimes complete a DIY 'active regeneration' by driving the car steadily at over 40mph for 20–30 minutes — this raises exhaust temperature enough to burn off soot. DIY chemical additives also exist (£15–£30) for early-stage clogs. But once the warning light is solid and the car's in limp mode, you need professional cleaning.",
  },
  {
    q: "What causes a DPF to block?",
    a: "Mostly short journeys. The DPF needs to reach around 600°C to regenerate properly, which requires sustained motorway-speed driving. Cars used almost entirely for short urban trips never get hot enough and the soot accumulates. Diesel drivers who do mostly under-10-mile trips are the most affected.",
  },
  {
    q: "Will a blocked DPF fail my MOT?",
    a: "Yes. From 2014, MOT testers must check for the presence of a DPF and run a visual smoke test. A blocked DPF will typically fail the emissions check. A removed or 'gutted' DPF is an automatic MOT failure and is illegal under the Construction and Use Regulations.",
  },
  {
    q: "Is it cheaper to remove the DPF than clean it?",
    a: "Removing or 'deleting' a DPF is illegal on UK roads, even though some garages offer it. The car will fail its MOT, the insurance can be voided, and you can be fined up to £1,000 (£2,500 for a van). Cleaning is the legal option — and even an expensive professional clean is cheaper than the consequences of removal.",
  },
  {
    q: "How can I prevent DPF blockages?",
    a: "Once a month, take the car on a 20–30 minute journey at sustained motorway speed — ideally with the engine fully warmed up. This triggers a passive regeneration that keeps the filter clear. Use the correct low-SAPS engine oil for your car (it's specified in the handbook), don't ignore early warning lights, and avoid short-trip-only driving where possible.",
  },
];

export default function DpfCleaningPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Repair Costs", item: "https://www.freeplatecheck.co.uk/repair-costs" },
      { "@type": "ListItem", position: 3, name: "DPF Cleaning Cost", item: "https://www.freeplatecheck.co.uk/repair-costs/dpf-cleaning" },
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-300">
            <Filter className="h-3 w-3" />
            UK price guide · Updated 2026
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
            DPF cleaning cost UK
          </h1>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            If your diesel&apos;s DPF warning light is on — or you&apos;ve hit
            limp mode — the filter is clogged with soot. The good news is
            cleaning is far cheaper than the £1,000+ replacement cost. The
            trick is acting before the damage is done.
          </p>

          <div className="mt-5 inline-block rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Typical UK price</p>
            <p className="mt-1 text-3xl font-bold text-slate-100">£150 &ndash; £500</p>
            <p className="mt-1 text-xs text-slate-500">
              Replacement: £1,000–£3,500 if cleaning isn&apos;t possible
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 text-slate-300">
        <PersonalisedCostLookup
          slug="dpf-cleaning"
          jobName="DPF cleaning"
          partner="bookMyGarageRepair"
        />

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Cleaning methods and what they cost</h2>
          <p className="leading-relaxed mb-4">
            Not all DPF cleaning is the same. Garages typically offer a tiered
            approach — the cheaper methods first, escalating only if those
            don&apos;t shift the blockage.
          </p>

          <div className="space-y-4 mt-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">1. Forced regeneration</h3>
                <span className="text-lg font-bold text-emerald-400">£80–£150</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                A garage forces the engine&apos;s computer to run a high-
                temperature regen cycle that the car couldn&apos;t complete
                itself. Quickest, cheapest, works for light blockages caught
                early.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">2. Chemical cleaning (on-car)</h3>
                <span className="text-lg font-bold text-amber-400">£200–£400</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Specialist cleaning fluid is injected into the DPF, broken
                down, then flushed out. Effective for moderate blockages and
                doesn&apos;t require removing the filter.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">3. Off-car ultrasonic cleaning</h3>
                <span className="text-lg font-bold text-red-400">£250–£500</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                The DPF is removed from the car and cleaned in a specialist
                ultrasonic bath. Most thorough method and the last option
                before replacement. Takes 1–2 days.
              </p>
            </div>
            <div className="rounded-xl border border-red-700/40 bg-red-950/30 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-red-200">4. Full replacement</h3>
                <span className="text-lg font-bold text-red-300">£1,000–£3,500</span>
              </div>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                If the substrate inside the filter is cracked or melted, or
                cleaning hasn&apos;t worked, replacement is the only legal
                option. Audi/BMW DPFs are the most expensive; small French
                hatch parts are at the lower end.
              </p>
            </div>
          </div>
        </section>

        {/* Partner CTA — moved up after the price section; reg entry lives in
            the PersonalisedCostLookup above, hence hideRegLookup. */}
        <RepairCostCTA jobName="DPF cleaning" partner="bookMyGarageRepair" hideRegLookup />

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Signs your DPF needs attention</h2>
          <ul className="space-y-2 text-sm">
            {[
              "DPF warning light on the dashboard (orange first, then red)",
              "Reduced power / engine going into 'limp mode'",
              "Increased fuel consumption with no other explanation",
              "Smell of unburnt diesel from the exhaust",
              "Engine stalls or hesitates at low revs",
              "Cooling fans running hard after you stop the engine",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed">
            If only the orange warning light is on,{" "}
            <strong className="text-slate-100">try a 20-minute motorway run first</strong>.
            For a lot of cars that triggers an automatic regeneration and
            clears the light entirely. If the light stays on or goes red, a
            garage trip is needed before the blockage causes damage.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">How to prevent blockages</h2>
          <ul className="space-y-2 text-sm">
            {[
              "Once a month: 20–30 minute drive at sustained 50+ mph in 4th/5th gear",
              "Use the correct 'low SAPS' engine oil for your car (it's in the handbook)",
              "Don't ignore the orange warning light — that's the only chance to fix it cheaply",
              "Keep the diesel tank above quarter full — running on fumes affects fuel pressure",
              "If you mostly do short trips, consider whether a petrol car suits you better",
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
            <Link href="/repair-costs/aircon-regas" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Aircon regas cost UK</p>
              <p className="text-xs text-slate-500 mt-2">Why the price depends entirely on your refrigerant type.</p>
            </Link>
            <Link href="/blog/dashboard-warning-lights" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Dashboard warning lights guide</p>
              <p className="text-xs text-slate-500 mt-2">Every dashboard symbol explained, plus the cost to fix.</p>
            </Link>
            <Link href="/blog/petrol-vs-diesel-vs-hybrid-vs-electric" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Petrol vs diesel vs hybrid vs electric</p>
              <p className="text-xs text-slate-500 mt-2">Whether diesel still makes sense for your driving pattern.</p>
            </Link>
            <Link href="/mot-check" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Check MOT history</p>
              <p className="text-xs text-slate-500 mt-2">DPF advisories show up in MOT records — see your car&apos;s history.</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
