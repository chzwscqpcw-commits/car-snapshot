import Link from "next/link";
import type { Metadata } from "next";
import MotPriceFinder from "@/components/MotPriceFinder";
import MOTBookingCTA from "@/components/MOTBookingCTA";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";
import SeverityCards from "@/components/SeverityCards";

// Single source of truth for FAQ content — used both for the visible
// accordion and the FAQPage JSON-LD below.
//
// This page is the pillar for the whole cheap-MOT cluster. Until 31 Oct 2026
// five blog posts (how much an MOT costs, how to get a cheaper MOT, the
// cheapest place to get one, whether cheap deals are worth it, free MOTs)
// competed with it for the same queries at 1–23 views a month each, while
// this page converted 76% of its landers into a booking start. Their content
// now lives in the sections below and the old URLs redirect here
// (next.config.ts), section by section where one matches.
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is the cheapest an MOT can be?",
    answer:
      "There's no legal minimum — only a maximum of £54.85 for a Class 4 car. Independent garages often charge £30–£45, and some chains run promotional MOTs as low as £20–£25 to win your business (hoping you'll book repairs or a service with them too). Comparing local garages is the only way to see who's cheapest near you.",
  },
  {
    question: "How much does an MOT cost in 2026?",
    answer:
      "The maximum fee for a Class 4 vehicle (most cars) is £54.85, set by the DVSA and unchanged for years. Many garages charge below it — typically £25 to £50 depending on your area. Motorcycles are capped lower (£29.65) and larger vans (Class 7) higher (£58.60).",
  },
  {
    question: "Why are some MOTs so cheap?",
    answer:
      "A cheap or even free MOT is usually a loss-leader: the garage makes its money on any repairs, servicing or future visits. The test itself is identical wherever you go — it follows the same DVSA standard and is logged to the same national database — so a £25 MOT is exactly as valid as a £54.85 one.",
  },
  {
    question: "Is a cheap MOT lower quality than an expensive one?",
    answer:
      "No. Every MOT follows the same DVSA inspection manual and the tester records the result on the same government system. A garage cannot legally do a 'lighter' test for less money. What varies is repair labour rates if your car fails — so it's worth checking those too, not just the headline test price.",
  },
  {
    question: "Where is the cheapest place to get an MOT?",
    answer:
      "There's no single cheapest option — it varies by area. Council-run test centres and high-volume independents are often the cheapest because they don't profit from repairs, while national chains run frequent promotions that can undercut everyone. The only reliable way to find the cheapest is to compare local prices for your reg.",
  },
  {
    question: "Are council MOT test centres cheaper?",
    answer:
      "Often, yes. Council-run test centres are 'non-trading' stations that only test — they don't carry out repairs, so they have no incentive to fail your car for work. They aren't available everywhere, but where they exist they're frequently among the cheapest and most impartial options.",
  },
  {
    question: "Is Halfords or Kwik Fit cheaper for an MOT?",
    answer:
      "Both national chains run regular MOT promotions and online discount codes, so the cheaper one changes week to week and by location. Their standard prices are similar; the deciding factor is usually whichever has a live offer in your area when you book.",
  },
  {
    question: "Can I get a free MOT?",
    answer:
      "Sometimes. The most common way is a free MOT bundled with a paid service, which many garages and chains offer. You may also qualify for a free or reduced-fee partial retest if your car fails and you fix the faults within 10 working days at the same centre. Genuinely no-strings free MOTs are rare and usually time-limited promotions — always confirm what's required to qualify.",
  },
  {
    question: "Do you have to pay for an MOT retest if your car fails?",
    answer:
      "Not always. If the repairs are done at the same testing station, a partial retest is usually free if completed within 10 working days. If you take the car elsewhere for repair and return for a full retest, you may need to pay again. It's standard practice rather than a legal right, so confirm the terms before you leave the car.",
  },
  {
    question: "When is the cheapest time to book an MOT?",
    answer:
      "Weekdays tend to be cheaper than weekends, and booking in advance often gets you a better price than a walk-in. January and February are typically quieter months for garages, so you may find more competitive offers then. March and September are the busiest, as plate-change cars all come due together.",
  },
  {
    question: "Does booking through Free Plate Check cost more?",
    answer:
      "No. Comparing and booking through us is free and the price you pay the garage is exactly the same as going direct. We earn a small affiliate commission from BookMyGarage when you book — it never changes your price.",
  },
];

