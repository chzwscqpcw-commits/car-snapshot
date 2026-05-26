declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fire-and-forget mirror of an event to our own /api/event sink so it lands
 * in Supabase `site_events` for the admin dashboard. Independent of gtag so
 * ad-blockers blocking GA4 don't blank out our own telemetry. `keepalive`
 * lets the request survive page unload — important for partner_click events
 * that fire immediately before the user navigates away.
 */
function mirrorToServer(eventName: string, payload?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: eventName, payload: payload ?? {} }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Swallow — telemetry must never break the user-facing flow.
  }
}

export function trackPartnerClick(partnerId: string, context: string): void {
  const payload = { partner_id: partnerId, click_context: context };
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "partner_click", payload);
  }
  mirrorToServer("partner_click", payload);
}

// Registry of running experiments. Keep keys here so conversion tracking can
// look up the active variant for each experiment a visitor has been bucketed into.
export const EXPERIMENTS = {
  MOBILE_SEARCH_CUE: "mobile_search_cue_v1",
} as const;

function experimentStorageKey(experimentId: string): string {
  return `experiment_${experimentId}`;
}

export function getActiveExperimentVariant(experimentId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(experimentStorageKey(experimentId));
  } catch {
    return null;
  }
}

export function trackExperimentImpression(experimentId: string, variant: string): void {
  const payload = { experiment_id: experimentId, variant };
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "experiment_impression", payload);
  }
  mirrorToServer("experiment_impression", payload);
}

export function trackExperimentClick(experimentId: string, variant: string): void {
  const payload = { experiment_id: experimentId, variant };
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "experiment_click", payload);
  }
  mirrorToServer("experiment_click", payload);
}

export type ConversionType = "reg_search" | "mot_reminder";

/**
 * Fire a generic conversion event. Automatically attaches any active experiment
 * variants the visitor has been bucketed into, so we can attribute conversions
 * to a specific variant in GA4.
 */
export function trackConversion(
  conversionType: ConversionType,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;

  const payload: Record<string, unknown> = {
    conversion_type: conversionType,
    ...metadata,
  };

  // Attach any active experiment variants. As more experiments are added to
  // EXPERIMENTS, iterate them all so the conversion event carries every
  // active variant for the visitor.
  for (const experimentId of Object.values(EXPERIMENTS)) {
    const variant = getActiveExperimentVariant(experimentId);
    if (variant) {
      payload[`exp_${experimentId}`] = variant;
    }
  }

  if (window.gtag) window.gtag("event", "conversion", payload);

  // Mirror under the conversion_type so site_events stays queryable by
  // semantic event name (reg_search / mot_reminder) rather than a single
  // generic "conversion" bucket.
  mirrorToServer(conversionType, payload);
}

/**
 * Fire a non-conversion lifecycle event (form views, submit attempts, errors,
 * section visibility, etc.). Use this for funnel-stage measurement that isn't
 * itself a conversion. Active experiment variants are attached automatically
 * so funnel events can be sliced by variant in GA4.
 */
export function trackEvent(
  eventName: string,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;

  const payload: Record<string, unknown> = { ...metadata };

  for (const experimentId of Object.values(EXPERIMENTS)) {
    const variant = getActiveExperimentVariant(experimentId);
    if (variant) {
      payload[`exp_${experimentId}`] = variant;
    }
  }

  if (window.gtag) window.gtag("event", eventName, payload);
  mirrorToServer(eventName, payload);
}
