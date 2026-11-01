# Credits

## Music

`public/audio/track.mp3` is the first 24 seconds of **"Digital Clouds"** by
Alejandro Magaña (A. M.), from Mixkit (https://mixkit.co/free-stock-music/),
trimmed and loudness-normalised for the clips (`ffmpeg … -t 24 -af loudnorm`).

Licence: the **Mixkit Stock Music Free License**
(https://mixkit.co/license/#musicFree). As read on 1 Nov 2026: items under it
"can be used in your commercial and non-commercial projects for free", and may
be downloaded, copied, modified, distributed and publicly performed "on any web
or social media platform", with social-media video posts and online marketing
ads listed as allowed uses. Not allowed: CDs/DVDs, TV or radio broadcast, video
games, remixing into a music-only track, or registering the track with a
rights-management service. No attribution is required; it is given here anyway.

To render without music, pass `--silent` to `npm run social:render`.

## Fonts

`public/fonts/` are the PDF report's faces, copied from
`src/lib/report-v2/fonts/`: Instrument Serif (Rodrigo Fuenzalida and Jordan
Egstad) and Geist / Geist Mono (Vercel). Both under the SIL Open Font Licence
1.1; see `public/fonts/LICENSE.md`.

## Tooling

Remotion (https://remotion.dev), under its free licence for individuals and
companies of up to three people (`node_modules/remotion/LICENSE.md`).
