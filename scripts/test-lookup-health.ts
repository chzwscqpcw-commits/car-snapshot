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
  lastRecoveriesFrom,
  MOT_FLAG_SINCE_MS,
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

console.log("\nNo second alert from the tail of the first:");
{
  // Recovery reads the last half hour, opening the last hour. Depending on
  // where the cron's ticks fall, the hour after a recovery can still hold
  // enough of the old incident to open a new one. Replayed on the real rows,
  // 8–9 Nov did: open, recover, open again 15 minutes later, recover again.
  const rows = traffic(-120, 900, 2, 0, 600);
  const counts: string[] = [];
  let withoutMemory = 0;
  for (let phase = 0; phase < 15; phase++) {
    for (const remember of [true, false]) {
      let open: OpenIncident[] = [];
      const recovered: Partial<Record<"mot" | "dvla" | "internal", string>> = {};
      let emails = 0;
      for (let m = -60 + phase; m <= 900; m += 15) {
        const now = T0 + m * MIN;
        const seen = rows.filter((r) => Date.parse(r.created_at) < now);
        for (const a of decideHealthActions(seen, now, open, remember ? recovered : {})) {
          emails++;
          if (a.type === "open") open = [...open, { stage: a.stage, startedAt: a.startedAt, alertedAt: new Date(now).toISOString() }];
          else {
            open = open.filter((i) => i.stage !== a.stage);
            recovered[a.stage] = new Date(now).toISOString();
          }
        }
      }
      if (remember) counts.push(String(emails));
      else withoutMemory = Math.max(withoutMemory, emails);
    }
  }
  check("two emails per incident, wherever the cron's ticks fall", counts.every((c) => c === "2"), counts.join(","));
  check("(the fixture does flap without the recovery time, so the check above means something)", withoutMemory > 2, String(withoutMemory));

  const alertRow = (minutes: number, stage: string, state: string): HealthRow => ({ event_type: "lookup_alert", created_at: at(minutes), metadata: { internal: true, stage, state, started_at: at(0) } });
  const rec = lastRecoveriesFrom([alertRow(30, "mot", "open"), alertRow(645, "mot", "recovered"), alertRow(100, "mot", "recovered"), alertRow(700, "dvla", "open")]);
  check("the last recovery per stage is read from the alert rows", rec.mot === at(645) && rec.dvla === undefined);

  // A genuinely new failure after a recovery still opens.
  const again = [...traffic(-120, 700, 2, 0, 600), ...traffic(700, 760, 2, 700, 760)];
  const reopened = decideHealthActions(again, T0 + 760 * MIN, [], { mot: at(645) });
  check("a new outage after a recovery still alerts", reopened[0]?.type === "open" && reopened[0].startedAt === at(700), JSON.stringify(reopened[0]?.type === "open" ? reopened[0].startedAt : reopened));
}

console.log("\nCounting results a visitor lost, not error rows (since the fallback went live):");
{
  // After the flag exists. 12 Nov 2026, 12:54 UTC: an automated client asked
  // for one unregistered plate 112 times in four minutes; 19 of those MOT
  // calls timed out. No result was shown to anyone, with or without MOT data.
  const N0 = MOT_FLAG_SINCE_MS + 24 * 60 * MIN;
  const nat = (minutes: number) => new Date(N0 + minutes * MIN).toISOString();
  const look = (minutes: number, extra: Record<string, unknown> = {}): HealthRow => ({ event_type: "lookup", created_at: nat(minutes), metadata: { cached: false, make: "FORD", ...extra } });
  const timeout = (minutes: number): HealthRow => ({ event_type: "lookup_error", created_at: nat(minutes), metadata: { stage: "mot", reason: "timeout", status: null, ms: 10003, attempts: 1 } });

  const normalHour = Array.from({ length: 35 }, (_, i) => look(-59 + i * 1.6));
  const burst = [...normalHour, ...Array.from({ length: 19 }, (_, i) => timeout(-6 + i * 0.1))].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const b = stageStats(burst, N0 - 60 * MIN, N0);
  check("the burst's 19 timeouts are counted as errors", b.mot.errors === 19 && b.mot.reasons.timeout === 19);
  check("but no result was affected, so it does not page", b.mot.affected === 0 && !isBad(b.mot) && decideHealthActions(burst, N0, []).length === 0, `${b.mot.affected}/${b.mot.attempts}`);
  check("and four minutes of errors is not a bad spell in the Friday line", badSpells(burst).length === 0 && summariseLookupHealth(burst, N0 - 7 * 24 * 60 * MIN, N0).longestSpell === null);

  // A real outage now: every fresh lookup renders without MOT data and says so.
  const outage: HealthRow[] = [];
  for (let m = -60; m < 0; m += 2) outage.push(timeout(m), look(m + 0.01, { mot_unavailable: true, model_known: true }));
  const o = stageStats(outage, N0 - 60 * MIN, N0);
  check("a real outage is every result affected, and pages", o.mot.affected === 30 && o.mot.share === 1 && isBad(o.mot));
  const [opened] = decideHealthActions(outage, N0, []);
  check("the alert says how many lookups were affected", opened?.type === "open" && /30 lookups affected/.test(alertSubject(opened)) && /timeout/.test(renderAlertHtml(opened, N0)));

  // Both at once: the burst must not hide a real outage, nor inflate it.
  const both = [...outage, ...Array.from({ length: 19 }, (_, i) => timeout(-6 + i * 0.1))];
  check("a burst on top of a real outage changes nothing", stageStats(both, N0 - 60 * MIN, N0).mot.affected === 30);

  // Recovery after the flag: lookups succeed again.
  const healed = [...outage, ...Array.from({ length: 15 }, (_, i) => look(1 + i * 2))];
  const rec = decideHealthActions(healed, N0 + 31 * MIN, [{ stage: "mot", startedAt: nat(-60), alertedAt: nat(-30) }]);
  check("and it recovers when results carry MOT data again", rec[0]?.type === "recover");

  // DVLA failures have no result row at all; they are judged on error rows as before.
  const dvla = Array.from({ length: 6 }, (_, i): HealthRow => ({ event_type: "lookup_error", created_at: nat(-9 + i), metadata: { stage: "dvla", reason: "service_error", status: 503 } }));
  check("DVLA failures still page on their error rows", isBad(stageStats(dvla, N0 - 60 * MIN, N0).dvla));
}

