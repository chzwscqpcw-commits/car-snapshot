# Analytics dashboard — setup guide

This doc captures the GA4 event model the site fires, how to register the custom dimensions so they're queryable, and how to build the funnel + Looker Studio dashboard that tells the story of user behaviour end-to-end.

## 1. Event reference

All events route through `src/lib/tracking.ts`. Two helpers:

- `trackConversion(type, metadata)` — fires a `conversion` event with `conversion_type` set. Use for the two real conversions: `reg_search` and `mot_reminder`. GA4 should treat the `conversion` event as a key event.
- `trackEvent(name, metadata)` — fires a named event for funnel-stage measurement. Use for views, attempts, errors, and section visibility.

Both helpers automatically attach any active A/B experiment variant the visitor is bucketed into, as `exp_<experiment_id>: <variant>`.

### Conversion events

| Event | Fired from | Key parameters |
|---|---|---|
| `reg_search` | `src/app/page.tsx` (homepage `performLookup` + compare flow), `ConversionWidget.handleLookup` | `vrm`, `flow` (`main` \| `compare` \| widget pages use `page_path`), `paired_vrm` (compare only) |
| `mot_reminder` | `MOTReminderSignup.handleSubmit`, `ConversionWidget.handleReminder` | `vrm` (widget) \| `vrm_count` (signup, multi-reg), `context`, `trigger_variant` |

### Lifecycle events (non-conversion)

| Event | Fired from | Key parameters |
|---|---|---|
| `results_view` | Homepage `performLookup`, homepage compare flow, `useVehicleLookup` hook | `flow` (`main` \| `compare` \| `tool`), `make`, `mot_status`, `fuel_type`, `year_of_manufacture`, `tax_status`, `euro_status`, `has_mot_expiry` |
| `results_section_view` | `SectionGroup` (IntersectionObserver, 50% threshold, once per mount) | `section_id` (`section-health` \| `section-money` \| `section-facts` \| `section-mot` \| `section-next`), `section_label` |
| `mot_reminder_view` | `MOTReminderSignup` (IntersectionObserver, once per mount) | `context`, `trigger_variant` |
| `mot_reminder_chip_view` | `MOTReminderCollapsible` (IntersectionObserver, before expand) | `context`, `trigger_variant` |
| `mot_reminder_chip_click` | `MOTReminderCollapsible` (tap-to-expand) | `context`, `trigger_variant` |
| `mot_reminder_submit_attempt` | On submit click, before validation | `context`, `trigger_variant`, `vrm_count` |
| `mot_reminder_validation_error` | When `validate()` returns false | `context`, `trigger_variant`, `field` (widget only) |
| `mot_reminder_submit_error` | API 4xx/5xx or network failure | `context`, `trigger_variant`, `error_type` (`duplicate` \| `server` \| `network`), `status` |
| `partner_click` | All affiliate CTAs across the site | `partner_id`, `click_context` |
| `experiment_impression` / `experiment_click` | `MobileSearchCue` and other A/B experiments | `experiment_id`, `variant` |

### Trigger variants

The 6 capture triggers for the MOT reminder (per `MEMORY.md`) map to `trigger_variant` values:

| Trigger | Location | `trigger_variant` | Visual `context` |
|---|---|---|---|
| A | Result page, MOT valid ≤60d | `results_due_soon` | `due-soon` |
| B | Result page, MOT expired | `results_expired` | `expired` |
| C | Result page, MOT valid >60d | `results_far` | `post-lookup` |
| D | Homepage copy (no lookup yet) | `homepage` | `generic` |
| E | Post-PDF download prompt | `post_pdf` | `post-lookup` |
| F | Blog post footer | `blog_footer` | `generic` |
| — | Dedicated `/mot-reminder` page | `reminder_page` | `generic` |
| — | `ConversionWidget` inline reminder | `widget` (set in payload) | n/a (separate component) |

## 2. GA4 setup

### Register custom dimensions

GA4 doesn't surface event parameters in standard reports until you register them as custom dimensions. Go to **Admin → Custom definitions → Custom dimensions → Create**.

Register these as **Event-scope** dimensions:

| Dimension name | Event parameter |
|---|---|
| Flow | `flow` |
| Trigger variant | `trigger_variant` |
| Context | `context` |
| Section ID | `section_id` |
| Error type | `error_type` |
| Make | `make` |
| MOT status | `mot_status` |
| Fuel type | `fuel_type` |
| Year of manufacture | `year_of_manufacture` |
| Tax status | `tax_status` |
| Euro status | `euro_status` |
| Has MOT expiry | `has_mot_expiry` |
| VRM count | `vrm_count` |

Each takes ~24 hours to start populating. Don't be alarmed if reports come back empty for the first day.

### Mark `conversion` as a key event

**Admin → Events → mark `conversion` as a Key event.** Without this, `trackConversion()` calls won't roll up into the Conversions report.

If you want `mot_reminder` to be a separate key event (rather than rolled up under `conversion` with `conversion_type=mot_reminder`), create a custom event in GA4 that fires when `conversion` arrives with `conversion_type=mot_reminder` and mark that as key.

### Build the core funnel exploration

**Explore → Funnel exploration**. Steps:

