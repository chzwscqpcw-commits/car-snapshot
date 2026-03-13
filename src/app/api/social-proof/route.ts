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
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (err) {
    console.error("[SOCIAL-PROOF] Unexpected error:", err);
    return NextResponse.json({ total: 0 }, { status: 500 });
  }
}
