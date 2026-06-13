# Brand-Aligned Social Content System — Setup Playbook

**Purpose:** stand up the same brand-driven social-content system we built for
*Free Plate Check* (TikTok/Instagram) for another business. This file is written as
**first-session instructions for Claude Code**: open Claude Code in the business's
repo, point it at this file, and work through the phases in order.

> ⚠️ **Read this first — do NOT copy Free Plate Check's brand.** FPC is the *reference
> implementation* (it shows the structure and the quality bar), but its look (dark
> slate canvas, electric-cyan accent, the UK number-plate motif, mono-for-data) is
> **specific to FPC**. For this business you will derive a **completely new brand**
> from *its own* live website and product. Use FPC only as a template for the
> *process and the artifact structure*, never for the visual values.

---

## How to use this file (instructions to Claude)

1. Confirm the business, its website, and the target platforms (likely TikTok +
   Instagram). For this engagement that is **Verse Medical Aesthetics**
   (`versemedicalaesthetics.com`).
2. Work through **Phase 1 → 2 → 3** below, in order. Phase 1 (the brand guide) gates
   everything else — don't build content before the guide exists and is agreed.
3. Treat the brand guide as a **strict quality gate**: reject any asset that breaks its
   colour, type, motion, tone, or compliance rules.
4. **Verify by viewing.** When you produce a visual (a reel HTML, an image), actually
   open/screenshot it and check it before saying it's done. Expect several refine passes
   on craft details (crispness, timing, easing, safe-areas for the platform UI).
