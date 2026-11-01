import calibration from "@/data/model-price-calibration.json";
import newPrices from "@/data/new-prices.json";
import { usedCarPriceData, lastUpdated as usedPricesUpdated } from "@/lib/stats-data/used-car-prices";
import {
  calculateDepreciationBaseline,
  getDepreciationMultiplier,
  getListPriceDeflator,
  getMakeRetentionMultiplier,
  lookupCalibratedPrice,
  lookupNewPrice,
} from "@/lib/valuation";
import { fmtGbp, fmtPct, prettyName } from "../format";
import type { Picked, UsedPriceTrendProps, ValueTableProps, WorthAfterProps } from "../props";
import { CTA, EYEBROW, nth, samplePlate } from "./shared";

type Family = { price: number; n: number; minAge: number; maxAge: number };
const FAMILIES = (calibration as { generatedAt: string; families: Record<string, Family> }).families;
const CALIBRATED_AT = (calibration as { generatedAt: string }).generatedAt;
const PRICES = newPrices as Array<{ make: string; model: string; newPrice: number }>;

const VALUE_AGE = 3;
const MIN_OBSERVATIONS = 10;
/**
 * The calibrated start price and the scraped list price describe the same
 * car only when they roughly agree. A family far outside this band has a
 * stale or wrong list price (a £10,475 Ceed, a £55,395 5 Series for a fleet
 * of older ones), and a share-of-list-price figure built on it is a data
 * artefact, not a story. Those families are left out of the table.
 */
const LIST_AGREEMENT = [0.75, 1.3] as const;

function splitKey(key: string): [string, string] {
  const [make, model] = key.split("|");
  return [make, model];
}

/**
 * What the site's own model says a three-year-old example of each family is
 * worth, as a share of today's list price: the market-calibrated start price
 * (fitted to real listings), deflated to the year the car was new, down the
 * depreciation curve, times the make's retention. Only families fitted on
 * enough listings and observed around age three.
 */
export function threeYearRetention(): Array<{ key: string; name: string; newPrice: number; value: number; pct: number }> {
  const out: Array<{ key: string; name: string; newPrice: number; value: number; pct: number }> = [];
  for (const [key, fam] of Object.entries(FAMILIES)) {
    if (fam.n < MIN_OBSERVATIONS) continue;
    if (VALUE_AGE < fam.minAge - 2 || VALUE_AGE > fam.maxAge + 2) continue;
    const [make, model] = splitKey(key);
    const newPrice = lookupNewPrice(PRICES, make, model);
    if (!newPrice) continue;
    const agreement = fam.price / newPrice;
    if (agreement < LIST_AGREEMENT[0] || agreement > LIST_AGREEMENT[1]) continue;
    const value = fam.price * getListPriceDeflator(VALUE_AGE) * getDepreciationMultiplier(VALUE_AGE) * getMakeRetentionMultiplier(make, model);
    const pct = (value / newPrice) * 100;
    out.push({ key, name: prettyName(key), newPrice, value, pct });
  }
  return out.sort((a, b) => b.pct - a.pct);
}

const SOURCE_VALUE = "Free Plate Check valuation model, calibrated on live used-car listings";

export function pickValueTable(occurrence: number, weekIndex: number, music: boolean): Picked<ValueTableProps> {
  const variant: ValueTableProps["variant"] = occurrence % 2 === 0 ? "holders" : "losers";
  const all = threeYearRetention();
  const chosen = variant === "holders" ? all.slice(0, 6) : all.slice(-6).reverse();
  const rows = chosen.map((r) => ({
    label: r.name,
    value: Math.round(r.pct),
    display: fmtPct(r.pct),
    sub: `${fmtGbp(r.newPrice, 100)} new`,
  }));
  const base = {
    eyebrow: EYEBROW.sellers,
    source: `Source: ${SOURCE_VALUE} · ${CALIBRATED_AT}`,
    cta: CTA.sellers,
    plate: samplePlate(weekIndex),
    music,
  };
  if (variant === "losers") {
    return {
      composition: "ValueTable",
      title: "Cars that lose value fastest",
      caption: `Which cars lose value fastest? After three years our model puts these at the smallest share of their new price: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. Estimates for an average example. Your own car's value takes a plate and ten seconds, free, no email.`,
      tags: ["depreciation", "carvalue", "newcar"],
      source: SOURCE_VALUE,
      sourceDate: CALIBRATED_AT,
      props: {
        ...base,
        variant,
        hook: ["The cars that ", { em: "lose value" }, " fastest"],
        rows,
        intro: "Estimated value after three years, as a share of the new price.",
        outro: "Estimates for an average example. Yours takes a plate and ten seconds.",
      },
    };
  }
  return {
    composition: "ValueTable",
    title: "Cars that hold their value best",
    caption: `Which cars hold their value best? After three years our model puts these at the largest share of their new price: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. Estimates for an average example. Your own car's value takes a plate and ten seconds, free, no email.`,
    tags: ["depreciation", "carvalue", "resalevalue"],
    source: SOURCE_VALUE,
    sourceDate: CALIBRATED_AT,
    props: {
      ...base,
      variant,
      hook: ["The cars that ", { em: "hold their value" }, " best"],
      rows,
      intro: "Estimated value after three years, as a share of the new price.",
      outro: "Estimates for an average example. Yours takes a plate and ten seconds.",
    },
  };
}

