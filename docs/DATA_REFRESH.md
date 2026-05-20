# Data refresh guide

How to keep each data file in `src/data/` fresh. There are three tiers:

| Tier | What | Action |
|---|---|---|
| 🟢 **Auto** | Refreshed at every `npm run deploy` | None — just deploy |
| 🟡 **Manual-but-scripted** | Download CSV, run command, deploy | See per-file steps below |
| 🔴 **Pure curated** | No live source — hand-edit the JSON | Out of scope for routine refresh |

---

## 🟢 Auto-refreshed (no action needed)

| File | Source | When |
|---|---|---|
| `fuel-prices-weekly.json` | DESNZ Content API → `scripts/fetch-fuel-prices.ts` | Every deploy |
| `how-many-left.json` | DfT VEH0120 via Content API → `scripts/fetch-how-many-left.ts` | Every deploy |

After `npm run deploy`, both should show **0d** age in `/data-health`.

---

## 🟡 Manual-but-scripted (≈5-min refresh each)

Three files have processing scripts but their sources can't be safely auto-fetched. Each follows the same shape: **download a CSV → save in project root → run the script → commit + deploy**.

### 1. `recalls.json` — DVSA Vehicle Recalls

**Why manual?** DVSA's download endpoint is behind Imperva bot-protection. Browsers pass the JS challenge automatically; `curl` and Node `fetch` get a 302 to a challenge page.

**Step by step:**

1. Open **<https://www.check-vehicle-recalls.service.gov.uk>** in a real browser.
2. Click the "Download recalls data" / similar link to grab `RecallsFile.csv`.
3. Move the file to the project root (same folder as `package.json`):
   ```
   mv ~/Downloads/RecallsFile.csv ~/car-snapshot/RecallsFile.csv
   ```
4. From the project root, run:
   ```
   npx tsx scripts/process-recalls.ts
   ```
   This reads `RecallsFile.csv` and overwrites `src/data/recalls.json`.
5. Delete the source CSV (it's large, ~10 MB):
   ```
   rm RecallsFile.csv
   ```
6. Commit and deploy:
   ```
   git add src/data/recalls.json
   git commit -m "data: refresh DVSA recalls"
   npm run deploy
   ```

**Source URL:** <https://www.check-vehicle-recalls.service.gov.uk>
**Refresh cadence:** DVSA updates weekly. Once a month is plenty for our use case.

---

### 2. `fuel-economy.json` — VCA Car Fuel Data

**Why manual?** VCA publishes yearly CSV files via a downloads page that doesn't have a stable API. URL discovery would need a scraper.

**Step by step:**

1. Open **<https://carfueldata.vehicle-certification-agency.gov.uk/downloads/default.aspx>** in a browser.
2. Download the most recent "Car Fuel Data" CSVs (typically one per year — the last 2–3 years is plenty).
3. Move them to the project root. The filenames usually look like `CarFuelData2024.csv`:
   ```
   mv ~/Downloads/CarFuelData*.csv ~/car-snapshot/
   ```
4. From the project root, run:
   ```
   npx tsx scripts/process-fuel-data.ts CarFuelData*.csv
   ```
   The script deduplicates across years and writes `src/data/fuel-economy.json`.
5. Delete the source CSVs:
   ```
   rm CarFuelData*.csv
   ```
6. Commit and deploy:
   ```
   git add src/data/fuel-economy.json
   git commit -m "data: refresh VCA fuel economy"
   npm run deploy
   ```

**Source URL:** <https://carfueldata.vehicle-certification-agency.gov.uk/downloads/default.aspx>
**Refresh cadence:** Yearly is sufficient. New car-year data drops around April.

---

### 3. `mot-pass-rates.json` — DVSA Anonymised MOT Bulk Data

**Why manual?** The CSV is multi-gigabyte and lives on data.gov.uk behind a per-year archive link.

**Step by step:**

1. Open **<https://data.gov.uk/dataset/e3939ef8-30c7-4ca8-9c7c-ad9475cc9b2f>** in a browser.
2. Download the most recent annual `dft_test_result_YYYY.csv` (large file — 5+ GB).
3. Save anywhere convenient (doesn't need to be project root since you'll pass the path):
   ```
   # e.g. saved to ~/Downloads/dft_test_result_2025.csv
   ```
4. From the project root, run with the full path:
   ```
   npx tsx scripts/process-mot-stats.ts ~/Downloads/dft_test_result_2025.csv
   ```
   The script aggregates pass rates per make/model and writes `src/data/mot-pass-rates.json`.
5. Delete the source CSV (it's huge):
   ```
   rm ~/Downloads/dft_test_result_2025.csv
   ```
6. Commit and deploy:
   ```
   git add src/data/mot-pass-rates.json
   git commit -m "data: refresh MOT pass rates"
   npm run deploy
   ```

**Source URL:** <https://data.gov.uk/dataset/e3939ef8-30c7-4ca8-9c7c-ad9475cc9b2f>
**Refresh cadence:** DVSA publishes annually around April. Once a year is enough.

---

## 🔴 Pure curated (hand-edited)

These have no live source we can scrape. They're hand-maintained JSON files; refresh by editing the file directly when you find a better source.

| File | What it holds | Where to look for updates |
|---|---|---|
| `ncap-ratings.json` | Euro NCAP star ratings, 268 vehicles | <https://www.euroncap.com/en/ratings/> (anti-bot blocks scraping) |
| `new-prices.json` | New car list prices, ~130 models | Manufacturer websites — annual refresh |
| `ev-specs.json` | EV battery / range specs | Manufacturer websites — when new EVs launch |
| `theft-risk.json` | Theft-rate by make/model | Annual police / insurance reports |
| `colour-popularity.json` | Top car colours by year | DfT VEH02 annual release |
| `mot-failure-reasons.json` | Common MOT failure reasons | DVSA MOT statistics PDF reports |
| `tyre-sizes.json` | Tyre size by make/model | Tyre manufacturer databases |
| `vehicle-dimensions.json` | L/W/H/weight by model | Manufacturer spec sheets |
| `body-types.json` | Body shape (Hatchback/Saloon/SUV/…) | DfT VEH0220 stopped publishing this in 2026 — no source |

The dashboard's 180–365 day thresholds for these are deliberately generous — they really don't change often.

---

## Quick reference

| File | Refresh how | Frequency |
|---|---|---|
| `fuel-prices-weekly.json` | Auto on deploy | Weekly (deploy cadence) |
| `how-many-left.json` | Auto on deploy | Quarterly (DfT updates) |
| `recalls.json` | Manual script (Imperva blocks auto) | Monthly |
| `fuel-economy.json` | Manual script | Yearly |
| `mot-pass-rates.json` | Manual script | Yearly |
| Everything else | Hand-edit JSON | When you spot something out of date |