export const metadata: Metadata = {
  title: "Cheap MOT Near You — Compare Local Garage Prices 2026 | Free Plate Check",
  description:
    "Find a cheap MOT near you. Compare local garage prices in seconds — many charge well below the £54.85 legal maximum. What an MOT costs, where it's cheapest, free MOTs and retests. No signup, no email.",
  keywords: [
    "cheap MOT",
    "cheap MOT near me",
    "discount MOT",
    "MOT prices",
    "compare MOT prices",
    "MOT cost near me",
    "how much does an MOT cost",
    "MOT cost 2026",
    "cheapest place to get MOT",
    "free MOT",
    "MOT deals",
    "cheapest MOT",
    "MOT offers",
    "book MOT online",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/cheap-mot",
  },
  openGraph: {
    title: "Cheap MOT Near You — Compare Local Garage Prices",
    description:
      "Compare local MOT prices in seconds — many garages charge well below the £54.85 legal maximum. Free, no signup.",
    url: "https://www.freeplatecheck.co.uk/cheap-mot",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cheap MOT Near You — Compare Local Garage Prices",
    description:
      "Compare local MOT prices in seconds — many garages charge well below the £54.85 legal maximum.",
  },
};

/** The on-page sections — also the anchors the redirected blog posts land on. */
const SECTIONS = [
  { id: "how-much-should-an-mot-cost", label: "What an MOT costs" },
  { id: "how-to-get-a-cheaper-mot", label: "9 ways to pay less" },
  { id: "cheapest-place-to-get-an-mot", label: "Where it's cheapest" },
  { id: "are-cheap-mot-deals-worth-it", label: "Are cheap deals worth it?" },
  { id: "free-mot", label: "Free MOTs" },
  { id: "free-retests", label: "Free retests" },
  { id: "mot-prices-in-your-area", label: "Prices by area" },
] as const;

const linkClass = "text-blue-400 hover:text-blue-300";

