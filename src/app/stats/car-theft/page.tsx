import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import ConversionWidget from "@/components/stats/ConversionWidget";
import StatsRelated from "@/components/stats/StatsRelated";
import CarVerticalReportCTA from "@/components/CarVerticalReportCTA";
import FaqAccordion from "@/components/stats/FaqAccordion";


export const metadata: Metadata = {
  title: "Most Stolen Cars in the UK: 2025 DVLA Figures & How to Protect Yours",
  description:
    "54,830 vehicles were reported stolen in the UK in 2025, and the Ford Fiesta topped the list. The DVLA figures, plus how keyless relay theft works and what actually stops it.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/car-theft",
  },
  openGraph: {
    title: "Most Stolen Cars in the UK: 2025 DVLA Figures & How to Protect Yours",
    description:
      "54,830 vehicles were reported stolen in the UK in 2025, and the Ford Fiesta topped the list. The DVLA figures, plus how keyless relay theft works and what actually stops it.",
    url: "https://www.freeplatecheck.co.uk/stats/car-theft",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
};

const faqItems = [
  {
    question: "What is the most stolen car in the UK?",
    answer:
      "The Ford Fiesta, by a wide margin. DVLA figures obtained by What Car? under Freedom of Information show 3,511 Fiestas reported stolen in 2025 — more than any other model. Raw counts naturally favour cars there are a lot of, and the Fiesta was Britain's best-selling car for years.",
  },
  {
    question: "How many cars are stolen in the UK each year?",
    answer:
      "54,830 vehicles were reported stolen to the DVLA in 2025, according to the same Freedom of Information release — down 11% on 2024. That is still roughly 150 a day.",
  },
  {
    question: "What is keyless car theft and how does it work?",
    answer:
      "Keyless (relay) theft involves two devices that amplify the signal from a key fob inside your home to trick the car into thinking the key is nearby. One thief stands near your front door while the other opens and starts the car. The entire process can take under 60 seconds. Faraday pouches and steering wheel locks are the most effective countermeasures.",
  },
  {
    question: "Does fitting a tracker reduce car theft risk?",
    answer:
      "A tracker does not prevent the theft itself, but it dramatically improves recovery rates — police recover tracked vehicles far more often than untracked ones. Many insurers offer premium discounts for Thatcham-approved trackers, which can offset the subscription cost.",
  },
];

export default function CarTheftPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
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
        title="Most Stolen Cars in the UK"
        subtitle="Which cars are stolen most often, how thieves get in, and what you can do to protect your vehicle."
        breadcrumb="Car Theft"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts. Model-by-model theft RATES were removed 2026-10-11:
            theft-risk.json and the national trend chart were never built from
            a real source (its 84 models summed to more thefts than the whole
            UK records). These three figures are DVLA's, via What Car?'s FOI.
            Rates come back once the DVLA make/model release (FOIR13058) is
            obtained and joined to DfT licensing stock — see src/lib/theft-risk.ts. */}
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCallout value="54,830" label="Vehicles reported stolen in 2025" color="red" />
          <StatCallout value="Ford Fiesta" label="Most stolen model — 3,511 in 2025" color="amber" />
          <StatCallout value="−11%" label="Change in thefts vs 2024" color="emerald" />
        </div>
        <p className="mb-10 text-xs text-slate-500">
          Source: DVLA data released under Freedom of Information, reported by{" "}
          <a
            href="https://www.whatcar.com/news/the-most-stolen-cars-in-the-uk"
            className="underline hover:text-slate-300"
            rel="noopener"
          >
            What Car?
          </a>
          . We&apos;re rebuilding model-by-model theft rates from the full DVLA
          release and will publish them here when they&apos;re ready.
        </p>

        {/* Insight copy */}
        <div className="my-10 space-y-4 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-bold text-slate-100">
            Understanding Car Theft in the UK
          </h2>

          <p>
            The biggest change in UK vehicle crime over the past decade has been
            keyless relay theft — a technique that exploits proximity key fobs to
            unlock and start cars without needing the physical key. Premium SUVs
            became prime targets because of their resale and parts value, while
            high-volume older cars like the Fiesta are stolen in the largest
            numbers simply because there are so many of them. Thefts reported to
            the DVLA fell 11% in 2025, but organised networks that ship stolen
            vehicles overseas within hours still make recovery difficult once a
            car leaves the country.
          </p>

          <h3 className="text-lg font-semibold text-slate-100">
            Keyless Entry: Convenience vs Security
          </h3>

          <p>
            Keyless entry systems were designed for convenience, but they have
            become the single biggest vulnerability in modern vehicle security.
            Relay devices, available online for under fifty pounds, can amplify a
            key fob signal through walls, allowing thieves to open and drive away
            a car in under sixty seconds. Manufacturers have responded with
            motion-sensor fobs that deactivate when stationary and ultra-wideband
            (UWB) technology that is harder to relay, but millions of older
            vehicles remain exposed. Storing your fob in a Faraday pouch
            overnight remains the simplest and most effective defence.
          </p>

          <h3 className="text-lg font-semibold text-slate-100">
            Catalytic Converter Theft
          </h3>

          <p>
            While whole-vehicle theft attracts the most attention, catalytic
            converter theft surged between 2019 and 2022 as precious metal
            prices soared. Hybrid vehicles such as the Toyota Prius are
            particularly targeted because their converters contain higher
            concentrations of palladium and rhodium. A catalytic converter can be
            removed with a battery-powered saw in under two minutes, and
            replacement costs typically range from eight hundred to two thousand
            pounds. Anti-theft clamps, catalytic converter marking kits, and
            parking in enclosed spaces are the recommended countermeasures.
          </p>

          <h3 className="text-lg font-semibold text-slate-100">
            Prevention: What Actually Works
          </h3>

          <p>
            According to police and insurers, the most effective theft
            deterrents combine physical and electronic measures. A visible
            steering wheel lock such as a Disklok forces thieves to spend extra
            time on a vehicle, increasing the risk of being caught. A
            Thatcham-approved GPS tracker dramatically improves recovery odds and
            often qualifies for an insurance premium discount. At home, parking
            in a locked garage or behind a gate is the gold standard, but even a
            well-lit driveway with CCTV and motion-activated lighting can deter
            opportunistic theft.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <ConversionWidget headline="Check a car before you buy" subtext="Enter a reg plate for its MOT history, mileage record, tax status and more — free." />

        {/* Buying a used car? A stolen/cloned + write-off history check is the
            most on-topic paid extra for a theft-stats reader. */}
        <div className="my-10">
          <CarVerticalReportCTA variant="report" context="stats-car-theft" />
        </div>

        {/* Related stats */}
        <StatsRelated exclude="car-theft" />
      </div>
    </>
  );
}
