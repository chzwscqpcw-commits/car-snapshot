/**
 * No-email MOT reminder: build a calendar event for the expiry date so people
 * can set a reminder WITHOUT handing over an email. Free Plate Check's audience
 * self-selects for "no email" (the #1 query is "free car valuation without
 * email"), so a calendar option captures the majority who skip the email form.
 *
 * The chosen reminder offsets (days before expiry) become VALARM triggers in the
 * .ics, so the same timing picker drives both the email schedule and the
 * calendar alerts. (Google Calendar's URL template can't carry custom alarms, so
 * that fallback uses the user's default notification.)
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** All-day date stamp, YYYYMMDD (local calendar date of the expiry). */
function icsDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

/** UTC timestamp for DTSTAMP. */
function icsStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours(),
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** Is the expiry a usable future date? (No point adding a past/empty date.) */
export function canAddToCalendar(expiryISO?: string): boolean {
  if (!expiryISO) return false;
  const d = new Date(expiryISO);
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
}

const DESC =
  "Your MOT is due. You can test up to a month early and keep this renewal date. Check the history and compare prices free at https://www.freeplatecheck.co.uk";

/** Build a universal .ics for the MOT expiry, with an alarm per chosen offset. */
export function buildMotIcs(reg: string, expiryISO: string, offsets: number[]): string {
  const start = new Date(expiryISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 1); // all-day DTEND is exclusive

  const alarms = [...offsets]
    .sort((a, b) => b - a)
    .map(
      (days) =>
        `BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:MOT for ${reg} due in ${days} days — book early to keep your renewal date\r\nTRIGGER:-P${days}D\r\nEND:VALARM`,
    )
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Free Plate Check//MOT Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:mot-${reg}-${icsDate(start)}@freeplatecheck.co.uk`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:MOT due — ${reg}`,
    `DESCRIPTION:${DESC}`,
    "TRANSP:TRANSPARENT",
    alarms,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/** Trigger a browser download of the .ics (Apple Calendar / Outlook / most). */
export function downloadIcs(reg: string, expiryISO: string, offsets: number[]): void {
  const ics = buildMotIcs(reg, expiryISO, offsets);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mot-reminder-${reg}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Google Calendar template URL (opens pre-filled; uses the user's default alarm). */
export function googleCalendarUrl(reg: string, expiryISO: string): string {
  const start = new Date(expiryISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `MOT due — ${reg}`,
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details: DESC,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
