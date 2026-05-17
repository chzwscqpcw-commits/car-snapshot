declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPartnerClick(partnerId: string, context: string): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "partner_click", {
      partner_id: partnerId,
      click_context: context,
    });
  }
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
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "experiment_impression", {
      experiment_id: experimentId,
      variant,
    });
  }
}

export function trackExperimentClick(experimentId: string, variant: string): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "experiment_click", {
      experiment_id: experimentId,
      variant,
    });
  }
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
  if (typeof window === "undefined" || !window.gtag) return;

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

  window.gtag("event", "conversion", payload);
}
