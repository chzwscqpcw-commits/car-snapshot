export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { readLookupTotal } from "@/lib/social-proof";

// `max-age` is the part that matters for Edge Requests.
//
// The previous header had s-maxage + stale-while-revalidate only, which caches
// at Vercel's CDN. That saves a function invocation and a Supabase count — but
// Vercel bills an Edge Request for a CDN cache HIT just the same, so it did
// nothing for the limit we are actually over (1.6M/1M). Only `max-age` stops
// the browser sending the request at all, and a request never sent is the only
// one that is free.
//
// 10 minutes in the browser: this is a cumulative "vehicles checked" counter
// for reassurance, so nobody is harmed by a slightly stale figure, and it only
// ever moves upward. s-maxage stays shorter so a genuinely new visitor still
// gets a recent number.
const CACHE_LIVE = "public, max-age=600, s-maxage=300, stale-while-revalidate=600";

// When the count failed: a minute, so the figure comes back soon after the
// database does, and so a struggling database is asked once a minute rather
// than once per homepage view (an error response is not cached at all).
const CACHE_FALLBACK = "public, max-age=60, s-maxage=60";

/**
 * Always 200. The figure is decoration on the homepage, so a failed count is
 * `{ total: null }` (or the last good figure) and the page leaves it out.
 */
export async function GET() {
  const result = await readLookupTotal(supabaseServer);

  if (result.source !== "live") {
    console.error(
      `[SOCIAL-PROOF] Count failed (${result.failure}); serving ${
        result.total === null ? "no figure" : "the last good figure"
      }`,
    );
  }

  return NextResponse.json(
    { total: result.total },
    { headers: { "Cache-Control": result.source === "live" ? CACHE_LIVE : CACHE_FALLBACK } },
  );
}
