// UK average annual car mileage
// Source: DfT National Travel Survey

export interface MileageYear {
  year: number;
  avgMiles: number; // average annual miles per car
}

export const mileageData: MileageYear[] = [
  { year: 1990, avgMiles: 9900 },
  { year: 1992, avgMiles: 9700 },
  { year: 1994, avgMiles: 9500 },
  { year: 1996, avgMiles: 9200 },
  { year: 1998, avgMiles: 9100 },
  { year: 2000, avgMiles: 8900 },
  { year: 2002, avgMiles: 8800 },
  { year: 2004, avgMiles: 8700 },
  { year: 2005, avgMiles: 8600 },
  { year: 2006, avgMiles: 8500 },
  { year: 2007, avgMiles: 8400 },
  { year: 2008, avgMiles: 8200 },
  { year: 2009, avgMiles: 8100 },
  { year: 2010, avgMiles: 8000 },
  { year: 2011, avgMiles: 7900 },
  { year: 2012, avgMiles: 7800 },
  { year: 2013, avgMiles: 7700 },
  { year: 2014, avgMiles: 7600 },
  { year: 2015, avgMiles: 7600 },
  { year: 2016, avgMiles: 7500 },
  { year: 2017, avgMiles: 7400 },
  { year: 2018, avgMiles: 7400 },
  { year: 2019, avgMiles: 7400 },
  { year: 2020, avgMiles: 5300 },
  { year: 2021, avgMiles: 6400 },
  { year: 2022, avgMiles: 7000 },
  { year: 2023, avgMiles: 7100 },
  { year: 2024, avgMiles: 7200 },
];

export interface MileageByAge {
  ageGroup: string;
  avgMiles: number;
}

export const mileageByAgeData: MileageByAge[] = [
  { ageGroup: "0-1 years", avgMiles: 12500 },
  { ageGroup: "1-3 years", avgMiles: 10800 },
  { ageGroup: "3-5 years", avgMiles: 9200 },
  { ageGroup: "5-7 years", avgMiles: 8100 },
  { ageGroup: "7-9 years", avgMiles: 7200 },
  { ageGroup: "9-11 years", avgMiles: 6500 },
  { ageGroup: "11-13 years", avgMiles: 5800 },
  { ageGroup: "13+ years", avgMiles: 4200 },
];

export const lastUpdated = "2024";
export const source = "https://www.gov.uk/government/statistics/national-travel-survey-2023";
