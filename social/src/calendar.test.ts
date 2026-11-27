/**
 * Pins the calendar and the pickers:
 *   - a week's plan is the same every time it is built;
 *   - no topic repeats in consecutive weeks, and no subject repeats for a year;
 *   - every curated subject exists in the data it is read from;
 *   - captions carry no registration-shaped token and no partner name.
 * Run: npm test (in social/).
 */
import assert from "node:assert/strict";
import { batchWeeks, isBatchStart, isoWeekOf, isoWeekMonday, nextWeek as next, parseWeekLabel, planWeek, upcomingWeek, weekDiff, weekLabel, weeksInYear } from "./calendar";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { captionsFile } from "./captions";
import { outBase } from "./outdir";
import { buildWeek } from "./plan";
import { HOW_MANY_LEFT_MODELS, pickHowManyLeft } from "./pickers/brand";
import { FAIL_SUBJECTS, pickFailReasons } from "./pickers/mot";
import { WORTH_AFTER_MODELS, curveFalls, pickWorthAfter, worthAfterSubjects } from "./pickers/sellers";

// Every curated subject exists in the data it is read from (the pickers throw otherwise).
HOW_MANY_LEFT_MODELS.forEach((_, i) => pickHowManyLeft(i, 0, false));
FAIL_SUBJECTS.forEach((_, i) => pickFailReasons(i, 0, false));
WORTH_AFTER_MODELS.forEach((_, i) => pickWorthAfter(i, 0, false));
// A worth-after clip never shows an older car worth more than a younger one
// (Corsa, Clio, Juke, Leon and Sandero did in Nov 2026; they are skipped).
const subjects = worthAfterSubjects();
assert.ok(subjects.length >= 25 && subjects.length < WORTH_AFTER_MODELS.length, "the subject list keeps most families and drops the rising ones");
assert.ok(!subjects.includes("VAUXHALL|CORSA"), "a family whose curve rises is not a subject");
for (let i = 0; i < subjects.length; i++) {
  const { newPrice, points } = pickWorthAfter(i, 0, false).props;
  assert.ok(curveFalls({ newPrice, points }), `worth-after #${i}: the curve must fall with age`);
}
assert.ok(subjects.indexOf("FORD|FIESTA") === 1 && subjects.indexOf("VOLKSWAGEN|GOLF") === 0, "the families already posted keep their places");

// ISO week arithmetic
assert.equal(weekLabel(isoWeekOf(new Date("2026-11-01T12:00:00Z"))), "2026-W44");
assert.equal(weekLabel(isoWeekOf(new Date("2027-01-01T12:00:00Z"))), "2026-W53");
assert.equal(weekLabel(isoWeekOf(new Date("2026-12-28T12:00:00Z"))), "2026-W53");
assert.equal(planWeek(parseWeekLabel("2026-W46")).monday, "2026-11-09");
assert.equal(weekLabel(next(parseWeekLabel("2026-W53"))), "2027-W01");

// Batches: three weeks from the series start, then every third week
assert.ok(isBatchStart(parseWeekLabel("2026-W45")) && !isBatchStart(parseWeekLabel("2026-W46")) && !isBatchStart(parseWeekLabel("2026-W47")) && isBatchStart(parseWeekLabel("2026-W48")));
assert.deepEqual(batchWeeks(parseWeekLabel("2026-W52")).map(weekLabel), ["2026-W52", "2026-W53", "2027-W01"]);
const batch = captionsFile(batchWeeks(parseWeekLabel("2026-W48")).map((w) => buildWeek(w, false)));
assert.deepEqual(batch.weeks, ["2026-W48", "2026-W49", "2026-W50"]);
assert.equal(batch.week, "2026-W48");
assert.equal(batch.clips.length, 9);
assert.equal(batch.clips[3].week, "2026-W49");
assert.ok(batch.clips.every((c) => c.file.startsWith(c.week) && c.utm.tiktok.includes(`utm_campaign=${c.week}`)));