5. Use British English if the business is UK-based. Report status honestly.
6. Commit work on a branch and open a PR (don't commit straight to a protected `main`).

---

## The system at a glance

A single **Brand & Style Guide** (the source of truth) drives a small **content
pipeline**, all living in `docs/social/`:

- **Brand & Style Guide** — `docs/brand-style-guide.md`. Every value derived from the
  live site. The contract for all output.
- **Reels** — self-contained animated **1080×1920 HTML** files (one per reel). They
  include a built-in **"Rec" capture button** that pins the stage to the screen-record
  size, so you record the dark/clean stage directly. No video editor needed.
- **Soundtrack assembler** (optional) — an in-page tool that synthesises beds + a
  brand "audio logo" and lets you drop a few SFX onto cue-sheet timecodes, then export
  one synced WAV. Has a **cue-sheet dropdown** (one preset per reel).
- **Audio cue sheets** — `*-audio-cue-sheet.md`, one per reel (timecoded).
- **Account setup sheets** — `tiktok-account-setup.txt`, `instagram-account-setup.txt`
  (handle, display name, bio within each platform's char limit, website, first-post
  caption + hashtags, account-type guidance).
- **Content calendar** — `content-calendar.md`: a 2-week, product/service-led plan
  mapping brand reel-templates onto specific offerings.

---

## Phase 1 — Build the Brand & Style Guide (do this first)

Create **`docs/brand-style-guide.md`**. **Derive every value from the live product /
website** (fetch the site, read the codebase if present) — real colours, fonts, logo,
imagery style, copy voice. Do not invent values; when unsure, inspect the site.

Produce these sections (this is the structure that worked for FPC — adapt the *content*
to this brand):

1. **Brand essence** — what they are, personality (3–6 adjectives), the promise in a few
   words, and an explicit "we are NOT" list.
2. **Logo & mark** — exact geometry/usage, lockups, clear space, colour variants, don'ts.
3. **Colour palette** — canvas/background, primary accent, secondary, semantic/status,
   text colours — with hex values pulled from the site. State how colour is used
   (sparingly? one accent moment per frame?).
4. **Typography** — type families (with free Google-font stand-ins), weights, casing,
   any signature convention, and a type scale for 1080×1920.
5. **Signature device / motif** — the one recurring visual anchor (FPC's was the plate).
   Identify this brand's equivalent.
6. **Iconography** — icon set + style rules.
7. **Components → social translation** — turn live UI patterns (cards, pills, chips)
   into motion-graphic elements so the feed feels like the product.
8. **Motion & animation** — one brand easing; 3–6 named signature motions to reuse.
9. **Audio — the sonic signature** — a shared layer (identical on every reel) + a
   per-reel diegetic palette; tonal palette; royalty-free/own-audio only.
10. **Tone of voice & copy** — principles, do/don't lines, emoji/punctuation, spelling.
11. **Social format & delivery specs** — canvas sizes, **safe areas** (keep key content
    out of the platform UI: top bar, bottom caption, and the **right-hand button rail**),
    hook-in-first-second, end-card, length, consistency.
12. **Recurring reel templates** — a starter library of repeatable formats.
13. **Do / don't quick-reference.**
14. **Compliance** — see the sector note below; for regulated sectors this is a
    first-class section, not an afterthought.

---

## Phase 2 — Build the content pipeline (`docs/social/`)

Once the guide is agreed:

1. **First flagship reel** as a self-contained `1080×1920` HTML on a single stage:
   - Strong hook in the first second; use the brand's signature motions + device.
   - Add a **"Rec" button** that scales the stage to the user's screen-record size
     (pin to a corner, downscale from native 1080 for crispness) plus Fit/100%.
   - Respect safe areas (top, bottom caption, right button rail).
   - End on the brand sign-off (logo reveal + a plain CTA).
2. **Account setup sheets** for each platform — handle (keep identical across
   platforms), display name, **bio within the platform's character limit** (write 2–3
   options + note limits), website, first-post caption + hashtags, and account-type
   guidance (business vs creator; what each unlocks; any verification quirks).
3. **Content calendar** — 2 weeks, service-led, varied; map templates → offerings; note
   which posts are Reels vs carousels (Reels for reach, carousels for saves/depth).
4. (Optional) **Soundtrack assembler + per-reel audio cue sheets** if you want scored
   audio. Synthesise beds/brand-sting in-page; drop only a couple of SFX.

---

## Phase 3 — Working conventions

- **Brand guide is the gate** — check every asset against it before shipping.
- **View, then claim** — open/screenshot rendered output; never assert a visual is fixed
  without checking. Be honest if something is only described, not yet done.
- **Iterate on craft** — expect refine passes (blur quality, angles, timing, safe-areas).
- **Git** — branch + PR; run the repo's quality gates before pushing; clear commit
  messages with the project's trailer.
- **Memory** — record the content system's structure + the user's standards so future
  sessions start informed.

---

## Adapting for Verse Medical Aesthetics specifically

**Brand:** it will look nothing like FPC. Medical aesthetics tends toward *calm, premium,
clean, trustworthy, clinical-but-warm* — likely soft/neutral palettes, elegant type,
generous space, real practitioner/clinic imagery. **Derive it from
`versemedicalaesthetics.com`**, not from any assumption here.

**Trust is the product.** Lead with credentials, qualifications, safety, consultation
process, and realistic expectations — not pressure or hype.

**⚠️ Regulatory compliance is a first-class constraint (UK medical aesthetics).** Build a
**Compliance** section into the brand guide and check every asset against it. Key points
to research and confirm against *current* guidance (ASA/CAP, MHRA, and the relevant
professional body — GMC/GDC/NMC/GPhC):

- **Prescription-only medicines (POMs) cannot be advertised to the public.** Botulinum
  toxin ("Botox") is a POM — do **not** name or promote it in content. Use compliant
  language (e.g. "anti-wrinkle / wrinkle-relaxing treatments") and don't promote the POM
  itself. Verify current MHRA/ASA position before publishing.
- **No marketing of these treatments to under-18s** (and it is illegal to administer
  toxin/filler to under-18s in England). Don't target or appeal to minors.
- **Before/after & results claims** — strict ASA rules; must not mislead, must be typical
  and substantiated, manage expectations; extra care for POM-related results.
- **Substantiate all claims**; avoid exaggeration, "miracle"/permanence claims, and
  pressure selling (limited-time pressure on health decisions is a red flag).
- **Professional advertising standards** of the practitioner's regulator apply.

> This is guidance, not legal advice — confirm the current rules and have the clinic's
> responsible prescriber / a compliance-aware professional review the content plan.

**Tone:** reassuring, expert, plain, unhurried. Educate and build confidence; let the
results and professionalism earn trust.

---

## Reference — what the Free Plate Check system looks like (the quality bar)

In the FPC repo, `docs/social/` contains: `brand-style-guide.md` (the strict guide,
incl. an "audio sonic signature" section); animated reels (`howmanyleft-metro.html`,
`scan-reveal.html`) each with a "Rec 805" capture button; `fpc-soundtrack-assembler.html`
(synth beds + cue-sheet dropdown); per-reel `*-audio-cue-sheet.md`; `content-calendar.md`;
and `tiktok-`/`instagram-account-setup.txt`. Brand social links live in the site footer.
Aim for that same depth and internal consistency — with Verse's own brand.

---

*Start by saying: "Begin Phase 1 — build the Verse Medical Aesthetics brand guide from
the live site." Then work down.*
