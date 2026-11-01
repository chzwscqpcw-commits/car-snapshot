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
  expectedBatch,
  fetchSocialClips,
  fetchSocialRun,
  isFreshRelease,
  latestSocialRelease,
  missedBatchSubject,
  renderMissedBatchEmail,
  renderSocialClips,
  renderSocialClipsEmail,
  renderSocialRun,
  renderSocialTraffic,
  runFailed,
  type SocialRunResult,
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
  weeks: ["2026-W46", "2026-W47"],
  monday: "2026-11-09",
  schedule: "Buffer: Monday (brand), Wednesday (sellers), Friday (MOT).",
  clips: [
    { week: "2026-W46", file: "2026-W46-1-brand.mp4", still: "2026-W46-1-brand.png", day: "Monday", date: "2026-11-09", audience: "brand", topic: "theft", title: "The most stolen cars per 1,000", headline: "The most stolen cars in the UK", caption: "Lexus NX 21.5 <per 1,000> & more\n\n#cartheft", source: "DVLA FOI", sourceDate: "2025" },
    { week: "2026-W46", file: "2026-W46-2-sellers.mp4", still: "2026-W46-2-sellers.png", day: "Wednesday", date: "2026-11-11", audience: "sellers", topic: "value-table", title: "Cars that hold their value best", headline: "The cars that hold their value best", caption: "MINI Countryman 46%", source: "model", sourceDate: "2026-10-19" },
    { week: "2026-W47", file: "2026-W47-1-brand.mp4", still: "2026-W47-1-brand.png", day: "Monday", date: "2026-11-16", audience: "brand", topic: "colours", title: "Britain's favourite car colours", headline: "Britain's favourite car colours", caption: "Grey 27.6%", source: "SMMT", sourceDate: "2025" },
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
check("week, weeks and release url carried over", data.week === "2026-W46" && data.weeks.join() === "2026-W46,2026-W47" && data.releaseUrl === release.html_url && data.publishedAt === "2026-11-05");
check("each clip keeps its week", data.clips.map((c) => c.week).join() === "2026-W46,2026-W46,2026-W47");
const single = clipsFromRelease(release, { ...captions, weeks: undefined, clips: captions.clips.slice(0, 2).map(({ week: _w, ...c }) => c) });
check("a single-week file from before batches still parses", single.weeks.join() === "2026-W46" && single.clips.every((c) => c.week === "2026-W46"));
check("still and download resolve to the release assets", data.clips[0].still?.endsWith("1-brand.png") === true && data.clips[0].download?.endsWith("1-brand.mp4") === true);
check("a missing asset is null, not a broken link", data.clips[1].still === null && data.clips[1].download === null);

console.log("html");
const html = renderSocialClips({ ok: true, data });
check("lists every clip with its day, audience and title", html.includes("Monday · brand") && html.includes("Wednesday · sellers") && html.includes("Cars that hold their value best") && html.includes("Britain's favourite car colours"));
check("clips are grouped under their week's Monday", /Week of 2026-11-09.*Week of 2026-11-16/s.test(html) && html.indexOf("Cars that hold their value best") < html.indexOf("Week of 2026-11-16"));
check("the heading spans the batch", html.includes("2026-W46 to 2026-W47") && html.includes("3 clips"));
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
check("fetches the release list and captions.json", good.ok && good.data.clips.length === 3 && good.data.week === "2026-W46");
const rateLimited = await fetchSocialClips((async () => mk(403, {})) as unknown as typeof fetch, "x/y");
check("403 → ok:false with the status", !rateLimited.ok && rateLimited.note.includes("403"));
const noRelease = await fetchSocialClips((async () => mk(200, [])) as unknown as typeof fetch, "x/y");
check("no social release → ok:false with a plain note", !noRelease.ok && /no social-<week> release/.test(noRelease.note));
const byTag = await fetchSocialClips(fetchOk, "x/y", "social-2026-W46");
check("a tag asks for that batch's release", byTag.ok && byTag.data.week === "2026-W46");
const wrongTag = await fetchSocialClips(fetchOk, "x/y", "social-2026-W48");
check("an older release is not the batch a Sunday waits for", !wrongTag.ok && wrongTag.note === "no social-2026-W48 release published");
const network = await fetchSocialClips((async () => { throw new Error("ENOTFOUND api.github.com"); }) as unknown as typeof fetch, "x/y");
check("a thrown fetch → ok:false, never a throw", !network.ok && network.note.includes("ENOTFOUND"));
}

