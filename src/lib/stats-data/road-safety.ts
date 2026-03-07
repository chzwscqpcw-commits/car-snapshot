// UK road safety statistics
// Source: DfT STATS19

export interface RoadSafetyYear {
  year: number;
  fatalities: number;
  seriousInjuries?: number;
}

export const roadSafetyData: RoadSafetyYear[] = [
  { year: 1970, fatalities: 7499 },
  { year: 1975, fatalities: 6366 },
  { year: 1980, fatalities: 5953 },
  { year: 1983, fatalities: 5445 },
  { year: 1985, fatalities: 5165 },
  { year: 1988, fatalities: 5052 },
  { year: 1990, fatalities: 5217 },
  { year: 1992, fatalities: 4229 },
  { year: 1994, fatalities: 3807 },
  { year: 1996, fatalities: 3598 },
  { year: 1998, fatalities: 3421 },
  { year: 2000, fatalities: 3409, seriousInjuries: 38155 },
  { year: 2002, fatalities: 3431, seriousInjuries: 35976 },
  { year: 2004, fatalities: 3221, seriousInjuries: 31130 },
  { year: 2006, fatalities: 3172, seriousInjuries: 28673 },
  { year: 2007, fatalities: 2946, seriousInjuries: 27774 },
  { year: 2008, fatalities: 2538, seriousInjuries: 26034 },
  { year: 2009, fatalities: 2222, seriousInjuries: 24690 },
  { year: 2010, fatalities: 1857, seriousInjuries: 22660 },
  { year: 2011, fatalities: 1901, seriousInjuries: 23122 },
  { year: 2012, fatalities: 1754, seriousInjuries: 23039 },
  { year: 2013, fatalities: 1713, seriousInjuries: 21657 },
  { year: 2014, fatalities: 1775, seriousInjuries: 22807 },
  { year: 2015, fatalities: 1730, seriousInjuries: 22137 },
  { year: 2016, fatalities: 1792, seriousInjuries: 24101 },
  { year: 2017, fatalities: 1793, seriousInjuries: 24831 },
  { year: 2018, fatalities: 1784, seriousInjuries: 25511 },
  { year: 2019, fatalities: 1752, seriousInjuries: 25945 },
  { year: 2020, fatalities: 1460, seriousInjuries: 22069 },
  { year: 2021, fatalities: 1558, seriousInjuries: 23687 },
  { year: 2022, fatalities: 1695, seriousInjuries: 28031 },
  { year: 2023, fatalities: 1624, seriousInjuries: 27450 },
  { year: 2024, fatalities: 1590, seriousInjuries: 26800 },
];

export interface CasualtyByType {
  year: number;
  carOccupants: number;
  pedestrians: number;
  cyclists: number;
  motorcyclists: number;
}

export const casualtyByTypeData: CasualtyByType[] = [
  { year: 2015, carOccupants: 810, pedestrians: 398, cyclists: 100, motorcyclists: 365 },
  { year: 2016, carOccupants: 826, pedestrians: 448, cyclists: 102, motorcyclists: 359 },
  { year: 2017, carOccupants: 821, pedestrians: 470, cyclists: 101, motorcyclists: 349 },
  { year: 2018, carOccupants: 793, pedestrians: 456, cyclists: 99, motorcyclists: 354 },
  { year: 2019, carOccupants: 789, pedestrians: 432, cyclists: 100, motorcyclists: 365 },
  { year: 2020, carOccupants: 630, pedestrians: 346, cyclists: 141, motorcyclists: 308 },
  { year: 2021, carOccupants: 688, pedestrians: 361, cyclists: 111, motorcyclists: 357 },
  { year: 2022, carOccupants: 762, pedestrians: 385, cyclists: 91, motorcyclists: 380 },
  { year: 2023, carOccupants: 726, pedestrians: 370, cyclists: 85, motorcyclists: 368 },
  { year: 2024, carOccupants: 710, pedestrians: 358, cyclists: 82, motorcyclists: 362 },
];

export const safetyAnnotations = [
  { year: 1983, label: "Seatbelt law" },
  { year: 1992, label: "Speed cameras" },
  { year: 2007, label: "Mobile phone ban" },
  { year: 2015, label: "Euro NCAP 5★ standard" },
  { year: 2020, label: "COVID-19 lockdowns" },
];

export const lastUpdated = "2024";
export const source = "https://www.gov.uk/government/collections/road-accidents-and-safety-statistics";
