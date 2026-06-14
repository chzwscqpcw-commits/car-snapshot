/**
 * Shared MOT-reminder timing model. Reminders are sent N days before MOT
 * expiry, where N is one of a user-chosen set of "offsets". The fast signup
 * path uses DEFAULT_OFFSETS; the optional picker lets users tailor them.
 *
 * Why 35 (5 weeks) as the early default: you can have an MOT done up to one
 * calendar month before expiry and KEEP your existing renewal date. A reminder
 * at 35 days lands just before that window opens, giving time to shop around
 * and book the early test without losing any days. The old fixed 28-day first
 * reminder was inside that window — too late to benefit.
 */

export const DEFAULT_OFFSETS = [35, 7];

/** Picker options (days before expiry). Default pre-selects 5 weeks + 1 week. */
export const OFFSET_OPTIONS: { days: number; label: string }[] = [
  { days: 35, label: "5 weeks" },
  { days: 30, label: "1 month" },
  { days: 14, label: "2 weeks" },
  { days: 7, label: "1 week" },
];

/** Longest lead time we'll ever send — bounds the cron's query window. */
export const MAX_OFFSET_DAYS = 60;

/**
 * Validate an arbitrary input into a clean offset set: integers in [1, 180],
 * de-duped, sorted longest-first, capped at 4. Falls back to the default when
 * empty or not an array, so a malformed request never stores an empty schedule.
 */
export function sanitizeOffsets(input: unknown): number[] {
  if (!Array.isArray(input)) return [...DEFAULT_OFFSETS];
  const cleaned = Array.from(
    new Set(
      input
        .map((n) => Math.round(Number(n)))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 180),
    ),
  ).sort((a, b) => b - a);
  return cleaned.length ? cleaned.slice(0, 4) : [...DEFAULT_OFFSETS];
}

/** Human label for an offset, e.g. 35 → "5 weeks", 7 → "1 week", 10 → "10 days". */
export function offsetLabel(days: number): string {
  const found = OFFSET_OPTIONS.find((o) => o.days === days);
  if (found) return found.label;
  if (days % 7 === 0) {
    const weeks = days / 7;
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Render a schedule as prose, e.g. [35,7] → "5 weeks and 1 week before". */
export function describeSchedule(offsets: number[]): string {
  const labels = [...offsets].sort((a, b) => b - a).map(offsetLabel);
  if (labels.length === 1) return `${labels[0]} before`;
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]} before`;
}

/** Reminder email subject — urgent tone inside the final week. */
export function reminderSubject(
  daysRemaining: number,
  vrm: string,
  make: string,
  model: string,
): string {
  if (daysRemaining <= 7) {
    return `⚠️ MOT expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} — ${vrm}`;
  }
  return `MOT due in ${daysRemaining} days — ${vrm} (${make} ${model})`;
}
