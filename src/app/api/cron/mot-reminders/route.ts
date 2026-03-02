export const runtime = "nodejs";
export const maxDuration = 10;

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/resend";
import { buildMotReminderEmail } from "@/lib/mot-reminder-email";

const MAX_EMAILS_PER_RUN = 80;

interface MotReminder {
  id: string;
  email: string;
  vrm: string;
  make_model: string | null;
  mot_expiry: string;
  reminder_28d_sent: boolean;
  reminder_7d_sent: boolean;
  unsubscribe_token: string;
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

  // --- 28-day reminders ---
  const date28from = new Date(now);
  date28from.setDate(date28from.getDate() + 27);
  const date28to = new Date(now);
  date28to.setDate(date28to.getDate() + 29);

  const { data: reminders28, error: err28 } = await sb
    .from("mot_reminders")
    .select("id, email, vrm, make_model, mot_expiry, reminder_28d_sent, reminder_7d_sent, unsubscribe_token")
    .eq("active", true)
    .eq("reminder_28d_sent", false)
    .gte("mot_expiry", date28from.toISOString().split("T")[0])
    .lte("mot_expiry", date28to.toISOString().split("T")[0])
    .limit(MAX_EMAILS_PER_RUN);

  if (err28) {
    console.error("cron_28d_query_error:", err28);
  }

  if (reminders28) {
    for (const reminder of reminders28 as MotReminder[]) {
      if (sent >= MAX_EMAILS_PER_RUN) break;

      const daysRemaining = Math.ceil(
        (new Date(reminder.mot_expiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const { subject, html } = buildMotReminderEmail({
        vrm: reminder.vrm,
        makeModel: reminder.make_model || "Your vehicle",
        expiryDate: reminder.mot_expiry,
        daysRemaining,
        unsubscribeToken: reminder.unsubscribe_token,
      });

      const result = await sendEmail({ to: reminder.email, subject, html });

      if (result.ok) {
        await sb
          .from("mot_reminders")
          .update({ reminder_28d_sent: true, updated_at: new Date().toISOString() })
          .eq("id", reminder.id);
        sent++;
      } else {
        console.error("cron_28d_send_error:", reminder.id, result.error);
        errors++;
      }
    }
  }

  // --- 7-day reminders (use remaining budget) ---
  const remaining = MAX_EMAILS_PER_RUN - sent;
  if (remaining > 0) {
    const date7from = new Date(now);
    date7from.setDate(date7from.getDate() + 6);
    const date7to = new Date(now);
    date7to.setDate(date7to.getDate() + 8);

    const { data: reminders7, error: err7 } = await sb
      .from("mot_reminders")
      .select("id, email, vrm, make_model, mot_expiry, reminder_28d_sent, reminder_7d_sent, unsubscribe_token")
      .eq("active", true)
      .eq("reminder_7d_sent", false)
      .gte("mot_expiry", date7from.toISOString().split("T")[0])
      .lte("mot_expiry", date7to.toISOString().split("T")[0])
      .limit(remaining);

    if (err7) {
      console.error("cron_7d_query_error:", err7);
    }

    if (reminders7) {
      for (const reminder of reminders7 as MotReminder[]) {
        if (sent >= MAX_EMAILS_PER_RUN) break;

        const daysRemaining = Math.ceil(
          (new Date(reminder.mot_expiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const { subject, html } = buildMotReminderEmail({
          vrm: reminder.vrm,
          makeModel: reminder.make_model || "Your vehicle",
          expiryDate: reminder.mot_expiry,
          daysRemaining,
          unsubscribeToken: reminder.unsubscribe_token,
        });

        const result = await sendEmail({ to: reminder.email, subject, html });

        if (result.ok) {
          await sb
            .from("mot_reminders")
            .update({ reminder_7d_sent: true, updated_at: new Date().toISOString() })
            .eq("id", reminder.id);
          sent++;
        } else {
          console.error("cron_7d_send_error:", reminder.id, result.error);
          errors++;
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    errors,
    timestamp: now.toISOString(),
  });
}
