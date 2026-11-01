/**
 * The weekly calendar: which three clips a given ISO week gets.
 *
 * Everything here is a pure function of the week, so re-rendering
 * "2026-W46" months later gives the same three clips, and the Thursday job
 * and a local `npm run social:render -- --week 2026-W46` agree.
 *
 * Rotation. Each audience has a list of topics; the topic for a week is
 * chosen by the number of weeks since the first week of the series, so
 * consecutive weeks never share a topic. Inside a topic, the subject (a
 * model, a postcode area, a ranking) comes from the topic's own occurrence
 * count, replayed from the first week — so "how many left" walks its list of
 * models one per appearance and repeats nothing until the list is exhausted
 * (the lists are long enough for well over a year of weeks).
 *
 * The MOT slot has a seasonal override: in the first weeks of March and
 * September, the registration waves, the clip is "your MOT may be due".
 */

export type Audience = "brand" | "sellers" | "mot";

export type BrandTopic = "theft" | "how-many-left" | "colours" | "registrations" | "wrong-turn";
export type SellersTopic = "value-table" | "worth-after" | "used-price-trend";
export type MotTopic = "fail-reasons" | "pass-by-area" | "pass-by-model" | "season-due";
export type Topic = BrandTopic | SellersTopic | MotTopic;

/** The first week of the series. Week counts and rotations start here. */
export const SERIES_START = { year: 2026, week: 46 } as const;

export const BRAND_TOPICS: readonly BrandTopic[] = [
  "theft",
  "how-many-left",
  "colours",
  "registrations",
  "theft",
  "how-many-left",
  "wrong-turn",
];
export const SELLERS_TOPICS: readonly SellersTopic[] = ["value-table", "worth-after", "used-price-trend", "worth-after"];
export const MOT_TOPICS: readonly MotTopic[] = ["fail-reasons", "pass-by-area", "pass-by-model"];

export interface IsoWeek {
  year: number;
  week: number;
}

export interface WeekSlot {
  audience: Audience;
  /** Buffer day: Monday for brand, Wednesday for sellers, Friday for MOT. */
  day: "Monday" | "Wednesday" | "Friday";
  topic: Topic;
  /** How many times this topic has come up so far, this week included (0-based). */
  occurrence: number;
  /** The clip's calendar date, ISO (YYYY-MM-DD). */
  date: string;
}

export interface WeekPlan {
  week: IsoWeek;
  label: string;
  /** Monday of the week, ISO date. */
  monday: string;
  /** Weeks since the series started (0 for the first week). */
  index: number;
  slots: [WeekSlot, WeekSlot, WeekSlot];
}

const DAY_MS = 864e5;

export function weekLabel(w: IsoWeek): string {
  return `${w.year}-W${String(w.week).padStart(2, "0")}`;
}

export function parseWeekLabel(s: string): IsoWeek {
  const m = /^(\d{4})-W(\d{1,2})$/i.exec(s.trim());
  if (!m) throw new Error(`Not an ISO week label (expected e.g. 2026-W46): ${s}`);
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > weeksInYear(year)) throw new Error(`${s}: ${year} has ${weeksInYear(year)} ISO weeks`);
  return { year, week };
}

/** The Monday that starts an ISO week, at 00:00 UTC. */
export function isoWeekMonday(w: IsoWeek): Date {
  // 4 January is always in week 1.
  const jan4 = Date.UTC(w.year, 0, 4);
  const jan4Dow = (new Date(jan4).getUTCDay() + 6) % 7; // Monday = 0
  const week1Monday = jan4 - jan4Dow * DAY_MS;
  return new Date(week1Monday + (w.week - 1) * 7 * DAY_MS);
}

/** The ISO week a date falls in (UTC). */
export function isoWeekOf(date: Date): IsoWeek {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3); // the Thursday of this week decides the year
  const year = d.getUTCFullYear();
  const week1Thursday = isoWeekMonday({ year, week: 1 }).getTime() + 3 * DAY_MS;
  const week = 1 + Math.round((d.getTime() - week1Thursday) / (7 * DAY_MS));
  return { year, week };
}

export function weeksInYear(year: number): number {
  return isoWeekOf(new Date(Date.UTC(year, 11, 28))).week;
}

/** Weeks between two ISO weeks (b - a). */
export function weekDiff(a: IsoWeek, b: IsoWeek): number {
  return Math.round((isoWeekMonday(b).getTime() - isoWeekMonday(a).getTime()) / (7 * DAY_MS));
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Whether the MOT slot of this week is the seasonal "due this month" clip. */
export function isSeasonWeek(monday: Date): boolean {
  const month = monday.getUTCMonth(); // 0 = January
  const day = monday.getUTCDate();
  // The first two Mondays of March and September: the registration waves,
  // when the most cars have an MOT due.
  return (month === 2 || month === 8) && day <= 14;
}

/** The topics of a week, without occurrence counts. */
function topicsFor(index: number, monday: Date): [BrandTopic, SellersTopic, MotTopic] {
  const n = Math.max(0, index);
  return [
    BRAND_TOPICS[n % BRAND_TOPICS.length],
    SELLERS_TOPICS[n % SELLERS_TOPICS.length],
    isSeasonWeek(monday) ? "season-due" : MOT_TOPICS[n % MOT_TOPICS.length],
  ];
}

/**
 * The plan for a week. Occurrence counts are replayed from the series start,
 * so each topic's subject list advances exactly once per appearance.
 */
export function planWeek(week: IsoWeek): WeekPlan {
  const index = weekDiff(SERIES_START, week);
  if (index < 0) throw new Error(`${weekLabel(week)} is before the series start (${weekLabel(SERIES_START)})`);
  const seen = new Map<Topic, number>();
  let topics: [BrandTopic, SellersTopic, MotTopic] = ["theft", "value-table", "fail-reasons"];
  for (let i = 0; i <= index; i++) {
    const monday = new Date(isoWeekMonday(SERIES_START).getTime() + i * 7 * DAY_MS);
    topics = topicsFor(i, monday);
    for (const t of topics) seen.set(t, (seen.get(t) ?? 0) + 1);
  }
  const monday = isoWeekMonday(week);
  const slot = (audience: Audience, day: WeekSlot["day"], offset: number, topic: Topic): WeekSlot => ({
    audience,
    day,
    topic,
    occurrence: (seen.get(topic) ?? 1) - 1,
    date: isoDate(new Date(monday.getTime() + offset * DAY_MS)),
  });
  return {
    week,
    label: weekLabel(week),
    monday: isoDate(monday),
    index,
    slots: [
      slot("brand", "Monday", 0, topics[0]),
      slot("sellers", "Wednesday", 2, topics[1]),
      slot("mot", "Friday", 4, topics[2]),
    ],
  };
}

/**
 * The week the Thursday job renders for: the week that starts next Monday,
 * or the series' first week if that is still ahead.
 */
export function upcomingWeek(now = new Date()): IsoWeek {
  const thisWeek = isoWeekOf(now);
  const nextMonday = new Date(isoWeekMonday(thisWeek).getTime() + 7 * DAY_MS);
  const next = isoWeekOf(nextMonday);
  return weekDiff(SERIES_START, next) < 0 ? { ...SERIES_START } : next;
}

/** The ISO week `n` weeks after `w`. */
export function nextWeek(w: IsoWeek, n = 1): IsoWeek {
  return isoWeekOf(new Date(isoWeekMonday(w).getTime() + n * 7 * DAY_MS));
}
