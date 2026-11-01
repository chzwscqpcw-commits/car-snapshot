import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import ConversionWidget from "@/components/stats/ConversionWidget";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";
import CiteThisData from "@/components/stats/CiteThisData";
import DataAsOf from "@/components/stats/DataAsOf";
import TheftTable from "@/components/stats/TheftTable";
import { TheftRateChart, TheftCountChart } from "@/components/stats/TheftCharts";
import {
  THEFT_YEAR as YEAR,
  THEFT_SOURCE,
  theftFleets,
  stolen,
  yearChange,
  signedPct,
  fmt,
  oneIn,
  theftDatasetSchema,
} from "@/lib/theft-stats";

// Figures from theft-stats.json `motorcycles` (DVLA FOI FOIR13058 ÷ DfT
// VEH0120 "Motorcycles"). DfT names scooters by type-approval code; the build
// script renames the big ones (WW125 → PCX125, GPD → NMAX, NSC → Vision).
// No partner CTA: carVertical's report is pitched at cars.
const BIKES = theftFleets.motorcycles;
const URL = "https://www.freeplatecheck.co.uk/stats/motorbike-theft";
const STOLEN = stolen("motorcycles");
const CHANGE = yearChange("motorcycles");
const TOP = BIKES.topByCount[0];
const NATIONAL = BIKES.nationalPer1000;
const CAR_NATIONAL = theftFleets.cars.nationalPer1000;
const byYear = BIKES.byYear as Record<string, number>;
const TOP3 = BIKES.topByCount.slice(0, 3);
const TOP3_SHARE = Math.round((TOP3.reduce((t, r) => t + r.thefts, 0) / STOLEN) * 100);

