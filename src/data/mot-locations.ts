/**
 * Data for the programmatic /mot-prices/[town] pages.
 *
 * Differentiation strategy (important — these must NOT be thin doorway pages):
 * since 31 Oct 2026 each town page is built on the DVSA's own MOT results for
 * the town's postcode area (tests a year, first-time pass rate against the
 * UK, what fails most there, how old and how far-driven the cars are, the
 * busiest month — src/lib/mot-areas.ts), on top of the region-level price
 * variation (London/South East run near the £54.85 cap; the North, Wales and
 * Scotland sit well below), town-specific framing (county, population tier)
 * and per-region internal links. The town set is deliberately LIMITED
 * to high-value GB towns/cities and rolled out in stages — not mass-generated.
 *
 * Northern Ireland is intentionally excluded: NI MOTs are carried out at
 * government DVA test centres at a fixed fee, not by competing garages, so the
 * "compare local prices / book via BookMyGarage" model does not apply there.
 *
 * Price bands are typical garage prices (the MOT test fee is legally capped at
 * £54.85 for a Class 4 car nationwide). They are guidance ranges, not quotes.
 */

export type MotRegion = {
  key: string;
  name: string;
  /** Typical local garage MOT price band, £. */
  priceLow: number;
  priceHigh: number;
  /** One-sentence regional pricing context, woven into each town page. */
  note: string;
};

export type MotTown = {
  slug: string;
  name: string;
  /** Key into MOT_REGIONS. */
  region: string;
  county: string;
  /** Approximate urban population — framed as "around" on the page. */
  population: number;
  /**
   * The postcode area(s) whose DVSA MOT results stand for this town
   * (src/lib/mot-areas.ts). A town is usually one area (Birmingham = B);
   * London spans the inner areas. Any area missing from the data is ignored.
   */
  postcodeAreas: string[];
};

export const MOT_REGIONS: Record<string, MotRegion> = {
  london: {
    key: "london",
    name: "London",
    priceLow: 42,
    priceHigh: 54.85,
    note: "London garages carry the highest overheads in the UK, so MOT prices sit near the top of the range — which makes comparing especially worthwhile here.",
  },
  "south-east": {
    key: "south-east",
    name: "South East England",
    priceLow: 40,
    priceHigh: 52,
    note: "The South East sits at the higher end of UK MOT pricing, though competition in the larger towns keeps keen prices available if you shop around.",
  },
  "east-of-england": {
    key: "east-of-england",
    name: "the East of England",
    priceLow: 35,
    priceHigh: 50,
    note: "MOT prices across the East of England sit around the national average, with a healthy spread between chains and independents.",
  },
  "south-west": {
    key: "south-west",
    name: "South West England",
    priceLow: 34,
    priceHigh: 49,
    note: "South West MOT prices are broadly mid-range, and rural garages often undercut town-centre chains.",
  },
  "west-midlands": {
    key: "west-midlands",
    name: "the West Midlands",
    priceLow: 30,
    priceHigh: 46,
    note: "The West Midlands has a dense network of garages, so competition keeps MOT prices keen — frequently below the national average.",
  },
  "east-midlands": {
    key: "east-midlands",
    name: "the East Midlands",
    priceLow: 30,
    priceHigh: 46,
    note: "East Midlands MOT prices sit a little below the national average, helped by plenty of independent garages.",
  },
  "yorkshire-humber": {
    key: "yorkshire-humber",
    name: "Yorkshire and the Humber",
    priceLow: 28,
    priceHigh: 45,
    note: "Yorkshire and the Humber is among the cheaper regions for an MOT, with independents frequently testing well below the cap.",
  },
  "north-west": {
    key: "north-west",
    name: "North West England",
    priceLow: 29,
    priceHigh: 45,
    note: "The North West has lots of garage competition, keeping MOT prices among the lower in England.",
  },
  "north-east": {
    key: "north-east",
    name: "North East England",
    priceLow: 27,
    priceHigh: 43,
    note: "The North East is typically the cheapest region in England for an MOT.",
  },
  wales: {
    key: "wales",
    name: "Wales",
    priceLow: 29,
    priceHigh: 45,
    note: "Welsh MOT prices are generally below the UK average, particularly outside Cardiff.",
  },
  scotland: {
    key: "scotland",
    name: "Scotland",
    priceLow: 29,
    priceHigh: 46,
    note: "Scottish MOT prices are broadly below the UK average, though remote areas can have fewer garages to choose from.",
  },
};

