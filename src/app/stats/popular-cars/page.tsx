import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";

import PopularCarsCharts from "@/components/stats/PopularCarsCharts";

export const metadata: Metadata = {
  title: "Most Popular Cars in the UK 2025 | Top Makes & Models",
  description:
    "Discover the most popular cars on UK roads. Top 20 makes by fleet size, model registration trends, colour popularity and more.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/popular-cars",
  },
  openGraph: {
    title: "Most Popular Cars in the UK 2025 | Top Makes & Models",
    description:
      "Discover the most popular cars on UK roads. Top 20 makes by fleet size, model registration trends, colour popularity and more.",
    url: "https://www.freeplatecheck.co.uk/stats/popular-cars",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
};

const faqs = [
  {
    question: "What is the most popular car in the UK?",
    answer:
      "Ford is the most popular car make in the UK with approximately 4.28 million registered vehicles. At a model level, the Ford Fiesta held the title of Britain's best-selling car for over a decade, though production ended in 2023. The Vauxhall Corsa and Volkswagen Golf have since taken the top spots for new registrations.",
  },
  {
    question: "Why was the Ford Fiesta discontinued?",
    answer:
      "Ford discontinued the Fiesta in 2023 as part of a strategic shift towards electrification and SUVs. The small hatchback segment had been shrinking for years as buyers moved to crossovers and SUVs, and Ford chose to focus its European investment on electric models like the Explorer EV. Despite being the UK's best-selling car for most of the 2010s, the Fiesta's sales had roughly halved between 2015 and 2022.",
  },
  {
    question: "What is the most popular car colour in the UK?",
    answer:
      "White is the most popular car colour in the UK, accounting for 27.6% of all registered vehicles. Black (20.2%) and grey (19.2%) take second and third place. Together, these three achromatic colours account for around two-thirds of all cars on UK roads. More vibrant colours like red (7.6%), green (2.3%) and orange (1.5%) are far less common.",
  },
  {
    question: "How many cars are there in the UK?",
    answer:
      "There are approximately 33 million cars registered in the UK. This figure has grown steadily over the decades, though the rate of growth has slowed in recent years. The fleet is increasingly diverse in terms of fuel types, with electric and hybrid vehicles making up a growing share of new registrations while the total number of diesel cars on the road has started to decline.",
  },
  {
    question: "Which car brands are growing fastest in the UK?",
    answer:
      "Korean brands Hyundai and Kia have seen the strongest growth in the UK market over the past decade, climbing into the top 10 most popular makes. Tesla has also grown rapidly from a standing start, though its total fleet size remains relatively small. Among established European brands, Skoda and SEAT have gained market share through competitive pricing and strong reviews. Meanwhile, traditional volume brands like Vauxhall and Peugeot have seen their share gradually erode.",
  },
];

export default function PopularCarsPage() {
  return (
    <>
      <StatsHeroSection
        title="Most Popular Cars in the UK 2025"
        subtitle="Top makes, models and colours on UK roads. See which brands dominate and how the landscape is shifting."
        breadcrumb="Most Popular Cars"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <StatCallout
            value="4.28M"
            label="#1 make: Ford"
            color="emerald"
          />
          <StatCallout
            value="27.6%"
            label="#1 colour: White"
            color="sky"
          />
          <StatCallout
            value="~33M"
            label="Total UK car fleet"
            color="amber"
          />
        </div>

        {/* Interactive charts */}
        <PopularCarsCharts />

        {/* Insight copy */}
        <article className="my-10 space-y-5 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            The UK&apos;s Favourite Cars: A Shifting Landscape
          </h2>
          <p>
            Ford has been the dominant force on British roads for decades,
            and the numbers still back that up. With roughly 4.28 million
            registered vehicles, Ford sits comfortably ahead of Volkswagen
            (3.15 million) and Vauxhall (2.98 million) at the top of the UK
            fleet table. But look beneath the headline figure and the picture
            is changing. Ford&apos;s lead has been built largely on two models
            -- the Fiesta and the Focus -- both of which have now been
            discontinued in Europe, leaving a significant gap in the
            brand&apos;s line-up that newer models have yet to fill.
          </p>
          <p>
            The Ford Fiesta was, for many years, the defining British car. It
            topped the annual registration charts for most of the 2010s,
            regularly selling over 100,000 units a year. Our model trend chart
            tells the story vividly: 131,000 new Fiestas were registered in
            2015, but by 2022 that had fallen to 31,000, and in 2023 the
            last Fiesta rolled off the production line in Cologne. The Focus
            followed a similar trajectory, dropping from 81,000 registrations
            in 2015 to zero by 2024. Ford&apos;s decision to end both models
            reflected a broader industry shift away from traditional
            hatchbacks and towards SUVs, crossovers and electric vehicles.
          </p>
          <p>
            That shift has opened the door for other models. The Vauxhall
            Corsa and Volkswagen Golf have emerged as the new stalwarts of the
            new-car charts, while Korean manufacturers Hyundai and Kia have
            climbed steadily into the top ten makes by fleet size. Their
            combination of long warranties, competitive pricing and
            increasingly sophisticated design has resonated with UK buyers.
            The Tucson, Sportage and Niro have all become familiar sights on
            British roads, contributing to a combined fleet of over 2.6
            million Hyundai and Kia vehicles.
          </p>
          <p>
            Premium German brands have also strengthened their position. BMW,
            Mercedes-Benz and Audi between them account for roughly 6.5
            million registered cars in the UK, reflecting both the growth of
            PCP finance deals that brought premium cars within reach of more
            buyers, and the German manufacturers&apos; success in offering a
            wide range of models from compact hatchbacks to large SUVs.
          </p>
          <p>
            The rise of SUVs and crossovers is perhaps the most significant
            trend of the past decade. Models like the Nissan Qashqai, Ford
            Kuga, Hyundai Tucson and Kia Sportage have steadily displaced
            traditional saloons and hatchbacks. SMMT data shows that SUVs now
            account for over 40% of new car sales, up from around 20% just
            ten years ago. This has reshaped the fleet profile and influenced
            everything from fuel consumption averages to the type of parking
            spaces councils build.
          </p>
          <p>
            Colour trends tell their own story. White has become the dominant
            colour on UK roads, accounting for 27.6% of all registered cars.
            Two decades ago, silver held that crown. The shift to white
            reflects global trends driven partly by the premium-car segment,
            where white paint is often a no-cost option and photographs well
            for online resale listings. Black (20.2%) and grey (19.2%)
            complete an achromatic top three that together represent around
            two-thirds of all vehicles. For buyers who want their car to
            stand out, the data suggests that green, orange or yellow will
            certainly do the job -- between them they account for less than
            5% of the fleet.
          </p>
          <p>
            Looking ahead, the UK car fleet is set for further
            transformation as the 2035 ban on new petrol and diesel car sales
            approaches. Electric vehicles already account for a growing share
            of new registrations, and brands like Tesla, BYD and MG are
            adding new names to the fleet. Whether Ford can maintain its
            historic lead through the transition to electric remains one of
            the most interesting questions in UK motoring.
          </p>
        </article>

        {/* FAQ */}
        <FaqAccordion items={faqs} />

        {/* CTA */}
        <StatsCTA />

        {/* Related */}
        <StatsRelated exclude="popular-cars" />
      </div>
    </>
  );
}
