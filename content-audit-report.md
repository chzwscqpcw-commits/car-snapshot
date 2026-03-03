# Free Plate Check — Content Audit Report

**Date:** 3 March 2026

---

## Executive Summary

### Site Overview
- **20 unique routes** (excluding dynamic car guide/blog variants)
- **29 blog posts** (24 published, 5 scheduled through 12 March)
- **220 car guide pages** (32 makes + 188 models)
- **7 tag pages**, **1 RSS feed**
- **~269 total URLs** in sitemap

### Key Findings

**Content quality is strong.** Every blog post is 950+ words of genuinely useful UK-focused content. All 8 landing pages have proper SEO metadata, JSON-LD, and FAQ sections. No thin content.

**The MOT reminder funnel has a major discoverability gap.** The `/mot-reminder` landing page is orphaned — zero internal links point to it from anywhere on the site. The `/mot-check` landing page doesn't mention the reminder service at all. No blog posts link to `/mot-reminder`.

**Internal linking needs work.** The homepage doesn't link to `/mot-reminder` or `/cars`. The 220 car guide pages are only reachable via the sitemap, not via crawl paths from the homepage. No site-wide navigation bar exists.

**BookMyGarage integration is solid.** Correct Awin IDs, reg pre-population, proper rel attributes, GA4 tracking. Disclosure could be more prominent on the results page.

**19 of 29 blog posts lack FAQ structured data** — a missed opportunity for Google "People Also Ask" features.

---

## Phase 1: Content Inventory

### Landing / Tool Pages

| Page | URL | Words | JSON-LD | OG | FAQ | MOT Reminder CTA | BMG CTA | Links Out | Links In | Issues |
|------|-----|-------|---------|-----|-----|-------------------|---------|-----------|----------|--------|
| Homepage | `/` | ~2,500 | FAQPage, WebApp, Org, WebSite | Yes | Yes (4) | Yes (results) | Yes (results) | 7 tool pages, 7+ blog posts, /blog | All landing pages | No link to /mot-reminder or /cars |
| MOT Check | `/mot-check` | ~1,200 | Breadcrumb, FAQ, WebApp | Yes | Yes (5) | **No** | **No** | /, /mileage-check, /tax-check, 5 blog posts | Homepage | **Should mention MOT reminder** |
| Car Check | `/car-check` | ~1,300 | Breadcrumb, FAQ, WebApp | Yes | Yes (6) | **No** | **No** | /, 6 tool pages, 5 blog posts | Homepage | — |
| Tax Check | `/tax-check` | ~1,200 | Breadcrumb, FAQ, WebApp | Yes | Yes (5) | **No** | **No** | /, /car-check, 4 blog posts | Homepage, /mot-check, /car-check | — |
| Mileage Check | `/mileage-check` | ~1,300 | Breadcrumb, FAQ, WebApp | Yes | Yes (5) | **No** | **No** | /, /mot-check, /car-valuation, 4 blog posts | Homepage, /mot-check | — |
| ULEZ Check | `/ulez-check` | ~1,000 | Breadcrumb, FAQ, WebApp | Yes | Yes (6) | **No** | **No** | /, /car-check, 3 blog posts | Homepage | — |
| Recall Check | `/recall-check` | ~950 | Breadcrumb, FAQ, WebApp | Yes | Yes (5) | **No** | **No** | /, /mot-check, 3 blog posts | Homepage | — |
| Car Valuation | `/car-valuation` | ~1,000 | Breadcrumb, FAQ, WebApp | Yes | Yes (6) | **No** | **No** | /, /mileage-check, /mot-check, 3 blog posts | Homepage | — |
| MOT Reminder | `/mot-reminder` | ~1,100 | Breadcrumb, FAQ, WebApp | Yes | Yes (5) | Yes (entire page) | **No** | /, /mot-check, /tax-check, 5 blog posts | **None** | **Orphaned — zero inbound links** |

### Blog Posts (29 total)

