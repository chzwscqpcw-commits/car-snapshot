/**
 * Is this the live production deployment?
 *
 * VERCEL_ENV alone can't say: `vercel env pull` writes VERCEL_ENV="production"
 * into .env.local, so a local server claims to be production. VERCEL_URL is
 * set by the platform on every real deployment and pulled as "" locally (the
 * same test analyticsWritesEnabled uses).
 *
 * Preview deployments, local servers and CI are all "not live": that is where
 * the preview-only switches (e.g. the simulated MOT outage) are allowed.
 */
export function isLiveProduction(): boolean {
  return process.env.VERCEL_ENV === "production" && Boolean(process.env.VERCEL_URL);
}

/** Cookie that turns on the simulated MOT outage. Ignored in live production. */
export const MOT_OUTAGE_COOKIE = "fpc_sim_mot";

/**
 * "known": the MOT call fails, and a car we have looked up before keeps the
 * model we saved (what most repeat visitors would see).
 * "new": as above, but as if we had never seen the car, so the visitor is
 * asked which model it is.
 */
export type MotOutageSimulation = "known" | "new";

/** The simulation a request asks for, or null. Always null in live production. */
export function simulatedMotOutage(cookieHeader: string | null): MotOutageSimulation | null {
  if (isLiveProduction()) return null;
  const match = new RegExp(`(?:^|;\\s*)${MOT_OUTAGE_COOKIE}=(known|new)(?:;|$)`).exec(cookieHeader ?? "");
  return match ? (match[1] as MotOutageSimulation) : null;
}
