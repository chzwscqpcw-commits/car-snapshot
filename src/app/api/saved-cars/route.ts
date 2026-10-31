export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerRole } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/resend";
import CarSaved from "@/emails/car-saved";
import { maskEmail, maskPlate } from "@/lib/redact";
import { pushConfigured, sendPush } from "@/lib/push-server";
import {
  alertsDescription,
  cleanEmail,
  cleanIntent,
  cleanIsoDate,
  cleanSurface,
  cleanVrm,
  isTestEmail,
  makeModelLabel,
} from "@/lib/saved-cars";

// Save a car so its owner gets alerts (MOT due, tax due, a new recall, and a
// value check for sellers). The row holds the plate in clear — the only way to
// send a timed alert — under the same rules as mot_reminders: service role
// only, a manage link in every email, nothing in logs beyond a masked plate.
// Tables: docs/migrations/2026-10-31-saved-cars.sql and
// 2026-10-31-push-subscriptions.sql. Channel "push" stores the browser's
// subscription (endpoint + keys, no email) and answers with a first
// notification, so the owner sees at once that it works.

const NO_STORE = { "Cache-Control": "no-store" };
const SITE = "https://www.freeplatecheck.co.uk";

/** A PushSubscription.toJSON(): an https endpoint and the two keys, nothing else. */
function cleanSubscription(input: unknown): { endpoint: string; keys: { p256dh: string; auth: string } } | null {
  const o = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  const endpoint = typeof o?.endpoint === "string" ? o.endpoint : "";
  const p256dh = typeof o?.keys?.p256dh === "string" ? o.keys.p256dh : "";
  const auth = typeof o?.keys?.auth === "string" ? o.keys.auth : "";
  if (!/^https:\/\/[^\s]{10,2048}$/.test(endpoint) || !p256dh || !auth || p256dh.length > 256 || auth.length > 64) return null;
  return { endpoint, keys: { p256dh, auth } };
}

