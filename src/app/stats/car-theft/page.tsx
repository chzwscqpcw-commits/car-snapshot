import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import ConversionWidget from "@/components/stats/ConversionWidget";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";

import CarTheftCharts from "@/components/stats/CarTheftCharts";

export const metadata: Metadata = {
  title: "Car Theft Statistics UK 2025 | Most Stolen Cars",
  description:
    "See which cars are stolen most often in the UK, ranked by theft rate per 1,000 vehicles. Interactive charts, national trends and theft prevention advice.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/car-theft",
  },
  openGraph: {
    title: "Car Theft Statistics UK 2025 | Most Stolen Cars",
    description:
      "The most stolen cars in the UK ranked by theft rate, with national theft trends and prevention tips.",
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
      "Based on theft rate per 1,000 registered vehicles, Range Rover models consistently top the list. The Range Rover (full size) and Range Rover Sport have some of the highest theft rates in the country, driven largely by keyless entry exploitation and strong demand for parts on the black market.",
  },
  {
    question: "How are car theft rates calculated?",
    answer:
      "Theft rate is calculated as the number of recorded thefts divided by the number of registered vehicles on UK roads, expressed per 1,000 vehicles. This gives a fairer comparison than raw theft counts, which naturally favour high-volume models like the Ford Fiesta.",
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
  {
    question: "Are electric cars less likely to be stolen?",
    answer:
      "Electric vehicles currently have lower theft rates than premium petrol and diesel SUVs, partly because the resale market for stolen EVs is less established and Tesla models have built-in GPS tracking that is difficult to disable. However, as EV adoption rises, theft methods are expected to evolve.",
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
              "@type": "Dataset",
              name: "Car Theft Statistics UK 2025",
              description:
                "See which cars are stolen most often in the UK, ranked by theft rate per 1,000 vehicles. Interactive charts, national trends and theft prevention advice.",
              url: "https://www.freeplatecheck.co.uk/stats/car-theft",
              license:
                "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
              creator: {
                "@type": "Organization",
                name: "Free Plate Check",
                url: "https://www.freeplatecheck.co.uk",
              },
              temporalCoverage: "2014/2024",
              spatialCoverage: "United Kingdom",
              variableMeasured:
                "Vehicle theft count and theft rate per 1,000 registered vehicles by make and model",
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
        title="Car Theft Statistics UK 2025"
        subtitle="Which cars are stolen most often, how theft rates have changed, and what you can do to protect your vehicle."
        breadcrumb="Car Theft"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <StatCallout value="~105,000" label="Vehicle thefts in 2024" color="red" />
          <StatCallout
            value="Range Rover"
            label="Highest theft rate model"
            color="amber"
          />
          <StatCallout value="~45%" label="Recovery rate" color="emerald" />
        </div>

        {/* Charts */}
        <CarTheftCharts />

        {/* Insight copy */}
        <div className="my-10 space-y-4 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            Understanding Car Theft in the UK
          </h2>

          <p>
            Vehicle theft in the UK has undergone a significant transformation
            over the past decade. After falling steadily through the 2000s
            thanks to improved factory-fit immobilisers, theft numbers reversed
            course around 2014 and climbed sharply through to 2019, peaking at
            roughly 118,000 recorded offences. The primary driver of that surge
            was the rise of keyless relay theft — a technique that exploits
            proximity key fobs to unlock and start cars without needing the
            physical key. Premium SUVs, particularly Range Rovers and BMW X
            models, became prime targets because of their high resale value and
            the relative ease with which their keyless systems could be
            bypassed.
          </p>

          <p>
            The COVID-19 pandemic provided a temporary reprieve. Lockdowns in
            2020 and 2021 saw theft numbers dip below 110,000 as fewer vehicles
            were left on streets and public car parks sat empty. However, the
            trend has since plateaued rather than continued falling, with around
            105,000 thefts recorded in 2024. Law enforcement agencies point to
            organised criminal networks that ship stolen vehicles overseas
            within hours, making recovery difficult once a car leaves the
            country.
          </p>

          <h3 className="text-lg font-semibold text-gray-100">
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

          <h3 className="text-lg font-semibold text-gray-100">
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

          <h3 className="text-lg font-semibold text-gray-100">
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
            opportunistic theft. Finally, checking your vehicle&apos;s theft
            risk before purchase — using data like the rankings on this page —
            helps you factor security costs into the total cost of ownership.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <ConversionWidget headline="Check your vehicle's theft risk" subtext="Enter a reg plate to see theft rates for your make and model, plus MOT history, tax status, and more." />

        {/* Related stats */}
        <StatsRelated exclude="car-theft" />
      </div>
    </>
  );
}
