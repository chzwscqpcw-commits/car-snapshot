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

**Why semi-auto?** DVSA's download endpoint is behind Imperva bot-protection — plain Node `fetch` and `curl` get a 302 to a JS challenge. `scripts/fetch-recalls.ts` launches headless Brave/Chrome via `puppeteer-core` with stealth patches, warms the Imperva session by visiting the recalls homepage, then fetches the CSV inside the browser context so it inherits the warmed cookies AND the real-browser TLS fingerprint.

**Step by step:**

1. From the project root, run:
   ```
   npx tsx scripts/fetch-recalls.ts
   ```
   This downloads `RecallsFile.csv` (~7 MB), pipes it through `process-recalls.ts`, writes `src/data/recalls.json`, and deletes the raw CSV.

2. Commit and deploy:
   ```
   git add src/data/recalls.json
   git commit -m "data: refresh DVSA recalls"
   npm run deploy
   ```

**Source URL:** <https://www.check-vehicle-recalls.service.gov.uk>
**Refresh cadence:** DVSA updates weekly. Once a month is plenty for our use case.
**Requires:** Chrome/Brave/Chromium installed locally. Not in prebuild because Vercel's build environment has no Chromium binary.

---

### 2. `fuel-economy.json` — VCA Car Fuel Data

**Why semi-auto?** VCA's downloads page is JS-driven and 302-redirects cold requests. `scripts/fetch-vca-archive.ts` uses headless Brave/Chrome (via `puppeteer-core`) to warm the ASP.NET session, scrape the per-year ZIP URLs, download them all, and extract the CSVs.

**Step by step:**

1. From the project root, run:
   ```
   npx tsx scripts/fetch-vca-archive.ts
   ```
   Downloads all ZIPs from July 2000 onwards (28 years), extracts each `data for guide ….csv` to `./vca-csvs/`, and reports a per-year summary. Two years (aug2011 ships as `.xls` only, `latest` is a placeholder) get skipped automatically.

2. Process the extracted CSVs into `src/data/fuel-economy.json`:
   ```
   npx tsx scripts/process-fuel-data.ts vca-csvs/*.csv
   ```
   Dedupe key is `make|model|engine|fuel`. CSVs are read as Latin-1 (Windows-1252) which is what VCA actually publishes — UTF-8 reads produce mojibake on accented model names. Expect ~10,600 entries / ~3,600 unique models / ~70 makes.

3. Validate and deploy:
   ```
   npx tsx scripts/validate-data.ts
   git add src/data/fuel-economy.json
   git commit -m "data: refresh VCA fuel economy"
   npm run deploy
   ```

**Faster refresh (skip pre-2018):**
```
npx tsx scripts/fetch-vca-archive.ts --recent             # sept2018 onwards only (~3,800 entries)
npx tsx scripts/fetch-vca-archive.ts aug2017 sept2018     # specific year tags
```

**Source URL:** <https://carfueldata.vehicle-certification-agency.gov.uk/downloads/default.aspx>
**Refresh cadence:** Yearly is sufficient. New car-year data drops around September.
**Requires:** Chrome/Brave/Chromium installed locally (puppeteer drives an existing browser binary; we don't ship a bundled Chromium).

---

### 3. `ncap-ratings.json` — Euro NCAP crash ratings

**Why semi-auto?** Euro NCAP's listing page is paginated through Next.js client-side rendering with no working URL params; their sitemap.xml exposes the full list of ~470 individual assessment URLs which `scripts/fetch-ncap-ratings.ts` then scrapes via puppeteer (with stealth patches against their anti-bot).

**Step by step:**

1. From the project root, run:
   ```
   npx tsx scripts/fetch-ncap-ratings.ts
   ```
   Pulls the sitemap, scrapes ~465 crash-rating pages concurrently (4 at a time), dedupes by make+model keeping highest-year/highest-stars, and writes `src/data/ncap-ratings.json`. Takes ~2–3 minutes.

2. Validate and deploy:
   ```
   npx tsx scripts/validate-data.ts
   git add src/data/ncap-ratings.json
   git commit -m "data: refresh Euro NCAP ratings"
   npm run deploy
   ```

**Source URL:** <https://www.euroncap.com/sitemap.xml>
**Refresh cadence:** Euro NCAP publishes new ratings roughly monthly. Quarterly refresh is plenty.
**Requires:** Chrome/Brave/Chromium installed locally.
**Note:** Vauxhall lookups resolve to Opel via `src/lib/ncap.ts` make alias — Euro NCAP publishes only under Opel.

### 4. `mot-pass-rates.json` — DVSA Anonymised MOT Bulk Data

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
| `ncap-ratings.json` | Euro NCAP star ratings | Auto via `scripts/fetch-ncap-ratings.ts` (see semi-auto section below) |
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
