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

// Figures from theft-stats.json `vans` — DVLA FOI FOIR13058 matched to DfT
// VEH0120 body type "Light goods vehicles", which includes pickups (Hilux,
// Navara, Ranger). Rated against the van average, not the car one.
const VANS = theftFleets.vans;
const URL = "https://www.freeplatecheck.co.uk/stats/van-theft";
const STOLEN = stolen("vans");
const CHANGE = yearChange("vans");
const TOP = VANS.topByCount[0];
const RISKIEST = VANS.topByRate[0];
const NATIONAL = VANS.nationalPer1000;
const CAR_NATIONAL = theftFleets.cars.nationalPer1000;
const byYear = VANS.byYear as Record<string, number>;
const PICKUPS = VANS.topByRate.filter((r) => /Navara|Hilux|Ranger|L200|Amarok|D-Max/i.test(r.name));

const listJoin = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

const TITLE = `Most Stolen Vans in the UK: ${YEAR} DVLA Figures`;
const DESCRIPTION = `${fmt(STOLEN)} vans and pickups were stolen in the UK in ${YEAR}. The ${TOP.name} was stolen most (${fmt(TOP.thefts)}); the ${RISKIEST.name} is the most likely, at ${oneIn(RISKIEST.per1000)} a year. Theft rates for ${VANS.ratedModels} vans.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, siteName: "Free Plate Check", locale: "en_GB", type: "website" },
};

const faqItems = [
  {
    question: "What is the most stolen van in the UK?",
    answer: `The ${TOP.name}: ${fmt(TOP.thefts)} were recorded stolen by the DVLA in ${YEAR}. By theft rate, the ${RISKIEST.name} is the most targeted, with ${RISKIEST.per1000} stolen per 1,000 on the road (${oneIn(RISKIEST.per1000)}).`,
  },
  {
    question: "How many vans are stolen in the UK each year?",
    answer: `${fmt(STOLEN)} vans and pickups were recorded stolen in ${YEAR}, ${CHANGE < 0 ? "down" : "up"} ${Math.abs(CHANGE)}% on ${YEAR - 1}: about ${Math.round(STOLEN / 52)} a week.`,
  },
  {
    question: "Are vans stolen more often than cars?",
    answer: `Yes, nearly twice as often. ${NATIONAL} in every 1,000 licensed vans were stolen in ${YEAR}, against ${CAR_NATIONAL} in every 1,000 cars.`,
  },
  {
    question: "Why are pickup trucks stolen so often?",
    answer:
      "Pickups like the Nissan Navara and Toyota Hilux are tough, valuable for their age and in demand abroad, so many are stolen to order and exported or broken for parts. They're also often parked on farms and building sites, away from the owner's home.",
  },
  {
    question: "How are the van theft rates calculated?",
    answer: `Vans recorded stolen in ${YEAR} (DVLA, FOI release FOIR13058) divided by the number of the same model licensed at the end of ${YEAR} (DfT statistics, light goods vehicles), per 1,000. Models with fewer than 5,000 licensed aren't rated.`,
  },
];

export default function VanTheftPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            theftDatasetSchema(`Most stolen vans in the UK (${YEAR} DVLA data)`, DESCRIPTION, URL, "Vans recorded stolen per 1,000 licensed, by make and model"),
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
        title="Most Stolen Vans in the UK"
        subtitle="Which vans and pickups thieves target, how the risk compares with cars, and how to protect your van and tools."
        breadcrumb="Van Theft"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCallout value={fmt(STOLEN)} label={`Vans stolen in ${YEAR}`} color="red" />
          <StatCallout value={TOP.name} label={`Most stolen: ${fmt(TOP.thefts)} in ${YEAR}`} color="amber" />
          <StatCallout value={signedPct(CHANGE)} label={`Van thefts vs ${YEAR - 1}`} color="emerald" />
        </div>
        <p className="mb-10 text-xs text-slate-500">Source: {THEFT_SOURCE}. Vans include pickups.</p>

        <h2 className="mb-4 text-xl font-bold text-slate-100">The 10 Most Stolen Vans in {YEAR}</h2>
        <TheftTable rows={VANS.topByCount} national={NATIONAL} />
        <p className="mb-10 text-xs text-slate-500">
          Per 1,000 = vans stolen in {YEAR} for every 1,000 licensed. Van average: {NATIONAL}; cars:{" "}
          {CAR_NATIONAL}.
        </p>

        <div className="space-y-6">
          <TheftRateChart
            rows={VANS.topByRate}
            national={NATIONAL}
            title="Highest Van Theft Rates"
            subtitle={`Vans stolen in ${YEAR} per 1,000 licensed (models with 10,000+ on the road). Dashed line: van average, ${NATIONAL}`}
          />
          <TheftCountChart
            data={Object.entries(byYear).map(([label, value]) => ({ label, value }))}
            title="Vans Stolen per Year"
            subtitle={`Vans and pickups recorded stolen by the DVLA, ${Object.keys(byYear)[0]}–${YEAR}`}
            noun="Vans stolen"
          />
        </div>
        <DataAsOf files={["theft-stats.json", "theft-risk-vans.json"]} className="mt-3" />

        <div className="my-10 space-y-4 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-bold text-slate-100">Why Vans Are Targeted</h2>
          <p>
            A van is stolen at nearly twice the rate of a car: {NATIONAL} per 1,000 against {CAR_NATIONAL}. The
            Ford Transit tops the count simply because it is everywhere, but at {VANS.topByCount[0].per1000} per
            1,000 it is also well above the van average. Vans are worth stealing for their parts, which keep a
            working fleet on the road, and for what is inside them: a tradesperson&apos;s tools can be worth more
            than the van.
          </p>
          {PICKUPS.length > 0 && (
            <p>
              Pickups are among the most at risk: {listJoin(PICKUPS.map((p) => `the ${p.name} (${p.per1000} per 1,000)`))}{" "}
              all beat the van average. Durable four-wheel-drive pickups hold their value and sell well abroad.
            </p>
          )}
          <h3 className="text-lg font-semibold text-slate-100">How to Protect a Van</h3>
          <p>
            Layer the defences. Fit deadlocks or slam locks to the load doors, which are often the weak point,
            and a steering wheel or pedal lock for the cab. A lock on the OBD port stops thieves programming a
            new key. Take tools out overnight where you can, or use a bolted-down tool vault, and mark tools
            with your postcode. A Thatcham-approved tracker helps police recover a stolen van, and many van
            insurers ask for one on high-risk models.
          </p>
        </div>

        <CiteThisData title={TITLE} url={URL} />
        <FaqAccordion items={faqItems} />

        <ConversionWidget
          headline="Buying a used van?"
          subtext="Enter the reg for its MOT history, mileage record and tax status — free."
        />
        <div className="my-10">
          <CarVerticalReportCTA variant="report" context="stats-van-theft" />
        </div>

        <StatsRelated exclude="van-theft" />
      </div>
    </>
  );
}
