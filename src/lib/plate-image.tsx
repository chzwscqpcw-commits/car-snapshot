import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { displayPlate } from "@/lib/car-alerts";

// The yellow plate in the alert emails, as a PNG that travels inside the
// message. Mail clients' dark modes recolour text and backgrounds (Outlook
// turned a styled plate olive) but leave images alone; and an image attached
// inline, referenced by content id, shows without the "download external
// images" prompt a linked one gets. No URL ever carries the plate.

export const PLATE_CID = "plate";
const WIDTH = 360;
const HEIGHT = 92;

// The report's own face at its plate weight: a static 700 instance of the
// bundled Geist (fonts/Geist-Bold.ttf, made from Geist.woff2 with fontTools),
// read once per instance. The file is traced into the sending routes' bundles
// in next.config. Without it the plate still draws, just lighter.
let fontCache: ArrayBuffer | null | undefined;
function boldFont(): ArrayBuffer | null {
  if (fontCache !== undefined) return fontCache;
  try {
    const buf = readFileSync(path.join(process.cwd(), "src", "lib", "report-v2", "fonts", "Geist-Bold.ttf"));
    fontCache = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    fontCache = null;
  }
  return fontCache;
}

/** The plate for a registration, as PNG bytes (2× the 180×46 it shows at). */
export async function renderPlatePng(vrm: string): Promise<Buffer> {
  const font = boldFont();
  // Satori reads every style key it is given, so the family is only set when
  // the face actually loaded.
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C518",
    borderRadius: 16,
    color: "#111111",
    fontSize: 54,
    fontWeight: 700,
    letterSpacing: 3,
    ...(font ? { fontFamily: "Geist" } : {}),
  };
  const res = new ImageResponse(<div style={style}>{displayPlate(vrm)}</div>, {
    width: WIDTH,
    height: HEIGHT,
    ...(font ? { fonts: [{ name: "Geist", data: font, weight: 700 as const, style: "normal" as const }] } : {}),
  });
  return Buffer.from(await res.arrayBuffer());
}

export interface InlineAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  contentId: string;
}

/**
 * The plate as an inline attachment for sendEmail, or null if it could not be
 * drawn — the email then shows the plate's text in its place.
 */
export async function plateAttachment(vrm: string): Promise<InlineAttachment | null> {
  try {
    return { filename: "plate.png", content: await renderPlatePng(vrm), contentType: "image/png", contentId: PLATE_CID };
  } catch (err) {
    console.error("plate_image_error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}
