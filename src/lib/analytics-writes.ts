/**
 * Should this deployment write analytics — `site_events` rows and GA4 hits?
 *
 * Only the production deployment does. `.env.local` points at the LIVE
 * Supabase project and the anon key can insert, so before 2026-10-11 every
 * local `next dev` / `next start` (and every Vercel preview) wrote real rows:
 * page views from a headless browser, `lookup` events, even partner clicks
 * through /go. One afternoon of local verification put 16 junk rows into the
 * data the placement and partner decisions are read from, and they had to be
 * deleted by hand.
 *
 * Telemetry only. Product writes (lookup cache, MOT reminders, contact
 * messages) are untouched — a local lookup still caches, a local form still
 * submits.
 *
 * Overrides: ANALYTICS_WRITES=1 forces writes on (to debug event plumbing
 * locally, knowingly against live data); ANALYTICS_WRITES=0 forces them off.
 */
export function analyticsWritesEnabled(): boolean {
  const override = process.env.ANALYTICS_WRITES;
  if (override === "1") return true;
  if (override === "0") return false;
  // VERCEL_ENV alone is NOT enough: `vercel env pull` writes
  // VERCEL_ENV="production" into .env.local, so a local server claims to be
  // production. VERCEL_URL is set by the platform on every real deployment
  // (build and runtime) and pulled as "" locally.
  return process.env.VERCEL_ENV === "production" && Boolean(process.env.VERCEL_URL);
}
