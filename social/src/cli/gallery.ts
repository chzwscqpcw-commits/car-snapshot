/**
 * One still of every template variant, for reviewing the look (in social/):
 *   npm run gallery            → out/gallery/<topic>-<occurrence>.png
 * Walks each topic through enough occurrences to show every variant.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { parseWeekLabel, planWeek, type Topic } from "../calendar";
import { pickTopic } from "../plan";
import { withSiteAlias } from "../webpack";

const SOCIAL_DIR = path.resolve(__dirname, "..", "..");
const FRAME = Number(process.argv[2] ?? 300);

const TOPICS: Array<[Topic, number]> = [
  ["theft", 5], ["how-many-left", 2], ["colours", 2], ["registrations", 3], ["wrong-turn", 1],
  ["value-table", 2], ["worth-after", 2], ["used-price-trend", 1],
  ["fail-reasons", 2], ["pass-by-area", 3], ["pass-by-model", 3], ["season-due", 1],
];

async function main() {
  const out = path.join(SOCIAL_DIR, "out", "gallery");
  mkdirSync(out, { recursive: true });
  const plan = planWeek(parseWeekLabel("2027-W10")); // a March week, so season-due is live
  const serveUrl = await bundle({ entryPoint: path.join(SOCIAL_DIR, "src", "index.ts"), publicDir: path.join(SOCIAL_DIR, "public"), webpackOverride: withSiteAlias });
  for (const [topic, n] of TOPICS) {
    for (let occ = 0; occ < n; occ++) {
      const picked = pickTopic(topic, occ, plan, false);
      const inputProps = picked.props as unknown as Record<string, unknown>;
      const composition = await selectComposition({ serveUrl, id: picked.composition, inputProps });
      const file = path.join(out, `${topic}-${occ}.png`);
      await renderStill({ composition, serveUrl, output: file, frame: FRAME, inputProps, imageFormat: "png", scale: 0.5 });
      console.log(`${topic}#${occ}  ${picked.title}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
