# Social clips: the three-weekly pipeline

Three short vertical clips a week, made from the site's own data, posted
through Buffer, queued three weeks at a time. An eight-week, no-voice,
zero-spend trial from the week of 2 November 2026 (ISO week 2026-W45).
Nothing posts automatically from this repository: TikTok's API posts
privately until an account is audited, so the clips go through Buffer's free
plan (three channels, ten queued posts each), which is also why the batch is
three weeks: nine posts per channel, queued on a Sunday when the previous
batch has all gone out.

The earlier hand-made reels and their account sheets live in `docs/social/`
(HTML reels with a record button, the brand guide, a two-week calendar).
This pipeline replaces that cadence with an automatic one; the account
sheets there (`tiktok-account-setup.txt`, `instagram-account-setup.txt`)
still hold the handle, bio text and profile image.

## The routine: every third Sunday, about half an hour

Diary: **Sunday 22 November 2026**, then every third Sunday (13 December,
3 January 2027, 24 January, 14 February, 7 March, 28 March, …). The first
batch (2 to 20 November) was queued by hand on 1 November.

1. **The Saturday before, 22:00 UTC**, the `Social Clips` workflow renders
   the next three weeks' nine clips and publishes them as a GitHub release
   tagged `social-<first week>` (for example `social-2026-W48`): nine MP4s,
   nine poster PNGs and one `captions.json`. On the other two Saturdays it
   checks the calendar and stops.
2. **Sunday 08:00 UTC** a "the next clips" email arrives
   (`/api/cron/social-clips`): the nine clips grouped by week, each with its
   poster, a download link and its caption in a copyable block. On the other
   Sundays nothing is sent. The Friday audit always carries the same section
   and the Social traffic line.
3. Download the nine MP4s from the email's links.
4. In Buffer, for each clip in the email's order: **New → Post**, select all
   three channels, drop in the MP4, paste the caption as it is, and **Add to
   Queue**. The channels' slots are Monday, Wednesday and Friday at 18:00, so
   the clips fall into place in order: brand on Mondays, sellers on
   Wednesdays, MOT on Fridays. Check the day shown before confirming each.
5. Done. The captions end with `freeplatecheck.co.uk` and five hashtags
   (Instagram's limit); the clickable links live in the Instagram and
   Facebook profiles (below). On TikTok the domain is typed, not tapped.

If a batch Sunday brings no email, open the repository's Actions tab, run
**Social Clips** by hand with `week` set to the batch's first week (the
calendar's batch starts are 2026-W48, W51, 2027-W01, W04, …; `npm run
social:plan -- --weeks 12` lists what each week holds), and the release
appears in about a quarter of an hour; `captions.json` on it has the
captions.

## One-time setup

**Buffer (free plan).** One account, three channels: TikTok, Instagram and
Facebook Page. Buffer's free plan allows ten scheduled posts per channel, more
than the three a week this needs. Cross-posting is simplest as one Buffer post
with all three channels selected; TikTok's own share options can also
cross-post a published TikTok to Reels.

**TikTok.** Stay on a personal account: a Business account needs company
registration documents, which a sole trader does not have, and it would also
restrict posts to TikTok's commercial music library. On a personal account
the Website field only becomes a tappable link at 1,000 followers (one of the
go/no-go bars), so keep `freeplatecheck.co.uk` in the bio text, where it is
readable and short enough to type. When the follower bar is reached, set the
Website field to the TikTok UTM link below. Handle and bio text:
`docs/social/tiktok-account-setup.txt` (ignore its Business-account line).

**Instagram.** A Professional (Business) account is free and makes the
Website field clickable. Set it to the UTM link below. Handle and bio text:
`docs/social/instagram-account-setup.txt`.

**Facebook Page.** Put the UTM link in the page's Website field and in the
About text.

**Buffer queue slots.** Each channel's Posting Schedule: Monday, Wednesday
and Friday at 18:00 London, every other day off, goal 3. With the slots set,
"Add to Queue" is the whole scheduling step.

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

Eight weeks after the first post (first post Monday 2 November 2026, so the
review falls in the week of 28 December 2026), the trial continues if **two of
three** hold:

| Measure | Bar |
|---|---|
| Total views across the three platforms (platform analytics) | 50,000 |
| UTM-tagged visits in a month (the audit's Social line, summed) | 200 |
| TikTok followers | 1,000 |

Fewer than two: stop the Buffer routine (the Saturday job can keep running
harmlessly, or be disabled in Actions) and keep the renderer for one-off
clips. The review falls between batches: the 3 January batch is already
queued by then, so the decision takes effect from the 24 January one.

## How it works

- `social/` is a Remotion project with its own `package.json` and install
  (outside the Next build). `social/README.md` describes its layout.
- The calendar (`social/src/calendar.ts`) picks each ISO week's three topics
  deterministically and walks each topic's subject list before repeating, so
  nothing repeats for months. `npm run social:plan -- --weeks 12` prints what
  is coming; `npm run social:preview` opens Remotion Studio.
- `.github/workflows/social-clips.yml` runs every Saturday night, asks the
  calendar whether the coming week opens a batch (`npm run batch` in
  `social/`), and if so installs the renderer, renders the nine clips
  (capped at 25 minutes) and publishes the release. Re-running it for the
  same batch replaces the release's assets with identical clips.
- `src/lib/social-clips.ts` reads the latest `social-*` release through the
  public GitHub API (no token) for the Sunday email
  (`src/app/api/cron/social-clips/route.ts`, a Vercel cron at 08:00 UTC that
  only sends when the release is less than a week old) and for the Friday
  audit, and fails soft to a one-line note if the API or the release is
  unavailable.
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
