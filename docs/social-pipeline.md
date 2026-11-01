# Social clips: the weekly pipeline

Three short vertical clips a week, made from the site's own data, posted by
hand through Buffer. An eight-week, no-voice, zero-spend trial from the week
of 9 November 2026 (ISO week 2026-W46). Nothing posts automatically: TikTok's
API posts privately until an account is audited, so the clips go through
Buffer's free plan (three channels, ten queued posts each).

The earlier hand-made reels and their account sheets live in `docs/social/`
(HTML reels with a record button, the brand guide, a two-week calendar).
This pipeline replaces that cadence with an automatic weekly one; the account
sheets there (`tiktok-account-setup.txt`, `instagram-account-setup.txt`)
still hold the handle, bio text and profile image.

## The weekly routine (Friday, about ten minutes)

1. **Thursday 22:00 UTC** the `Social Clips` workflow renders next week's three
   clips and publishes them as a GitHub release tagged `social-<week>`
   (for example `social-2026-W46`): three MP4s, three poster PNGs and
   `captions.json`.
2. **Friday 16:00 UTC** the weekly audit email arrives with a "This week's
   clips" section: each clip's poster, audience, a download link and its
   caption in a copyable block.
3. Download the three MP4s from the email's links.
4. In Buffer, create a post per clip: upload the MP4, paste the caption as it
   is, pick the channel group (TikTok, Instagram, Facebook), and schedule:
   - **Monday** at about 18:00: the brand clip (search / data story),
   - **Wednesday** at about 18:00: the sellers clip (valuation),
   - **Friday** at about 18:00: the MOT clip.
5. Done. The captions already end with `freeplatecheck.co.uk` and the
   hashtags; the clickable link lives in each profile's bio (below).

If the email says "No clips to post this week", open the repository's
Actions tab, run **Social Clips** by hand (`Run workflow`, leave `week`
blank), and the release appears a few minutes later. `captions.json` on the
release has the same captions if the email is ever late.

## One-time setup

**Buffer (free plan).** One account, three channels: TikTok, Instagram and
Facebook Page. Buffer's free plan allows ten scheduled posts per channel, more
than the three a week this needs. Cross-posting is simplest as one Buffer post
with all three channels selected; TikTok's own share options can also
cross-post a published TikTok to Reels.

**TikTok.** Switch the account to a Business account (Settings → Account →
Switch to Business Account; category Automotive). Then check whether a
**Website** field appears under Edit profile. If it does, set it to the UTM
link below; if not (TikTok gates it by follower count and region), keep the
plain domain in the bio text, where it is not clickable but is readable and
typeable. Handle and bio text: `docs/social/tiktok-account-setup.txt`.

**Instagram.** A Professional (Business) account is free and makes the
Website field clickable. Set it to the UTM link below. Handle and bio text:
`docs/social/instagram-account-setup.txt`.

**Facebook Page.** Put the UTM link in the page's Website field and in the
About text.

**Bio links** (one per platform, so the audit can tell them apart):

```
https://www.freeplatecheck.co.uk/?utm_source=tiktok&utm_medium=social&utm_campaign=bio
https://www.freeplatecheck.co.uk/?utm_source=instagram&utm_medium=social&utm_campaign=bio
https://www.freeplatecheck.co.uk/?utm_source=facebook&utm_medium=social&utm_campaign=bio
```

`captions.json` also carries a per-week link for each platform
(`utm_campaign=<week>`) for anywhere a link can be placed per post. The site
records `utm_source` on page views, and the audit's **Social** line counts
visitors by source and what those sessions went on to do (results views, cars
saved, partner clicks).

## Go / no-go

Eight weeks after the first post (first post Monday 9 November 2026, so the
review falls in the week of 4 January 2027), the trial continues if **two of
three** hold:

| Measure | Bar |
|---|---|
| Total views across the three platforms (platform analytics) | 50,000 |
| UTM-tagged visits in a month (the audit's Social line, summed) | 200 |
| TikTok followers | 1,000 |

Fewer than two: stop the Buffer routine (the Thursday job can keep running
harmlessly, or be disabled in Actions) and keep the renderer for one-off
clips.

## How it works

- `social/` is a Remotion project with its own `package.json` and install
  (outside the Next build). `social/README.md` describes its layout.
- The calendar (`social/src/calendar.ts`) picks each ISO week's three topics
  deterministically and walks each topic's subject list before repeating, so
  nothing repeats for months. `npm run social:plan -- --weeks 12` prints what
  is coming; `npm run social:preview` opens Remotion Studio.
- `.github/workflows/social-clips.yml` installs the renderer, renders the
  three clips (capped at ten minutes) and publishes the release. Re-running
  it for the same week replaces the release's assets with identical clips.
- `src/lib/social-clips.ts` reads the latest `social-*` release through the
  public GitHub API (no token) for the audit email, and fails soft to a
  one-line note if the API or the release is unavailable.
- Rules baked in: never a real registration (the closing card shows a sample
  plate), aggregate figures only, no partner names or offers in any clip or
  caption. `npm run social:check` runs the calendar test that enforces the
  caption rules; `npm test` covers the email section.

## Adding a template

1. Add the topic to the right rotation in `social/src/calendar.ts`
   (`BRAND_TOPICS`, `SELLERS_TOPICS` or `MOT_TOPICS`). Its position sets how
   often it comes round.
2. Define its props in `social/src/props.ts`; write a picker in
   `social/src/pickers/` that fills them from `src/data/` and returns the
   title, caption body, hashtags and source. Keep any subject list (models,
   areas) exported so the test can check every entry exists in the data.
3. Write the composition in `social/src/compositions/` using `Clip` from
   `shared.tsx` (hook in the top third, intro line, data area, outro line,
   closing card), register it in `social/src/Root.tsx`, and route the topic
   in `social/src/plan.ts`.
4. Look at it: `npm run gallery` inside `social/` renders a still of every
   variant to `social/out/gallery/`; `npm run social:preview` plays it.
5. `npm run social:check` must pass (rotation, determinism, no plates, no
   partner names), then render a week locally to confirm the timing.
