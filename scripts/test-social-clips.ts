/**
 * The social line and "This week's clips" section of the Friday audit
 * (src/lib/social-clips.ts): the release is parsed from fixtures, the HTML
 * carries the stills, downloads and captions, every failure fails soft to one
 * line, and the utm_source aggregation counts sessions the way the email says.
 *
 *   npx tsx scripts/test-social-clips.ts
 */
import {
  clipsFromRelease,
  fetchSocialClips,
  latestSocialRelease,
  renderSocialClips,
  renderSocialClipsEmail,
  renderSocialTraffic,
  socialClipsSubject,
  socialTrafficWindow,
} from "../src/lib/social-clips";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok || detail === undefined ? "" : ` — ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

const asset = (name: string) => ({ name, browser_download_url: `https://github.com/x/y/releases/download/social-2026-W46/${name}` });
const release = {
  tag_name: "social-2026-W46",
  draft: false,
  html_url: "https://github.com/x/y/releases/tag/social-2026-W46",
  published_at: "2026-11-05T22:09:00Z",
  created_at: "2026-11-05T22:08:00Z",
  // The sellers clip's assets are missing on purpose: the email must say so, not 404.
  assets: [asset("2026-W46-1-brand.mp4"), asset("2026-W46-1-brand.png"), asset("captions.json")],
};
const captions = {
  week: "2026-W46",
  monday: "2026-11-09",
  schedule: "Buffer: Monday (brand), Wednesday (sellers), Friday (MOT).",
  clips: [
    { file: "2026-W46-1-brand.mp4", still: "2026-W46-1-brand.png", day: "Monday", date: "2026-11-09", audience: "brand", topic: "theft", title: "The most stolen cars per 1,000", headline: "The most stolen cars in the UK", caption: "Lexus NX 21.5 <per 1,000> & more\n\n#cartheft", source: "DVLA FOI", sourceDate: "2025" },
    { file: "2026-W46-2-sellers.mp4", still: "2026-W46-2-sellers.png", day: "Wednesday", date: "2026-11-11", audience: "sellers", topic: "value-table", title: "Cars that hold their value best", headline: "The cars that hold their value best", caption: "MINI Countryman 46%", source: "model", sourceDate: "2026-10-19" },
  ],
};

console.log("release selection");
check("picks the newest published social-* release, skipping drafts and other tags", latestSocialRelease([
  { ...release, tag_name: "v1.0", published_at: "2026-12-01T00:00:00Z" },
  { ...release, tag_name: "social-2026-W47", draft: true, published_at: "2026-11-12T22:00:00Z" },
  { ...release, tag_name: "social-2026-W45", published_at: "2026-10-29T22:00:00Z" },
  release,
])?.tag_name === "social-2026-W46");
check("no release → null", latestSocialRelease([{ ...release, tag_name: "data-refresh" }]) === null);

console.log("joining assets to captions");
const data = clipsFromRelease(release, captions);
check("week and release url carried over", data.week === "2026-W46" && data.releaseUrl === release.html_url && data.publishedAt === "2026-11-05");
check("still and download resolve to the release assets", data.clips[0].still?.endsWith("1-brand.png") === true && data.clips[0].download?.endsWith("1-brand.mp4") === true);
check("a missing asset is null, not a broken link", data.clips[1].still === null && data.clips[1].download === null);

