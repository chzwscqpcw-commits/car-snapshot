export const runtime = "nodejs";

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

// A bold face for the plate: fetched once per instance from Google Fonts (the
// bundled default is regular weight only). Without it the plate still draws,
// just lighter.
let fontPromise: Promise<ArrayBuffer | null> | null = null;
function boldFont(): Promise<ArrayBuffer | null> {
  if (!fontPromise) {
    fontPromise = (async () => {
      try {
        const css = await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap", {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:21.0) Gecko/20100101 Firefox/21.0" },
        }).then((r) => r.text());
        const url = css.match(/src: url\((https:[^)]+\.ttf)\)/)?.[1];
        if (!url) return null;
        const res = await fetch(url);
        return res.ok ? res.arrayBuffer() : null;
      } catch {
        return null;
      }
    })();
  }
  return fontPromise;
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

  const font = await boldFont();
  return new ImageResponse(
    (
      <div
        style={{
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
          fontFamily: font ? "Inter" : undefined,
        }}
      >
        {displayPlate(plate)}
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: font ? [{ name: "Inter", data: font, weight: 700, style: "normal" }] : undefined,
      // A token's plate never changes.
      headers: { "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" },
    },
  );
}
