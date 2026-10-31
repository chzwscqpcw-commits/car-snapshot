export const runtime = "nodejs";

import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { supabaseServerRole } from "@/lib/supabaseServer";
import { displayPlate } from "@/lib/car-alerts";

// The yellow plate in the alert emails, as a PNG. Mail clients' dark modes
// recolour text and backgrounds (Outlook turned the plate olive) but leave
// images alone, so the one brand element that must stay yellow is an image.
// The URL carries the car's manage token, never the plate: the same token the
// email's "stop alerts" link already holds. `t=sample` draws the example plate
// for previews.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAMPLE = "AB12CDE";
const WIDTH = 360;
const HEIGHT = 92;

// The report's own face, at its plate weight: a static 700 instance of the
// bundled Geist (fonts/Geist-Bold.ttf, made from Geist.woff2 with fontTools),
// read once per instance. The file is traced into the bundle in next.config.
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

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  let plate: string | null = null;
  if (t === "sample") {
    plate = SAMPLE;
  } else if (UUID.test(t)) {
    const { data } = await supabaseServerRole().from("saved_cars").select("vrm").eq("manage_token", t).maybeSingle();
    plate = typeof data?.vrm === "string" ? data.vrm : null;
  }
  if (!plate) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const font = boldFont();
  // Satori reads every style key it is given, so the family is only set when
  // the face actually loaded; without it the bundled default draws the plate,
  // just lighter.
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
  return new ImageResponse(<div style={style}>{displayPlate(plate)}</div>, {
    width: WIDTH,
    height: HEIGHT,
    ...(font ? { fonts: [{ name: "Geist", data: font, weight: 700 as const, style: "normal" as const }] } : {}),
    // A token's plate never changes.
    headers: { "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" },
  });
}
