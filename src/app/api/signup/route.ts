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
      return NextResponse.json(
        { ok: false, error: "Enter a valid email." },
        { status: 400 }
      );
    }

    const wantsReminders = Boolean(body?.wantsReminders);
    const lastVrmHash = typeof body?.vrmHash === "string" ? body.vrmHash : null;

    // Dates come from the lookup response (strings like "2026-09-01")
    const motExpiry =
      typeof body?.motExpiryDate === "string" ? body.motExpiryDate : null;
    const taxDue =
      typeof body?.taxDueDate === "string" ? body.taxDueDate : null;

    const sb = supabaseServer();

    // Check if this email already exists (for a friendly message)
    const { data: existing } = await sb
      .from("email_signups")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    const wasAlready = Boolean(existing?.email);

    // Upsert (insert if new, update if exists)
    const { error } = await sb
      .from("email_signups")
      .upsert(
        {
          email,
          source: "car-snapshot",
          wants_reminders: wantsReminders,
          last_vrm_hash: lastVrmHash,
          mot_expiry: motExpiry,
          tax_due: taxDue,
        },
        { onConflict: "email" }
      );

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Could not save email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, already: wasAlready });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
}
