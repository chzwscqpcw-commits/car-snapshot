export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/resend";
import { PARTNER_LINKS } from "@/config/partners";
import MOTReminderSet from "@/emails/mot-reminder-set";
import MOTReminderDue from "@/emails/mot-reminder-due";
import { sanitizeOffsets, reminderSubject } from "@/lib/mot-reminders";

function looksLikeEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidVrm(vrm: string) {
  return /^[A-Z0-9]{2,7}$/.test(vrm);
}

/**
 * Identify emails created by verification / test scripts so they don't
 * pollute the real reminders table (or trigger emails to fake recipients).
 * Matches a `verify-test+` local-part OR any RFC 2606 reserved domain.
 * Real users will never have these addresses.
 */
function isTestEmail(email: string): boolean {
  const e = email.toLowerCase();
  if (e.startsWith("verify-test+")) return true;
  if (e.endsWith("@example.com")) return true;
  if (e.endsWith("@example.org")) return true;
  if (e.endsWith("@example.net")) return true;
  if (e.endsWith("@test.invalid")) return true;
  return false;
}

function formatDateDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * If the user signs up and one or more of their chosen reminder windows has
 * already been reached (MOT expiry is closer than the offset), send a single
 * reminder immediately so they don't miss out — tone matched to how close it
 * is — and mark every reached window as sent so the cron won't double-send.
 */
