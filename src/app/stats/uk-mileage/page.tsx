import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";

import MileageCharts from "@/components/stats/MileageCharts";

export const metadata: Metadata = {
  title: "UK Average Car Mileage 2025 | Annual Mileage Trends & By Age",
  description:
    "Interactive charts showing UK average annual car mileage from 1990 to 2024, mileage by vehicle age group, and a calculator to see if your mileage is above or below average.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/uk-mileage",
  },
  openGraph: {
    title: "UK Average Car Mileage 2025 | Annual Mileage Trends & By Age",
    description:
      "Interactive charts showing UK average annual car mileage from 1990 to 2024, mileage by vehicle age group, and a calculator to check if your mileage is normal.",
    url: "https://www.freeplatecheck.co.uk/stats/uk-mileage",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UK Average Car Mileage 2025 | Annual Mileage Trends & By Age",
    description:
      "Interactive charts of UK annual car mileage from 1990 to 2024, plus mileage by vehicle age.",
  },
};

const faqItems = [
  {
    question: "What is the average annual mileage for a car in the UK?",
    answer:
      "As of 2024, the average UK car covers approximately 7,200 miles per year. This is a significant decline from the early 1990s when the average was closer to 9,900 miles. The trend has been downward for over three decades, accelerated by the pandemic and the shift towards remote and hybrid working.",
  },
  {
    question: "What is considered high mileage for a used car?",
    answer:
      "A used car is generally considered high mileage if it has covered significantly more than the national average for its age. For a 5-year-old car, anything above 50,000 miles would be above average (based on roughly 9,200 miles per year for that age group). However, high mileage is not necessarily bad — a well-maintained motorway car with 80,000 miles may be in better shape than a low-mileage car used mainly for short trips. Regular servicing, MOT history and overall condition matter more than the odometer alone.",
  },
  {
    question: "How does mileage affect my MOT?",
    answer:
      "Mileage itself is not directly tested during an MOT, but the wear and tear associated with higher mileage can lead to MOT failures. Common mileage-related failure points include worn brake discs and pads, deteriorated suspension components, exhaust corrosion and tyre wear. Cars covering above-average miles should expect more frequent servicing to stay ahead of these issues. MOT testers also record the odometer reading, which creates a useful mileage history for future buyers.",
  },
  {
    question: "Why has average car mileage been declining?",
    answer:
      "Several factors have contributed to the long-term decline in average annual mileage. Rising fuel costs have made driving more expensive, while improved public transport and the growth of online shopping have reduced the need for car journeys. Urban congestion and parking difficulties also discourage driving. The COVID-19 pandemic in 2020 caused the sharpest single-year drop on record, and the subsequent shift towards working from home has kept mileage below pre-pandemic levels.",
  },
  {
    question: "Do newer cars get driven more than older cars?",
    answer:
      "Yes, significantly. Cars under one year old cover an average of 12,500 miles per year, while cars aged 13 or older average just 4,200 miles. This is because newer cars tend to be primary vehicles used for commuting and long journeys, while older cars are often second vehicles used for shorter, local trips. Newer cars also benefit from manufacturer warranties and lower running costs, encouraging owners to drive them more.",
  },
];

