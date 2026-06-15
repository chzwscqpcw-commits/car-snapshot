/**
 * No-email MOT reminder: build a calendar event for the expiry date so people
 * can set a reminder WITHOUT handing over an email. Free Plate Check's audience
 * self-selects for "no email" (the #1 query is "free car valuation without
 * email"), so a calendar option captures the majority who skip the email form.
 *
 * The chosen reminder offsets (days before expiry) become VALARM triggers in the
 * .ics, so the same timing picker drives both the email schedule and the
 * calendar alerts. The event links to the booking page pre-loaded for MOT —
 * so the reminder, firing weeks later at peak intent, drives a booking (and is
 * attributable via source=calendar_reminder). Three add paths are offered:
 * Google + Outlook web (one click, no file) and a universal .ics download
 * (Apple Calendar / desktop Outlook, which need the file handoff).
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** All-day date stamp, YYYYMMDD (local calendar date of the expiry). */
function icsDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

/** ISO date, YYYY-MM-DD (for the Outlook deeplink). */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** UTC timestamp for DTSTAMP. */
function icsStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours(),
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** iCalendar line folding: wrap lines >75 octets with CRLF + space. */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length > 0) {
    parts.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return parts.join("\r\n");
}

/** Is the expiry a usable future date? (No point adding a past/empty date.) */
export function canAddToCalendar(expiryISO?: string): boolean {
  if (!expiryISO) return false;
  const d = new Date(expiryISO);
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
}

/** Booking page pre-loaded for MOT — the action link the reminder points at. */
export function motBookingUrl(reg: string): string {
  return `https://www.freeplatecheck.co.uk/booking?vrm=${encodeURIComponent(
    reg,
  )}&type=mot&source=calendar_reminder`;
}

function summary(reg: string): string {
  return `MOT due: ${reg}`;
}

function description(reg: string): string {
  return `Time to book ${reg}'s MOT. You can test up to a month early and keep this renewal date. Compare local prices and book: ${motBookingUrl(reg)}`;
}

/** Build a universal .ics for the MOT expiry, with an alarm per chosen offset. */
export function buildMotIcs(reg: string, expiryISO: string, offsets: number[]): string {
  const start = new Date(expiryISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 1); // all-day DTEND is exclusive

  const alarms = [...offsets]
    .sort((a, b) => b - a)
    .map((days) =>
      [
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        fold(`DESCRIPTION:MOT for ${reg} due in ${days} days - book early to keep your renewal date`),
        `TRIGGER:-P${days}D`,
        "END:VALARM",
      ].join("\r\n"),
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
    fold(`SUMMARY:${summary(reg)}`),
    fold(`DESCRIPTION:${description(reg)}`),
    fold(`URL:${motBookingUrl(reg)}`),
    "TRANSP:TRANSPARENT",
    alarms,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/** Trigger a browser download of the .ics (Apple Calendar / desktop Outlook). */
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
    text: summary(reg),
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details: description(reg),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Outlook.com / Office 365 web deeplink (opens pre-filled; no file). */
export function outlookCalendarUrl(reg: string, expiryISO: string): string {
  const start = new Date(expiryISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: summary(reg),
    body: description(reg),
    startdt: ymd(start),
    enddt: ymd(end),
    allday: "true",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
