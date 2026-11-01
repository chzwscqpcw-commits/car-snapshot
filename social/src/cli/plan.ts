/**
 * Print the plan for a week without rendering anything (in social/):
 *   npm run plan -- --week 2026-W46        captions.json for that week
 *   npm run plan -- --weeks 12             the next 12 weeks, one line each
 */
import { nextWeek, parseWeekLabel, upcomingWeek } from "../calendar";
import { captionsFile } from "../captions";
import { buildWeek } from "../plan";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const start = flag("week") ? parseWeekLabel(flag("week")!) : upcomingWeek();
const weeks = Number(flag("weeks") ?? 0);
if (weeks > 0) {
  let w = start;
  for (let i = 0; i < weeks; i++) {
    const b = buildWeek(w, false);
    console.log(`${b.plan.label}  ${b.clips.map((c) => `${c.slot.topic}#${c.slot.occurrence}: ${c.picked.title}`).join("  |  ")}`);
    w = nextWeek(w);
  }
} else {
  console.log(JSON.stringify(captionsFile(buildWeek(start, !args.includes("--silent"))), null, 2));
}
