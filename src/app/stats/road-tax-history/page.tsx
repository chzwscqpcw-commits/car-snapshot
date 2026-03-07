import type { Metadata } from "next";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import StatsCTA from "@/components/stats/StatsCTA";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";

import VedHistoryCharts from "@/components/stats/VedHistoryCharts";

export const metadata: Metadata = {
  title: "Road Tax (VED) History UK 2001-2025 | Band Rates Over Time",
  description:
    "Interactive charts showing how UK vehicle excise duty (road tax) rates have changed from 2001 to 2025. Includes VED band calculator, first-year rates and emission-based pricing history.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/stats/road-tax-history",
  },
  openGraph: {
    title: "Road Tax (VED) History UK 2001-2025 | Band Rates Over Time",
    description:
      "Interactive charts showing how UK vehicle excise duty rates have changed by emission band since 2001. Includes VED calculator and first-year rate trends.",
    url: "https://www.freeplatecheck.co.uk/stats/road-tax-history",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Road Tax (VED) History UK 2001-2025 | Band Rates Over Time",
    description:
      "Interactive charts showing how UK vehicle excise duty rates have changed by emission band since 2001.",
  },
};

const faqItems = [
  {
    question: "What is VED and how is it calculated?",
    answer:
      "Vehicle Excise Duty (VED), commonly known as road tax, is an annual tax you must pay to drive or keep a vehicle on public roads in the UK. For cars registered from April 2017 onwards, the first-year rate is based on CO2 emissions, after which a flat standard rate applies (currently £190 per year for petrol and diesel cars). Cars registered before April 2017 continue to pay rates based on their CO2 emission band, ranging from Band A (zero emissions) to Band M (over 255 g/km). Electric vehicles paid no VED until April 2025, when a £10 annual rate was introduced.",
  },
  {
    question: "How do I check if my car's road tax is up to date?",
    answer:
      "You can check your vehicle's tax status instantly using Free Plate Check — just enter your registration number on the homepage. The results will show whether your tax is current, when it expires, and whether the vehicle is taxed or SORN'd. You can also check via the official GOV.UK vehicle enquiry service, which draws from the same DVLA database.",
  },
  {
    question: "What happens if I don't pay road tax?",
    answer:
      "Driving an untaxed vehicle on public roads is a criminal offence. The DVLA can issue an automatic £80 late-licensing penalty, which may be reduced to £40 if paid within 28 days. If you continue without taxing, you could face a court fine of up to £1,000. The DVLA also uses automatic number plate recognition (ANPR) cameras to detect untaxed vehicles, and your car can be clamped, impounded or crushed.",
  },
  {
    question: "What is a SORN and when do I need one?",
    answer:
      "A Statutory Off Road Notification (SORN) tells the DVLA that your vehicle is being kept off public roads and you do not need to tax or insure it. You need a SORN if your vehicle will not be driven or parked on public roads — for example, if it's stored in a garage, on private land, or undergoing long-term repairs. A SORN lasts until you tax the vehicle again or sell it. Driving a SORN'd vehicle on public roads without taxing it first is an offence.",
  },
  {
    question: "Do electric vehicles pay road tax?",
    answer:
      "Until March 2025, fully electric vehicles (zero-emission cars) were completely exempt from VED. From 1 April 2025, the government introduced a £10 annual rate for zero-emission cars in Band A, bringing them into the VED system for the first time. EVs registered from April 2025 also pay the lowest first-year rate of £10. The £,40,000 list price premium supplement (an additional £410/year for five years) also applies to electric vehicles if their original list price exceeded that threshold.",
  },
];

