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

type Props = { params: Promise<{ town: string }> };

export function generateStaticParams() {
  return MOT_TOWNS.map((t) => ({ town: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { town: slug } = await params;
  const town = getMotTown(slug);
  if (!town) return {};
  const region = MOT_REGIONS[town.region];
  const range = `${formatGBP(region.priceLow)}–${formatGBP(region.priceHigh)}`;
  const url = `https://www.freeplatecheck.co.uk/mot-prices/${town.slug}`;
  const title = `Cheap MOT in ${town.name} — Compare Local Prices 2026 | Free Plate Check`;
  const description = `Compare MOT prices in ${town.name}. Garages across ${region.name} typically charge ${range} — many below the £54.85 legal maximum. Free comparison, no signup.`;
  return {
    title,
    description,
    keywords: [
      `cheap MOT ${town.name}`,
      `MOT ${town.name}`,
      `MOT near me ${town.name}`,
      `MOT prices ${town.name}`,
      `MOT test ${town.name}`,
      `book MOT ${town.name}`,
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `Cheap MOT in ${town.name} — Compare Local Prices`,
      description,
      url,
      siteName: "Free Plate Check",
      locale: "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Cheap MOT in ${town.name} — Compare Local Prices`,
      description,
    },
  };
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
  const popRounded = `${Math.round(town.population / 1000)},000`;

  // Population tier drives genuinely different framing per page (not just a
  // name swap): big cities = dense garage competition; smaller towns = fewer
  // options, so comparing/travelling a little further matters more.
  const competition =
    tier === "major-city"
      ? `As one of the UK's larger cities, ${town.name} has a dense network of MOT test centres — from national chains to independent garages and, in some areas, council-run test stations. That competition works in your favour: prices for the identical test vary widely, so a quick comparison routinely saves £20 or more.`
      : tier === "city"
        ? `${town.name} has a good spread of MOT test centres — national chains alongside independent garages. Because the test is identical wherever you go, the spread in price is pure saving: it's well worth comparing a few before booking.`
        : `${town.name} has fewer garages than the big cities nearby, so options can be more limited — which makes comparing what's available (and checking garages in neighbouring towns) all the more worthwhile.`;

  const FAQ_ITEMS: FaqItem[] = [
    {
      question: `How much does an MOT cost in ${town.name}?`,
      answer: `Garages across ${region.name} typically charge ${range} for a Class 4 car MOT. The legal maximum anywhere in the UK is £54.85, but many ${town.name} garages charge below it. ${region.note}`,
    },
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
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                Compare MOT prices at garages near {town.name}, {town.county}. Across{" "}
                {region.name}, a Class 4 car MOT typically costs{" "}
                <strong className="text-slate-100">{range}</strong> &mdash; below
                the <strong className="text-slate-100">&pound;54.85</strong> legal
                maximum, and identical wherever you go.
              </p>
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
          stats={[
            { value: range, label: `Typical ${town.name} price`, tone: "good" },
            { value: "£54.85", label: "Legal max (Class 4)" },
            { value: "£0", label: "Free retest if fixed in 10 days", tone: "good" },
          ]}
        />

        <div className="space-y-8 text-slate-300">
          <section>
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
              <Link href="/blog/how-much-does-mot-cost" className="text-blue-400 hover:text-blue-300">how much an MOT costs in 2026</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Finding a cheap MOT in {town.name}</h2>
            <p className="leading-relaxed mb-3">{competition}</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Compare before booking.</strong> Enter your reg above to see what {town.name} garages are charging right now.</li>
              <li><strong className="text-slate-100">Try independents and council centres</strong>, not just the big chains — they&#39;re often cheapest and don&#39;t push upsells.</li>
              <li><strong className="text-slate-100">Bundle with a service</strong> if one&#39;s due — it usually unlocks a discounted or free MOT.</li>
            </ul>
            <p className="leading-relaxed">
              The test is identical at every garage, so a cheaper {town.name} MOT
              is a genuine saving, not a corner cut &mdash; more on that in our
              guide to whether{" "}
              <Link href="/blog/are-cheap-mot-deals-worth-it" className="text-blue-400 hover:text-blue-300">cheap MOT deals are worth it</Link>.
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" placement="mot-prices-town" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">When to book your MOT in {town.name}</h2>
            <p className="leading-relaxed mb-3">
              March and September are the UK&#39;s busiest MOT months &mdash; cars
              first registered in those plate-change months all come due together
              three years later. Demand pushes {town.name} garages busier and
              prices firmer, so a quieter week can be cheaper.
            </p>
            <p className="leading-relaxed">
              You can{" "}
              <Link href="/blog/can-you-get-mot-done-early" className="text-blue-400 hover:text-blue-300">test up to a month early</Link>{" "}
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
              confirm the terms before you collect the car.
            </p>
          </section>

          {nearby.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">MOT prices in other {region.name} towns</h2>
              <div className="flex flex-wrap gap-2">
                {nearby.map((t) => (
                  <a
                    key={t.slug}
                    href={`/mot-prices/${t.slug}`}
                    className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-3.5 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-blue-300"
                  >
                    {t.name}
                  </a>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </section>
        </div>
      </div>

      {/* Related */}
      <div className="max-w-3xl mx-auto px-4 mt-12 pb-16">
        <p className="text-sm text-slate-400">
          Looking nationally?{" "}
          <a href="/cheap-mot" className="text-blue-400 hover:text-blue-300">Compare cheap MOT prices across the UK</a>, set a free{" "}
          <a href="/mot-reminder" className="text-blue-400 hover:text-blue-300">MOT reminder</a>, or check the{" "}
          <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> of any vehicle.
        </p>
      </div>
    </div>
  );
}
