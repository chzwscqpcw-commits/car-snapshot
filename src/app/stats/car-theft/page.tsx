import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import ConversionWidget from "@/components/stats/ConversionWidget";
import StatsRelated from "@/components/stats/StatsRelated";
import CarVerticalReportCTA from "@/components/CarVerticalReportCTA";
import FaqAccordion from "@/components/stats/FaqAccordion";
import CiteThisData from "@/components/stats/CiteThisData";
import DataAsOf from "@/components/stats/DataAsOf";
import Link from "next/link";
import TheftTable from "@/components/stats/TheftTable";
import TheftModelSearch from "@/components/stats/TheftModelSearch";
import { TheftRateChart, TheftCountChart, TheftRateColumns } from "@/components/stats/TheftCharts";
import theftStats from "@/data/theft-stats.json";
import { theftDatasetSchema } from "@/lib/theft-stats";

// Every figure on this page comes from theft-stats.json, built by
// scripts/process-theft-foi.py from DVLA's make/model stolen-vehicle release
// (FOI FOIR13058) and DfT VEH0120 licensing stock. Until 2026-10-12 the page
// quoted What Car?'s summary of the same release ("54,830 vehicles"), which
// turned out to be roughly the CARS figure; DVLA recorded 90,861 vehicles of
// all kinds.
const YEAR = theftStats.year;
const n = (v: number) => v.toLocaleString("en-GB");
const yearly = theftStats.allVehiclesByYear as Record<string, number>;
const carsYearly = theftStats.cars.byYear as Record<string, number>;
const ALL = yearly[YEAR];
const ALL_CHANGE = Math.round(((ALL - yearly[YEAR - 1]) / yearly[YEAR - 1]) * 1000) / 10;
const CARS = carsYearly[YEAR];
const CARS_CHANGE = Math.round(((CARS - carsYearly[YEAR - 1]) / carsYearly[YEAR - 1]) * 1000) / 10;
const TOP = theftStats.cars.topByCount[0];
const RISKIEST = theftStats.cars.topByRate[0];
const NATIONAL = theftStats.cars.nationalPer1000;
const PEAK_YEAR = Object.entries(yearly).sort((a, b) => b[1] - a[1])[0][0];
const FUEL = theftStats.cars.byFuel;
const fuelRate = (f: string) => FUEL.find((r) => r.fuel === f)?.per1000 ?? 0;
const AGE = theftStats.cars.byAge;
const AGE_TOP = [...AGE].sort((a, b) => b.thefts - a.thefts)[0];
const AGE_RISKIEST = [...AGE].sort((a, b) => b.per1000 - a.per1000)[0];
const AGE_NEW = AGE[0];
const AGE_OLDEST = AGE[AGE.length - 1];
/** "4–7 years" → "4 to 7-year-old" */
const ageAdj = (band: string) => band.replace("–", " to ").replace(" years", "-year-old");

const DESCRIPTION = `${n(CARS)} cars were stolen in the UK in ${YEAR}, per DVLA records. The ${TOP.name} was stolen most (${n(TOP.thefts)}); the ${RISKIEST.name} is the most likely to be stolen, at ${RISKIEST.per1000} per 1,000. Rates for 300+ models.`;

export const metadata: Metadata = {
  title: `Most Stolen Cars in the UK: ${YEAR} DVLA Figures & How to Protect Yours`,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/car-theft",
  },
  openGraph: {
    title: `Most Stolen Cars in the UK: ${YEAR} DVLA Figures & How to Protect Yours`,
    description: DESCRIPTION,
    url: "https://www.freeplatecheck.co.uk/stats/car-theft",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
};

