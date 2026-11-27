import type { Audience } from "./calendar";
import type { WeekBuild } from "./plan";

const SITE = "https://www.freeplatecheck.co.uk/";
const PLATFORMS = ["tiktok", "instagram", "facebook"] as const;

/** Every caption ends with these, after the topic's own tags. */
const AUDIENCE_TAGS: Record<Audience, string[]> = {
  brand: ["freeplatecheck", "ukcars", "carcheck"],
  sellers: ["sellingmycar", "carvaluation", "usedcars"],
  mot: ["mot", "motcheck", "ukcars"],
};

/**
 * Instagram allows five hashtags per post (from late 2026) and the same
 * caption goes to all three networks, so five it is everywhere: the topic's
 * own tags first, the audience's filling up the rest.
 */
export const MAX_HASHTAGS = 5;

export interface CaptionEntry {
  /** The clip's ISO week, e.g. "2026-W46". */
  week: string;
  file: string;
  still: string;
  day: string;
  date: string;
  audience: Audience;
  topic: string;
  title: string;
  headline: string;
  caption: string;
  source: string;
  sourceDate: string;
  utm: Record<(typeof PLATFORMS)[number], string>;
}

export interface CaptionsFile {
  /** The first week in the file (the release tag's week). */
  week: string;
  /** Every week in the file, in order: one for a single render, three for a batch. */
  weeks: string[];
  /** Monday of the first week, ISO date. */
  monday: string;
  schedule: string;
  clips: CaptionEntry[];
}

export function utmLink(platform: (typeof PLATFORMS)[number], week: string): string {
  const u = new URL(SITE);
  u.searchParams.set("utm_source", platform);
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", week);
  return u.toString();
}

/** The hook as plain text, for the email and the release notes. */
export function headlineText(hook: Array<string | { em: string }>): string {
  return hook.map((s) => (typeof s === "string" ? s : s.em)).join("");
}

function hashtags(topicTags: string[], audience: Audience): string {
  const seen = new Set<string>();
  const all = [...topicTags, ...AUDIENCE_TAGS[audience]].filter((t) => t && !seen.has(t) && seen.add(t));
  return all
    .slice(0, MAX_HASHTAGS)
    .map((t) => `#${t}`)
    .join(" ");
}

/** The caption as posted: the templated body, the site, the hashtags. */
export function fullCaption(body: string, topicTags: string[], audience: Audience): string {
  // No "link in bio": TikTok only makes the bio link clickable for Business
  // accounts or at 1,000 followers, so the domain is the call to action
  // everywhere, and it is short enough to type.
  return `${body}\n\nFree check: freeplatecheck.co.uk\n\n${hashtags(topicTags, audience)}`;
}

export function captionsFile(builds: WeekBuild | WeekBuild[]): CaptionsFile {
  const list = Array.isArray(builds) ? builds : [builds];
  if (list.length === 0) throw new Error("captionsFile: no weeks");
  return {
    week: list[0].plan.label,
    weeks: list.map((b) => b.plan.label),
    monday: list[0].plan.monday,
    schedule: "Buffer: Monday (brand), Wednesday (sellers), Friday (MOT) at 18:00; one post to TikTok, Instagram and Facebook together.",
    clips: list.flatMap((build) => {
      const week = build.plan.label;
      return build.clips.map((c) => ({
        week,
        file: `${c.id}.mp4`,
        still: `${c.id}.png`,
        day: c.slot.day,
        date: c.slot.date,
        audience: c.slot.audience,
        topic: c.slot.topic,
        title: c.picked.title,
        headline: headlineText(c.picked.props.hook),
        caption: fullCaption(c.picked.caption, c.picked.tags, c.slot.audience),
        source: c.picked.source,
        sourceDate: c.picked.sourceDate,
        utm: Object.fromEntries(PLATFORMS.map((p) => [p, utmLink(p, week)])) as CaptionEntry["utm"],
      }));
    }),
  };
}
