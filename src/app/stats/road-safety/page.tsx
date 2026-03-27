import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import ConversionWidget from "@/components/stats/ConversionWidget";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";

import RoadSafetyCharts from "@/components/stats/RoadSafetyCharts";

export const metadata: Metadata = {
  title: "UK Road Safety Statistics 2025 | Fatalities & Casualties Since 1970",
  description:
    "Interactive charts tracking UK road fatalities and casualties from 1970 to 2024. Explore key milestones including seatbelt legislation, speed cameras, and modern vehicle safety technology.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/road-safety",
  },
  openGraph: {
    title: "UK Road Safety Statistics 2025 | Fatalities & Casualties Since 1970",
    description:
      "Interactive charts tracking UK road fatalities and casualties from 1970 to 2024. Explore key milestones and trends in road safety.",
    url: "https://www.freeplatecheck.co.uk/stats/road-safety",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UK Road Safety Statistics 2025 | Fatalities & Casualties Since 1970",
    description:
      "Interactive charts tracking UK road fatalities and casualties from 1970 to 2024.",
  },
};

const faqItems = [
  {
    question: "How many people die on UK roads each year?",
    answer:
      "In 2024, an estimated 1,590 people were killed on UK roads. This represents a roughly 79% reduction from the 1970 peak of 7,499 fatalities, despite the number of vehicles on the road increasing more than threefold during the same period. The UK consistently ranks among the safest countries in Europe for road deaths per capita.",
  },
  {
    question: "What has had the biggest impact on reducing road deaths?",
    answer:
      "The most significant single intervention was the compulsory seatbelt law introduced in 1983, which contributed to a sharp drop in fatalities through the mid-1980s. Other major factors include the introduction of speed cameras from 1992, drink-driving legislation, improvements in vehicle crashworthiness driven by Euro NCAP testing, and better road engineering including dual carriageways and motorway barriers.",
  },
  {
    question: "Which road users are most at risk?",
    answer:
      "Car occupants still account for the largest share of road fatalities in absolute terms, with around 710 deaths in 2024. However, motorcyclists face a disproportionately high risk per mile travelled — they make up roughly 1% of road traffic but account for around 23% of all fatalities. Pedestrians and cyclists are also classified as vulnerable road users, with pedestrian deaths totalling around 358 and cyclist deaths around 82 in 2024.",
  },
  {
    question: "Why did road deaths drop during COVID-19?",
    answer:
      "Road fatalities fell to 1,460 in 2020, the lowest figure in over a century, primarily because traffic volumes dropped dramatically during national lockdowns. With fewer vehicles on the road, there were fewer opportunities for collisions. However, some evidence suggests that average speeds increased on quieter roads, partially offsetting the benefit of reduced traffic. Fatalities rose again as traffic levels returned to normal from 2021 onwards.",
  },
  {
    question: "Are UK roads getting safer or more dangerous?",
    answer:
      "The long-term trend is strongly positive — UK roads are significantly safer than they were 50 years ago. However, progress has plateaued since around 2010, with annual fatalities fluctuating between roughly 1,700 and 1,800 (excluding the COVID dip). Campaigners argue that further reductions will require a combination of stricter speed enforcement, investment in cycling infrastructure, tackling distracted driving from smartphones, and the gradual rollout of advanced driver assistance systems (ADAS) in newer vehicles.",
  },
];

