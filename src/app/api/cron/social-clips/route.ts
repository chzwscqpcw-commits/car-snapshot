export const runtime = "nodejs";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { sendInternalEmail } from "@/lib/resend";
import { fetchSocialClips, renderSocialClipsEmail, socialClipsSubject } from "@/lib/social-clips";

// Sunday 08:00 UTC (vercel.json): the week's three clips, with captions and
// download links, so they can be scheduled in Buffer before Monday's post.
// The clips themselves come from Saturday night's social-clips.yml run; if
// it did not run, the email says so in one line and still goes out.
const RECIPIENT = process.env.AUDIT_EMAIL || "stephengaisford@gmail.com";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clips = await fetchSocialClips();
    const res = await sendInternalEmail({ to: RECIPIENT, subject: socialClipsSubject(clips), html: renderSocialClipsEmail(clips) });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: res.id, week: clips.ok ? clips.data.week : null, note: clips.ok ? undefined : clips.note });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("social_clips_email_error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
