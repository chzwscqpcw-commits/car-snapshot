export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function looksLikeEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body?.email ?? ""));

    if (!looksLikeEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }

    const wantsReminders = Boolean(body?.wantsReminders);
    const lastVrmHash = typeof body?.vrmHash === "string" ? body.vrmHash : null;
    const motExpiry = typeof body?.motExpiryDate === "string" ? body.motExpiryDate : null;
    const taxDue = typeof body?.taxDueDate === "string" ? body.taxDueDate : null;

    const sb = supabaseServer();

    // 1) Try to create a brand new signup
    const { error: insertError } = await sb.from("email_signups").insert({
      email,
      source: "free-plate-check",
      wants_reminders: wantsReminders,
      last_vrm_hash: lastVrmHash,
      mot_expiry: motExpiry,
      tax_due: taxDue,
    });

    if (!insertError) {
      return NextResponse.json({
        ok: true,
        status: "created",
        message: "Saved. We’ll keep you posted.",
      });
    }

    // 2) If it’s a duplicate email, update preferences instead
    if ((insertError as any).code === "23505") {
      const update: Record<string, any> = {
        wants_reminders: wantsReminders,
      };

      // Only overwrite these if we actually have values
      if (lastVrmHash) update.last_vrm_hash = lastVrmHash;
      if (motExpiry) update.mot_expiry = motExpiry;
      if (taxDue) update.tax_due = taxDue;

      const { error: updateError } = await sb.from("email_signups").update(update).eq("email", email);

      if (updateError) {
        console.error("signup_update_error:", updateError);
        return NextResponse.json({ ok: false, error: "Could not update your preferences." }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        status: "updated",
        message: "Already subscribed — preferences updated.",
      });
    }

    console.error("signup_insert_error:", insertError);
    return NextResponse.json({ ok: false, error: "Could not save email." }, { status: 500 });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
}
