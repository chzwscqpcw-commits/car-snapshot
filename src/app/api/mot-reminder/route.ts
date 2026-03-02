export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/resend";
import { buildConfirmationEmail } from "@/lib/mot-reminder-email";

function looksLikeEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidVrm(vrm: string) {
  return /^[A-Z0-9]{2,7}$/.test(vrm);
}

async function sendConfirmation(
  email: string,
  vrm: string,
  makeModel: string,
  motExpiry: string,
  unsubscribeToken: string,
) {
  const { subject, html } = buildConfirmationEmail({
    vrm,
    makeModel: makeModel || "Your vehicle",
    expiryDate: motExpiry,
    unsubscribeToken,
  });
  sendEmail({ to: email, subject, html }).then(
    (r) => { if (!r.ok) console.error("confirmation_email_error:", r.error); },
    (err) => console.error("confirmation_email_error:", err),
  );
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

    // Validate expiry date is in the future
    const expiryDate = new Date(motExpiry);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return NextResponse.json({ ok: false, error: "MOT expiry must be a future date." }, { status: 400 });
    }

    const sb = supabaseServer();

    // Try insert first
    const { error: insertError } = await sb.from("mot_reminders").insert({
      email,
      vrm,
      make_model: makeModel || null,
      mot_expiry: motExpiry,
      reminder_28d_sent: false,
      reminder_7d_sent: false,
      active: true,
    });

    if (!insertError) {
      // Fetch the unsubscribe token for the confirmation email
      const { data: row } = await sb
        .from("mot_reminders")
        .select("unsubscribe_token")
        .eq("email", email)
        .eq("vrm", vrm)
        .single();

      if (row?.unsubscribe_token) {
        sendConfirmation(email, vrm, makeModel, motExpiry, row.unsubscribe_token);
      }

      return NextResponse.json({
        ok: true,
        status: "created",
        message: "MOT reminder set! Check your inbox for confirmation.",
      });
    }

    // Handle duplicate (email + vrm unique constraint)
    if (insertError.code === "23505") {
      const { data: updated, error: updateError } = await sb
        .from("mot_reminders")
        .update({
          mot_expiry: motExpiry,
          make_model: makeModel || null,
          reminder_28d_sent: false,
          reminder_7d_sent: false,
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
        .eq("vrm", vrm)
        .select("unsubscribe_token");

      if (updateError) {
        console.error("mot_reminder_update_error:", updateError);
        return NextResponse.json({ ok: false, error: "Could not update reminder." }, { status: 500 });
      }

      if (updated?.[0]?.unsubscribe_token) {
        sendConfirmation(email, vrm, makeModel, motExpiry, updated[0].unsubscribe_token);
      }

      return NextResponse.json({
        ok: true,
        status: "updated",
        message: "MOT reminder updated. Check your inbox for confirmation.",
      });
    }

    console.error("mot_reminder_insert_error:", insertError);
    return NextResponse.json({ ok: false, error: "Could not save reminder." }, { status: 500 });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
}
