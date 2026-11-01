/**
 * The dataset registry: one record for every file in src/data/.
 *
 * It is plain data with no Node imports, so it is read from both sides:
 *   - the app: /api/data-health, /about/data and the "Data as of" lines;
 *   - the scripts: validate-data.ts (shape + delta checks), check-freshness.ts,
 *     build-freshness-manifest.ts and data-due.ts.
 *
 * Before this existed the same facts (thresholds, refresh hints, source URLs)
 * lived in three places that had drifted — recalls was "90 days, automatable"
 * in one table and "180 days, semi-auto" in another — and the seven hand-run
 * datasets had no due date anywhere. scripts/test-data-registry.ts fails when
 * a file in src/data/ is missing here or an entry points at a file that is
 * gone, so the registry cannot drift the way the tables did.
 *
 * Two different clocks, deliberately:
 *   - `thresholdDays` is about CONTENT: how old the committed file may get
 *     before the figures it holds are presented as more current than they are.
 *     The refresh jobs commit only when a file changes, so a weekly job over a
 *     yearly dataset (VCA fuel economy) leaves the file's date alone for
 *     months, and that is fine.
 *   - `method` + the job's last run (read from GitHub by the Friday audit) is
 *     about the PIPELINE: did the thing that should refresh this actually run.
 *   Twelve weeks of silent failure in 2026 slipped between those two clocks,
 *   because only the first was watched.
 */

/** How the committed file gets refreshed. */
export type RefreshMethod =
  | `workflow:${string}` // a GitHub Actions workflow in .github/workflows/
  | "prebuild" // fetched by `npm run prebuild` on every deploy (none since 2026-11)
  | `vercel-cron:${string}` // a Vercel cron route (none since 2026-11)
  | "manual"; // a person runs the command in `refreshHint`

export type Cadence = "weekly" | "monthly" | "quarterly" | "annual" | "as-needed";

/**
 * Bands for the comparison with the previously committed version. Every
 * fraction is of the previous value; a dataset that goes outside a band is
 * `review`, outside a fail band is `fail` (see scripts/lib/validators.ts).
 */
export interface DeltaRules {
  /** Allowed entry-count change either way. Default 0.2. */
  countBand?: number;
  /** Beyond this the count change is treated as impossible for one refresh. Default 0.5. */
  countFailBand?: number;
  /** Largest share of previous keys (makes, models, areas, recall numbers) that may vanish. Default 0.1. */
  keyShrinkBand?: number;
  /** Allowed change in each headline figure. Default 0.2. */
  headlineBand?: number;
  /** Per-headline overrides, keyed by the headline's name. */
  headlineBands?: Record<string, number>;
}

export interface DatasetEntry {
  /** File name inside src/data/, e.g. "recalls.json" or "caz-zones.ts". */
  file: string;
  kind: "json" | "module";
  label: string;
  source: { name: string; url: string | null };
  method: RefreshMethod;
  cadence: Cadence;
  /** ISO date the next hand refresh is due. Manual datasets only. */
  nextDue?: string;
  /** For manual datasets with no date: when a refresh is called for. */
  dueRule?: string;
  /** Age in days past which the committed file counts as stale. */
  thresholdDays: number;
  /** The exact command (or steps) that refreshes the file. */
  refreshHint: string;
  /** Validator name in scripts/lib/validators.ts. */
  validator: string;
  /** null = no comparison with the previous version (hand-written modules). */
  deltaRules: DeltaRules | null;
  /** Pages and features that read this file. */
  feeds: string[];
  /** The period the figures cover, when it is fixed (an annual release). */
  covers?: string;
}

const DFT_LICENSING =
  "https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-files";
const DVSA_MOT_BULK =
  "https://www.data.gov.uk/dataset/e3939ef8-30c7-4ca8-9c7c-ad9475cc9b2f/anonymised-mot-tests-and-results";
const MOT_BULK_HINT =
  "Download the year's results, failure-item and lookup zips from data.gov.uk (~12 GB unzipped), then: .venv/bin/python scripts/process-mot-bulk.py <dir> <year> (writes mot-pass-rates.json + mot-failure-reasons.json) and .venv/bin/python scripts/process-mot-areas.py <results-dir> <items-dir> <lookup-dir> <year> (writes mot-areas.json). One-off: python3 -m venv .venv && .venv/bin/pip install duckdb. Update UK_AVERAGE_PASS_RATE in src/lib/mot-pass-rate.ts to the printed figure.";
