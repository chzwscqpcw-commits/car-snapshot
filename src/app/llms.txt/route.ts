import { getAllPosts } from "@/lib/blog";

const SITE_URL = "https://www.freeplatecheck.co.uk";

/**
 * /llms.txt — curated site map for AI crawlers and AI search tools.
 * Spec: https://llmstxt.org
 *
 * The "Core Tools", "Repair Costs", "Stats" and "About" sections are
 * hand-curated below. The "Guides & Articles" section is generated from the
 * blog post index, so new posts appear automatically on the next build.
 */

const CORE_TOOLS: Array<[string, string, string]> = [
  ["Free Car Check", "/car-check", "Run a free car check on any UK vehicle. See make, model, colour, engine size, fuel type, tax status and MOT history by entering a registration number."],
  ["Free MOT History Check", "/mot-check", "Check any vehicle's full MOT history free. See pass/fail results, advisories, mileage records and next MOT due date."],
  ["Car Tax Check", "/tax-check", "Check if any UK vehicle is taxed. See current tax status, expiry date and whether a SORN is in place. Free, instant, no signup required."],
  ["Mileage Check", "/mileage-check", "Check a vehicle's recorded mileage history free. See odometer readings from every MOT test to spot clocking and verify genuine mileage."],
  ["ULEZ Compliance Check", "/ulez-check", "Check if any UK vehicle is ULEZ compliant. See emission standards, Euro status and whether the vehicle meets London's Ultra Low Emission Zone requirements."],
  ["Safety Recall Check", "/recall-check", "Check if any UK vehicle has outstanding safety recalls from the DVSA. Free lookup by registration number."],
  ["Free Car Valuation", "/car-valuation", "Get a free estimated valuation for any UK vehicle based on age, mileage and live market data. No signup required."],
  ["Running Costs Calculator", "/running-costs", "Find out how much it costs to run any UK car. Free breakdown of fuel, tax, depreciation, MOT and servicing costs."],
  ["Car Servicing Quotes", "/servicing", "Compare car service prices from local garages. Interim and full service quotes in seconds, no booking fees."],
  ["MOT Reminder", "/mot-reminder", "Set up a free MOT reminder for any UK vehicle. You choose when you're notified before your MOT expires (5 weeks and 1 week before by default)."],
  ["Vehicle Comparison", "/compare", "Compare two UK vehicles side by side — MOT history, tax status, mileage, specifications and valuations."],
  ["Clean Air Zones", "/clean-air-zones", "Complete guide to UK Clean Air Zones. See which cities charge, daily rates, affected vehicles and compliance by registration."],
  ["Car Guides", "/cars", "Free buyer's guides for the UK's most popular cars. MOT pass rates, NCAP safety ratings, running costs and reliability data."],
  ["Embed Widget", "/embed", "Add a free UK vehicle check widget to your website. Easy embed code for forums, dealers and bloggers."],
];

const REPAIR_COSTS: Array<[string, string, string]> = [
  ["Repair Cost Guides Hub", "/repair-costs", "Free UK price guides for the most common car repairs. Compare typical costs and get real quotes from local garages."],
  ["Aircon Regas Cost UK", "/repair-costs/aircon-regas", "Typical UK aircon regas cost £60–£200, with the price depending heavily on whether the car uses R134A or R1234YF refrigerant."],
  ["Cambelt Replacement Cost UK", "/repair-costs/cambelt-replacement", "Cambelt replacement costs £300–£950 in the UK. Includes when to change, why the water pump matters, and what affects the price."],
  ["DPF Cleaning Cost UK", "/repair-costs/dpf-cleaning", "DPF cleaning costs £150–£500 in the UK, with replacement costing £1,000–£3,500. Covers forced regen, chemical and ultrasonic cleaning options."],
  ["Brake Pads Replacement Cost UK", "/repair-costs/brake-pads-replacement", "Brake pad replacement typically costs £90–£350 per axle in the UK. Includes signs of wear and what to ask the garage."],
  ["Car Battery Replacement Cost UK", "/repair-costs/car-battery-replacement", "Car battery replacement typically costs £80–£250 in the UK depending on battery type — standard lead-acid, EFB or AGM for stop-start cars."],
  ["Clutch Replacement Cost UK", "/repair-costs/clutch-replacement", "Clutch replacement typically costs £400–£1,200 in the UK. Includes signs of wear and why the dual-mass flywheel often pushes the price up."],
];

const STATS: Array<[string, string, string]> = [
  ["Stats Hub", "/stats", "Interactive charts and data covering every aspect of UK motoring — fuel prices, MOT pass rates, car theft, EV adoption and more."],
  ["Fuel Prices", "/stats/fuel-prices", "UK petrol and diesel price history from 1988 to present with interactive charts and fill-cost calculator."],
  ["Cost of Motoring", "/stats/cost-of-motoring", "Full annual breakdown of UK driving costs — fuel, insurance, depreciation, tax and servicing since 2010."],
  ["Road Tax (VED) History", "/stats/road-tax-history", "How VED rates have changed since 2001, from CO2 bands through to the standard £195 rate and EV charges."],
  ["Used Car Prices", "/stats/used-car-prices", "Quarterly used car price index showing market trends, the COVID spike and correction."],
  ["Fuel Type Comparison", "/stats/fuel-type-comparison", "Compare running costs for petrol, diesel, hybrid and electric vehicles at any annual mileage."],
  ["MOT Pass Rates", "/stats/mot-pass-rates", "National first-time MOT pass rates by make and the most common failure categories."],
  ["Most Reliable Cars", "/stats/most-reliable-cars", "Car reliability rankings based on millions of real MOT test results."],
  ["UK Mileage Trends", "/stats/uk-mileage", "Average annual mileage trends over the decades and how mileage varies by vehicle age."],
  ["Most Popular Cars", "/stats/popular-cars", "Top makes and models on UK roads by fleet size and how best-sellers have changed."],
  ["EV Adoption", "/stats/ev-adoption", "Electric vehicle fleet growth, new sales share and regional EV density across the UK."],
  ["Car Registrations", "/stats/car-registrations", "Annual new car sales since 1990 with fuel type split showing the shift to electric."],
  ["Car Theft Statistics", "/stats/car-theft", "Most stolen cars ranked by theft rate and national vehicle theft trends."],
  ["Road Safety", "/stats/road-safety", "UK road fatalities since 1970, casualties by road user type and key safety milestones."],
];

function renderSection(rows: Array<[string, string, string]>): string {
  return rows
    .map(([title, path, blurb]) => `- [${title}](${SITE_URL}${path}): ${blurb}`)
    .join("\n");
}

export function GET() {
  const posts = getAllPosts();

  const guidesSection = posts
    .map(
      (post) =>
        `- [${post.title}](${SITE_URL}/blog/${post.slug}): ${post.description}`
    )
    .join("\n");

  const body = `# Free Plate Check

> Free UK vehicle lookup tool. Check any UK vehicle's MOT history, tax status, mileage records, ULEZ compliance, safety recalls, and estimated valuation — completely free, no signup required. Uses official DVLA and DVSA data sources.

## Core Tools

${renderSection(CORE_TOOLS)}

## Car Repair Cost Guides

${renderSection(REPAIR_COSTS)}

## UK Motoring Statistics

${renderSection(STATS)}

## Guides & Articles

${guidesSection}

## About

Free Plate Check is an independent UK vehicle information service. All vehicle data is sourced from official DVLA and DVSA government databases. The service is completely free to use with no account registration required. The site does not store registration numbers and is designed with user privacy in mind.

Website: ${SITE_URL}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
