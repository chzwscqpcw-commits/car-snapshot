/**
 * "This week's clips": the latest `social-<ISO week>` GitHub release (made
 * by .github/workflows/social-clips.yml every Saturday night), read through
 * the public API with no token, so a missing release, a rate limit or a
 * network blip costs one line of the email and never the email itself. The
 * section goes out on its own on Sunday morning (/api/cron/social-clips, the
 * founder's cue to schedule the week in Buffer) and again inside the Friday
 * audit.
 *
 * Also the "Social" traffic line: visitors who arrived with
 * utm_source=tiktok|instagram|facebook, and what those sessions went on to do.
 */

export const SOCIAL_REPO = "chzwscqpcw-commits/car-snapshot";
export const SOCIAL_SOURCES = ["tiktok", "instagram", "facebook"] as const;
export type SocialSource = (typeof SOCIAL_SOURCES)[number];

export interface SocialClip {
  file: string;
  day: string;
  date: string;
  audience: string;
  topic: string;
  title: string;
  headline: string;
  caption: string;
  source: string;
  sourceDate: string;
  /** The poster PNG on the release, or null if the asset is missing. */
  still: string | null;
  /** The MP4 on the release, or null if the asset is missing. */
  download: string | null;
}

export interface SocialClipsData {
  week: string;
  monday: string;
  releaseUrl: string;
  publishedAt: string;
  schedule: string;
  clips: SocialClip[];
}

export type SocialClipsResult = { ok: true; data: SocialClipsData } | { ok: false; note: string };

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}
interface Release {
  tag_name: string;
  draft: boolean;
  html_url: string;
  published_at: string | null;
  created_at: string;
  assets: ReleaseAsset[];
}
interface CaptionsFile {
  week: string;
  monday: string;
  schedule: string;
  clips: Array<Omit<SocialClip, "still" | "download"> & { still: string }>;
}

export const SOCIAL_TAG = /^social-(\d{4}-W\d{2})$/;

type Fetch = typeof fetch;

/** The newest published `social-*` release, or null. */
export function latestSocialRelease(releases: Release[]): Release | null {
  const social = releases.filter((r) => !r.draft && SOCIAL_TAG.test(r.tag_name));
  social.sort((a, b) => (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at));
  return social[0] ?? null;
}

/** Join a release's assets to its captions.json. */
export function clipsFromRelease(release: Release, captions: CaptionsFile): SocialClipsData {
  const byName = new Map(release.assets.map((a) => [a.name, a.browser_download_url]));
  return {
    week: captions.week,
    monday: captions.monday,
    releaseUrl: release.html_url,
    publishedAt: (release.published_at ?? release.created_at).slice(0, 10),
    schedule: captions.schedule,
    clips: captions.clips.map((c) => ({
      file: c.file,
      day: c.day,
      date: c.date,
      audience: c.audience,
      topic: c.topic,
      title: c.title,
      headline: c.headline,
      caption: c.caption,
      source: c.source,
      sourceDate: c.sourceDate,
      still: byName.get(c.still) ?? null,
      download: byName.get(c.file) ?? null,
    })),
  };
}

/**
 * Fetch the latest clips. Two requests, 8 s each, no token. Any failure
 * returns `{ ok: false, note }` for the email to print as one line.
 */
export async function fetchSocialClips(fetchImpl: Fetch = fetch, repo = SOCIAL_REPO): Promise<SocialClipsResult> {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "freeplatecheck-weekly-audit" };
  try {
    const res = await fetchImpl(`https://api.github.com/repos/${repo}/releases?per_page=20`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, note: `GitHub releases API answered ${res.status}` };
    const release = latestSocialRelease((await res.json()) as Release[]);
    if (!release) return { ok: false, note: "no social-<week> release published yet" };
    const captionsAsset = release.assets.find((a) => a.name === "captions.json");
    if (!captionsAsset) return { ok: false, note: `${release.tag_name} has no captions.json` };
    const cap = await fetchImpl(captionsAsset.browser_download_url, { signal: AbortSignal.timeout(8000) });
    if (!cap.ok) return { ok: false, note: `captions.json on ${release.tag_name} answered ${cap.status}` };
    return { ok: true, data: clipsFromRelease(release, (await cap.json()) as CaptionsFile) };
  } catch (err) {
    return { ok: false, note: `clips unavailable (${err instanceof Error ? err.message : String(err)})` };
  }
}

// ─── Social traffic ─────────────────────────────────────────────────────────

export interface SocialTrafficWindow {
  /** Unique visitors (ip_hash) by utm_source, in SOCIAL_SOURCES order. */
  visitors: Record<SocialSource, number>;
  /** What those visitors' sessions went on to do, within the window. */
  resultsViews: number;
  carsSaved: number;
  partnerClicks: number;
}

export interface SocialTrafficAudit {
  cur: SocialTrafficWindow;
  prev: SocialTrafficWindow;
}

interface Row {
  metadata: Record<string, unknown> | null;
  ip_hash: string | null;
  created_at: string;
}

function isSocialSource(v: unknown): v is SocialSource {
  return typeof v === "string" && (SOCIAL_SOURCES as readonly string[]).includes(v);
}

/**
 * One window of the social line. `pageViews` are the window's page_view rows;
 * the other lists are the window's results_view / car_saved / partner_click
 * rows, counted when their ip_hash arrived from a social source in the window.
 */
