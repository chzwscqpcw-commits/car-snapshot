// eBay comparables for the valuation route: one Browse API search per
// valuation, then title, salvage, price-floor, year and fuel filtering in code.
// Kept out of the route so the matching can be tested without a network.

import { getDepreciationMultiplier, isSalvageListing } from "@/lib/valuation";
import { modelFamily } from "@/lib/model-family";

// ── Make aliases — eBay sellers abbreviate; match what they actually type.

const MAKE_ALIASES: Record<string, string[]> = {
  VOLKSWAGEN: ["VOLKSWAGEN", "VW"],
  VW: ["VW", "VOLKSWAGEN"],
  "MERCEDES-BENZ": ["MERCEDES-BENZ", "MERCEDES", "MERC", "BENZ"],
  MERCEDES: ["MERCEDES", "MERCEDES-BENZ", "MERC", "BENZ"],
  "LAND ROVER": ["LAND ROVER", "LANDROVER", "LAND-ROVER", "LR", "RANGE ROVER"],
  LANDROVER: ["LANDROVER", "LAND ROVER", "LAND-ROVER"],
  "ALFA ROMEO": ["ALFA ROMEO", "ALFA-ROMEO", "ALFA"],
  ALFA: ["ALFA", "ALFA ROMEO"],
  BMW: ["BMW"],
  MINI: ["MINI"],
  "ROLLS-ROYCE": ["ROLLS-ROYCE", "ROLLS ROYCE", "ROLLS"],
  "ASTON MARTIN": ["ASTON MARTIN", "ASTON-MARTIN", "ASTON"],
};

function expandMakeTokens(makeUpper: string): string[] {
  if (MAKE_ALIASES[makeUpper]) return MAKE_ALIASES[makeUpper];
  const tokens = [makeUpper];
  const firstWord = makeUpper.split(/[\s-]+/)[0];
  if (firstWord && firstWord !== makeUpper && firstWord.length >= 3) {
    tokens.push(firstWord);
  }
  return tokens;
}

// ── Fuel type matching ─────────────────────────────────────────────────────
// Used both for aspect filter (legacy) and title-based detection.

const FUEL_TYPE_MAP: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  "HYBRID ELECTRIC": "Hybrid",
  "PETROL/ELECTRIC": "Hybrid",
  "DIESEL/ELECTRIC": "Hybrid",
  GAS: "Petrol",
  "GAS BI-FUEL": "Petrol",
};

// Title-keyword sets per fuel family. We use these to detect a listing's
// fuel from its title when the seller doesn't fill in the eBay aspect.
const FUEL_TITLE_TOKENS: Record<string, RegExp> = {
  Petrol: /\b(PETROL|GASOLINE|TSI|MPI|GTI|FSI|TFSI|VTEC)\b/i,
  Diesel: /\b(DIESEL|TDI|HDI|CDTI|CDI|DCI|D4D|MULTIJET|BLUEMOTION|BLUETEC|TDCI|D-?4D)\b/i,
  Hybrid: /\b(HYBRID|HEV|PHEV|PLUG[- ]?IN|SELF[- ]?CHARGING|E-?TRON|E-?POWER)\b/i,
  Electric: /\b(ELECTRIC|EV|BEV|FULL[- ]?ELECTRIC|ALL[- ]?ELECTRIC)\b/i,
};

// ── Year-based price floor — keeps £1 starter-bid auctions out of the median.
// Auction listings include very low opening bids that would skew the data.
// Floors are conservative: a 2020+ car can't realistically be worth <£3000.

function priceFloorForYear(year: number): number {
  if (year >= 2020) return 3000;
  if (year >= 2015) return 2000;
  if (year >= 2010) return 1000;
  return 500;
}

// ── Asking price discount ──────────────────────────────────────────────────

// eBay UK is a mixed private/trade marketplace, not a dealer forecourt.
// Asking → sold delta is smaller than the dealer-haggle assumption (was 0.92).
// Auctions in the dataset already drag the bottom down naturally; further
// discounting double-counts.
const ASKING_PRICE_DISCOUNT = 0.96;

// ── Quartile computation (QUARTILE.INC / linear interpolation) ─────────────

function computeQuartiles(sorted: number[]): { q1: number; q3: number } | null {
  if (sorted.length < 5) return null;

  const n = sorted.length;
  const q1Pos = 0.25 * (n - 1);
  const q3Pos = 0.75 * (n - 1);

  const q1Floor = Math.floor(q1Pos);
  const q1Frac = q1Pos - q1Floor;
  const q1 = sorted[q1Floor] + q1Frac * (sorted[q1Floor + 1] - sorted[q1Floor]);

  const q3Floor = Math.floor(q3Pos);
  const q3Frac = q3Pos - q3Floor;
  const q3 = sorted[q3Floor] + q3Frac * (sorted[q3Floor + 1] - sorted[q3Floor]);

  return { q1, q3 };
}