export const MOT_TOWNS: MotTown[] = [
  { slug: "london", name: "London", region: "london", county: "Greater London", population: 8900000, postcodeAreas: ["E", "EC", "N", "NW", "SE", "SW", "W", "WC"] },
  { slug: "birmingham", name: "Birmingham", region: "west-midlands", county: "West Midlands", population: 1140000, postcodeAreas: ["B"] },
  { slug: "manchester", name: "Manchester", region: "north-west", county: "Greater Manchester", population: 550000, postcodeAreas: ["M"] },
  { slug: "liverpool", name: "Liverpool", region: "north-west", county: "Merseyside", population: 500000, postcodeAreas: ["L"] },
  { slug: "leeds", name: "Leeds", region: "yorkshire-humber", county: "West Yorkshire", population: 790000, postcodeAreas: ["LS"] },
  { slug: "sheffield", name: "Sheffield", region: "yorkshire-humber", county: "South Yorkshire", population: 580000, postcodeAreas: ["S"] },
  { slug: "bradford", name: "Bradford", region: "yorkshire-humber", county: "West Yorkshire", population: 540000, postcodeAreas: ["BD"] },
  { slug: "bristol", name: "Bristol", region: "south-west", county: "Bristol", population: 470000, postcodeAreas: ["BS"] },
  { slug: "coventry", name: "Coventry", region: "west-midlands", county: "West Midlands", population: 370000, postcodeAreas: ["CV"] },
  { slug: "leicester", name: "Leicester", region: "east-midlands", county: "Leicestershire", population: 370000, postcodeAreas: ["LE"] },
  { slug: "nottingham", name: "Nottingham", region: "east-midlands", county: "Nottinghamshire", population: 330000, postcodeAreas: ["NG"] },
  { slug: "newcastle", name: "Newcastle upon Tyne", region: "north-east", county: "Tyne and Wear", population: 300000, postcodeAreas: ["NE"] },
  { slug: "sunderland", name: "Sunderland", region: "north-east", county: "Tyne and Wear", population: 275000, postcodeAreas: ["SR"] },
  { slug: "brighton", name: "Brighton", region: "south-east", county: "East Sussex", population: 290000, postcodeAreas: ["BN"] },
  { slug: "hull", name: "Hull", region: "yorkshire-humber", county: "East Riding of Yorkshire", population: 260000, postcodeAreas: ["HU"] },
  { slug: "plymouth", name: "Plymouth", region: "south-west", county: "Devon", population: 260000, postcodeAreas: ["PL"] },
  { slug: "stoke-on-trent", name: "Stoke-on-Trent", region: "west-midlands", county: "Staffordshire", population: 260000, postcodeAreas: ["ST"] },
  { slug: "wolverhampton", name: "Wolverhampton", region: "west-midlands", county: "West Midlands", population: 260000, postcodeAreas: ["WV"] },
  { slug: "derby", name: "Derby", region: "east-midlands", county: "Derbyshire", population: 260000, postcodeAreas: ["DE"] },
  { slug: "southampton", name: "Southampton", region: "south-east", county: "Hampshire", population: 250000, postcodeAreas: ["SO"] },
  { slug: "portsmouth", name: "Portsmouth", region: "south-east", county: "Hampshire", population: 240000, postcodeAreas: ["PO"] },
  { slug: "reading", name: "Reading", region: "south-east", county: "Berkshire", population: 230000, postcodeAreas: ["RG"] },
  { slug: "milton-keynes", name: "Milton Keynes", region: "south-east", county: "Buckinghamshire", population: 230000, postcodeAreas: ["MK"] },
  { slug: "northampton", name: "Northampton", region: "east-midlands", county: "Northamptonshire", population: 220000, postcodeAreas: ["NN"] },
  { slug: "peterborough", name: "Peterborough", region: "east-of-england", county: "Cambridgeshire", population: 215000, postcodeAreas: ["PE"] },
  { slug: "luton", name: "Luton", region: "east-of-england", county: "Bedfordshire", population: 215000, postcodeAreas: ["LU"] },
  { slug: "york", name: "York", region: "yorkshire-humber", county: "North Yorkshire", population: 210000, postcodeAreas: ["YO"] },
  { slug: "bolton", name: "Bolton", region: "north-west", county: "Greater Manchester", population: 200000, postcodeAreas: ["BL"] },
  { slug: "bournemouth", name: "Bournemouth", region: "south-west", county: "Dorset", population: 200000, postcodeAreas: ["BH"] },
  { slug: "norwich", name: "Norwich", region: "east-of-england", county: "Norfolk", population: 200000, postcodeAreas: ["NR"] },
  { slug: "aberdeen", name: "Aberdeen", region: "scotland", county: "Aberdeenshire", population: 200000, postcodeAreas: ["AB"] },
  { slug: "swindon", name: "Swindon", region: "south-west", county: "Wiltshire", population: 185000, postcodeAreas: ["SN"] },
  { slug: "middlesbrough", name: "Middlesbrough", region: "north-east", county: "North Yorkshire", population: 175000, postcodeAreas: ["TS"] },
  { slug: "slough", name: "Slough", region: "south-east", county: "Berkshire", population: 165000, postcodeAreas: ["SL"] },
  { slug: "oxford", name: "Oxford", region: "south-east", county: "Oxfordshire", population: 160000, postcodeAreas: ["OX"] },
  { slug: "newport", name: "Newport", region: "wales", county: "Gwent", population: 160000, postcodeAreas: ["NP"] },
  { slug: "preston", name: "Preston", region: "north-west", county: "Lancashire", population: 150000, postcodeAreas: ["PR"] },
  { slug: "dundee", name: "Dundee", region: "scotland", county: "Angus", population: 150000, postcodeAreas: ["DD"] },
  { slug: "ipswich", name: "Ipswich", region: "east-of-england", county: "Suffolk", population: 145000, postcodeAreas: ["IP"] },
  { slug: "cambridge", name: "Cambridge", region: "east-of-england", county: "Cambridgeshire", population: 145000, postcodeAreas: ["CB"] },
  { slug: "blackpool", name: "Blackpool", region: "north-west", county: "Lancashire", population: 140000, postcodeAreas: ["FY"] },
  { slug: "exeter", name: "Exeter", region: "south-west", county: "Devon", population: 130000, postcodeAreas: ["EX"] },
  { slug: "cardiff", name: "Cardiff", region: "wales", county: "South Glamorgan", population: 365000, postcodeAreas: ["CF"] },
  { slug: "swansea", name: "Swansea", region: "wales", county: "West Glamorgan", population: 245000, postcodeAreas: ["SA"] },
  { slug: "glasgow", name: "Glasgow", region: "scotland", county: "Lanarkshire", population: 635000, postcodeAreas: ["G"] },
  { slug: "edinburgh", name: "Edinburgh", region: "scotland", county: "Midlothian", population: 530000, postcodeAreas: ["EH"] },
];

export function getMotTown(slug: string): MotTown | undefined {
  return MOT_TOWNS.find((t) => t.slug === slug);
}

/** Other towns in the same region, for per-page internal links (varies per town). */
export function townsInRegion(regionKey: string, excludeSlug: string): MotTown[] {
  return MOT_TOWNS.filter((t) => t.region === regionKey && t.slug !== excludeSlug);
}

/** Population tier — drives "lots of competing garages" vs "fewer options" framing. */
export function populationTier(pop: number): "major-city" | "city" | "town" {
  if (pop >= 400000) return "major-city";
  if (pop >= 150000) return "city";
  return "town";
}

export function formatGBP(n: number): string {
  return Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
}