console.log("\nErrors from direct calls (no page of ours made the request):");
{
  // Since 12 Nov 2026 /api/lookup marks an error from a direct call
  // `direct: true`, and records that caller's successes as `lookup_direct`
  // (not read here). So its errors must not count either, anywhere.
  const N0 = MOT_FLAG_SINCE_MS + 48 * 60 * MIN;
  const nat = (minutes: number) => new Date(N0 + minutes * MIN).toISOString();
  const look = (minutes: number): HealthRow => ({ event_type: "lookup", created_at: nat(minutes), metadata: { cached: false, make: "FORD" } });
  const dvlaErr = (minutes: number, direct: boolean): HealthRow => ({
    event_type: "lookup_error",
    created_at: nat(minutes),
    metadata: { stage: "dvla", reason: "service_error", status: 503, ...(direct ? { direct: true } : {}) },
  });
  const weekFrom = N0 - 7 * 24 * 60 * MIN;

  // A quiet hour for visitors (6 fresh lookups) while a script collects 40 DVLA errors over 40 minutes.
  const visitors = Array.from({ length: 6 }, (_, i) => look(-55 + i * 10));
  const scripted = Array.from({ length: 40 }, (_, i) => dvlaErr(-45 + i, true));
  const quiet = [...visitors, ...scripted].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const q = stageStats(quiet, N0 - 60 * MIN, N0);
  check("the same errors unmarked would page (the case being guarded)", isBad(stageStats([...visitors, ...scripted.map((r) => dvlaErr((Date.parse(r.created_at) - N0) / MIN, false))], N0 - 60 * MIN, N0).dvla));
  check("marked direct, they are not errors of any stage", q.dvla.errors === 0 && q.dvla.affected === 0 && q.mot.errors === 0 && q.internal.errors === 0);
  check("and do not page", !isBad(q.dvla) && decideHealthActions(quiet, N0, []).length === 0);
  check("nor inflate the attempts the share is taken of", q.dvla.attempts === 6, String(q.dvla.attempts));
  check("forty minutes of them is not a bad spell", badSpells(quiet).length === 0);
  const s = summariseLookupHealth(quiet, weekFrom, N0);
  check("the week's summary counts no errors", s.totalErrors === 0 && s.byStage.length === 0 && s.longestSpell === null && s.ongoing === null);
  check("but says how many it left out", s.directErrors === 40 && /^no errors from visitors\. Not counted: 40 from direct API calls\.$/.test(lookupHealthLine(s)), lookupHealthLine(s));
  check("and the email carries that line", renderLookupHealthHtml(s).includes("Not counted: 40 from direct API calls."));
  check("a week with none says nothing about them", lookupHealthLine(summariseLookupHealth(visitors, weekFrom, N0)) === "no errors");

  // A real DVLA outage with the script running through it: judged on visitors' failures alone.
  const outage = Array.from({ length: 12 }, (_, i) => dvlaErr(-58 + i * 5, false));
  const mixed = [...outage, ...scripted].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const m = stageStats(mixed, N0 - 60 * MIN, N0);
  check("a real outage still pages, counted on visitors' errors only", isBad(m.dvla) && m.dvla.errors === 12 && m.dvla.affected === 12, `${m.dvla.affected}/${m.dvla.attempts}`);
  const [opened] = decideHealthActions(mixed, N0, []);
  check("and starts at the visitors' first error, not the script's", opened?.type === "open" && opened.startedAt === nat(-58), opened?.type === "open" ? opened.startedAt : "no alert");
  const ms = summariseLookupHealth(mixed, weekFrom, N0);
  check("the summary keeps the two apart", ms.totalErrors === 12 && ms.directErrors === 40 && /^12 errors .*Not counted: 40 from direct API calls\.$/.test(lookupHealthLine(ms)), lookupHealthLine(ms));

  // Recovery: visitors' lookups work again while the script is still failing.
  const healed = [...outage, ...Array.from({ length: 10 }, (_, i) => look(2 + i * 3)), ...Array.from({ length: 30 }, (_, i) => dvlaErr(1 + i, true))].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const rec = decideHealthActions(healed, N0 + 31 * MIN, [{ stage: "dvla", startedAt: nat(-58), alertedAt: nat(-30) }]);
  check("an incident clears when visitors' lookups work, whatever the script sees", rec[0]?.type === "recover" && rec[0].errorsSinceStart === 12 && rec[0].lastErrorAt === nat(-3), JSON.stringify(rec[0] ?? null).slice(0, 160));

  // An MOT error from a direct call, before and after: never counted.
  const motDirect: HealthRow = { event_type: "lookup_error", created_at: nat(-5), metadata: { stage: "mot", reason: "timeout", status: null, direct: true } };
  check("a direct call's MOT error is not counted either", stageStats([motDirect], N0 - 60 * MIN, N0).mot.errors === 0);
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
  check("the alert subject says what and how much", /^FPC alert: MOT history \(DVSA\) failing, 30 lookups affected in the last hour$/.test(subject), subject);
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