// ── eBay listing fetch ──────────────────────────────────────────────────────
// One broad query, max page size (200). We do year + fuel filtering in code
// because eBay's aspect filters depend on sellers having set the aspect,
// which they often haven't.

type AspectDistribution = {
  localizedAspectName: string;
  aspectValueDistributions: Array<{
    localizedAspectValue: string;
    matchCount: number;
  }>;
};

export type RawItem = {
  title: string;
  price: number;
  titleYear: number | null;
  titleFuel: string | null;
};

export type EbayBundle = {
  items: RawItem[];
  totalReported: number;
  dominantTransmission: string | null;
  dominantBodyType: string | null;
  query: string;
  rawCount: number;
};

export async function fetchEbayItems(
  token: string,
  make: string,
  model: string,
): Promise<EbayBundle | null> {
  // No aspect filters, no buying-option restriction. We rely on title
  // matching + client-side filtering, which is far more reliable than
  // depending on sellers to fill in eBay's structured aspects.
  const params = new URLSearchParams({
    q: `${make} ${model}`,
    category_ids: "9801",
    fieldgroups: "MATCHING_ITEMS,ASPECT_REFINEMENTS,EXTENDED",
    filter: [
      "conditionIds:{3000}", // used cars only
      "price:[500..],priceCurrency:GBP",
      "itemLocationCountry:GB",
    ].join(","),
    limit: "200",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
          "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=GB",
        },
        signal: controller.signal,
      },
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    console.error(`[VALUATION] eBay search failed: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    total?: number;
    itemSummaries?: Array<{
      title?: string;
      price?: { value: string; currency: string };
    }>;
    refinement?: {
      aspectDistributions?: AspectDistribution[];
    };
  };

  const rawCount = data.itemSummaries?.length ?? 0;
  if (!data.itemSummaries || rawCount === 0) {
    return { items: [], totalReported: data.total ?? 0, dominantTransmission: null, dominantBodyType: null, query: params.toString(), rawCount: 0 };
  }

  const items: RawItem[] = [];
  for (const item of data.itemSummaries) {
    const price = parseFloat(item.price?.value || "0");
    if (price <= 0) continue;
    const title = (item.title || "").toUpperCase();
    // Extract a 4-digit year from the title — match years 1990 through next year.
    const nextYear = new Date().getFullYear() + 1;
    const yearMatches = title.match(/\b(19[89]\d|20\d\d)\b/g);
    let titleYear: number | null = null;
    if (yearMatches) {
      // If multiple years appear, prefer the SMALLEST plausible one.
      // Model years are almost always older than other dates in titles —
      // e.g. "2018 Ford Focus MOT 2025" has both years but the car is
      // a 2018. Taking the max would mistake the MOT date for the model.
      const candidates = yearMatches
        .map((y) => parseInt(y, 10))
        .filter((y) => y >= 1990 && y <= nextYear);
      if (candidates.length > 0) titleYear = Math.min(...candidates);
    }
    let titleFuel: string | null = null;
    for (const [family, re] of Object.entries(FUEL_TITLE_TOKENS)) {
      if (re.test(title)) {
        titleFuel = family;
        break;
      }
    }
    items.push({ title, price, titleYear, titleFuel });
  }

  // Dominant aspects from refinement section (across all 200 results)
  let dominantTransmission: string | null = null;
  let dominantBodyType: string | null = null;
  if (data.refinement?.aspectDistributions) {
    for (const aspect of data.refinement.aspectDistributions) {
      if (aspect.localizedAspectName === "Transmission" && aspect.aspectValueDistributions.length > 0) {
        const top = [...aspect.aspectValueDistributions].sort((a, b) => b.matchCount - a.matchCount)[0];
        dominantTransmission = top.localizedAspectValue;
      }
      if (aspect.localizedAspectName === "Body Type" && aspect.aspectValueDistributions.length > 0) {
        const top = [...aspect.aspectValueDistributions].sort((a, b) => b.matchCount - a.matchCount)[0];
        dominantBodyType = top.localizedAspectValue;
      }
    }
  }

  return {
    items,
    totalReported: data.total ?? rawCount,
    dominantTransmission,
    dominantBodyType,
    query: params.toString(),
    rawCount,
  };
}

// ── Comparables computation ─────────────────────────────────────────────────
// Given the raw eBay items, find the tightest year band with enough matches
// and compute median + IQR.

export type EbayResult = {
  median: number;
  q1Price: number | null;
  q3Price: number | null;
  listingCount: number;
  minPrice: number;
  maxPrice: number;
  totalListings: number;
  dominantTransmission: string | null;
  dominantBodyType: string | null;
  yearWidened: boolean;
  yearTolerance: number;
  rejectedByTitle: number;
  rejectedBySalvage: number;
  rejectedByPriceFloor: number;
  rejectedByIqr: number;
  /** The model words every selected title contained. */
  matchedOn: string;
  selectedSample: Array<{ title: string; price: number; year: number | null }>;
};

/** Split a model name the way titles are matched: on whitespace, slash and
 *  hyphen. Single characters are kept — for "3 SERIES" or "C-MAX" the leading
 *  digit/letter is part of the identity. Dropping them (`length >= 2`) once
 *  lumped BMW 1/5/7 SERIES listings in with 3 SERIES queries. */
function modelTokens(model: string): string[] {
  return model.toUpperCase().split(/[\s/-]+/).filter(Boolean);
}

/**
 * The model name to SEARCH eBay with: the model family ("ZS", "RANGE ROVER
 * VELAR", "2 SERIES"), not DVLA's full model string.
 *
 * DVLA appends trim, engine and gearbox to the model — "ZS TROPHY HEV AUTO",
 * "R-ROVER VELAR DYN SE D MHEV A". eBay's search requires every word, and the
 * title filter below required every word again, so in the 120 days to
 * 21 Oct 2026 a four-word model found comparables for 1.7% of valuations
 * against 68% for a one-word model. That was 29% of all valuations — mostly
 * newer cars, worth the most — valued on the depreciation curve alone.
 */
export function ebaySearchModel(make: string, model: string): string {
  const fam = modelFamily(make, model);
  return fam ? fam.slice(fam.indexOf("|") + 1) : model;
}

/**
 * Title-token sets to try, most specific first: DVLA's full model, then
 * shorter prefixes of it (trim words come last, so they go first), then the
 * family name. Prefixes stop at the family's length, so "R-ROVER VELAR …"
 * never relaxes to "R ROVER" — which, matched as substrings, is every Range
 * Rover — and "MODEL 3 …" never to "MODEL".
 */
export function titleTokenLadder(make: string, model: string): string[][] {
  const full = modelTokens(model);
  const family = modelTokens(ebaySearchModel(make, model));
  const ladder: string[][] = [];
  const add = (t: string[]) => {
    if (t.length && !ladder.some((l) => l.join(" ") === t.join(" "))) ladder.push(t);
  };
  for (let n = full.length; n >= Math.max(1, family.length); n--) add(full.slice(0, n));
  add(family);
  return ladder;
}

/** Enough comparables to stop relaxing the title match. */
const MIN_COMPARABLES = 3;

/** Does the title contain `token` as a whole word? Substring matching let
 *  "MODEL 3" match "TESLA MODEL S 232KW" (the 3 in 232). Only spaces,
 *  hyphens, slashes, brackets and commas separate words — so "C" still
 *  matches "C-MAX", but "5" doesn't match the "1.5" of an engine size. */
function hasWord(title: string, token: string): boolean {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[\\s/(),-])${esc}(?:$|[\\s/(),-])`).test(title);
}

