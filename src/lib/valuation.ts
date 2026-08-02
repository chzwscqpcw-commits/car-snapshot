// Vehicle valuation estimator — depreciation model + market data combination

import priceIndexData from "@/data/new-car-price-index.json";

export type ValuationConfidence = "high" | "medium" | "low" | "estimate-only";

export type ValuationResult = {
  rangeLow: number;
  rangeHigh: number;
  estimatedValue: number;
  confidence: ValuationConfidence;
  sources: string[];
  mileageAdjustmentPercent: number;
  conditionAdjustmentPercent: number;
  motAutoAdjustmentPercent: number;
  colourAdjustmentPercent: number;
  ebayTotalListings: number | null;
  ebayMinPrice: number | null;
  ebayMaxPrice: number | null;
  ebayDominantTransmission: string | null;
  ebayDominantBodyType: string | null;
  ebayYearWidened: boolean;
  ebayQ1Price: number | null;
  ebayQ3Price: number | null;
  marketSupply: "good" | "moderate" | "limited" | null;
  disclaimer: string;
};

export type ConditionInputs = {
  serviceHistory: "full" | "partial" | "none";
  bodywork: "excellent" | "good" | "fair" | "poor";
  interior: "excellent" | "good" | "worn";
  owners: "1" | "2-3" | "4+";
  accidents: "none" | "minor" | "significant";
};

type NewPriceEntry = { make: string; model: string; newPrice: number };

