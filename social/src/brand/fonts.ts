import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// The report's own faces (src/lib/report-v2/fonts, copied to public/fonts;
// SIL Open Font Licence, see public/fonts/LICENSE.md). loadFont blocks the
// render until each is ready, so a frame is never drawn in a fallback font.
let loaded: Promise<void> | null = null;

export function ensureFonts(): Promise<void> {
  if (loaded) return loaded;
  loaded = Promise.all([
    loadFont({ family: "Instrument Serif", url: staticFile("fonts/InstrumentSerif-Regular.woff2"), weight: "400", style: "normal" }),
    loadFont({ family: "Instrument Serif", url: staticFile("fonts/InstrumentSerif-Italic.woff2"), weight: "400", style: "italic" }),
    loadFont({ family: "Geist", url: staticFile("fonts/Geist.woff2"), weight: "100 900", style: "normal" }),
    loadFont({ family: "Geist Mono", url: staticFile("fonts/GeistMono.woff2"), weight: "100 900", style: "normal" }),
  ]).then(() => undefined);
  return loaded;
}