export default function CheapMotPage() {
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
        name: "Cheap MOT — Compare Prices",
        item: "https://www.freeplatecheck.co.uk/cheap-mot",
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

  // Service schema — appropriate for a commercial booking/comparison surface
  // (vs the WebApplication schema used on the data-lookup tool pages). The
  // priceSpecification anchors the regulated £0–£54.85 MOT price band.
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "MOT test price comparison and booking",
    name: "Compare cheap MOT prices near you",
    provider: {
      "@type": "Organization",
      name: "Free Plate Check",
      url: "https://www.freeplatecheck.co.uk",
    },
    areaServed: { "@type": "Country", name: "United Kingdom" },
    description:
      "Compare MOT prices from local garages across the UK. Many charge below the £54.85 legal maximum. Free comparison, no signup.",
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "GBP",
        minPrice: "0",
        maxPrice: "54.85",
      },
    },
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

          <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-10 lg:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 leading-tight">
                Cheap MOT near you
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                Compare MOT prices from local garages in seconds. The legal
                maximum is <strong className="text-slate-100">&pound;54.85</strong>{" "}
                &mdash; but many garages charge a lot less, and the test is
                identical wherever you go.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-400">
                {[
                  "Compare local garage prices — many beat the £54.85 cap",
                  "Same DVSA test everywhere — cheaper doesn't mean lighter",
                  "Free comparison, no signup, no email",
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tool-first: price finder sits in the hero on desktop, directly
                under the headline on mobile. */}
            <div className="mt-6 lg:mt-0">
              <MotPriceFinder source="cheap_mot_hero" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8 pb-12 sm:py-12">
        <StatCallouts
          stats={[
            { value: "£54.85", label: "Legal max (Class 4)" },
            { value: "from ~£30", label: "Typical local price", tone: "good" },
            { value: "£0", label: "Free retest if fixed in 10 days", tone: "good" },
          ]}
        />

        {/* On this page — the guide below is long because it now carries the
            whole cheap-MOT cluster; a jump list keeps the comparison box one
            scroll away. */}
        <nav aria-label="On this page" className="mb-8 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-blue-300"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-10 text-slate-300">
          {/* ---------- 1. What an MOT costs ---------- */}
          <section id="how-much-should-an-mot-cost" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How much should an MOT cost?</h2>
            <p className="leading-relaxed mb-3">
              The MOT fee is capped, not fixed. The DVSA sets a{" "}
              <strong className="text-slate-100">maximum of &pound;54.85</strong>{" "}
              for a Class 4 vehicle (most cars and small vans), and garages are
              free to charge anything up to that. No garage in the UK can charge
              more than the cap for the test itself; plenty charge well below it.
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-900/80 text-slate-200">
                  <tr>
                    <th scope="col" className="text-left px-3 py-2 font-semibold">Vehicle</th>
                    <th scope="col" className="text-right px-3 py-2 font-semibold">Legal maximum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    ["Cars, motorhomes and vans up to 3,000kg (Class 4)", "£54.85"],
                    ["Larger vans, 3,000–3,500kg (Class 7)", "£58.60"],
                    ["Motorcycles (Class 1 and 2)", "£29.65"],
                    ["Three-wheeled vehicles up to 450kg", "£37.80"],
                  ].map(([v, p]) => (
                    <tr key={v}>
                      <td className="px-3 py-2 text-slate-300">{v}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-100">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="leading-relaxed mb-3">
              These are test-only fees. They don&apos;t cover repairs, advisory
              work, or any extra inspection the garage offers alongside.
            </p>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">What most people actually pay</h3>
            <p className="leading-relaxed mb-3">
              Very few garages charge the full &pound;54.85. Competition between
              independents, chains and council test centres pulls prices down,
              so across the UK in 2026 a car MOT typically costs{" "}
              <strong className="text-slate-100">&pound;25&ndash;&pound;50</strong>.
              National chains run promotional MOTs in the &pound;20&ndash;&pound;35
              range; independents mostly sit at &pound;35&ndash;&pound;50, though
              many match or beat the chains; council-run test centres, where they
              exist, are often among the cheapest of all.
            </p>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Why the same test costs different amounts</h3>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Loss-leader pricing.</strong> Many garages price the test low (sometimes below cost) to get cars through the door, knowing a share will fail and need repairs. The margin is in the follow-on work, not the fee.</li>
              <li><strong className="text-slate-100">Overheads.</strong> A city-centre garage with high rent charges more than a rural workshop; so does one paying off new test equipment.</li>
              <li><strong className="text-slate-100">Extras.</strong> A low headline price padded with a &ldquo;seasonal inspection&rdquo; or a health check. Usually free, occasionally used to nudge the bill up &mdash; confirm what you&apos;re paying for.</li>
            </ul>
            <p className="leading-relaxed">
              Where you live matters too: London and the South East sit at the
              top of the range, the North, Wales and Scotland well below it. See{" "}
              <a href="#mot-prices-in-your-area" className={linkClass}>prices by area</a>{" "}
              below, or enter your reg above to see what garages near you charge
              right now.
            </p>
          </section>

          {/* ---------- 2. How to get a cheaper MOT ---------- */}
          <section id="how-to-get-a-cheaper-mot" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How to get a cheaper MOT: 9 ways to pay less</h2>
            <p className="leading-relaxed mb-3">
              The single biggest saving comes from comparing, not from any one
              trick &mdash; prices for the exact same test vary by &pound;20&ndash;&pound;30
              between garages a mile apart. In rough order of how much each saves:
            </p>
            <ol className="list-decimal list-inside space-y-2.5 ml-2 mb-3">
              <li><strong className="text-slate-100">Compare local garages first.</strong> Five minutes of comparison beats every other tip on this list combined. Enter your reg above to see local prices with your car pre-loaded.</li>
              <li><strong className="text-slate-100">Bundle the MOT with a service.</strong> If a service is due anyway, booking both together almost always unlocks a discounted or free MOT. Check the combined price is genuinely lower than the two apart &mdash; it usually is. Our guide to{" "}<Link href="/blog/mot-vs-service" className={linkClass}>MOT vs service</Link> explains what each covers.</li>
              <li><strong className="text-slate-100">Use independents, not just the big chains.</strong> Local garages often quietly undercut the national names and aren&apos;t targeting upsells. A recognisable brand doesn&apos;t mean a better price &mdash; check both.</li>
              <li><strong className="text-slate-100">Fix the cheap, common fails yourself.</strong> A blown bulb, worn wiper blades, empty screenwash or soft tyres are among the{" "}<Link href="/blog/most-common-mot-failures" className={linkClass}>most common MOT failures</Link> and cost a couple of pounds to sort in the driveway &mdash; against a part markup, labour and a retest if the garage finds them.</li>
              <li><strong className="text-slate-100">Know your free-retest rights.</strong> Fix the failed items at the same centre within 10 working days and the retest is usually free or reduced &mdash; details <a href="#free-retests" className={linkClass}>below</a>.</li>
              <li><strong className="text-slate-100">Book early and online.</strong> Garages often discount online bookings over walk-ins, and booking ahead gets you the quieter, cheaper slots. You can{" "}<Link href="/blog/can-you-get-mot-done-early" className={linkClass}>test up to a month early</Link> and keep your renewal date, so there&apos;s breathing room to shop around.</li>
              <li><strong className="text-slate-100">Avoid the plate-change rush.</strong> March and September are the busiest MOT months (cars first registered then all come due together, every year after). Prices firm up and slots vanish; a quieter week is often cheaper. See{" "}<Link href="/blog/spring-mot-rush-beat-the-queues" className={linkClass}>how to beat the spring MOT rush</Link>.</li>
              <li><strong className="text-slate-100">Look for vouchers and seasonal offers.</strong> Chains run regular promotions, particularly in January and February. Check what&apos;s bundled &mdash; a &ldquo;free&rdquo; MOT tied to an expensive add-on may not be the saving it looks like.</li>
              <li><strong className="text-slate-100">Don&apos;t pay for things you don&apos;t need.</strong> Confirm exactly what&apos;s included before you agree to a low price with extras attached.</li>
            </ol>
            <p className="leading-relaxed">
              Do that and you&apos;ll routinely pay &pound;25&ndash;&pound;40 for a
              test the maximum says could cost &pound;54.85.
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" placement="cheap-mot-mid" />
          </section>

          {/* ---------- 3. Cheapest place ---------- */}
          <section id="cheapest-place-to-get-an-mot" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Where is the cheapest place to get an MOT?</h2>
            <p className="leading-relaxed mb-4">
              People want a single name. The honest answer is that it depends on
              where you live and who&apos;s running an offer that week &mdash; but
              the <em>types</em> of test centre price very differently, and knowing
              how each one makes its money tells you where to look.
            </p>
            {/* Four centre types with a paragraph each: stacked, not the
                three-up SeverityCards grid, which squeezes long text into
                phone-width columns. */}
            <ul className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
              {[
                { tone: "border-blue-800/50 bg-blue-950/20", dot: "bg-blue-400", title: "National chains (Halfords, Kwik Fit and similar)", pros: "Frequent promotions and discount codes, often well below the cap; convenient and consistent.", watch: "Upsell pressure on advisories and repairs — the test is standardised, the recommended work afterwards is where the margin lives." },
                { tone: "border-emerald-800/50 bg-emerald-950/20", dot: "bg-emerald-400", title: "Independent local garages", pros: "Vary the most, and many quietly undercut the chains on reputation and repeat custom. Often lower labour rates on repairs too.", watch: "Quality varies — lean on reviews. A cheap test from a well-reviewed independent is hard to beat." },
                { tone: "border-emerald-800/50 bg-emerald-950/20", dot: "bg-emerald-400", title: "Council-run test centres", pros: "‘Non-trading’ stations that only test and never repair, so there's no incentive to fail a car for work. Often the cheapest and most impartial option.", watch: "Not every area has one, and a fail means a trip elsewhere for the repair." },
                { tone: "border-slate-700/60 bg-slate-900/40", dot: "bg-slate-400", title: "Mobile and while-you-wait testers", pros: "Fast and convenient, and competitive in a quiet slot.", watch: "The same rule as everywhere: check the labour rate if repairs are likely." },
              ].map((c) => (
                <li key={c.title} className={`rounded-lg border p-4 ${c.tone}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${c.dot}`} aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-slate-100">{c.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">
                    <span className="font-semibold text-emerald-300">Pros: </span>{c.pros}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                    <span className="font-semibold text-amber-300">Watch for: </span>{c.watch}
                  </p>
                </li>
              ))}
            </ul>
            <h3 className="text-lg font-semibold text-slate-100 mt-5 mb-2">Why &ldquo;cheapest&rdquo; keeps changing</h3>
            <p className="leading-relaxed mb-3">
              Most centres treat the MOT as marketing rather than a profit
              centre, so the headline price moves with promotions, location and
              demand. The same chain can be cheapest in one town and mid-priced
              in the next; a council centre is unbeatable where it exists and
              irrelevant where it doesn&apos;t. &ldquo;Always go to X&rdquo; never
              holds &mdash; comparing what&apos;s actually available near you, for
              your car, right now, does.
            </p>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">The price you see isn&apos;t the whole price</h3>
            <p className="leading-relaxed mb-2">
              Two centres quoting the same &pound;30 MOT can cost very different
              amounts overall:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-slate-100">Repair labour rate.</strong> This varies far more than the test fee. On an older car likely to need work, a slightly dearer test at a garage with a lower labour rate can be cheaper overall.</li>
              <li><strong className="text-slate-100">Advisory handling.</strong> Some centres flag a long list and quote to fix it all; others tell you what genuinely needs doing now. Our guide to{" "}<Link href="/blog/what-does-mot-advisory-mean" className={linkClass}>MOT advisories</Link> explains which ones matter.</li>
              <li><strong className="text-slate-100">Bundled extras.</strong> A &ldquo;free&rdquo; MOT tied to a service may or may not be the saving it appears. Check the all-in total.</li>
            </ul>
          </section>

          {/* ---------- 4. Are cheap deals worth it ---------- */}
          <section id="are-cheap-mot-deals-worth-it" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Are cheap MOT deals worth it? &pound;20 MOTs explained</h2>
            <p className="leading-relaxed mb-3">
              Almost always &mdash; with one thing to watch. Every MOT follows
              the same DVSA inspection manual: the tester works through an
              identical checklist (brakes, lights, tyres, suspension, emissions,
              structure) and records the result on the same government database
              whether you paid &pound;20 or &pound;54.85. A garage{" "}
              <strong className="text-slate-100">cannot legally do a &ldquo;lighter&rdquo; test for less money</strong>,
              so a cheap MOT is a genuine saving, not a corner cut.
            </p>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">So why would anyone charge &pound;20?</h3>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li><strong className="text-slate-100">It&apos;s a loss-leader.</strong> The test gets your car in. A share of cars fail, and many owners pay for the repairs there and then rather than shop around with a failure hanging over them.</li>
              <li><strong className="text-slate-100">It builds a relationship.</strong> A good first experience brings you back for servicing, tyres and next year&apos;s test &mdash; cheaper and better targeted than advertising.</li>
              <li><strong className="text-slate-100">Volume and overheads.</strong> High-throughput centres, council stations and low-overhead independents can run on a thinner margin per test.</li>
            </ul>
            <p className="leading-relaxed mb-3">
              The catch is what happens <em>after</em> a fail. A &pound;20 MOT is a
              brilliant deal if your car passes; if it fails, the garage that
              tested it cheaply is also the one quoting for the repairs, and
              you&apos;re in a weak spot to negotiate. A &pound;20 test at
              &pound;90 an hour can work out dearer than a &pound;45 test at
              &pound;55 an hour once any work is needed. So compare two things,
              not one:
            </p>
            <SeverityCards
              cards={[
                { tone: "good", title: "The test fee", description: "The headline price — cap is £54.85, often much less." },
                { tone: "warn", title: "Repair labour rate", description: "What you'll pay per hour if it fails — varies far more than the test." },
                { tone: "info", title: "What's bundled", description: "‘Free’ MOTs are often tied to a paid service — check the total." },
              ]}
            />
            <p className="leading-relaxed mt-4">
              One question &mdash; &ldquo;what&apos;s your hourly labour rate if it
              fails?&rdquo; &mdash; tells you whether the bargain is real. Add a
              glance at the garage&apos;s reviews, and a budget MOT becomes a
              no-brainer rather than a gamble.
            </p>
          </section>

          {/* ---------- 5. Free MOTs ---------- */}
          <section id="free-mot" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Free MOT: how to get one (and where the catch is)</h2>
            <p className="leading-relaxed mb-3">
              Free MOTs are real, but almost every one comes with a condition
              attached. There are three legitimate kinds:
            </p>
            <ul className="list-disc list-inside space-y-2.5 ml-2 mb-4">
              <li><strong className="text-slate-100">Bundled with a paid service.</strong> By far the most common. Once you&apos;re paying for a service, the test costs the garage very little to throw in. Good value <em>if a service was due anyway</em>; if you&apos;re buying a service you didn&apos;t need to unlock the &ldquo;free&rdquo; test, you&apos;ve spent more, not less.</li>
              <li><strong className="text-slate-100">A free retest.</strong> Fail, fix the items at the same centre within 10 working days, and the retest is usually free &mdash; see <a href="#free-retests" className={linkClass}>free retests</a> below.</li>
              <li><strong className="text-slate-100">A promotion.</strong> Chains and garages occasionally run genuine no-strings free MOTs, often in January and February or to launch a new branch. Real, but time- and capacity-limited, so they book up fast.</li>
            </ul>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Offers that look free but aren&apos;t</h3>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li>A &ldquo;free MOT&rdquo; that&apos;s really a voucher needing a future booking or spend.</li>
              <li>A free test padded with add-ons &mdash; a seasonal check, a health inspection, a wash &mdash; that nudge the total up.</li>
              <li>Free test, premium repair prices. The work quoted afterwards more than makes up for it.</li>
              <li>&ldquo;Free after cashback&rdquo; &mdash; read how the discount is actually applied.</li>
            </ul>
            <p className="leading-relaxed">
              None of these are scams exactly; they&apos;re marketing. But free
              should mean free, so confirm the total you&apos;ll actually pay and
              the labour rate if it fails. A free MOT is exactly as valid as a
              paid one &mdash; same manual, same database &mdash; and sometimes a
              &pound;25 test at a trusted garage with a low labour rate is the
              better deal.
            </p>
          </section>

          {/* ---------- 6. Free retests ---------- */}
          <section id="free-retests" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Free retests &mdash; don&apos;t pay twice</h2>
            <p className="leading-relaxed mb-3">
              If your car fails, you may not need to pay for a second full test.
              The rules depend on where and when the repairs are done:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Repairs at the same centre, retested the same or next working day</strong> &mdash; the retest on the failed items is usually free.</li>
              <li><strong className="text-slate-100">Repairs at the same centre within 10 working days</strong> &mdash; a partial retest (only the failed items) is typically free or heavily discounted.</li>
              <li><strong className="text-slate-100">Repairs elsewhere, or a retest after 10 working days</strong> &mdash; you&apos;ll usually pay for a full test again.</li>
            </ul>
            <p className="leading-relaxed">
              These are standard industry practice, not a legal right, so ask the
              question before you leave the car: &ldquo;If it fails, what does the
              retest cost?&rdquo; It can save the whole test fee again. More in our
              guide to{" "}
              <Link href="/blog/what-to-do-if-car-fails-mot" className={linkClass}>what to do if your car fails its MOT</Link>.
            </p>
          </section>

          {/* ---------- 7. Prices by area ---------- */}
          <section id="mot-prices-in-your-area" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">MOT prices in your area</h2>
            <p className="leading-relaxed mb-3">
              What you&apos;ll pay varies by region &mdash; London and the South
              East run near the &pound;54.85 cap, while the North, Wales and
              Scotland sit well below. See{" "}
              <Link href="/mot-prices" className={linkClass}>typical MOT prices for your town</Link>, or jump straight to a few popular areas:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                ["London", "london"],
                ["Birmingham", "birmingham"],
                ["Manchester", "manchester"],
                ["Leeds", "leeds"],
                ["Glasgow", "glasgow"],
                ["Bristol", "bristol"],
                ["Cardiff", "cardiff"],
                ["Liverpool", "liverpool"],
              ].map(([label, slug]) => (
                <a
                  key={slug}
                  href={`/mot-prices/${slug}`}
                  className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-3.5 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-blue-300"
                >
                  MOT in {label}
                </a>
              ))}
            </div>
          </section>

          {/* ---------- 8. Check before you book ---------- */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Check before you book</h2>
            <p className="leading-relaxed mb-3">
              Before paying for a test, it&apos;s worth a 10-second check of the
              vehicle&apos;s record. Our free{" "}
              <a href="/mot-check" className={linkClass}>MOT history check</a>{" "}
              shows past advisories so you know what a tester is likely to flag,
              and{" "}
              <a href="/tax-check" className={linkClass}>tax status</a>{" "}
              confirms the car is legal to drive to the test in the first place.
            </p>
            <p className="leading-relaxed mb-3">
              Remember what the MOT doesn&apos;t do, too: it&apos;s a minimum
              safety and emissions check on the day, and says nothing about the
              engine, gearbox or clutch. If you&apos;re buying a used car, a cheap
              pass certificate tells you very little &mdash; read the full history
              and our guide to{" "}
              <Link href="/blog/how-to-read-mot-history" className={linkClass}>how to read it</Link>.
            </p>
            <p className="leading-relaxed">
              Not sure when yours is due? Set a free{" "}
              <a href="/mot-reminder" className={linkClass}>MOT reminder</a>{" "}
              and we&apos;ll tell you in good time &mdash; so you can wait for the
              right offer instead of booking in a panic.
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" placement="cheap-mot-foot" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </section>
        </div>
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16 pb-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/blog/most-common-mot-failures" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">The Most Common MOT Failures</p>
            <p className="text-xs text-slate-500 mt-2">What cars fail on most — and the cheap fixes you can do before the test.</p>
          </Link>
          <Link href="/blog/spring-mot-rush-beat-the-queues" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Spring MOT Rush: How to Beat the Queues</p>
            <p className="text-xs text-slate-500 mt-2">Why March and September are MOT peaks and how to book around them.</p>
          </Link>
          <Link href="/blog/mot-vs-service" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">MOT vs Service — Do You Need Both?</p>
            <p className="text-xs text-slate-500 mt-2">The difference, and why bundling them often unlocks a cheaper MOT.</p>
          </Link>
          <Link href="/blog/can-you-get-mot-done-early" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Can You Get Your MOT Done Early?</p>
            <p className="text-xs text-slate-500 mt-2">How early you can test without losing time on your certificate.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
