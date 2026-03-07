// Most popular cars on UK roads
// Sources: DfT VEH0120, SMMT

export interface PopularMake {
  make: string;
  fleetSize: number; // thousands
}

export const popularMakesData: PopularMake[] = [
  { make: "Ford", fleetSize: 4280 },
  { make: "Volkswagen", fleetSize: 3150 },
  { make: "Vauxhall", fleetSize: 2980 },
  { make: "BMW", fleetSize: 2450 },
  { make: "Toyota", fleetSize: 2100 },
  { make: "Mercedes-Benz", fleetSize: 2050 },
  { make: "Audi", fleetSize: 1980 },
  { make: "Nissan", fleetSize: 1620 },
  { make: "Hyundai", fleetSize: 1350 },
  { make: "Kia", fleetSize: 1280 },
  { make: "Peugeot", fleetSize: 1180 },
  { make: "Honda", fleetSize: 920 },
  { make: "Renault", fleetSize: 870 },
  { make: "Land Rover", fleetSize: 840 },
  { make: "Mazda", fleetSize: 680 },
  { make: "Skoda", fleetSize: 650 },
  { make: "SEAT", fleetSize: 580 },
  { make: "Fiat", fleetSize: 560 },
  { make: "Volvo", fleetSize: 540 },
  { make: "Citroen", fleetSize: 520 },
];

export interface PopularModelTrend {
  year: number;
  fiesta: number;    // thousands registered
  golf: number;
  corsa: number;
  polo: number;
  focus: number;
}

export const popularModelTrend: PopularModelTrend[] = [
  { year: 2015, fiesta: 131, golf: 75, corsa: 82, polo: 56, focus: 81 },
  { year: 2016, fiesta: 120, golf: 68, corsa: 79, polo: 52, focus: 73 },
  { year: 2017, fiesta: 95, golf: 63, corsa: 75, polo: 48, focus: 69 },
  { year: 2018, fiesta: 96, golf: 55, corsa: 60, polo: 50, focus: 53 },
  { year: 2019, fiesta: 77, golf: 48, corsa: 42, polo: 40, focus: 44 },
  { year: 2020, fiesta: 52, golf: 34, corsa: 39, polo: 28, focus: 32 },
  { year: 2021, fiesta: 40, golf: 30, corsa: 35, polo: 24, focus: 28 },
  { year: 2022, fiesta: 31, golf: 28, corsa: 33, polo: 22, focus: 18 },
  { year: 2023, fiesta: 5, golf: 25, corsa: 30, polo: 20, focus: 8 },
  { year: 2024, fiesta: 0, golf: 22, corsa: 28, polo: 18, focus: 0 },
];

export const lastUpdated = "Q4 2024";
export const source = "https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-tables";
