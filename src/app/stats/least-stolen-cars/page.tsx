import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import ConversionWidget from "@/components/stats/ConversionWidget";
import StatsRelated from "@/components/stats/StatsRelated";
import CarVerticalReportCTA from "@/components/CarVerticalReportCTA";
import FaqAccordion from "@/components/stats/FaqAccordion";
import CiteThisData from "@/components/stats/CiteThisData";
import DataAsOf from "@/components/stats/DataAsOf";
import TheftTable from "@/components/stats/TheftTable";
import { TheftRateChart } from "@/components/stats/TheftCharts";
import Link from "next/link";
import { THEFT_YEAR as YEAR, THEFT_SOURCE, theftFleets, fmt, oneIn, theftDatasetSchema } from "@/lib/theft-stats";

// Figures from theft-stats.json `cars.leastByRate`: the 10 lowest theft rates
// among models with 100,000+ licensed, so a tiny fleet with no thefts can't
// top the list.
const CARS = theftFleets.cars;
const URL = "https://www.freeplatecheck.co.uk/stats/least-stolen-cars";
const LEAST = CARS.leastByRate;
const SAFEST = LEAST[0];
const NATIONAL = CARS.nationalPer1000;
const RISKIEST = CARS.topByRate[0];
const EV = CARS.byFuel.find((r) => r.fuel === "Electric");
const TESLAS = LEAST.filter((r) => r.name.startsWith("Tesla"));
const OTHERS = LEAST.filter((r) => !r.name.startsWith("Tesla")).slice(0, 4).map((r) => r.name);

const TITLE = `Least Stolen Cars in the UK: ${YEAR} DVLA Figures`;
const DESCRIPTION = `The cars thieves leave alone. The ${SAFEST.name} had the UK's lowest theft rate in ${YEAR}: ${SAFEST.per1000} per 1,000, about ${oneIn(SAFEST.per1000)}, against an average of ${NATIONAL}. The 10 least stolen popular cars.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, siteName: "Free Plate Check", locale: "en_GB", type: "website" },
};

const faqItems = [
  {
    question: "What is the least stolen car in the UK?",
    answer: `Among cars with at least 100,000 on the road, the ${SAFEST.name}: ${fmt(SAFEST.thefts)} were recorded stolen in ${YEAR} out of ${fmt(SAFEST.licensed)} licensed, a rate of ${SAFEST.per1000} per 1,000. The UK average is ${NATIONAL}.`,
  },
  {
    question: "Are electric cars stolen less?",
    answer: EV
      ? `Yes. Fully electric cars were stolen at ${EV.per1000} per 1,000 in ${YEAR}, below the ${NATIONAL} average for all cars and well below hybrids. Teslas are the least stolen of all, though some electric models, such as the Nissan Leaf and Hyundai Ioniq, are targeted.`
      : `Teslas have the lowest theft rates of any common car in ${YEAR}.`,
  },
  {
    question: "Does a car's theft risk affect insurance?",
    answer:
      "Theft risk is one of the factors behind a car's insurance group and premium, alongside repair costs, performance and security. A car thieves ignore can be cheaper to insure, but your postcode, parking and driving record usually matter more.",
  },
  {
    question: "How is the least-stolen list calculated?",
    answer: `Cars recorded stolen in ${YEAR} (DVLA, FOI release FOIR13058) divided by the number of the same model licensed at the end of ${YEAR} (DfT statistics), per 1,000. Only models with at least 100,000 licensed are included, so a rare car with no thefts by chance can't top the table.`,
  },
];

export default function LeastStolenCarsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            theftDatasetSchema(`Least stolen cars in the UK (${YEAR} DVLA data)`, DESCRIPTION, URL, "Cars recorded stolen per 1,000 licensed, by make and model"),
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ]),
        }}
      />
      <StatsHeroSection
        title="Least Stolen Cars in the UK"
        subtitle="The popular cars thieves leave alone, from DVLA theft records, and what they have in common."
        breadcrumb="Least Stolen Cars"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCallout value={SAFEST.name} label={`Least stolen: ${SAFEST.per1000} per 1,000`} color="emerald" />
          <StatCallout value={String(NATIONAL)} label={`UK average per 1,000 cars, ${YEAR}`} color="sky" />
          <StatCallout
            value={`${Math.round(RISKIEST.per1000 / SAFEST.per1000)}×`}
            label={`${RISKIEST.name} theft rate vs ${SAFEST.name}`}
            color="red"
          />
        </div>
        <p className="mb-10 text-xs text-slate-500">Source: {THEFT_SOURCE}.</p>

        <h2 className="mb-4 text-xl font-bold text-slate-100">The 10 Least Stolen Cars in {YEAR}</h2>
        <TheftTable rows={LEAST} national={NATIONAL} mode="least" />
        <p className="mb-10 text-xs text-slate-500">
          Cars with 100,000+ licensed, ranked by thefts per 1,000. UK average: {NATIONAL}. See the{" "}
          <Link href="/stats/car-theft" className="underline hover:text-slate-300">
            most stolen cars
          </Link>{" "}
          for the other end of the table.
        </p>

        <TheftRateChart
          rows={LEAST}
          national={NATIONAL}
          title="Lowest Theft Rates"
          subtitle={`Cars stolen in ${YEAR} per 1,000 licensed (100,000+ on the road). Dashed line: UK average, ${NATIONAL}`}
        />
        <DataAsOf files={["theft-stats.json"]} className="mt-3" />

        <div className="my-10 space-y-4 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-bold text-slate-100">What the Least Stolen Cars Have in Common</h2>
          {TESLAS.length > 0 && (
            <p>
              {TESLAS.length > 1 ? "Teslas take the top two places" : "A Tesla takes the top place"}. They are
              permanently connected, so an owner can see where the car is from their phone, and they can be set
              to ask for a PIN before they will drive. A Tesla that can be found within minutes isn&apos;t worth
              the risk to most thieves. Fully electric cars overall were stolen at{" "}
              {EV ? EV.per1000 : "below the average"} per 1,000.
            </p>
          )}
          <p>
            The rest of the list is mostly small, affordable cars such as the{" "}
            {OTHERS.slice(0, -1).join(", ")} and {OTHERS[OTHERS.length - 1]}. Their parts aren&apos;t valuable enough to strip and sell, and there
            is little demand for them abroad, so organised gangs pass them by.
          </p>
          <p>
            The pattern at the top of the theft table is the opposite: keyless-entry hybrids and premium SUVs
            with valuable parts. The {RISKIEST.name} was stolen at {RISKIEST.per1000} per 1,000,{" "}
            {Math.round(RISKIEST.per1000 / SAFEST.per1000)} times the rate of the {SAFEST.name}.
          </p>
        </div>

        <CiteThisData title={TITLE} url={URL} />
        <FaqAccordion items={faqItems} />

        <ConversionWidget
          headline="Found the car you want?"
          subtext="Enter the reg for its MOT history, mileage record and tax status — free."
        />
        <div className="my-10">
          <CarVerticalReportCTA variant="report" context="stats-least-stolen" />
        </div>

        <StatsRelated exclude="least-stolen-cars" />
      </div>
    </>
  );
}
