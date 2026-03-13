# Site Health Report — 13 March 2026

## Critical (fix immediately)

- ~~**Footer missing site navigation links**~~ — FIXED. Added nav row with links to /blog, /stats, /cars, /mot-reminder, /car-valuation, /ulez-check. Also added /stats link to header nav and /stats + /mot-reminder to blog post footers.

- ~~**Recharts not dynamically imported**~~ — Downgraded: chart components are `'use client'` and App Router code-splits them per-route automatically. Recharts JS only loads on stats page visits. Using `next/dynamic` with `ssr: false` would add a small improvement (deferred client-side loading) but is not critical. Moved to Important.

## Important (fix this sprint)

- **No Cache-Control headers on main API routes** — `/api/lookup`, `/api/valuation`, `/api/recalls`, `/api/fuel-economy` return responses without `Cache-Control` headers. Repeat lookups for the same plate hit the upstream DVLA/MOT APIs unnecessarily. Consider short-lived caching (`s-maxage=300, stale-while-revalidate=600`) for lookup responses.

- **Stats pages lack Dataset structured data** — None of the 13 stats pages include JSON-LD `Dataset` schema. Adding it would improve visibility in Google Dataset Search and rich results. Each stats page should include at minimum: `name`, `description`, `url`, `license`, `creator`.

- **Stats hub not linked from main page header** — The header nav at `page.tsx:2819-2826` links to Guides & Tips and MOT Reminders but not the Stats hub. Adding a `/stats` link would improve discoverability and internal link equity.

- **No /about page** — The sitemap references no `/about` route and the page does not exist. An About page builds trust (E-E-A-T signal for Google). Consider creating a minimal About page explaining the service, data sources, and team.

## Minor (nice to have)

- **SaaSHub badge uses external `<img>`** — `page.tsx:5054-5060` loads `cdn-b.saashub.com` badge as a plain `<img>` tag. While `width` and `height` are set (good for CLS), using `next/image` with `unoptimized` would be more consistent.

- **No Service schema on MOT reminder page** — `/mot-reminder` uses `WebApplication` schema rather than `Service`. `WebApplication` is acceptable but a `Service` schema would be more semantically precise for a reminder service.

- **Blog post OG images fall back to site-wide default** — Individual blog posts don't set a unique `og:image` in their openGraph metadata (they use the generated opengraph-image route, which is correct, but the metadata export doesn't reference it explicitly). This is handled by Next.js auto-detection of `opengraph-image.tsx` files, so it works but could be more explicit.

- **Tag page lastModified is hardcoded** — `sitemap.ts:15` uses a fixed date `2026-02-14` for all tag pages. Should derive from the most recent post in each tag.

## Passed checks

