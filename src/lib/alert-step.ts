/**
 * What step two of the save card says about THIS car (the "dated" arm of the
 * save_alert_step_v1 test): its next date, when the reminders for it will
 * arrive, and what else a saved car gets. Pure functions, so the copy is
 * pinned by scripts/test-saved-cars.ts and can't drift from the schedule the
 * cron keeps (MOT_WINDOWS, TAX_WINDOW_DAYS, VALUE_INTERVAL_DAYS in
 * car-alerts.ts). A promise on the card that the cron doesn't keep is the
 * failure this file exists to prevent.
 */

import { MOT_WINDOWS, TAX_WINDOW_DAYS, daysUntil } from "@/lib/car-alerts";
import { alertsDescription, cleanIsoDate, type SaveIntent } from "@/lib/saved-cars";

/** The arms of save_alert_step_v1. "control" is the card as it shipped. */
export const ALERT_STEP_ARMS = ["control", "dated"] as const;
export type AlertStepArm = (typeof ALERT_STEP_ARMS)[number];

export interface NextCarDate {
  kind: "mot" | "tax";
  iso: string;
  /** Whole days from today; always 1 or more. */
  days: number;
}

const DAY = 86_400_000;

/**
 * The date the step leads with: the MOT when it has one ahead, otherwise the
 * tax. Not simply the sooner of the two. On real cars the tax date often
 * falls a little before the MOT, and the MOT is the reminder worth leading
 * with: nobody else sends one, while vehicle tax on Direct Debit renews
 * itself. (Found on the first two real vehicles tried; the fixtures all had
 * the MOT first.) The tax date still appears, in the step's second line.
 *
 * Only dates from tomorrow on count. The cron runs once a day in the
 * morning, so a date that is today (or past) gets no reminder, and the card
 * mustn't promise one.
 */
export function nextCarDate(
  car: { motExpiryDate?: string | null; taxDueDate?: string | null },
  now: Date,
): NextCarDate | null {
  for (const [kind, raw] of [["mot", car.motExpiryDate], ["tax", car.taxDueDate]] as const) {
    const iso = cleanIsoDate(raw);
    if (!iso) continue;
    const days = daysUntil(iso, now);
    if (days >= 1) return { kind, iso, days };
  }
  return null;
}

/** "14 March"; the year is added only when the date is most of a year away. */
export function dueDateLabel(iso: string, now: Date): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
  return daysUntil(iso, now) > 330 ? `${label} ${d.getUTCFullYear()}` : label;
}

/** The date `days` before an ISO date, as an ISO date. */
function daysBefore(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) - days * DAY).toISOString().slice(0, 10);
}

/** 35 -> "5 weeks", 7 -> "a week", 10 -> "10 days". */
function span(days: number): string {
  if (days % 7 !== 0) return `${days} days`;
  return days === 7 ? "a week" : `${days / 7} weeks`;
}

function away(days: number): string {
  return days === 1 ? "That's tomorrow." : `That's ${days} days away.`;
}

/** "a, b and c" */
function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** One stop on the card's little timeline of what arrives when. */
export interface TimelineStop {
  /** "7 May", "Today" */
  label: string;
  /** "Reminder" / "MOT due" / "Saved" */
  sub: string;
  kind: "start" | "reminder" | "due";
}

/** "7 May": the timeline's dates sit under a title that carries the year. */
function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/**
 * Today, each reminder still to come, then the date. A window already
 * reached when the car is saved is sent on the next morning's run, so the
 * line starts with that reminder instead of "Today".
 */
function timelineFor(iso: string, windows: readonly number[], days: number, dueLabel: string): TimelineStop[] {
  const ahead = windows.filter((w) => days > w);
  const first: TimelineStop =
    ahead.length === windows.length
      ? { label: "Today", sub: "Saved", kind: "start" }
      : { label: "Within a day", sub: "Reminder", kind: "reminder" };
  return [
    first,
    ...ahead.map((w): TimelineStop => ({ label: shortDate(daysBefore(iso, w)), sub: "Reminder", kind: "reminder" })),
    { label: shortDate(iso), sub: dueLabel, kind: "due" },
  ];
}

export interface AlertStepCopy {
  /** What the step leads with; rides on the experiment impression. */
  lead: "mot" | "tax" | "value" | "generic";
  /** The date it leads with (ISO), when it leads with one. */
  date: string | null;
  title: string;
  body: string;
  /** Everything else a saved car gets, in one line. Null on the generic step, whose body already lists it. */
  also: string | null;
  /** Reminder dates for the leading date; empty when there is nothing to draw. */
  timeline: TimelineStop[];
  pushCta: string;
  emailCta: string;
}

