export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendInternalEmail } from "@/lib/resend";
import {
  buildWeeklyAuditData,
  renderWeeklyAuditHtml,
  weeklyAuditSubject,
} from "@/lib/weekly-audit";

// Who receives the weekly visitor audit. Overridable via AUDIT_EMAIL.
const RECIPIENT = process.env.AUDIT_EMAIL || "stephengaisford@gmail.com";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sb = supabaseServer();
    const data = await buildWeeklyAuditData(sb, Date.now());
    const html = renderWeeklyAuditHtml(data);
    const subject = weeklyAuditSubject(data);

    const res = await sendInternalEmail({ to: RECIPIENT, subject, html });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: res.id, window: `${data.windowStart}→${data.windowEnd}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("weekly_audit_error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
