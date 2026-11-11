/**
 * The lookup-health alert (src/lib/lookup-health.ts): when it fires, that it
 * fires once per incident, when it clears, and what the Friday email says.
 *
 * The fixture is the shape of the real thing: on 8–9 Nov 2026 the MOT half
 * of /api/lookup failed on every fresh lookup for 21.5 hours, 33–98 errors
 * an hour by day and 3–9 by night, and nothing told anyone.
 */
import {
  LOOKUP_ALERT,
  alertSubject,
  badSpells,
  decideHealthActions,
  fmtDuration,
  isBad,
  isRecovered,
  lookupHealthLine,
  openIncidentsFrom,
  renderAlertHtml,
  renderLookupHealthHtml,
  stageStats,
  summariseLookupHealth,
  type HealthRow,
  type OpenIncident,
} from "../src/lib/lookup-health";

let failures = 0;
function check(label: string, ok: boolean, detail = ""): void {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  — ${detail}`}`);
}

const MIN = 60_000;
const T0 = Date.parse("2026-11-08T12:00:00Z");
const at = (minutes: number) => new Date(T0 + minutes * MIN).toISOString();

const lookup = (minutes: number, cached = false): HealthRow => ({ event_type: "lookup", created_at: at(minutes), metadata: { cached, make: "FORD" } });
const motError = (minutes: number, extra: Record<string, unknown> = {}): HealthRow => ({
  event_type: "lookup_error",
  created_at: at(minutes),
  metadata: { stage: "mot", reason: "network_error", status: null, ...extra },
});
const dvlaError = (minutes: number): HealthRow => ({ event_type: "lookup_error", created_at: at(minutes), metadata: { stage: "dvla", reason: "service_error", status: 503 } });

/** A fresh lookup every `every` minutes over [from, to); the MOT half fails inside [downFrom, downTo). */
function traffic(from: number, to: number, every: number, downFrom = Infinity, downTo = Infinity): HealthRow[] {
  const rows: HealthRow[] = [];
  for (let m = from; m < to; m += every) {
    if (m >= downFrom && m < downTo) rows.push(motError(m, { cause_code: "CERT_HAS_EXPIRED" }));
    rows.push(lookup(m + 0.01));
    if (m % (every * 3) === 0) rows.push(lookup(m + 0.5, true)); // some cached repeats
  }
  return rows;
}

console.log("\nThe threshold:");
{
  const healthy = stageStats(traffic(-60, 0, 2), T0 - 60 * MIN, T0);
  check("a healthy hour is not bad", !isBad(healthy.mot) && healthy.mot.errors === 0);
  check("cached lookups are not in the denominator", healthy.mot.attempts === 30, String(healthy.mot.attempts));

  const blip = stageStats([...traffic(-60, 0, 1), motError(-30), motError(-29), motError(-28), motError(-27), motError(-26), motError(-25)], T0 - 60 * MIN, T0);
  check("six timeouts in a busy hour (10%) do not page", !isBad(blip.mot), `${blip.mot.errors}/${blip.mot.attempts}`);

  const few = stageStats([...traffic(-60, 0, 20), motError(-10), motError(-9), motError(-8), motError(-7)], T0 - 60 * MIN, T0);
  check(`fewer than ${LOOKUP_ALERT.MIN_ERRORS} errors never page, whatever the share`, !isBad(few.mot), `${few.mot.errors}/${few.mot.attempts}`);

  const outageHour = stageStats(traffic(-60, 0, 2, -60, 0), T0 - 60 * MIN, T0);
  check("an hour of every lookup failing is bad", isBad(outageHour.mot) && outageHour.mot.share === 1, `${outageHour.mot.errors}/${outageHour.mot.attempts}`);
  check("reasons and causes are tallied", outageHour.mot.reasons.network_error === 30 && outageHour.mot.causes.CERT_HAS_EXPIRED === 30);

  const night = stageStats(traffic(-60, 0, 12, -60, 0), T0 - 60 * MIN, T0);
  check("a quiet night hour with every lookup failing still pages", isBad(night.mot), `${night.mot.errors}/${night.mot.attempts}`);

  const dvlaDown = stageStats([dvlaError(-9), dvlaError(-8), dvlaError(-7), dvlaError(-6), dvlaError(-5), dvlaError(-4)], T0 - 60 * MIN, T0);
  check("DVLA failures count even though a failed lookup writes no lookup row", isBad(dvlaDown.dvla) && dvlaDown.dvla.attempts === 6);
  check("and do not blame the MOT stage", !isBad(dvlaDown.mot));
}

