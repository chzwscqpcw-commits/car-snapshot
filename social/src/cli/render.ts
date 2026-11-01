/**
 * Render a week's three clips, their stills and captions.json:
 *
 *   npm run social:render -- --week 2026-W46 [--out social/out/2026-W46] [--silent] [--still-only]
 *
 * Runs from the repo root (the root script) or from social/ (npm run render).
 * Deterministic: the same week gives the same three clips. Output:
 *   <out>/<week>-1-brand.mp4 (.png)   Monday
 *   <out>/<week>-2-sellers.mp4 (.png) Wednesday
 *   <out>/<week>-3-mot.mp4 (.png)     Friday
 *   <out>/captions.json
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { parseWeekLabel, upcomingWeek } from "../calendar";
import { captionsFile } from "../captions";
import { buildWeek } from "../plan";
import { withSiteAlias } from "../webpack";

const SOCIAL_DIR = path.resolve(__dirname, "..", "..");
/** 10 s in: every template has its data fully drawn and its outro not yet up. */
export const POSTER_FRAME = 300;

async function main() {
  const args = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const week = flag("week") ? parseWeekLabel(flag("week")!) : upcomingWeek();
  const musicFile = path.join(SOCIAL_DIR, "public", "audio", "track.mp3");
  let music = !args.includes("--silent");
  if (music && !existsSync(musicFile)) {
    console.warn(`No music track at ${musicFile}; rendering silent.`);
    music = false;
  }
  const stillOnly = args.includes("--still-only");

  const build = buildWeek(week, music);
  const outDir = path.resolve(flag("out") ?? path.join(SOCIAL_DIR, "out", build.plan.label));
  mkdirSync(outDir, { recursive: true });

  const captions = captionsFile(build);
  writeFileSync(path.join(outDir, "captions.json"), JSON.stringify(captions, null, 2) + "\n");
  console.log(`Week ${build.plan.label} (Monday ${build.plan.monday}), music ${music ? "on" : "off"}`);
  for (const c of build.clips) console.log(`  ${c.slot.day.padEnd(9)} ${c.slot.topic.padEnd(16)} ${c.picked.title}`);

  const started = Date.now();
  console.log("Bundling…");
  const serveUrl = await bundle({
    entryPoint: path.join(SOCIAL_DIR, "src", "index.ts"),
    publicDir: path.join(SOCIAL_DIR, "public"),
    webpackOverride: withSiteAlias,
  });

  for (const clip of build.clips) {
    const inputProps = clip.picked.props as unknown as Record<string, unknown>;
    const composition = await selectComposition({ serveUrl, id: clip.picked.composition, inputProps });
    const still = path.join(outDir, `${clip.id}.png`);
    // The poster: the hook and the whole data area on screen, before the outro.
    await renderStill({ composition, serveUrl, output: still, frame: POSTER_FRAME, inputProps, imageFormat: "png" });
    console.log(`  still  ${path.relative(process.cwd(), still)}`);
    if (stillOnly) continue;
    const mp4 = path.join(outDir, `${clip.id}.mp4`);
    let lastPct = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: mp4,
      inputProps,
      // Social platforms re-encode anyway; a clean, moderate bitrate is enough.
      crf: 20,
      x264Preset: "medium",
      audioCodec: music ? "aac" : undefined,
      muted: !music,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 10) * 10;
        if (pct !== lastPct) {
          lastPct = pct;
          process.stdout.write(`\r  video  ${clip.id}.mp4 ${pct}%`);
        }
      },
    });
    process.stdout.write("\n");
  }
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(0)}s → ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
