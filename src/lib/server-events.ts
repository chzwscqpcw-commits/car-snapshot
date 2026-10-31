import { supabaseServer } from "@/lib/supabaseServer";
import { analyticsWritesEnabled } from "@/lib/analytics-writes";
import { withoutPlate } from "@/lib/redact";

/**
 * Record a site_events row from the server (crons, API routes) the way
 * /api/event does for the browser: same table, same gate, no plates — the
 * payload is cleaned of PLATE_KEYS before it's stored. No ip_hash: there is
 * no visitor behind a cron.
 */
export async function recordServerEvent(type: string, metadata: Record<string, unknown>): Promise<void> {
  if (!analyticsWritesEnabled()) return;
  try {
    const { error } = await supabaseServer()
      .from("site_events")
      .insert({ event_type: type, metadata: withoutPlate(metadata), ip_hash: null });
    if (error) console.error(`[server-event] insert failed for ${type}:`, error.message);
  } catch (err) {
    console.error(`[server-event] ${type}:`, err instanceof Error ? err.message : err);
  }
}
