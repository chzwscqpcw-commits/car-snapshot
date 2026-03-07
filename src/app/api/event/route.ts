export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";

function hashIp(ip: string): string {
  const salt = process.env.VRM_SALT || "change-me";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body?.type !== "page_view") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = ip !== "unknown" ? hashIp(ip) : null;

    const sb = supabaseServer();
    sb.from("site_events").insert({
      event_type: "page_view",
      metadata: { path: body.path || "/" },
      ip_hash: ipHash,
    }).then(() => {}, () => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
