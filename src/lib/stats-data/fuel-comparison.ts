// Per-mile running cost comparison by fuel type
// Sources: BEIS, Ofgem, SMMT (composite)

export interface FuelCostAtMileage {
  annualMiles: number;
  petrol: number;   // annual fuel cost £
  diesel: number;
  hybrid: number;
  ev: number;
}

export const fuelComparisonData: FuelCostAtMileage[] = [
  { annualMiles: 3000, petrol: 480, diesel: 420, hybrid: 310, ev: 150 },
  { annualMiles: 5000, petrol: 800, diesel: 700, hybrid: 520, ev: 250 },
  { annualMiles: 7000, petrol: 1120, diesel: 980, hybrid: 728, ev: 350 },
  { annualMiles: 8000, petrol: 1280, diesel: 1120, hybrid: 832, ev: 400 },
  { annualMiles: 10000, petrol: 1600, diesel: 1400, hybrid: 1040, ev: 500 },
  { annualMiles: 12000, petrol: 1920, diesel: 1680, hybrid: 1248, ev: 600 },
  { annualMiles: 15000, petrol: 2400, diesel: 2100, hybrid: 1560, ev: 750 },
  { annualMiles: 20000, petrol: 3200, diesel: 2800, hybrid: 2080, ev: 1000 },
  { annualMiles: 25000, petrol: 4000, diesel: 3500, hybrid: 2600, ev: 1250 },
  { annualMiles: 30000, petrol: 4800, diesel: 4200, hybrid: 3120, ev: 1500 },
];

export interface PerMileCost {
  fuelType: string;
  pencePerMile: number;
  co2PerMile: number;  // grams
  color: string;
}

export const perMileCosts: PerMileCost[] = [
  { fuelType: "Petrol", pencePerMile: 16.0, co2PerMile: 164, color: "#f59e0b" },
  { fuelType: "Diesel", pencePerMile: 14.0, co2PerMile: 148, color: "#ef4444" },
  { fuelType: "Hybrid", pencePerMile: 10.4, co2PerMile: 92, color: "#38bdf8" },
  { fuelType: "Electric", pencePerMile: 5.0, co2PerMile: 0, color: "#10b981" },
];

export const lastUpdated = "January 2025";
export const source = "https://www.gov.uk/government/statistics/energy-trends";