// The turn of the year. 2026 has 53 ISO weeks, so the batches are
// W45–W47, W48–W50, W51–W53, then 2027-W01–W03.
assert.equal(weeksInYear(2026), 53);
assert.equal(weeksInYear(2027), 52);
assert.throws(() => parseWeekLabel("2027-W53"), /2027 has 52 ISO weeks/);
assert.equal(parseWeekLabel("2026-W53").week, 53);
assert.equal(isoWeekMonday(parseWeekLabel("2026-W53")).toISOString().slice(0, 10), "2026-12-28");
assert.equal(isoWeekMonday(parseWeekLabel("2027-W01")).toISOString().slice(0, 10), "2027-01-04");
assert.equal(weekDiff(parseWeekLabel("2026-W45"), parseWeekLabel("2027-W01")), 9);
const starts = ["2026-W45", "2026-W48", "2026-W51", "2027-W01", "2027-W04"];
for (const l of starts) assert.ok(isBatchStart(parseWeekLabel(l)), `${l} opens a batch`);
for (const l of ["2026-W46", "2026-W47", "2026-W52", "2026-W53", "2027-W02", "2027-W03"]) assert.ok(!isBatchStart(parseWeekLabel(l)), `${l} does not`);
assert.deepEqual(batchWeeks(parseWeekLabel("2026-W51")).map(weekLabel), ["2026-W51", "2026-W52", "2026-W53"]);
assert.deepEqual(batchWeeks(parseWeekLabel("2027-W01")).map(weekLabel), ["2027-W01", "2027-W02", "2027-W03"]);
// Which batch a Saturday render or a Sunday email is waiting for: the week that starts the next Monday.
const saturday = (iso: string) => weekLabel(upcomingWeek(new Date(`${iso}T22:00:00Z`)));
assert.equal(saturday("2026-11-21"), "2026-W48");
assert.equal(saturday("2026-12-12"), "2026-W51");
assert.equal(saturday("2026-12-19"), "2026-W52");
assert.equal(saturday("2026-12-26"), "2026-W53");
assert.equal(saturday("2027-01-02"), "2027-W01", "the Saturday inside 2026-W53 looks ahead into the new year");
assert.equal(saturday("2027-01-23"), "2027-W04");
// Release tags are social-<first week of the batch>, and the files carry their own week.
const boundary = captionsFile(batchWeeks(parseWeekLabel("2026-W51")).map((w) => buildWeek(w, false)));
assert.equal(`social-${boundary.week}`, "social-2026-W51");
assert.deepEqual(boundary.weeks, ["2026-W51", "2026-W52", "2026-W53"]);
const newYear = captionsFile(batchWeeks(parseWeekLabel("2027-W01")).map((w) => buildWeek(w, false)));
assert.equal(`social-${newYear.week}`, "social-2027-W01");
assert.equal(newYear.clips[0].file, "2027-W01-1-brand.mp4");
assert.equal(newYear.clips[0].date, "2027-01-04");
assert.equal(boundary.clips[6].date, "2026-12-28", "Monday of W53");
assert.equal(boundary.clips[8].date, "2027-01-01", "Friday of W53 is in the next calendar year");
// A batch that straddles the boundary: topics keep rotating, no week is skipped or doubled.
const straddle = captionsFile(batchWeeks(parseWeekLabel("2026-W52")).map((w) => buildWeek(w, false)));
assert.deepEqual(straddle.weeks, ["2026-W52", "2026-W53", "2027-W01"]);
assert.equal(new Set(straddle.clips.map((c) => c.file)).size, 9);
// `npm run social:plan` across the boundary
const plan = execFileSync("npx", ["tsx", "src/cli/plan.ts", "--week", "2026-W51", "--weeks", "6"], { cwd: path.resolve(__dirname, ".."), encoding: "utf8" });
assert.deepEqual(plan.trim().split("\n").map((l) => l.split(" ")[0]), ["2026-W51", "2026-W52", "2026-W53", "2027-W01", "2027-W02", "2027-W03"]);

// --out: the workflow passes `social/out/current` from the repo root, through
// `npm --prefix social` (which runs in social/). It must land in <root>/social/out/current,
// where the next step reads it, not in social/social/out/current (the bug behind
// three failed Saturday renders, 6 to 20 Nov 2026).
assert.equal(path.resolve(outBase({ INIT_CWD: "/repo" } as NodeJS.ProcessEnv, "/repo/social"), "social/out/current"), "/repo/social/out/current");
assert.equal(path.resolve(outBase({} as NodeJS.ProcessEnv, "/repo/social"), "out/x"), "/repo/social/out/x", "no INIT_CWD (node run directly): the current directory");
assert.equal(path.resolve(outBase({ INIT_CWD: "/repo" } as NodeJS.ProcessEnv), "/abs/out"), "/abs/out", "an absolute --out is left alone");