console.log("\nOne email when it starts, one when it clears:");
{
  // Healthy until minute 0, down from minute 0 to minute 600, healthy after.
  const rows = traffic(-120, 720, 2, 0, 600);
  let open: OpenIncident[] = [];
  const log: string[] = [];
  for (let m = -60; m <= 720; m += 15) {
    const now = T0 + m * MIN;
    const seen = rows.filter((r) => Date.parse(r.created_at) < now);
    for (const a of decideHealthActions(seen, now, open)) {
      log.push(`${a.type}@${m}`);
      if (a.type === "open") open = [...open, { stage: a.stage, startedAt: a.startedAt, alertedAt: new Date(now).toISOString() }];
      else open = open.filter((i) => i.stage !== a.stage);
    }
  }
  check("exactly two emails for one incident", log.length === 2 && log[0].startsWith("open@") && log[1].startsWith("recover@"), log.join(" "));
  const openedAt = Number(log[0]?.split("@")[1]);
  const recoveredAt = Number(log[1]?.split("@")[1]);
  check("the alert goes out within half an hour of the first error", openedAt > 0 && openedAt <= 30, `minute ${openedAt}`);
  check("recovery waits for evidence, then goes out within 45 minutes", recoveredAt > 600 && recoveredAt <= 645, `minute ${recoveredAt}`);

  const firstRun = decideHealthActions(rows.filter((r) => Date.parse(r.created_at) < T0 + 30 * MIN), T0 + 30 * MIN, []);
  check("the alert knows when the spell began", firstRun[0]?.type === "open" && firstRun[0].startedAt === at(0), JSON.stringify(firstRun[0]));

  const stillDown = decideHealthActions(rows.filter((r) => Date.parse(r.created_at) < T0 + 300 * MIN), T0 + 300 * MIN, [{ stage: "mot", startedAt: at(0), alertedAt: at(30) }]);
  check("nothing more while the incident stays open", stillDown.length === 0);

  const silent = decideHealthActions(traffic(-120, 0, 2, -120, 0), T0 + 45 * MIN, [{ stage: "mot", startedAt: at(-120), alertedAt: at(-90) }]);
  check("no traffic at all is not a recovery", silent.length === 0);

  const recovery = decideHealthActions(rows.filter((r) => Date.parse(r.created_at) < T0 + 645 * MIN), T0 + 645 * MIN, [{ stage: "mot", startedAt: at(0), alertedAt: at(30) }]);
  const rec = recovery[0];
  check("the recovery email counts the incident's errors", rec?.type === "recover" && rec.errorsSinceStart === 300, JSON.stringify(rec));
  check("and knows when the last one was", rec?.type === "recover" && rec.lastErrorAt === at(598));
  check("isRecovered needs lookups to judge by", !isRecovered(stageStats([], T0, T0 + 30 * MIN).mot));
}

console.log("\nIncident state (lookup_alert rows):");
{
  const alertRow = (minutes: number, stage: string, state: string, started: number): HealthRow => ({
    event_type: "lookup_alert",
    created_at: at(minutes),
    metadata: { internal: true, stage, state, started_at: at(started) },
  });
  check("no rows, nothing open", openIncidentsFrom([]).length === 0);
  const open = openIncidentsFrom([alertRow(30, "mot", "open", 0)]);
  check("an open row is an open incident", open.length === 1 && open[0].stage === "mot" && open[0].startedAt === at(0));
  check("a later recovered row closes it", openIncidentsFrom([alertRow(30, "mot", "open", 0), alertRow(645, "mot", "recovered", 0)]).length === 0);
  check("stages are independent", openIncidentsFrom([alertRow(30, "mot", "open", 0), alertRow(645, "mot", "recovered", 0), alertRow(700, "dvla", "open", 690)]).map((i) => i.stage).join() === "dvla");
  check("row order doesn't matter", openIncidentsFrom([alertRow(645, "mot", "recovered", 0), alertRow(30, "mot", "open", 0)]).length === 0);
}

