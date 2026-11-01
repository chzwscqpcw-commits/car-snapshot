export const runtime = "nodejs";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { sendInternalEmail } from "@/lib/resend";
import {
  expectedBatch,
  fetchSocialClips,
  fetchSocialRun,
  missedBatchSubject,
  renderMissedBatchEmail,
  renderSocialClipsEmail,
  socialClipsSubject,
} from "@/lib/social-clips";

// Sundays 08:00 UTC (vercel.json). Social Clips renders every third Saturday
// night (2026-W45, W48, W51, then 2027-W01: social/src/calendar.ts) and this cron
// follows the same calendar: on the Sunday before a batch it emails the clips
// with their captions so they can be queued in Buffer before Monday's post,
// and if the batch's release is not there it emails that instead, with the
// Actions link and how to re-run. A render that failed is exactly the case
// that used to be silent (6, 13 and 20 Nov 2026). The other two Sundays in
// three: nothing.
const RECIPIENT = process.env.AUDIT_EMAIL || "stephengaisford@gmail.com";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const batch = expectedBatch(new Date());
    if (!batch) return NextResponse.json({ ok: true, skipped: "not a batch Sunday" });
    const clips = await fetchSocialClips(fetch, undefined, batch.tag);
    const mail = clips.ok
      ? { subject: socialClipsSubject(clips), html: renderSocialClipsEmail(clips) }
      : { subject: missedBatchSubject(batch), html: renderMissedBatchEmail(batch, clips.note, await fetchSocialRun()) };
    const res = await sendInternalEmail({ to: RECIPIENT, ...mail });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: res.id, batch: batch.tag, rendered: clips.ok, note: clips.ok ? undefined : clips.note });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("social_clips_email_error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
