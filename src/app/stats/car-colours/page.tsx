import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import ConversionWidget from "@/components/stats/ConversionWidget";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";
import CiteThisData from "@/components/stats/CiteThisData";
import CarColourCharts from "@/components/stats/CarColourCharts";

export const metadata: Metadata = {
  title: "Most Popular Car Colours in the UK 2026 — Full Ranking",
  description:
    "Britain's most popular new car colours, ranked by 2025 registration share. Grey leads for the eighth year running, with monochrome shades taking around 70% of the market.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/car-colours",
  },
  openGraph: {
    title: "Most Popular Car Colours in the UK 2026 — Full Ranking",
    description:
      "Britain's most popular new car colours, ranked by 2025 registration share. Grey leads for the eighth year running.",
    url: "https://www.freeplatecheck.co.uk/stats/car-colours",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
};

const faqItems = [
  {
    question: "What is the most popular car colour in the UK?",
    answer:
      "Grey is the UK's most popular new car colour, taking 27.6% of registrations in 2025 — its eighth year at the top. Black (23.0%) and blue (15.2%) complete the top three, which together account for nearly two-thirds of all new cars registered.",
  },
  {
    question: "Why is grey so popular?",
    answer:
      "Grey hits a sweet spot: it looks modern and premium, hides road dirt and minor scratches better than black or white, and holds its value well on the used market because demand is broad. Manufacturers also offer an unusually wide palette of metallic greys, so there is a shade to suit almost every model.",
  },
  {
    question: "Does car colour affect resale value or insurance?",
    answer:
      "Colour can affect resale speed: popular neutrals — grey, black, white and silver — are the easiest to sell on because the buyer pool is largest, while unusual colours can take longer to shift. Insurance is a common myth, though: insurers price on risk factors like the model, your address and driving history, not the paint colour, so a red car does not cost more to insure than a silver one.",
  },
  {
    question: "Are bright colours making a comeback?",
    answer:
      "Slowly. Green was the notable riser in 2025, reaching nearly 5% of registrations as buyers — particularly of SUVs and EVs — moved away from pure monochrome. Even so, grey, black, white and silver still account for around 70% of the market combined.",
  },
  {
    question: "What is the least popular car colour in the UK?",
    answer:
      "The rarest shades are niche colours such as maroon, pink and turquoise, which together make up a tiny fraction of a percent of new registrations. Among the more recognisable colours, gold, beige and brown are consistently the least chosen.",
  },
];

export default function CarColoursPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Dataset",
              name: "Most Popular Car Colours in the UK 2025",
              description:
                "UK new car colours ranked by share of 2025 registrations, based on SMMT data. Grey, black and blue lead the market.",
              url: "https://www.freeplatecheck.co.uk/stats/car-colours",
              license: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
              creator: {
                "@type": "Organization",
                name: "Free Plate Check",
                url: "https://www.freeplatecheck.co.uk",
              },
              temporalCoverage: "2025",
              spatialCoverage: "United Kingdom",
              variableMeasured:
                "Share of new car registrations by colour (per cent)",
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            },
          ]),
        }}
      />
      <StatsHeroSection
        title="Most Popular Car Colours in the UK 2026"
        subtitle="Britain's favourite new-car colours, ranked by 2025 registration share — and what your colour choice means for resale."
        breadcrumb="Car Colours"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <StatCallout value="Grey · 27.6%" label="The UK's #1 colour" color="emerald" />
          <StatCallout value="65.8%" label="Share of the top 3 colours" color="amber" />
          <StatCallout value="~70%" label="Monochrome (grey/black/white/silver)" color="emerald" />
        </div>

        {/* Chart */}
        <CarColourCharts />

        {/* Source / methodology note — figures attributable now that the page
            invites citation. */}
        <p className="mt-3 text-xs text-slate-500">
          Figures are the share of UK new car registrations by colour for the
          2025 full year (SMMT), rounded to one decimal place.
        </p>

        {/* Cite-this-data box — earns attribution backlinks (digital-PR play) */}
        <CiteThisData
          title="Most Popular Car Colours in the UK"
          url="https://www.freeplatecheck.co.uk/stats/car-colours"
        />

        {/* Insight copy */}
        <div className="my-10 space-y-4 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-bold text-slate-100">
            Britain&apos;s Love Affair with Grey
          </h2>
          <p>
            Grey has been the UK&apos;s most popular new car colour every year since
            2018, and 2025 was no exception — 27.6% of all new cars registered
            were grey, a record total for the shade. Its appeal is practical as
            much as aesthetic: grey reads as modern and premium, disguises the
            grime of British roads better than black or white, and is one of the
            safest bets for resale because demand spans almost every buyer. Add
            the sheer breadth of metallic grey options manufacturers now offer,
            and it is easy to see why it keeps topping the chart.
          </p>
          <p>
            Black (23.0%) and blue (15.2%) round out the top three, which between
            them account for nearly two-thirds of the market. Look wider and the
            dominance of muted tones is even starker: grey, black, white and
            silver together make up roughly 70% of every new car sold. The
            &ldquo;monochrome majority&rdquo; has held for years, driven by company-car and
            fleet demand — neutral colours are the easiest to remarket — and by
            buyers playing it safe with the biggest purchase after a home.
          </p>

          <h3 className="text-lg font-semibold text-slate-100">
            Colour and Your Wallet
          </h3>
          <p>
            Colour matters more than most buyers realise — but not in the way the
            myths suggest. It does not change your insurance premium: insurers
            price on the model, your address and your driving record, not the
            paint, so a red car is no dearer to insure than a silver one. Where
            colour does count is resale. Popular neutrals sell fastest because the
            buyer pool is largest, while bolder choices can sit longer and
            occasionally fetch less. If you plan to sell within a few years, a
            mainstream colour is the pragmatic pick; if you are keeping the car
            for the long haul, choose whatever you actually like.
          </p>

          <h3 className="text-lg font-semibold text-slate-100">
            Is Colour Getting Braver?
          </h3>
          <p>
            There are early signs of a shift. Green was the standout riser in
            2025, climbing to nearly 5% of registrations as SUV and EV buyers in
            particular moved away from pure greyscale. Reds and blues remain solid
            mid-table performers, and a long tail of rare shades — from bronze and
            beige to the vanishingly small numbers of pink and turquoise — keeps
            the bottom of the chart interesting. For now, though, Britain&apos;s
            new-car palette remains resolutely understated.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <ConversionWidget
          headline="Check any car's colour and history by reg"
          subtext="Enter a registration to see the recorded colour, make, model, MOT history, tax status, valuation and more — free, no signup."
        />

        {/* Related stats */}
        <StatsRelated exclude="car-colours" />
      </div>
    </>
  );
}
