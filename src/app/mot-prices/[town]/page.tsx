import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MotPriceFinder from "@/components/MotPriceFinder";
import MOTBookingCTA from "@/components/MOTBookingCTA";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";
import {
  MOT_TOWNS,
  MOT_REGIONS,
  getMotTown,
  townsInRegion,
  populationTier,
  formatGBP,
} from "@/data/mot-locations";
import {
  areaStats,
  nationalStats,
  areaLabel,
  roundTests,
  MONTH_NAMES,
  MOT_AREAS_YEAR,
  type AreaStats,
} from "@/lib/mot-areas";

type Props = { params: Promise<{ town: string }> };

/** The year in page copy ("prices in 2026"); the DVSA data year is MOT_AREAS_YEAR. */
const THIS_YEAR = new Date().getFullYear();

export function generateStaticParams() {
  return MOT_TOWNS.map((t) => ({ town: t.slug }));
}

/** "2.9 points above the UK average" / "in line with the UK average". */
function vsUk(diff: number, unit = "points"): string {
  if (Math.abs(diff) <= 0.5) return "in line with the UK average";
  const n = Math.abs(diff).toFixed(1).replace(/\.0$/, "");
  return `${n} ${unit} ${diff > 0 ? "above" : "below"} the UK average`;
}

function pctLabel(n: number): string {
  return `${n.toFixed(1).replace(/\.0$/, "")}%`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { town: slug } = await params;
  const town = getMotTown(slug);
  if (!town) return {};
  const region = MOT_REGIONS[town.region];
  const stats = areaStats(town.postcodeAreas);
  const range = `${formatGBP(region.priceLow)}–${formatGBP(region.priceHigh)}`;
  const url = `https://www.freeplatecheck.co.uk/mot-prices/${town.slug}`;
  const title = `Cheap MOT in ${town.name} — Compare Local Prices & Pass Rate ${THIS_YEAR} | Free Plate Check`;
  const description = stats
    ? `Compare MOT prices in ${town.name}. ${pctLabel(stats.passRate)} of the ${roundTests(stats.tests)} MOTs in ${areaLabel(stats.areas)} passed first time in ${MOT_AREAS_YEAR}; garages typically charge ${range} against the £54.85 cap. Free comparison, no signup.`
    : `Compare MOT prices in ${town.name}. Garages across ${region.name} typically charge ${range} — many below the £54.85 legal maximum. Free comparison, no signup.`;
  return {
    title,
    description,
    keywords: [
      `cheap MOT ${town.name}`,
      `MOT ${town.name}`,
      `MOT near me ${town.name}`,
      `MOT prices ${town.name}`,
      `MOT test ${town.name}`,
      `MOT pass rate ${town.name}`,
      `book MOT ${town.name}`,
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `Cheap MOT in ${town.name} — Prices & Pass Rate`,
      description,
      url,
      siteName: "Free Plate Check",
      locale: "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Cheap MOT in ${town.name} — Prices & Pass Rate`,
      description,
    },
  };
}