const faqItems = [
  {
    question: "What is the most stolen car in the UK?",
    answer: `By number, the ${TOP.name}: ${n(TOP.thefts)} were recorded stolen by the DVLA in ${YEAR}, more than any other model. That is mostly because there are so many of them (${n(TOP.licensed)} on the road), so its theft RATE is a more modest ${TOP.per1000} per 1,000. The car most likely to be stolen is the ${RISKIEST.name}, at ${RISKIEST.per1000} per 1,000, about ${Math.round(RISKIEST.per1000 / NATIONAL)} times the UK average of ${NATIONAL}.`,
  },
  {
    question: "How many cars are stolen in the UK each year?",
    answer: `${n(CARS)} cars were recorded stolen by the DVLA in ${YEAR}, ${CARS_CHANGE < 0 ? "down" : "up"} ${Math.abs(CARS_CHANGE)}% on ${YEAR - 1}, or about ${Math.round(CARS / 365)} a day. Counting vans, motorbikes and other vehicles, the total was ${n(ALL)}. Thefts peaked in ${PEAK_YEAR}.`,
  },
  {
    question: "How are the theft rates calculated?",
    answer: `Cars recorded stolen in ${YEAR} (DVLA, released under Freedom of Information as FOIR13058) divided by the number of the same model licensed at the end of ${YEAR} (DfT vehicle licensing statistics), per 1,000. Models with fewer than 10,000 licensed are not rated. A car stolen twice counts twice, and about 3% of DVLA's records name only a make, so can't be assigned to a model.`,
  },
  {
    question: "Are hybrid cars more likely to be stolen?",
    answer: `Yes. Hybrids were stolen at ${fuelRate("Hybrid")} per 1,000 in ${YEAR} and plug-in hybrids at ${fuelRate("Plug-in hybrid")}, roughly twice the rate of petrol cars (${fuelRate("Petrol")}). Fully electric cars were the least stolen at ${fuelRate("Electric")}. Toyota and Lexus hybrids (RAV4, C-HR, NX, RX) dominate the highest-rate list.`,
  },
  {
    question: "Are new cars stolen more than old ones?",
    answer: `Not the newest. Per car on the road, ${ageAdj(AGE_RISKIEST.band)} cars were the most likely to be stolen in ${YEAR} (${AGE_RISKIEST.per1000} per 1,000), against ${AGE_NEW.per1000} for ${ageAdj(AGE_NEW.band)} cars and ${AGE_OLDEST.per1000} for cars ${AGE_OLDEST.band.replace("+ years", " years or older")}. By number, ${ageAdj(AGE_TOP.band)} cars were stolen most (${n(AGE_TOP.thefts)}), mainly because so many cars on the road are that age.`,
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
            theftDatasetSchema(
              `Most stolen cars in the UK (${YEAR} DVLA data)`,
              DESCRIPTION,
              "https://www.freeplatecheck.co.uk/stats/car-theft",
              "Cars recorded stolen per 1,000 licensed, by make and model",
            ),
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
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCallout value={n(CARS)} label={`Cars stolen in ${YEAR}`} color="red" />
          <StatCallout value={TOP.name} label={`Most stolen model: ${n(TOP.thefts)} in ${YEAR}`} color="amber" />
          <StatCallout
            value={`${CARS_CHANGE > 0 ? "+" : "−"}${Math.abs(CARS_CHANGE)}%`}
            label={`Car thefts vs ${YEAR - 1}`}
            color="emerald"
          />
        </div>
        <p className="mb-10 text-xs text-slate-500">
          Source: DVLA stolen-vehicle records, released under Freedom of
          Information (FOIR13058), and DfT vehicle licensing statistics. All
          vehicle types: {n(ALL)} stolen in {YEAR} ({ALL_CHANGE > 0 ? "+" : "−"}
          {Math.abs(ALL_CHANGE)}%).
        </p>

        <h2 className="mb-4 text-xl font-bold text-slate-100">
          The 10 Most Stolen Cars in {YEAR}
        </h2>
        <TheftTable rows={theftStats.cars.topByCount} national={NATIONAL} />
        <p className="mb-10 text-xs text-slate-500">
          Per 1,000 = cars stolen in {YEAR} for every 1,000 licensed. UK average:{" "}
          {NATIONAL}. Raw counts favour common cars; the rate shows how likely a
          particular car is to be taken.
        </p>

        <div className="mb-10">
          <TheftModelSearch year={YEAR} />
        </div>

        <div className="space-y-6">
          <TheftRateChart
            rows={theftStats.cars.topByRate}
            national={NATIONAL}
            title="Highest Theft Rates"
            subtitle={`Cars stolen in ${YEAR} per 1,000 licensed (models with 20,000+ on the road). Dashed line: UK average, ${NATIONAL}`}
          />
          <TheftRateColumns
            rows={FUEL.map((r) => ({ ...r, name: r.fuel }))}
            national={NATIONAL}
            title="Theft Rate by Fuel Type"
            subtitle={`Cars stolen in ${YEAR} per 1,000 licensed. Hybrids are stolen at about twice the rate of petrol cars`}
          />
          <TheftRateColumns
            rows={AGE.map((a) => ({ ...a, name: a.band.replace(" years", "") }))}
            national={NATIONAL}
            title="Theft Rate by Car Age"
            subtitle={`Cars stolen in ${YEAR} per 1,000 licensed, by age in years. Cars ${AGE_RISKIEST.band} old are the most at risk`}
          />
          <TheftCountChart
            data={Object.entries(carsYearly).map(([label, value]) => ({ label, value }))}
            title="Cars Stolen per Year"
            subtitle={`Cars recorded stolen by the DVLA, ${Object.keys(carsYearly)[0]}–${YEAR}`}
            noun="Cars stolen"
          />
        </div>
        <DataAsOf files={["theft-stats.json", "theft-risk.json"]} className="mt-3" />

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            { href: "/stats/least-stolen-cars", title: "Least stolen cars", text: "The models thieves leave alone" },
            { href: "/stats/van-theft", title: "Most stolen vans", text: "Transits, pickups and the van theft rate" },
            { href: "/stats/motorbike-theft", title: "Most stolen motorbikes", text: "Why 125cc scooters top the list" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 transition-colors hover:border-emerald-700/50"
            >
              <div className="text-sm font-semibold text-slate-100">{l.title} →</div>
              <div className="mt-1 text-xs text-slate-400">{l.text}</div>
            </Link>
          ))}
        </div>

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
            numbers simply because there are so many of them. Per car on the
            road, Toyota and Lexus hybrids top the table: the {RISKIEST.name}{" "}
            is stolen at {Math.round(RISKIEST.per1000 / NATIONAL)} times the UK
            average. Car thefts recorded by the DVLA fell{" "}
            {Math.abs(CARS_CHANGE)}% in {YEAR}, but organised networks that ship stolen
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

        <CiteThisData
          title={`Most Stolen Cars in the UK: ${YEAR} DVLA Figures`}
          url="https://www.freeplatecheck.co.uk/stats/car-theft"
        />

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
