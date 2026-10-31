// The made-up cars the example result rotates through, on the homepage (the
// full check) and on /value-my-car (the valuation). Each tells a different
// story (an open recall, a ULEZ fail, a retest, a car that has lost most of its
// value) so the card shows what a check can turn up, not just a clean bill of
// health. Plates are placeholders in the AB12 CDE style; the card is labelled
// "Example result". The earliest "valid until" date is 30 Jan 2027: refresh
// the dates (and add a test to each history) before then. Ages are measured
// from REF_YEAR, so bump that with the dates.

export type MotResult = "pass" | "retest";

/** The year the sample data describes; ages and average mileage count from it. */
export const REF_YEAR = 2026;

export interface SampleCar {
  id: string;
  plate: string;
  title: string;
  spec: string;
  score: number;
  motUntil: string;
  mot: MotResult[];
  /** Odometer at each MOT, oldest first. */
  mileage: number[];
  mileageNote: string;
  /** First registered; drives the age shown on the valuation card. */
  year: number;
  value: string;
  /** The headline figure, inside `value`'s range. */
  valueMid: number;
  /** Where the car sits in its value band, 0–1. */
  valuePos: number;
  /** What it cost new, for the "since new" row on the valuation card. */
  newPrice: number;
  /** Live listings behind the valuation, and the shape of their asking prices
   *  (six bands, low to high) for the little histogram. */
  listings: number;
  listingBars: [number, number, number, number, number, number];
  ulez: boolean;
  taxNote: string;
  openRecalls: number;
  runningCost: string;
  /** Fuel (or charging), insurance, servicing, tax: shares of the year's cost. */
  costSplit: [number, number, number, number];
}

export const SAMPLE_CARS: SampleCar[] = [
  {
    id: "fiesta",
    plate: "AB19 CDE",
    title: "2019 Ford Fiesta Titanium",
    spec: "1.0 EcoBoost · Petrol · Blue",
    score: 86,
    motUntil: "14 Mar 2027",
    mot: ["pass", "pass", "retest", "pass", "pass"],
    mileage: [15600, 22900, 29400, 35800, 41250],
    mileageNote: "No signs of clocking",
    year: 2019,
    value: "£8,400 – £9,600",
    valuePos: 0.55,
    valueMid: 9000,
    newPrice: 17500,
    listings: 38,
    listingBars: [2, 5, 9, 8, 4, 2],
    ulez: true,
    taxNote: "Euro 6 petrol",
    openRecalls: 0,
    runningCost: "About £1,640 a year",
    costSplit: [46, 30, 13, 11],
  },
  {
    id: "model3",
    plate: "CD21 EFG",
    title: "2021 Tesla Model 3",
    spec: "Long Range · Electric · White",
    score: 91,
    motUntil: "2 Jun 2027",
    mot: ["pass", "pass", "pass"],
    mileage: [21400, 33800, 45100],
    mileageNote: "No signs of clocking",
    year: 2021,
    value: "£20,500 – £23,000",
    valuePos: 0.4,
    valueMid: 21750,
    newPrice: 46990,
    listings: 52,
    listingBars: [3, 7, 10, 6, 3, 1],
    ulez: true,
    taxNote: "Electric, zero emissions",
    openRecalls: 1,
    runningCost: "About £1,290 a year",
    costSplit: [24, 48, 12, 16],
  },
  {
    id: "golf",
    plate: "GH17 JKL",
    title: "2017 Volkswagen Golf Match",
    spec: "1.6 TDI · Diesel · Grey",
    score: 74,
    motUntil: "9 Sep 2027",
    mot: ["pass", "retest", "pass", "pass", "pass", "pass", "pass"],
    mileage: [31200, 42900, 55600, 67100, 78300, 88900, 99200],
    mileageNote: "High but steady, no gaps",
    year: 2017,
    value: "£7,200 – £8,400",
    valuePos: 0.35,
    valueMid: 7800,
    newPrice: 21800,
    listings: 61,
    listingBars: [4, 8, 10, 7, 5, 2],
    ulez: true,
    taxNote: "Euro 6 diesel",
    openRecalls: 0,
    runningCost: "About £1,890 a year",
    costSplit: [44, 28, 18, 10],
  },
  {
    id: "corsa",
    plate: "MN15 PQR",
    title: "2015 Vauxhall Corsa SRi",
    spec: "1.4 · Petrol · Red",
    score: 68,
    motUntil: "18 Mar 2027",
    mot: ["pass", "pass", "retest", "pass", "pass", "retest", "pass", "pass", "pass"],
    mileage: [18400, 26100, 33700, 40200, 46900, 52800, 58100, 63500, 68200],
    mileageNote: "No signs of clocking",
    year: 2015,
    value: "£3,100 – £3,900",
    valuePos: 0.6,
    valueMid: 3500,
    newPrice: 14900,
    listings: 44,
    listingBars: [3, 6, 10, 9, 5, 3],
    ulez: true,
    taxNote: "Euro 5 petrol",
    openRecalls: 0,
    runningCost: "About £1,520 a year",
    costSplit: [42, 33, 15, 10],
  },
  {
    id: "yaris",
    plate: "ST20 UVW",
    title: "2020 Toyota Yaris Icon",
    spec: "1.5 Hybrid · Silver",
    score: 93,
    motUntil: "30 Jan 2027",
    mot: ["pass", "pass", "pass", "pass"],
    mileage: [14800, 22300, 30100, 37400],
    mileageNote: "Low and steady",
    year: 2020,
    value: "£11,800 – £13,200",
    valuePos: 0.65,
    valueMid: 12500,
    newPrice: 19900,
    listings: 29,
    listingBars: [1, 4, 8, 10, 6, 2],
    ulez: true,
    taxNote: "Euro 6 hybrid",
    openRecalls: 0,
    runningCost: "About £1,180 a year",
    costSplit: [34, 38, 16, 12],
  },
  {
    id: "320d",
    plate: "XY14 ZAB",
    title: "2014 BMW 320d SE",
    spec: "2.0 · Diesel · Black",
    score: 62,
    motUntil: "5 Apr 2027",
    mot: ["pass", "pass", "pass", "retest", "pass", "pass", "retest", "pass", "pass", "pass"],
    mileage: [36500, 52800, 68400, 82100, 95700, 107300, 118900, 128400, 137600, 146200],
    mileageNote: "High mileage, steady",
    year: 2014,
    value: "£5,200 – £6,300",
    valuePos: 0.3,
    valueMid: 5750,
    newPrice: 29900,
    listings: 57,
    listingBars: [5, 9, 10, 6, 3, 2],
    ulez: false,
    taxNote: "Euro 5 diesel · £12.50 a day",
    openRecalls: 0,
    runningCost: "About £2,280 a year",
    costSplit: [45, 27, 20, 8],
  },
];

const STORAGE_KEY = "fpc_sample_car";
let pageChoice: number | null = null;

/**
 * Which example car this page load shows: a random one on a first visit, then
 * the next one on each visit after. Decided once per page load, so both copies
 * of the card (wide-screen rail and inline) agree.
 */
export function pageSampleIndex(): number {
  if (pageChoice !== null) return pageChoice;
  let next = Math.floor(Math.random() * SAMPLE_CARS.length);
  try {
    const last = window.localStorage.getItem(STORAGE_KEY);
    if (last !== null && /^\d+$/.test(last)) next = (Number(last) + 1) % SAMPLE_CARS.length;
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // Storage blocked: a random car each time is fine.
  }
  pageChoice = next;
  return next;
}