| # | Slug | Words | FAQ Schema | BMG CTA | Links to /mot-reminder | Published |
|---|------|-------|------------|---------|----------------------|-----------|
| 1 | how-to-spot-a-clocked-car | ~1,100 | No | No | No | Yes |
| 2 | used-car-checks-before-buying | ~1,200 | No | No | No | Yes |
| 3 | how-to-check-if-a-car-is-taxed | ~950 | No | No | No | Yes |
| 4 | how-to-read-mot-history | ~1,050 | No | Yes | No | Yes |
| 5 | what-is-sorn-and-when-do-you-need-one | ~1,150 | No | No | No | Yes |
| 6 | is-my-car-ulez-compliant | ~1,100 | No | No | No | Yes |
| 7 | what-is-a-v5c-logbook | ~1,150 | No | No | No | Yes |
| 8 | how-to-sorn-a-car | ~1,050 | No | No | No | Yes |
| 9 | what-to-do-if-car-fails-mot | ~1,150 | No | Yes | No | Yes |
| 10 | how-to-check-car-co2-emissions | ~1,100 | No | No | No | Yes |
| 11 | how-to-check-car-service-history | ~1,100 | No | No | No | Yes |
| 12 | what-is-hpi-check | ~1,200 | No | No | No | Yes |
| 13 | car-insurance-groups-explained | ~1,250 | No | No | No | Mar 4 |
| 14 | euro-emission-standards-explained | ~1,250 | No | No | No | Mar 6 |
| 15 | how-to-tax-a-car-online | ~1,350 | No | No | No | Mar 8 |
| 16 | what-to-check-on-a-test-drive | ~1,500 | No | No | No | Mar 10 |
| 17 | how-to-appeal-mot-failure | ~1,300 | No | Yes | No | Mar 12 |
| 18 | what-does-mot-advisory-mean | ~1,000 | Yes (3) | Yes | No | Yes |
| 19 | what-happens-driving-without-mot | ~1,050 | Yes (3) | Yes | No | Yes |
| 20 | when-is-my-mot-due | ~1,050 | Yes (4) | Yes | No | Yes |
| 21 | what-does-cat-n-s-mean | ~1,200 | Yes (4) | No | No | Yes |
| 22 | car-safety-recalls-guide | ~1,100 | Yes (3) | No | No | Yes |
| 23 | car-valuation-guide | ~1,150 | Yes (3) | No | No | Yes |
| 24 | how-to-check-if-car-is-stolen | ~1,100 | Yes (3) | No | No | Yes |
| 25 | cheapest-cars-to-tax-uk | ~1,050 | No | No | No | Yes |
| 26 | how-to-check-mileage-used-car | ~1,000 | No | No | No | Yes |
| 27 | first-car-checklist-new-drivers | ~1,100 | No | No | No | Yes |
| 28 | how-to-check-if-car-has-finance | ~1,000 | No | No | No | Yes |
| 29 | how-to-transfer-private-plate | ~1,050 | No | No | No | Yes |

### Other Pages

| Page | URL | Words | JSON-LD | OG | Issues |
|------|-----|-------|---------|-----|--------|
| Privacy | `/privacy` | ~1,500 | None | Yes | Missing BreadcrumbList JSON-LD |
| Terms | `/terms` | ~1,000 | None | Yes | Missing BreadcrumbList JSON-LD |
| Blog Index | `/blog` | ~100 | Breadcrumb, Blog | Yes | — |
| Cars Index | `/cars` | ~150 | Breadcrumb | Yes | Not linked from homepage |
| Unsubscribe | `/unsubscribe` | ~80 | None | No | No own metadata (inherits layout default) |
| Data Health | `/data-health` | ~50 | None | No | Correctly noindexed |
| Demo/RAC | `/demo/rac` | ~30 | None | No | Correctly excluded from sitemap |

---

## Phase 2: Content Pipeline

