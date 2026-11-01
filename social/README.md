# Social clips

Three short vertical videos a week (1080 × 1920, 30 fps, 20 s), rendered with
[Remotion](https://remotion.dev) from the site's own data in `src/data/`, with
captions burned in and the site's look (the PDF report's dark edition). The
founder posts them through Buffer; nothing here talks to a social network.

The routine, the one-time setup and the go/no-go line are in
[`docs/social-pipeline.md`](../docs/social-pipeline.md).

## Run it

From the repo root (the `social/` package has its own install):

```bash
npm run social:install                     # once: npm ci inside social/
npm run social:render -- --week 2026-W46   # → social/out/2026-W46/*.mp4, *.png, captions.json
npm run social:preview                     # Remotion Studio, every template
npm run social:plan -- --weeks 12          # what the next 12 weeks will be
npm run social:check                       # typecheck + the calendar/picker test
```

`--silent` renders without the music bed; `--still-only` renders the posters
only. Inside `social/`, `npm run gallery` renders one still of every template
variant to `out/gallery/`.

## Layout

| Path | What |
|---|---|
| `src/calendar.ts` | ISO-week maths; which three topics a week gets (deterministic rotation) |
| `src/pickers/*.ts` | Turn the site's data into each clip's props and caption text |
| `src/props.ts` | The props of every composition (plain JSON) |
| `src/compositions/*.tsx` | The templates; `shared.tsx` is the common beat sheet |
| `src/brand/*` | Theme, fonts, motion helpers, chart primitives, plate, closing card |
| `src/captions.ts` | captions.json: caption, hashtags, UTM links per platform |
| `src/cli/render.ts` | Bundle + render a week (what the Thursday workflow runs) |
| `src/calendar.test.ts` | Determinism, rotation, privacy and partner-name checks |
| `public/fonts`, `public/audio` | The report's typefaces and the music bed; see `CREDITS.md` |

The site's modules are reached through its `@/` alias (`src/webpack.ts` and
`tsconfig.json`), and only pure ones: data JSON, `src/lib/valuation.ts`,
`src/components/home/sample-cars.ts`. Nothing in `social/` is part of the Next
build or the root `tsc --noEmit`; the root ESLint does lint `social/src`.

## Rules

- Never a real registration: the plate on the closing card is a sample plate
  from `src/components/home/sample-cars.ts`. The test fails any caption with a
  registration-shaped token.
- Aggregate figures only; no partner names, offers or prices paid (the test
  checks the captions for partner names).
- Captions are templated from the data in the pickers, never generated.

## Adding a template

1. Add the topic to the right list in `src/calendar.ts` (`BRAND_TOPICS`,
   `SELLERS_TOPICS` or `MOT_TOPICS`).
2. Add its props to `src/props.ts` and a picker that fills them from
   `src/data/` (and writes the title, caption body, tags and source).
3. Add the composition under `src/compositions/` using `Clip` from
   `shared.tsx`, register it in `src/Root.tsx`, and wire the topic in
   `src/plan.ts`.
4. `npm run gallery` to look at it; `npm test` to prove the rotation and the
   captions still hold.
