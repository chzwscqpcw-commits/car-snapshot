export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const sb = supabaseServer();

    const { count, error } = await sb
      .from("site_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "lookup");

    if (error) {
      console.error("[SOCIAL-PROOF] Error counting lookups:", error.message);
      return NextResponse.json({ total: 0 }, { status: 500 });
    }

    return NextResponse.json(
      { total: count ?? 0 },
      {
        headers: {
          // `max-age` is the part that matters for Edge Requests.
          //
          // The previous header had s-maxage + stale-while-revalidate only,
          // which caches at Vercel's CDN. That saves a function invocation and
          // a Supabase count — but Vercel bills an Edge Request for a CDN cache
          // HIT just the same, so it did nothing for the limit we are actually
          // over (1.6M/1M). Only `max-age` stops the browser sending the
          // request at all, and a request never sent is the only one that is
          // free.
          //
          // 10 minutes in the browser: this is a cumulative "vehicles checked"
          // counter for reassurance, so nobody is harmed by a slightly stale
          // figure, and it only ever moves upward. s-maxage stays shorter so a
          // genuinely new visitor still gets a recent number.
          "Cache-Control":
            "public, max-age=600, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (err) {
    console.error("[SOCIAL-PROOF] Unexpected error:", err);
    return NextResponse.json({ total: 0 }, { status: 500 });
  }
}