console.log("sunday email");
check("a batch subject counts the clips and weeks", socialClipsSubject({ ok: true, data }) === "FPC clips: 3 to queue for 2 weeks from 2026-11-09");
check("a single-week subject names the titles", socialClipsSubject({ ok: true, data: single }) === "FPC clips for the week of 2026-11-09: The most stolen cars per 1,000 · Cars that hold their value best");
check("a release from last night is fresh, one from three weeks ago is not", isFreshRelease(data, new Date("2026-11-08T08:00:00Z")) && !isFreshRelease(data, new Date("2026-11-29T08:00:00Z")));
check("subject when there is nothing to post", socialClipsSubject({ ok: false, note: "x" }) === "FPC clips: none this week");
const mail = renderSocialClipsEmail({ ok: true, data });
check("the email wraps the same section and says when it is sent", mail.includes("the next clips") && mail.includes("Download 2026-W46-1-brand.mp4") && mail.includes("every third week"));

console.log("social traffic");
const row = (utm: string | undefined, ip: string | null, t = "2026-11-10T10:00:00Z") => ({ metadata: utm ? { utm_source: utm, path: "/" } : { path: "/" }, ip_hash: ip, created_at: t });
const pv = [row("tiktok", "a"), row("tiktok", "a"), row("tiktok", "b"), row("instagram", "c"), row("google", "d"), row(undefined, "e"), row("facebook", null)];
const plain = (ip: string | null) => ({ metadata: {}, ip_hash: ip, created_at: "2026-11-10T11:00:00Z" });
const w = socialTrafficWindow(pv, [plain("a"), plain("a"), plain("d")], [plain("c")], [plain("b"), plain("e"), plain(null)]);
check("visitors are unique per source and need an ip_hash", w.visitors.tiktok === 2 && w.visitors.instagram === 1 && w.visitors.facebook === 0, w.visitors);
check("downstream events count only social sessions", w.resultsViews === 2 && w.carsSaved === 1 && w.partnerClicks === 1, w);
const line = renderSocialTraffic({ cur: w, prev: socialTrafficWindow([], [], [], []) });
check("the line names each source and the funnel", line.includes("tiktok 2") && line.includes("instagram 1") && line.includes("2 results views") && line.includes("1 cars saved") && line.includes("1 partner clicks"));

