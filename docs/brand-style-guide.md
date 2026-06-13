# Free Plate Check — Brand & Style Guide

**Version 1.0 · June 2026 · Source of truth for all Instagram & TikTok content**

This guide is derived directly from the live product (freeplatecheck.co.uk). Every value here is real — pulled from the codebase, not invented. **Anything produced by Claude Design (or any tool) for our social channels must conform to this guide strictly.** When in doubt, default to what's written here.

> **How to use this with Claude Design:** paste this document in as a hard style constraint at the start of every brief. Reject any asset that breaks the colour, type, plate, motion, or tone rules below. Consistency is the whole point — the channels should look like one unmistakable brand from the first frame.

---

## 1. Brand essence

**What we are:** the free, no-nonsense UK vehicle-check brand. Enter a number plate, get the truth about a car — MOT, tax, mileage, ULEZ, recalls, valuation — instantly, with no signup and no email.

**Personality:** Honest · Plain-speaking · Reassuring · Quietly clever · British. We're the knowledgeable mate who tells you straight, not the pushy salesman.

**The promise in three words:** *Free. Instant. Honest.*

**We are NOT:** hypey, jargon-heavy, fear-mongering, cluttered, or salesy. We never manufacture panic to sell something. We lead with genuine value and let the product earn trust.

---

## 2. Logo & brand mark

### The bolt mark
A **custom geometric lightning bolt** — asymmetric, forward-leaning, sharper than a generic "zap". It signals *instant* (electric, fast) and is the core visual icon.
- **Gradient:** cyan `#22d3ee` → electric blue `#3b82f6` (top-left to bottom-right).
- **Monochrome contexts:** solid white. On light backgrounds (rare), solid `#0f172a`.
- **Geometry (for redrawing):** viewBox `0 0 24 32`, path `M 15 0 L 5 17 L 12 17 L 10 32 L 19 15 L 12 15 Z`. Always reproduce this exact silhouette — do not substitute a stock lightning icon.
- Optional soft glow (cyan) for hero/animated moments only.

### The wordmark
**"Free Plate Check"** set in the brand sans, bold (700), tight leading. Usually paired with the bolt mark to its left.

### Lockups & clear space
- **Primary lockup:** bolt mark + "Free Plate Check" horizontal.
- **Icon only:** bolt mark alone for profile pictures / app-icon contexts / end-card stamps.
- **Clear space:** keep clear margin around the lockup equal to the height of the bolt mark. Never crowd it.

### Logo don'ts
- ✗ Don't recolour the bolt outside the cyan→blue gradient / white.
- ✗ Don't add drop shadows, bevels, or outlines (the optional cyan glow is the only effect).
- ✗ Don't stretch, rotate, or rearrange the lockup.
- ✗ Don't place the gradient bolt on a busy or low-contrast background — use the white version there.

---

## 3. Colour palette

The brand lives on a **near-black slate canvas** with an **electric cyan→blue accent**. Colour is used sparingly and semantically — never decoratively.

### Core canvas (backgrounds)
| Role | Name | Hex |
|---|---|---|
| Deepest canvas | slate-950 | `#020617` |
| Panel / section | slate-900 | `#0f172a` |
| Card / surface | slate-800 | `#1e293b` |
| Border / divider | slate-700 | `#334155` |

> Backgrounds are typically layered with subtle transparency (e.g. `slate-900/60`) and very soft radial cyan/blue glows at the top of heroes. Keep them dark and calm — the data is the star.

### Brand accent (the electric core)
| Role | Name | Hex |
|---|---|---|
| **Primary accent / glow** | cyan-400 | `#22d3ee` |
| Accent deep | cyan-500 | `#06b6d4` |
| Secondary accent | blue-500 | `#3b82f6` |
| Accent deep blue | blue-600 | `#2563eb` |
| **Brand gradient** | cyan→blue | `#22d3ee → #3b82f6` |

The **cyan→blue gradient** is the single most important brand signature after the plate. It appears on the bolt, primary buttons, the frosted plate glow, the scan beam, focus states, and loading shimmer. Use it for *the one thing you want the eye to go to* — never everywhere at once.

