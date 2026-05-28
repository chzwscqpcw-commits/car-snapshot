export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export type RecentEvent = {
  id: string;
  created_at: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
};

export type RecentEventsResponse = {
  events: RecentEvent[];
};

const LIMIT = 30;

/**
 * Rolling feed of the last ~30 site_events rows for the admin dashboard's
 * realtime panel. No event-type filter — partner_click / conversion errors
 * / section_view all come through so a glance shows whatever's happening
 * right now. Heavy-volume types (page_view) are excluded to keep the feed
 * actionable rather than noisy.
 */
const NOISY_EVENT_TYPES = new Set(["page_view"]);

export async function GET(): Promise<NextResponse<RecentEventsResponse>> {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("site_events")
    .select("id, created_at, event_type, metadata")
    .not("event_type", "in", `(${Array.from(NOISY_EVENT_TYPES).map((t) => `"${t}"`).join(",")})`)
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (error) {
    console.error("[RECENT-EVENTS] query failed:", error.message);
    return NextResponse.json({ events: [] });
  }

  return NextResponse.json({ events: data ?? [] });
}