async function batchChecks() {
console.log("which Sunday matters");
const sunday = (iso: string) => expectedBatch(new Date(`${iso}T08:00:00Z`));
check("22 Nov 2026 waits for W48–W50", sunday("2026-11-22")?.tag === "social-2026-W48" && sunday("2026-11-22")?.weeks.join() === "2026-W48,2026-W49,2026-W50");
check("29 Nov and 6 Dec wait for nothing (between batches)", sunday("2026-11-29") === null && sunday("2026-12-06") === null);
check("13 Dec waits for W51–W53", sunday("2026-12-13")?.tag === "social-2026-W51" && sunday("2026-12-13")?.weeks.join() === "2026-W51,2026-W52,2026-W53");
check("20 and 27 Dec: nothing", sunday("2026-12-20") === null && sunday("2026-12-27") === null);
check("3 Jan 2027 (a Sunday inside 2026-W53) waits for 2027-W01", sunday("2027-01-03")?.tag === "social-2027-W01" && sunday("2027-01-03")?.weeks.join() === "2027-W01,2027-W02,2027-W03");
check("the next one is 24 Jan 2027 (2027-W04)", sunday("2027-01-10") === null && sunday("2027-01-17") === null && sunday("2027-01-24")?.tag === "social-2027-W04");
check("the first batch was the Sunday before 2 Nov, and the weeks after it are quiet", sunday("2026-11-01")?.tag === "social-2026-W45" && sunday("2026-11-08") === null && sunday("2026-11-15") === null);

console.log("a batch that did not render");
const batch = sunday("2026-11-22")!;
const failedRun: SocialRunResult = { ok: true, run: { conclusion: "failure", status: "completed", createdAt: "2026-11-21T22:00:12Z", url: "https://github.com/x/y/actions/runs/44663894594" } };
const miss = renderMissedBatchEmail(batch, "no social-2026-W48 release published", failedRun);
check("subject names the batch", missedBatchSubject(batch) === "FPC clips did not render: the batch from 2026-W48");
check("says what is missing: the release, the weeks, why", miss.includes("social-2026-W48") && miss.includes("2026-W48 to 2026-W50") && miss.includes("no social-2026-W48 release published"));
check("links the failed run and the workflow, and says how to re-run", miss.includes("runs/44663894594") && miss.includes("failure") && miss.includes("actions/workflows/social-clips.yml") && miss.includes("Run workflow") && miss.includes("<code>2026-W48</code>"));
check("is short: no clip cards", !miss.includes("<pre") && !miss.includes("<img"));
check("still says something when the runs API is down", renderMissedBatchEmail(batch, "x", { ok: false, note: "GitHub runs API answered 403" }).includes("GitHub runs API answered 403"));

console.log("the workflow's latest run");
const okRun: SocialRunResult = { ok: true, run: { conclusion: "success", status: "completed", createdAt: "2026-11-28T22:00:05Z", url: "https://github.com/x/y/actions/runs/2" } };
const running: SocialRunResult = { ok: true, run: { conclusion: null, status: "in_progress", createdAt: "2026-11-21T22:00:05Z", url: "https://github.com/x/y/actions/runs/3" } };
check("failure is flagged, success and in-progress are not", runFailed(failedRun) && !runFailed(okRun) && !runFailed(running) && !runFailed({ ok: false, note: "x" }) && !runFailed({ ok: true, run: null }));
check("a failed run shows red in the Friday line, with the link", renderSocialRun(failedRun).includes("Clip render FAILED") && renderSocialRun(failedRun).includes("runs/44663894594") && renderSocialRun(failedRun).includes("#b91c1c"));
check("a passing run says so, quietly", renderSocialRun(okRun).includes("passed") && !renderSocialRun(okRun).includes("FAILED"));
check("a run in progress and a missing history say so", renderSocialRun(running).includes("still in progress") && renderSocialRun({ ok: true, run: null }).includes("has not run yet"));
check("an unreadable API says it could not check", renderSocialRun({ ok: false, note: "GitHub runs API answered 403" }).includes("could not check"));
const mkRuns = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body }) as unknown as Response;
const runsFetch = (async (url: string | URL | Request) => {
  check("asks for the Social Clips workflow's runs", String(url).includes("/actions/workflows/social-clips.yml/runs"));
  return mkRuns(200, { workflow_runs: [{ status: "completed", conclusion: "success", created_at: "2026-11-14T22:00:00Z", html_url: "https://x/old" }, { status: "completed", conclusion: "failure", created_at: "2026-11-21T22:00:00Z", html_url: "https://x/new" }] });
}) as unknown as typeof fetch;
const latest = await fetchSocialRun(runsFetch, "x/y");
check("the latest run by date wins", latest.ok && latest.run?.url === "https://x/new" && runFailed(latest));
check("a 403 or a thrown fetch fails soft", !(await fetchSocialRun((async () => mkRuns(403, {})) as unknown as typeof fetch, "x/y")).ok && !(await fetchSocialRun((async () => { throw new Error("boom"); }) as unknown as typeof fetch, "x/y")).ok);
}

fetchChecks().then(batchChecks).then(() => {
  if (failed > 0) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nsocial clips: all checks passed");
});
