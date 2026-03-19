/**
 * Generates public/llms.txt at build time from blog frontmatter and site content.
 *
 * Run: npx tsx scripts/generate-llms-txt.ts
 * Hooked into: prebuild script in package.json
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ROOT, "content", "blog");
const OUTPUT = path.join(ROOT, "public", "llms.txt");
const BASE = "https://www.freeplatecheck.co.uk";

// --- Helpers ---

function isPublished(date: string): boolean {
  if (!date) return true;
  const today = new Date().toISOString().slice(0, 10);
  return date <= today;
}

interface BlogEntry {
  slug: string;
  title: string;
  description: string;
  date: string;
}

function getBlogPosts(): BlogEntry[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts: BlogEntry[] = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { data, content } = matter(raw);

    if (!isPublished(data.date)) continue;

    const description =
      data.description ||
      content
        .replace(/^#.*$/gm, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim()
        .split(/[.\n]/)[0]
        ?.trim() ||
      "";

    posts.push({
      slug,
      title: data.title || slug,
      description,
      date: data.date || "",
    });
  }

  // Sort by date descending
  posts.sort((a, b) => (a.date > b.date ? -1 : 1));
  return posts;
}

// --- Static content ---

const HEADER = `# Free Plate Check

> Free UK vehicle lookup tool. Check any UK vehicle's MOT history, tax status, mileage records, ULEZ compliance, safety recalls, and estimated valuation — completely free, no signup required. Uses official DVLA and DVSA data sources.`;

const CORE_TOOLS = `## Core Tools

- [Free Car Check](${BASE}/car-check): Run a free car check on any UK vehicle. See make, model, colour, engine size, fuel type, tax status and MOT history by entering a registration number.
- [Free MOT History Check](${BASE}/mot-check): Check any vehicle's full MOT history free. See pass/fail results, advisories, mileage records and next MOT due date.
- [Car Tax Check](${BASE}/tax-check): Check if any UK vehicle is taxed. See current tax status, expiry date and whether a SORN is in place. Free, instant, no signup required.
- [Mileage Check](${BASE}/mileage-check): Check a vehicle's recorded mileage history free. See odometer readings from every MOT test to spot clocking and verify genuine mileage.
- [ULEZ Compliance Check](${BASE}/ulez-check): Check if any UK vehicle is ULEZ compliant. See emission standards, Euro status and whether the vehicle meets London's Ultra Low Emission Zone requirements.
- [Safety Recall Check](${BASE}/recall-check): Check if any UK vehicle has outstanding safety recalls from the DVSA. Free lookup by registration number.
- [Free Car Valuation](${BASE}/car-valuation): Get a free estimated valuation for any UK vehicle based on age, mileage and market data. No signup required.
- [Running Costs Calculator](${BASE}/running-costs): Find out how much it costs to run any UK car. Free breakdown of fuel, tax, depreciation, MOT and servicing costs.
- [Car Servicing Quotes](${BASE}/servicing): Compare car service prices from local garages. Interim and full service quotes in seconds, no booking fees.
- [MOT Reminder](${BASE}/mot-reminder): Set up a free MOT reminder for any UK vehicle. Get notified 28 days and 7 days before your MOT expires.
- [Vehicle Comparison](${BASE}/compare): Compare two UK vehicles side by side — MOT history, tax status, mileage, specifications and valuations.
- [Clean Air Zones](${BASE}/clean-air-zones): Complete guide to UK Clean Air Zones. See which cities charge, daily rates, affected vehicles and compliance by registration.
- [Car Guides](${BASE}/cars): Free buyer's guides for the UK's most popular cars. MOT pass rates, NCAP safety ratings, running costs and reliability data.
- [Embed Widget](${BASE}/embed): Add a free UK vehicle check widget to your website. Easy embed code for forums, dealers and bloggers.`;

// Stats pages — static array (changes rarely, ~14 pages)
const STATS = `## UK Motoring Statistics

- [Stats Hub](${BASE}/stats): Interactive charts and data covering every aspect of UK motoring — fuel prices, MOT pass rates, car theft, EV adoption and more.
- [Fuel Prices](${BASE}/stats/fuel-prices): UK petrol and diesel price history from 1988 to present with interactive charts and fill-cost calculator.
- [Cost of Motoring](${BASE}/stats/cost-of-motoring): Full annual breakdown of UK driving costs — fuel, insurance, depreciation, tax and servicing since 2010.
- [Road Tax (VED) History](${BASE}/stats/road-tax-history): How VED rates have changed since 2001, from CO2 bands to the 2025 EV charges.
- [Used Car Prices](${BASE}/stats/used-car-prices): Quarterly used car price index showing market trends, the COVID spike and correction.
- [Fuel Type Comparison](${BASE}/stats/fuel-type-comparison): Compare running costs for petrol, diesel, hybrid and electric vehicles at any annual mileage.
- [MOT Pass Rates](${BASE}/stats/mot-pass-rates): National first-time MOT pass rates by make and the most common failure categories.
- [Most Reliable Cars](${BASE}/stats/most-reliable-cars): Car reliability rankings based on millions of real MOT test results.
- [UK Mileage Trends](${BASE}/stats/uk-mileage): Average annual mileage trends over the decades and how mileage varies by vehicle age.
- [Most Popular Cars](${BASE}/stats/popular-cars): Top makes and models on UK roads by fleet size and how best-sellers have changed.
- [EV Adoption](${BASE}/stats/ev-adoption): Electric vehicle fleet growth, new sales share and regional EV density across the UK.
- [Car Registrations](${BASE}/stats/car-registrations): Annual new car sales since 1990 with fuel type split showing the shift to electric.
- [Car Theft Statistics](${BASE}/stats/car-theft): Most stolen cars ranked by theft rate and national vehicle theft trends.
- [Road Safety](${BASE}/stats/road-safety): UK road fatalities since 1970, casualties by road user type and key safety milestones.`;

const FOOTER = `## About

Free Plate Check is an independent UK vehicle information service. All vehicle data is sourced from official DVLA and DVSA government databases. The service is completely free to use with no account registration required. The site does not store registration numbers and is designed with user privacy in mind.

Website: ${BASE}`;

// --- Generate ---

function generate(): void {
  const posts = getBlogPosts();

  const blogLines = posts.map(
    (p) => `- [${p.title}](${BASE}/blog/${p.slug}): ${p.description}`
  );

  const blogSection = `## Guides & Articles\n\n${blogLines.join("\n")}`;

  const output = [HEADER, CORE_TOOLS, STATS, blogSection, FOOTER].join(
    "\n\n"
  );

  fs.writeFileSync(OUTPUT, output + "\n", "utf8");
  console.log(
    `llms.txt generated: ${posts.length} blog posts, written to public/llms.txt`
  );
}

generate();
