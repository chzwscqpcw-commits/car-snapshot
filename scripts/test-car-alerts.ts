/**
 * The rules the daily car-alerts cron sends by — src/lib/car-alerts.ts.
 * Dates are fixed so the checks don't drift with the calendar.
 */
import { alertMessage, daysUntil, dueAlerts, needsRefresh, parseAlertSource, type SavedCarRow } from "../src/lib/car-alerts";
import { bmgClickref } from "../src/lib/booking";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
}

const NOW = new Date("2026-11-10T08:30:00Z");
function car(over: Partial<SavedCarRow> = {}): SavedCarRow {
  return {
    id: "1",
    vrm: "AB12CDE",
    make_model: "FORD FOCUS",
    mot_expiry: "2027-05-08",
    tax_due: "2027-03-01",
    intent: null,
    channel: "email",
    email: "jane@example.com",
    push_subscription_id: null,
    manage_token: "tok",
    alerts_sent: {},
    recall_count: 0,
    year_of_manufacture: 2016,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-11-09T00:00:00Z",
    ...over,
  };
}
const kinds = (c: SavedCarRow, recalls: number | null = 0) => dueAlerts(c, NOW, recalls).map((a) => a.kind);

console.log("\nDays:");
check("today is 0", daysUntil("2026-11-10", NOW), 0);
check("a week out", daysUntil("2026-11-17", NOW), 7);
check("yesterday is -1", daysUntil("2026-11-09", NOW), -1);

console.log("\nNothing due:");
check("MOT months away, tax months away", kinds(car()), []);
check("expired MOT gets nothing (no back-fill)", kinds(car({ mot_expiry: "2026-11-01" })), []);

console.log("\nMOT:");
check("35 days out → mot_35", kinds(car({ mot_expiry: "2026-12-15" })), ["mot_35"]);
check("20 days out → mot_35 (window reached)", kinds(car({ mot_expiry: "2026-11-30" })), ["mot_35"]);
check("7 days out → mot_7", kinds(car({ mot_expiry: "2026-11-17" })), ["mot_7"]);
check("due today → mot_7", kinds(car({ mot_expiry: "2026-11-10" })), ["mot_7"]);
const skipped = dueAlerts(car({ mot_expiry: "2026-11-15" }), NOW, 0)[0];
check("saved inside the week: 7-day alert, 35-day window marked too", [skipped.key, skipped.alsoMark], ["mot_7:2026-11-15", ["mot_35:2026-11-15"]]);
check("already sent → nothing", kinds(car({ mot_expiry: "2026-11-17", alerts_sent: { "mot_7:2026-11-17": "x", "mot_35:2026-11-17": "x" } })), []);
check("35 sent, 7 reached → mot_7", kinds(car({ mot_expiry: "2026-11-17", alerts_sent: { "mot_35:2026-11-17": "x" } })), ["mot_7"]);
check("renewed MOT (new date) → fresh reminders", kinds(car({ mot_expiry: "2026-12-10", alerts_sent: { "mot_35:2026-11-17": "x", "mot_7:2026-11-17": "x" } })), ["mot_35"]);

console.log("\nTax:");
check("7 days out → tax", kinds(car({ tax_due: "2026-11-17" })), ["tax"]);
check("8 days out → not yet", kinds(car({ tax_due: "2026-11-18" })), []);
check("tax sent → nothing", kinds(car({ tax_due: "2026-11-17", alerts_sent: { "tax:2026-11-17": "x" } })), []);

console.log("\nRecall:");
check("count rose → recall", kinds(car(), 1), ["recall"]);
check("same count → nothing", kinds(car({ recall_count: 1 }), 1), []);
check("no baseline yet → nothing", kinds(car({ recall_count: null }), 2), []);
check("that recall already sent → nothing", kinds(car({ alerts_sent: { "recall:1": "x" } }), 1), []);

console.log("\nValue check:");
check("keeping → never", kinds(car({ intent: "keeping" })), []);
check("selling, saved 10 weeks ago → value", kinds(car({ intent: "selling" })), ["value"]);
check("thinking → value", kinds(car({ intent: "thinking" })), ["value"]);
check("selling but saved last week → not yet", kinds(car({ intent: "selling", created_at: "2026-11-03T00:00:00Z" })), []);
check("sent 3 weeks ago → not yet", kinds(car({ intent: "selling", alerts_sent: { "value:2026-10": "2026-10-20T08:30:00Z" } })), []);
check("sent 5 weeks ago → due again", kinds(car({ intent: "selling", alerts_sent: { "value:2026-10": "2026-10-05T08:30:00Z" } })), ["value"]);

console.log("\nRefresh:");
check("far dates, fresh row → no lookup", needsRefresh(car(), NOW), false);
check("MOT within 36 days → lookup", needsRefresh(car({ mot_expiry: "2026-12-15" }), NOW), true);
check("row a month stale → lookup", needsRefresh(car({ updated_at: "2026-10-01T00:00:00Z" }), NOW), true);
check("no dates held → lookup", needsRefresh(car({ mot_expiry: null }), NOW), true);

console.log("\nMessages:");
const m7 = alertMessage({ kind: "mot_7", key: "k", alsoMark: [], days: 7 }, car(), "push");
check("MOT link goes to the booking wizard at step 3", m7.url, "https://www.freeplatecheck.co.uk/booking?type=mot&source=car-alert-mot-7-push#vrm=AB12CDE");
check("plate only in the fragment", m7.url.split("#")[0].includes("AB12CDE"), false);
check("title names the plate", m7.title, "MOT due in 7 days — AB12 CDE");
const v = alertMessage({ kind: "value", key: "k", alsoMark: [] }, car({ intent: "selling" }), "email");
check("value check links to the valuation, no partner link", v.url, "https://www.freeplatecheck.co.uk/value-my-car?src=car-alert-value-email#vrm=AB12CDE");
check("alert hand-offs get their own BMG clickref", bmgClickref("mot", "results", "car-alert-mot-7-push"), "booking-flow-mot-alert");
check("ordinary bookings keep theirs", bmgClickref("mot", "results", "results-banner"), "booking-flow-mot");

console.log("\nOpening an alert link:");
check("push MOT alert", parseAlertSource("car-alert-mot-7-push"), { kind: "mot_7", channel: "push" });
check("email value check", parseAlertSource("car-alert-value-email"), { kind: "value", channel: "email" });
check("welcome notification", parseAlertSource("car-saved-push"), { kind: "saved", channel: "push" });
check("the message's own source round-trips", parseAlertSource(m7.source), { kind: "mot_7", channel: "push" });
check("an ordinary CTA source is not an alert", parseAlertSource("results-banner"), null);
check("missing is null", parseAlertSource(null), null);

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll car-alert checks passed");
