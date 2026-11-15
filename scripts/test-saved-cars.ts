/**
 * The rules a saved car ("My Cars" with alerts) is validated by, on both the
 * card and /api/saved-cars — src/lib/saved-cars.ts.
 */
import {
  alertsDescription,
  cleanEmail,
  cleanIntent,
  cleanIsoDate,
  cleanSurface,
  cleanVrm,
  isTestEmail,
  makeModelLabel,
} from "../src/lib/saved-cars";
import { alertStepCopy, dueDateLabel, intentToStore, nextCarDate } from "../src/lib/alert-step";
import { MOT_WINDOWS, TAX_WINDOW_DAYS, VALUE_INTERVAL_DAYS, dueAlerts, type SavedCarRow } from "../src/lib/car-alerts";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
}

console.log("\nPlates:");
check("spaces and case", cleanVrm("ab12 cde"), "AB12CDE");
check("too short", cleanVrm("A"), null);
check("too long", cleanVrm("ABCD1234"), null);
check("not a string", cleanVrm(12), null);

console.log("\nEmail:");
check("trimmed and lowercased", cleanEmail("  Jane@Example.COM "), "jane@example.com");
check("no domain", cleanEmail("jane@"), null);
check("example.com is a test address", isTestEmail("jane@example.com"), true);
check("verify-test prefix is a test address", isTestEmail("verify-test+1@gmail.com"), true);
check("real address is not", isTestEmail("jane@gmail.com"), false);

console.log("\nIntent and surface:");
check("selling", cleanIntent("selling"), "selling");
check("thinking", cleanIntent("thinking"), "thinking");
check("keeping", cleanIntent("keeping"), "keeping");
check("anything else is null", cleanIntent("SELLING"), null);
check("results surface", cleanSurface("results"), "results");
check("unknown surface is null", cleanSurface("footer"), null);

console.log("\nDates:");
check("ISO date kept", cleanIsoDate("2027-03-14"), "2027-03-14");
check("timestamp rejected", cleanIsoDate("2027-03-14T00:00:00Z"), null);
check("impossible date rejected", cleanIsoDate("2027-13-45"), null);
check("empty is null", cleanIsoDate(""), null);
check("undefined is null", cleanIsoDate(undefined), null);

console.log("\nCopy:");
check("make + model", makeModelLabel("FORD", "FOCUS"), "FORD FOCUS");
check("make only", makeModelLabel("TESLA", undefined), "TESLA");
check("nothing known", makeModelLabel(null, "  "), "");
check("keeping gets no value check", alertsDescription("keeping").includes("worth"), false);
check("no intent gets no value check", alertsDescription(null).includes("worth"), false);
check("selling gets the value check", alertsDescription("selling").includes("worth"), true);
check("thinking gets the value check", alertsDescription("thinking").includes("worth"), true);

// ── The dated alerts step (save_alert_step_v1): what the card promises ──
// Invented dates throughout; "today" is fixed so the copy can be pinned.
const NOW = new Date("2026-11-15T10:00:00Z");
const base = { card: "alerts" as const, name: "Ford Focus", intent: null, valueCheck: false };

console.log("\nNext date:");
check("the MOT leads, even when the tax falls sooner", nextCarDate({ motExpiryDate: "2027-06-11", taxDueDate: "2026-12-01" }, NOW)?.kind, "mot");
check("tax leads when there is no MOT date", nextCarDate({ taxDueDate: "2026-12-01" }, NOW)?.kind, "tax");
check("a past MOT is not led with", nextCarDate({ motExpiryDate: "2026-11-01", taxDueDate: "2027-02-01" }, NOW)?.kind, "tax");
check("a date that is today gets no reminder, so no lead", nextCarDate({ motExpiryDate: "2026-11-15" }, NOW), null);
check("tomorrow still counts", nextCarDate({ motExpiryDate: "2026-11-16" }, NOW)?.days, 1);
check("nothing known", nextCarDate({}, NOW), null);
check("junk is ignored", nextCarDate({ motExpiryDate: "14/03/2027", taxDueDate: "" }, NOW), null);
check("date without a year when it's soon", dueDateLabel("2027-03-14", NOW), "14 March");
check("year added when most of a year off", dueDateLabel("2027-11-10", NOW), "10 November 2027");

console.log("\nDated step, MOT months away:");
const far = alertStepCopy({ ...base, motExpiryDate: "2027-03-14", taxDueDate: "2027-04-01" }, NOW);
check("leads with the MOT", far.lead, "mot");
check("title is the date", far.title, "MOT due 14 March");
check("promises both reminders", far.body, "We'll remind you 5 weeks before, and again a week before.");
check("timeline: today, two reminders, the date", far.timeline.map((t) => `${t.label}/${t.sub}`).join(" · "), "Today/Saved · 7 Feb/Reminder · 7 Mar/Reminder · 14 Mar/MOT due");
check("the rest in one line", far.also, "Plus a reminder before the tax is due on 1 April and an alert if a recall is issued. Nothing else.");
check("button says what it does", far.pushCta, "Remind me on this device");

console.log("\nDated step, MOT inside the 5-week window:");
const near = alertStepCopy({ ...base, motExpiryDate: "2026-12-05" }, NOW);
check("says how far off", near.body, "That's 20 days away. You'll get a reminder within a day, and another a week before.");
check("timeline starts with that reminder", near.timeline.map((t) => t.label).join(" · "), "Within a day · 28 Nov · 5 Dec");
const week = alertStepCopy({ ...base, motExpiryDate: "2026-11-19" }, NOW);
check("inside the last week: one reminder", week.body, "That's 4 days away. You'll get a reminder within a day.");
check("tomorrow", alertStepCopy({ ...base, motExpiryDate: "2026-11-16" }, NOW).body, "That's tomorrow. You'll get a reminder within a day.");

