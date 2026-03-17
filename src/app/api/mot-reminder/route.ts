export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/resend";
import { PARTNER_LINKS } from "@/config/partners";
import MOTReminderSet from "@/emails/mot-reminder-set";
import MOTReminder28d from "@/emails/mot-reminder-28d";
import MOTReminder7d from "@/emails/mot-reminder-7d";

function looksLikeEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidVrm(vrm: string) {
  return /^[A-Z0-9]{2,7}$/.test(vrm);
}

function formatDateDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * If the user signs up and their MOT is already inside the 28-day or 7-day
 * window (or both), send the appropriate reminder(s) immediately so they
 * don't miss out. Mark the flags so the cron won't double-send.
 */
async function sendCatchUpReminders(
  email: string,
  vrm: string,
  makeModel: string,
  motExpiry: string,
  unsubscribeToken: string,
  reminderId: string,
) {
  const now = new Date();
  const expiryDate = new Date(motExpiry);
  const daysRemaining = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Only relevant for future expiry dates within 28 days
  if (daysRemaining < 0 || daysRemaining > 28) return;

  const parts = makeModel.split(" ");
  const make = parts[0] || "Your";
  const model = parts.slice(1).join(" ") || "vehicle";
  const unsubscribeUrl = `https://freeplatecheck.co.uk/api/unsubscribe?token=${unsubscribeToken}`;
  const bmgUrl = PARTNER_LINKS.bookMyGarage.buildLink!(vrm);
  const formattedExpiry = formatDateDDMMYYYY(motExpiry);
  const sb = supabaseServer();

  // Send 28-day reminder if inside 28-day window
  if (daysRemaining <= 28 && daysRemaining > 7) {
    const result = await sendEmail({
      to: email,
      subject: `MOT due in ${daysRemaining} days — ${vrm} (${make} ${model})`,
      react: MOTReminder28d({
        make,
        model,
        regNumber: vrm,
        expiryDate: formattedExpiry,
        daysRemaining,
        bmgAffiliateUrl: bmgUrl,
        unsubscribeUrl,
      }),
      unsubscribeUrl,
    });

    if (result.ok) {
      await sb
        .from("mot_reminders")
        .update({ reminder_28d_sent: true, updated_at: new Date().toISOString() })
        .eq("id", reminderId);
      console.log("catchup_28d_sent:", email, vrm, `${daysRemaining}d remaining`);
    } else {
      console.error("catchup_28d_error:", result.error);
    }
  }

  // Send 7-day reminder if inside 7-day window (or already expired/today)
  if (daysRemaining <= 7) {
    // Also mark 28d as sent since they missed that window entirely
    const result = await sendEmail({
      to: email,
      subject: `⚠️ MOT expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} — ${vrm}`,
      react: MOTReminder7d({
        make,
        model,
        regNumber: vrm,
        expiryDate: formattedExpiry,
        daysRemaining,
        bmgAffiliateUrl: bmgUrl,
        unsubscribeUrl,
      }),
      unsubscribeUrl,
    });

    if (result.ok) {
      await sb
        .from("mot_reminders")
        .update({
          reminder_28d_sent: true,
          reminder_7d_sent: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reminderId);
      console.log("catchup_7d_sent:", email, vrm, `${daysRemaining}d remaining`);
    } else {
      console.error("catchup_7d_error:", result.error);
    }
  }
}

async function sendConfirmation(
  email: string,
  vrm: string,
  makeModel: string,
  motExpiry: string,
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

    if (!looksLikeEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }

    if (!isValidVrm(vrm)) {
      return NextResponse.json({ ok: false, error: "Invalid registration." }, { status: 400 });
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

    const sb = supabaseServer();

    // Try insert first — return the unsubscribe_token in one atomic operation
    const { data: inserted, error: insertError } = await sb
      .from("mot_reminders")
      .insert({
        email,
        vrm,
        make_model: makeModel || null,
        mot_expiry: validExpiry,
        reminder_28d_sent: false,
        reminder_7d_sent: false,
        active: true,
      })
      .select("id, unsubscribe_token")
      .single();

    if (!insertError && inserted) {
      console.log("mot_reminder_created:", email, vrm);
      await sendConfirmation(email, vrm, makeModel, validExpiry, inserted.unsubscribe_token);
      await sendCatchUpReminders(email, vrm, makeModel, validExpiry, inserted.unsubscribe_token, inserted.id);

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
          mot_expiry: validExpiry,
          make_model: makeModel || null,
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

      console.log("mot_reminder_updated:", email, vrm);
      await sendConfirmation(email, vrm, makeModel, validExpiry, updated.unsubscribe_token);
      await sendCatchUpReminders(email, vrm, makeModel, validExpiry, updated.unsubscribe_token, updated.id);

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