function normalizeStr(s: string): string {
  return s.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

// ── Make average fallback prices ────────────────────────────────────────────

const MAKE_AVERAGES: Record<string, number> = {
  FORD: 24000,
  VOLKSWAGEN: 28000,
  BMW: 40000,
  "MERCEDES-BENZ": 42000,
  // DVLA returns the marque both with and without the hyphen; normalisation
  // collapses the hyphenated form to "MERCEDES BENZ", so the bare spelling
  // needs its own key or it lands on DEFAULT_NEW_PRICE.
  MERCEDES: 42000,
  ABARTH: 28000,
  AUDI: 38000,
  TOYOTA: 28000,
  VAUXHALL: 22000,
  NISSAN: 24000,
  HYUNDAI: 26000,
  KIA: 26000,
  PEUGEOT: 22000,
  RENAULT: 22000,
  CITROEN: 20000,
  HONDA: 26000,
  MAZDA: 26000,
  VOLVO: 38000,
  "LAND ROVER": 50000,
  JAGUAR: 40000,
  SKODA: 24000,
  SEAT: 22000,
  FIAT: 18000,
  MINI: 24000,
  SUZUKI: 18000,
  MG: 24000,
  TESLA: 44000,
  PORSCHE: 70000,
  LEXUS: 40000,
  SUBARU: 32000,
  MITSUBISHI: 26000,
  DACIA: 16000,
  CUPRA: 32000,
  SMART: 14000,
  DS: 30000,
  GENESIS: 45000,
  POLESTAR: 42000,
  BYD: 34000,
};

/** Parc-weighted median new price across the UK fleet. Was 25,000, which is
 *  roughly a current new-car average and far too high for the older, cheaper
 *  cars that actually reach this last-resort branch. */
const DEFAULT_NEW_PRICE = 18000;

/** MAKE_AVERAGES keyed by the SAME normalisation the lookup uses.
 *  normalizeStr strips hyphens, so a literal "MERCEDES-BENZ" key could never
 *  be hit by a "MERCEDES-BENZ" make (it normalises to "MERCEDES BENZ") and the
 *  marque silently fell through to DEFAULT_NEW_PRICE. Build the map instead of
 *  hand-maintaining both spellings. */
const MAKE_AVERAGES_NORM: Record<string, number> = Object.fromEntries(
  Object.entries(MAKE_AVERAGES).map(([k, v]) => [normalizeStr(k), v]),
);

// ── New price lookup ────────────────────────────────────────────────────────

const tokens = (s: string): string[] => (s ? s.split(" ").filter(Boolean) : []);

/**
 * Is this model name an electrified variant sold alongside a combustion car of
 * the same name? Matters because new-prices.json carries the EV at a much
 * higher price (CORSA E £28,555 vs a real 2008 petrol Corsa's ~£10,300), and
 * substring matching used to hand that price to every petrol Corsa.
 *
 * Deliberately narrow. A bare trailing "E" means electric (CORSA E), but a
 * LEADING "E" does not — "E CLASS" is a diesel saloon. Marque-specific
 * prefixes are gated on the marque so Hyundai's i10/i20/i30 aren't mistaken
 * for BMW's i3/i4.
 */
function isElectrifiedVariant(normMake: string, normModel: string): boolean {
  const t = tokens(normModel);
  if (t.length === 0) return false;
  const last = t[t.length - 1];
  if (last === "E" || last === "EV") return true;
  if (t.includes("ELECTRIC") || t.includes("EV")) return true;
  if (t.some((x) => /^ID\.?\d+$/.test(x))) return true;
  if (normModel.includes("E TRON")) return true;
  if (normMake === "BMW" && t.some((x) => /^I[3-8]$/.test(x))) return true;
  if (normMake.startsWith("MERCEDES") && t.some((x) => /^EQ[A-Z]{1,2}$/.test(x))) return true;
  return false;
}

/**
 * Does one model name extend the other from the FRONT? Replaces the old
 * `a.includes(b) || b.includes(a)` substring test, which matched on any
 * fragment anywhere and produced real mispricings in production:
 *   "A CLASS" contains the letters C-L-A  → priced as a CLA  (£40,855)
 *   "5"       is a substring of "CX 5"    → priced as a CX-5 (£31,550)
 * Token-prefix keeps the legitimate cases ("CORSA" ⊂ "CORSA E",
 * "3 SERIES" ⊂ "3 SERIES GRAN COUPE") and rejects both bugs above.
 */
function isTokenPrefix(a: string[], b: string[]): boolean {
  const n = Math.min(a.length, b.length);
  if (n === 0) return false;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function lookupNewPrice(
  data: NewPriceEntry[],
  make?: string,
  model?: string,
  /** DVLA fuel type where known. Only used to decide whether an electrified
   *  namesake is a legitimate match; omitting it falls back to preferring the
   *  combustion variant, which is the safer default. */
  fuelType?: string | null,
): number | null {
  if (!make) return null;

  const normMake = normalizeStr(make);
  const normModel = model ? normalizeStr(model) : "";

  if (data.length > 0 && normModel) {
    const wantsElectric =
      normalizeStr(fuelType ?? "").startsWith("ELECTRIC") ||
      isElectrifiedVariant(normMake, normModel);

    const sameMake = data.filter((e) => normalizeStr(e.make) === normMake);

    /** Cheapest of a candidate set, preferring combustion unless the vehicle
     *  really is electric. Cheapest is the right prior: these are base-trim
     *  list prices and the alternative — first-in-file — is arbitrary.
     *
     *  Returns null when the ONLY namesakes are electrified and this car
     *  isn't. That case is a genuine miss, not a near-miss: the table lists
     *  CORSA E (£28,555) and CORSA ELECTRIC (£27,505) but no petrol Corsa, and
     *  handing either to a 2008 1.2 petrol is how that car came to be valued
     *  at £2,100. Falling through to the make average is wrong too, but it is
     *  wrong by a lot less. */
    const pick = (candidates: NewPriceEntry[]): number | null => {
      if (candidates.length === 0) return null;
      const pool = wantsElectric
        ? candidates
        : candidates.filter((e) => !isElectrifiedVariant(normMake, normalizeStr(e.model)));
      if (pool.length === 0) return null;
      return Math.min(...pool.map((e) => e.newPrice));
    };

    const exact = pick(sameMake.filter((e) => normalizeStr(e.model) === normModel));
    if (exact !== null) return exact;

    const modelTokens = tokens(normModel);
    const fuzzy = pick(
      sameMake.filter((e) => isTokenPrefix(modelTokens, tokens(normalizeStr(e.model)))),
    );
    if (fuzzy !== null) return fuzzy;
  }

  // Fallback: make average
  if (MAKE_AVERAGES_NORM[normMake]) return MAKE_AVERAGES_NORM[normMake];

  // Last resort
  return DEFAULT_NEW_PRICE;
}

// ── Depreciation curve ──────────────────────────────────────────────────────

export function getDepreciationMultiplier(vehicleAge: number): number {
  if (vehicleAge <= 0) return 1;

  // Annual depreciation rates — each year reduces the value by this percentage
  const rates = [0.25, 0.15, 0.12, 0.10, 0.08, 0.07, 0.06];
  let value = 1;
  for (let y = 0; y < vehicleAge; y++) {
    const rate = y < rates.length ? rates[y] : 0.05;
    value *= (1 - rate);
  }
  // Floor at 5% of original — no car depreciates to zero
  return Math.max(value, 0.05);
}

// ── Make retention multiplier ───────────────────────────────────────────────

const RETENTION: Record<string, number> = {
  PORSCHE: 1.10, TOYOTA: 1.10, LEXUS: 1.10, TESLA: 1.10,
  VAUXHALL: 0.90, PEUGEOT: 0.90, CITROEN: 0.90,
  RENAULT: 0.90, FIAT: 0.90, SEAT: 0.90,
  DS: 0.80, SMART: 0.80, INFINITI: 0.80,
  CHRYSLER: 0.80, CHEVROLET: 0.80,
};

export function getMakeRetentionMultiplier(make?: string, model?: string): number {
  if (!make) return 1.0;
  const norm = normalizeStr(make);
  // Land Rover Defender has strong retention; other LR models don't
  if (norm === "LAND ROVER") {
    if (model && normalizeStr(model).includes("DEFENDER")) return 1.10;
    return 1.00;
  }
  return RETENTION[norm] ?? 1.0;
}

// ── Mileage adjustment ─────────────────────────────────────────────────────

/**
 * Relative driving intensity by fuel, from DfT NTS0901 (2024) mean annual
 * mileage divided by the 7,100 all-fuel mean: petrol 6,200, diesel 8,300,
 * hybrid 8,000, battery-electric 8,900. Diesel owners genuinely cover more
 * ground, so an identical odometer means something different on a diesel.
 * England-only and self-reported — a prior, not ground truth.
 */
const FUEL_MILEAGE_INTENSITY: Record<string, number> = {
  PETROL: 6200 / 7100,
  DIESEL: 8300 / 7100,
  HYBRID: 8000 / 7100,
  "HYBRID ELECTRIC": 8000 / 7100,
  ELECTRICITY: 8900 / 7100,
  ELECTRIC: 8900 / 7100,
};

/**
 * Miles a car covers during its Nth year of life.
 *
 * Cars do not accumulate mileage at a constant rate — a new car is commuted in
 * daily, a fifteen-year-old one is a second car doing local trips. Modelling
 * this as a flat rate breaks at both ends of the age range, and the direction
 * of the error flips:
 *
 *   - Flat 8,000/yr (the old constant) sits near the 63rd percentile of the
 *     current fleet — DfT NTS0901 puts the 2024 mean at 7,100 and the median
 *     near 6,500 — so most modern cars collected a bonus for being ordinary.
 *   - But a flat *registration-era* rate is worse the other way. At 11,000/yr
 *     an 18-year-old car is expected to have covered 173,000 miles, so a
 *     perfectly typical 95,000-mile 2008 Corsa scored the maximum low-mileage
 *     bonus — the same as a genuinely exceptional 40,000-mile example.
 *
 * A declining schedule fits observed UK cumulative mileage far better:
 * ~27k at 3 years, ~57k at 7, ~85k at 11, ~120k at 18. The implied lifetime
 * average falls from ~9,000/yr on a young car to ~6,600/yr on an old one,
 * bracketing the DfT figure rather than contradicting it.
 */
function milesInYear(nthYear: number): number {
  if (nthYear <= 3) return 9000;
  if (nthYear <= 10) return 7500;
  return 5000;
}

/**
 * Expected TOTAL miles for a car of this age — the yardstick the adjustment is
 * measured against, and the right default when we have no odometer reading.
 * Sums the declining per-year schedule, then scales by how hard this fuel type
 * is typically driven.
 *
 * Exported so UI defaults use the same figure as the maths: ValuationResult
 * previously seeded its mileage slider from a hardcoded 7,400/yr while the
 * model assumed 8,000, so the two disagreed about the same car.
 */
export function expectedTotalMiles(vehicleAge: number, fuelType?: string | null): number {
  const age = Math.max(0, Math.round(vehicleAge));
  let total = 0;
  for (let y = 1; y <= age; y++) total += milesInYear(y);
  const key = normalizeStr(fuelType ?? "");
  return Math.round(total * (FUEL_MILEAGE_INTENSITY[key] ?? 1));
}

/** Elasticity of value to mileage. −0.35 × ln(ratio) means each doubling of
 *  mileage relative to expectation costs ~24%. Calibrate against the
 *  `valuation_result` telemetry before changing. */
const MILEAGE_ELASTICITY = 0.35;
/** Asymmetric on purpose. Unusually low mileage is worth a modest premium and
 *  no more — buyers discount an implausible odometer — while very high mileage
 *  can halve a car. The old table capped BOTH sides at ±12%, so 1.4× and 4.5×
 *  expected mileage were penalised identically. */
const MILEAGE_ADJ_MAX = 12;
const MILEAGE_ADJ_MIN = -45;

/**
 * Percentage adjustment for mileage, as a continuous curve.
 *
 * Replaces a five-step band table whose boundaries created £1,200 cliffs on a
 * single extra mile, and which flattened everything above 1.4× expected into
 * one −12% bucket. Log-linear so the penalty keeps growing with the odometer.
 *
 * Roughly: +12% at 0.5× expected, +8% at 0.8×, 0% at 1.0×, −12% at 1.4×,
 * −24% at 2×, −45% at 3.6× and beyond.
 */
export function getMileageAdjustment(
  currentMileage: number | null,
  vehicleAge: number,
  fuelType?: string | null,
): number {
  if (!currentMileage || currentMileage <= 0 || vehicleAge <= 0) return 0;

  const expected = expectedTotalMiles(vehicleAge, fuelType);
  if (expected <= 0) return 0;

  const ratio = currentMileage / expected;
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;

  const adj = -100 * MILEAGE_ELASTICITY * Math.log(ratio);
  return Math.round(Math.min(MILEAGE_ADJ_MAX, Math.max(MILEAGE_ADJ_MIN, adj)) * 10) / 10;
}

// ── MOT auto-adjustment ─────────────────────────────────────────────────────

export function getMotAutoAdjustment(advisoryCount: number, recentFailure: boolean): number {
  let adj = 0;
  if (recentFailure) {
    adj -= 8;
  } else if (advisoryCount >= 5) {
    adj -= 5;
  } else if (advisoryCount <= 1) {
    adj += 3;
  }
  // 2-4 advisories: 0%
  return adj;
}

// ── Condition adjustment ────────────────────────────────────────────────────

export function getConditionAdjustment(
  condition: ConditionInputs | null,
  advisoryCount: number,
  recentFailure: boolean,
): { total: number; motAuto: number } {
  const motAuto = getMotAutoAdjustment(advisoryCount, recentFailure);

  if (!condition) return { total: motAuto, motAuto };

  let adj = motAuto;

  // Service history
  if (condition.serviceHistory === "full") adj += 8;
  else if (condition.serviceHistory === "none") adj -= 10;
  // "partial" = baseline (0)

  // Bodywork
  if (condition.bodywork === "excellent") adj += 5;
  else if (condition.bodywork === "fair") adj -= 8;
  else if (condition.bodywork === "poor") adj -= 15;
  // "good" = baseline (0)

  // Interior
  if (condition.interior === "excellent") adj += 3;
  else if (condition.interior === "worn") adj -= 5;
  // "good" = baseline (0)

  // Owners
  if (condition.owners === "1") adj += 3;
  else if (condition.owners === "4+") adj -= 5;
  // "2-3" = baseline (0)

  // Accidents
  if (condition.accidents === "minor") adj -= 10;
  else if (condition.accidents === "significant") adj -= 20;
  // "none" = baseline (0)

  return { total: adj, motAuto };
}

// ── Colour adjustment ───────────────────────────────────────────────────────

const COLOUR_ADJUSTMENTS: Record<string, number> = {
  BLACK: 0, WHITE: 0, SILVER: 0, GREY: 0,
  BLUE: -1, RED: -1,
  GREEN: -3, YELLOW: -4, ORANGE: -4,
  BROWN: -3, BEIGE: -2, PURPLE: -4,
  GOLD: -2, MAROON: -2, BRONZE: -2,
};

export function getColourAdjustment(colour?: string): number {
  if (!colour) return 0;
  return COLOUR_ADJUSTMENTS[colour.toUpperCase()] ?? -2;
}

// ── List-price deflator ─────────────────────────────────────────────────────

const PRICE_INDEX: Record<string, number> = priceIndexData.byYear;
const PRICE_INDEX_MIN_YEAR = priceIndexData.minYear;
const PRICE_INDEX_MAX_YEAR = priceIndexData.maxYear;

/**
 * How much less did a car of this age cost when it was NEW, relative to the
 * equivalent car's list price today?
 *
 * src/data/new-prices.json holds CURRENT list prices — it is scraped from
 * reviews of cars still on sale. Depreciating straight from those treated a
 * decade of new-car list inflation as if it were retained value: a 2018 Golf
 * was depreciated from the 2026 Golf's £41,860.
 *
 * Uses ONS series D7E8 (CPI new cars, 2015=100), OGL v3.0 — see
 * scripts/fetch-new-car-price-index.ts. Verified deflators: 2008 → 0.635,
 * 2012 → 0.693, 2016 → 0.714, 2020 → 0.819. Note how badly a flat annual rate
 * fits that shape: new-car prices barely moved 1996–2016, then jumped sharply
 * from 2021, so a constant 3.5%/yr over-deflates old cars by ~10pp.
 *
 * Expressed in terms of AGE rather than a calendar year so it stays pure — no
 * clock read, and it can't drift out of step with getDepreciationMultiplier.
 * Ages beyond the series clamp to the oldest year rather than extrapolating.
 * Returns 1 (no adjustment) if the table is unusable, so a bad data file
 * degrades to the previous behaviour instead of producing nonsense.
 */
export function getListPriceDeflator(vehicleAge: number): number {
  const current = PRICE_INDEX[String(PRICE_INDEX_MAX_YEAR)];
  if (!current) return 1;
  const targetYear = Math.max(
    PRICE_INDEX_MIN_YEAR,
    PRICE_INDEX_MAX_YEAR - Math.max(0, Math.round(vehicleAge)),
  );
  const then = PRICE_INDEX[String(targetYear)];
  if (!then) return 1;
  return then / current;
}

// ── Depreciation baseline ───────────────────────────────────────────────────

/**
 * Value implied by age alone, before mileage, condition or market comparables.
 *
 * NOTE: mileage is deliberately NOT applied here any more. It used to be, and
 * because this term carries only 20% of the three-source blend, the maximum
 * −12% mileage penalty arrived as −2.4% of the headline: a 2019 320d returned
 * £16,100 at 40,000 miles and £15,550 at 150,000. Mileage is now applied to
 * the blended value in combineValuationLayers, next to condition and colour —
 * which is where it always belonged, since neither market query filters on
 * mileage and the comparables therefore describe average-mileage cars.
 */
export function calculateDepreciationBaseline(
  newPrice: number,
  vehicleAge: number,
  make: string | undefined,
  model: string | undefined,
): number {
  const depMult = getDepreciationMultiplier(vehicleAge);
  const retMult = getMakeRetentionMultiplier(make, model);

  // Deflate today's list price back to what the car cost when it was new,
  // THEN depreciate. The two are orthogonal: the deflator corrects the
  // starting point, the curve models value lost since.
  const listPriceWhenNew = newPrice * getListPriceDeflator(vehicleAge);
  const baseValue = listPriceWhenNew * depMult * retMult;

  return Math.max(roundTo50(baseValue), 250);
}

// ── Combine valuation layers ────────────────────────────────────────────────

export function combineValuationLayers(
  depreciationEstimate: number | null,
  ebayMedian: number | null,
  ebayListingCount: number,
  cacheMedian: number | null,
  cacheEntryCount: number,
  conditionAdjPercent: number,
  colourAdjPercent: number,
  ebayTotalListings: number | null,
  ebayMinPrice: number | null,
  ebayMaxPrice: number | null,
  ebayDominantTransmission: string | null,
  ebayDominantBodyType: string | null,
  ebayYearWidened: boolean,
  ebayQ1Price: number | null,
  ebayQ3Price: number | null,
  // MarketCheck UK — second live asking-price signal, fused with eBay below.
  // Optional/defaulted so existing callers stay valid and the maths is
  // unchanged when MarketCheck is absent.
  marketcheckMedian: number | null = null,
  marketcheckCount: number = 0,
  marketcheckQ1: number | null = null,
  marketcheckQ3: number | null = null,
  /** Mileage adjustment, applied to the BLENDED value rather than buried in
   *  the depreciation term. Defaulted so older callers keep compiling, but
   *  every real caller should pass getMileageAdjustment(...) — omitting it
   *  reproduces the bug where mileage barely moved the number. */
  mileageAdjPercent: number = 0,
): ValuationResult | null {
  if (!depreciationEstimate) return null;

  const disclaimer =
    "This is an estimated guide value based on depreciation calculations, " +
    "publicly advertised vehicle prices (adjusted from asking prices to " +
    "reflect typical transaction values), and aggregated market data. It is " +
    "not a professional valuation and should not be relied upon as such. " +
    "Actual vehicle value depends on exact specification, condition, service " +
    "history, local market conditions, and provenance.";

  let estimatedValue: number;
  let confidence: ValuationConfidence;
  let fallbackPercent: number;
  const sources: string[] = ["depreciation model"];

  // ── Fuse the two live asking-price signals (eBay + MarketCheck) into one ──
  // market signal, weighted by listing count so the larger/cleaner source
  // dominates without hard-coded favouritism (count-weighted fusion). MarketCheck
  // is year-exact dealer forecourt stock; eBay is mixed private/auction and is
  // sometimes year-widened. When MarketCheck carries at least as many listings,
  // treat the blended signal as year-exact (it is) and use its tighter IQR.
  const ebCount = ebayListingCount || 0;
  const mcCount = marketcheckCount || 0;
  let marketMedian: number | null;
  let marketWidened: boolean;
  let rangeQ1: number | null;
  let rangeQ3: number | null;
  let rangeIqrCount: number;
  if (ebayMedian != null && marketcheckMedian != null) {
    const w = ebCount + mcCount || 1;
    marketMedian = Math.round((ebayMedian * ebCount + marketcheckMedian * mcCount) / w);
    marketWidened = ebayYearWidened && mcCount < ebCount;
    if (mcCount >= ebCount && marketcheckQ1 != null && marketcheckQ3 != null) {
      rangeQ1 = marketcheckQ1; rangeQ3 = marketcheckQ3; rangeIqrCount = mcCount;
    } else {
      rangeQ1 = ebayQ1Price; rangeQ3 = ebayQ3Price; rangeIqrCount = ebCount;
    }
  } else if (marketcheckMedian != null) {
    marketMedian = marketcheckMedian; marketWidened = false;
    rangeQ1 = marketcheckQ1; rangeQ3 = marketcheckQ3; rangeIqrCount = mcCount;
  } else if (ebayMedian != null) {
    marketMedian = ebayMedian; marketWidened = ebayYearWidened;
    rangeQ1 = ebayQ1Price; rangeQ3 = ebayQ3Price; rangeIqrCount = ebCount;
  } else {
    marketMedian = null; marketWidened = ebayYearWidened;
    rangeQ1 = ebayQ1Price; rangeQ3 = ebayQ3Price; rangeIqrCount = ebCount;
  }
  // Combined live comparable pool (eBay total + MarketCheck listings)
  const totalOnMarket = (ebayTotalListings || 0) + mcCount;
  const liveCount = ebCount + mcCount;
  const marketLabel = `${totalOnMarket > liveCount ? totalOnMarket : liveCount} similar vehicle${liveCount !== 1 ? "s" : ""} on the market`;

  if (marketMedian && cacheMedian) {
    // All three sources — reduce market weight when year widened
    if (marketWidened) {
      estimatedValue = depreciationEstimate * 0.30 + marketMedian * 0.30 + cacheMedian * 0.40;
    } else {
      estimatedValue = depreciationEstimate * 0.20 + marketMedian * 0.40 + cacheMedian * 0.40;
    }
    confidence = totalOnMarket >= 100 ? "high" : "medium";
    fallbackPercent = confidence === "high" ? 8 : 12;
    sources.push(marketLabel, "recent valuations");
  } else if (marketMedian) {
    // Depreciation + market — give depreciation more weight when year widened
    if (marketWidened) {
      estimatedValue = depreciationEstimate * 0.55 + marketMedian * 0.45;
      confidence = totalOnMarket >= 5 ? "medium" : "low";
      fallbackPercent = confidence === "medium" ? 15 : 18;
    } else {
      estimatedValue = depreciationEstimate * 0.35 + marketMedian * 0.65;
      confidence = totalOnMarket >= 100 ? "high" : totalOnMarket >= 20 ? "medium" : "low";
      fallbackPercent = confidence === "high" ? 8 : 12;
    }
    sources.push(marketLabel);
  } else if (cacheMedian) {
    // Depreciation + cache
    estimatedValue = depreciationEstimate * 0.25 + cacheMedian * 0.75;
    confidence = "medium";
    fallbackPercent = 12;
    sources.push("recent valuations");
  } else {
    // Depreciation only
    estimatedValue = depreciationEstimate;
    confidence = "low";
    fallbackPercent = 20;
  }

  // Widened year search caps confidence at medium
  if (marketWidened && confidence === "high") {
    confidence = "medium";
  }

  // ── Compute range (IQR path vs fallback percentage) ──────────────────────
  let rangePercent: number;
  // Direct null-check (not an aliased boolean) so TS narrows the reassignable
  // rangeQ1/rangeQ3 inside the block.
  if (rangeQ1 != null && rangeQ3 != null && rangeIqrCount >= 5) {
    // IQR half-width as percentage of estimatedValue
    const iqrHalfRange = (rangeQ3 - rangeQ1) / 2;
    const iqrPercent = Math.max((iqrHalfRange / estimatedValue) * 100, 3); // min 3% half-range

    // Blend IQR with fallback by confidence
    let blended: number;
    if (confidence === "high") {
      blended = iqrPercent; // IQR direct
    } else if (confidence === "medium") {
      blended = iqrPercent * 0.70 + fallbackPercent * 0.30;
    } else {
      blended = iqrPercent * 0.50 + fallbackPercent * 0.50;
    }

    // Safety cap: never wider than fallback; safety floor: min 3% half-range (6% total spread)
    rangePercent = Math.max(Math.min(blended, fallbackPercent), 3);
  } else {
    rangePercent = fallbackPercent;
  }

  // Apply mileage + condition + colour to the blended value. Mileage belongs
  // here because neither market query filters on it, so the comparables
  // describe a car of average mileage for its age — exactly the baseline this
  // adjustment is measured against.
  const condAdj = 1 + conditionAdjPercent / 100;
  const colAdj = 1 + colourAdjPercent / 100;
  const mileAdj = 1 + mileageAdjPercent / 100;
  estimatedValue = estimatedValue * mileAdj * condAdj * colAdj;

  const rangeLow = roundTo50(estimatedValue * (1 - rangePercent / 100));
  const rangeHigh = roundTo50(estimatedValue * (1 + rangePercent / 100));

  // Market supply categorisation
  let marketSupply: "good" | "moderate" | "limited" | null = null;
  if (totalOnMarket > 0) {
    if (totalOnMarket >= 100) marketSupply = "good";
    else if (totalOnMarket >= 20) marketSupply = "moderate";
    else marketSupply = "limited";
  }

  return {
    rangeLow: Math.max(rangeLow, 100),
    rangeHigh,
    estimatedValue: roundTo50(estimatedValue),
    confidence,
    sources,
    mileageAdjustmentPercent: mileageAdjPercent,
    conditionAdjustmentPercent: conditionAdjPercent,
    motAutoAdjustmentPercent: 0, // set by caller
    colourAdjustmentPercent: colourAdjPercent,
    ebayTotalListings: totalOnMarket || null,
    ebayMinPrice,
    ebayMaxPrice,
    ebayDominantTransmission,
    ebayDominantBodyType,
    ebayYearWidened: marketWidened,
    ebayQ1Price: rangeQ1 ?? null,
    ebayQ3Price: rangeQ3 ?? null,
    marketSupply,
    disclaimer,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function roundTo50(value: number): number {
  return Math.round(value / 50) * 50;
}

/**
 * A single MOT odometer reading, normalised to MILES. DVLA records some
 * vehicles (typically imports) in km — display/aggregate as miles everywhere.
 * SINGLE SOURCE OF TRUTH for per-reading conversion: anywhere that reads an
 * odometer value (valuation, MOT history, mileage chart, PDF) must go through
 * this so km cars aren't shown ~1.6× too high. Returns null if no usable value.
 */
export function odometerMiles(
  odometer?: { value?: number; unit?: string } | null,
): number | null {
  if (!odometer || typeof odometer.value !== "number" || !Number.isFinite(odometer.value)) {
    return null;
  }
  return odometer.unit?.toUpperCase() === "KM"
    ? Math.round(odometer.value * 0.621371)
    : odometer.value;
}

/**
 * Most recent recorded odometer reading, in miles, for the valuation mileage
 * adjustment. Don't rely on MOT-test array order — sort by completedDate
 * descending and take the newest test that actually carries an odometer.
 * Converts km readings to miles. Returns null when no reading is available.
 *
 * SINGLE SOURCE OF TRUTH: both the standalone valuation tool (ValuationResult)
 * and the in-report valuation (page.tsx) call this, so their mileage — and
 * therefore their estimate — agree. Previously page.tsx read
 * motTests[length-1] (the OLDEST test) directly, feeding a stale, far-too-low
 * mileage into the depreciation model and knocking £1k–£3k off the report's
 * valuation versus the tool. Keep them on this one helper.
 */
export function latestRecordedMileage(
  tests?: Array<{ completedDate?: string; odometer?: { value: number; unit?: string } }>,
): number | null {
  if (!tests || tests.length === 0) return null;
  const sorted = [...tests].sort(
    (a, b) =>
      new Date(b.completedDate ?? 0).getTime() - new Date(a.completedDate ?? 0).getTime(),
  );
  const latest = sorted.find((t) => odometerMiles(t.odometer) != null);
  return odometerMiles(latest?.odometer);
}
