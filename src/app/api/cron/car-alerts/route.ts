export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { supabaseServerRole } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/resend";
import { pushConfigured, sendPush, type PushSubscriptionRow } from "@/lib/push-server";
import { recordServerEvent } from "@/lib/server-events";
import { maskPlate } from "@/lib/redact";
import { findRecalls, type Recall } from "@/lib/recalls";
import recallsData from "@/data/recalls.json";
import CarAlert from "@/emails/car-alert";
import { plateAttachment } from "@/lib/plate-image";
import { alertMessage, dueAlerts, needsRefresh, type DueAlert, type SavedCarRow } from "@/lib/car-alerts";
import { cleanIsoDate, makeModelLabel, type SaveChannel } from "@/lib/saved-cars";

// Daily, 08:30 UK-ish (vercel.json). For every active saved car: refresh its
// dates with DVLA when something is close, work out what's due (MOT at 35
// and 7 days, tax at 7 days, a new recall, the monthly value check for
// sellers), send it by push or email, and write the ledger so nothing goes
// twice. Modelled on /api/cron/mot-reminders. Rows for inactive cars and
// dead push subscriptions are purged after 12 months, as the privacy page
// says.

const SITE = "https://www.freeplatecheck.co.uk";
const MAX_SENDS_PER_RUN = 150;
const MAX_REFRESH_PER_RUN = 120;
const PURGE_AFTER_DAYS = 365;

type CarWithSub = SavedCarRow & { push_subscriptions: (PushSubscriptionRow & { active: boolean }) | null };

async function loadRecalls(sb: ReturnType<typeof supabaseServerRole>): Promise<Recall[]> {
  try {
    const { data } = await sb.from("data_cache").select("data, updated_at").eq("key", "recalls").single();
    if (data?.data && Date.now() - Date.parse(data.updated_at) < 14 * 86_400_000) return data.data as Recall[];
  } catch {
    // Fall through to the bundled file.
  }
  return recallsData as Recall[];
}

function splitMakeModel(makeModel: string | null): { make?: string; model?: string } {
  const parts = (makeModel ?? "").trim().split(" ");
  return { make: parts[0] || undefined, model: parts.slice(1).join(" ") || undefined };
}

