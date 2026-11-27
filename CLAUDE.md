# CLAUDE.md

Project guidance for Claude Code working in this repo (Free Plate Check — a
Next.js 16 / React 19 UK vehicle-check site).

## Quality gates (CI)

CI runs on every push/PR to `main` (`.github/workflows/ci.yml`) and is a
**blocking** gate — `main` is branch-protected to require it:

| Check | Command | Notes |
|-------|---------|-------|
| Typecheck | `npm run typecheck` | `tsc --noEmit` |
| Lint | `npm run lint` | `eslint` — **0 errors and 0 warnings**; keep it that way |
| Test suite | `npm test` | PDF report smoke-test, valuation lookup, historic-vehicle rules. CI ran only `test:pdf` until 2026-09-06; a valuation regression reached production because of it. |
| Plate flow (e2e) | `npm run test:e2e` | Separate `e2e` job, **required** on `main` since 2026-10-21: real browser against a production build. Checks plates stay in `#vrm=` across every entry point and never reach the server in a URL, then (`e2e/mot-outage.mjs`) that both valuation surfaces still value a car when the lookup has no MOT half, then (`e2e/wbac-top.mjs`) that both arms of `valuation_wbac_top_v1` are drawn and counted alike, then (`e2e/link-styles.mjs`) that links draw in the colour and underline their classes give them, in light and dark mode. Locally: `npm run build && npx next start -p 3123`, then run it. |

Before pushing, run `npm run typecheck && npm run lint && npm test`. Lint is a
hard gate now (the historical backlog was cleared) — don't reintroduce errors,
and prefer fixing warnings over leaving them. Use `_`-prefixed names for
intentionally-unused identifiers (the eslint config ignores `^_`).

## A/B experiment framework

All experiment plumbing lives in `src/lib/tracking.ts`. Attribution is
**exposure-based** (three tiers) so conversion rates read cleanly and never
exceed 100%:

1. **Assignment** — sticky per-visitor bucket in `localStorage`
   (`experiment_<id>`). A visitor keeps the same variant across visits. Read via
   `getActiveExperimentVariant(id)`.
2. **Exposure** — recorded in `sessionStorage` (`experiment_<id>_exposed`) by
   `trackExperimentImpression(id, variant)` when the visitor actually **sees**
   the variant. This marks the session as exposed + which variant.
3. **Attribution** — `trackConversion()` / `trackEvent()` attach `exp_<id>` to
   their payload **only for sessions that were exposed** (via the internal
   `attachExposedVariants` helper), de-duped to once per session per event name.

Result: `denominator = experiment_impression count` (exposed sessions);
`numerator = conversions carrying exp_<id>`; `rate = share of exposed sessions
that converted` (≤100%).

> Why this matters: the first experiment (`mobile_search_cue_v1`) attributed
> every conversion to a visitor's *bucket* — across pages and return visits,
> even if they never saw the cue — producing unreadable >100% rates. The
> exposure model fixes that.

### Running a new experiment

1. **Register it** — add `KEY: "experiment_id"` to the `EXPERIMENTS` registry in
   `tracking.ts`. (Removing the key stands the experiment down; historical
   events stay in Supabase `site_events`.)
2. **Build the component** — assign a sticky variant (random, persisted to
   `localStorage` under `experiment_<id>`), then fire
   `trackExperimentImpression(id, variant)` **on actual visibility** — use an
   `IntersectionObserver`, not just mount — so "exposure" means truly-seen.
   Optionally `trackExperimentClick(id, variant)` for direct engagement.
3. **Conversions auto-attribute** — any `trackConversion()` / `trackEvent()`
   call in an exposed session carries `exp_<id>` automatically. No per-call
   wiring needed.
4. **Read results** — events land in Supabase `site_events` (`event_type` +
   `metadata` jsonb). Tap-through = `experiment_click` ÷ `experiment_impression`
   per `metadata.variant`; conversion = events carrying `metadata.exp_<id>` ÷
   impressions. GA4 mirrors the same events (sample-only; ad-blockers drop
   30–60% of gtag hits — Supabase is the source of truth).

The shipped `MobileSearchCue` (variant C of the concluded test) is the reference
for the component side, minus the now-removed variant branching.

