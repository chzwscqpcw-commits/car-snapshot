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
      // New shape: { type: "page_view", payload: { path, referrer, utm_source } }
      // from the global RouteAnalytics tracker. Legacy shape (homepage-only,
      // now removed): { type: "page_view", path: "/foo" }. Support both.
      const p =
        body?.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
          ? (body.payload as Record<string, unknown>)
          : {};
      const path =
        typeof p.path === "string"
          ? p.path
          : typeof body.path === "string"
            ? body.path
            : "/";
      metadata = { path };
      if (typeof p.referrer === "string") metadata.referrer = p.referrer;
      if (typeof p.utm_source === "string" && p.utm_source.length > 0) {
        metadata.utm_source = p.utm_source;
      }
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
    // Await the insert (was previously fire-and-forget). The endpoint is
    // called from navigator.sendBeacon / fetch with keepalive — neither
    // cares about response time, but the previous .then(noop, noop) pattern
    // swallowed any failure silently and returned ok: true regardless. That
    // made it impossible to spot Supabase rate-limit hits, RLS regressions
    // or transient network blips. Now we log + return the real status; the
    // client still ignores it but Vercel logs surface the failure mode.
    const { error: insertError } = await sb
      .from("site_events")
      .insert({
        event_type: type,
        metadata,
        ip_hash: ipHash,
      });

    if (insertError) {
      console.error(
        `[event] insert failed for ${type}:`,
        insertError.code,
        insertError.message,
      );
      return NextResponse.json(
        { ok: false, error: "insert_failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "[event] route threw:",
      err instanceof Error ? err.message : String(err),
    );
    return NextResponse.json({ ok: false, error: "exception" }, { status: 500 });
  }
}
