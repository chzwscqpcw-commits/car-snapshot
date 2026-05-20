import type { Metadata } from "next";
import Link from "next/link";
import { Disc, AlertTriangle, CheckCircle2 } from "lucide-react";
import PersonalisedCostLookup from "@/components/PersonalisedCostLookup";
import RepairCostCTA from "@/components/RepairCostCTA";

const TITLE = "Brake Pads Replacement Cost UK 2026: £90–£350 Per Axle";
const DESCRIPTION =
  "Brake pads cost £90–£200 per axle in the UK, or £150–£350 with new discs. See exactly what should be included, signs your pads are worn, and how to avoid overpaying.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "brake pads replacement cost UK",
    "brake pad cost",
    "front brake pads price",
    "brake discs and pads cost",
    "how much to replace brake pads",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/repair-costs/brake-pads-replacement",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.freeplatecheck.co.uk/repair-costs/brake-pads-replacement",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brake Pads Replacement Cost UK 2026: £90–£350 Per Axle",
    description: DESCRIPTION,
  },
};

const FAQ = [
  {
    q: "How much does it cost to replace brake pads in the UK?",
    a: "Brake pad replacement typically costs £90–£200 per axle in the UK (pads only). If the discs need replacing at the same time — which is common — the total per axle rises to £150–£350. Premium and performance cars use more expensive parts and labour goes up accordingly.",
  },
  {
    q: "How often should brake pads be replaced?",
    a: "Front brake pads usually need replacing every 30,000–50,000 miles, while rear pads last longer — often 50,000–70,000 miles. Driving style is a huge factor: heavy urban stop-start driving wears pads faster than motorway commuting. Performance cars and EVs (with regen braking) have different wear patterns again.",
  },
  {
    q: "Should I replace discs at the same time as pads?",
    a: "Often yes. Discs typically last for two sets of pads (60,000–100,000 miles depending on driving). If your discs have a noticeable lip on the edge, are scored, are corroded, or are below minimum thickness, they should be replaced with the pads. A reputable garage will measure the discs before quoting.",
  },
  {
    q: "What are the signs my brake pads need replacing?",
    a: "Squealing or grinding noises when braking, longer stopping distances, a brake warning light, vibration through the pedal, or the car pulling to one side when braking. Many cars also have wear sensors that trigger an electronic warning when pads are close to minimum. Don't ignore any of these — brakes are not optional.",
  },
  {
    q: "Can I just replace the front pads and not the rear?",
    a: "Yes, and that's normal. Front brakes do roughly 70% of stopping work, so front pads wear faster. Replacing fronts only is fine — but make sure the garage checks the rear pads too and tells you their remaining thickness so you can plan.",
  },
  {
    q: "Will worn brake pads fail an MOT?",
    a: "Yes. Brakes are the third most common reason for MOT failure in the UK. Pads worn below 1.5mm of material remaining will fail, as will any visible damage or excessive disc wear. The MOT tester also checks brake performance on a rolling road — uneven braking force across an axle will fail too.",
  },
];

export default function BrakePadsPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Repair Costs", item: "https://www.freeplatecheck.co.uk/repair-costs" },
      { "@type": "ListItem", position: 3, name: "Brake Pads Replacement Cost", item: "https://www.freeplatecheck.co.uk/repair-costs/brake-pads-replacement" },
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-700/40 bg-red-900/20 px-3 py-1 text-xs font-medium text-red-300">
            <Disc className="h-3 w-3" />
            UK price guide · Updated 2026
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
            Brake pads replacement cost UK
          </h1>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Brake pads wear is the third most common cause of MOT failure in
            the UK. Replacing them on time is one of the cheapest ways to
            avoid both a failure and a serious accident. Here&apos;s what to
            expect to pay.
          </p>

          <div className="mt-5 inline-block rounded-xl border border-red-700/40 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Typical UK price</p>
            <p className="mt-1 text-3xl font-bold text-red-400">£90 &ndash; £350</p>
            <p className="mt-1 text-xs text-slate-500">
              Pads only: £90–£200 per axle · Pads + discs: £150–£350 per axle
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 text-slate-300">
        <PersonalisedCostLookup
          slug="brake-pads-replacement"
          jobName="brake pads replacement"
          partner="bookMyGarageRepair"
        />

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Cost by job type</h2>
          <p className="leading-relaxed mb-4">
            What you actually pay depends on what wears out together. Pads
            alone is the cheapest scenario; pads, discs and sometimes
            sensors on both axles is the most expensive.
          </p>

          <div className="space-y-4 mt-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Front pads only</h3>
                <span className="text-lg font-bold text-emerald-400">£90–£180</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Most common job. Front pads do most of the work and wear
                fastest. Small cars at the lower end, performance saloons
                higher.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Front pads + discs</h3>
                <span className="text-lg font-bold text-amber-400">£150–£300</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Standard when the discs are at or near minimum thickness.
                Replacing pads onto worn discs causes uneven wear and
                squealing — avoid the false economy.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Rear pads only</h3>
                <span className="text-lg font-bold text-emerald-400">£90–£180</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Last longer than front pads. Cars with electronic parking
                brakes (most post-2015 cars) cost slightly more due to the
                wind-back tool needed.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">All four corners (pads + discs)</h3>
                <span className="text-lg font-bold text-red-400">£300–£600+</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Comprehensive brake refresh. Often makes sense if you&apos;ve
                bought a high-mileage used car or you&apos;re keeping a car
                long-term and want to reset everything at once.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Signs of worn brake pads</h2>
          <ul className="space-y-2 text-sm">
            {[
              "High-pitched squeal when braking (wear-indicator metal tab touching the disc)",
              "Grinding noise when braking — pads have worn through, metal-on-metal contact",
              "Brake warning light on the dashboard (some cars have wear sensors)",
              "Longer stopping distances or a 'spongy' pedal feel",
              "Pulling to one side under braking (uneven wear, or sticking caliper)",
              "Visible thickness — peer through the wheel spokes, pad material should be at least 3mm",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed">
            Grinding is the &ldquo;you should have done this last week&rdquo;
            noise. By that point pads have worn down to the metal backing
            plate, which scores the disc and forces a disc replacement on top
            of the pads.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">What a good brake job includes</h2>
          <ul className="space-y-2 text-sm">
            {[
              "Measurement of remaining disc thickness vs manufacturer minimum",
              "Replacement of pad anti-rattle clips and shims",
              "Cleaning and lubrication of slider pins (sticking pins cause uneven wear)",
              "Brake fluid level check, top up if needed",
              "Brake pedal bedding-in instruction (gentle braking for first 200 miles)",
              "Quote in writing before any work starts",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        <RepairCostCTA jobName="brake pads replacement" partner="bookMyGarageRepair" hideRegLookup />

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
            <Link href="/repair-costs/car-battery-replacement" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Car battery replacement cost UK</p>
              <p className="text-xs text-slate-500 mt-2">Another routine job — typical £80–£250.</p>
            </Link>
            <Link href="/blog/most-common-mot-failures" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Most common MOT failures</p>
              <p className="text-xs text-slate-500 mt-2">Brakes are #3. Lights and suspension are even worse offenders.</p>
            </Link>
            <Link href="/blog/how-to-prepare-car-for-mot" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to prepare your car for an MOT</p>
              <p className="text-xs text-slate-500 mt-2">A pre-MOT brake check could save you a retest.</p>
            </Link>
            <Link href="/mot-reminder" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Set a free MOT reminder</p>
              <p className="text-xs text-slate-500 mt-2">Never get caught out — email reminders 28 and 7 days before expiry.</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