When one session can meet the surface more than once (several cars valued in a
row), pass `{ oncePerSession: true }` to `trackExperimentImpression` and
`{ oncePerExposedSession: true }` to `trackExperimentClick`, so impressions
count exposed sessions and clicks ÷ impressions stays a share of them.
`valuation_wbac_top_v1` (We Buy Any Car inside the valuation card against the
card further down; `ValuationResult`, `SellCarStrip`) is the reference for a
layout test: exposure is the element both arms share (our figure), each arm's
`/go` link has its own context so the partner's order report splits by arm,
and `src/lib/wbac-top-test.ts` holds the planned size and length and the
Friday email block, which will not name a leader before both are reached.
`trackExperimentImpression` also takes `context`: extra fields on the
impression for cutting the denominator (a surface, a device state; never a
plate).

### Running: `save_alert_step_v1` (step two of the save card)

`SaveCarCard` saves the car locally on the first tap (both arms, so
`vehicle_saved` stays comparable), then asks for alerts. `control` is the
step as shipped ("Where should alerts go?"); `dated` leads with the car's own
next date and asks for one thing (`src/components/save-card/DatedAlertStep.tsx`).

- Everything the dated step promises comes from `src/lib/alert-step.ts`, and
  `npm run test:saved-cars` holds it to the cron's schedule in
  `src/lib/car-alerts.ts`. Change the schedule and the copy together.
- Read it: `experiment_impression` rows with `experiment_id =
  save_alert_step_v1` per `variant` (each carries `surface`, `card`, `push`,
  `next`) against `car_saved` rows carrying `exp_save_alert_step_v1`. Compare
  within a `push` state as well as overall: a browser that can notify is a
  different test from one that can't.
- The dated arm can ask for the monthly value check without a stated plan
  (the value card does by default). It is stored as `intent: "thinking"`,
  the weakest plan the cron sends the check for; `car_saved.intent` stays what
  the owner said and `value_check` says whether the check is coming.
- Both arms in every device state, fixture only: `/preview/save-card`. It can
  also pin this device's arm for a real save.

## Data integrity

Every dataset in `src/data/` has one record in `src/data/_registry.ts`
(source, method, cadence, `nextDue`, threshold, refresh command, validator,
delta bands); `npm run test:data-registry` fails when a file and the registry
disagree. `npm run validate-data:delta` compares every file with `origin/main`
(counts, key sets, headline figures) and classifies `ok` / `review` / `fail`;
the refresh workflows route on it (auto-merge / PR + issue / no PR + issue).
The Friday audit email's "Data" section and `/data-health` read the jobs' last
runs from the public GitHub API. Adding a dataset = a registry entry, a
validator in `scripts/lib/validators.ts` and a `profileDataset` case. Details:
`docs/DATA_REFRESH.md`.

## When the MOT service is down

`/api/lookup` joins DVLA (vehicle details) and DVSA (MOT history). Either can
fail on its own, and the MOT half fails quietly: the page still renders. On
8–9 Nov 2026 it failed for 21.5 hours unnoticed and took valuations with it,
because a car's **model comes from its MOT record** (DVLA returns the make
only).

- Every failure is a `lookup_error` row (`stage`, `reason`, and since Nov 2026
  the error's `err_name` / `cause_code` / `cause_msg`, `ms`, `attempts`; never
  a plate). `src/lib/mot-history.ts` is the MOT call.
