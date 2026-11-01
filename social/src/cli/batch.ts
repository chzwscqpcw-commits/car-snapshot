/**
 * Is the coming week the start of a batch, and which weeks are in it?
 * The Saturday workflow runs every week and uses this to decide whether to
 * render (in social/):
 *
 *   npm run batch                 → {"batch":true,"first":"2026-W48","weeks":["2026-W48","2026-W49","2026-W50"]}
 *   npm run batch -- --week 2026-W49   the batch starting at that week, batch:true regardless
 */
import { batchWeeks, isBatchStart, parseWeekLabel, upcomingWeek, weekLabel } from "../calendar";

const args = process.argv.slice(2);
const i = args.indexOf("--week");
const explicit = i >= 0 ? parseWeekLabel(args[i + 1]) : null;
const first = explicit ?? upcomingWeek();
const weeks = batchWeeks(first).map(weekLabel);
console.log(JSON.stringify({ batch: explicit ? true : isBatchStart(first), first: weekLabel(first), weeks }));
