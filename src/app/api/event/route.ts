export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";

function hashIp(ip: string): string {
  const salt = process.env.VRM_SALT || "change-me";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

// Allow snake_case event names of reasonable length. Wide enough for any of
// the existing instrumentation but tight enough to reject probe traffic.
const EVENT_NAME_RE = /^[a-z][a-z0-9_]{1,63}$/;

// Hard cap on payload size to keep abusive posts from filling site_events.
const MAX_PAYLOAD_BYTES = 4_000;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Legacy shape: { type: "page_view", path: "/foo" }
    // New shape:    { type: <event_name>, payload: { ... } }
    const type = typeof body?.type === "string" ? body.type : null;
    if (!type || !EVENT_NAME_RE.test(type)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Resolve metadata. Preserve legacy page_view behaviour where { path }
    // sits on the body root; everything else uses an explicit payload object.
    let metadata: Record<string, unknown> | null = null;
    if (type === "page_view") {
      metadata = { path: typeof body.path === "string" ? body.path : "/" };
    } else if (body?.payload && typeof body.payload === "object" && !Array.isArray(body.payload)) {
      metadata = body.payload as Record<string, unknown>;
    }

    if (metadata && JSON.stringify(metadata).length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ ok: false, error: "payload too large" }, { status: 413 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = ip !== "unknown" ? hashIp(ip) : null;

    const sb = supabaseServer();
    sb.from("site_events").insert({
      event_type: type,
      metadata,
      ip_hash: ipHash,
    }).then(() => {}, () => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
