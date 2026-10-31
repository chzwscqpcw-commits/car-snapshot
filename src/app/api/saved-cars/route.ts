export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerRole } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/resend";
import CarSaved from "@/emails/car-saved";
import { maskEmail, maskPlate } from "@/lib/redact";
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
// Table: docs/migrations/2026-10-31-saved-cars.sql. Push arrives in PR 2; for
// now the only channel is email.

const NO_STORE = { "Cache-Control": "no-store" };
const SITE = "https://www.freeplatecheck.co.uk";

function formatDateDDMMYYYY(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
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
  if (channel === "push") {
    return NextResponse.json({ ok: false, error: "Push alerts aren't available yet." }, { status: 400, headers: NO_STORE });
  }
  const email = cleanEmail(body.email);
  if (!email) return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400, headers: NO_STORE });

  const intent = cleanIntent(body.intent);
  const surface = cleanSurface(body.surface);

  // Verification scripts: answer as if saved, store and send nothing.
  if (isTestEmail(email)) {
    console.log("saved_car_test_email_skipped:", maskEmail(email), maskPlate(vrm));
    return NextResponse.json({ ok: true, status: "created", test: true }, { headers: NO_STORE });
  }

  let makeModel = makeModelLabel(
    typeof body.make === "string" ? body.make : null,
    typeof body.model === "string" ? body.model : null,
  );
  let motExpiry = cleanIsoDate(body.motExpiry);
  let taxDue = cleanIsoDate(body.taxDue);
  const verified = await verifyWithDvla(req, vrm);
  if (verified) {
    if (verified.makeModel) makeModel = verified.makeModel;
    if (verified.motExpiry) motExpiry = verified.motExpiry;
    if (verified.taxDue) taxDue = verified.taxDue;
  }

  const sb = supabaseServerRole();
  const row = {
    make_model: makeModel || null,
    mot_expiry: motExpiry,
    tax_due: taxDue,
    channel,
    email,
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
    const { data: updated, error: updateError } = await sb
      .from("saved_cars")
      // A re-save keeps the earlier alert ledger: a reminder that already
      // went out shouldn't go out again because the owner tapped Save twice.
      .update(row)
      .eq("email", email)
      .eq("vrm", vrm)
      .select("id, manage_token")
      .single();
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

  console.log(`saved_car_${status}:`, maskEmail(email), maskPlate(vrm), `intent=${intent ?? "-"}`, `surface=${surface ?? "-"}`);

  const manageUrl = `${SITE}/api/unsubscribe?token=${saved.manage_token}`;
  const result = await sendEmail({
    to: email,
    subject: `Alerts on for ${vrm}${makeModel ? ` (${makeModel})` : ""}`,
    react: CarSaved({
      regNumber: vrm,
      makeModel: makeModel || null,
      motExpiry: formatDateDDMMYYYY(motExpiry),
      taxDue: formatDateDDMMYYYY(taxDue),
      alerts: alertsDescription(intent),
      manageUrl,
    }),
    unsubscribeUrl: manageUrl,
  });
  if (!result.ok) console.error("saved_car_confirmation_error:", result.error);

  return NextResponse.json({ ok: true, status }, { headers: NO_STORE });
}
