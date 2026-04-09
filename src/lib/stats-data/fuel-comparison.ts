// Per-mile running cost comparison by fuel type
// Derived from latest DESNZ weekly fuel prices at build time
// EV costs based on Ofgem price cap rates

import { latestWeek } from "./fuel-prices";

const LITRES_PER_GALLON = 4.546;

// Average fuel economy assumptions (MPG combined) for typical UK vehicles
const AVG_MPG = {
  petrol: 40,
  diesel: 50,
  hybrid: 55,
};

// EV: average efficiency ~3.5 mi/kWh, Ofgem cap rate ~24.5p/kWh (Q2 2026)
const EV_MILES_PER_KWH = 3.5;
const ELECTRICITY_PENCE_PER_KWH = 24.5;

function calcPencePerMile(fuelPricePence: number, mpg: number): number {
  return Math.round(((fuelPricePence * LITRES_PER_GALLON) / mpg) * 10) / 10;
}

// Derive per-mile costs from latest weekly fuel prices
const petrolPPM = calcPencePerMile(latestWeek.petrol, AVG_MPG.petrol);
const dieselPPM = calcPencePerMile(latestWeek.diesel, AVG_MPG.diesel);
const hybridPPM = calcPencePerMile(latestWeek.petrol, AVG_MPG.hybrid);
const evPPM = Math.round((ELECTRICITY_PENCE_PER_KWH / EV_MILES_PER_KWH) * 10) / 10;

// CO2 emissions per mile (grams) — relatively stable regardless of fuel price
const CO2_PER_MILE = {
  petrol: 164,
  diesel: 148,
  hybrid: 92,
  ev: 0,
};

export interface FuelCostAtMileage {
  annualMiles: number;
  petrol: number;   // annual fuel cost £
  diesel: number;
  hybrid: number;
  ev: number;
}

const MILEAGE_STEPS = [3000, 5000, 7000, 8000, 10000, 12000, 15000, 20000, 25000, 30000];

export const fuelComparisonData: FuelCostAtMileage[] = MILEAGE_STEPS.map((miles) => ({
  annualMiles: miles,
  petrol: Math.round((petrolPPM / 100) * miles),
  diesel: Math.round((dieselPPM / 100) * miles),
  hybrid: Math.round((hybridPPM / 100) * miles),
  ev: Math.round((evPPM / 100) * miles),
}));

export interface PerMileCost {
  fuelType: string;
  pencePerMile: number;
  co2PerMile: number;  // grams
  color: string;
}

export const perMileCosts: PerMileCost[] = [
  { fuelType: "Petrol", pencePerMile: petrolPPM, co2PerMile: CO2_PER_MILE.petrol, color: "#f59e0b" },
  { fuelType: "Diesel", pencePerMile: dieselPPM, co2PerMile: CO2_PER_MILE.diesel, color: "#ef4444" },
  { fuelType: "Hybrid", pencePerMile: hybridPPM, co2PerMile: CO2_PER_MILE.hybrid, color: "#38bdf8" },
  { fuelType: "Electric", pencePerMile: evPPM, co2PerMile: CO2_PER_MILE.ev, color: "#10b981" },
];

/** Date of the fuel price data used for these calculations */
export const priceDate = latestWeek.date;

/** Formatted date for display */
export const lastUpdated = (() => {
  const d = new Date(latestWeek.date);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
})();

export const source = "https://www.gov.uk/government/statistics/energy-trends";
