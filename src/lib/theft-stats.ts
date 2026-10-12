// Shared figures and formatting for the /stats theft pages. Everything comes
// from theft-stats.json (scripts/process-theft-foi.py: DVLA FOI FOIR13058 ÷
// DfT VEH0120), so a yearly refresh updates every page at once.

import theftStats from "@/data/theft-stats.json";

export type TheftRow = (typeof theftStats.cars.topByCount)[number];
export type TheftFleet = "cars" | "vans" | "motorcycles";

export const THEFT_YEAR = theftStats.year;

export const theftFleets = {
  cars: theftStats.cars,
  vans: theftStats.vans,
  motorcycles: theftStats.motorcycles,
};

export const allVehiclesByYear = theftStats.allVehiclesByYear as Record<string, number>;

export const fmt = (v: number) => v.toLocaleString("en-GB");

/** Stolen in the latest year for a fleet. */
export function stolen(fleet: TheftFleet): number {
  return (theftFleets[fleet].byYear as Record<string, number>)[THEFT_YEAR];
}

/** % change in thefts on the year before, to one decimal place. */
export function yearChange(fleet: TheftFleet): number {
  const byYear = theftFleets[fleet].byYear as Record<string, number>;
  const now = byYear[THEFT_YEAR];
  const before = byYear[THEFT_YEAR - 1];
  return Math.round(((now - before) / before) * 1000) / 10;
}

/** "−12.9%" / "+3.1%" with a true minus sign. */
export function signedPct(v: number): string {
  return `${v > 0 ? "+" : "−"}${Math.abs(v)}%`;
}

/** "1 in 11" from a per-1,000 rate. */
export function oneIn(per1000: number): string {
  return `1 in ${fmt(Math.round(1000 / per1000))}`;
}

export const THEFT_SOURCE =
  "DVLA stolen-vehicle records, released under Freedom of Information (FOIR13058), and DfT vehicle licensing statistics (VEH0120)";

/** Dataset JSON-LD shared by the theft pages. */
export function theftDatasetSchema(name: string, description: string, url: string, measured: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name,
    description,
    url,
    license: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    creator: { "@type": "Organization", name: "Free Plate Check", url: "https://www.freeplatecheck.co.uk" },
    temporalCoverage: String(THEFT_YEAR),
    spatialCoverage: "United Kingdom",
    variableMeasured: measured,
  };
}
