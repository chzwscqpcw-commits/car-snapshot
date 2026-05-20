export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export type TopMake = { make: string; count: number };

export type StatsResponse = {
  lookups: {
    last1h: number;
    last24h: number;
    last7d: number;
    today: number;
    yesterday: number;
  };
  pageViews: {
    last24h: number;
    last7d: number;
    today: number;
    yesterday: number;
  };
  uniqueVisitors: { last24h: number; last7d: number };
  emailSignups: number;
  valuations: number;
  motReminders: number;
  // New for the richer dashboard
  contactMessages: { today: number; last7d: number; allTime: number };
  motRemindersLast7d: number;
  topMakesToday: TopMake[];
};

async function countEvents(
  sb: ReturnType<typeof supabaseServer>,
  eventType: string,
  since: Date,
  until?: Date,
): Promise<number> {
  let query = sb
    .from("site_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType)
    .gte("created_at", since.toISOString());
  if (until) query = query.lt("created_at", until.toISOString());

  const { count, error } = await query;
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
  filter?: { column: string; op: "gte"; value: string } | { column: string; op: "eq"; value: string | boolean },
): Promise<number> {
  let query = sb.from(table).select("*", { count: "exact", head: true });
  if (filter) {
    if (filter.op === "gte") query = query.gte(filter.column, filter.value);
    else query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`[STATS] Error counting ${table}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

async function topMakesSince(
  sb: ReturnType<typeof supabaseServer>,
  since: Date,
  limit = 5,
): Promise<TopMake[]> {
  // Group by metadata.make for lookup events since {since}.
  // We do this client-side because Supabase JS doesn't expose a clean
  // group-by; the row volume per day stays low so the cost is fine.
  const { data, error } = await sb
    .from("site_events")
    .select("metadata")
    .eq("event_type", "lookup")
    .gte("created_at", since.toISOString())
    .not("metadata->>make", "is", null)
    .limit(2000);
  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    const m = (row.metadata as Record<string, unknown> | null)?.make;
    if (typeof m !== "string" || m.length === 0) continue;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([make, count]) => ({ make, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(): Promise<NextResponse<StatsResponse>> {
  const sb = supabaseServer();

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayStart = startOfUtcDay(now);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

  const [
    lookups1h,
    lookups24h,
    lookups7d,
    lookupsToday,
    lookupsYesterday,
    pageViews24h,
    pageViews7d,
    pageViewsToday,
    pageViewsYesterday,
    uniqueVisitors24h,
    uniqueVisitors7d,
    emailSignups,
    valuations,
    motReminders,
    contactToday,
    contact7d,
    contactAllTime,
    motRemindersLast7d,
    topMakesToday,
  ] = await Promise.all([
    countEvents(sb, "lookup", oneHourAgo),
    countEvents(sb, "lookup", oneDayAgo),
    countEvents(sb, "lookup", sevenDaysAgo),
    countEvents(sb, "lookup", todayStart),
    countEvents(sb, "lookup", yesterdayStart, todayStart),
    countEvents(sb, "page_view", oneDayAgo),
    countEvents(sb, "page_view", sevenDaysAgo),
    countEvents(sb, "page_view", todayStart),
    countEvents(sb, "page_view", yesterdayStart, todayStart),
    countUniqueVisitors(sb, oneDayAgo),
    countUniqueVisitors(sb, sevenDaysAgo),
    countTable(sb, "email_signups"),
    countTable(sb, "vehicle_valuations"),
    countTable(sb, "mot_reminders", { column: "active", op: "eq", value: true }),
    countTable(sb, "contact_messages", { column: "created_at", op: "gte", value: todayStart.toISOString() }),
    countTable(sb, "contact_messages", { column: "created_at", op: "gte", value: sevenDaysAgo.toISOString() }),
    countTable(sb, "contact_messages"),
    countTable(sb, "mot_reminders", { column: "created_at", op: "gte", value: sevenDaysAgo.toISOString() }),
    topMakesSince(sb, todayStart, 5),
  ]);

  return NextResponse.json({
    lookups: {
      last1h: lookups1h,
      last24h: lookups24h,
      last7d: lookups7d,
      today: lookupsToday,
      yesterday: lookupsYesterday,
    },
    pageViews: {
      last24h: pageViews24h,
      last7d: pageViews7d,
      today: pageViewsToday,
      yesterday: pageViewsYesterday,
    },
    uniqueVisitors: { last24h: uniqueVisitors24h, last7d: uniqueVisitors7d },
    emailSignups,
    valuations,
    motReminders,
    contactMessages: {
      today: contactToday,
      last7d: contact7d,
      allTime: contactAllTime,
    },
    motRemindersLast7d,
    topMakesToday,
  });
}