### The plate yellow
| Role | Name | Hex |
|---|---|---|
| **UK reg plate / "Sample" tag** | amber-400 | `#fbbf24` |

Reserved almost exclusively for the **reg-plate pill** and small "Sample" stamps. It reads instantly as "UK number plate." Do not use it as a general accent.

### Status / semantic colours
Used only to communicate state — good/warn/risk/info. Never decorative.
| State | Colour | Hex | Meaning |
|---|---|---|---|
| Good / Free / Pass | emerald-400 | `#34d399` | positive, "it's free", all clear |
| Warn | amber-400 | `#fbbf24` | caution, due soon |
| Risk / Fail | red-500 | `#ef4444` | danger, walk away |
| Info | blue-400 | `#60a5fa` | neutral fact |

Status text colours pair with very dark tinted backgrounds (e.g. emerald text on `emerald-950/40`).

### Text colours
| Role | Hex |
|---|---|
| Headings | slate-100 `#f1f5f9` |
| Body | slate-300 `#cbd5e1` |
| Muted / secondary | slate-400 `#94a3b8` |
| Labels / captions | slate-500 `#64748b` |

### Colour rules
- ✓ Dark canvas, ~one accent moment per frame, status colour only when it means something.
- ✗ No light/white backgrounds for social (the brand is dark-native; the only light surface is the print PDF, which is not our social look).
- ✗ Never combine emerald + amber + red decoratively — those carry meaning.
- ⚠ `#1b54ff` is **carVertical's** brand blue (a partner), **not ours**. Only use it inside explicitly carVertical-branded content, never as a Free Plate Check accent.

---

## 4. Typography

### Type families
- **Sans (everything except data):** the site uses **Arial / Helvetica** (a clean neutral grotesque). For social, use **Helvetica Neue / Arial**, or **Inter** as a free, near-identical stand-in. Keep it neutral and legible — no character fonts.
- **Mono (data, plates, numbers, technical):** **Geist Mono**. This is a deliberate signature — *anything that is data reads in mono*: reg plates, mileage figures, prices, dates, VINs, stats. Free Google-font fallback: **JetBrains Mono** or **Roboto Mono**.

### The mono convention (important)
Mono = "this is real, machine-true data." Use it for every number and plate. Sans = human language (headlines, explanations, CTAs). This sans-vs-mono split is a core part of the look — keep it consistent.

### Weights & casing
- Headlines: **Bold (700)**, tight leading, slate-100.
- Body: Regular (400), slate-300.
- **Labels / section dividers:** UPPERCASE, small (10–12px), **letter-spacing ~0.18em**, slate-500. (e.g. "HEALTH & SAFETY", "NEXT STEPS".) This tracked-uppercase micro-label is a recurring brand tic — use it for section tags and kickers.

### Type scale (for 1080×1920 reels — guidance)
| Use | Size (approx, px on 1080w) | Weight |
|---|---|---|
| Hook headline | 90–130 | Bold |
| Subhead | 54–70 | Bold/Medium |
| Body line | 40–52 | Regular |
| Plate / big number | 80–160 (mono) | Bold mono |
| Tracked label/kicker | 28–34 UPPERCASE | Semibold, 0.18em |
| Disclosure / caption | 24–28 | Regular, slate-400 |

---

## 5. The signature device: the UK reg plate

The number plate is **the hero motif of the brand**. Use it as the visual anchor in most content. Two official treatments:

### A. Amber pill (the "instant UK plate")
- **Amber-400 `#fbbf24`** rounded-full pill, subtle inner shadow.
- **Black bold mono** text (`slate-900`), wide letter-spacing.
- Reads instantly as a UK plate. Use for inline/label moments, lists, and where the plate is *a* thing on screen, not *the* thing.