async function sendCatchUpReminders(
  email: string,
  vrm: string,
  makeModel: string,
  motExpiry: string,
  unsubscribeToken: string,
  reminderId: string,
  offsets: number[],
) {
  const now = new Date();
  const daysRemaining = Math.ceil(
    (new Date(motExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Already expired → no "due" email (the signup confirmation still went out).
  if (daysRemaining < 0) return;

  // Which chosen windows are already in the past / current?
  const reached = offsets.filter((o) => o >= daysRemaining);
  if (reached.length === 0) return; // nothing due yet — the cron will handle it

  const parts = makeModel.split(" ");
  const make = parts[0] || "Your";
  const model = parts.slice(1).join(" ") || "vehicle";
  const unsubscribeUrl = `https://freeplatecheck.co.uk/api/unsubscribe?token=${unsubscribeToken}`;
  // "email-reminder-catchup" keeps commission attribution distinct from the
  // scheduled cron emails.
  const bmgUrl = PARTNER_LINKS.bookMyGarage.buildLink!(vrm, "email-reminder-catchup");
  const sb = supabaseServer();

  const result = await sendEmail({
    to: email,
    subject: reminderSubject(daysRemaining, vrm, make, model),
    react: MOTReminderDue({
      make,
      model,
      regNumber: vrm,
      expiryDate: formatDateDDMMYYYY(motExpiry),
      daysRemaining,
      bmgAffiliateUrl: bmgUrl,
      unsubscribeUrl,
    }),
    unsubscribeUrl,
  });

  if (result.ok) {
    await sb
      .from("mot_reminders")
      .update({ sent_offsets: reached, updated_at: new Date().toISOString() })
      .eq("id", reminderId);
    console.log("catchup_sent:", email, vrm, `${daysRemaining}d remaining`, `windows=${reached}`);
  } else {
    console.error("catchup_error:", result.error);
  }
}

async function sendConfirmation(
  email: string,
  vrm: string,
  makeModel: string,
  motExpiry: string,
  offsets: number[],
  unsubscribeToken: string,
) {
  const unsubscribeUrl = `https://freeplatecheck.co.uk/api/unsubscribe?token=${unsubscribeToken}`;
  const parts = makeModel.split(" ");
  const make = parts[0] || "Your";
  const model = parts.slice(1).join(" ") || "vehicle";

  const result = await sendEmail({
    to: email,
    subject: `MOT reminder set — ${vrm}`,
    react: MOTReminderSet({
      make,
      model,
      regNumber: vrm,
      expiryDate: formatDateDDMMYYYY(motExpiry),
      offsets,
      unsubscribeUrl,
    }),
    unsubscribeUrl,
  });

  if (!result.ok) {
    console.error("confirmation_email_error:", result.error);
  } else {
    console.log("confirmation_email_sent:", result.id, "to:", email, "vrm:", vrm);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const vrm = String(body?.vrm ?? "").replace(/\s+/g, "").toUpperCase();
    const makeModel = String(body?.makeModel ?? "").trim();
    const motExpiry = String(body?.motExpiry ?? "");
    const offsets = sanitizeOffsets(body?.offsets);

    if (!looksLikeEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }

    if (!isValidVrm(vrm)) {
      return NextResponse.json({ ok: false, error: "Invalid registration." }, { status: 400 });
    }

    // Test-pattern emails short-circuit: return success so verify scripts can
    // still confirm the gtag conversion fires, but skip the DB write and the
    // Resend email so the real subscribers table stays clean. See the verify
    // skill output and scripts/cleanup-test-reminders.ts for the rationale.
    if (isTestEmail(email)) {
      console.log("mot_reminder_test_email_skipped:", email, vrm);
      return NextResponse.json({ ok: true, test: true });
    }

    // Validate expiry date if provided (allow past dates — user may want a reminder for next year)
    // If no valid date, default to 1 year from now so the reminder still fires
    let validExpiry: string;
    if (motExpiry) {
      const expiryDate = new Date(motExpiry);
      validExpiry = isNaN(expiryDate.getTime())
        ? new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
        : motExpiry;
    } else {
      validExpiry = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
    }

    // Defense in depth: re-verify make/model and expiry against DVLA before
    // storing. Protects against any stale client state that would tag the
    // vrm with the wrong vehicle data. If the DVLA lookup fails (network,
    // rate limit, etc.) we fall back to the client-supplied values.
    let verifiedMakeModel = makeModel;
    let verifiedExpiry = validExpiry;
    try {
      const baseUrl = new URL(req.url).origin;
      const lookupRes = await fetch(`${baseUrl}/api/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm }),
      });
      if (lookupRes.ok) {
        const lookupJson = await lookupRes.json();
        const dvla = lookupJson?.data;
        if (dvla?.make) {
          const fresh = `${dvla.make}${dvla.model ? " " + dvla.model : ""}`.trim();
          if (fresh && fresh !== makeModel) {
            console.warn(
              `mot_reminder_makemodel_drift: client="${makeModel}" → dvla="${fresh}" for vrm=${vrm}`,
            );
          }
          verifiedMakeModel = fresh;
        }
        if (dvla?.motExpiryDate) {
          if (dvla.motExpiryDate !== validExpiry) {
            console.warn(
              `mot_reminder_expiry_drift: client="${validExpiry}" → dvla="${dvla.motExpiryDate}" for vrm=${vrm}`,
            );
          }
          verifiedExpiry = dvla.motExpiryDate;
        }
      }
    } catch (err) {
      console.warn("mot_reminder_dvla_verify_failed:", err);
    }

    const sb = supabaseServer();

    // Try insert first — return the unsubscribe_token in one atomic operation
    const { data: inserted, error: insertError } = await sb
      .from("mot_reminders")
      .insert({
        email,
        vrm,
        make_model: verifiedMakeModel || null,
        mot_expiry: verifiedExpiry,
        reminder_offsets: offsets,
        sent_offsets: [],
        reminder_28d_sent: false,
        reminder_7d_sent: false,
        active: true,
      })
      .select("id, unsubscribe_token")
      .single();

    if (!insertError && inserted) {
      console.log("mot_reminder_created:", email, vrm, `offsets=${offsets}`);
      await sendConfirmation(email, vrm, verifiedMakeModel, verifiedExpiry, offsets, inserted.unsubscribe_token);
      await sendCatchUpReminders(email, vrm, verifiedMakeModel, verifiedExpiry, inserted.unsubscribe_token, inserted.id, offsets);

      return NextResponse.json({
        ok: true,
        status: "created",
        message: "MOT reminder set! Check your inbox for confirmation.",
      });
    }

    // Handle duplicate (email + vrm unique constraint)
    if (insertError?.code === "23505") {
      const { data: updated, error: updateError } = await sb
        .from("mot_reminders")
        .update({
          mot_expiry: verifiedExpiry,
          make_model: verifiedMakeModel || null,
          reminder_offsets: offsets,
          sent_offsets: [],
          reminder_28d_sent: false,
          reminder_7d_sent: false,
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
        .eq("vrm", vrm)
        .select("id, unsubscribe_token")
        .single();

      if (updateError) {
        console.error("mot_reminder_update_error:", updateError);
        return NextResponse.json({ ok: false, error: "Could not update reminder." }, { status: 500 });
      }

      if (!updated?.unsubscribe_token) {
        console.error("mot_reminder_update_no_token:", email, vrm);
        return NextResponse.json({
          ok: true,
          status: "updated",
          message: "MOT reminder updated.",
        });
      }

      console.log("mot_reminder_updated:", email, vrm, `offsets=${offsets}`);
      await sendConfirmation(email, vrm, verifiedMakeModel, verifiedExpiry, offsets, updated.unsubscribe_token);
      await sendCatchUpReminders(email, vrm, verifiedMakeModel, verifiedExpiry, updated.unsubscribe_token, updated.id, offsets);

      return NextResponse.json({
        ok: true,
        status: "updated",
        message: "MOT reminder updated. Check your inbox for confirmation.",
      });
    }

    console.error("mot_reminder_insert_error:", insertError);
    return NextResponse.json({ ok: false, error: "Could not save reminder." }, { status: 500 });
  } catch (err) {
    console.error("mot_reminder_route_error:", err);
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
}
