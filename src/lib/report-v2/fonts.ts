import { readFileSync } from "node:fs";
import path from "node:path";

// The report's fonts are inlined into the HTML as data: URIs, so the headless
// browser renders with no network access at all (render.ts blocks every
// request that isn't data:). The woff2 files are traced into the serverless
// bundle via `outputFileTracingIncludes` in next.config.ts.

const FONT_DIR = path.join(process.cwd(), "src", "lib", "report-v2", "fonts");

const FACES: Array<{ family: string; file: string; weight: string; style: string }> = [
  { family: "Geist", file: "Geist.woff2", weight: "400 700", style: "normal" },
  { family: "Geist Mono", file: "GeistMono.woff2", weight: "400 600", style: "normal" },
  { family: "Instrument Serif", file: "InstrumentSerif-Regular.woff2", weight: "400", style: "normal" },
  { family: "Instrument Serif", file: "InstrumentSerif-Italic.woff2", weight: "400", style: "italic" },
];

let cached: string | null = null;

/** @font-face rules for every report font, with the files inlined. */
export function fontFaceCss(): string {
  if (cached) return cached;
  cached = FACES.map((f) => {
    const b64 = readFileSync(path.join(FONT_DIR, f.file)).toString("base64");
    return `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
  }).join("\n");
  return cached;
}