export interface AlertStepInput {
  /** The card's own variant: "value" leads with the monthly value check. */
  card: "alerts" | "value";
  /** "Ford Focus", for prose. */
  name?: string;
  motExpiryDate?: string | null;
  taxDueDate?: string | null;
  /** What the owner said about the car, if anything. */
  intent: SaveIntent | null;
  /** Will this save get the monthly value check? */
  valueCheck: boolean;
}

export function alertStepCopy(input: AlertStepInput, now: Date): AlertStepCopy {
  const next = nextCarDate(input, now);
  const mot = cleanIsoDate(input.motExpiryDate);
  const tax = cleanIsoDate(input.taxDueDate);
  const motAhead = mot && daysUntil(mot, now) >= 1 ? mot : null;
  const taxAhead = tax && daysUntil(tax, now) >= 1 ? tax : null;
  const recall = "an alert if a recall is issued";
  const worth = "a monthly check on what it's worth";

  // The value card: the monthly figure first, the dates as the rest.
  if (input.card === "value" && input.valueCheck) {
    const motPart = motAhead ? `the MOT (${dueDateLabel(motAhead, now)})` : "the MOT";
    const taxPart = taxAhead ? `the tax (${dueDateLabel(taxAhead, now)})` : "the tax";
    return {
      lead: "value",
      date: null,
      title: input.name ? `What your ${input.name} is worth, every month` : "What this car is worth, every month",
      // VALUE_INTERVAL_DAYS: never before the car has been saved four weeks.
      body: "A fresh figure each month, the first in about four weeks.",
      also: `Plus reminders before ${motPart} and ${taxPart} are due, and ${recall}. Nothing else.`,
      timeline: [],
      pushCta: "Notify me each month",
      emailCta: "Email me each month",
    };
  }

  if (!next) {
    return {
      lead: "generic",
      date: null,
      title: "Where should alerts go?",
      body: `We'll tell you ${alertsDescription(intentToStore(input.intent, input.valueCheck))}. Nothing else.`,
      also: null,
      timeline: [],
      pushCta: "Notify me on this device",
      emailCta: "Turn on alerts",
    };
  }

  const extras = (others: string[]) =>
    `Plus ${list([...others, recall, ...(input.valueCheck ? [worth] : [])])}. Nothing else.`;

  if (next.kind === "mot") {
    // Windows still ahead get a reminder on their day; one already reached
    // (saved at day 20: the 5-week one) is sent on the next morning's run.
    const ahead = MOT_WINDOWS.filter((w) => next.days > w);
    const body =
      ahead.length === MOT_WINDOWS.length
        ? `We'll remind you ${span(MOT_WINDOWS[0])} before, and again ${span(MOT_WINDOWS[1])} before.`
        : ahead.length
          ? `${away(next.days)} You'll get a reminder within a day, and another ${span(ahead[ahead.length - 1])} before.`
          : `${away(next.days)} You'll get a reminder within a day.`;
    return {
      lead: "mot",
      date: next.iso,
      title: `MOT due ${dueDateLabel(next.iso, now)}`,
      body,
      also: extras([taxAhead ? `a reminder before the tax is due on ${dueDateLabel(taxAhead, now)}` : "a reminder before the tax is due"]),
      timeline: timelineFor(next.iso, MOT_WINDOWS, next.days, "MOT due"),
      pushCta: "Remind me on this device",
      emailCta: "Remind me by email",
    };
  }

  const early = next.days > TAX_WINDOW_DAYS;
  return {
    lead: "tax",
    date: next.iso,
    title: `Tax due ${dueDateLabel(next.iso, now)}`,
    body: early ? `We'll remind you ${span(TAX_WINDOW_DAYS)} before.` : `${away(next.days)} You'll get a reminder within a day.`,
    also: extras([motAhead ? `reminders before the MOT is due on ${dueDateLabel(motAhead, now)}` : "reminders before the MOT is due"]),
    timeline: timelineFor(next.iso, [TAX_WINDOW_DAYS], next.days, "Tax due"),
    pushCta: "Remind me on this device",
    emailCta: "Remind me by email",
  };
}

/**
 * The plan to store with a save. The cron sends the monthly value check to
 * cars whose owner is selling or thinking about it, so asking for the value
 * check without having said either is stored as "thinking": the weakest
 * plan that switches the check on. A stated plan is never overwritten by it,
 * except "keeping", which the owner has just contradicted by asking.
 */
export function intentToStore(stated: SaveIntent | null, valueCheck: boolean): SaveIntent | null {
  if (stated === "selling" || stated === "thinking") return stated;
  return valueCheck ? "thinking" : stated;
}
