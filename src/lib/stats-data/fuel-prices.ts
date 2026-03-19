// UK fuel prices — weekly data from DESNZ, annual averages derived
// Source: https://www.gov.uk/government/statistics/weekly-road-fuel-prices
// Weekly JSON fetched at build time by scripts/fetch-fuel-prices.ts

import weeklyJson from "@/data/fuel-prices-weekly.json";

export interface FuelPriceYear {
  year: number;
  petrol: number;
  diesel: number;
}

export interface FuelPriceWeek {
  date: string; // YYYY-MM-DD
  petrol: number; // pence per litre
  diesel: number;
}

// Pre-2003 annual data (DESNZ weekly data starts June 2003)
const PRE_2003: FuelPriceYear[] = [
  { year: 1988, petrol: 36.2, diesel: 35.8 },
  { year: 1989, petrol: 38.5, diesel: 37.8 },
  { year: 1990, petrol: 40.2, diesel: 39.5 },
  { year: 1991, petrol: 41.8, diesel: 40.9 },
  { year: 1992, petrol: 42.5, diesel: 41.6 },
  { year: 1993, petrol: 44.3, diesel: 43.1 },
  { year: 1994, petrol: 47.2, diesel: 45.8 },
  { year: 1995, petrol: 50.5, diesel: 49.2 },
  { year: 1996, petrol: 53.2, diesel: 52.4 },
  { year: 1997, petrol: 56.8, diesel: 55.7 },
  { year: 1998, petrol: 58.2, diesel: 57.6 },
  { year: 1999, petrol: 62.9, diesel: 63.1 },
  { year: 2000, petrol: 76.9, diesel: 77.5 },
  { year: 2001, petrol: 74.4, diesel: 74.8 },
  { year: 2002, petrol: 71.6, diesel: 72.5 },
];

/** All weekly data points from DESNZ (2003–present) */
export const weeklyData: FuelPriceWeek[] = weeklyJson.weekly;

/** Derive annual averages from weekly data */
function deriveAnnualAverages(): FuelPriceYear[] {
  const byYear = new Map<number, { petrolSum: number; dieselSum: number; count: number }>();

  for (const w of weeklyData) {
    const year = parseInt(w.date.slice(0, 4), 10);
    const entry = byYear.get(year) ?? { petrolSum: 0, dieselSum: 0, count: 0 };
    entry.petrolSum += w.petrol;
    entry.dieselSum += w.diesel;
    entry.count++;
    byYear.set(year, entry);
  }

  const derived: FuelPriceYear[] = [];
  for (const [year, { petrolSum, dieselSum, count }] of byYear) {
    derived.push({
      year,
      petrol: Math.round((petrolSum / count) * 10) / 10,
      diesel: Math.round((dieselSum / count) * 10) / 10,
    });
  }

  return derived.sort((a, b) => a.year - b.year);
}

/** Annual averages: pre-2003 static + 2003 onwards derived from weekly */
export const fuelPriceData: FuelPriceYear[] = [
  ...PRE_2003,
  ...deriveAnnualAverages(),
];

/** Monthly averages derived from weekly data */
export interface FuelPriceMonth {
  month: string; // YYYY-MM
  petrol: number;
  diesel: number;
}

export function getMonthlyData(): FuelPriceMonth[] {
  const byMonth = new Map<string, { petrolSum: number; dieselSum: number; count: number }>();

  for (const w of weeklyData) {
    const month = w.date.slice(0, 7); // YYYY-MM
    const entry = byMonth.get(month) ?? { petrolSum: 0, dieselSum: 0, count: 0 };
    entry.petrolSum += w.petrol;
    entry.dieselSum += w.diesel;
    entry.count++;
    byMonth.set(month, entry);
  }

  const months: FuelPriceMonth[] = [];
  for (const [month, { petrolSum, dieselSum, count }] of byMonth) {
    months.push({
      month,
      petrol: Math.round((petrolSum / count) * 10) / 10,
      diesel: Math.round((dieselSum / count) * 10) / 10,
    });
  }

  return months.sort((a, b) => a.month.localeCompare(b.month));
}

/** Key event annotations (date-based for weekly/monthly views) */
export const fuelPriceAnnotations = [
  { year: 1990, date: "1990-08-01", label: "Gulf War" },
  { year: 2000, date: "2000-09-01", label: "Fuel protests" },
  { year: 2008, date: "2008-07-01", label: "Financial crisis" },
  { year: 2020, date: "2020-03-01", label: "COVID-19" },
  { year: 2022, date: "2022-03-01", label: "Ukraine" },
  { year: 2026, date: "2026-02-01", label: "Middle East" },
];

/** Latest weekly data point */
export const latestWeek: FuelPriceWeek = weeklyData[weeklyData.length - 1];

/** Date the data was last fetched from DESNZ */
export const lastFetched = weeklyJson.lastFetched;

/** Formatted last-updated string */
export const lastUpdated = (() => {
  const d = new Date(latestWeek.date);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
})();

export const source = "https://www.gov.uk/government/statistics/weekly-road-fuel-prices";
