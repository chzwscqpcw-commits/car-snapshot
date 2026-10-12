import type { ReportInput } from "@/lib/generateReport";

// A sample report input for the preview-only sample route and the render test.
// It's the car from the approved design mockups (Oct 2026): a 2019 BMW 320d
// with four MOTs, one fail and one open brake advisory. Not a real vehicle.

const tests: NonNullable<ReportInput["data"]["motTests"]> = [
  { completedDate: "2026-04-12T09:00:00.000Z", testResult: "PASSED", expiryDate: "2027-04-11", odometer: { value: 59652, unit: "mi" }, motTestNumber: "1234 5678 9000", rfrAndComments: [{ text: "Nearside front brake disc worn, pitted or scored", type: "ADVISORY" }] },
  { completedDate: "2025-04-12T09:00:00.000Z", testResult: "FAILED", odometer: { value: 49710, unit: "mi" }, motTestNumber: "1234 5678 9010", rfrAndComments: [{ text: "Nearside front brake disc excessively worn", type: "DEFECT" }] },
  { completedDate: "2024-04-12T09:00:00.000Z", testResult: "PASSED", expiryDate: "2025-04-11", odometer: { value: 39768, unit: "mi" }, motTestNumber: "1234 5678 9020", rfrAndComments: [] },
  { completedDate: "2023-04-12T09:00:00.000Z", testResult: "PASSED", expiryDate: "2024-04-11", odometer: { value: 29826, unit: "mi" }, motTestNumber: "1234 5678 9030", rfrAndComments: [] },
];

export const SAMPLE_REPORT_INPUT: ReportInput = {
  data: {
    registrationNumber: "AB12CDE",
    make: "BMW",
    model: "320D M SPORT",
    colour: "Grey",
    fuelType: "DIESEL",
    engineCapacity: 1995,
    yearOfManufacture: 2019,
    taxStatus: "Taxed",
    taxDueDate: "2027-09-01",
    motStatus: "Valid",
    motExpiryDate: "2027-04-11",
    co2Emissions: 120,
    motTests: tests,
  },
  parsedModel: { bodyStyle: "Saloon", trim: "M Sport", driveType: null, fuelIndicator: "d", transmission: null, engineDesc: "2.0" },
  motInsights: {
    passRate: 75,
    passedTests: 3,
    totalTests: 4,
    avgMilesPerYear: 9942,
    mileageTrend: "typical",
    mileageWarnings: [],
    latestMileage: 59652,
    daysUntilExpiry: 181,
    recurringAdvisories: [],
  },
  checklist: {
    owner: ["Check service history", "Verify V5C matches"],
    buyer: ["Inspect front brake discs and pads", "Ask for the 2025 brake repair invoice"],
    seller: ["Gather service receipts"],
  },
  healthScore: {
    score: 78,
    grade: "B",
    label: "Good",
    breakdown: [
      { category: "MOT History", score: 18, maxScore: 25, detail: "One fail in four tests" },
      { category: "Advisories", score: 14, maxScore: 20, detail: "One brake advisory open" },
      { category: "Mileage Consistency", score: 15, maxScore: 15, detail: "No gaps or rollbacks" },
      { category: "Annual Mileage", score: 8, maxScore: 10, detail: "About 9,900 a year" },
      { category: "Safety Rating", score: 9, maxScore: 10, detail: "Euro NCAP 5 stars" },
      { category: "Recalls", score: 4, maxScore: 10, detail: "One recall to check" },
      { category: "MOT Currency", score: 5, maxScore: 5, detail: "Valid to April 2027" },
      { category: "ULEZ", score: 5, maxScore: 5, detail: "Compliant (Euro 6)" },
    ],
  },
  motReadiness: {
    score: "amber",
    label: "Minor work likely",
    advisoryCount: 1,
    daysUntilMot: 181,
    totalEstimatedCost: { low: 80, high: 180 },
    riskItems: [{ risk: "medium", categoryLabel: "Brakes", text: "Brake disc worn, pitted or scored", isRecurring: true, estimatedCost: { low: 80, high: 180 } }],
  },
  valuation: {
    rangeLow: 7600,
    rangeHigh: 10300,
    confidence: "medium",
    estimatedValue: 8950,
    sources: ["Depreciation model", "Live listings"],
    ebayMinPrice: 7200,
    ebayMaxPrice: 11500,
    ebayTotalListings: 34,
    marketSupply: "good",
  },
  ownershipCost: {
    totalAnnual: 3850,
    costPerMile: 0.39,
    breakdown: { fuel: 1180, ved: 190, depreciation: 1900, mot: 55, maintenance: 525 },
    excludedNote: "Excludes insurance and parking.",
  },
  vedResult: { estimatedAnnualRate: 190, estimatedSixMonthRate: 104.5, band: null, details: "Standard rate for cars registered after April 2017." },
  fuelEconomy: { combinedMpg: 56, urbanMpg: 47.1, extraUrbanMpg: 64.2, estimatedAnnualCost: 1180 },
  fuelPrices: { petrol: 132.4, diesel: 138.9, date: "2026-10-05" },
  ncapRating: { overallStars: 5, adultOccupant: 97, childOccupant: 87, pedestrian: 87, safetyAssist: 76, yearTested: 2019 },
  recalls: [{ recallDate: "2021-03-15", recallNumber: "R/2021/045", defect: "The steering column bolt may not have been tightened correctly.", remedy: "Dealer checks and tightens the bolt." }],
  ulezResult: { status: "compliant", confidence: "high", reason: "Diesel registered after September 2015 (Euro 6).", details: "" },
  motPassRate: { passRate: 74.6, testCount: 507550, aboveAverage: true, nationalAverage: 71.5, commonFailureReasons: ["Lighting & electrics", "Suspension", "Brakes"] },
  rarityResult: { licensed: 483387, sorn: 21650, total: 505037, category: "very-common" },
  colourPopularity: { rank: 1, share: 23.4, label: "Most popular colour", isTopFive: true },
  ukAverageCost: 4100,
  ukAverageLabel: "Premium car",
  theftRisk: { theftsPer1000: 2.7, rateMultiplier: 1.73, riskCategory: "moderate", theftCount: 1305, registeredCount: 483387, nationalAverage: 1.56, fleet: "cars" },
};
