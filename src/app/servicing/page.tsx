import type { Metadata } from "next";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How often should I service my car?",
    answer:
      "Every 12 months or 12,000 miles — whichever comes first. Some modern cars use variable intervals based on conditions; check the manual.",
  },
  {
    question: "What's the difference between an interim and full service?",
    answer:
      "Interim covers the essentials — oil, fluids, basic safety check. Full adds air filter, fuel filter (diesel) or spark plugs (petrol), plus a thorough brake/suspension/exhaust/steering inspection.",
  },
  {
    question: "How much does a car service cost?",
    answer:
      "Interim £80–£200 for most family cars. Full £150–£300 for mainstream models, rising to £350–£500+ for premium or large vehicles. EV servicing tends to be cheaper because there are fewer fluids and no spark plugs or fuel filter.",
  },
  {
    question: "Will using a non-dealer garage void my warranty?",
    answer:
      "No — under the Block Exemption Regulation (BER), any VAT-registered garage can service your car without affecting the manufacturer warranty, provided they use equivalent-quality parts and follow the manufacturer's schedule.",
  },
  {
    question: "Is a service the same as an MOT?",
    answer:
      "No. The MOT is a legal annual safety and emissions inspection required for cars 3+ years old. A service is preventative maintenance — oil, filters, fluids and wear checks. You need both, and many garages offer a combined discount.",
  },
  {
    question: "What happens if I skip a service?",
    answer:
      "Accelerated engine wear, lower fuel efficiency, bigger bills later, and a higher chance of MOT failure. It can void the manufacturer warranty and hurts resale value because buyers check service history first.",
  },
  {
    question: "Can I service my own car?",
    answer:
      "Legally, yes — there's nothing stopping you doing your own oil change, air filter or spark plugs at home. The downside is that DIY work doesn't go on the official service history (no garage stamp), which can hurt warranty claims and resale. If you DIY, keep receipts for parts and document the date and mileage of every job.",
  },
  {
    question: "What's the cheapest way to service a car?",
    answer:
      "Use an independent VAT-registered garage rather than a main dealer (typically 30–50% less for identical work), book online rather than walking in, bundle the service with your MOT for a combined discount, and avoid letting the interim slide — fixing neglected oil is far more expensive than the £80–£150 interim that would have prevented it.",
  },
  {
    question: "How long does a full service take?",
    answer:
      "A full service usually takes 2–3 hours of workshop time, though most garages book it in for a half or full day to allow for queueing and any extra work flagged during inspection. Interim services are quicker — typically 1–1.5 hours. Premium cars and complex modern engines can take longer because access to filters and plugs is fiddlier.",
  },
  {
    question: "Do EVs need servicing?",
    answer:
      "Yes, but less of it. EVs have no engine oil, no spark plugs, no fuel filter, no exhaust system and no cambelt — so the service mostly covers brake fluid, coolant for the battery pack, cabin filter, tyres, suspension, lights and a software/HV battery health check. Expect £90–£220 versus £150–£300 for an equivalent petrol or diesel.",
  },
  {
    question: "What's a major service?",
    answer:
      "Sometimes called a manufacturer service or 2-year service. It's a full service plus extra items the manufacturer schedules at longer intervals — typically spark plugs (petrol), fuel filter (diesel), pollen/cabin filter, brake fluid change, coolant change and sometimes gearbox oil. Expect £250–£500 depending on the car.",
  },
  {
    question: "What records should the garage give me?",
    answer:
      "A stamped service book or digital service record entry (most manufacturers since 2018 use a digital record tied to the VIN), an invoice itemising parts and labour, and any advisory notes about items watched but not yet replaced. Keep all of it — buyers and dealers want to see a complete paper or digital trail.",
  },
  {
    question: "Does servicing affect my insurance?",
    answer:
      "Not directly — insurers don't routinely check your service history. But if you make a claim involving a mechanical failure (engine seizure from no oil, brake failure with worn pads ignored at the last MOT), the insurer may investigate and could reduce or refuse the payout if neglected maintenance contributed. A full service history is also worth more to your insurer if the car's written off because settlement is based on market value.",
  },
];

