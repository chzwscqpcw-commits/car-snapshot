// UK annual new car registrations
// Sources: SMMT, DfT VEH0160

export interface RegistrationYear {
  year: number;
  total: number;         // Total new registrations (thousands)
  petrol?: number;       // % petrol
  diesel?: number;       // % diesel
  bev?: number;          // % BEV
  phev?: number;         // % PHEV
  hybrid?: number;       // % hybrid
}

export const registrationData: RegistrationYear[] = [
  { year: 1990, total: 2009 },
  { year: 1992, total: 1593 },
  { year: 1994, total: 1911 },
  { year: 1996, total: 2025 },
  { year: 1998, total: 2247 },
  { year: 2000, total: 2222 },
  { year: 2002, total: 2563 },
  { year: 2003, total: 2579 },
  { year: 2004, total: 2567 },
  { year: 2005, total: 2440 },
  { year: 2006, total: 2345 },
  { year: 2007, total: 2404 },
  { year: 2008, total: 2132 },
  { year: 2009, total: 1995 },
  { year: 2010, total: 2031 },
  { year: 2011, total: 1941 },
  { year: 2012, total: 2045 },
  { year: 2013, total: 2265 },
  { year: 2014, total: 2477 },
  { year: 2015, total: 2633, petrol: 48.8, diesel: 48.5, bev: 1.1, phev: 0.8, hybrid: 0.8 },
  { year: 2016, total: 2693, petrol: 47.7, diesel: 47.8, bev: 1.4, phev: 1.0, hybrid: 2.1 },
  { year: 2017, total: 2541, petrol: 53.3, diesel: 42.0, bev: 1.9, phev: 1.2, hybrid: 1.6 },
  { year: 2018, total: 2367, petrol: 57.9, diesel: 32.0, bev: 2.1, phev: 1.4, hybrid: 6.6 },
  { year: 2019, total: 2311, petrol: 59.8, diesel: 25.2, bev: 3.1, phev: 1.6, hybrid: 10.3 },
  { year: 2020, total: 1631, petrol: 53.4, diesel: 17.9, bev: 6.6, phev: 4.1, hybrid: 18.0 },
  { year: 2021, total: 1647, petrol: 46.3, diesel: 14.0, bev: 11.6, phev: 7.0, hybrid: 21.1 },
  { year: 2022, total: 1614, petrol: 42.3, diesel: 12.2, bev: 16.6, phev: 6.3, hybrid: 22.6 },
  { year: 2023, total: 1904, petrol: 38.5, diesel: 10.1, bev: 16.5, phev: 6.8, hybrid: 28.1 },
  { year: 2024, total: 1953, petrol: 34.2, diesel: 8.5, bev: 19.6, phev: 7.2, hybrid: 30.5 },
  { year: 2025, total: 1890, petrol: 30.8, diesel: 7.1, bev: 22.8, phev: 7.8, hybrid: 31.5 },
];

export const registrationAnnotations = [
  { year: 2008, label: "Financial crisis" },
  { year: 2017, label: "Diesel decline" },
  { year: 2020, label: "COVID-19" },
];

export const lastUpdated = "December 2025";
export const source = "https://www.smmt.co.uk/vehicle-data/car-registrations/";