- **Sitemap dynamically generated** — `src/app/sitemap.ts` includes all routes: home, blog posts, tag pages, car makes/models, stats pages, landing pages, privacy, terms. Blog posts are automatically added via `getAllPosts()`.
- **robots.txt properly configured** — Allows all crawlers, blocks `/api/`, includes sitemap URL, welcomes AI bots (GPTBot, ClaudeBot, etc.)
- **Canonical URLs on all pages** — Every page type exports `alternates.canonical` with absolute URLs
- **Unique title and description on all pages** — All 30+ pages have distinct `<title>` and `<meta name="description">` tags via metadata exports
- **Description lengths within range** — Spot-checked descriptions are 120-160 chars
- **Open Graph tags complete** — `og:title`, `og:description`, `og:url`, `og:image` present; image URL is absolute (`https://www.freeplatecheck.co.uk/og-image.png`)
- **Twitter Card tags present** — `summary_large_image` card type with title and description
- **WebSite schema with SearchAction** — `layout.tsx` includes JSON-LD for sitelinks search box
- **Organization schema** — Present in root layout
- **BlogPosting schema on all blog posts** — Includes `datePublished`, `dateModified`, `author`, `headline`
- **BreadcrumbList schema** — Present on blog posts, stats pages, car guides, MOT reminder page
- **FAQPage schema** — Present on homepage, blog posts with FAQ items, landing pages, MOT reminder page
- **HowTo schema** — Conditionally rendered on blog posts with `howToSteps`
- **WebApplication schema** — Present on tool pages (car-valuation, MOT reminder)
- **Blog posts link back to homepage** — Every post has a contextual CTA (topic-aware) linking to the relevant tool
- **Stats pages link to vehicle check** — `StatsCTA` component with "Check Your Own Vehicle" button on every stats page
- **Header links to /blog and /mot-reminder** — Present at `page.tsx:2819-2826`
- **RSS feed dynamically generated** — `/feed.xml` reads from blog content directory at request time with 1-hour cache
- **Blog loader supports future-date filtering** — `isPublished()` function in `blog.ts:92-96` hides posts with `date > today`
- **Build completes successfully** — All static pages prerendered without errors
- **Affiliate links properly attributed** — `rel="noopener sponsored"` on all BookMyGarage links via `getPartnerRel()`
- **Security headers configured** — X-Content-Type-Options, X-Frame-Options, Referrer-Policy in `next.config.ts`
- **Domain canonicalization** — Middleware redirects non-www and .com variants to `www.freeplatecheck.co.uk`
- **No broken internal routes** — All `<Link>` and `<a>` hrefs map to existing page routes
- **Google Search Console verified** — Verification meta tag present in root layout
- **PWA manifest configured** — `site.webmanifest` with icons and theme colours
- **No duplicate content risk** — No `/home` or alternative paths serving identical content
- **Compression enabled** — `next.config.ts` has `compress: true`
- **Static assets cached immutably** — Images and `_next/static` files get 1-year cache headers

---

## Email Capture — Current State

### Existing capture points
1. **Results page inline form** — `page.tsx:~3523` — Single email field with "Remind Me" button. Appears within the MOT history section. VRM is auto-populated from current lookup. Shows success message with MOT expiry date.
2. **MOT reminder landing page** — `/mot-reminder` — No form on this page; directs users to homepage to look up a vehicle first, then set a reminder from results.
3. **General email signup** — `/api/signup` — Stores to `email_signups` Supabase table with optional MOT reminder flag.

### Form details
- **Fields:** Email only (single field). VRM passed as hidden field from current lookup.
- **VRM auto-populated:** Yes — uses the current vehicle's registration from lookup state.
- **Success state:** Yes — shows confirmation message with the MOT expiry date.
- **Double opt-in:** No — single opt-in. Confirmation email sent via Resend but no verification link required.

### Resend integration status
- **Fully wired up** — `src/lib/resend.ts` sends emails via Resend API
- **Sender:** `MOT Reminders <reminders@freeplatecheck.co.uk>`
- **Templates:** 3 React Email templates in `src/emails/`:
  - `mot-reminder-set.tsx` — Confirmation (green)
  - `mot-reminder-28d.tsx` — 28-day warning (amber) with BookMyGarage CTA
  - `mot-reminder-7d.tsx` — 7-day warning (red) with BookMyGarage CTA
- **Unsubscribe:** One-click via UUID token, RFC 2369 compliant List-Unsubscribe headers
- **Cron:** `/api/cron/mot-reminders` sends 28d and 7d reminders, max 80/run, bearer token auth

### Supabase tables
- `mot_reminders` — email, vrm, make_model, mot_expiry, reminder_28d_sent, reminder_7d_sent, active, unsubscribe_token — UNIQUE(email, vrm)
- `email_signups` — email, source, wants_reminders, last_vrm_hash, mot_expiry, tax_due

### What's missing (for Phase 2)
- No capture trigger for MOT due within 60 days (Trigger A)
- No capture trigger for expired MOT (Trigger B)
- No capture trigger for MOT due > 60 days (Trigger C)
- No homepage copy mentioning email reminders (Trigger D — partially exists in header)
- No post-PDF-download capture prompt (Trigger E)
- No blog post footer email capture (Trigger F)
- Only 1 email capture point exists on the results page (within MOT section)
