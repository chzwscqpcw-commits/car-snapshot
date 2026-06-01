/**
 * PDF report smoke-test — self-asserting, zero external dependencies.
 *
 * Drives the production `generateVehicleReport` module headlessly with a
 * representative (deliberately km-recorded) vehicle plus a valuation that
 * carries `estimatedValue`, then asserts on the generated PDF to guard the two
 * report behaviours that have regressed before:
 *
 *   1. Valuation headline mirrors the website — a single estimated value as the
 *      hero figure, the typical range beneath, and a ±X% on the confidence chip
 *      (NOT the range as the headline).
 *   2. km→miles — MOT odometer readings recorded in km are converted before
 *      display/maths, so the report can never overstate mileage.
 *
 * jsPDF emits uncompressed content streams, so the rendered text is present as
 * ASCII in the raw PDF buffer — we assert directly on it, no poppler/pdftotext
 * required (keeps CI dependency-free). Exits non-zero on any failure.
 *
 * Run: npx tsx scripts/test-pdf-report.ts   (or: npm run test:pdf)
 */
import { writeFileSync } from "node:fs";
import { generateVehicleReport, type ReportInput } from "../src/lib/generateReport";
import { odometerMiles } from "../src/lib/valuation";

// km readings — newest first. Expected miles via the shared helper.
const KM = [96000, 80000, 64000, 48000];
const MILES = KM.map((v) => odometerMiles({ value: v, unit: "km" }));

const motTests = KM.map((km, i) => ({
  completedDate: `${2025 - i}-04-12T09:00:00.000Z`,
  testResult: (i === 1 ? "FAILED" : "PASSED") as "PASSED" | "FAILED",
  expiryDate: `${2026 - i}-04-12`,
  odometer: { value: km, unit: "km" },
  motTestNumber: `1234 5678 90${i}0`,
  rfrAndComments: i === 1 ? [{ text: "Brake disc worn", type: "ADVISORY" as const }] : [],
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
    avgMilesPerYear: 9942,
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

// ── Assertion harness ──────────────────────────────────────────────────────
const failures: string[] = [];
function check(label: string, ok: boolean) {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failures.push(label);
}

(async () => {
  // Sanity-check the shared helper itself before trusting the report.
  console.log("odometerMiles helper:");
  check("96,000 km → 59,652 mi", odometerMiles({ value: 96000, unit: "km" }) === 59652);
  check("50,000 mi passes through unchanged", odometerMiles({ value: 50000, unit: "mi" }) === 50000);
  check("null reading → null", odometerMiles(null) === null);

  const blob = await generateVehicleReport(input);
  const buf = Buffer.from(await blob.arrayBuffer());
  const pdf = buf.toString("latin1"); // uncompressed → text is ASCII in the stream

  console.log("\nPDF generated:");
  check("valid PDF header", pdf.startsWith("%PDF"));
  check("non-trivial size (>20 KB)", buf.length > 20_000);

  console.log("\nValuation headline (single estimate + range + ±%):");
  check("hero figure 8,950 present", pdf.includes("8,950"));
  check('"Typical range" label present', pdf.includes("Typical range"));
  check("range bounds 7,600 and 10,300 present", pdf.includes("7,600") && pdf.includes("10,300"));
  check("confidence chip shows ±% (15%)", pdf.includes("15%"));
  check("Medium confidence label present", pdf.includes("Medium confidence"));

  console.log("\nkm→miles conversion (converted miles present, raw km absent):");
  for (const mi of MILES) check(`${mi!.toLocaleString()} mi present`, pdf.includes(mi!.toLocaleString()));
  for (const km of KM) check(`raw ${km.toLocaleString()} km ABSENT`, !pdf.includes(km.toLocaleString()));
  check("year-on-year diff +9,942 (computed from miles)", pdf.includes("+9,942"));

  console.log("\nRunning-costs consistency:");
  check("total 3,850 present", pdf.includes("3,850"));
  check("insurance exclusion noted", pdf.includes("Excludes: insurance"));

  // Write artefact for local inspection (harmless in CI).
  const out = "/tmp/fpc-test-report.pdf";
  try { writeFileSync(out, buf); console.log(`\nartefact: ${out} (${(buf.length / 1024).toFixed(1)} KB)`); } catch { /* read-only fs in CI is fine */ }

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} assertion(s) failed:`);
    for (const f of failures) console.error(`   - ${f}`);
    process.exit(1);
  }
  console.log("\n✅ All PDF report assertions passed.");
  process.exit(0);
})().catch((err) => {
  console.error("\n❌ PDF smoke-test threw:", err);
  process.exit(1);
});