export const metadata: Metadata = {
  title: "Car Service Prices UK 2026 — Compare Quotes Near You | Free Plate Check",
  description:
    "Compare car service prices from local garages. Interim and full service quotes in seconds. No booking fees, no obligation. Enter your reg to get started.",
  keywords: [
    "car service near me",
    "car service cost",
    "car service prices",
    "car servicing UK",
    "interim service",
    "full service car",
    "compare car service quotes",
    "car service booking",
    "service intervals",
    "EV service cost",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/servicing",
  },
  openGraph: {
    title: "Car Service Prices UK 2026 — Compare Quotes Near You",
    description:
      "Compare car service prices from local garages. Interim and full service quotes in seconds.",
    url: "https://www.freeplatecheck.co.uk/servicing",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Service Prices UK 2026 — Compare Quotes Near You",
    description:
      "Compare car service prices from local garages. Interim and full service quotes in seconds.",
  },
};

export default function ServicingPage() {
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
        name: "Car Servicing",
        item: "https://www.freeplatecheck.co.uk/servicing",
      },
    ],
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Car Service Price Comparison",
    url: "https://www.freeplatecheck.co.uk/servicing",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Compare car service prices from local garages across the UK. Enter your registration to get instant quotes.",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/tools"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to all tools
          </a>
          <h1 className="text-3xl font-bold text-slate-100">
            Compare Car Service Prices
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Get instant quotes from local garages — no booking fees, no obligation.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Primary CTA → booking wizard */}
        <div className="mb-8">
          <a
            href="/booking?type=full&source=servicing-page-hero"
            className="block w-full text-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-colors"
          >
            Compare service prices near you &rarr;
          </a>
          <p className="mt-2 text-center text-xs text-slate-500">
            Enter your reg, choose a service, see local prices in 60 seconds.
          </p>
        </div>

        <StatCallouts
          stats={[
            { value: "12 mo", label: "Typical interval" },
            { value: "£80-£500", label: "Interim → full service" },
            { value: "40-60%", label: "Independent vs dealer", tone: "good" },
          ]}
        />

        <div className="space-y-10 text-slate-300">
          {/* What is a car service */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is a car service?</h2>
            <p className="leading-relaxed mb-3">
              A car service is preventative maintenance carried out at intervals set by the manufacturer. The garage drains and replaces engine oil, swaps wear-out filters, tops up fluids, and inspects the brakes, suspension, steering, tyres, exhaust and electrics for anything that&apos;s heading toward failure. The point is to catch small problems while they&apos;re still small — a perished coolant hose for £40 today rather than a cooked head gasket for £1,500 in six months.
            </p>
            <p className="leading-relaxed mb-3">
              Servicing is separate from the MOT. The MOT is a legal annual safety and emissions test that&apos;s required on every car aged three or more years, capped at £54.85, and it tells you whether your car is roadworthy on the day. A service tells you whether your car is going to stay roadworthy until the next test. Many MOT failures — corroded brake pipes, worn pads, blown bulbs, illuminated EML, advisories that turn into majors — are routine service items that simply weren&apos;t kept on top of. Our <a href="/mot-check" className="text-blue-400 hover:text-blue-300">free MOT history check</a> lets you see how a vehicle has been looked after over time.
            </p>
            <p className="leading-relaxed">
              When you&apos;re ready to book, our <a href="/booking?source=servicing-page-intro" className="text-blue-400 hover:text-blue-300">booking wizard</a> pulls your vehicle details from the DVLA, recommends the right service for the car&apos;s age and MOT history, and shows live local prices from independent garages before you commit.
            </p>
          </section>

          {/* When should I service - intervals table */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">When should I service my car?</h2>
            <p className="leading-relaxed mb-3">
              The default rule of thumb is <strong className="text-slate-100">every 12 months or 12,000 miles, whichever comes first</strong>. That covers most mainstream UK cars. But manufacturers each set their own schedules, and some modern cars use condition-based servicing — sensors monitor oil quality, engine load and driving style, and the dashboard tells you when service is due rather than running on a fixed mileage.
            </p>
            <p className="leading-relaxed mb-4">
              The table below shows the published intervals for the most common UK manufacturers. If your car&apos;s manual disagrees with what&apos;s shown here, always go with the manual — these are reference figures, and manufacturers occasionally revise them by model year.
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/80">
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">Manufacturer</th>
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">Typical interval</th>
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">Ford</td>
                    <td className="py-3 px-4">12 months / 12,500 miles</td>
                    <td className="py-3 px-4 text-slate-400">Standard fixed schedule across Fiesta, Focus, Kuga, Puma.</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">Volkswagen</td>
                    <td className="py-3 px-4">12 months / 9,000 miles (fixed) or up to 20,000 (LongLife)</td>
                    <td className="py-3 px-4 text-slate-400">Choose fixed for short trips, LongLife for steady motorway use.</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">BMW</td>
                    <td className="py-3 px-4">Condition-based (typically 18–24 months / 18,000+ miles)</td>
                    <td className="py-3 px-4 text-slate-400">Dashboard CBS indicator counts down per fluid/wear item.</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">Mercedes-Benz</td>
                    <td className="py-3 px-4">12 months / 15,500 miles (Service A/B alternating)</td>
                    <td className="py-3 px-4 text-slate-400">Service A is roughly an interim, B is a full service.</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">Toyota</td>
                    <td className="py-3 px-4">12 months / 10,000 miles</td>
                    <td className="py-3 px-4 text-slate-400">Hybrids follow the same schedule as petrols.</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">Hyundai / Kia</td>
                    <td className="py-3 px-4">12 months / 10,000 miles</td>
                    <td className="py-3 px-4 text-slate-400">Sticking to schedule protects the 5/7-year warranty.</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">Vauxhall</td>
                    <td className="py-3 px-4">12 months / 20,000 miles</td>
                    <td className="py-3 px-4 text-slate-400">Newer models use a flexible schedule via the on-board computer.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-100">Tesla / EVs</td>
                    <td className="py-3 px-4">24 months / no mileage limit (most items)</td>
                    <td className="py-3 px-4 text-slate-400">Brake fluid every 2 years, cabin filter every 2–3, tyre rotation every 6,250 miles.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="leading-relaxed mt-4">
              Service more often than the manufacturer says if you do a lot of <strong className="text-slate-100">short urban trips</strong> (oil never gets up to temperature, condensation builds up), if you regularly tow or carry heavy loads, if you drive on dusty or rough roads, or if the car spends long periods unused. In these conditions an interim every six months is cheap insurance.
            </p>
          </section>

          {/* Interim vs full comparison */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Interim vs full service — what&apos;s included?</h2>

            <p className="leading-relaxed mb-4">
              UK garages broadly offer two service tiers: interim and full. An interim is a half-year top-up that keeps the engine lubricated and the safety basics checked. A full service is the proper annual inspection — same as the interim plus all the wear items the manufacturer schedules once a year. Picking the right one matters: an interim alone won&apos;t protect a warranty, and a full service every six months is overkill for most low-mileage drivers.
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-800 mb-4">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/80">
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">Check / task</th>
                    <th className="text-center py-3 px-4 text-slate-200 font-semibold">Interim</th>
                    <th className="text-center py-3 px-4 text-slate-200 font-semibold">Full</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Engine oil change</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Oil filter replacement</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Top up all fluids (washer, coolant, power steering)</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">25-point safety inspection (tyres, lights, wipers, brakes)</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Battery test</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Air filter replacement</td>
                    <td className="py-3 px-4 text-center text-slate-600">&mdash;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Fuel filter (diesel) / spark plugs (petrol)</td>
                    <td className="py-3 px-4 text-center text-slate-600">&mdash;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Brake fluid moisture check</td>
                    <td className="py-3 px-4 text-center text-slate-600">&mdash;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Antifreeze / coolant strength test</td>
                    <td className="py-3 px-4 text-center text-slate-600">&mdash;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Full ~50-point inspection (suspension, exhaust, steering, drivetrain)</td>
                    <td className="py-3 px-4 text-center text-slate-600">&mdash;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Pollen / cabin filter</td>
                    <td className="py-3 px-4 text-center text-slate-600">&mdash;</td>
                    <td className="py-3 px-4 text-center text-emerald-400">&#10003;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="leading-relaxed mb-3">
              <strong className="text-slate-100">In plain English:</strong> an interim is essentially fresh oil plus a quick poke around the safety basics. It&apos;s designed to be done at the six-month halfway mark between full services, especially for cars doing significant mileage. A full service is what the manufacturer expects once a year to keep the warranty intact and the car running at the spec it left the factory at.
            </p>
            <p className="leading-relaxed">
              Above a full service, some manufacturers schedule a <strong className="text-slate-100">major service</strong> every 2 years or 24,000 miles. That adds brake fluid replacement, coolant flush, spark plugs (if not already done), pollen filter, and sometimes gearbox oil. Expect to pay £250–£500 for a major depending on the car.
            </p>
          </section>

          {/* Service price by car category */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Service price by car category</h2>
            <p className="leading-relaxed mb-4">
              Service prices in the UK aren&apos;t a single number — they scale with the size of the engine, the cost of the parts, the labour time involved, and whether you go to a main dealer or an independent. The ranges below reflect typical 2026 pricing at independent VAT-registered garages. Main dealers generally sit at the top end, sometimes higher; mobile mechanics and budget chains often sit slightly below the lower end but check whether they include genuine parts.
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-800 mb-4">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/80">
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">Example models</th>
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">Interim</th>
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">Full</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">Small petrol / city car</td>
                    <td className="py-3 px-4 text-slate-400">Fiesta, Polo, Picanto, Aygo</td>
                    <td className="py-3 px-4">£100 – £180</td>
                    <td className="py-3 px-4">£180 – £260</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">Medium petrol / hatch</td>
                    <td className="py-3 px-4 text-slate-400">Focus, Golf, Astra, Corolla</td>
                    <td className="py-3 px-4">£120 – £200</td>
                    <td className="py-3 px-4">£200 – £300</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">Large / SUV</td>
                    <td className="py-3 px-4 text-slate-400">Kuga, Tiguan, Qashqai, RAV4</td>
                    <td className="py-3 px-4">£150 – £240</td>
                    <td className="py-3 px-4">£260 – £380</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-medium text-slate-100">Premium / executive</td>
                    <td className="py-3 px-4 text-slate-400">BMW 3/5, Audi A4/A6, Mercedes C/E</td>
                    <td className="py-3 px-4">£200 – £300</td>
                    <td className="py-3 px-4">£350 – £500+</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-100">Electric (EV)</td>
                    <td className="py-3 px-4 text-slate-400">Tesla Model 3/Y, ID.3, Leaf, Kona Electric</td>
                    <td className="py-3 px-4">£90 – £150</td>
                    <td className="py-3 px-4">£150 – £220</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="leading-relaxed mb-3">
              Diesel cars typically sit £20–£40 above the equivalent petrol because of the cost of the fuel filter and, on full services, DPF cleaning/checks. Hybrids land roughly between petrol and EV — they still have an engine that needs oil, spark plugs and a cambelt or chain, but they wear brakes more slowly thanks to regenerative braking.
            </p>
            <p className="leading-relaxed">
              The biggest single saving you can make is choosing an <strong className="text-slate-100">independent garage over a main dealer</strong>. For identical work, independents typically charge 30–50% less, with no impact on warranty (see Block Exemption below). The trade-off: you lose the dealer&apos;s digital service record entry on some manufacturers, though most independents now have access to manufacturer digital systems too.
            </p>
            <p className="leading-relaxed mt-3">
              See what your specific car costs to run overall with our <a href="/running-costs" className="text-blue-400 hover:text-blue-300">running costs calculator</a>, and check whether your tax bill could be lower in our guide to <a href="/blog/cheapest-cars-to-tax-uk" className="text-blue-400 hover:text-blue-300">the cheapest cars to tax in the UK</a>.
            </p>
          </section>

          {/* Signs car needs servicing earlier */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Signs your car needs servicing earlier than scheduled</h2>
            <p className="leading-relaxed mb-3">
              Service intervals are based on average use. If the car&apos;s telling you something&apos;s wrong, don&apos;t wait for the calendar. Most mechanical failures give plenty of warning — the cars that end up on the back of a recovery truck are usually the ones whose owners ignored the early signs for weeks.
            </p>
            <p className="leading-relaxed mb-3">
              Get the car looked at sooner rather than later if you notice any of the following:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Knocking, ticking or tapping from the engine</strong> — often low oil pressure, worn lifters or a stretched timing chain. Pull over if it&apos;s severe.</li>
              <li><strong className="text-slate-100">Dashboard warning lights</strong> — especially the engine management light (EML), oil pressure, battery, or brake warning. Amber is &quot;book it in&quot;, red is &quot;stop driving&quot;.</li>
              <li><strong className="text-slate-100">Blue smoke from the exhaust</strong> — burning oil, often a worn turbo seal or valve stem seal.</li>
              <li><strong className="text-slate-100">Black smoke from the exhaust</strong> — running rich, blocked air filter, faulty injectors or sensor.</li>
              <li><strong className="text-slate-100">White smoke</strong> beyond the usual cold-start condensation — coolant in the cylinders, possibly a head gasket.</li>
              <li><strong className="text-slate-100">Brake squeal, grinding or longer stopping distances</strong> — pads at or below the wear indicator, possibly discs scored.</li>
              <li><strong className="text-slate-100">Smell of fuel</strong> inside or around the car — leaking fuel line, injector seal, or filler neck. Treat as urgent.</li>
              <li><strong className="text-slate-100">Vibrations through the steering wheel</strong> — worn wheel bearings, warped discs, or tracking out of alignment.</li>
              <li><strong className="text-slate-100">Sluggish performance or worse MPG than usual</strong> — clogged filters, dirty injectors, sticking brake caliper.</li>
              <li><strong className="text-slate-100">Difficulty starting</strong> — battery on its way out, starter motor, or fuel system issue.</li>
            </ul>
            <p className="leading-relaxed">
              Cross-reference what you&apos;re seeing with the car&apos;s <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> first. Recurring advisories on the same component over multiple years usually point exactly at the part that&apos;s now failing.
            </p>
          </section>

          {/* Selling section */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Should I service my car if I&apos;m planning to sell?</h2>
            <p className="leading-relaxed mb-3">
              Almost always, yes. A recent service stamp typically adds <strong className="text-slate-100">£200–£500 to the resale value</strong> of a mainstream used car, and considerably more on premium models. Auto Trader and What Car? data consistently show that vehicles with a fresh service and a full service history sell faster and closer to the asking price than identical cars without — buyers will discount their offer to cover the cost of a service they assume they&apos;ll need to do themselves, and they&apos;ll discount more if they suspect deferred maintenance.
            </p>
            <p className="leading-relaxed mb-3">
              The maths usually works out in the seller&apos;s favour. A £200 interim service that adds £350 to the sale price is a clear £150 win, and it removes one of the standard buyer objections (&quot;when was it last serviced?&quot;) that gets used to negotiate the price down. If the next MOT is also coming up within a few months, bundling the service and MOT before listing often pays back several times over.
            </p>
            <p className="leading-relaxed mb-3">
              Two caveats. First, don&apos;t bother with a full service if the car is genuinely at the bottom of the market (under £1,000) — the cost of the service approaches the cost of the car, and buyers in that bracket don&apos;t weight service history heavily. Second, make sure the garage stamps the service book or updates the digital service record. An unrecorded service is essentially invisible at sale time.
            </p>
            <p className="leading-relaxed">
              Get a current valuation with our <a href="/car-valuation" className="text-blue-400 hover:text-blue-300">free car valuation tool</a>, then <a href="/booking?type=full&source=servicing-page-resale" className="text-blue-400 hover:text-blue-300">book a pre-sale service</a> through the booking wizard.
            </p>
          </section>

          {/* Why service matters */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why regular servicing matters</h2>
            <p className="leading-relaxed mb-3">
              Servicing isn&apos;t just about keeping the engine running — it&apos;s the cheapest insurance policy you can buy against the failures that cost real money. A neglected oil change can write off an engine; a missed brake fluid check can mean spongy brakes when you need them; a clogged DPF on a diesel can lead to a £1,500+ regeneration or replacement. The annual cost of staying on top of all that is usually £150–£300, an order of magnitude less than the cost of fixing what goes wrong when you don&apos;t.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Prevents expensive repairs</strong> — catching worn brake pads, belts and hoses early, before they take other components with them.</li>
              <li><strong className="text-slate-100">Keeps fuel efficiency up</strong> — fresh oil, clean filters and correct tyre pressures save real money at the pump over a year.</li>
              <li><strong className="text-slate-100">Protects manufacturer warranty</strong> — Block Exemption rules mean any VAT-registered garage works, but you must follow the schedule.</li>
              <li><strong className="text-slate-100">Improves resale value</strong> — full service history is one of the first things buyers and trade-in valuers check.</li>
              <li><strong className="text-slate-100">Helps pass MOT</strong> — many MOT failures are routine service items left to fester between tests.</li>
              <li><strong className="text-slate-100">Safer on the road</strong> — brakes, tyres, suspension and steering are all inspected as part of a full service.</li>
            </ul>
            <p className="leading-relaxed">
              The Block Exemption Regulation, in force across the UK since 2003, is worth knowing about. It means the manufacturer cannot force you to use a main dealer to keep your warranty valid. Any VAT-registered independent garage can carry out the service, as long as they follow the manufacturer&apos;s schedule and use parts of equivalent quality. That single rule is the reason independents can offer the same warranty-preserving service at 30–50% less.
            </p>
          </section>

          {/* Service vs MOT */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Service vs MOT — what&apos;s the difference?</h2>
            <p className="leading-relaxed mb-4">
              The two get confused often because they both involve a garage and a checklist. They&apos;re different jobs. The MOT is the government&apos;s minimum legal safety bar — pass it and you&apos;re allowed on the road, fail it and you&apos;re not. A service is the manufacturer&apos;s recommendation for keeping the car healthy. Passing an MOT doesn&apos;t mean the car is in great condition, it just means it isn&apos;t dangerous on the day; you can pass an MOT with very dirty oil, a knackered air filter, and brakes that are 1mm above the limit.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/80">
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-2 px-4 text-slate-400 font-medium"></th>
                    <th className="text-left py-2 px-4 text-slate-100 font-medium">Service</th>
                    <th className="text-left py-2 px-4 text-slate-100 font-medium">MOT</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800">
                    <td className="py-2 px-4 text-slate-400">Purpose</td>
                    <td className="py-2 px-4">Preventative maintenance</td>
                    <td className="py-2 px-4">Legal safety &amp; emissions inspection</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 px-4 text-slate-400">Required by law?</td>
                    <td className="py-2 px-4">No (but recommended)</td>
                    <td className="py-2 px-4">Yes — vehicles over 3 years old</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 px-4 text-slate-400">Frequency</td>
                    <td className="py-2 px-4">Every 6–12 months</td>
                    <td className="py-2 px-4">Every 12 months</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 px-4 text-slate-400">What it covers</td>
                    <td className="py-2 px-4">Oil, filters, fluids, wear items</td>
                    <td className="py-2 px-4">Brakes, lights, emissions, structure</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-slate-400">Typical cost</td>
                    <td className="py-2 px-4">£90 – £500+</td>
                    <td className="py-2 px-4">Up to £54.85</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-4 leading-relaxed">
              Many garages offer a combined service + MOT discount of £15–£30. If both are due within a few months of each other, bundle them. Check the next MOT date via our <a href="/mot-check" className="text-blue-400 hover:text-blue-300">free MOT history check</a> or look up the rest of the vehicle&apos;s details with the <a href="/car-check" className="text-blue-400 hover:text-blue-300">full car check</a>.
            </p>
          </section>

          {/* Tips for saving */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to save money on servicing</h2>
            <p className="leading-relaxed mb-3">
              The price you pay for the same service can vary by £100 or more between garages a few miles apart. There&apos;s no consumer protection on service pricing the way there is on the MOT cap, so it pays to be deliberate. Five things consistently move the needle:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Compare quotes</strong> — get 2–3 prices for the same service. Use the <a href="/booking?source=servicing-page-tips" className="text-blue-400 hover:text-blue-300">booking wizard</a> to see local pricing in one go.</li>
              <li><strong className="text-slate-100">Book online</strong> — online prices are usually 10–20% lower than walk-in quotes.</li>
              <li><strong className="text-slate-100">Use independents</strong> — main dealer servicing typically costs 30–50% more for identical work, with no warranty advantage.</li>
              <li><strong className="text-slate-100">Combine with MOT</strong> — almost every garage offers a bundle discount when both are due close together.</li>
              <li><strong className="text-slate-100">Don&apos;t skip the interim</strong> — £100–£150 every six months is far cheaper than the engine damage that comes from running tired oil for 12,000 miles.</li>
            </ol>
            <p className="leading-relaxed">
              Avoid choosing purely on price. The cheapest quote sometimes excludes consumables (oil top-up, washer fluid), uses non-OE filters, or skips items that should be standard. Always check the itemised list of what&apos;s included before booking.
            </p>
          </section>

          {/* Secondary CTA → booking wizard */}
          <section className="rounded-2xl border border-cyan-700/40 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-2">Ready to book?</h2>
            <p className="text-sm text-slate-400 mb-4">
              Enter your reg, confirm the service you need, and we&apos;ll show local garage prices in seconds. No email, no obligation.
            </p>
            <a
              href="/booking?type=full&source=servicing-page-mid"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-colors"
            >
              Start the booking wizard &rarr;
            </a>
          </section>

          {/* FAQ section */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </section>
        </div>
      </div>

      {/* Related links */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related tools</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/booking" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Book MOT or Service</p>
            <p className="text-xs text-slate-500 mt-2">Compare local garage prices in seconds — no email needed.</p>
          </a>
          <a href="/mot-check" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free MOT History Check</p>
            <p className="text-xs text-slate-500 mt-2">See every MOT result, advisory and failure since 2005.</p>
          </a>
          <a href="/mot-reminder" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free MOT Reminder</p>
            <p className="text-xs text-slate-500 mt-2">Get an email 28 days and 7 days before your MOT expires.</p>
          </a>
          <a href="/running-costs" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Running Costs Calculator</p>
            <p className="text-xs text-slate-500 mt-2">Estimate annual fuel, tax, insurance, and servicing costs.</p>
          </a>
          <a href="/car-valuation" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free Car Valuation</p>
            <p className="text-xs text-slate-500 mt-2">Get an instant estimated value based on real market data.</p>
          </a>
          <a href="/repair-costs" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Car Repair Cost Guides</p>
            <p className="text-xs text-slate-500 mt-2">Free UK price guides for cambelt, DPF, aircon, brakes, battery and clutch.</p>
          </a>
          <a href="/blog/mot-vs-service" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">MOT vs Service Guide</p>
            <p className="text-xs text-slate-500 mt-2">Understand what&apos;s covered by each — and whether to combine them.</p>
          </a>
          <a href="/blog/cheapest-cars-to-tax-uk" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Cheapest Cars to Tax in the UK</p>
            <p className="text-xs text-slate-500 mt-2">Cut your annual running costs by hundreds with a lower-tax car.</p>
          </a>
        </div>
      </div>

      {/* Footer */}
    </div>
  );
}
