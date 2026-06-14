export const runtime = "nodejs";
export const maxDuration = 10;

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/resend";
import { PARTNER_LINKS } from "@/config/partners";
import MOTReminderDue from "@/emails/mot-reminder-due";
import { DEFAULT_OFFSETS, MAX_OFFSET_DAYS, reminderSubject } from "@/lib/mot-reminders";

const MAX_EMAILS_PER_RUN = 80;

interface MotReminder {
  id: string;
  email: string;
  vrm: string;
  make_model: string | null;
  mot_expiry: string;
  reminder_offsets: number[] | null;
  sent_offsets: number[] | null;
  unsubscribe_token: string;
}

function formatDateDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseMakeModel(makeModel: string): { make: string; model: string } {
  const parts = (makeModel || "").split(" ");
  return { make: parts[0] || "Your", model: parts.slice(1).join(" ") || "vehicle" };
}

function uniqueSorted(nums: number[]): number[] {
  return Array.from(new Set(nums)).sort((a, b) => b - a);
}

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServer();
  const now = new Date();
  let sent = 0;
  let errors = 0;

  // Pull every active reminder whose MOT expires within the longest possible
  // lead time, then decide per-row which (if any) of its chosen offsets is due.
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + MAX_OFFSET_DAYS + 2);

  const { data: rows, error } = await sb
    .from("mot_reminders")
    .select(
      "id, email, vrm, make_model, mot_expiry, reminder_offsets, sent_offsets, unsubscribe_token",
    )
    .eq("active", true)
    .gte("mot_expiry", now.toISOString().split("T")[0])
    .lte("mot_expiry", windowEnd.toISOString().split("T")[0])
    .order("mot_expiry", { ascending: true })
    .limit(500);

  if (error) {
    console.error("cron_query_error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  for (const reminder of (rows ?? []) as MotReminder[]) {
    if (sent >= MAX_EMAILS_PER_RUN) break;

    const daysRemaining = Math.ceil(
      (new Date(reminder.mot_expiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysRemaining < 0) continue;

    const offsets = reminder.reminder_offsets?.length ? reminder.reminder_offsets : DEFAULT_OFFSETS;
    const alreadySent = reminder.sent_offsets ?? [];

    // Windows that have been reached (expiry is within them) and not yet sent.
    const dueNow = offsets.filter((o) => o >= daysRemaining && !alreadySent.includes(o));
    if (dueNow.length === 0) continue;

    const { make, model } = parseMakeModel(reminder.make_model || "");
    const unsubscribeUrl = `https://freeplatecheck.co.uk/api/unsubscribe?token=${reminder.unsubscribe_token}`;
    const clickref = daysRemaining <= 7 ? "email-mot-reminder-7d" : "email-mot-reminder-early";
    const bmgUrl = PARTNER_LINKS.bookMyGarage.buildLink!(reminder.vrm, clickref);

    const result = await sendEmail({
      to: reminder.email,
      subject: reminderSubject(daysRemaining, reminder.vrm, make, model),
      react: MOTReminderDue({
        make,
        model,
        regNumber: reminder.vrm,
        expiryDate: formatDateDDMMYYYY(reminder.mot_expiry),
        daysRemaining,
        bmgAffiliateUrl: bmgUrl,
        unsubscribeUrl,
      }),
      unsubscribeUrl,
    });

    if (result.ok) {
      // Mark every reached window as sent — including any earlier window the
      // user skipped past (e.g. signed up inside the 5-week mark) so we never
      // back-fill a stale reminder later.
      const newSent = uniqueSorted([...alreadySent, ...offsets.filter((o) => o >= daysRemaining)]);
      await sb
        .from("mot_reminders")
        .update({ sent_offsets: newSent, updated_at: new Date().toISOString() })
        .eq("id", reminder.id);
      sent++;
    } else {
      console.error("cron_send_error:", reminder.id, result.error);
      errors++;
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    errors,
    timestamp: now.toISOString(),
  });
}
