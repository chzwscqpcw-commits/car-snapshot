// Annual cost of motoring breakdown (£ per year, average car)
// Sources: RAC/AA reports, ONS CPI data

export interface MotoringCostYear {
  year: number;
  fuel: number;
  insurance: number;
  depreciation: number;
  ved: number;
  servicing: number;
}

export const costOfMotoringData: MotoringCostYear[] = [
  { year: 2010, fuel: 1820, insurance: 890, depreciation: 2200, ved: 195, servicing: 580 },
  { year: 2011, fuel: 2150, insurance: 1020, depreciation: 2350, ved: 200, servicing: 600 },
  { year: 2012, fuel: 2180, insurance: 950, depreciation: 2280, ved: 205, servicing: 620 },
  { year: 2013, fuel: 2160, insurance: 880, depreciation: 2200, ved: 210, servicing: 640 },
  { year: 2014, fuel: 2050, insurance: 860, depreciation: 2180, ved: 215, servicing: 660 },
  { year: 2015, fuel: 1780, insurance: 820, depreciation: 2300, ved: 220, servicing: 680 },
  { year: 2016, fuel: 1720, insurance: 850, depreciation: 2380, ved: 225, servicing: 700 },
  { year: 2017, fuel: 1850, insurance: 860, depreciation: 2420, ved: 230, servicing: 720 },
  { year: 2018, fuel: 1960, insurance: 820, depreciation: 2500, ved: 235, servicing: 740 },
  { year: 2019, fuel: 1980, insurance: 780, depreciation: 2600, ved: 240, servicing: 760 },
  { year: 2020, fuel: 1380, insurance: 750, depreciation: 2100, ved: 245, servicing: 680 },
  { year: 2021, fuel: 1850, insurance: 780, depreciation: 1900, ved: 250, servicing: 720 },
  { year: 2022, fuel: 2580, insurance: 850, depreciation: 2400, ved: 255, servicing: 780 },
  { year: 2023, fuel: 2320, insurance: 980, depreciation: 2800, ved: 260, servicing: 810 },
  { year: 2024, fuel: 2240, insurance: 1050, depreciation: 2650, ved: 265, servicing: 840 },
  { year: 2025, fuel: 2180, insurance: 1120, depreciation: 2550, ved: 270, servicing: 860 },
];

export const lastUpdated = "2025";
export const source = "https://www.racfoundation.org/motoring-faqs/running-costs";
