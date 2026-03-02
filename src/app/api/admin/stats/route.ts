export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type StatsResponse = {
  lookups: { last1h: number; last24h: number; last7d: number };
  pageViews: { last24h: number; last7d: number };
  uniqueVisitors: { last24h: number; last7d: number };
  emailSignups: number;
  valuations: number;
  motReminders: number;
};

async function countEvents(
  sb: ReturnType<typeof supabaseServer>,
  eventType: string,
  since: Date,
): Promise<number> {
  const { count, error } = await sb
    .from("site_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType)
    .gte("created_at", since.toISOString());

  if (error) {
    console.error(`[STATS] Error counting ${eventType}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

async function countUniqueVisitors(
  sb: ReturnType<typeof supabaseServer>,
  since: Date,
): Promise<number> {
  const { data, error } = await sb.rpc("count_unique_visitors", {
    since: since.toISOString(),
  });

  if (error) {
    console.error("[STATS] Error counting unique visitors:", error.message);
    return 0;
  }
  return data ?? 0;
}

async function countTable(
  sb: ReturnType<typeof supabaseServer>,
  table: string,
): Promise<number> {
  const { count, error } = await sb
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error(`[STATS] Error counting ${table}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

export async function GET(): Promise<NextResponse<StatsResponse>> {
  const sb = supabaseServer();

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    lookups1h,
    lookups24h,
    lookups7d,
    pageViews24h,
    pageViews7d,
    uniqueVisitors24h,
    uniqueVisitors7d,
    emailSignups,
    valuations,
    motReminders,
  ] = await Promise.all([
    countEvents(sb, "lookup", oneHourAgo),
    countEvents(sb, "lookup", oneDayAgo),
    countEvents(sb, "lookup", sevenDaysAgo),
    countEvents(sb, "page_view", oneDayAgo),
    countEvents(sb, "page_view", sevenDaysAgo),
    countUniqueVisitors(sb, oneDayAgo),
    countUniqueVisitors(sb, sevenDaysAgo),
    countTable(sb, "email_signups"),
    countTable(sb, "vehicle_valuations"),
    countTable(sb, "mot_reminders"),
  ]);

  return NextResponse.json({
    lookups: { last1h: lookups1h, last24h: lookups24h, last7d: lookups7d },
    pageViews: { last24h: pageViews24h, last7d: pageViews7d },
    uniqueVisitors: { last24h: uniqueVisitors24h, last7d: uniqueVisitors7d },
    emailSignups,
    valuations,
    motReminders,
  });
}