### B. Cyan frosted plate (the "hero")
- Translucent dark plate (`slate-900/60`) with **cyan `#22d3ee` border (40% opacity)**, backdrop blur, and a **soft cyan→blue glow halo** behind it.
- **Cyan-tinted mono** text (`cyan-100`), wide tracking.
- Use when the plate **is** the design — the opening frame of a reel, the focal reveal, the "scan this plate" moment.

**Format plates realistically:** `AB12 CDE` style (two letters, two digits, space, three letters). Use plausible fakes like `AB12 CDE`, `MA66 JVK`, `LP15 XYZ`, `VN23 BCD` — never a real member of the public's plate.

---

## 6. Iconography

- **Style:** [Lucide](https://lucide.dev) line icons — consistent ~2px stroke, rounded joins, no fills. This is what the whole product uses; match it exactly.
- Colour icons by meaning (status colours) or in slate/cyan for neutral.
- Recurring icons in our world: ShieldCheck (health/safety), Gauge (mileage), Receipt (tax), Wind (ULEZ), AlertTriangle (recall/warn), PoundSterling (valuation), CheckCircle2 (pass/free), Bell (reminders), Search (lookup).
- ✗ Don't mix icon sets, use filled/3D/emoji icons, or skeuomorphic illustrations.

---

## 7. Components → social translation

Translate these live UI patterns into motion-graphic elements so the channels feel like the product:

- **Cards:** dark surface (`slate-900/60`), 1px slate border (`slate-700/50`), generous rounded corners (12–24px radius), soft depth. Lots of breathing room — never cramped.
- **Pills / badges:** small rounded-full chips. Outline + tinted fill in the relevant colour (e.g. emerald pill = "Free", amber pill = plate).
- **Status chip:** icon + short label in a status colour on a dark tinted background. Great for "MOT: PASS", "Tax: DUE SOON", "Stolen: CLEAR".
- **"Sample" stamp:** tiny amber-400 uppercase tag, slightly rotated, top-right corner — our way of marking an example result.
- **Confidence band:** a low/medium/high indicator — honest about certainty. On-brand because we never overclaim.
- **The discount/offer pill:** emerald outline pill (only where genuinely relevant; keep it tasteful, never the hero).

**Spacing & radius rhythm:** corner radii step up with element size (8 → 12 → 16 → 24px). Padding is generous. The brand feels *calm and uncluttered* — when unsure, add space.

---

## 8. Motion & animation (the reel signature)

This is where the brand comes alive — and we have a defined motion language. **Use one brand easing for almost everything:**

> **Brand easing:** `cubic-bezier(0.16, 1, 0.3, 1)` — a smooth, confident ease-out ("expo out"). Things arrive decisively and settle softly. Avoid bouncy/elastic easing.

### Signature motions (reuse these — they ARE the brand)
1. **The scan beam** ⭐ *(the hero motion)* — a **vertical cyan beam sweeps down** over the plate/screen (~750ms), revealing data as it passes, like scanning a plate or running the DVLA check. Use this as the core "reveal the truth" device in reels. Pair with a subtle haptic-style flash.
2. **Wordmark sweep** — the logo reveals via a left-to-right `clip-path` wipe with a brief cyan drop-shadow glow (~800ms). Use for logo entrances/end-cards.
3. **Fact materialise** — content **rises slightly (10px), sharpens from a soft blur, and fades in** (~560ms). Perfect for "Did you know?" facts and stat reveals — they *materialise* rather than just appear.
4. **Data shimmer** — a cyan gradient sweeps across a placeholder (1.8s loop) to say "data incoming." Use for loading/anticipation beats.
5. **Staggered reveal** — stack elements in with small sequential delays (≈50–80ms apart) so a card builds up in order, not all at once.

### Motion rules
- Cyan is the colour of *motion and energy* (beams, glows, shimmer). Keep moving light cyan/blue.
- Movement is **purposeful and smooth**, never frantic. We're confident, not hyperactive.
- Numbers can count up; plates can "lock in"; facts materialise. Data should feel *revealed*, not decorated.

---

## 9. Tone of voice & copy

### Principles
- **Plain English, no jargon.** Explain like you're helping a friend buy a car. If a term needs explaining (Cat S/N, ULEZ), explain it simply.
- **Honest and balanced.** Say what's free *and* what isn't. Never overclaim. Our credibility is the asset.
- **Value first, sell never (or barely).** Lead with something genuinely useful. Any product/affiliate mention is a light, clearly-disclosed aside.
- **Calm, not clickbait.** We can be intriguing ("Most people don't know this about their MOT…") but we don't manufacture fear or fake urgency.
- **British English, always.** colour, tyre, kerb, number plate (not "license plate"), MOT, £. UK context throughout (DVLA, DVSA, ULEZ, V5C).
- **Data-led.** Real numbers and real records beat adjectives. "1 in 16 used cars has been clocked" > "loads of cars are dodgy."

### Voice: do / don't
- ✓ "Enter your reg — free, no email, no signup."
- ✓ "Your MOT history is public. Here's how to read it."
- ✓ "A free check catches most problems. For finance and write-offs, you need a paid report."
- ✗ "URGENT: Your car could be a DEATH TRAP!!!"
- ✗ "The #1 BEST car check tool EVER 🔥🔥🔥"
- ✗ American spellings, hype emojis as a substitute for substance.

### Emoji & punctuation
- Use emoji **sparingly** and only where natural — never as hype filler. A single tasteful emoji in a caption is fine; rows of 🔥🚗💯 are off-brand.
- Em-dashes and clean sentences. Proper £ symbols. Mono for any number you can.

### Affiliate disclosure on social
If a reel mentions a paid partner (e.g. carVertical), include a clear, plain disclosure — on-screen text and/or caption: *"We may earn a commission, at no extra cost to you."* Never bury it. (And never promote partners off the back of the MOT-reminder email list — that's single-purpose.)

---

## 10. Social format & delivery specs

- **Canvas:** 1080 × 1920 (9:16), vertical. Also export 1080×1350 (4:5) for IG feed where useful.
- **Safe areas:** keep key text/logo **out of the bottom ~420px and top ~220px** (TikTok/IG UI: captions, profile, buttons cover these). Centre the hero plate/headline in the safe middle band.
- **Hook in the first 1 second.** Open on the plate, a bold question, or a surprising number. No slow intros.
- **End-card:** bolt mark + "Free Plate Check" + a plain CTA ("Free check at freeplatecheck.co.uk — no email"). Wordmark-sweep it in.
- **Captions/subtitles:** burn in on-screen text (most watch muted). High contrast: slate-100 text, optionally on a subtle dark scrim.
- **Length:** 7–25s for most reels; tight and punchy.
- **Consistency:** same dark canvas, same mono-for-data, same plate device, same cyan accent, same end-card — every single post.

---

## 11. Recurring reel templates (starting set)

Build a library so output stays on-model:
1. **"Scan reveal"** — frosted plate centre, scan beam sweeps, the car's MOT/tax/mileage data materialises beneath. The flagship format.
2. **"Did you know?"** — a surprising make/model or UK-motoring fact materialises over a dark card with one accent icon. (Mirrors our on-site fact card.)
3. **"Free vs Paid"** — two-column comparison: emerald ticks (free check) vs the extra rows a paid report adds. Honest, clear.
4. **"Spot the clocking"** — a mileage timeline with one number that drops — the red flag. Teaches + shows the tool.
5. **"Read your MOT"** — explainer breaking down an advisory in plain English.
6. **"Stat drop"** — one big mono number counts up (theft rates, average mileage, how-many-left), one line of context.

---

## 12. Quick-reference do / don't

**Always:** dark slate canvas · cyan→blue accent for the one focal moment · mono for every number/plate · the plate as hero device · Lucide line icons · brand easing · honest, plain British English · disclose partners · keep it calm and uncluttered.

**Never:** light backgrounds · stock lightning icons · amber as a general accent · carVertical blue as our colour · jargon, hype, fake urgency · American spellings · cramped layouts · status colours used decoratively · emoji spam.

---

*Maintained alongside the product. If the site's look evolves, update this guide so the channels never drift from the brand.*
