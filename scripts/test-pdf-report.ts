/**
 * Smoke-test the PDF report generator with a deliberately km-recorded vehicle
 * and a valuation that carries estimatedValue — to verify the two production
 * fixes: (1) single estimate + "Typical range" + ±X% headline, and (2) km→miles
 * conversion in the cover, mileage progression and MOT history.
 *
 * Run: npx tsx scripts/test-pdf-report.ts
 */
import { writeFileSync } from "node:fs";
import { generateVehicleReport, type ReportInput } from "../src/lib/generateReport";
import { odometerMiles } from "../src/lib/valuation";

// km readings — newest first. Expected miles via the shared helper:
const KM = [96000, 80000, 64000, 48000];
const MILES = KM.map((v) => odometerMiles({ value: v, unit: "km" }));
console.log("km →", KM.join(", "));
console.log("expected miles →", MILES.join(", "));

const motTests = KM.map((km, i) => ({
  completedDate: `${2025 - i}-04-12T09:00:00.000Z`,
  testResult: (i === 1 ? "FAILED" : "PASSED") as "PASSED" | "FAILED",
  expiryDate: `${2026 - i}-04-12`,
  odometer: { value: km, unit: "km" },
  motTestNumber: `1234 5678 90${i}0`,
  rfrAndComments:
    i === 1
      ? [{ text: "Brake disc worn", type: "ADVISORY" as const }]
      : [],
}));

const input: ReportInput = {
  data: {
    registrationNumber: "AB12CDE",
    make: "BMW",
    model: "320D M SPORT",
    colour: "Grey",
    fuelType: "DIESEL",
    engineCapacity: 1995,
    yearOfManufacture: 2019,
    taxStatus: "Taxed",
    taxDueDate: "2026-09-01",
    motStatus: "Valid",
    motExpiryDate: "2026-04-12",
    co2Emissions: 120,
    motTests,
  },
  motInsights: {
    passRate: 75,
    passedTests: 3,
    totalTests: 4,
    avgMilesPerYear: 9942, // ~ (59652-? ) realistic
    mileageTrend: "typical",
    mileageWarnings: [],
    latestMileage: odometerMiles({ value: 96000, unit: "km" }), // pre-converted, as the app does
    daysUntilExpiry: 315,
    recurringAdvisories: [],
  },
  checklist: {
    owner: ["Check service history", "Verify V5C matches"],
    buyer: ["Inspect brake discs", "Confirm cambelt history"],
    seller: ["Gather receipts"],
  },
  vedResult: { estimatedAnnualRate: 190, estimatedSixMonthRate: 104.5, band: null, details: "Standard rate" },
  fuelEconomy: { combinedMpg: 56, estimatedAnnualCost: 1180 },
  healthScore: {
    score: 78,
    grade: "B",
    label: "Good",
    breakdown: [{ category: "MOT", score: 18, maxScore: 25, detail: "One failure on record" }],
  },
  motReadiness: {
    score: "amber",
    label: "Minor work likely",
    advisoryCount: 1,
    daysUntilMot: 315,
    totalEstimatedCost: { low: 80, high: 180 },
    riskItems: [
      { risk: "medium", categoryLabel: "Brakes", text: "Brake disc worn", isRecurring: false, estimatedCost: { low: 80, high: 180 } },
    ],
  },
  valuation: {
    rangeLow: 7600,
    rangeHigh: 10300,
    confidence: "medium",
    estimatedValue: 8950,
    sources: ["Depreciation model", "Live listings", "MarketCheck"],
    ebayMinPrice: 7200,
    ebayMaxPrice: 11500,
    ebayTotalListings: 34,
    ebayDominantTransmission: "Automatic",
    ebayDominantBodyType: "Saloon",
    marketSupply: "good",
    mileageAdjustmentPercent: -4,
    conditionAdjustmentPercent: 0,
    colourAdjustmentPercent: 0,
  },
  ownershipCost: {
    totalAnnual: 3850,
    costPerMile: 0.42,
    breakdown: { fuel: 1180, ved: 190, depreciation: 1900, mot: 55, maintenance: 525 },
    excludedNote: "Excludes: insurance, parking.",
  },
  ukAverageCost: 4100,
  ukAverageLabel: "Premium Car",
};

(async () => {
  const blob = await generateVehicleReport(input);
  const buf = Buffer.from(await blob.arrayBuffer());
  const out = "/tmp/fpc-test-report.pdf";
  writeFileSync(out, buf);
  console.log(`\nwrote ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
})();
