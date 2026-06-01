export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer, supabaseServerRole } from "@/lib/supabaseServer";

export type TopMake = { make: string; count: number };

export type CaptureTrigger = { trigger_variant: string; count: number };
export type PartnerContextCount = { context: string; count: number };
export type SectionReach = { section_id: string; count: number; pct: number };
export type BookingStepCount = { step: number; count: number };
export type BookingSource = { source: string; count: number };
export type ScrollThreshold = { threshold_pct: number; count: number };

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
  uniqueVisitors: {
    last24h: number;
    last7d: number;
    // UTC-day-aligned, so a meaningful day-over-day delta can be drawn.
    today: number;
    yesterday: number;
  };
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
  funnel7d: {
    // Same shape as funnel above but with a 7-day window — smooths out
    // low-volume mornings where today's numbers haven't accumulated yet.
    searches: number;
    resultsViews: number;
    reminderViews: number;
    reminderSignups: number;
  };
  captureByTriggerLast7d: CaptureTrigger[];
  partnerClicks: {
    today: number;
    last7d: number;
    byContextToday: PartnerContextCount[];
    // 7-day per-context attribution — the today-only view is too sparse
    // for many of the long-tail CTAs (servicing page, brake-pads page,
    // mot_cta placements). 7d gives a meaningful per-CTA picture.
    byContextLast7d: PartnerContextCount[];
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
  // Booking-wizard funnel — wizard_start → step_complete → BMG handoff.
  // The handoff count comes from partner_click events whose click_context
  // starts with "booking-flow-" (the Step4Review pattern).
  bookingWizardLast7d: {
    starts: number;
    stepCompletes: BookingStepCount[];
    handoffs: number;
    sources: BookingSource[];
  };
  // New events shipped May 2026 — surfacing them so we can see they're
  // actually firing in production rather than only in dev.
  newEventsLast7d: {
    pdfDownloads: number;
    pdfErrors: number;
    vehiclesSaved: number;
    outboundClicks: number;
    scrollDepth: ScrollThreshold[];
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
 * Count distinct ip_hashes in a UTC-day-aligned window. Used for the
 * dashboard's day-over-day visitor delta — the RPC version only takes a
 * `since` parameter, so it can't bound a "yesterday only" count.
 */
async function countUniqueVisitorsBetween(
  sb: ReturnType<typeof supabaseServer>,
  since: Date,
  until: Date,
): Promise<number> {
  const { data, error } = await sb
    .from("site_events")
    .select("ip_hash")
    .eq("event_type", "page_view")
    .gte("created_at", since.toISOString())
    .lt("created_at", until.toISOString())
    .not("ip_hash", "is", null)
    .limit(10000);
  if (error || !data) {
    console.error("[STATS] Error counting unique visitors between:", error?.message);
    return 0;
  }
  return new Set(data.map((r) => r.ip_hash)).size;
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
  // contact_messages has RLS enabled — the anon client returns empty result
  // sets silently, with no error. Use the service-role client for any count
  // against RLS-protected tables so the dashboard doesn't read 0s as truth.
  const sbRead = supabaseServerRole();

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
    uniqueVisitorsToday,
    uniqueVisitorsYesterday,
    valuations,
    motReminders,
    contactToday,
    contact7d,
    contactAllTime,
    motRemindersLast7d,
    _motRemindersToday,
    topMakesToday,
    // Funnel-stage event counts (today). The top-step uses reg_search
    // (per-user-action) not lookup (per-API-call) so the downstream
    // conversion ratios are meaningful.
    searchesToday,
    searches7d,
    resultsViewsToday,
    resultsViews7d,
    reminderViewsToday,
    reminderViews7d,
    reminderAttemptsToday,
    reminderSuccessesToday,
    reminderValidationErrorsToday,
    partnerClicksToday,
    partnerClicks7d,
    // Grouped breakdowns
    triggerCountsLast7d,
    partnerContextCountsToday,
    partnerContextCountsLast7d,
    sectionCountsToday,
    submitErrorMetaToday,
    // Reminder-success conversion events. Counting the `mot_reminder` event
    // in site_events (vs counting rows in the mot_reminders table) catches
    // reactivations — when a user submits the same (email, vrm) twice, the
    // API updates the existing row rather than inserting, so the table-row
    // count misses the second "successful conversion" even though the event
    // legitimately fired. Event count is closer to the funnel's intent.
    motReminderEventsToday,
    motReminderEvents7d,
    // Booking wizard funnel (last 7 days)
    bookingStarts7d,
    bookingStepCompletes7d,
    bookingHandoffsByContext7d,
    bookingSources7d,
    // New events (last 7 days)
    pdfDownloads7d,
    pdfErrors7d,
    vehiclesSaved7d,
    outboundClicks7d,
    scrollDepthCounts7d,
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
    countUniqueVisitorsBetween(sb, todayStart, new Date(now.getTime() + 60_000)),
    countUniqueVisitorsBetween(sb, yesterdayStart, todayStart),
    countTable(sb, "vehicle_valuations"),
    countMotRemindersExcludingTests(sb, { column: "active", op: "eq", value: true }),
    countTable(sbRead, "contact_messages", { column: "created_at", op: "gte", value: todayStart.toISOString() }),
    countTable(sbRead, "contact_messages", { column: "created_at", op: "gte", value: sevenDaysAgo.toISOString() }),
    countTable(sbRead, "contact_messages"),
    countMotRemindersExcludingTests(sb, { column: "created_at", op: "gte", value: sevenDaysAgo.toISOString() }),
    countMotRemindersExcludingTests(sb, { column: "created_at", op: "gte", value: todayStart.toISOString() }),
    topMakesSince(sb, todayStart, 5),
    countEvents(sb, "reg_search", todayStart),
    countEvents(sb, "reg_search", sevenDaysAgo),
    countEvents(sb, "results_view", todayStart),
    countEvents(sb, "results_view", sevenDaysAgo),
    countEvents(sb, "mot_reminder_view", todayStart),
    countEvents(sb, "mot_reminder_view", sevenDaysAgo),
    countEvents(sb, "mot_reminder_submit_attempt", todayStart),
    countEvents(sb, "mot_reminder", todayStart),
    countEvents(sb, "mot_reminder_validation_error", todayStart),
    countEvents(sb, "partner_click", todayStart),
    countEvents(sb, "partner_click", sevenDaysAgo),
    groupByMetadataField(sb, "mot_reminder", "trigger_variant", sevenDaysAgo),
    groupByMetadataField(sb, "partner_click", "click_context", todayStart),
    groupByMetadataField(sb, "partner_click", "click_context", sevenDaysAgo),
    groupByMetadataField(sb, "results_section_view", "section_id", todayStart),
    groupByMetadataField(sb, "mot_reminder_submit_error", "error_type", todayStart),
    countEvents(sb, "mot_reminder", todayStart),
    countEvents(sb, "mot_reminder", sevenDaysAgo),
    countEvents(sb, "booking_wizard_start", sevenDaysAgo),
    // step_complete fires once per advance; we group by `step` so the
    // funnel shows 2 (entered Step 2) → 3 → 4 distinctly. Step 1 is
    // implicit in the wizard_start count.
    groupByMetadataField(sb, "booking_step_complete", "step", sevenDaysAgo),
    // BMG handoffs are partner_clicks where click_context starts with
    // "booking-flow-" (the Step4Review CTA pattern). We re-use the 7d
    // partner-context map and filter client-side below.
    groupByMetadataField(sb, "partner_click", "click_context", sevenDaysAgo),
    groupByMetadataField(sb, "booking_wizard_start", "source", sevenDaysAgo),
    countEvents(sb, "pdf_download", sevenDaysAgo),
    countEvents(sb, "pdf_download_error", sevenDaysAgo),
    countEvents(sb, "vehicle_saved", sevenDaysAgo),
    countEvents(sb, "outbound_click", sevenDaysAgo),
    groupByMetadataField(sb, "scroll_depth", "threshold_pct", sevenDaysAgo),
  ]);

  const captureByTriggerLast7d: CaptureTrigger[] = Array.from(triggerCountsLast7d.entries())
    .map(([trigger_variant, count]) => ({ trigger_variant, count }))
    .sort((a, b) => b.count - a.count);

  const partnerContextByCount: PartnerContextCount[] = Array.from(partnerContextCountsToday.entries())
    .map(([context, count]) => ({ context, count }))
    .sort((a, b) => b.count - a.count);

  const partnerContextByCountLast7d: PartnerContextCount[] = Array.from(partnerContextCountsLast7d.entries())
    .map(([context, count]) => ({ context, count }))
    .sort((a, b) => b.count - a.count);

  // Booking step completes: numeric step values converted from string keys
  const bookingStepCounts: BookingStepCount[] = Array.from(bookingStepCompletes7d.entries())
    .map(([stepStr, count]) => ({ step: Number(stepStr), count }))
    .filter((s) => Number.isFinite(s.step))
    .sort((a, b) => a.step - b.step);

  // BMG handoffs = sum of partner_clicks whose click_context starts with
  // "booking-flow-" (matches the wizard Step4Review clickref pattern).
  const bookingHandoffsCount = Array.from(bookingHandoffsByContext7d.entries())
    .filter(([ctx]) => ctx.startsWith("booking-flow-"))
    .reduce((sum, [, count]) => sum + count, 0);

  const bookingWizardSources: BookingSource[] = Array.from(bookingSources7d.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const scrollDepthBuckets: ScrollThreshold[] = Array.from(scrollDepthCounts7d.entries())
    .map(([thresholdStr, count]) => ({ threshold_pct: Number(thresholdStr), count }))
    .filter((s) => Number.isFinite(s.threshold_pct))
    .sort((a, b) => a.threshold_pct - b.threshold_pct);

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
    uniqueVisitors: {
      last24h: uniqueVisitors24h,
      last7d: uniqueVisitors7d,
      today: uniqueVisitorsToday,
      yesterday: uniqueVisitorsYesterday,
    },
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
      // Use the event count (catches reactivations) — see comment near the
      // motReminderEventsToday declaration above for why.
      reminderSignupsToday: motReminderEventsToday,
    },
    funnel7d: {
      searches: searches7d,
      resultsViews: resultsViews7d,
      reminderViews: reminderViews7d,
      reminderSignups: motReminderEvents7d,
    },
    captureByTriggerLast7d,
    partnerClicks: {
      today: partnerClicksToday,
      last7d: partnerClicks7d,
      byContextToday: partnerContextByCount,
      byContextLast7d: partnerContextByCountLast7d,
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
    bookingWizardLast7d: {
      starts: bookingStarts7d,
      stepCompletes: bookingStepCounts,
      handoffs: bookingHandoffsCount,
      sources: bookingWizardSources,
    },
    newEventsLast7d: {
      pdfDownloads: pdfDownloads7d,
      pdfErrors: pdfErrors7d,
      vehiclesSaved: vehiclesSaved7d,
      outboundClicks: outboundClicks7d,
      scrollDepth: scrollDepthBuckets,
    },
  });
}