export default function RoadTaxHistoryPage() {
  return (
    <>
      <StatsHeroSection
        title="Road Tax (VED) History UK 2001-2025"
        subtitle="Explore how UK vehicle excise duty rates have evolved over two decades. Compare emission bands, view first-year rates and use the calculator to find the VED cost for any registration year."
        breadcrumb="Road Tax History"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Stat callouts */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCallout
            value={"£10"}
            label="Band A (zero CO2) now"
            color="emerald"
          />
          <StatCallout
            value={"£640"}
            label="Band M (highest) now"
            color="red"
          />
          <StatCallout
            value={"£2,745"}
            label="First-year max rate"
            color="amber"
          />
        </div>

        {/* Charts */}
        <VedHistoryCharts />

        {/* Insight copy */}
        <div className="prose-invert mt-10 max-w-none space-y-4 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">
            How UK Road Tax Has Changed Over 25 Years
          </h2>
          <p>
            Vehicle Excise Duty has undergone several fundamental reforms since
            the early 2000s, transforming from a relatively simple flat-rate
            system into a complex, emissions-based structure designed to
            incentivise cleaner vehicles. Understanding these changes matters for
            anyone buying, selling or running a car in the UK, because the year
            of registration determines which rules apply to your vehicle for its
            entire life on the road.
          </p>
          <p>
            The modern CO2-based banding system was introduced in 2001 with the
            creation of Bands A through M, each covering a range of carbon
            dioxide emissions measured in grams per kilometre. Band A covered
            vehicles with zero emissions, while Band M captured the
            highest-polluting cars producing 226 g/km or more. In those early
            years the gap between bands was relatively narrow: Band M cost just
            {"£"}160 in 2001, barely more than a mid-range Band G vehicle.
            The system was designed as a gentle nudge rather than a punitive
            measure.
          </p>
          <p>
            That changed dramatically between 2007 and 2010, when successive
            budgets widened the gap between clean and dirty vehicles. Band M
            rates jumped from {"£"}300 in 2007 to {"£"}460 by 2010, a
            rise of over 50% in just three years. This period also saw the
            introduction of the first-year showroom tax, designed to give buyers
            a strong financial incentive to choose lower-emission models at the
            point of purchase. The first-year rate for the most polluting cars
            was set at {"£"}2,000 in 2017 and has since climbed to{" "}
            {"£"}2,745 by 2024.
          </p>
          <p>
            The most significant structural change came in April 2017, when the
            government introduced a flat standard rate for all cars registered
            from that date onwards. After the first year, petrol and diesel cars
            pay a uniform annual rate regardless of their CO2 emissions,
            currently set at {"£"}190. This means a small city car and a
            large SUV registered after April 2017 pay exactly the same annual
            VED once the first-year rate has been settled. Vehicles with a list
            price exceeding {"£"}40,000 also face a premium supplement of{" "}
            {"£"}410 per year for five years on top of the standard rate.
          </p>
          <p>
            Cars registered before April 2017 remain on the old banding system
            for life. This creates a two-tier landscape where an older low-emission
            car might pay nothing in VED, while a newer vehicle of similar
            efficiency pays the flat {"£"}190 standard rate. It also means
            the Band A-M rates shown in our chart above continue to be relevant
            for millions of pre-2017 vehicles still on UK roads.
          </p>
          <p>
            The most recent milestone arrived in April 2025, when electric
            vehicles were brought into the VED system for the first time. Until
            that point, zero-emission cars enjoyed a complete exemption from road
            tax. From April 2025, EVs pay a nominal {"£"}10 per year in
            Band A, and the {"£"}40,000 premium supplement now applies to
            electric cars as well. This change reflects the government{"'"}s
            recognition that as EVs grow to represent a larger share of the
            fleet, the tax base needs to be broadened to maintain road funding.
          </p>
          <p>
            For car buyers, VED is now one of several financial factors worth
            checking before committing to a purchase. The year of first
            registration, CO2 emissions figure, fuel type and original list
            price all influence the annual cost. Our free vehicle check tool
            shows your car{"'"}s current tax status, band and rate
            instantly, helping you understand exactly what you{"'"}ll pay
            and when it{"'"}s due.
          </p>
        </div>

        {/* FAQ */}
        <FaqAccordion items={faqItems} />

        {/* CTA */}
        <StatsCTA />

        {/* Related stats */}
        <StatsRelated exclude="road-tax-history" />
      </div>
    </>
  );
}
