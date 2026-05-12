import type { Metadata } from "next";
import Link from "next/link";
import { Snowflake, AlertTriangle, CheckCircle2 } from "lucide-react";
import PersonalisedCostLookup from "@/components/PersonalisedCostLookup";
import RepairCostCTA from "@/components/RepairCostCTA";

const TITLE = "Aircon Regas Cost UK 2026 — Free Price Guide & Quotes | Free Plate Check";
const DESCRIPTION =
  "Aircon regas costs in the UK typically run £60–£200 depending on refrigerant type. Find out what affects the price, when to regas, and compare quotes from local garages.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "aircon regas cost UK",
    "car air conditioning recharge cost",
    "how much does an aircon regas cost",
    "R134A regas price",
    "R1234YF regas price",
    "air con not cold cost",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/repair-costs/aircon-regas",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.freeplatecheck.co.uk/repair-costs/aircon-regas",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aircon Regas Cost UK — Free Price Guide",
    description: DESCRIPTION,
  },
};

const FAQ = [
  {
    q: "How much does an aircon regas cost in the UK?",
    a: "Typical UK aircon regas prices range from £60 for an older R134A system to £130–£200+ for a newer R1234YF system. The refrigerant type — determined by your car's age — is the single biggest factor in the price.",
  },
  {
    q: "How often should I regas my car's air conditioning?",
    a: "Most manufacturers recommend an aircon service every 2 years, even if the system seems to be working fine. Refrigerant gas slowly leaks from the system over time, and a regular regas keeps the system efficient and prevents long-term damage to compressor seals.",
  },
  {
    q: "Why is R1234YF gas so much more expensive than R134A?",
    a: "R1234YF was introduced from 2011 (mandatory in new cars from 2017) because of stricter EU rules on greenhouse gases. The refrigerant itself costs garages around £100/kg vs. about £8/kg for the older R134A — and that cost is passed on. The equipment to handle it is also more expensive.",
  },
  {
    q: "Does my car use R134A or R1234YF?",
    a: "Most cars registered before 2014 use R134A. Most cars from 2017 onwards use R1234YF. Between 2014 and 2017 it varies by make and model — a garage will check the label under the bonnet before they start. Enter your reg above and we'll show you the year so you have a sensible starting point.",
  },
  {
    q: "Why is my air-con not cold even after a regas?",
    a: "A regas only replaces lost refrigerant. If the air-con isn't cold after a regas, the system probably has a leak (refrigerant has escaped again), a failed compressor, a blocked condenser, or an electrical fault. Most reputable garages will test for leaks as part of the service.",
  },
  {
    q: "Should I regas my air-con before summer?",
    a: "Yes. Spring (April–June) is the smart time to regas. Garages are less busy than peak summer, you avoid the surge in demand, and you'll know your air-con works before you actually need it on a hot day. Some garages even offer pre-summer aircon offers.",
  },
];