// Determinism
const a = JSON.stringify(captionsFile(buildWeek(parseWeekLabel("2026-W45"))));
const b = JSON.stringify(captionsFile(buildWeek(parseWeekLabel("2026-W45"))));
assert.equal(buildWeek(parseWeekLabel("2026-W45")).plan.monday, "2026-11-02", "the series starts on Monday 2 November 2026");
assert.equal(a, b, "the same week must build the same captions");

// Rotation over 60 weeks: no consecutive-week topic repeats, no repeated subject within a topic
const PLATE = /\b[A-Z]{2}\d{2}\s?[A-Z]{3}\b|\b[A-Z]\d{1,3}\s?[A-Z]{3}\b/;
const SAMPLE_PLATES = /\b(AB19 CDE|CD21 EFG|GH17 JKL|MN15 PQR|ST20 UVW|XY14 ZAB|C123 XYZ)\b/;
const PARTNERS = /carvertical|webuyanycar|wbac|bookmygarage|clickmechanic|warrantywise|fixter|awin|everflow/i;
let w = parseWeekLabel("2026-W45");
let prev: string[] = [];
const titlesByTopic = new Map<string, string[]>();
let seasonWeeks = 0;
for (let i = 0; i < 60; i++) {
  const build = buildWeek(w, false);
  const topics = build.clips.map((c) => c.slot.topic);
  for (let k = 0; k < 3; k++) {
    const t = topics[k];
    if (t !== "season-due") assert.notEqual(t, prev[k], `${weekLabel(w)}: topic ${t} repeats the previous week`);
    const list = titlesByTopic.get(t) ?? [];
    list.push(build.clips[k].picked.title);
    titlesByTopic.set(t, list);
    if (t === "season-due") seasonWeeks++;
  }
  prev = topics;
  const captions = captionsFile(build);
  for (const c of captions.clips) {
    const text = `${c.title} ${c.headline} ${c.caption}`;
    assert.ok(!PLATE.test(text.replace(SAMPLE_PLATES, "")), `${c.file}: a registration-shaped token in the caption: ${text}`);
    assert.ok(!PARTNERS.test(text), `${c.file}: a partner is named in the caption`);
    assert.ok(c.caption.length <= 2200, `${c.file}: caption over TikTok's 2,200 characters`);
    const tags = c.caption.match(/#\w+/g) ?? [];
    assert.ok(tags.length >= 3 && tags.length <= 5, `${c.file}: ${tags.length} hashtags (Instagram allows 5)`);
    assert.ok(c.utm.tiktok.includes("utm_source=tiktok") && c.utm.tiktok.includes(`utm_campaign=${captions.week}`));
    assert.ok(c.headline.length <= 60, `${c.file}: headline too long for the top third: "${c.headline}"`);
  }
  w = next(w);
}
assert.ok(seasonWeeks >= 2, "March and September weeks should get the seasonal MOT clip");

// Each topic walks its whole list of subjects before any repeats: the first
// `distinct` titles of a topic are all different.
for (const [topic, titles] of titlesByTopic) {
  if (topic === "season-due") continue; // the same clip in March and in September, by design
  const distinct = new Set(titles).size;
  const first = titles.slice(0, distinct);
  assert.equal(new Set(first).size, distinct, `${topic} repeats a subject before its list is exhausted: ${first.join(" / ")}`);
  const minDistinct = ["season-due", "wrong-turn", "used-price-trend"].includes(topic) ? 1 : ["value-table", "colours"].includes(topic) ? 2 : 3;
  assert.ok(distinct >= minDistinct, `${topic} has only ${distinct} distinct clips in 60 weeks`);
}

// A week in early March gets the seasonal clip
const march = buildWeek(parseWeekLabel("2027-W10"), false);
assert.equal(march.clips[2].slot.topic, "season-due");
assert.ok(march.clips[2].picked.title.includes("March"));

console.log("calendar + pickers: ok (60 weeks checked)");
