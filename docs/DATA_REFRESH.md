# Data refresh guide

**The source of truth for every dataset is `src/data/_registry.ts`**: file,
label, source and URL, how it is refreshed (`method`), how often (`cadence`),
when the next hand run is due (`nextDue`), how old it may get
(`thresholdDays`), the exact command (`refreshHint`), its validator and the
bands for the comparison with the previous version (`deltaRules`).
`/data-health`, `scripts/check-freshness.ts` and `scripts/validate-data.ts`
all read it, and `npm run test:data-registry` fails when a file in
`src/data/` is missing from it. Add a dataset → add a registry entry.

## Validation: shape and delta

`npx tsx scripts/validate-data.ts` checks every file's shape (parses, minimum
count, plausible values). `npm run validate-data:delta` (or `--against <ref>`)
also compares each file with the version committed at `origin/main` (falling
back to `HEAD`): entry count within a band, key sets (makes, models, postcode
areas, recall numbers) not shrinking by more than a band, and headline figures
(national pass rate, latest fuel price, How Many Left totals for known models)
within bands. Results are `ok`, `review` (out of band but plausible) or `fail`
(shape error, or a change no refresh produces — a dataset halving, a date
going backwards). It writes `validation-report.md` and, in Actions, a
`status` output.

Both refresh workflows run the delta and route on it
(`scripts/open-data-pr.sh`): `ok` auto-merges as before; `review` opens the
PR without auto-merge, labels it `data-review`, puts the table in the body and
opens (or updates) the issue "Data refresh needs review: <date>"; `fail`
opens no PR, keeps the previous files, opens the issue and turns the run red.

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
| `recalls.json`, `fuel-economy.json`, `ncap-ratings.json`, `new-car-price-index.json`, `fuel-prices-weekly.json`, `how-many-left.json` | see the registry | Sundays, `.github/workflows/refresh-data.yml` |
| `new-prices.json`, `ev-specs.json` | Parkers, EV Database | Wednesdays, `refresh-prices.yml` |
| `model-price-calibration.json` | own telemetry | 2nd of the month, `calibrate-valuations.yml` (PR for review) |

Each job commits only when a file changes, so an old date on a weekly-job
file is normal; the job's **last run** (Friday email, `/data-health`) is the
health signal. A failing step keeps the issue "Data refresh failures" open
until it passes again. `npm run prebuild` no longer fetches anything — a
gov.uk outage cannot fail a deploy, and the committed file is what the site
serves. (`recalls.json` is the only recall source: the Monday Vercel cron
that tried to fill Supabase `data_cache` could not pass DVSA's bot
protection and was removed in 2026-11.)

## 📅 Hand-run datasets

`npx tsx scripts/data-due.ts` lists what is due within 45 days with the
command and source; `.github/workflows/data-due.yml` opens "Data due this
month — &lt;Month YYYY&gt;" on the 1st when anything is. The theft FOI goes
in September (`nextDue` 2027-09-01), the MOT bulk drop in May (2027-05-15).
After a refresh, move the entry's `nextDue` on a year.

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