console.log("\nThe Friday line:");
{
  // The outage's real outline: 11:52 on the 8th to 09:30 on the 9th, thinning overnight.
  const rows: HealthRow[] = [];
  const start = -8;
  const end = 21 * 60 + 30;
  for (let m = start; m <= end; m += m > 13 * 60 && m < 19 * 60 ? 40 : 3) rows.push(motError(m));
  rows.push(motError(end));
  rows.push(motError(-2500, { reason: "timeout" }), motError(-2000, { reason: "timeout" })); // two stray timeouts the day before
  const weekEnd = T0 + 5 * 24 * 60 * MIN;
  const h = summariseLookupHealth(rows, weekEnd - 7 * 24 * 60 * MIN, weekEnd);
  check("counts errors by stage", h.byStage.length === 1 && h.byStage[0].stage === "mot" && h.byStage[0].errors === rows.length);
  check("finds the one long spell, through the quiet night", h.longestSpell?.startISO === at(start) && h.longestSpell?.endISO === at(end), JSON.stringify(h.longestSpell));
  check("21h 38m", fmtDuration(h.longestSpell?.minutes ?? 0) === "21h 38m", fmtDuration(h.longestSpell?.minutes ?? 0));
  check("stray timeouts are not a spell", badSpells(rows).length === 1);
  check("not ongoing days later", h.ongoing === null);
  const line = lookupHealthLine(h);
  check("the line names the stage and the spell", /MOT history \(DVSA\)/.test(line) && /Longest bad spell/.test(line) && /8 Nov 11:52 to 9 Nov 09:30 UTC/.test(line), line);
  const html = renderLookupHealthHtml(h);
  check("the email block is red for a bad spell", /Lookup health:/.test(html) && /#fef2f2/.test(html));

  const quiet = summariseLookupHealth([], weekEnd - 7 * 24 * 60 * MIN, weekEnd);
  check("a clean week says so, plainly", lookupHealthLine(quiet) === "no errors" && /Lookup health:<\/strong> no errors/.test(renderLookupHealthHtml(quiet)) && !/#fef2f2/.test(renderLookupHealthHtml(quiet)));

  const scattered = summariseLookupHealth([motError(-2000), motError(-1000)], weekEnd - 7 * 24 * 60 * MIN, weekEnd);
  check("scattered errors are counted without a spell", scattered.totalErrors === 2 && scattered.longestSpell === null && /No bad spell/.test(lookupHealthLine(scattered)));

  const during = summariseLookupHealth(rows, T0 + 300 * MIN - 7 * 24 * 60 * MIN, T0 + 300 * MIN);
  check("mid-outage, the email says it is still failing", during.ongoing !== null && /Still failing/.test(renderLookupHealthHtml(during)));
}

console.log("\nThe emails:");
{
  const rows = traffic(-60, 0, 2, -60, 0);
  const [open] = decideHealthActions(rows, T0, []);
  const subject = open ? alertSubject(open) : "";
  const html = open ? renderAlertHtml(open, T0) : "";
  check("the alert subject says what and how much", /^FPC alert: MOT history \(DVSA\) failing, 30 errors in the last hour$/.test(subject), subject);
  check("the body gives the share, the cause and what visitors see", /30<\/strong> of the last hour/.test(html) && /CERT_HAS_EXPIRED/.test(html) && /What visitors see/.test(html));
  check("and promises exactly one more email", /one more email, when it clears/.test(html));
  const after = [...rows, ...traffic(0, 45, 2)];
  const [recover] = decideHealthActions(after, T0 + 45 * MIN, [{ stage: "mot", startedAt: at(-60), alertedAt: at(-30) }]);
  const rHtml = recover ? renderAlertHtml(recover, T0 + 45 * MIN) : "";
  check("the recovery subject says it is back", recover ? /^FPC recovered: MOT history \(DVSA\) is answering again$/.test(alertSubject(recover)) : false);
  check("the recovery body gives the duration and the count", /58m/.test(rHtml) && /30 errors/.test(rHtml), rHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 200));
  check("no plate-shaped text in either email", !/[A-Z]{2}\d{2}\s?[A-Z]{3}/.test(html + rHtml));
}

console.log(failures === 0 ? "\nAll lookup-health checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