1. `session_start` (open)
2. `reg_search` (event name)
3. `results_view`
4. `results_section_view` (any) — measures whether users scroll past the header
5. `mot_reminder_view` OR `mot_reminder_chip_view` OR `partner_click` — first signal of CTA engagement
6. `mot_reminder_submit_attempt` OR `partner_click` (BMG-tagged context)
7. `conversion` with `conversion_type` in (`mot_reminder`)

Add breakdowns by:
- `trigger_variant` — which capture trigger converts best
- `flow` — homepage vs tool pages vs compare
- `mot_status` — does an expired MOT user behave differently from a valid-MOT user
- Device category (built-in) — your desktop CTR drop showed up in GSC; check whether desktop drops out earlier in the funnel

## 3. Looker Studio dashboard

Free, plugs into GA4 directly, gives you a usable "story" UI without paying for another tool.

### Pages to build

**Page 1 — Acquisition & conversion overview**

- Scorecards: sessions, `reg_search`, `results_view`, `mot_reminder`, `partner_click`
- Time series: daily `reg_search`, `mot_reminder`, conversion rate
- Pie/bar: `reg_search` count by `flow`
- Table: top landing pages by sessions and conversion rate

**Page 2 — Results page behaviour**

- Funnel chart (Looker Studio v2 funnel viz):
  - `reg_search` → `results_view` → `results_section_view` → CTA engagement → conversion
- Table by `section_id`: % of `results_view` sessions that reached the section
- Heatmap-style bar by `mot_status` × `trigger_variant`: which combinations convert
- Breakdown by `make` and `year_of_manufacture` bucket — are old-car owners or new-car owners more likely to set a reminder?

**Page 3 — Reminder capture deep-dive**

- Stack chart by `trigger_variant`: `mot_reminder_view` → `mot_reminder_submit_attempt` → `mot_reminder` (success) → conversion rate at each step
- Error breakdown: `mot_reminder_submit_error` by `error_type` over time (catches API regressions)
- Validation drop-off by `field` (widget) — tells us which fields are friction
- `mot_reminder_chip_view` → `mot_reminder_chip_click` rate — answers "do users actually open the collapsible CTA"

**Page 4 — Partner click attribution**

- Table by `click_context`: `partner_click` count, sessions, click-through rate
- By page: which result-page sections drive the most BMG clicks
- Comparison vs `results_section_view` for the same section — section's pull-through rate

### Filters every page should expose

- Date range
- Device category
- Country (mostly GB but useful for spotting anomalies)
- `flow` (so you can isolate homepage from tool pages)

## 4. Questions this dashboard should answer

Use these as your acceptance criteria. If the dashboard can't answer them with one filter change, it isn't done.

**Where do we lose visitors?**
- What % of sessions submit a `reg_search`? (sessions → `reg_search`)
- What % of `reg_search` complete a `results_view`? (DVLA API failure rate)
- What % of `results_view` reach the second SectionGroup? (scroll engagement)
- What % of `results_view` reach the BMG section? (deep engagement)

**Where do we fail to convert?**
- For each `trigger_variant`: what % of `mot_reminder_view` → `mot_reminder_submit_attempt` → `mot_reminder` (success)?
- Of `mot_reminder_submit_attempt`, what % fail validation vs API errors vs succeed?
- Of `mot_reminder_chip_view`, what % click the chip? (the collapsible's value)

**Which capture triggers earn their keep?**
- `mot_reminder` success rate by `trigger_variant`
- Conversion *volume* (not just rate) by `trigger_variant`
- Compare `homepage` (D), `results_far` (C), `blog_footer` (F) — all share `context: generic` visually but reach different audiences

**Which user segments convert best?**
- Conversion rate by `mot_status` (expired users are usually 3–5× more likely to set a reminder)
- Conversion rate by `make` (top 20 makes only — high cardinality)
- Conversion rate by `year_of_manufacture` bucket (0–3 / 4–7 / 8–12 / 13+ years old)
- Conversion rate by device

**Is something broken?**
- `mot_reminder_submit_error` rate by `error_type` over time — spike = backend regression
- `reg_search` count vs `results_view` count — gap = DVLA API failures or downstream rendering issues
- Drop in `results_section_view` for a specific section without the others dropping = likely a render bug

## 5. Operational notes

- Events take 24–48h to appear in GA4 standard reports (faster in DebugView and the realtime report).
- For local dev, install the GA Debug Chrome extension and watch `window.dataLayer` in console.
- `vrm` is captured on `reg_search` and `mot_reminder` payloads — fine for ad-hoc debugging but **never expose VRMs in shared dashboards or exports**. PII-adjacent for UK number plates.
- The `paired_vrm` field on compare-flow events is symmetric (each event sees the other reg) — handy for stitching together the two halves of a comparison session.

## 6. Future event work (not yet wired)

If the dashboard reveals specific gaps, the next-most-valuable events to add:

- `pdf_download` — currently invisible. Important for measuring whether PDF acts as a conversion proxy.
- `vehicle_saved` / `vehicle_unsaved` — saved-vehicle behaviour is a retention signal.
- `outbound_click` — for non-partner external links (sources, GOV.UK references, etc.). GA4 enhanced measurement can also auto-track these.
- Scroll-depth percentages (25/50/75/100) — enhanced measurement covers this if turned on.
- `mot_reminder_form_focus` — first focus event per session, distinguishes "form ignored" from "form considered".