export default function RoadSafetyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Dataset",
              name: "UK Road Safety Statistics 2025",
              description:
                "Interactive charts tracking UK road fatalities and casualties from 1970 to 2024. Explore key milestones including seatbelt legislation, speed cameras, and modern vehicle safety technology.",
              url: "https://www.freeplatecheck.co.uk/stats/road-safety",
              license:
                "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
              creator: {
                "@type": "Organization",
                name: "Free Plate Check",
                url: "https://www.freeplatecheck.co.uk",
              },
              temporalCoverage: "1970/2024",
              spatialCoverage: "United Kingdom",
              variableMeasured:
                "Annual road fatalities and casualties by road user type",
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
        title="UK Road Safety Statistics"
        subtitle="Explore how road fatalities and casualties have changed since 1970. Key milestones, road user breakdowns and the factors behind one of Europe's best safety records."
        breadcrumb="Road Safety"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCallout
            value="~1,590"
            label="Fatalities in 2024"
            color="red"
          />
          <StatCallout
            value="~79%"
            label="Reduction since 1970"
            color="emerald"
          />
          <StatCallout
            value="~82"
            label="Cyclist fatalities (2024)"
            color="amber"
          />
        </div>

        {/* Charts */}
        <RoadSafetyCharts />

        {/* Insight copy */}
        <div className="prose-invert mt-10 max-w-none space-y-4 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            Five Decades of Road Safety Progress
          </h2>
          <p>
            The UK has one of the strongest road safety records in the world, but
            it was not always this way. In 1970, a staggering 7,499 people lost
            their lives on British roads — a figure made all the more sobering
            when you consider that there were far fewer vehicles on the road than
            today. Over the following five decades, a combination of legislation,
            technology and cultural change has driven that number down by roughly
            79%, to around 1,590 fatalities in 2024.
          </p>
          <p>
            The introduction of the compulsory seatbelt law in January 1983 was
            arguably the single most impactful road safety measure in UK history.
            Research from the Transport Research Laboratory estimated that
            seatbelts prevent around 2,000 deaths per year. The effect was
            visible almost immediately, with fatalities dropping sharply through
            the mid-1980s. Rear-seat seatbelt requirements followed in 1991,
            extending protection across the entire vehicle.
          </p>
          <p>
            Drink-driving legislation and sustained public awareness campaigns
            also played a pivotal role. The social stigma around drinking and
            driving grew enormously from the 1970s onwards, supported by
            tougher penalties, random breath testing, and hard-hitting
            advertising campaigns. Alcohol-related road deaths fell by over
            two-thirds between the early 1980s and the 2010s.
          </p>
          <p>
            The rollout of speed cameras from 1992 contributed to a further
            decline by encouraging compliance with speed limits, particularly in
            urban areas and known accident hotspots. While their effectiveness
            remains debated, Department for Transport research has consistently
            found that camera sites see significant reductions in fatal and
            serious collisions.
          </p>
          <p>
            Modern vehicle safety technology has transformed survivability in
            crashes. The Euro NCAP crash testing programme, established in 1997,
            created a competitive incentive for manufacturers to improve
            occupant protection. Today, most new cars sold in the UK achieve a
            five-star rating, incorporating features such as autonomous emergency
            braking, lane-keeping assist, multiple airbags and reinforced
            passenger cells. The gap in safety between a 2025 model and a car
            from the 1990s is enormous — studies suggest that a modern car is
            roughly twice as survivable in a serious collision.
          </p>
          <p>
            The mobile phone driving ban, introduced in 2003 and strengthened in
            2007 with increased penalties, targeted one of the fastest-growing
            risk factors of the modern era. Distraction from handheld devices
            remains a significant concern, with campaigners calling for even
            stricter enforcement as smartphone use has become ubiquitous.
          </p>
          <p>
            Despite this remarkable progress, challenges remain. Fatality
            numbers have broadly plateaued since 2010, hovering between 1,700
            and 1,800 annually (excluding the anomalous COVID-19 year of 2020
            when reduced traffic volumes saw deaths fall to 1,460). Vulnerable
            road users — motorcyclists, pedestrians and cyclists — continue to
            account for a disproportionate share of casualties. Cyclist
            fatalities saw a worrying spike during the pandemic as more people
            took to two wheels without corresponding infrastructure
            improvements. Looking ahead, the widespread adoption of advanced
            driver assistance systems and, eventually, autonomous driving
            technology may hold the key to breaking through the current plateau
            and pushing fatality numbers even lower.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <ConversionWidget headline="Check your car's safety rating" subtext="Enter a reg plate to see Euro NCAP scores, safety recalls, and a full vehicle health check — free and instant." />

        {/* Related stats */}
        <StatsRelated exclude="road-safety" />
      </div>
    </>
  );
}
