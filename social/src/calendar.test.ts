/**
 * Pins the calendar and the pickers:
 *   - a week's plan is the same every time it is built;
 *   - no topic repeats in consecutive weeks, and no subject repeats for a year;
 *   - every curated subject exists in the data it is read from;
 *   - captions carry no registration-shaped token and no partner name.
 * Run: npm test (in social/).
 */
import assert from "node:assert/strict";
import { isoWeekOf, nextWeek as next, parseWeekLabel, planWeek, weekLabel } from "./calendar";
import { captionsFile } from "./captions";
import { buildWeek } from "./plan";
import { HOW_MANY_LEFT_MODELS, pickHowManyLeft } from "./pickers/brand";
import { FAIL_SUBJECTS, pickFailReasons } from "./pickers/mot";
import { WORTH_AFTER_MODELS, pickWorthAfter } from "./pickers/sellers";

// Every curated subject exists in the data it is read from (the pickers throw otherwise).
HOW_MANY_LEFT_MODELS.forEach((_, i) => pickHowManyLeft(i, 0, false));
FAIL_SUBJECTS.forEach((_, i) => pickFailReasons(i, 0, false));
WORTH_AFTER_MODELS.forEach((_, i) => pickWorthAfter(i, 0, false));

// ISO week arithmetic
assert.equal(weekLabel(isoWeekOf(new Date("2026-11-01T12:00:00Z"))), "2026-W44");
assert.equal(weekLabel(isoWeekOf(new Date("2027-01-01T12:00:00Z"))), "2026-W53");
assert.equal(weekLabel(isoWeekOf(new Date("2026-12-28T12:00:00Z"))), "2026-W53");
assert.equal(planWeek(parseWeekLabel("2026-W46")).monday, "2026-11-09");
assert.equal(weekLabel(next(parseWeekLabel("2026-W53"))), "2027-W01");

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
