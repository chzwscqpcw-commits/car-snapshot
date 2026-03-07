// UK Vehicle Excise Duty (VED / road tax) rates history
// Source: HMRC/DVLA budget documents

export interface VedBandYear {
  year: number;
  bandA: number;  // 0 g/km CO2
  bandB: number;  // 1-50
  bandD: number;  // 76-90
  bandG: number;  // 131-150
  bandK: number;  // 186-200
  bandM: number;  // 226-255+
}

export const vedBandData: VedBandYear[] = [
  { year: 2001, bandA: 0, bandB: 0, bandD: 100, bandG: 150, bandK: 170, bandM: 160 },
  { year: 2002, bandA: 0, bandB: 0, bandD: 100, bandG: 150, bandK: 170, bandM: 160 },
  { year: 2003, bandA: 0, bandB: 0, bandD: 100, bandG: 155, bandK: 175, bandM: 165 },
  { year: 2004, bandA: 0, bandB: 0, bandD: 100, bandG: 160, bandK: 180, bandM: 185 },
  { year: 2005, bandA: 0, bandB: 0, bandD: 100, bandG: 165, bandK: 190, bandM: 210 },
  { year: 2006, bandA: 0, bandB: 0, bandD: 100, bandG: 170, bandK: 200, bandM: 255 },
  { year: 2007, bandA: 0, bandB: 0, bandD: 100, bandG: 170, bandK: 210, bandM: 300 },
  { year: 2008, bandA: 0, bandB: 0, bandD: 95, bandG: 175, bandK: 225, bandM: 370 },
  { year: 2009, bandA: 0, bandB: 0, bandD: 90, bandG: 175, bandK: 240, bandM: 440 },
  { year: 2010, bandA: 0, bandB: 20, bandD: 95, bandG: 180, bandK: 245, bandM: 460 },
  { year: 2011, bandA: 0, bandB: 20, bandD: 100, bandG: 185, bandK: 250, bandM: 475 },
  { year: 2012, bandA: 0, bandB: 20, bandD: 100, bandG: 190, bandK: 260, bandM: 490 },
  { year: 2013, bandA: 0, bandB: 20, bandD: 100, bandG: 190, bandK: 265, bandM: 500 },
  { year: 2014, bandA: 0, bandB: 20, bandD: 100, bandG: 195, bandK: 270, bandM: 505 },
  { year: 2015, bandA: 0, bandB: 20, bandD: 105, bandG: 200, bandK: 275, bandM: 510 },
  { year: 2016, bandA: 0, bandB: 20, bandD: 110, bandG: 200, bandK: 280, bandM: 515 },
  { year: 2017, bandA: 0, bandB: 10, bandD: 110, bandG: 200, bandK: 280, bandM: 515 },
  { year: 2018, bandA: 0, bandB: 10, bandD: 115, bandG: 210, bandK: 290, bandM: 535 },
  { year: 2019, bandA: 0, bandB: 10, bandD: 120, bandG: 215, bandK: 300, bandM: 555 },
  { year: 2020, bandA: 0, bandB: 10, bandD: 125, bandG: 220, bandK: 310, bandM: 570 },
  { year: 2021, bandA: 0, bandB: 10, bandD: 130, bandG: 225, bandK: 320, bandM: 580 },
  { year: 2022, bandA: 0, bandB: 10, bandD: 135, bandG: 230, bandK: 325, bandM: 585 },
  { year: 2023, bandA: 0, bandB: 10, bandD: 140, bandG: 240, bandK: 340, bandM: 600 },
  { year: 2024, bandA: 0, bandB: 10, bandD: 145, bandG: 245, bandK: 350, bandM: 620 },
  { year: 2025, bandA: 10, bandB: 10, bandD: 150, bandG: 250, bandK: 360, bandM: 640 },
];

export interface VedFirstYearRate {
  year: number;
  zeroCo2: number;
  low: number;      // 1-50 g/km
  mid: number;      // 101-150 g/km
  high: number;     // 171-190 g/km
  veryHigh: number; // 255+ g/km
}

export const vedFirstYearData: VedFirstYearRate[] = [
  { year: 2017, zeroCo2: 0, low: 10, mid: 160, high: 800, veryHigh: 2000 },
  { year: 2018, zeroCo2: 0, low: 10, mid: 165, high: 815, veryHigh: 2070 },
  { year: 2019, zeroCo2: 0, low: 10, mid: 170, high: 855, veryHigh: 2135 },
  { year: 2020, zeroCo2: 0, low: 10, mid: 175, high: 870, veryHigh: 2175 },
  { year: 2021, zeroCo2: 0, low: 10, mid: 180, high: 885, veryHigh: 2245 },
  { year: 2022, zeroCo2: 0, low: 10, mid: 185, high: 900, veryHigh: 2365 },
  { year: 2023, zeroCo2: 0, low: 10, mid: 190, high: 920, veryHigh: 2605 },
  { year: 2024, zeroCo2: 0, low: 10, mid: 195, high: 940, veryHigh: 2745 },
  { year: 2025, zeroCo2: 10, low: 10, mid: 200, high: 960, veryHigh: 2745 },
];

export const lastUpdated = "April 2025";
export const source = "https://www.gov.uk/government/publications/vehicle-excise-duty";