/** Re-read the car from DVLA (via our own lookup route, which caches). */
async function refresh(origin: string, car: SavedCarRow) {
  try {
    const res = await fetch(`${origin}/api/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fpc-internal": "1" },
      body: JSON.stringify({ vrm: car.vrm }),
    });
    if (!res.ok) return null;
    const d = (await res.json())?.data;
    if (!d?.make) return null;
    return {
      make_model: makeModelLabel(d.make, d.model) || car.make_model,
      mot_expiry: cleanIsoDate(d.motExpiryDate) ?? car.mot_expiry,
      tax_due: cleanIsoDate(d.taxDueDate) ?? car.tax_due,
      year_of_manufacture: typeof d.yearOfManufacture === "number" ? d.yearOfManufacture : car.year_of_manufacture,
    };
  } catch (err) {
    console.warn("car_alerts_refresh_failed:", maskPlate(car.vrm), err instanceof Error ? err.message : err);
    return null;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServerRole();
  const now = new Date();
  const origin = new URL(req.url).origin;
  const stats = { cars: 0, refreshed: 0, sent: 0, errors: 0, retired: 0, purged: 0 };

  // Housekeeping first: the privacy page's 12-month retention for stopped rows.
  const cutoff = new Date(now.getTime() - PURGE_AFTER_DAYS * 86_400_000).toISOString();
  const { data: purgedCars } = await sb.from("saved_cars").delete().eq("active", false).lt("updated_at", cutoff).select("id");
  const { data: purgedSubs } = await sb.from("push_subscriptions").delete().eq("active", false).lt("created_at", cutoff).select("id");
  stats.purged = (purgedCars?.length ?? 0) + (purgedSubs?.length ?? 0);

  const { data: rows, error } = await sb
    .from("saved_cars")
    .select("*, push_subscriptions(id, endpoint, p256dh, auth, active)")
    .eq("active", true)
    .order("mot_expiry", { ascending: true, nullsFirst: false })
    .limit(2000);
  if (error) {
    console.error("car_alerts_query_error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const recalls = await loadRecalls(sb);
  const pushOn = pushConfigured();

  for (const row of (rows ?? []) as CarWithSub[]) {
    if (stats.sent >= MAX_SENDS_PER_RUN) break;
    stats.cars++;
    let car: SavedCarRow = row;
    const patch: Record<string, unknown> = {};

    if (needsRefresh(car, now) && stats.refreshed < MAX_REFRESH_PER_RUN) {
      stats.refreshed++;
      const fresh = await refresh(origin, car);
      if (fresh) {
        car = { ...car, ...fresh };
        Object.assign(patch, fresh);
      }
    }

    // Recalls that match this car today. The first run only records the
    // baseline; a rise after that is the alert.
    const { make, model } = splitMakeModel(car.make_model);
    const recallCount = make ? findRecalls(recalls, make, model, car.year_of_manufacture ?? undefined).length : null;
    const baselineOnly = car.recall_count == null && recallCount != null;
    if (recallCount != null && recallCount !== car.recall_count) patch.recall_count = recallCount;

    const due = dueAlerts(car, now, baselineOnly ? null : recallCount);
    const ledger: Record<string, string> = { ...(car.alerts_sent ?? {}) };

    for (const alert of due) {
      if (stats.sent >= MAX_SENDS_PER_RUN) break;
      const ok = await deliver(sb, car, row.push_subscriptions, alert, pushOn);
      if (ok === "retired") {
        stats.retired++;
        patch.active = false;
        break;
      }
      if (ok === "sent") {
        stats.sent++;
        const at = now.toISOString();
        ledger[alert.key] = at;
        for (const k of alert.alsoMark) ledger[k] = at;
        patch.alerts_sent = ledger;
        await recordServerEvent("alert_sent", { kind: alert.kind, channel: car.channel, intent: car.intent, surface: "cron" });
      } else {
        stats.errors++;
      }
    }

    if (Object.keys(patch).length) {
      patch.updated_at = now.toISOString();
      const { error: updateError } = await sb.from("saved_cars").update(patch).eq("id", car.id);
      if (updateError) console.error("car_alerts_update_error:", car.id, updateError.message);
    }
  }

  console.log("car_alerts_run:", JSON.stringify(stats));
  return NextResponse.json({ ok: true, ...stats, timestamp: now.toISOString() });
}

/** "sent", "retired" (push address gone — stop the row) or "error". */
async function deliver(
  sb: ReturnType<typeof supabaseServerRole>,
  car: SavedCarRow,
  sub: (PushSubscriptionRow & { active: boolean }) | null,
  alert: DueAlert,
  pushOn: boolean,
): Promise<"sent" | "retired" | "error"> {
  const channel: SaveChannel = car.channel;
  const msg = alertMessage(alert, car, channel);
  const manageUrl = `${SITE}/api/unsubscribe?token=${car.manage_token}`;

  if (channel === "push") {
    if (!sub || !sub.active) return "retired";
    if (!pushOn) return "error";
    const result = await sendPush(sub, { title: msg.title, body: msg.body, url: msg.url, tag: `car-alert-${alert.kind}-${car.vrm}`, stop: manageUrl });
    if (result.ok) {
      await sb.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", sub.id);
      return "sent";
    }
    if (result.gone) {
      await sb.from("push_subscriptions").update({ active: false }).eq("id", sub.id);
      console.log("car_alerts_push_gone:", maskPlate(car.vrm));
      return "retired";
    }
    console.error("car_alerts_push_error:", maskPlate(car.vrm), result.error);
    return "error";
  }

  if (!car.email) return "retired";
  const plate = await plateAttachment(car.vrm);
  const result = await sendEmail({
    to: car.email,
    subject: msg.title,
    attachments: plate ? [plate] : undefined,
    react: CarAlert({
      regNumber: car.vrm,
      title: msg.title,
      lead: msg.lead,
      accent: msg.accent,
      kicker: msg.kicker,
      sentOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
      facts: msg.facts,
      body: msg.body,
      cta: msg.cta,
      url: msg.url,
      note: alert.kind === "tax" ? "Tax it at gov.uk/vehicle-tax — you'll need the 11-digit reference from your V5C or the reminder letter." : undefined,
      manageUrl,
    }),
    unsubscribeUrl: manageUrl,
  });
  if (!result.ok) {
    console.error("car_alerts_email_error:", maskPlate(car.vrm), result.error);
    return "error";
  }
  return "sent";
}