### Unpublished / Scheduled Posts
5 posts are scheduled for future publication:
1. `car-insurance-groups-explained` — **4 Mar 2026**
2. `euro-emission-standards-explained` — **6 Mar 2026**
3. `how-to-tax-a-car-online` — **8 Mar 2026**
4. `what-to-check-on-a-test-drive` — **10 Mar 2026**
5. `how-to-appeal-mot-failure` — **12 Mar 2026**

### Content Gaps Identified

The following high-value topics are NOT covered by any existing or scheduled post:

**MOT Funnel (highest priority — drives reminder signups + BMG revenue):**
- How much does an MOT cost?
- Can I get my MOT done early?
- Most common MOT failure reasons
- Do electric cars need an MOT?
- How long does an MOT take?

**Tax & Ownership:**
- What happens if my car tax expires?
- What is VED and how do road tax bands work? (standalone explainer)

**Buying:**
- Free alternatives to HPI check / Free car check vs HPI
- What is PCP finance and how does it work?

**Seasonal:**
- Spring car maintenance checklist
- Preparing your car for winter

### Recommended Next 10 Posts (Prioritised)

| Priority | Title | Slug | Target Keywords | Link To | MOT Reminder CTA | BMG CTA | Words |
|----------|-------|------|----------------|---------|-------------------|---------|-------|
| 1 | How Much Does an MOT Cost in 2026? | `how-much-does-mot-cost` | MOT cost, MOT price, how much is MOT, MOT test cost UK | /mot-check, /mot-reminder | Yes | Yes | 1,000 |
| 1 | Can You Get Your MOT Done Early? | `can-you-get-mot-done-early` | MOT early, early MOT, MOT before expiry, when can I MOT my car | /mot-check, /mot-reminder | Yes | Yes | 1,000 |
| 1 | Most Common MOT Failures and How to Avoid Them | `most-common-mot-failures` | MOT failure reasons, common MOT failures, why cars fail MOT, MOT fail list | /mot-check, /mot-reminder | Yes | Yes | 1,200 |
| 2 | How Long Does an MOT Take? | `how-long-does-mot-take` | how long does MOT take, MOT test duration, how long is MOT test | /mot-check, /mot-reminder | Yes | Yes | 900 |
| 2 | Do Electric Cars Need an MOT? | `do-electric-cars-need-mot` | electric car MOT, EV MOT, do EVs need MOT, electric car MOT test | /mot-check, /ulez-check | Yes | No | 1,000 |
| 2 | What Happens if Your Car Tax Expires? | `what-happens-car-tax-expires` | car tax expired, expired road tax, driving without tax, car tax penalty | /tax-check | No | No | 1,000 |
| 3 | Spring Car Maintenance Checklist | `spring-car-maintenance-checklist` | spring car check, car maintenance spring, car check after winter | /mot-check, /car-check | Yes | Yes | 1,000 |
| 3 | Free Car Check vs HPI — What's the Difference? | `free-car-check-vs-hpi` | free car check vs HPI, HPI alternative, free HPI check | /car-check | No | No | 1,200 |
| 3 | What Is PCP Finance? A Plain-English Guide | `what-is-pcp-finance` | PCP finance, PCP car finance explained, personal contract purchase | /car-valuation, /car-check | No | No | 1,000 |
| 3 | Preparing Your Car for Winter | `preparing-car-for-winter` | winter car check, prepare car winter, winter driving tips UK | /mot-check, /car-check | Yes | Yes | 1,000 |

---

## Phase 3: Discoverability Issues

### Sitemap
- **All public pages are in the sitemap** — no missing entries found
- Correctly excludes `/unsubscribe`, `/data-health`, `/demo/rac`
- Blog tag page `lastModified` dates are hardcoded to 2026-02-14 — should update dynamically
- Car guide pages share hardcoded `lastModified: 2026-02-20`

