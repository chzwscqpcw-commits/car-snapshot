import { NextResponse } from "next/server";
import { isLiveProduction, MOT_OUTAGE_COOKIE } from "@/lib/deploy-env";

// Preview-only switch for the "MOT service is down" state, so it can be seen
// on a preview deployment (or locally) without waiting for a real outage.
//
//   /api/preview/mot-outage?state=known   a car we have looked up before keeps its model
//   /api/preview/mot-outage?state=new     as if we had never seen the car: asks for the model
//   /api/preview/mot-outage?state=off     back to normal
//
// It sets a 30-minute cookie that /api/lookup reads (simulatedMotOutage) and
// sends you to the valuation page. In live production this route is a 404
// and the cookie is ignored, so a visitor cannot switch it on.

export const dynamic = "force-dynamic";

const STATES = new Set(["known", "new", "off"]);
const MAX_AGE_SECONDS = 30 * 60;

export async function GET(req: Request) {
  if (isLiveProduction()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? "known";
  if (!STATES.has(state)) {
    return NextResponse.json({ error: "state must be known, new or off" }, { status: 400 });
  }

  // Only ever back to a page of our own.
  const to = url.searchParams.get("to") ?? "/value-my-car";
  const target = /^\/(?!\/)/.test(to) ? to : "/value-my-car";

  const res = NextResponse.redirect(new URL(target, url.origin), 302);
  res.headers.set("Cache-Control", "no-store");
  res.cookies.set(MOT_OUTAGE_COOKIE, state === "off" ? "" : state, {
    path: "/",
    sameSite: "lax",
    maxAge: state === "off" ? 0 : MAX_AGE_SECONDS,
  });
  return res;
}