/** Twelve bars, one a month: where the year's tests fall in this area. */
function MonthBars({ months, label }: { months: number[]; label: string }) {
  const max = Math.max(...months, 1);
  return (
    <div aria-label={label} role="img" className="mt-3">
      <div className="flex h-24 items-end gap-1 sm:gap-1.5">
        {months.map((n, i) => {
          const h = Math.max(6, Math.round((n / max) * 100));
          const peak = n === max;
          return (
            // The column needs a definite height (h-full of the h-24 row) or
            // the bar's percentage height resolves to nothing.
            <div key={i} className="flex h-full flex-1 items-end">
              <div
                className={`w-full rounded-t-sm ${peak ? "bg-emerald-400" : "bg-emerald-700"}`}
                style={{ height: `${h}%` }}
                title={`${MONTH_NAMES[i]}: ${pctLabel(n)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1 sm:gap-1.5 text-[10px] text-slate-500">
        {MONTH_NAMES.map((m) => (
          <span key={m} className="flex-1 text-center">{m[0]}</span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal share bars for the failure areas, local against UK. */
function FailureBars({ stats }: { stats: AreaStats }) {
  const ukByName = new Map(stats.topFailuresUk.map((f) => [f.name, f.share]));
  const max = Math.max(...stats.topFailures.map((f) => f.share), ...stats.topFailuresUk.map((f) => f.share), 1);
  return (
    <ul className="mt-3 space-y-3">
      {stats.topFailures.map((f) => {
        const uk = ukByName.get(f.name);
        return (
          <li key={f.name}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-100">{f.name}</span>
              <span className="tabular-nums text-slate-300">
                {pctLabel(f.share)}
                {uk != null && <span className="text-slate-500"> · UK {pctLabel(uk)}</span>}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-amber-400/90" style={{ width: `${(f.share / max) * 100}%` }} />
            </div>
            {uk != null && (
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-slate-900">
                <div className="h-full rounded-full bg-slate-600" style={{ width: `${(uk / max) * 100}%` }} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default async function MotPricesTownPage({ params }: Props) {
  const { town: slug } = await params;
  const town = getMotTown(slug);
  if (!town) notFound();

  const region = MOT_REGIONS[town.region];
  const range = `${formatGBP(region.priceLow)}–${formatGBP(region.priceHigh)}`;
  const tier = populationTier(town.population);
  const nearby = townsInRegion(town.region, town.slug).slice(0, 5);
  const url = `https://www.freeplatecheck.co.uk/mot-prices/${town.slug}`;
  const popRounded = (Math.round(town.population / 1000) * 1000).toLocaleString("en-GB");

  // The DVSA's own results for this town's postcode area(s). Every figure
  // below is theirs; the page never invents a centre count or a local price.
  const stats = areaStats(town.postcodeAreas);
  const uk = nationalStats();
  const area = stats ? areaLabel(stats.areas) : "";
  /** "B postcode area" — for labels that already carry "in"/"at". */
  const areaShort = area.replace(/^the /, "");
  const yr = MOT_AREAS_YEAR;

  // Population tier drives genuinely different framing per page (not just a
  // name swap): big cities = dense garage competition; smaller towns = fewer
  // options, so comparing/travelling a little further matters more.
  const competition =
    tier === "major-city"
      ? `As one of the UK's larger cities, ${town.name} has a dense network of MOT test centres — from national chains to independent garages and, in some areas, council-run test stations. That competition works in your favour: prices for the identical test vary widely, so a quick comparison routinely saves £20 or more.`
      : tier === "city"
        ? `${town.name} has a good spread of MOT test centres — national chains alongside independent garages. Because the test is identical wherever you go, the spread in price is pure saving: it's well worth comparing a few before booking.`
        : `${town.name} has fewer garages than the big cities nearby, so options can be more limited — which makes comparing what's available (and checking garages in neighbouring towns) all the more worthwhile.`;

  const passTone = stats ? (stats.passRateVsUk >= 0 ? "good" : "warn") : "default";

  const FAQ_ITEMS: FaqItem[] = [
    {
      question: `How much does an MOT cost in ${town.name}?`,
      answer: `Garages across ${region.name} typically charge ${range} for a Class 4 car MOT. The legal maximum anywhere in the UK is £54.85, but many ${town.name} garages charge below it. ${region.note}`,
    },
    ...(stats
      ? [
          {
            question: `What is the MOT pass rate in ${town.name}?`,
            answer: `${pctLabel(stats.passRate)} of the ${roundTests(stats.tests)} car MOTs carried out in ${area} in ${yr} passed first time, ${vsUk(stats.passRateVsUk)} of ${pctLabel(uk.passRate)}. ${pctLabel(stats.dangerousShare)} of tests found at least one dangerous defect (UK: ${pctLabel(uk.dangerousShare)}). Source: DVSA anonymised MOT results.`,
          },
          {
            question: `What do cars fail their MOT on most in ${town.name}?`,
            answer: `In ${area}, the failure areas that hit the most tests in ${yr} were ${stats.topFailures.map((f) => `${f.name.toLowerCase()} (${pctLabel(f.share)} of tests)`).join(", ")}. Lights, tyres and wipers are the cheapest to put right before the test.`,
          },
        ]
      : []),
    {
      question: `Where is the cheapest MOT in ${town.name}?`,
      answer: `There's no single cheapest garage — it changes with promotions and demand. Independents and any council-run test centres are often cheapest and most impartial, while chains run frequent offers. The only reliable way to find the cheapest in ${town.name} is to compare local prices for your reg.`,
    },
    {
      question: `Is a cheaper MOT in ${town.name} any less thorough?`,
      answer: `No. Every MOT in ${town.name} — and across the UK — follows the same DVSA inspection manual and is logged to the same national database. A garage cannot legally do a "lighter" test for less money, so a cheaper MOT is exactly as valid.`,
    },
    {
      question: `Can I book an MOT in ${town.name} online?`,
      answer: `Yes. Enter your registration above to compare MOT prices at garages near ${town.name} and book online — we pre-fill your vehicle details and hand off to BookMyGarage for the final booking. Free, no signup, no email.`,
    },
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Cheap MOT", item: "https://www.freeplatecheck.co.uk/cheap-mot" },
      { "@type": "ListItem", position: 3, name: `MOT Prices in ${town.name}`, item: url },
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

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "MOT test price comparison and booking",
    name: `Compare cheap MOT prices in ${town.name}`,
    provider: {
      "@type": "Organization",
      name: "Free Plate Check",
      url: "https://www.freeplatecheck.co.uk",
    },
    areaServed: { "@type": "City", name: town.name },
    description: `Compare MOT prices from garages in and around ${town.name}, ${town.county}. Typical local price ${range}; legal maximum £54.85.`,
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "GBP",
        minPrice: String(region.priceLow),
        maxPrice: "54.85",
      },
    },
  };

  const linkClass = "text-blue-400 hover:text-blue-300";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      {/* --- HERO --- */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-6 lg:pb-10">
          <Link href="/mot-prices" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
            &larr; All MOT price locations
          </Link>
          <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-10 lg:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 leading-tight">
                Cheap MOT in {town.name}
              </h1>
              {stats ? (
                <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                  Garages in {area} carried out{" "}
                  <strong className="text-slate-100">{roundTests(stats.tests)}</strong> car MOTs in {yr}, and{" "}
                  <strong className="text-slate-100">{pctLabel(stats.passRate)}</strong> passed first time
                  &mdash; {vsUk(stats.passRateVsUk)}. The test is the same everywhere; the price isn&apos;t:
                  across {region.name} it typically runs{" "}
                  <strong className="text-slate-100">{range}</strong> against the{" "}
                  <strong className="text-slate-100">&pound;54.85</strong> legal maximum.
                </p>
              ) : (
                <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                  Compare MOT prices at garages near {town.name}, {town.county}. Across{" "}
                  {region.name}, a Class 4 car MOT typically costs{" "}
                  <strong className="text-slate-100">{range}</strong> &mdash; below
                  the <strong className="text-slate-100">&pound;54.85</strong> legal
                  maximum, and identical wherever you go.
                </p>
              )}
              <ul className="mt-5 space-y-2 text-sm text-slate-400">
                {[
                  `Compare local ${town.name} garage prices in seconds`,
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
            <div className="mt-6 lg:mt-0">
              <MotPriceFinder source={`mot_prices_${town.slug}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8 pb-12 sm:py-12">
        <StatCallouts
          stats={
            stats
              ? [
                  { value: pctLabel(stats.passRate), label: `Passed first time, ${yr}`, tone: passTone },
                  { value: roundTests(stats.tests), label: `MOTs in ${areaShort}` },
                  { value: range, label: `Typical ${town.name} price`, tone: "good" },
                ]
              : [
                  { value: range, label: `Typical ${town.name} price`, tone: "good" },
                  { value: "£54.85", label: "Legal max (Class 4)" },
                  { value: "£0", label: "Free retest if fixed in 10 days", tone: "good" },
                ]
          }
        />

        <div className="space-y-10 text-slate-300">
          {stats && (
            <section id="the-numbers" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-100 mb-4">MOT testing in {town.name}: what the data says</h2>
              <p className="leading-relaxed mb-3">
                The DVSA publishes every MOT carried out in Great Britain, tagged with the test
                centre&apos;s postcode area. For {town.name} that is {area}:{" "}
                <strong className="text-slate-100">{roundTests(stats.tests)}</strong> first-time car tests in {yr},
                of which <strong className="text-slate-100">{pctLabel(stats.passRate)}</strong> passed outright
                ({vsUk(stats.passRateVsUk)} of {pctLabel(uk.passRate)}).{" "}
                {stats.dangerousShare > uk.dangerousShare + 0.5
                  ? `${pctLabel(stats.dangerousShare)} of tests found at least one dangerous defect, more than the UK's ${pctLabel(uk.dangerousShare)} — worth a pre-test check of tyres and brakes.`
                  : stats.dangerousShare < uk.dangerousShare - 0.5
                    ? `Only ${pctLabel(stats.dangerousShare)} of tests found a dangerous defect, under the UK's ${pctLabel(uk.dangerousShare)}.`
                    : `${pctLabel(stats.dangerousShare)} of tests found at least one dangerous defect, about the UK rate.`}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">What fails first time here</h3>
                  <p className="mt-1 text-xs text-slate-500">Share of {yr} tests with a fail in each area, against the UK.</p>
                  <FailureBars stats={stats} />
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">The cars tested here</h3>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Typical age at test</dt>
                      <dd className="font-semibold text-slate-100 tabular-nums">{stats.ageMedian} yrs <span className="font-normal text-slate-500">· UK {stats.ageMedianUk}</span></dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Typical mileage</dt>
                      <dd className="font-semibold text-slate-100 tabular-nums">{stats.mileageMedian.toLocaleString("en-GB")} <span className="font-normal text-slate-500">· UK {stats.mileageMedianUk.toLocaleString("en-GB")}</span></dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Diesel</dt>
                      <dd className="font-semibold text-slate-100 tabular-nums">{pctLabel(stats.dieselShare)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Electric or hybrid</dt>
                      <dd className="font-semibold text-slate-100 tabular-nums">{pctLabel(Math.round((stats.evShare + stats.hybridShare) * 10) / 10)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    Most tested: {stats.topMakes.map((m) => `${m.name} (${pctLabel(m.share)})`).join(", ")}.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">When {town.name} garages are busiest</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Share of {yr}&apos;s tests by month. {stats.busiestMonth.name} was the peak ({pctLabel(stats.busiestMonth.share)} of the year);{" "}
                  {stats.quietestMonth.name} the quietest ({pctLabel(stats.quietestMonth.share)}).
                </p>
                <MonthBars months={stats.monthShares} label={`MOT tests by month in ${area}`} />
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  A quiet month is the easiest time to find a cheap slot. You can{" "}
                  <Link href="/blog/can-you-get-mot-done-early" className={linkClass}>test up to a month early</Link>{" "}
                  and keep your renewal date.
                </p>
              </div>
            </section>
          )}

          <section id="how-much">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How much does an MOT cost in {town.name}?</h2>
            <p className="leading-relaxed mb-3">
              The MOT fee is capped, not fixed. The legal maximum for a Class 4
              car is <strong className="text-slate-100">&pound;54.85</strong>{" "}
              anywhere in the UK, and garages can charge anything up to it. Across{" "}
              {region.name}, typical prices run{" "}
              <strong className="text-slate-100">{range}</strong>. {region.note}
            </p>
            <p className="leading-relaxed">
              {town.name} ({town.county}, population around {popRounded}) follows
              the same national rules &mdash; so the difference between the
              cheapest and dearest test for the same car comes down to which
              garage you choose. For the full national picture, see{" "}
              <Link href="/cheap-mot#how-much-should-an-mot-cost" className={linkClass}>what an MOT should cost in {THIS_YEAR}</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Finding a cheap MOT in {town.name}</h2>
            <p className="leading-relaxed mb-3">{competition}</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Compare before booking.</strong> Enter your reg above to see what {town.name} garages are charging right now.</li>
              <li><strong className="text-slate-100">Try independents and council centres</strong>, not just the big chains &mdash; they&#39;re often cheapest and don&#39;t push upsells.</li>
              <li><strong className="text-slate-100">Bundle with a service</strong> if one&#39;s due &mdash; it usually unlocks a discounted or free MOT.</li>
              {stats && (
                <li><strong className="text-slate-100">Check the cheap stuff first.</strong> {stats.topFailures[0]?.name === "Lighting & electrics" ? `Lights and electrics are the biggest first-time fail in ${area} — a blown bulb costs pence to fix at home and £10–£20 plus a retest at the garage.` : `${stats.topFailures[0]?.name} is the biggest first-time fail in ${area}; lights, wipers and tyre tread are the ones you can check yourself before the test.`}</li>
              )}
            </ul>
            <p className="leading-relaxed">
              The test is identical at every garage, so a cheaper {town.name} MOT
              is a genuine saving, not a corner cut &mdash; more on that in our
              guide to whether{" "}
              <Link href="/cheap-mot#are-cheap-mot-deals-worth-it" className={linkClass}>cheap MOT deals are worth it</Link>.
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" placement="mot-prices-town" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">When to book your MOT in {town.name}</h2>
            <p className="leading-relaxed mb-3">
              {stats
                ? `${stats.busiestMonth.name} was the busiest month at ${areaShort} test centres in ${yr}, with ${pctLabel(stats.busiestMonth.share)} of the year's tests; ${stats.quietestMonth.name} saw just ${pctLabel(stats.quietestMonth.share)}. `
                : ""}
              March and September are the UK&#39;s plate-change months &mdash; cars
              first registered then all come due together three years later, and
              the cycle repeats every year &mdash; so demand pushes {town.name} garages
              busier and prices firmer around them. A quieter week is usually cheaper.
            </p>
            <p className="leading-relaxed">
              You can{" "}
              <Link href="/blog/can-you-get-mot-done-early" className={linkClass}>test up to a month early</Link>{" "}
              without losing any days on the certificate &mdash; useful breathing
              room to shop around rather than booking in a panic.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Free retests &mdash; don&apos;t pay twice</h2>
            <p className="leading-relaxed">
              If your car fails at a {town.name} garage, leave it there for repair
              and the retest is free; bring it back within{" "}
              <strong className="text-slate-100">10 working days</strong> and many
              failure items qualify for a free or reduced partial retest. Always
              confirm the terms before you collect the car &mdash; the{" "}
              <Link href="/cheap-mot#free-retests" className={linkClass}>retest rules</Link> in full.
            </p>
          </section>

          {nearby.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">MOT prices in other {region.name} towns</h2>
              <div className="flex flex-wrap gap-2">
                {nearby.map((t) => {
                  const s = areaStats(t.postcodeAreas);
                  return (
                    <a
                      key={t.slug}
                      href={`/mot-prices/${t.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/60 px-3.5 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-blue-300"
                    >
                      {t.name}
                      {s && <span className="text-xs tabular-nums text-slate-500">{pctLabel(s.passRate)} pass</span>}
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </section>

          {stats && (
            <p className="text-xs leading-relaxed text-slate-500">
              Test data: DVSA anonymised MOT tests and results (data.gov.uk), {yr}, Class 4
              vehicles, normal tests only, first-time result; grouped by the test centre&apos;s
              postcode area, which is the finest level the DVSA publishes. Prices are typical
              regional garage prices, not quotes; the only figure fixed in law is the £54.85 cap.
            </p>
          )}
        </div>
      </div>

      {/* Related */}
      <div className="max-w-3xl mx-auto px-4 mt-12 pb-16">
        <p className="text-sm text-slate-400">
          Looking nationally?{" "}
          <a href="/cheap-mot" className={linkClass}>Compare cheap MOT prices across the UK</a>, set a free{" "}
          <a href="/mot-reminder" className={linkClass}>MOT reminder</a>, or check the{" "}
          <a href="/mot-check" className={linkClass}>MOT history</a> of any vehicle.
        </p>
      </div>
    </div>
  );
}
