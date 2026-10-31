/**
 * Shared rules for a saved car ("My Cars" with alerts) — used by the save
 * card, /api/saved-cars and, from PR 2, the alert cron. Pure functions only,
 * so both the browser and the server can import this file.
 */

/** What the owner told us about the car. The value check goes to the first two. */
export const SAVE_INTENTS = ["selling", "thinking", "keeping"] as const;
export type SaveIntent = (typeof SAVE_INTENTS)[number];

export const INTENT_LABELS: Record<SaveIntent, string> = {
  selling: "Selling",
  thinking: "Thinking about it",
  keeping: "Keeping",
};

/** Where a save came from — the card's `surface` prop, verbatim in car_saved. */
export const SAVE_SURFACES = ["results", "valuation-result", "home-valuation"] as const;
export type SaveSurface = (typeof SAVE_SURFACES)[number];

export const SAVE_CHANNELS = ["email", "push"] as const;
export type SaveChannel = (typeof SAVE_CHANNELS)[number];

export function cleanIntent(input: unknown): SaveIntent | null {
  return typeof input === "string" && (SAVE_INTENTS as readonly string[]).includes(input)
    ? (input as SaveIntent)
    : null;
}

export function cleanSurface(input: unknown): SaveSurface | null {
  return typeof input === "string" && (SAVE_SURFACES as readonly string[]).includes(input)
    ? (input as SaveSurface)
    : null;
}

/** "ab12 cde" -> "AB12CDE"; null when it can't be a UK plate. */
export function cleanVrm(input: unknown): string | null {
  const v = typeof input === "string" ? input.replace(/[^A-Za-z0-9]/g, "").toUpperCase() : "";
  return /^[A-Z0-9]{2,7}$/.test(v) ? v : null;
}

export function cleanEmail(input: unknown): string | null {
  const e = typeof input === "string" ? input.trim().toLowerCase() : "";
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/** "2027-03-14" -> same; anything else (including "") -> null. */
export function cleanIsoDate(input: unknown): string | null {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  return Number.isNaN(Date.parse(input)) ? null : input;
}

/**
 * Addresses verification scripts use, so they never reach the real table or
 * get a confirmation email. Same rule as the MOT reminder route.
 */
export function isTestEmail(email: string): boolean {
  const e = email.toLowerCase();
  return (
    e.startsWith("verify-test+") ||
    e.endsWith("@example.com") ||
    e.endsWith("@example.org") ||
    e.endsWith("@example.net") ||
    e.endsWith("@test.invalid")
  );
}

/** "FORD FOCUS" from a make and model, or "" when neither is known. */
export function makeModelLabel(make?: string | null, model?: string | null): string {
  return [make, model].filter((s) => typeof s === "string" && s.trim()).join(" ").trim();
}

/** The alerts a saved car gets, as a sentence for the card and the email. */
export function alertsDescription(intent: SaveIntent | null): string {
  const base = "5 weeks and 1 week before the MOT is due, when the tax is due, and if a recall is issued";
  return intent === "selling" || intent === "thinking"
    ? `${base} — plus a monthly check on what it's worth`
    : base;
}
