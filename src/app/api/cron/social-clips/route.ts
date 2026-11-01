export const runtime = "nodejs";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { sendInternalEmail } from "@/lib/resend";
import { fetchSocialClips, isFreshRelease, renderSocialClipsEmail, socialClipsSubject } from "@/lib/social-clips";

// Sundays 08:00 UTC (vercel.json): the next batch of clips, with captions and
// download links, so they can be queued in Buffer before Monday's post. The
// clips come from Saturday night's social-clips.yml run, which renders every
// third week; on the Sundays in between the latest release is weeks old and
// already emailed, so nothing is sent. A batch Saturday that failed to render
// leaves the stale release too, so that case is also silent here: the Friday
// audit's section and the Actions tab show it.
const RECIPIENT = process.env.AUDIT_EMAIL || "stephengaisford@gmail.com";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clips = await fetchSocialClips();
    if (clips.ok && !isFreshRelease(clips.data, new Date())) {
      return NextResponse.json({ ok: true, skipped: `latest release ${clips.data.week} was published ${clips.data.publishedAt}; not a batch Sunday` });
    }
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