/** Popular families, each with a list price, for the "worth after" clip. */
export const WORTH_AFTER_MODELS: readonly string[] = [
  "VOLKSWAGEN|GOLF", "FORD|FIESTA", "VAUXHALL|CORSA", "NISSAN|QASHQAI", "BMW|3 SERIES", "FORD|FOCUS",
  "AUDI|A3", "TOYOTA|YARIS", "VOLKSWAGEN|POLO", "MERCEDES-BENZ|C CLASS", "KIA|SPORTAGE", "FORD|PUMA",
  "BMW|1 SERIES", "MERCEDES-BENZ|A CLASS", "VOLKSWAGEN|TIGUAN", "FORD|KUGA", "HYUNDAI|TUCSON",
  "SKODA|OCTAVIA", "PEUGEOT|208", "RENAULT|CLIO", "VOLVO|XC40", "TOYOTA|COROLLA", "HONDA|CIVIC",
  "LAND ROVER|RANGE ROVER EVOQUE", "AUDI|A4", "VAUXHALL|ASTRA", "NISSAN|JUKE", "PEUGEOT|3008",
  "VOLKSWAGEN|T-ROC", "SEAT|LEON", "BMW|X1", "AUDI|Q3", "KIA|NIRO", "MG|ZS", "DACIA|SANDERO",
];

const AGES = [1, 3, 5, 8];

export function pickWorthAfter(occurrence: number, weekIndex: number, music: boolean): Picked<WorthAfterProps> {
  const key = nth(WORTH_AFTER_MODELS, occurrence);
  const [make, model] = splitKey(key);
  const listPrice = lookupNewPrice(PRICES, make, model);
  if (!listPrice) throw new Error(`worth-after: no list price for ${key} in src/data/new-prices.json`);
  // The "new" bar is what the valuation itself starts from: the price the
  // market calibration implies for the family where it has one (the scraped
  // list price is missing or stale for a third of models), else the list price.
  const newPrice = lookupCalibratedPrice(make, model, VALUE_AGE) ?? listPrice;
  const name = prettyName(key);
  const points = AGES.map((age) => ({ age, value: calculateDepreciationBaseline(newPrice, age, make, model) }));
  const at3 = points.find((p) => p.age === VALUE_AGE)!;
  const pct3 = Math.round((at3.value / newPrice) * 100);
  return {
    composition: "WorthAfter",
    title: `What a 3-year-old ${name} is worth`,
    caption: `What is a three-year-old ${name} worth? From a typical new price of about ${fmtGbp(newPrice, 100)}, our guide value for an average example: ${fmtGbp(points[0].value, 50)} at one year, ${fmtGbp(at3.value, 50)} at three (${pct3}% of new), ${fmtGbp(points[2].value, 50)} at five, ${fmtGbp(points[3].value, 50)} at eight. Mileage, condition and live listings move the number: get yours in ten seconds, free, no email.`,
    tags: ["carvalue", "depreciation", name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")],
    source: SOURCE_VALUE,
    sourceDate: CALIBRATED_AT,
    props: {
      hook: ["What's a 3-year-old ", { em: name }, " worth?"],
      eyebrow: EYEBROW.sellers,
      source: `Source: ${SOURCE_VALUE} · ${CALIBRATED_AT}`,
      cta: CTA.sellers,
      plate: samplePlate(weekIndex),
      music,
      name,
      newPrice,
      points,
      intro: `Guide value for an average example, from a typical new price of ${fmtGbp(newPrice, 100)}.`,
      outro: "Mileage, condition and live listings move the number. Yours takes ten seconds.",
    },
  };
}

export function pickUsedPriceTrend(_occurrence: number, weekIndex: number, music: boolean): Picked<UsedPriceTrendProps> {
  const series = usedCarPriceData;
  const line = series.map((q) => ({ x: q.quarter.replace(/^Q(\d) 20(\d\d)$/, "$2Q$1"), y: q.index }));
  const peakIdx = series.reduce((best, q, i) => (q.index > series[best].index ? i : best), 0);
  const lowIdx = series.reduce((best, q, i) => (q.index < series[best].index ? i : best), 0);
  const latest = series[series.length - 1];
  const peak = series[peakIdx];
  const vs2019 = Math.round(latest.index - 100);
  const vsPeak = Math.round(((latest.index - peak.index) / peak.index) * 100);
  const SRC = "Used-car price index (AutoTrader / cap hpi), 2019 = 100";
  return {
    composition: "UsedPriceTrend",
    title: "Used car prices: where they are now",
    caption: `Used car prices in one line. Against 2019, they are ${vs2019 >= 0 ? "up" : "down"} ${Math.abs(vs2019)}% (${usedPricesUpdated}). Against the ${peak.quarter} peak, ${Math.abs(vsPeak)}% lower. If you are selling, the market has been drifting down for ${series.length - 1 - peakIdx} quarters. A free valuation shows where your car sits today.`,
    tags: ["usedcars", "carprices", "sellingmycar"],
    source: SRC,
    sourceDate: usedPricesUpdated,
    props: {
      hook: ["Used car prices: ", { em: `${vsPeak}%` }, " from the peak"],
      eyebrow: EYEBROW.sellers,
      source: `Source: ${SRC} · ${usedPricesUpdated}`,
      cta: CTA.sellers,
      plate: samplePlate(weekIndex),
      music,
      line,
      annotations: [
        { index: lowIdx, text: series[lowIdx].label ?? "Low" },
        { index: peakIdx, text: series[peakIdx].label ?? "Peak" },
      ],
      intro: `The used-car price index, ${series[0].quarter} to ${latest.quarter} (2019 = 100).`,
      outro: `Still ${vs2019}% above 2019, but ${Math.abs(vsPeak)}% below the ${peak.quarter} peak.`,
    },
  };
}