/**
 * How many years either side a comparable may be. Widening to ±5 is harmless
 * for a 15-year-old car — the curve loses 2–9% a year there — but young cars
 * are scarce on eBay (67 used Astras in all of eBay UK in Oct 2026, none from
 * 2020–23), so a 2022 car widened to ±5 was being priced off 2017 ones. Allow
 * a year gap only while the curve says it moves value by at most 25%.
 */
export function maxYearTolerance(year: number, now = new Date().getFullYear()): number {
  const age = Math.max(1, now - year);
  const here = getDepreciationMultiplier(age);
  let tol = 0;
  for (const t of [1, 2, 3, 5]) {
    const older = getDepreciationMultiplier(age + t) / here;
    const newer = getDepreciationMultiplier(Math.max(0, age - t)) / here;
    if (older < 0.75 || newer > 1 / 0.75) break;
    tol = t;
  }
  return tol;
}

export function buildComparables(
  bundle: EbayBundle,
  make: string,
  model: string,
  year: number,
  fuelType: string | null,
): EbayResult | null {
  if (bundle.items.length === 0) return null;

  const makeTokens = expandMakeTokens(make.toUpperCase().trim());
  const floor = priceFloorForYear(year);
  const mappedFuel = fuelType ? FUEL_TYPE_MAP[fuelType.toUpperCase()] || null : null;
  const fuelOk = (i: RawItem) =>
    !mappedFuel || !i.titleFuel || i.titleFuel === mappedFuel;
  const maxTol = maxYearTolerance(year);

  function select(tokens: string[]) {
    // Step 1: title must contain a make-token AND every model-token.
    let rejectedByTitle = 0;
    const titleMatched = bundle.items.filter((i) => {
      const makeOk = makeTokens.some((t) => i.title.includes(t));
      const modelOk = tokens.every((t) => hasWord(i.title, t));
      if (!makeOk || !modelOk) {
        rejectedByTitle++;
        return false;
      }
      return true;
    });

    // Step 2a: drop salvage, write-offs and parts listings on the TITLE. These
    // are the listings the old price floor was trying to catch, and catching
    // them by name means we no longer have to censor cheap-but-sound cars.
    let rejectedBySalvage = 0;
    const notSalvage = titleMatched.filter((i) => {
      if (isSalvageListing(i.title)) {
        rejectedBySalvage++;
        return false;
      }
      return true;
    });

    // Step 2b: a conservative year-based price floor, to keep £1 starter bids
    // out of the median. NOT scaled by our own depreciation estimate any more —
    // see SALVAGE_TITLE_RE in valuation.ts for why that was self-reinforcing.
    let rejectedByPriceFloor = 0;
    const aboveFloor = notSalvage.filter((i) => {
      if (i.price < floor) {
        rejectedByPriceFloor++;
        return false;
      }
      return true;
    });

    // Step 3: ONLY accept listings where we can confirm the year. eBay sellers
    // who omit the year in the title disproportionately list old/salvage cars
    // (BMW E36, E91, F30 chassis codes etc.), so accepting "year unknown" as a
    // match pollutes the median with cars from the wrong decade. We widen the
    // tolerance progressively but always require a parsed year.
    let yearTolerance = 0;
    let selected: RawItem[] = [];
    for (const tol of [0, 1, 2, 3, 5].filter((t) => t <= maxTol)) {
      yearTolerance = tol;
      selected = aboveFloor.filter(
        (i) => i.titleYear !== null && Math.abs(i.titleYear - year) <= tol && fuelOk(i),
      );
      if (selected.length >= 5) break;
    }

    // Final fallback: if still <3 year-confirmed items even at ±5, drop the
    // fuel-type requirement to widen the pool a bit.
    if (selected.length < 3) {
      selected = aboveFloor.filter(
        (i) => i.titleYear !== null && Math.abs(i.titleYear - year) <= yearTolerance,
      );
    }

    return { tokens, selected, yearTolerance, rejectedByTitle, rejectedBySalvage, rejectedByPriceFloor };
  }

  // Most specific title match that still finds enough cars; failing that, the
  // broadest (the family name), which finds the most.
  const ladder = titleTokenLadder(make, model);
  let pick = select(ladder[0]);
  for (const tokens of ladder.slice(1)) {
    if (pick.selected.length >= MIN_COMPARABLES) break;
    const next = select(tokens);
    if (next.selected.length > pick.selected.length) pick = next;
  }
  const { selected, yearTolerance, rejectedByTitle, rejectedBySalvage, rejectedByPriceFloor } = pick;

  if (selected.length < 2) return null;

  // Step 4: IQR-based outlier trim (1.5× IQR rule).
  let prices = selected.map((i) => i.price).sort((a, b) => a - b);
  let rejectedByIqr = 0;
  if (prices.length >= 5) {
    const q = computeQuartiles(prices)!;
    const iqr = q.q3 - q.q1;
    const lo = q.q1 - 1.5 * iqr;
    const hi = q.q3 + 1.5 * iqr;
    const trimmed = prices.filter((p) => p >= lo && p <= hi);
    rejectedByIqr = prices.length - trimmed.length;
    if (trimmed.length >= 3) prices = trimmed;
  }

  const n = prices.length;
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];
  const quartiles = computeQuartiles(prices);

  return {
    median: Math.round(median * ASKING_PRICE_DISCOUNT),
    q1Price: quartiles ? Math.round(quartiles.q1 * ASKING_PRICE_DISCOUNT) : null,
    q3Price: quartiles ? Math.round(quartiles.q3 * ASKING_PRICE_DISCOUNT) : null,
    listingCount: n,
    minPrice: Math.round(prices[0]),
    maxPrice: Math.round(prices[n - 1]),
    totalListings: bundle.totalReported,
    dominantTransmission: bundle.dominantTransmission,
    dominantBodyType: bundle.dominantBodyType,
    yearWidened: yearTolerance > 0,
    yearTolerance,
    matchedOn: pick.tokens.join(" "),
    rejectedByTitle,
    rejectedBySalvage,
    rejectedByPriceFloor,
    rejectedByIqr,
    selectedSample: selected.slice(0, 15).map((i) => ({
      title: i.title.slice(0, 80),
      price: i.price,
      year: i.titleYear,
    })),
  };
}