const THEFT_HINT =
  "Email foi@dvla.gov.uk in September asking for FOIR13058 (vehicles recorded as stolen by make/model and year) extended to the latest full year; download df_VEH0120_UK.csv (and VEH0124_AM/NZ) from the DfT licensing page; then: .venv/bin/python scripts/process-theft-foi.py <FOIR13058.xlsx> <df_VEH0120_UK.csv> [<VEH0124_AM.csv> <VEH0124_NZ.csv>] (writes theft-risk.json, theft-risk-vans.json, theft-stats.json).";

export const DATASETS: DatasetEntry[] = [
  // ── Weekly jobs ─────────────────────────────────────────────────────────
  {
    file: "recalls.json",
    kind: "json",
    label: "DVSA safety recalls",
    source: { name: "DVSA Vehicle Recalls", url: "https://www.check-vehicle-recalls.service.gov.uk" },
    method: "workflow:refresh-data.yml",
    cadence: "weekly",
    thresholdDays: 30,
    refreshHint: "Sundays via .github/workflows/refresh-data.yml. By hand: npx tsx scripts/fetch-recalls.ts (needs Chrome; drives the Imperva-protected download).",
    validator: "validateRecalls",
    deltaRules: { countBand: 0.1, keyShrinkBand: 0.05, headlineBand: 0.1 },
    feeds: ["Results page recalls", "/recall-check", "/api/recalls", "My Cars recall alerts", "Buyer's check"],
  },
  {
    file: "fuel-economy.json",
    kind: "json",
    label: "VCA fuel economy",
    source: { name: "VCA Car Fuel Data", url: "https://carfueldata.vehicle-certification-agency.gov.uk/downloads/default.aspx" },
    method: "workflow:refresh-data.yml",
    cadence: "weekly",
    // VCA adds a car-year around September; the file changes a few times a
    // year even though the job runs weekly.
    thresholdDays: 400,
    refreshHint: "Sundays via refresh-data.yml. By hand: npx tsx scripts/fetch-vca-archive.ts && npx tsx scripts/process-fuel-data.ts vca-csvs/*.csv",
    validator: "validateFuelEconomy",
    deltaRules: { countBand: 0.15, keyShrinkBand: 0.05 },
    feeds: ["Running costs (mpg)", "/api/fuel-economy", "Results page economy"],
  },
  {
    file: "ncap-ratings.json",
    kind: "json",
    label: "Euro NCAP crash ratings",
    source: { name: "Euro NCAP", url: "https://www.euroncap.com" },
    method: "workflow:refresh-data.yml",
    cadence: "weekly",
    thresholdDays: 120,
    refreshHint: "Sundays via refresh-data.yml. By hand: npx tsx scripts/fetch-ncap-ratings.ts (needs Chrome).",
    validator: "validateNcapRatings",
    deltaRules: { countBand: 0.15, keyShrinkBand: 0.05 },
    feeds: ["Results page safety rating", "Model guides"],
  },
  {
    file: "new-car-price-index.json",
    kind: "json",
    label: "ONS new-car price index",
    source: { name: "ONS MM23 series D7E8 (CPI new cars, 2015=100)", url: "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7e8/mm23/data" },
    method: "workflow:refresh-data.yml",
    cadence: "monthly",
    thresholdDays: 60,
    refreshHint: "Sundays via refresh-data.yml. By hand: npx tsx scripts/fetch-new-car-price-index.ts",
    validator: "validateNewCarPriceIndex",
    deltaRules: { countBand: 0.1, headlineBand: 0.1 },
    feeds: ["Valuation (deflates today's list price to the registration year)"],
  },
  {
    file: "new-prices.json",
    kind: "json",
    label: "New-car list prices",
    source: { name: "Parkers reviews", url: "https://www.parkers.co.uk" },
    method: "workflow:refresh-prices.yml",
    cadence: "weekly",
    thresholdDays: 45,
    refreshHint: "Wednesdays via .github/workflows/refresh-prices.yml (incremental). By hand: npx tsx scripts/fetch-new-prices.ts --budget-minutes=45 (needs Chrome).",
    validator: "validateNewPrices",
    deltaRules: { countBand: 0.3, keyShrinkBand: 0.15 },
    feeds: ["Valuation start price", "Model guides", "Running costs"],
  },
  {
    file: "ev-specs.json",
    kind: "json",
    label: "EV battery and range specs",
    source: { name: "EV Database", url: "https://ev-database.org" },
    method: "workflow:refresh-prices.yml",
    cadence: "weekly",
    thresholdDays: 45,
    refreshHint: "Wednesdays via refresh-prices.yml (incremental). By hand: npx tsx scripts/fetch-ev-specs.ts --budget-minutes=15 (needs Chrome).",
    validator: "validateEvSpecs",
    deltaRules: { countBand: 0.3, keyShrinkBand: 0.15 },
    feeds: ["Results page EV specs", "Running costs (electric)"],
  },

  // ── Weekly job too (moved out of the prebuild in 2026-11, so a gov.uk
  //    outage can no longer fail a deploy) ─────────────────────────────────
  {
    file: "fuel-prices-weekly.json",
    kind: "json",
    label: "Weekly road fuel prices",
    source: { name: "DESNZ weekly road fuel prices", url: "https://www.gov.uk/government/statistics/weekly-road-fuel-prices" },
    method: "workflow:refresh-data.yml",
    cadence: "weekly",
    thresholdDays: 21,
    refreshHint: "Sundays via refresh-data.yml. By hand: npx tsx scripts/fetch-fuel-prices.ts",
    validator: "validateFuelPricesWeekly",
    deltaRules: { countBand: 0.05, headlineBand: 0.15 },
    feeds: ["/stats/fuel-prices", "/api/fuel-prices", "Running costs"],
  },
  {
    file: "how-many-left.json",
    kind: "json",
    label: "How Many Left (licensed and SORN by model)",
    source: { name: "DfT VEH0120", url: DFT_LICENSING },
    method: "workflow:refresh-data.yml",
    cadence: "quarterly",
    thresholdDays: 150,
    refreshHint: "Sundays via refresh-data.yml (DfT publish quarterly; commits only when the file changes). By hand: npx tsx scripts/fetch-how-many-left.ts",
    validator: "validateHowManyLeft",
    deltaRules: { countBand: 0.1, keyShrinkBand: 0.05, headlineBand: 0.15 },
    feeds: ["/stats/how-many-left", "Results page rarity", "Theft rates (denominator)"],
  },

  // ── Monthly job ─────────────────────────────────────────────────────────
  {
    file: "model-price-calibration.json",
    kind: "json",
    label: "Valuation start-price calibration",
    source: { name: "Free Plate Check valuation telemetry (eBay comparables)", url: null },
    method: "workflow:calibrate-valuations.yml",
    cadence: "monthly",
    thresholdDays: 45,
    refreshHint: "2nd of the month via .github/workflows/calibrate-valuations.yml (opens a PR for review). By hand: npx tsx scripts/calibrate-model-prices.ts --days=120",
    validator: "validateModelPriceCalibration",
    deltaRules: { countBand: 0.2, keyShrinkBand: 0.1 },
    feeds: ["Valuation (market-calibrated start price per model family)"],
  },

  // ── Annual, by hand ─────────────────────────────────────────────────────
  {
    file: "mot-pass-rates.json",
    kind: "json",
    label: "MOT first-time pass rates by model",
    source: { name: "DVSA anonymised MOT results", url: DVSA_MOT_BULK },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-05-15",
    thresholdDays: 400,
    refreshHint: MOT_BULK_HINT,
    validator: "validateMotPassRates",
    deltaRules: { countBand: 0.2, keyShrinkBand: 0.1, headlineBand: 0.05 },
    feeds: ["/stats/mot-pass-rates", "/stats/most-reliable-cars", "Results page pass rate", "Buyer's check"],
    covers: "2023 test year",
  },
  {
    file: "mot-failure-reasons.json",
    kind: "json",
    label: "Top MOT failure areas by model",
    source: { name: "DVSA anonymised MOT results", url: DVSA_MOT_BULK },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-05-15",
    thresholdDays: 400,
    refreshHint: MOT_BULK_HINT,
    validator: "validateMotFailureReasons",
    deltaRules: { countBand: 0.2, keyShrinkBand: 0.1 },
    feeds: ["Results page common failures", "/stats/mot-pass-rates"],
    covers: "2023 test year",
  },
  {
    file: "mot-areas.json",
    kind: "json",
    label: "MOT results by postcode area",
    source: { name: "DVSA anonymised MOT results", url: DVSA_MOT_BULK },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-05-15",
    thresholdDays: 400,
    refreshHint: MOT_BULK_HINT,
    validator: "validateMotAreas",
    deltaRules: { countBand: 0.1, keyShrinkBand: 0.05, headlineBand: 0.1, headlineBands: { nationalPassRate: 0.05 } },
    feeds: ["/mot-prices/[town]"],
    covers: "2024 test year",
  },
  {
    file: "theft-risk.json",
    kind: "json",
    label: "Car theft rates by model",
    source: { name: "DVLA FOI FOIR13058 ÷ DfT VEH0120", url: DFT_LICENSING },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-09-01",
    thresholdDays: 400,
    refreshHint: THEFT_HINT,
    validator: "validateTheftRisk",
    deltaRules: { countBand: 0.2, keyShrinkBand: 0.1 },
    feeds: ["Results page theft rating", "Buyer's check", "/stats/car-theft", "/stats/least-stolen-cars"],
    covers: "2025 calendar year",
  },
  {
    file: "theft-risk-vans.json",
    kind: "json",
    label: "Van theft rates by model",
    source: { name: "DVLA FOI FOIR13058 ÷ DfT VEH0120", url: DFT_LICENSING },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-09-01",
    thresholdDays: 400,
    refreshHint: THEFT_HINT,
    validator: "validateTheftRiskVans",
    deltaRules: { countBand: 0.2, keyShrinkBand: 0.1 },
    feeds: ["Results page theft rating (vans)", "/stats/van-theft"],
    covers: "2025 calendar year",
  },
  {
    file: "theft-stats.json",
    kind: "json",
    label: "Theft statistics (cars, vans, bikes)",
    source: { name: "DVLA FOI FOIR13058 ÷ DfT VEH0120", url: DFT_LICENSING },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-09-01",
    thresholdDays: 400,
    refreshHint: THEFT_HINT,
    validator: "validateTheftStats",
    deltaRules: { countBand: 0.2, headlineBand: 0.3 },
    feeds: ["/stats/car-theft", "/stats/van-theft", "/stats/motorbike-theft", "/stats/least-stolen-cars", "Stats hub"],
    covers: "2025 calendar year",
  },
  {
    file: "colour-popularity.json",
    kind: "json",
    label: "Car colour popularity",
    source: { name: "DfT VEH0206 (licensed cars by colour)", url: "https://www.gov.uk/government/statistical-data-sets/veh02-licensed-cars" },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-06-01",
    thresholdDays: 400,
    refreshHint: "Open the VEH0206 table on the DfT VEH02 page, take the latest year's share per colour, and edit src/data/colour-popularity.json (rank, share, label).",
    validator: "validateColourPopularity",
    deltaRules: { countBand: 0.2, keyShrinkBand: 0.1 },
    feeds: ["/stats/car-colours", "Results page colour fact"],
    covers: "2025",
  },
  {
    file: "body-types.json",
    kind: "json",
    label: "Body type by model",
    source: { name: "Curated (DfT VEH0220 stopped publishing body shapes in 2026)", url: "https://www.gov.uk/government/statistical-data-sets/veh02-licensed-cars" },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-02-11",
    thresholdDays: 400,
    refreshHint: "Add new models by hand to src/data/body-types.json from manufacturer specs. If DfT restore body shapes to VEH0220, run npx tsx scripts/fetch-body-types.ts (it refuses to write while the column only says \"Cars\").",
    validator: "validateBodyTypes",
    deltaRules: { countBand: 0.2, keyShrinkBand: 0.05 },
    feeds: ["Results page body type", "Model guides", "Theft and MOT lookups (model matching)"],
  },
  {
    file: "service-prices.json",
    kind: "json",
    label: "Typical MOT and service prices",
    source: { name: "GOV.UK MOT fee schedule and published garage price guides", url: "https://www.gov.uk/getting-an-mot/mot-test-fees" },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-05-29",
    thresholdDays: 400,
    refreshHint: "Re-check the legal maximum MOT fee and the published garage price guides listed in the file's _meta.sources, then edit src/data/service-prices.json (update _meta.compiled).",
    validator: "validateServicePrices",
    deltaRules: { countBand: 0.2, headlineBand: 0.2 },
    feeds: ["/booking savings", "/cheap-mot", "/mot-prices", "Servicing guides"],
  },
  {
    file: "tyre-sizes.json",
    kind: "json",
    label: "Tyre sizes by model",
    source: { name: "Manufacturer specification sheets", url: null },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-02-21",
    thresholdDays: 400,
    refreshHint: "Add new models to src/data/tyre-sizes.json from manufacturer specification sheets (sizes, boltPattern, centrebore).",
    validator: "validateTyreSizes",
    deltaRules: { countBand: 0.2, keyShrinkBand: 0.05 },
    feeds: ["Results page tyre sizes", "Model guides"],
  },
  {
    file: "vehicle-dimensions.json",
    kind: "json",
    label: "Vehicle dimensions by model",
    source: { name: "Manufacturer specification sheets", url: null },
    method: "manual",
    cadence: "annual",
    nextDue: "2027-02-21",
    thresholdDays: 400,
    refreshHint: "Add new models to src/data/vehicle-dimensions.json from manufacturer specification pages (length, width, height, wheelbase, kerb weight, boot).",
    validator: "validateVehicleDimensions",
    deltaRules: { countBand: 0.2, keyShrinkBand: 0.05 },
    feeds: ["Results page dimensions", "Model guides"],
  },

  // ── Hand-written modules ────────────────────────────────────────────────
  {
    file: "caz-zones.ts",
    kind: "module",
    label: "Clean Air Zones",
    source: { name: "Council and TfL scheme pages (GOV.UK Clean Air Zones)", url: "https://www.gov.uk/clean-air-zones" },
    method: "manual",
    cadence: "as-needed",
    dueRule: "When a zone launches, changes its charges or is withdrawn.",
    thresholdDays: 400,
    refreshHint: "Edit src/data/caz-zones.ts (charges, status, hours) against the council's scheme page.",
    validator: "validateCazZones",
    deltaRules: null,
    feeds: ["/clean-air-zones", "/ulez-check", "Results page ULEZ/CAZ"],
  },
  {
    file: "mot-locations.ts",
    kind: "module",
    label: "MOT price towns and regional bands",
    source: { name: "Editorial regional garage price bands; DVSA results via mot-areas.json", url: null },
    method: "manual",
    cadence: "as-needed",
    dueRule: "When the legal maximum MOT fee changes or a town is added.",
    thresholdDays: 400,
    refreshHint: "Edit src/data/mot-locations.ts (MOT_REGIONS price bands, MOT_TOWNS).",
    validator: "validateMotLocations",
    deltaRules: null,
    feeds: ["/mot-prices", "/mot-prices/[town]"],
  },
  {
    file: "did-you-know.ts",
    kind: "module",
    label: "Did-you-know facts",
    source: { name: "Editorial, drawn from the /stats pages", url: null },
    method: "manual",
    cadence: "as-needed",
    dueRule: "When a stats dataset it quotes is refreshed (fuel, theft, MOT).",
    thresholdDays: 400,
    refreshHint: "Edit src/data/did-you-know.ts; re-check any figure quoted from a dataset that has since been refreshed.",
    validator: "validateDidYouKnow",
    deltaRules: null,
    feeds: ["Homepage Did you know?", "Results page while loading"],
  },
  {
    file: "model-trivia.ts",
    kind: "module",
    label: "Make and model trivia",
    source: { name: "Editorial, web-researched and fact-checked (2026-06)", url: null },
    method: "manual",
    cadence: "as-needed",
    dueRule: "Add facts through the verify workflow only.",
    thresholdDays: 400,
    refreshHint: "Edit src/data/model-trivia.ts via the fun-facts verify workflow.",
    validator: "validateModelTrivia",
    deltaRules: null,
    feeds: ["Results page trivia", "Model guides"],
  },
];

export function datasetByFile(file: string): DatasetEntry | undefined {
  return DATASETS.find((d) => d.file === file);
}

/** The workflow file behind a `workflow:` method, else null. */
export function workflowOf(entry: DatasetEntry): string | null {
  return entry.method.startsWith("workflow:") ? entry.method.slice("workflow:".length) : null;
}

/** "Auto" for anything a job refreshes, "Manual" for a person. */
export function methodKind(method: RefreshMethod): "auto" | "manual" {
  return method === "manual" ? "manual" : "auto";
}

/** Plain-English method, for the dashboard and the public data page. */
export function describeMethod(entry: DatasetEntry): string {
  if (entry.method === "manual") return "Refreshed by hand";
  if (entry.method === "prebuild") return "Fetched on every deploy";
  if (entry.method.startsWith("vercel-cron:")) return `Vercel cron ${entry.method.slice("vercel-cron:".length)}`;
  const wf = workflowOf(entry) ?? "";
  if (wf === "refresh-data.yml") return "Weekly job (Sundays)";
  if (wf === "refresh-prices.yml") return "Weekly job (Wednesdays)";
  if (wf === "calibrate-valuations.yml") return "Monthly job (2nd of the month)";
  return `GitHub workflow ${wf}`;
}
