// The message a visitor sees when a plate lookup fails, shared by every
// component that calls /api/lookup.
//
// Why a helper: two different things can answer 429. The app's own
// per-instance limiter returns JSON ("Too many requests…"), but the Vercel
// Firewall rule "Rate limit plate lookups" (200 lookups per IP per hour,
// enforced from Oct 2026) answers before the app runs, with a body that
// isn't our JSON — so every caller fell through to its generic "Lookup
// failed — please try again in a moment", which invites the immediate retry
// that can't succeed. A 429 now says what happened, whichever layer sent it.

export const LOOKUP_RATE_LIMIT_MESSAGE =
  "You've looked up a lot of registrations in the last hour — please try again a little later.";

/** Message for a failed lookup: the rate-limit text for any 429, else the
 *  API's own `error`/`message`, else the caller's fallback. */
export function lookupErrorMessage(status: number, body: unknown, fallback: string): string {
  if (status === 429) return LOOKUP_RATE_LIMIT_MESSAGE;
  const b = body as { error?: unknown; message?: unknown } | null;
  if (typeof b?.error === "string" && b.error) return b.error;
  if (typeof b?.message === "string" && b.message) return b.message;
  return fallback;
}
