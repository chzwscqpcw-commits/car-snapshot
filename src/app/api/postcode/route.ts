export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { classifyPostcode } from "@/lib/booking";

/**
 * Resolve a UK postcode to the place a human would call it.
 *
 * Two jobs, both for Step 3 of the booking flow.
 *
 * 1. **Confirm it exists.** `classifyPostcode` checks shape, not reality —
 *    "ZZ99 9ZZ" is shaped like a postcode and isn't one. Shape was enough to
 *    stop us sending fragments to BookMyGarage, but a well-formed postcode
 *    that doesn't exist fails at their end the same way a fragment did, and
 *    their failure is a dead results page. Better we find out first.
 *
 * 2. **Name the district.** "GU22" becomes "Woking, Surrey". That's the moment
 *    the page stops feeling like a form and starts feeling like it knows where
 *    you are — which is the point of the coverage panel it feeds.
 *
 * Proxied rather than called from the browser on purpose. postcodes.io is a
 * reputable free service, but a direct client fetch would hand a third party
 * the visitor's postcode *and* their IP together. Going through our own route
 * means they get neither. It also lets us cache: a postcode's district does
 * not change.
 *
 * Fails open. If postcodes.io is slow or down we return `valid: null` and the
 * caller carries on with the local region and price data it already has — a
 * lookup service being unavailable must never block a booking.
 */

const UPSTREAM = "https://api.postcodes.io";
const TIMEOUT_MS = 2_500;

interface PostcodeResult {
  valid: boolean | null;
  district: string | null;
  region: string | null;
}

const MISS: PostcodeResult = { valid: null, district: null, region: null };
const NOT_FOUND: PostcodeResult = { valid: false, district: null, region: null };

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("pc") ?? "";

  // Never forward anything that isn't a well-formed full postcode. Keeps junk
  // out of the upstream and makes the cache key predictable.
  const pc = classifyPostcode(raw);
  if (!pc.usable) {
    return NextResponse.json(NOT_FOUND, {
      status: 200,
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `${UPSTREAM}/postcodes/${encodeURIComponent(pc.normalised.replace(/\s+/g, ""))}`,
      { signal: controller.signal, headers: { Accept: "application/json" } },
    );

    // 404 is a real answer: correctly shaped, doesn't exist.
    if (res.status === 404) {
      return NextResponse.json(NOT_FOUND, {
        status: 200,
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    }
    if (!res.ok) return NextResponse.json(MISS, { status: 200 });

    const body = await res.json();
    const r = body?.result;
    return NextResponse.json(
      {
        valid: true,
        district: typeof r?.admin_district === "string" ? r.admin_district : null,
        region: typeof r?.region === "string" ? r.region : null,
      } satisfies PostcodeResult,
      {
        status: 200,
        // A postcode's district is about as static as data gets.
        headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
      },
    );
  } catch {
    // Abort, DNS, upstream wobble — all the same to the caller.
    return NextResponse.json(MISS, { status: 200 });
  } finally {
    clearTimeout(timer);
  }
}