export function socialTrafficWindow(pageViews: Row[], resultsViews: Row[], carsSaved: Row[], partnerClicks: Row[]): SocialTrafficWindow {
  const bySource: Record<SocialSource, Set<string>> = { tiktok: new Set(), instagram: new Set(), facebook: new Set() };
  const all = new Set<string>();
  for (const r of pageViews) {
    const src = r.metadata?.utm_source;
    if (!isSocialSource(src) || !r.ip_hash) continue;
    bySource[src].add(r.ip_hash);
    all.add(r.ip_hash);
  }
  const fromSocial = (rows: Row[]) => rows.filter((r) => r.ip_hash != null && all.has(r.ip_hash)).length;
  return {
    visitors: { tiktok: bySource.tiktok.size, instagram: bySource.instagram.size, facebook: bySource.facebook.size },
    resultsViews: fromSocial(resultsViews),
    carsSaved: fromSocial(carsSaved),
    partnerClicks: fromSocial(partnerClicks),
  };
}

// ─── HTML ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function n(x: number): string {
  return x.toLocaleString("en-GB");
}

/** The "Social" line for the traffic section. */
export function renderSocialTraffic(s: SocialTrafficAudit): string {
  const total = (w: SocialTrafficWindow) => SOCIAL_SOURCES.reduce((sum, k) => sum + w.visitors[k], 0);
  const sources = SOCIAL_SOURCES.map((k) => `${k} ${n(s.cur.visitors[k])}`).join(" · ");
  return `
  <p style="margin:0 0 20px;font-size:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px">
    <strong>Social:</strong> ${n(total(s.cur))} visitors tagged utm_source (${sources}; prior week ${n(total(s.prev))}) ·
    from those sessions: ${n(s.cur.resultsViews)} results views, ${n(s.cur.carsSaved)} cars saved, ${n(s.cur.partnerClicks)} partner clicks
    <span style="color:#94a3b8">(prior week ${n(s.prev.resultsViews)} / ${n(s.prev.carsSaved)} / ${n(s.prev.partnerClicks)})</span>.
    <span style="color:#94a3b8">Go/no-go after 8 weeks: 200 tagged visits a month.</span>
  </p>`;
}

/** The "This week's clips" section: stills, download links, copyable captions. */
export function renderSocialClips(r: SocialClipsResult): string {
  if (!r.ok) {
    return `
  <h3 style="margin:24px 0 6px;font-size:15px">This week's clips</h3>
  <p style="margin:0 0 20px;font-size:14px;color:#64748b">No clips to post this week: ${esc(r.note)}. The Thursday job is <code>.github/workflows/social-clips.yml</code> (run it by hand from Actions if it was skipped).</p>`;
  }
  const d = r.data;
  const cards = d.clips
    .map(
      (c) => `
    <table style="border-collapse:collapse;width:100%;margin:0 0 14px;border:1px solid #e2e8f0;border-radius:8px">
      <tr>
        <td style="width:120px;padding:10px;vertical-align:top">${
          c.still
            ? `<img src="${esc(c.still)}" width="108" height="192" alt="${esc(c.headline)}" style="display:block;width:108px;height:192px;border-radius:6px;background:#070b14">`
            : `<div style="width:108px;height:192px;border-radius:6px;background:#070b14"></div>`
        }</td>
        <td style="padding:10px 12px 10px 0;vertical-align:top;font-size:14px">
          <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#0e7490;margin:0 0 2px">${esc(c.day)} · ${esc(c.audience)}</div>
          <div style="font-weight:700;margin:0 0 6px">${esc(c.title)}</div>
          <div style="margin:0 0 8px">${
            c.download ? `<a href="${esc(c.download)}" style="color:#0e7490;font-weight:600">Download ${esc(c.file)}</a>` : `<span style="color:#94a3b8">MP4 missing from the release</span>`
          }</div>
          <pre style="margin:0;padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;line-height:1.45;white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${esc(c.caption)}</pre>
          <div style="margin:6px 0 0;font-size:11px;color:#94a3b8">${esc(c.source)} · ${esc(c.sourceDate)}</div>
        </td>
      </tr>
    </table>`,
    )
    .join("");
  return `
  <h3 style="margin:24px 0 6px;font-size:15px">This week's clips <span style="color:#94a3b8;font-weight:400">(${esc(d.week)}, from Monday ${esc(d.monday)})</span></h3>
  <p style="margin:0 0 10px;font-size:14px">Ten minutes: download the three MP4s, upload each to Buffer, schedule <strong>Monday</strong> (brand), <strong>Wednesday</strong> (sellers), <strong>Friday</strong> (MOT) at about 18:00; TikTok first, cross-posted to Reels and Facebook Reels. Paste the caption as it is. <a href="${esc(d.releaseUrl)}" style="color:#0e7490">All files on the release</a> (published ${esc(d.publishedAt)}).</p>
  ${cards}`;
}

/** Subject of the Sunday email. */
export function socialClipsSubject(r: SocialClipsResult): string {
  if (!r.ok) return "FPC clips: none this week";
  const d = r.data;
  return `FPC clips for the week of ${d.monday}: ${d.clips.map((c) => c.title).join(" · ")}`;
}

/** The Sunday email: the clips section in the audit's frame, nothing else. */
export function renderSocialClipsEmail(r: SocialClipsResult): string {
  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;line-height:1.5">
  <h2 style="margin:0 0 2px">Free Plate Check — this week's clips</h2>
  <p style="color:#64748b;margin:0 0 8px;font-size:14px">Rendered Saturday night from the site's data. Schedule them in Buffer today; the routine is in docs/social-pipeline.md.</p>
  ${renderSocialClips(r)}
  <p style="color:#94a3b8;font-size:12px;margin:28px 0 0;border-top:1px solid #e2e8f0;padding-top:12px">Sent Sundays 08:00 UTC by /api/cron/social-clips · the Friday audit carries the same section and the Social traffic line.</p>
</div>`;
}