- A failed MOT call sets `motUnavailable` on the lookup, reuses the model from
  our saved copy of an earlier lookup when there is one, and is not cached.
  `MotOutageNotice` explains it on both valuation surfaces (the tool and the
  homepage's own inline valuation) and asks for the model when we have none.
- To see the outage state without an outage: `/preview/car-valuation?mot=down`
  (fixture, no lookup), or on a preview deployment
  `/api/preview/mot-outage?state=known|new|off`, which sets a 30-minute cookie
  the lookup honours everywhere except live production.
- No health grade during an outage, on the page or in the report: a quarter of
  it is MOT history, so it would be marked down (or up) for our gap.
- The PDF report says so too, in both engines (`src/lib/report-mot-outage.ts`
  holds the shared wording): a notice on the cover, no health grade, and a
  line under the valuation when it rests on typical mileage. Sample:
  `/api/report-pdf/sample?mot=down` (or `down-new`, `&format=html`).

## Social clips (`social/`)

A Remotion project with its own install, outside the Next build and the root
`tsc`; root ESLint lints `social/src`. `npm run social:check` runs its
typecheck and calendar test (including the turn of the year: 2026 has 53 ISO
weeks, so batches are W45, W48, W51, then 2027-W01). The workflow
(`.github/workflows/social-clips.yml`) runs every Saturday 22:00 UTC and
renders a three-week batch of nine clips to a `social-<first ISO week>`
release on every third one; the Sunday cron (`/api/cron/social-clips`, same
calendar) emails them, or emails that the batch **did not render** with the
Actions link, and the Friday audit shows the latest run's result
(`src/lib/social-clips.ts`). A relative `--out` is relative to where npm was
started (`social/src/outdir.ts`): it was not, and the render failed unseen
from 6 to 20 Nov 2026. Routine, setup, re-run steps and go/no-go line
(first post 2 Nov 2026, review the week of 28 Dec): `docs/social-pipeline.md`.
Never a real registration or a partner name in a
clip or caption; the test enforces both.

## Partner orders (Rakuten reports)

Our own events see clicks to the Rakuten advertisers (We Buy Any Car, and
Confused.com for insurance), never orders: an order exists only in Rakuten's
reports, tagged with the placement (`u1`) that sent it.
`/api/cron/rakuten-reports` (daily) fetches two saved reports from their
"Get API" links and stores them; the Friday email and `/data-health` show a
"Partner orders" block from them. Setup and the first-run checks:
`docs/partner-orders.md`.

- **The links are secrets.** `RAKUTEN_REVENUE_REPORT_URL` and
  `RAKUTEN_LOCK_REPORT_URL` each hold a token. Never log, return or commit
  one; `src/lib/rakuten-reports.ts` writes its own error messages (column
  names and row numbers only) for that reason. Unset = a quiet "not
  connected" state everywhere, no email.
- **No registration is kept.** In the Lock Status report `SKU` is the
  customer's registration and `Product Name` their car. The parser reads an
  allow-list of columns, so neither reaches a row, a log, a response or a
  file; `npm run test:rakuten` fails if either survives. Fixtures are
  invented: no registration-shaped strings, no real amounts.
- **Private tables.** `rakuten_daily` and `rakuten_orders` (RLS on, no
  policy, service role only), never `site_events`, which the public anon key
  can read. Orders upsert by Transaction ID; when a commission changes the
  earlier figure moves to `previous_commission`, so a paying order dropping
  to zero stays visible. `/api/admin/partner-orders` serves nothing real on
  a deployment without its own `ADMIN_PIN`.
- **Reconciliation.** Rakuten's clicks per day are the whole account's (the
  day report has no advertiser column), so they are compared with our
  `partner_click` rows for every partner whose link is a Rakuten link
  (`rakutenPartners()`: We Buy Any Car and Confused.com today; owner traffic
  out). A finished day more than 3 clicks (or a tenth) apart is flagged.
  Thresholds: `RECON` in `src/lib/partner-orders.ts`; clicks known to have
  been made outside the site go in `OFFSITE_CLICKS` there. Orders are shown
  per advertiser, from the name on each row of the lock report.
- `npm run rakuten:pull` writes the two cleaned CSVs to `RAKUTEN_EXPORT_DIR`
  (no database, no site). `/data-health?partner-orders=sample` shows the
  panel with made-up figures.
- This repository is public: no rates, earnings, contacts or terms in code,
  fixtures, commits or PR text.

## Insurance placements (Confused.com)

`InsuranceCTA` shows a "compare insurance" card under running costs on the
homepage (`money-insurance`) and on the `/running-costs` result
(`running-costs-insurance`); `src/config/insurance.ts` picks the partner by
vehicle type. Confused.com (through Rakuten) is live for cars, vans and
motorbikes; Tempcover has no link yet. The three links are the ones the
partner's account team issued, not the ones the publisher dashboard shows
(they carry a different offer id).

- **The partner approves every placement before it goes live.** A change to
  the card's wording, a new placement or a new vehicle type goes to them
  first. `/preview/insurance` shows each card for that.
- **The wording is ours and makes no claim**: no saving, "cheapest", "best",
  reward or figure, and nothing about the partner beyond its name, written
  "Confused.com", and the regulatory line it requires under our commission
  line, word for word from its approved copy (`regulatoryLine` on the partner
  entry). `npm run test:insurance` pins the text and fails on a claim.
- **Confused.com is the site's insurance provider** (founder, 17 Nov 2026).
  The card is the only link out for insurance: no button or link to another
  comparison site anywhere, tracked or not, and no fallback insurer in
  `src/config/insurance.ts` (where Confused.com is not live, nothing shows). The `/running-costs` estimate
  used to carry one; it is gone, and `npm run test:insurance` fails if a page
  or component links to one again.
- **Logo.** The card draws the partner's logo on a white plate when its
  entry names one. `public/partner-logos/confused-logo-black.svg` is the file
  the partner supplied (19 Nov 2026), served byte for byte: never recoloured,
  cropped, redrawn or run through an optimiser, and never artwork found
  elsewhere. `npm run test:insurance` holds its checksum.

## Conventions

- Telemetry must never break the user flow — `tracking.ts` mirrors events
  fire-and-forget via `sendBeacon` (fallback `fetch` keepalive) to `/api/event`.
- A `lookup` event is a lookup one of our pages made. A call to `/api/lookup`
  from anything else (a script; no same-origin browser headers) is recorded as
  `lookup_direct`, so every count of `lookup` leaves it out; `/data-health`
  shows the last 24h of them. The route also remembers for ten minutes that
  DVLA does not know a plate (`src/lib/lookup-guards.ts`). A server-side call
  of ours to the route must send `x-fpc-internal: 1`. An error from a direct
  call is a `lookup_error` with `direct: true`; the lookup-health alert and
  weekly figures leave those out and report them as "Not counted".
- MOT prompts in blog articles open our own booking tool, never the partner
  (`BlogMotBooking`, `src/lib/blog-mot-booking.ts`): a registration box
  mid-article (`source` `blog-mot-inline`) and a one-line one at the foot
  (`blog-mot-foot`), both landing on the wizard's price step with the plate in
  `#vrm=`; `noreg=1` reaches the same step without a car. Read them as
  `booking_entry_impression` (seen) and `booking_entry_click` (used) by
  `source`, then `booking_wizard_start` and the step events on the same
  `source`. The card they replaced was seen on 569 visitor-days and clicked on
  2 (12 Sep to 17 Nov 2026; `partner_impression` / `partner_click`,
  `click_context` `blog-mot-inline`). In article text, link to `/cheap-mot` or
  `/booking?source=blog-text`; `npm run test:blog-booking` fails on a new
  partner link in a post.
- Every public page lives in `src/lib/site-index.ts` — the command palette
  (⌘K), the mobile drawer and `/tools` all read it (a `tools` block on an
  entry is its `/tools` card). `npm run test:site-index` walks `src/app` and
  fails when a page is missing or an entry points nowhere.
- The admin dashboard at `/data-health` (PIN-gated) shows data freshness, the CI
  badge, and MarketCheck API usage.
- `/api/cron/lookup-health` runs every 15 minutes and emails the founder when
  one half of `/api/lookup` (DVLA, MOT, or our own route) starts failing, and
  once more when it clears. For MOT it counts results that rendered without
  MOT data (`mot_unavailable` on the `lookup` row), not error rows: an MOT
  error for a plate DVLA doesn't know affects nobody. Thresholds, and the Nov
  2026 outage they were picked from, are in `src/lib/lookup-health.ts`; the Friday audit and
  `/data-health` carry the same "Lookup health" line. Incident state is a
  `lookup_alert` row in `site_events` (flagged internal).
- `src/app/globals.css`: a rule on a bare element goes inside `@layer base`.
  Tailwind v4's utilities live in a layer and CSS outside any layer outranks
  all of them, so a loose `a { color: inherit }` switched off every `text-*`
  and `underline` on a link from the first commit until Nov 2026
  (`e2e/link-styles.mjs` now checks). The page is dark in light mode too (one
  `--background`). `:focus-visible` and `.blog-content …` are still outside a
  layer and so still beat utilities.
- Commit messages end with the project's `Co-Authored-By` trailer.
