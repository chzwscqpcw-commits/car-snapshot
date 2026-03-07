// Annual average UK fuel prices (pence per litre)
// Source: DESNZ Weekly Road Fuel Prices

export interface FuelPriceYear {
  year: number;
  petrol: number;
  diesel: number;
}

export const fuelPriceData: FuelPriceYear[] = [
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
  { year: 2003, petrol: 76.2, diesel: 77.1 },
  { year: 2004, petrol: 79.6, diesel: 80.8 },
  { year: 2005, petrol: 84.3, diesel: 88.5 },
  { year: 2006, petrol: 91.2, diesel: 95.3 },
  { year: 2007, petrol: 95.4, diesel: 99.1 },
  { year: 2008, petrol: 104.7, diesel: 113.8 },
  { year: 2009, petrol: 89.3, diesel: 96.4 },
  { year: 2010, petrol: 111.9, diesel: 116.5 },
  { year: 2011, petrol: 133.3, diesel: 139.5 },
  { year: 2012, petrol: 134.5, diesel: 141.2 },
  { year: 2013, petrol: 133.1, diesel: 139.4 },
  { year: 2014, petrol: 125.5, diesel: 131.2 },
  { year: 2015, petrol: 109.3, diesel: 112.6 },
  { year: 2016, petrol: 108.2, diesel: 112.5 },
  { year: 2017, petrol: 117.2, diesel: 120.8 },
  { year: 2018, petrol: 124.1, diesel: 129.6 },
  { year: 2019, petrol: 124.7, diesel: 130.1 },
  { year: 2020, petrol: 112.8, diesel: 117.5 },
  { year: 2021, petrol: 131.5, diesel: 134.2 },
  { year: 2022, petrol: 165.6, diesel: 180.3 },
  { year: 2023, petrol: 148.2, diesel: 155.1 },
  { year: 2024, petrol: 143.5, diesel: 150.8 },
  { year: 2025, petrol: 139.8, diesel: 147.2 },
];

export const fuelPriceAnnotations = [
  { year: 1990, label: "Gulf War" },
  { year: 2000, label: "Fuel protests" },
  { year: 2008, label: "Financial crisis" },
  { year: 2020, label: "COVID-19" },
  { year: 2022, label: "Ukraine" },
];

export const lastUpdated = "January 2025";
export const source = "https://www.gov.uk/government/statistics/weekly-road-fuel-prices";
