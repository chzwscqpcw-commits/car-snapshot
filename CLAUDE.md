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

## Conventions

- Telemetry must never break the user flow — `tracking.ts` mirrors events
  fire-and-forget via `sendBeacon` (fallback `fetch` keepalive) to `/api/event`.
- The admin dashboard at `/data-health` (PIN-gated) shows data freshness, the CI
  badge, and MarketCheck API usage.
- Commit messages end with the project's `Co-Authored-By` trailer.
