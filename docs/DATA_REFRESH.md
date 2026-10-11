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

### 4. `mot-pass-rates.json` + `mot-failure-reasons.json` — DVSA Anonymised MOT Bulk Data

**Why manual?** The files are multi-gigabyte zips on data.gov.uk, one per year.
Both JSON files come out of one run.

**Step by step:**

1. From **<https://data.gov.uk/dataset/e3939ef8-30c7-4ca8-9c7c-ad9475cc9b2f>**
   download the latest year's `dft_test_result_YYYY.zip` (~1.2 GB) and
   `dft_test_item_YYYY.zip` (~0.5 GB), plus `lookup.zip`. Unzip all three into
   one folder (~5.7 GB unzipped). The CSVs are **pipe-delimited**.
2. One-off: `python3 -m venv .venv && .venv/bin/pip install duckdb`
3. From the project root:
   ```
   .venv/bin/python scripts/process-mot-bulk.py ~/Downloads/mot YYYY
   ```
   Keeps the existing curated model keys, folds DVSA naming variants into them
   (trims, BMW engine codes like "320D", Mercedes "C"/"C-CLASS"), drops
   models under 1,000 tests, and prints the national first-time pass rate.
4. Update `UK_AVERAGE_PASS_RATE` in `src/lib/mot-pass-rate.ts` and the year
   stated on `/stats/mot-pass-rates` (FAQ copy + `temporalCoverage`).
5. Delete the CSVs, then commit both JSON files.

**Source URL:** <https://data.gov.uk/dataset/e3939ef8-30c7-4ca8-9c7c-ad9475cc9b2f>
**Refresh cadence:** Annual, but irregular — as of Oct 2026 the latest published year is 2023 (released Feb 2024); 2024 and 2025 are not out. Check the dataset page each spring.

---

## 🔴 Pure curated (hand-edited)

These have no live source we can scrape. They're hand-maintained JSON files; refresh by editing the file directly when you find a better source.

| File | What it holds | Where to look for updates |
|---|---|---|
| `ncap-ratings.json` | Euro NCAP star ratings | Auto via `scripts/fetch-ncap-ratings.ts` (see semi-auto section below) |
| `new-prices.json` | New car list prices, ~130 models | Manufacturer websites — annual refresh |
| `ev-specs.json` | EV battery / range specs | Manufacturer websites — when new EVs launch |
| `theft-risk.json` | Theft-rate by make/model — **UNSOURCED, lookup disabled** | DVLA FOI FOIR13058 ÷ DfT VEH0120 — see `src/lib/theft-risk.ts` |
| `colour-popularity.json` | Top car colours by year | DfT VEH02 annual release |
| `mot-failure-reasons.json` | Top MOT failure areas by model | Generated with mot-pass-rates.json — see section 4 |
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
