// UK used car price index (100 = Jan 2019)
// Sources: AutoTrader / Cap HPI indices

export interface UsedCarPriceQuarter {
  quarter: string;  // e.g. "Q1 2019"
  index: number;
  label?: string;   // Optional annotation
}

export const usedCarPriceData: UsedCarPriceQuarter[] = [
  { quarter: "Q1 2019", index: 100 },
  { quarter: "Q2 2019", index: 99.2 },
  { quarter: "Q3 2019", index: 98.5 },
  { quarter: "Q4 2019", index: 97.8 },
  { quarter: "Q1 2020", index: 96.2 },
  { quarter: "Q2 2020", index: 91.5, label: "COVID lockdown" },
  { quarter: "Q3 2020", index: 103.8 },
  { quarter: "Q4 2020", index: 108.2 },
  { quarter: "Q1 2021", index: 112.5 },
  { quarter: "Q2 2021", index: 121.8 },
  { quarter: "Q3 2021", index: 132.5, label: "Chip shortage peak" },
  { quarter: "Q4 2021", index: 138.2 },
  { quarter: "Q1 2022", index: 142.6 },
  { quarter: "Q2 2022", index: 145.8, label: "Peak prices" },
  { quarter: "Q3 2022", index: 141.2 },
  { quarter: "Q4 2022", index: 136.5 },
  { quarter: "Q1 2023", index: 131.8 },
  { quarter: "Q2 2023", index: 127.2 },
  { quarter: "Q3 2023", index: 124.5 },
  { quarter: "Q4 2023", index: 121.8 },
  { quarter: "Q1 2024", index: 119.2 },
  { quarter: "Q2 2024", index: 117.5 },
  { quarter: "Q3 2024", index: 116.1 },
  { quarter: "Q4 2024", index: 114.8 },
  { quarter: "Q1 2025", index: 113.2 },
];

export interface DepreciationCurve {
  ageYears: number;
  percentRetained: number; // % of new price
}

export const avgDepreciationCurve: DepreciationCurve[] = [
  { ageYears: 0, percentRetained: 100 },
  { ageYears: 1, percentRetained: 72 },
  { ageYears: 2, percentRetained: 58 },
  { ageYears: 3, percentRetained: 47 },
  { ageYears: 4, percentRetained: 39 },
  { ageYears: 5, percentRetained: 33 },
  { ageYears: 6, percentRetained: 28 },
  { ageYears: 7, percentRetained: 24 },
  { ageYears: 8, percentRetained: 21 },
  { ageYears: 9, percentRetained: 18 },
  { ageYears: 10, percentRetained: 16 },
];

export const lastUpdated = "Q1 2025";
export const source = "https://www.autotrader.co.uk/content/news/used-car-price-index";