console.log("\nDated step, no MOT date ahead (a new car, or an MOT that has run out):");
const tax = alertStepCopy({ ...base, taxDueDate: "2026-12-01" }, NOW);
check("leads with the tax", tax.title, "Tax due 1 December");
check("one reminder", tax.body, "We'll remind you a week before.");
check("MOT in the rest, without a date", tax.also, "Plus reminders before the MOT is due and an alert if a recall is issued. Nothing else.");
check("timeline", tax.timeline.map((t) => t.label).join(" · "), "Today · 24 Nov · 1 Dec");
check("an expired MOT is not given a date either", alertStepCopy({ ...base, motExpiryDate: "2026-10-01", taxDueDate: "2026-11-20" }, NOW).body, "That's 5 days away. You'll get a reminder within a day.");
check("tax sooner than the MOT: it is named in the second line", alertStepCopy({ ...base, motExpiryDate: "2027-06-11", taxDueDate: "2026-12-01" }, NOW).also, "Plus a reminder before the tax is due on 1 December and an alert if a recall is issued. Nothing else.");

console.log("\nDated step, no date / value card:");
const none = alertStepCopy({ ...base }, NOW);
check("falls back to today's heading", none.title, "Where should alerts go?");
check("and today's sentence", none.body, `We'll tell you ${alertsDescription(null)}. Nothing else.`);
check("no timeline to draw", none.timeline.length, 0);
const value = alertStepCopy({ ...base, card: "value", valueCheck: true, motExpiryDate: "2027-03-14" }, NOW);
check("value card leads with the value check", value.title, "What your Ford Focus is worth, every month");
check("dates become the rest", value.also, "Plus reminders before the MOT (14 March) and the tax are due, and an alert if a recall is issued. Nothing else.");
check("a keeper on the value card gets the date instead", alertStepCopy({ ...base, card: "value", intent: "keeping", motExpiryDate: "2027-03-14" }, NOW).lead, "mot");
check("ticking the value check adds it to the rest", alertStepCopy({ ...base, valueCheck: true, motExpiryDate: "2027-03-14" }, NOW).also?.includes("a monthly check on what it's worth"), true);
check("without the name", alertStepCopy({ ...base, name: undefined, card: "value", valueCheck: true }, NOW).title, "What this car is worth, every month");

console.log("\nThe copy against the cron's schedule:");
// The sentences above say "5 weeks", "a week" and "about four weeks". If the
// schedule moves, these fail before the card can promise the old one.
check("MOT windows are 35 and 7 days", MOT_WINDOWS.join(","), "35,7");
check("tax window is 7 days", TAX_WINDOW_DAYS, 7);
check("first value check after 28 days", VALUE_INTERVAL_DAYS, 28);
const row = (over: Partial<SavedCarRow>): SavedCarRow =>
  ({ mot_expiry: null, tax_due: null, intent: null, alerts_sent: {}, recall_count: null, created_at: NOW.toISOString(), updated_at: NOW.toISOString(), ...over }) as SavedCarRow;
const at = (iso: string) => new Date(`${iso}T08:30:00Z`);
check("far MOT: nothing the next morning", dueAlerts(row({ mot_expiry: "2027-03-14" }), at("2026-11-16"), null).length, 0);
check("…the 5-week reminder on the timeline's first date", dueAlerts(row({ mot_expiry: "2027-03-14" }), at("2027-02-07"), null)[0]?.kind, "mot_35");
check("…the 1-week reminder on its second", dueAlerts(row({ mot_expiry: "2027-03-14", alerts_sent: { "mot_35:2027-03-14": "x" } }), at("2027-03-07"), null)[0]?.kind, "mot_7");
check("near MOT: a reminder within a day", dueAlerts(row({ mot_expiry: "2026-12-05" }), at("2026-11-16"), null)[0]?.kind, "mot_35");
check("MOT tomorrow: still reminded", dueAlerts(row({ mot_expiry: "2026-11-16" }), at("2026-11-16"), null)[0]?.kind, "mot_7");
check("MOT today when saved: nothing tomorrow (so never led with)", dueAlerts(row({ mot_expiry: "2026-11-15" }), at("2026-11-16"), null).length, 0);
check("tax: reminded a week before", dueAlerts(row({ tax_due: "2026-12-01" }), at("2026-11-24"), null)[0]?.kind, "tax");
check("tax: not before", dueAlerts(row({ tax_due: "2026-12-01" }), at("2026-11-23"), null).length, 0);

console.log("\nThe plan stored with a save:");
check("stated plan kept", intentToStore("selling", true), "selling");
check("nothing said, value check asked for", intentToStore(null, true), "thinking");
check("nothing said, not asked for", intentToStore(null, false), null);
check("keeping, not asked for", intentToStore("keeping", false), "keeping");
check("keeping, then asked for the value check", intentToStore("keeping", true), "thinking");
check("…which is what makes the cron send it", dueAlerts(row({ intent: intentToStore(null, true), created_at: "2026-10-01T00:00:00Z" }), NOW, null)[0]?.kind, "value");

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll saved-car checks passed");