console.log("html");
const html = renderSocialClips({ ok: true, data });
check("lists every clip with its day, audience and title", html.includes("Monday · brand") && html.includes("Wednesday · sellers") && html.includes("Cars that hold their value best"));
check("the still is an img, the download a link", html.includes('<img src="https://github.com/x/y/releases/download/social-2026-W46/2026-W46-1-brand.png"') && html.includes('href="https://github.com/x/y/releases/download/social-2026-W46/2026-W46-1-brand.mp4"'));
check("the caption is in a copyable block, escaped", html.includes("<pre") && html.includes("&lt;per 1,000&gt; &amp; more") && !html.includes("<per 1,000>"));
check("the Buffer schedule reminder is there", /Monday<\/strong> \(brand\).*Wednesday<\/strong> \(sellers\).*Friday<\/strong> \(MOT\)/s.test(html));
check("a missing MP4 is said, not linked", html.includes("MP4 missing from the release"));
const soft = renderSocialClips({ ok: false, note: "GitHub releases API answered 403" });
check("failure renders one note and the workflow's name", soft.includes("GitHub releases API answered 403") && soft.includes("social-clips.yml") && !soft.includes("<pre"));

async function fetchChecks() {
console.log("fetch, failing soft");
const mk = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body }) as unknown as Response;
const fetchOk = (async (url: string | URL | Request) => {
  const u = String(url);
  if (u.includes("/releases?")) return mk(200, [release]);
  if (u.endsWith("captions.json")) return mk(200, captions);
  return mk(404, {});
}) as unknown as typeof fetch;
const good = await fetchSocialClips(fetchOk, "x/y");
check("fetches the release list and captions.json", good.ok && good.data.clips.length === 2 && good.data.week === "2026-W46");
const rateLimited = await fetchSocialClips((async () => mk(403, {})) as unknown as typeof fetch, "x/y");
check("403 → ok:false with the status", !rateLimited.ok && rateLimited.note.includes("403"));
const noRelease = await fetchSocialClips((async () => mk(200, [])) as unknown as typeof fetch, "x/y");
check("no social release → ok:false with a plain note", !noRelease.ok && /no social-<week> release/.test(noRelease.note));
const network = await fetchSocialClips((async () => { throw new Error("ENOTFOUND api.github.com"); }) as unknown as typeof fetch, "x/y");
check("a thrown fetch → ok:false, never a throw", !network.ok && network.note.includes("ENOTFOUND"));
}

console.log("sunday email");
check("subject names the Monday and the three titles", socialClipsSubject({ ok: true, data }) === "FPC clips for the week of 2026-11-09: The most stolen cars per 1,000 · Cars that hold their value best");
check("subject when there is nothing to post", socialClipsSubject({ ok: false, note: "x" }) === "FPC clips: none this week");
const mail = renderSocialClipsEmail({ ok: true, data });
check("the email wraps the same section and says when it was sent", mail.includes("this week's clips") && mail.includes("Download 2026-W46-1-brand.mp4") && mail.includes("Sundays 08:00 UTC"));

console.log("social traffic");
const row = (utm: string | undefined, ip: string | null, t = "2026-11-10T10:00:00Z") => ({ metadata: utm ? { utm_source: utm, path: "/" } : { path: "/" }, ip_hash: ip, created_at: t });
const pv = [row("tiktok", "a"), row("tiktok", "a"), row("tiktok", "b"), row("instagram", "c"), row("google", "d"), row(undefined, "e"), row("facebook", null)];
const plain = (ip: string | null) => ({ metadata: {}, ip_hash: ip, created_at: "2026-11-10T11:00:00Z" });
const w = socialTrafficWindow(pv, [plain("a"), plain("a"), plain("d")], [plain("c")], [plain("b"), plain("e"), plain(null)]);
check("visitors are unique per source and need an ip_hash", w.visitors.tiktok === 2 && w.visitors.instagram === 1 && w.visitors.facebook === 0, w.visitors);
check("downstream events count only social sessions", w.resultsViews === 2 && w.carsSaved === 1 && w.partnerClicks === 1, w);
const line = renderSocialTraffic({ cur: w, prev: socialTrafficWindow([], [], [], []) });
check("the line names each source and the funnel", line.includes("tiktok 2") && line.includes("instagram 1") && line.includes("2 results views") && line.includes("1 cars saved") && line.includes("1 partner clicks"));

fetchChecks().then(() => {
  if (failed > 0) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nsocial clips: all checks passed");
});
