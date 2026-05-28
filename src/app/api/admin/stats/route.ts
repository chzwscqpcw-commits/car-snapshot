export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export type TopMake = { make: string; count: number };

export type CaptureTrigger = { trigger_variant: string; count: number };
export type PartnerContextCount = { context: string; count: number };
export type SectionReach = { section_id: string; count: number; pct: number };

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
  // Funnel + capture metrics, sourced from mirrored gtag events in site_events
  funnel: {
    // searchesToday counts reg_search events (one per user-initiated search).
    // Distinct from the hero KPI's lookups.today which counts /api/lookup
    // calls — that number is inflated ~2x by tool-page re-fetches and so
    // makes for a misleading conversion-rate denominator.
    searchesToday: number;
    resultsViewsToday: number;
    reminderViewsToday: number;
    reminderSignupsToday: number;
  };
  captureByTriggerLast7d: CaptureTrigger[];
  partnerClicks: {
    today: number;
    last7d: number;
    byContextToday: PartnerContextCount[];
  };
  sectionReachToday: {
    resultsViews: number;
    sections: SectionReach[];
  };
  reminderFormToday: {
    views: number;
    attempts: number;
    successes: number;
    validationErrors: number;
    submitErrors: { duplicate: number; server: number; network: number };
  };
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

/**
 * Count rows in `mot_reminders` while excluding test/verify emails so the
 * admin dashboard never includes our own QA traffic. Mirrors the patterns
 * filtered at the write path in /api/mot-reminder/route.ts and cleaned up
 * by scripts/cleanup-test-reminders.ts.
 */
async function countMotRemindersExcludingTests(
  sb: ReturnType<typeof supabaseServer>,
  filter?: { column: "active" | "created_at"; op: "eq" | "gte"; value: string | boolean },
): Promise<number> {
  let query = sb
    .from("mot_reminders")
    .select("*", { count: "exact", head: true })
    .not("email", "ilike", "verify-test+%")
    .not("email", "ilike", "%@example.com")
    .not("email", "ilike", "%@example.org")
    .not("email", "ilike", "%@example.net")
    .not("email", "ilike", "%@test.invalid");

  if (filter) {
    if (filter.op === "gte") query = query.gte(filter.column, filter.value as string);
    else query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`[STATS] Error counting mot_reminders:`, error.message);
    return 0;
  }
  return count ?? 0;
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

/**
 * Group `site_events` rows of a single event_type by a metadata field and
 * return the counts. Done client-side because the JS supabase client doesn't
 * expose a clean group-by; row volume per event_type stays manageable.
 */
async function groupByMetadataField(
  sb: ReturnType<typeof supabaseServer>,
  eventType: string,
  field: string,
  since: Date,
  limit = 5000,
): Promise<Map<string, number>> {
  const { data, error } = await sb
    .from("site_events")
    .select("metadata")
    .eq("event_type", eventType)
    .gte("created_at", since.toISOString())
    .limit(limit);
  if (error || !data) return new Map();

  const counts = new Map<string, number>();
  for (const row of data) {
    const value = (row.metadata as Record<string, unknown> | null)?.[field];
    if (typeof value !== "string" || value.length === 0) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
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
    motRemindersToday,
    topMakesToday,
    // Funnel-stage event counts (today). The top-step uses reg_search
    // (per-user-action) not lookup (per-API-call) so the downstream
    // conversion ratios are meaningful.
    searchesToday,
    resultsViewsToday,
    reminderViewsToday,
    reminderAttemptsToday,
    reminderSuccessesToday,
    reminderValidationErrorsToday,
    partnerClicksToday,
    partnerClicks7d,
    // Grouped breakdowns
    triggerCountsLast7d,
    partnerContextCountsToday,
    sectionCountsToday,
    submitErrorMetaToday,
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
    countMotRemindersExcludingTests(sb, { column: "active", op: "eq", value: true }),
    countTable(sb, "contact_messages", { column: "created_at", op: "gte", value: todayStart.toISOString() }),
    countTable(sb, "contact_messages", { column: "created_at", op: "gte", value: sevenDaysAgo.toISOString() }),
    countTable(sb, "contact_messages"),
    countMotRemindersExcludingTests(sb, { column: "created_at", op: "gte", value: sevenDaysAgo.toISOString() }),
    countMotRemindersExcludingTests(sb, { column: "created_at", op: "gte", value: todayStart.toISOString() }),
    topMakesSince(sb, todayStart, 5),
    countEvents(sb, "reg_search", todayStart),
    countEvents(sb, "results_view", todayStart),
    countEvents(sb, "mot_reminder_view", todayStart),
    countEvents(sb, "mot_reminder_submit_attempt", todayStart),
    countEvents(sb, "mot_reminder", todayStart),
    countEvents(sb, "mot_reminder_validation_error", todayStart),
    countEvents(sb, "partner_click", todayStart),
    countEvents(sb, "partner_click", sevenDaysAgo),
    groupByMetadataField(sb, "mot_reminder", "trigger_variant", sevenDaysAgo),
    groupByMetadataField(sb, "partner_click", "click_context", todayStart),
    groupByMetadataField(sb, "results_section_view", "section_id", todayStart),
    groupByMetadataField(sb, "mot_reminder_submit_error", "error_type", todayStart),
  ]);

  const captureByTriggerLast7d: CaptureTrigger[] = Array.from(triggerCountsLast7d.entries())
    .map(([trigger_variant, count]) => ({ trigger_variant, count }))
    .sort((a, b) => b.count - a.count);

  const partnerContextByCount: PartnerContextCount[] = Array.from(partnerContextCountsToday.entries())
    .map(([context, count]) => ({ context, count }))
    .sort((a, b) => b.count - a.count);

  const sectionReachSections: SectionReach[] = Array.from(sectionCountsToday.entries())
    .map(([section_id, count]) => ({
      section_id,
      count,
      pct: resultsViewsToday > 0 ? Math.round((count / resultsViewsToday) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const submitErrors = {
    duplicate: submitErrorMetaToday.get("duplicate") ?? 0,
    server: submitErrorMetaToday.get("server") ?? 0,
    network: submitErrorMetaToday.get("network") ?? 0,
  };

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
    funnel: {
      searchesToday,
      resultsViewsToday,
      reminderViewsToday,
      reminderSignupsToday: motRemindersToday,
    },
    captureByTriggerLast7d,
    partnerClicks: {
      today: partnerClicksToday,
      last7d: partnerClicks7d,
      byContextToday: partnerContextByCount,
    },
    sectionReachToday: {
      resultsViews: resultsViewsToday,
      sections: sectionReachSections,
    },
    reminderFormToday: {
      views: reminderViewsToday,
      attempts: reminderAttemptsToday,
      successes: reminderSuccessesToday,
      validationErrors: reminderValidationErrorsToday,
      submitErrors,
    },
  });
}
