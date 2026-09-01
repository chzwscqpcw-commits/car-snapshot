# Scrape state

Committed, machine-written state for the incremental scrapers
(`fetch-new-prices.ts`, `fetch-ev-specs.ts`). One file per scraper.

**Why these are in git.** CI runners are ephemeral, so this is the only way a
weekly run can know which slice the previous one covered. Without it both
scrapers would restart from the top every week and never converge — which is
the failure this design exists to fix. See `scripts/lib/incremental-scrape.ts`
for the full history.

Each file holds:

- `urls` — URL to the time it was last successfully *attempted*, used to order
  the next run stalest-first.
- `records` — dedupe key to the best record seen, with the `rank` that won it
  (ev-database sitemap id; Parkers `lastmod` as epoch ms). The output JSON in
  `src/data/` is rebuilt from this on every run.

Don't hand-edit them. Deleting one is safe but costs a convergence cycle: the
next run re-seeds from the existing `src/data/` file and starts refreshing from
scratch.