/** "8 Dec 2026", the form the alert emails use. */
function formatDateShort(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * Re-check the dates and name against DVLA before storing them, as the MOT
 * reminder route does: a stale tab could hand us last year's expiry. Falls
 * back to what the client sent if the lookup is unavailable.
 */
async function verifyWithDvla(req: Request, vrm: string) {
  try {
    const res = await fetch(`${new URL(req.url).origin}/api/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vrm }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.data;
    if (!d?.make) return null;
    return {
      makeModel: makeModelLabel(d.make, d.model),
      motExpiry: cleanIsoDate(d.motExpiryDate),
      taxDue: cleanIsoDate(d.taxDueDate),
      year: typeof d.yearOfManufacture === "number" ? d.yearOfManufacture : null,
    };
  } catch (err) {
    console.warn("saved_car_dvla_verify_failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400, headers: NO_STORE });
  }

  const vrm = cleanVrm(body.vrm);
  if (!vrm) return NextResponse.json({ ok: false, error: "Invalid registration." }, { status: 400, headers: NO_STORE });

  const channel = body.channel === "push" ? "push" : "email";
  const subscription = channel === "push" ? cleanSubscription(body.subscription) : null;
  if (channel === "push") {
    if (!pushConfigured()) {
      return NextResponse.json({ ok: false, error: "Notifications aren't switched on yet — use email instead." }, { status: 400, headers: NO_STORE });
    }
    if (!subscription) return NextResponse.json({ ok: false, error: "That notification address isn't valid." }, { status: 400, headers: NO_STORE });
  }
  const email = channel === "email" ? cleanEmail(body.email) : null;
  if (channel === "email" && !email) {
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400, headers: NO_STORE });
  }

  const intent = cleanIntent(body.intent);
  const surface = cleanSurface(body.surface);

  // Verification scripts: answer as if saved, store and send nothing.
  if (email && isTestEmail(email)) {
    console.log("saved_car_test_email_skipped:", maskEmail(email), maskPlate(vrm));
    return NextResponse.json({ ok: true, status: "created", test: true }, { headers: NO_STORE });
  }

  let makeModel = makeModelLabel(
    typeof body.make === "string" ? body.make : null,
    typeof body.model === "string" ? body.model : null,
  );
  let motExpiry = cleanIsoDate(body.motExpiry);
  let taxDue = cleanIsoDate(body.taxDue);
  let year = typeof body.year === "number" && body.year > 1900 ? Math.round(body.year) : null;
  const verified = await verifyWithDvla(req, vrm);
  if (verified) {
    if (verified.makeModel) makeModel = verified.makeModel;
    if (verified.motExpiry) motExpiry = verified.motExpiry;
    if (verified.taxDue) taxDue = verified.taxDue;
    if (verified.year) year = verified.year;
  }

  const sb = supabaseServerRole();

  // The browser's push address, one row per endpoint (a re-save from the
  // same browser reuses it).
  let pushSubscriptionId: string | null = null;
  if (subscription) {
    const { data: sub, error: subError } = await sb
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300) || null,
          active: true,
        },
        { onConflict: "endpoint" },
      )
      .select("id")
      .single();
    if (subError || !sub) {
      const missing = subError?.code === "42P01";
      console.error("push_subscription_upsert_error:", subError?.code, subError?.message);
      return NextResponse.json(
        { ok: false, error: missing ? "Notifications aren't switched on yet — use email instead." : "Could not save this car." },
        { status: missing ? 503 : 500, headers: NO_STORE },
      );
    }
    pushSubscriptionId = sub.id;
  }

  const row = {
    make_model: makeModel || null,
    mot_expiry: motExpiry,
    tax_due: taxDue,
    year_of_manufacture: year,
    channel,
    email,
    push_subscription_id: pushSubscriptionId,
    intent,
    surface,
    active: true,
    updated_at: new Date().toISOString(),
  };

  // Insert, or update the row this person already has for this car. An
  // upsert on the partial unique index needs its predicate spelled out, so
  // two statements keep it plain.
  let saved: { id: string; manage_token: string } | null = null;
  let status: "created" | "updated" = "created";
  const { data: inserted, error: insertError } = await sb
    .from("saved_cars")
    .insert({ vrm, ...row })
    .select("id, manage_token")
    .single();
  if (!insertError && inserted) {
    saved = inserted;
  } else if (insertError?.code === "23505") {
    status = "updated";
    // A re-save keeps the earlier alert ledger: a reminder that already
    // went out shouldn't go out again because the owner tapped Save twice.
    let q = sb.from("saved_cars").update(row).eq("vrm", vrm);
    q = email ? q.eq("email", email) : q.eq("push_subscription_id", pushSubscriptionId);
    const { data: updated, error: updateError } = await q.select("id, manage_token").single();
    if (updateError || !updated) {
      console.error("saved_car_update_error:", updateError?.message);
      return NextResponse.json({ ok: false, error: "Could not save this car." }, { status: 500, headers: NO_STORE });
    }
    saved = updated;
  } else {
    // 42P01 = the table isn't there yet (migration not run).
    const missing = insertError?.code === "42P01";
    console.error("saved_car_insert_error:", insertError?.code, insertError?.message);
    return NextResponse.json(
      { ok: false, error: missing ? "Saving isn't switched on yet — try again later." : "Could not save this car." },
      { status: missing ? 503 : 500, headers: NO_STORE },
    );
  }

  console.log(`saved_car_${status}:`, channel, email ? maskEmail(email) : "push", maskPlate(vrm), `intent=${intent ?? "-"}`, `surface=${surface ?? "-"}`);

  const manageUrl = `${SITE}/api/unsubscribe?token=${saved.manage_token}`;

  if (subscription) {
    // The first notification doubles as the confirmation.
    const plate = /^[A-Z]{2}\d{2}[A-Z]{3}$/.test(vrm) ? `${vrm.slice(0, 4)} ${vrm.slice(4)}` : vrm;
    const hello = await sendPush(
      { id: pushSubscriptionId as string, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      {
        title: `Alerts on for ${plate}`,
        body: `We'll notify you ${alertsDescription(intent)}.`,
        url: `${SITE}/?src=car-saved-push#vrm=${vrm}`,
        tag: `car-saved-${vrm}`,
        stop: manageUrl,
      },
    );
    if (!hello.ok) console.error("saved_car_welcome_push_error:", hello.error);
    return NextResponse.json({ ok: true, status, delivered: hello.ok }, { headers: NO_STORE });
  }

  const result = await sendEmail({
    to: email as string,
    subject: `Alerts on for ${vrm}${makeModel ? ` (${makeModel})` : ""}`,
    react: CarSaved({
      regNumber: vrm,
      makeModel: makeModel || null,
      motExpiry: formatDateShort(motExpiry),
      taxDue: formatDateShort(taxDue),
      alerts: alertsDescription(intent),
      manageUrl,
      plateUrl: `${SITE}/api/alerts/plate?t=${saved.manage_token}`,
      sentOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
    }),
    unsubscribeUrl: manageUrl,
  });
  if (!result.ok) console.error("saved_car_confirmation_error:", result.error);

  return NextResponse.json({ ok: true, status }, { headers: NO_STORE });
}
