export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendInternalEmail } from "@/lib/resend";
import { recordServerEvent } from "@/lib/server-events";
import {
  ALERT_EVENT,
  LOOKUP_ALERT,
  alertSubject,
  decideHealthActions,
  openIncidentsFrom,
  pullHealthRows,
  renderAlertHtml,
  stageStats,
  type HealthRow,
} from "@/lib/lookup-health";

// Every 15 minutes (vercel.json). Reads the last hours of `lookup` and
// `lookup_error` rows and emails the founder when one half of the lookup
// (DVLA, MOT, or our own route) starts failing, and once more when it clears.
// One email per incident: the open/recovered state is a `lookup_alert` row in
// site_events (see lookup-health.ts).
//
// Why it exists: on 8–9 Nov 2026 the MOT half failed for 21.5 hours and the
// first anyone knew was a partner-click spike three days later.

// Who is told. Same address as the weekly audit; AUDIT_EMAIL overrides.
const RECIPIENT = process.env.AUDIT_EMAIL || "stephengaisford@gmail.com";

const HOUR = 3_600_000;
/** How far back an open incident is looked for, and its errors counted. */
const INCIDENT_LOOKBACK_DAYS = 14;
/** Rows read when nothing is open: the alert window, plus room to find where
 *  a spell that is just crossing the threshold began. */
const QUIET_LOOKBACK_HOURS = 6;

// Belt and braces for "one email per incident": if the state row fails to
// write, the next run would see no open incident and email again. A warm
// function instance remembers what it sent.
const sentThisInstance = new Map<string, number>();

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ?dry=1 reports what it would do and sends nothing.
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const nowMs = Date.now();

  try {
    const sb = supabaseServer();

    const { data: alertRows, error: alertErr } = await sb
      .from("site_events")
      .select("event_type, created_at, metadata")
      .eq("event_type", ALERT_EVENT)
      .gte("created_at", new Date(nowMs - INCIDENT_LOOKBACK_DAYS * 24 * HOUR).toISOString())
      .order("created_at", { ascending: true })
      .limit(1000);
    if (alertErr) throw new Error(`alert state: ${alertErr.message}`);
    const open = openIncidentsFrom((alertRows ?? []) as HealthRow[]);

    const oldestOpen = open.reduce((min, i) => Math.min(min, Date.parse(i.startedAt)), nowMs);
    const sinceMs = Math.min(nowMs - QUIET_LOOKBACK_HOURS * HOUR, oldestOpen - HOUR);
    const rows = await pullHealthRows(sb, new Date(sinceMs).toISOString());

    const actions = decideHealthActions(rows, nowMs, open);
    const done: { type: string; stage: string; emailed: boolean; error?: string }[] = [];

    for (const action of actions) {
      const key = `${action.type}:${action.stage}:${action.type === "open" ? action.startedAt : action.incident.startedAt}`;
      if (dry) {
        done.push({ type: action.type, stage: action.stage, emailed: false });
        continue;
      }
      const lastSent = sentThisInstance.get(key);
      if (lastSent && nowMs - lastSent < 6 * HOUR) {
        done.push({ type: action.type, stage: action.stage, emailed: false, error: "already sent by this instance" });
        continue;
      }

      const res = await sendInternalEmail({
        to: RECIPIENT,
        subject: alertSubject(action),
        html: renderAlertHtml(action, nowMs),
      });
      if (!res.ok) {
        // No state row: the next run tries the email again.
        console.error("lookup_health_email_error:", res.error);
        done.push({ type: action.type, stage: action.stage, emailed: false, error: res.error });
        continue;
      }
      sentThisInstance.set(key, nowMs);

      await recordServerEvent(ALERT_EVENT, {
        internal: true,
        stage: action.stage,
        state: action.type === "open" ? "open" : "recovered",
        started_at: action.type === "open" ? action.startedAt : action.incident.startedAt,
        ...(action.type === "open"
          ? { errors: action.stats.errors, attempts: action.stats.attempts, reasons: action.stats.reasons, causes: action.stats.causes }
          : { errors: action.errorsSinceStart, last_error_at: action.lastErrorAt }),
      });
      done.push({ type: action.type, stage: action.stage, emailed: true });
    }

    const hour = stageStats(rows, nowMs - LOOKUP_ALERT.WINDOW_MIN * 60_000, nowMs);
    return NextResponse.json({
      ok: true,
      dry,
      lastHour: Object.values(hour).map((s) => ({ stage: s.stage, errors: s.errors, attempts: s.attempts, share: Math.round(s.share * 100) / 100 })),
      openIncidents: open.map((i) => ({ stage: i.stage, startedAt: i.startedAt })),
      actions: done,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("lookup_health_error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
