export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { waitUntil } from "@vercel/functions";
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

    // The insert runs via waitUntil: the response returns immediately and the
    // write completes in the background, with the function kept alive until it
    // finishes.
    //
    // WHY. This route is the busiest thing on the site — 189,212 calls in the
    // last 30 days, one per tracked event. Awaiting the insert billed Fluid
    // Active CPU for ~189k Supabase round-trips whose result nobody reads:
    // callers are navigator.sendBeacon (which discards the response by
    // definition) and fetch with keepalive. That contributed to going over the
    // plan's Active CPU allowance.
    //
    // This is NOT a return to the old fire-and-forget `.then(noop, noop)`. That
    // was replaced because it swallowed failures silently, leaving Supabase
    // rate limits, RLS regressions and network blips invisible. The logging is
    // exactly as it was — waitUntil just stops us paying to hold the request
    // open for it, and unlike a bare unawaited promise it guarantees the write
    // isn't cut off when the response returns.
    //
    // The one thing given up is the 500 on insert failure. That is genuinely
    // free: the previous comment noted the client ignores the status anyway,
    // and the value was always in the logs.
    // An async IIFE rather than .then(): supabase-js returns a PromiseLike,
    // which waitUntil does not accept.
    waitUntil(
      (async () => {
        const { error: insertError } = await sb
          .from("site_events")
          .insert({ event_type: type, metadata, ip_hash: ipHash });
        if (insertError) {
          console.error(
            `[event] insert failed for ${type}:`,
            insertError.code,
            insertError.message,
          );
        }
      })(),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "[event] route threw:",
      err instanceof Error ? err.message : String(err),
    );
    return NextResponse.json({ ok: false, error: "exception" }, { status: 500 });
  }
}