const TITLE = `Most Stolen Motorbikes in the UK: ${YEAR} DVLA Figures`;
const DESCRIPTION = `${fmt(STOLEN)} motorbikes and scooters were stolen in the UK in ${YEAR}. The ${TOP.name} tops the list: ${fmt(TOP.thefts)} stolen, about ${oneIn(TOP.per1000)} on the road. Theft rates for ${BIKES.ratedModels} models.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, siteName: "Free Plate Check", locale: "en_GB", type: "website" },
};

const faqItems = [
  {
    question: "What is the most stolen motorbike in the UK?",
    answer: `The ${TOP.name} scooter: ${fmt(TOP.thefts)} were recorded stolen by the DVLA in ${YEAR}, against ${fmt(TOP.licensed)} licensed, roughly ${oneIn(TOP.per1000)}. The ${TOP3[1].name} and ${TOP3[2].name} come next.`,
  },
  {
    question: "How many motorbikes are stolen in the UK each year?",
    answer: `${fmt(STOLEN)} motorbikes, scooters and mopeds were recorded stolen in ${YEAR}, ${CHANGE < 0 ? "down" : "up"} ${Math.abs(CHANGE)}% on ${YEAR - 1}: about ${Math.round(STOLEN / 365)} a day.`,
  },
  {
    question: "Why are 125cc scooters stolen so often?",
    answer:
      "They're light enough to lift into a van, often started without much effort, worth stealing for parts, and used in other crimes such as phone snatching. Many are parked on the street by commuters and delivery riders.",
  },
  {
    question: "Are motorbikes more likely to be stolen than cars?",
    answer: `Far more. ${NATIONAL} in every 1,000 licensed motorbikes were stolen in ${YEAR}, against ${CAR_NATIONAL} in every 1,000 cars: about ${Math.round(NATIONAL / CAR_NATIONAL)} times the risk.`,
  },
  {
    question: "How are the motorbike theft rates calculated?",
    answer: `Bikes recorded stolen in ${YEAR} (DVLA, FOI release FOIR13058) divided by the number of the same model licensed at the end of ${YEAR} (DfT statistics), per 1,000. A stolen bike often stops being taxed, so the licensed count for heavily stolen models is a little lower than the number genuinely on the road, and their rates read slightly high.`,
  },
];

export default function MotorbikeTheftPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            theftDatasetSchema(`Most stolen motorbikes in the UK (${YEAR} DVLA data)`, DESCRIPTION, URL, "Motorcycles recorded stolen per 1,000 licensed, by make and model"),
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
        title="Most Stolen Motorbikes in the UK"
        subtitle="Which motorbikes and scooters are stolen most, why 125cc scooters dominate, and how to lock a bike properly."
        breadcrumb="Motorbike Theft"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCallout value={fmt(STOLEN)} label={`Motorbikes stolen in ${YEAR}`} color="red" />
          <StatCallout value={TOP.name} label={`Most stolen: ${fmt(TOP.thefts)} in ${YEAR}`} color="amber" />
          <StatCallout value={signedPct(CHANGE)} label={`Bike thefts vs ${YEAR - 1}`} color="emerald" />
        </div>
        <p className="mb-10 text-xs text-slate-500">Source: {THEFT_SOURCE}. Includes scooters and mopeds.</p>

        <h2 className="mb-4 text-xl font-bold text-slate-100">The 10 Most Stolen Motorbikes in {YEAR}</h2>
        <TheftTable rows={BIKES.topByCount} national={NATIONAL} />
        <p className="mb-10 text-xs text-slate-500">
          Per 1,000 = bikes stolen in {YEAR} for every 1,000 licensed. Motorbike average: {NATIONAL}; cars:{" "}
          {CAR_NATIONAL}. &quot;Range&quot; models group every engine size DfT files under one name.
        </p>

        <div className="space-y-6">
          <TheftRateChart
            rows={BIKES.topByRate}
            national={NATIONAL}
            title="Highest Motorbike Theft Rates"
            subtitle={`Bikes stolen in ${YEAR} per 1,000 licensed (models with 10,000+ licensed). Dashed line: motorbike average, ${NATIONAL}`}
          />
          <TheftCountChart
            data={Object.entries(byYear).map(([label, value]) => ({ label, value }))}
            title="Motorbikes Stolen per Year"
            subtitle={`Motorbikes, scooters and mopeds recorded stolen by the DVLA, ${Object.keys(byYear)[0]}–${YEAR}`}
            noun="Bikes stolen"
          />
        </div>
        <DataAsOf files={["theft-stats.json"]} className="mt-3" />

        <div className="my-10 space-y-4 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-bold text-slate-100">Scooters, Not Superbikes</h2>
          <p>
            The motorbikes thieves want most aren&apos;t big sports bikes but everyday 125cc scooters. The{" "}
            {TOP3.map((r) => r.name).join(", ").replace(/, ([^,]*)$/, " and $1")} alone made up {TOP3_SHARE}% of
            all motorbike thefts in {YEAR}. At {TOP.per1000} per 1,000, a {TOP.name} is around{" "}
            {Math.round(TOP.per1000 / CAR_NATIONAL)} times more likely to be stolen than the average car.
          </p>
          <p>
            Scooters are light enough for two people to lift into a van, popular with commuters and delivery
            riders who park on the street, and in steady demand for parts. Some are stolen to commit other
            crimes, such as phone snatching, and then abandoned.
          </p>
          <h3 className="text-lg font-semibold text-slate-100">How to Lock a Motorbike</h3>
          <p>
            Lock the bike to something that can&apos;t move: a ground anchor at home, or a lamp post or bike bay
            rail on the street. Use a heavy chain kept off the ground, where it is harder to attack, plus a disc
            lock with a reminder cable so you don&apos;t ride off with it on. A cover hides which model it is,
            and an alarm or tracker adds a further layer. Many insurers specify Sold Secure Gold or Diamond
            rated locks.
          </p>
        </div>

        <CiteThisData title={TITLE} url={URL} files={["theft-stats.json"]} />
        <FaqAccordion items={faqItems} />

        <ConversionWidget
          headline="Buying a used bike?"
          subtext="Enter the reg for its MOT history, mileage record and tax status — free."
        />

        <StatsRelated exclude="motorbike-theft" />
      </div>
    </>
  );
}
