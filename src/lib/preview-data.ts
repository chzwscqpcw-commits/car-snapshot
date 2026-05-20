import type { LookupVehicle } from "@/components/tools/shared";

/**
 * Sample vehicle used by /preview/[tool] routes for screenshot generation
 * and (in dev) browsing the bare tool result UI without hitting DVLA.
 *
 * Chosen to be a real, common UK car so the secondary APIs (eBay valuation,
 * recalls, fuel economy) all return realistic data on top of these fields.
 * 2018 Ford Fiesta 1.0 EcoBoost Petrol — top-3 UK car, Euro 6, ULEZ-compliant,
 * with a representative MOT history covering passes + an advisory.
 */
export const PREVIEW_VEHICLE: LookupVehicle = {
  registrationNumber: "FA18 PLC",
  make: "FORD",
  model: "FIESTA",
  colour: "BLUE",
  fuelType: "PETROL",
  engineCapacity: 998,
  yearOfManufacture: 2018,
  monthOfFirstRegistration: "2018-03",
  euroStatus: "EURO 6",
  co2Emissions: 105,
  taxStatus: "Taxed",
  taxDueDate: "2026-08-30",
  motStatus: "Valid",
  motExpiryDate: "2026-09-15",
  motTests: [
    {
      completedDate: "2025-09-10T11:15:00.000Z",
      testResult: "PASSED",
      expiryDate: "2026-09-15",
      odometer: { value: 64218, unit: "MI" },
      motTestNumber: "112233445566",
      rfrAndComments: [
        {
          text: "Nearside front tyre worn close to the legal limit (5.2.3 (e))",
          type: "ADVISORY",
        },
      ],
    },
    {
      completedDate: "2024-09-05T10:30:00.000Z",
      testResult: "PASSED",
      expiryDate: "2025-09-05",
      odometer: { value: 53412, unit: "MI" },
      motTestNumber: "998877665544",
      rfrAndComments: [],
    },
    {
      completedDate: "2023-09-02T09:45:00.000Z",
      testResult: "PASSED",
      expiryDate: "2024-09-02",
      odometer: { value: 41985, unit: "MI" },
      motTestNumber: "445566778899",
      rfrAndComments: [
        {
          text: "Brake disc worn but within limits (1.1.14 (a) (i))",
          type: "ADVISORY",
        },
      ],
    },
    {
      completedDate: "2022-09-01T14:20:00.000Z",
      testResult: "PASSED",
      expiryDate: "2023-09-01",
      odometer: { value: 30201, unit: "MI" },
      motTestNumber: "223344556677",
      rfrAndComments: [],
    },
    {
      completedDate: "2021-08-30T13:00:00.000Z",
      testResult: "PASSED",
      expiryDate: "2022-09-01",
      odometer: { value: 18445, unit: "MI" },
      motTestNumber: "667788990011",
      rfrAndComments: [],
    },
  ],
};

/** Slugs accepted by the /preview/[tool] route — kept in one place. */
export const PREVIEW_TOOL_SLUGS = [
  "tax-check",
  "mot-check",
  "mileage-check",
  "ulez-check",
  "recall-check",
  "car-valuation",
  "running-costs",
] as const;

export type PreviewToolSlug = (typeof PREVIEW_TOOL_SLUGS)[number];
