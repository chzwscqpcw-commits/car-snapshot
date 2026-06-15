/**
 * No-email MOT reminder: add "Book your MOT" events to the user's calendar so
 * they can set a reminder WITHOUT handing over an email. Free Plate Check's
 * audience self-selects for "no email" (the #1 query is "free car valuation
 * without email"), so a calendar option captures the majority who skip the form.
 *
 * KEY DESIGN: the events are placed ON the reminder dates (e.g. 5 weeks + 1 week
 * before expiry), NOT on the expiry date with notification offsets. Google's and
 * Outlook's "add event" links can't carry a custom reminder time — they'd just
 * use the user's default — so an event-on-expiry-with-alarm silently loses the
 * 5-week nudge. Placing the event on the reminder date itself works identically
 * across Google, Outlook and Apple. The picker's offsets drive which dates.
 *
 * The events link to the booking page pre-loaded for MOT, so the reminder fires
 * at peak intent and drives a booking (attributable via source=calendar_reminder).
 * Three add paths: Google + Outlook web (one click, no file) and a universal
 * .ics download (Apple / desktop Outlook) — which carries one event per offset.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** All-day date stamp, YYYYMMDD (local calendar date). */
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

/** Readable expiry, e.g. "30 Nov 2026". */
function expiryLabel(expiryISO: string): string {
  return new Date(expiryISO).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** The date a reminder should land: `offsetDays` before expiry. */
function reminderDate(expiryISO: string, offsetDays: number): Date {
  const d = new Date(expiryISO);
  d.setDate(d.getDate() - offsetDays);
  return d;
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

/** Is the expiry a usable future date? (No point reminding for a past date.) */
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

function summary(reg: string, expiryISO: string): string {
  return `Book MOT: ${reg} (due ${expiryLabel(expiryISO)})`;
}

function description(reg: string, expiryISO: string): string {
  return `Your MOT for ${reg} is due ${expiryLabel(expiryISO)}. Book now - you can test up to a month early and keep this renewal date. Compare local prices and book: ${motBookingUrl(reg)}`;
}

/** Only reminders whose date is still in the future (skip past ones). */
function futureOffsets(expiryISO: string, offsets: number[]): number[] {
  const now = Date.now();
  const future = offsets.filter((o) => reminderDate(expiryISO, o).getTime() > now);
  // If every offset is already past (expiry very near), fall back to "today".
  return future.length ? future.sort((a, b) => b - a) : [0];
}

/** Build a universal .ics with one all-day "Book MOT" event per reminder date. */
export function buildMotIcs(reg: string, expiryISO: string, offsets: number[]): string {
  const stamp = icsStamp(new Date());
  const events = futureOffsets(expiryISO, offsets).map((days) => {
    const start = reminderDate(expiryISO, days);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return [
      "BEGIN:VEVENT",
      `UID:mot-${reg}-${icsDate(new Date(expiryISO))}-${days}@freeplatecheck.co.uk`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(start)}`,
      `DTEND;VALUE=DATE:${icsDate(end)}`,
      fold(`SUMMARY:${summary(reg, expiryISO)}`),
      fold(`DESCRIPTION:${description(reg, expiryISO)}`),
      fold(`URL:${motBookingUrl(reg)}`),
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      fold(`DESCRIPTION:Time to book ${reg}'s MOT - test early to keep your renewal date`),
      "TRIGGER:PT9H",
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Free Plate Check//MOT Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
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

/** Google Calendar template URL — single event on the earliest reminder date. */
export function googleCalendarUrl(reg: string, expiryISO: string, offsets: number[]): string {
  const earliest = Math.max(...futureOffsets(expiryISO, offsets));
  const start = reminderDate(expiryISO, earliest);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: summary(reg, expiryISO),
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details: description(reg, expiryISO),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Outlook.com / Office 365 web deeplink — single event on the earliest reminder date. */
export function outlookCalendarUrl(reg: string, expiryISO: string, offsets: number[]): string {
  const earliest = Math.max(...futureOffsets(expiryISO, offsets));
  const start = reminderDate(expiryISO, earliest);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: summary(reg, expiryISO),
    body: description(reg, expiryISO),
    startdt: ymd(start),
    enddt: ymd(end),
    allday: "true",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