export default function UkMileagePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Dataset",
              name: "UK Average Car Mileage 2025",
              description:
                "Interactive charts showing UK average annual car mileage from 1990 to 2024, mileage by vehicle age group, and a calculator to see if your mileage is above or below average.",
              url: "https://www.freeplatecheck.co.uk/stats/uk-mileage",
              license:
                "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
              creator: {
                "@type": "Organization",
                name: "Free Plate Check",
                url: "https://www.freeplatecheck.co.uk",
              },
              temporalCoverage: "1990/2024",
              spatialCoverage: "United Kingdom",
              variableMeasured:
                "Average annual car mileage in miles per year",
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
        title="UK Average Car Mileage Trends"
        subtitle="Explore how average annual car mileage has changed since 1990, compare mileage by vehicle age, and check whether your car's mileage is above or below the national average."
        breadcrumb="UK Mileage"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCallout
            value="~7,200"
            label="Current avg. miles/year"
            color="emerald"
          />
          <StatCallout
            value="9,900"
            label="1990 avg. miles/year"
            color="amber"
          />
          <StatCallout
            value="-27%"
            label="Decline since 1990"
            color="red"
          />
        </div>

        {/* Charts */}
        <MileageCharts />

        {/* Insight copy */}
        <div className="prose-invert mt-10 max-w-none space-y-4 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            Why UK Drivers Are Covering Fewer Miles
          </h2>
          <p>
            The average UK car now covers around 7,200 miles per year — roughly
            27% less than the 9,900-mile average recorded in 1990. This
            long-running decline reflects fundamental shifts in how, why and
            how often British motorists use their cars.
          </p>
          <p>
            For much of the 1990s and 2000s, the drop was gradual, driven by
            steadily rising fuel prices and growing congestion on UK roads. As
            unleaded petrol climbed from around 40p per litre in 1990 to over
            £1 by the mid-2000s, the cost of every journey increased
            meaningfully. At the same time, the expansion of online shopping
            and home deliveries began to erode the need for many routine car
            trips — weekly supermarket runs, trips to the high street and
            errands that once required a drive became click-and-deliver tasks.
          </p>
          <p>
            The financial crisis of 2008-2009 accelerated the trend, as
            households cut discretionary spending and many commuters sought
            cheaper alternatives. Public transport improvements in major cities,
            particularly London&apos;s expanding Tube and bus network, gave
            urban drivers viable alternatives. Cycling infrastructure also
            improved, with schemes like London&apos;s Santander Cycles
            launching in 2010, and many cities investing in dedicated cycle
            lanes.
          </p>
          <p>
            The most dramatic single-year drop came in 2020, when COVID-19
            lockdowns slashed average mileage to just 5,300 miles — a 28% fall
            from the previous year. With offices, schools and shops closed for
            extended periods, millions of cars sat idle on driveways. Even as
            restrictions eased through 2021 and 2022, mileage recovered only
            partially. The pandemic permanently reshaped working patterns: ONS
            data shows that by 2024, around 28% of UK workers were in hybrid
            roles, eliminating two or three commuting days per week for a
            significant portion of the workforce.
          </p>
          <p>
            Environmental awareness has also played a growing role. Clean Air
            Zones in cities including London, Birmingham, Bristol and Bradford
            have made drivers think twice about urban journeys, while the
            introduction of ULEZ in London penalises older, more polluting
            vehicles. For younger drivers in particular, car ownership itself
            is becoming less automatic — rising insurance costs, urban living
            and attitudes towards sustainability mean fewer 17-year-olds are
            learning to drive compared to previous generations.
          </p>
          <p>
            The data also reveals a striking gap by vehicle age. Cars under a
            year old cover an average of 12,500 miles annually — nearly three
            times the 4,200 miles recorded for cars aged 13 and over. This
            reflects the role of newer cars as primary daily drivers, often
            financed through PCP deals that include mileage allowances
            encouraging regular use. Older cars, by contrast, tend to be
            second vehicles, weekend runarounds or enthusiast cars that see
            limited use.
          </p>
          <p>
            Looking ahead, the trend towards lower average mileage is likely to
            continue. The growth of electric vehicles, which currently make up
            around 20% of new registrations, may alter the picture in
            unexpected ways — EV owners report driving more due to lower
            per-mile running costs, but this is offset by the overall reduction
            in journeys driven by remote working and urbanisation. For buyers
            assessing a used car, understanding what constitutes &quot;normal&quot;
            mileage for a given age is essential context when judging value,
            condition and remaining lifespan.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <StatsCTA />

        {/* Related stats */}
        <StatsRelated exclude="uk-mileage" />
      </div>
    </>
  );
}