### robots.txt
- Properly allows all public routes, blocks `/api/`
- Includes AI crawler rules (GPTBot, ClaudeBot, etc.)
- References sitemap correctly
- `/demo/` is not blocked — minor issue (demo page won't rank anyway)

### Internal Linking Issues

**Critical:**
1. **`/mot-reminder` is orphaned** — zero inbound links from any page on the site
2. **Homepage doesn't link to `/mot-reminder`** — not in "What Can You Check?" cards or footer
3. **Homepage doesn't link to `/cars`** — 220 pages with no crawl path from homepage
4. **No site-wide navigation** — no persistent nav bar linking to /blog, /cars, /mot-reminder

**Moderate:**
5. **No landing page links to `/mot-reminder`** — /mot-check is the most natural candidate
6. **No blog posts link to `/mot-reminder`** — especially `when-is-my-mot-due` which discusses reminders
7. **Car guide pages don't link to any blog posts** — 220 pages with no blog cross-linking
8. **Footer is minimal** — only links to /terms and /privacy

### Technical SEO
- All pages have canonical URLs — consistent www usage
- All pages have H1 tags with primary keywords
- Heading hierarchy is correct (H1 → H2 → H3)
- RSS feed exists and is referenced in `<head>`
- Build passes cleanly (`tsc --noEmit` succeeds)

---

## Phase 4: MOT Reminder Funnel Status

### Current State
- **Results page:** MOT reminder signup appears prominently after the MOT status banner — good placement, high visibility
- **Adaptive behaviour:** Shows for valid MOTs only (days > 0). Hidden for expired MOTs (correct — expired gets BMG "Book MOT" CTA instead)
- **CTA text is static:** Same "Get free MOT reminders" regardless of urgency — doesn't adapt to 365 days vs 5 days remaining
- **Reminder emails (28d + 7d):** Well-designed with BMG affiliate links, proper disclosure, one-click unsubscribe

### Gaps
1. `/mot-reminder` landing page has zero inbound internal links
2. `/mot-check` landing page doesn't mention the reminder service
3. No blog posts link to `/mot-reminder`
4. `when-is-my-mot-due` blog post discusses reminders but doesn't link to the feature
5. No BookMyGarage CTA on the `/mot-reminder` landing page itself
6. Homepage "What Can You Check?" cards don't include MOT reminder

### BookMyGarage Integration
- **Merchant ID:** 68338 ✓
- **Affiliate ID:** 2729598 ✓
- **Reg pre-population:** Yes, via `buildLink(reg)` ✓
- **rel attributes:** `noopener sponsored` ✓
- **GA4 tracking:** `partner_click` events with context labels ✓
- **6 placements on results page:** header badge, MOT banner, 3 action prompts, MOT history inline
- **Blog posts:** Auto-appended on 6 MOT-keyword posts ✓
- **Reminder emails:** Both 28d and 7d emails include BMG links ✓
- **Disclosure:** Present in privacy/terms and on reminder form; could be more visible on results page

---

## Phase 5: New Posts Created

*See Phase 5 implementation below — posts will be listed here after creation.*

---

## Remaining TODO Items

1. **Add site-wide navigation** — persistent nav bar with links to key sections (requires design decision)
2. **Add `/mot-reminder` to homepage "What Can You Check?" cards** — straightforward addition
3. **Add `/cars` link to homepage** — footer or cards section
4. **Enrich footer** — add links to /blog, /cars, /mot-reminder across all landing pages
5. **Add FAQ structured data to 19 blog posts** — add `faqItems` to frontmatter
6. **Add HowTo structured data** to how-to-sorn-a-car, how-to-tax-a-car-online, how-to-transfer-private-plate, how-to-appeal-mot-failure
7. **Submit updated sitemap** to Google Search Console after all changes
8. **Consider consolidating** SORN posts (what-is-sorn + how-to-sorn) — significant overlap
9. **Add inline affiliate disclosure** near BMG links on results page (ASA compliance)
10. **Make header BMG badge use `buildLink`** when a vehicle is loaded (currently uses generic URL)