export default function AirconRegasPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Repair Costs", item: "https://www.freeplatecheck.co.uk/repair-costs" },
      { "@type": "ListItem", position: 3, name: "Aircon Regas Cost", item: "https://www.freeplatecheck.co.uk/repair-costs/aircon-regas" },
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

      {/* Hero */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-8">
          <Link href="/repair-costs" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            &larr; All repair cost guides
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-700/40 bg-cyan-900/20 px-3 py-1 text-xs font-medium text-cyan-300">
            <Snowflake className="h-3 w-3" />
            UK price guide · Updated 2026
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
            Aircon regas cost UK
          </h1>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            If your car&apos;s air-con is blowing warm or just isn&apos;t as
            cold as it used to be, the cause is almost always lost
            refrigerant. The fix is an aircon regas — but the price you should
            pay depends entirely on what gas your car uses.
          </p>

          <div className="mt-5 inline-block rounded-xl border border-cyan-700/40 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Typical UK price</p>
            <p className="mt-1 text-3xl font-bold text-cyan-400">£60 &ndash; £200</p>
            <p className="mt-1 text-xs text-slate-500">
              Depending on refrigerant type and any repairs needed
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 text-slate-300">
        <PersonalisedCostLookup
          slug="aircon-regas"
          jobName="aircon regas"
          partner="bookMyGarageRepair"
        />

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">What you should pay</h2>
          <p className="leading-relaxed mb-4">
            The single biggest factor in the price of an aircon regas is the
            refrigerant type your car uses — and that&apos;s determined by when
            it was registered. There&apos;s a huge price gap between the two,
            so it&apos;s worth knowing which one applies to you before you
            phone round for quotes.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mt-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">R134A refrigerant</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">£60 &ndash; £95</p>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Found in most cars registered before 2014. The gas itself is
                cheap (~£8/kg) and most independent garages can do this in 30
                minutes.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">R1234YF refrigerant</p>
              <p className="mt-1 text-2xl font-bold text-amber-400">£130 &ndash; £200+</p>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Standard in all new cars from 2017. The gas costs garages
                around £100/kg, and the recovery equipment is far more
                expensive — that&apos;s why the price is so much higher.
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed">
            If you&apos;re between 2014 and 2017, the refrigerant could be
            either — the label under your bonnet will say. Most garages check
            this as part of the service and won&apos;t commit to a price until
            they know.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">When you need one</h2>
          <p className="leading-relaxed mb-4">
            Even a perfectly healthy aircon system loses refrigerant slowly
            over time. Manufacturers typically recommend a regas every
            <strong className="text-slate-100"> 2 years</strong> as preventive
            maintenance. The warning signs that you&apos;re overdue:
          </p>
          <ul className="space-y-2 text-sm">
            {[
              "Air feels less cold than it used to, especially on hot days",
              "Air-con makes an unusual hissing or rattling noise",
              "Visible condensation inside the cabin when the air-con is running",
              "Demister takes longer to clear the windscreen",
              "Musty or damp smell from the vents",
              "Air-con clutch isn't engaging (no faint click when you switch it on)",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">What&apos;s included</h2>
          <p className="leading-relaxed mb-4">
            A standard aircon regas at a UK garage should include:
          </p>
          <ul className="space-y-2 text-sm">
            {[
              "Recovery of any remaining old refrigerant (it can't legally be vented to atmosphere)",
              "Vacuum test to check the system holds pressure (an indicator of leaks)",
              "Refilling with the correct refrigerant type and oil",
              "Visual leak inspection",
              "System operation test — confirming the cabin temperature drops as expected",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed">
            A regas does not include repairs. If the vacuum test reveals a
            leak, the garage will quote separately for the repair — typically
            a condenser, hose or O-ring seal. Expect anywhere from £80 for a
            simple O-ring replacement up to £400+ for a condenser.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">How to save money</h2>
          <ul className="space-y-3 text-sm leading-relaxed">
            <li>
              <strong className="text-slate-100">Book in spring, not summer.</strong>{" "}
              Demand spikes in June and July when temperatures rise. Many
              garages offer pre-summer aircon deals through April and May.
            </li>
            <li>
              <strong className="text-slate-100">Compare independent garages, not chains.</strong>{" "}
              National chains often charge a premium of £20–£40 over an equally
              competent local independent. BookMyGarage shows both side by
              side.
            </li>
            <li>
              <strong className="text-slate-100">Bundle with a service.</strong>{" "}
              Many garages discount aircon regas as an add-on to a full service
              — labour is already on the clock.
            </li>
            <li>
              <strong className="text-slate-100">Don&apos;t pay for "aircon antibacterial treatment" without thinking.</strong>{" "}
              The £25–£40 upsell is genuinely useful if your vents smell musty,
              but otherwise it&apos;s optional. Decide before you arrive.
            </li>
          </ul>
        </section>

        <RepairCostCTA jobName="aircon regas" partner="bookMyGarageRepair" hideRegLookup />

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
            <Link href="/repair-costs/dpf-cleaning" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">DPF cleaning cost UK</p>
              <p className="text-xs text-slate-500 mt-2">Cleaning a blocked diesel particulate filter — typical £150–£500.</p>
            </Link>
            <Link href="/repair-costs/car-battery-replacement" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Car battery replacement cost UK</p>
              <p className="text-xs text-slate-500 mt-2">When to replace and what it should cost — typical £80–£250.</p>
            </Link>
            <Link href="/servicing" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Compare car service prices</p>
              <p className="text-xs text-slate-500 mt-2">Bundle a regas with a service for a better all-in price.</p>
            </Link>
            <Link href="/blog/how-to-spot-garage-overcharging" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to spot garage overcharging</p>
              <p className="text-xs text-slate-500 mt-2">Red flags, written quotes, and getting a second opinion.</p>
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
