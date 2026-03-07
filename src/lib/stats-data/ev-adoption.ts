// UK electric vehicle adoption data
// Sources: DfT VEH0132, SMMT

export interface EvFleetYear {
  year: number;
  bev: number;       // Battery Electric Vehicle fleet size
  phev: number;      // Plug-in Hybrid fleet size
  hybrid: number;    // Conventional hybrid fleet size
  bevSalesPercent: number; // % of new car sales that are BEV
}

export const evAdoptionData: EvFleetYear[] = [
  { year: 2010, bev: 1100, phev: 0, hybrid: 82000, bevSalesPercent: 0.01 },
  { year: 2011, bev: 2300, phev: 200, hybrid: 108000, bevSalesPercent: 0.07 },
  { year: 2012, bev: 4100, phev: 1200, hybrid: 138000, bevSalesPercent: 0.1 },
  { year: 2013, bev: 6800, phev: 3900, hybrid: 172000, bevSalesPercent: 0.16 },
  { year: 2014, bev: 13400, phev: 11500, hybrid: 215000, bevSalesPercent: 0.59 },
  { year: 2015, bev: 23600, phev: 28000, hybrid: 272000, bevSalesPercent: 1.1 },
  { year: 2016, bev: 31400, phev: 44200, hybrid: 340000, bevSalesPercent: 1.4 },
  { year: 2017, bev: 42000, phev: 62000, hybrid: 420000, bevSalesPercent: 1.9 },
  { year: 2018, bev: 56400, phev: 82500, hybrid: 510000, bevSalesPercent: 2.1 },
  { year: 2019, bev: 91000, phev: 100000, hybrid: 590000, bevSalesPercent: 3.1 },
  { year: 2020, bev: 168000, phev: 135000, hybrid: 680000, bevSalesPercent: 6.6 },
  { year: 2021, bev: 355000, phev: 230000, hybrid: 810000, bevSalesPercent: 11.6 },
  { year: 2022, bev: 590000, phev: 320000, hybrid: 950000, bevSalesPercent: 16.6 },
  { year: 2023, bev: 870000, phev: 395000, hybrid: 1080000, bevSalesPercent: 16.5 },
  { year: 2024, bev: 1200000, phev: 450000, hybrid: 1200000, bevSalesPercent: 19.6 },
  { year: 2025, bev: 1580000, phev: 500000, hybrid: 1310000, bevSalesPercent: 22.8 },
];

export interface EvRegionDensity {
  region: string;
  evPer1000: number;
}

export const evRegionData: EvRegionDensity[] = [
  { region: "London", evPer1000: 28.5 },
  { region: "South East", evPer1000: 24.2 },
  { region: "South West", evPer1000: 19.8 },
  { region: "East of England", evPer1000: 21.3 },
  { region: "East Midlands", evPer1000: 15.6 },
  { region: "West Midlands", evPer1000: 14.8 },
  { region: "North West", evPer1000: 13.2 },
  { region: "Yorkshire & Humber", evPer1000: 12.5 },
  { region: "North East", evPer1000: 11.8 },
  { region: "Wales", evPer1000: 12.1 },
  { region: "Scotland", evPer1000: 16.4 },
  { region: "Northern Ireland", evPer1000: 8.3 },
];

export const lastUpdated = "Q4 2025";
export const source = "https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-tables";
