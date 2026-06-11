declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fire-and-forget mirror of an event to our own /api/event sink so it lands
 * in Supabase `site_events` for the admin dashboard. Independent of gtag so
 * ad-blockers blocking GA4 don't blank out our own telemetry — this is the
 * source of truth for /data-health funnel numbers; GA4 should be considered
 * sample-only since Brave/uBlock/Pi-hole reliably drop 30-60% of gtag hits.
 *
 * Prefer sendBeacon when available (it queues at the browser level and is
 * guaranteed-delivered even mid page-unload — critical for partner_click
 * events that fire immediately before navigation). Fall back to fetch with
 * keepalive when sendBeacon isn't supported or when the Blob fails (some
 * Safari versions return false from sendBeacon for CORS reasons even on
 * same-origin POSTs — the fetch keeps us covered).
 */
// ── Owner self-exclusion ─────────────────────────────────────────────────────
// A device-local flag (localStorage) the owner sets to stop their OWN testing
// from polluting the dashboard + experiments. When on, every mirrored event
// carries `internal: true`, which the admin stats route (and any experiment
// SQL) filters out. Toggle via the `?internal=1` / `?internal=0` URL param
// (handled in RouteAnalytics) or the toggle on /data-health.
const INTERNAL_TRAFFIC_KEY = "fpc:internal_traffic";

export function isInternalTraffic(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(INTERNAL_TRAFFIC_KEY) === "1";
  } catch {
    return false;
  }
}

export function setInternalTraffic(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) localStorage.setItem(INTERNAL_TRAFFIC_KEY, "1");
    else localStorage.removeItem(INTERNAL_TRAFFIC_KEY);
  } catch {
    /* localStorage unavailable — nothing to persist */
  }
}

function mirrorToServer(eventName: string, payload?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  // Tag the owner's own traffic so the dashboard can exclude it.
  const enriched = isInternalTraffic()
    ? { ...(payload ?? {}), internal: true }
    : payload ?? {};
  const body = JSON.stringify({ type: eventName, payload: enriched });

  // sendBeacon path: browser-queued, survives unload, no response handling.
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/event", blob)) {
        return;
      }
      // sendBeacon returned false → request not queued; fall through to fetch.
    } catch {
      // Blob constructor or sendBeacon threw → fall through to fetch.
    }
  }

  try {
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
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

// Registry of *running* experiments. Add a `KEY: "experiment_id"` entry to
// start a new A/B test; remove it to stand the experiment down (historical
// events stay in Supabase either way).
//
// Currently none running. mobile_search_cue_v1 concluded — variant C (bold
// block CTA) shipped as the permanent MobileSearchCue.
export const EXPERIMENTS: Record<string, string> = {
  // PDF download CTA copy test — control "Free report" vs "Get my report".
  // Conversion = pdf_download (auto-attributed via trackEvent for exposed
  // sessions). Note: at current traffic this needs weeks to reach significance.
  PDF_CTA: "pdf_cta_copy_v1",
  // Hero reg-box test on /car-valuation (the #1 organic entry page). Variant
  // "a" = control (today's layout: hero pitches, MobileSearchCue points down to
  // the reg box in the section below). Variant "b" = a reg box placed in the
  // hero itself, above the fold. Conversion = reg_search (auto-attributed via
  // trackConversion for exposed sessions). Measures whether an above-the-fold
  // search input lifts the share of exposed sessions that start a valuation.
  VALUATION_HERO_REG: "valuation_hero_reg_v1",
};

// ── A/B attribution model (three tiers) ─────────────────────────────────────
//
//   1. Assignment  — sticky per-visitor bucket in localStorage `experiment_<id>`.
//                    A visitor keeps the same variant across visits.
//   2. Exposure    — recorded in sessionStorage `experiment_<id>_exposed` the
//                    moment the visitor actually SEES the variant
//                    (trackExperimentImpression). Marks "this session was
//                    exposed" + which variant.
//   3. Attribution — conversions/events attach `exp_<id>` ONLY for sessions that
//                    were *exposed* (not merely bucketed), de-duped to once per
//                    session per event name.
//
// This is the fix for the mobile_search_cue_v1 leak: previously every search by
// a bucketed visitor counted — across pages and return visits — even if they
// never saw the cue, producing >100% "conversion rates". Now:
//   denominator = experiment_impression count (exposed sessions)
//   numerator   = conversions carrying exp_<id> (one per exposed session/type)
//   rate        = share of exposed sessions that converted (bounded ≤100%).

function experimentStorageKey(experimentId: string): string {
  return `experiment_${experimentId}`;
}
function exposureKey(experimentId: string): string {
  return `experiment_${experimentId}_exposed`;
}

/** Sticky assigned variant for a visitor (localStorage). This is the bucket;
 *  attribution keys off exposure, not this. */
export function getActiveExperimentVariant(experimentId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(experimentStorageKey(experimentId));
  } catch {
    return null;
  }
}

/**
 * Assign (or return the sticky) variant for an A/B test: buckets the visitor
 * randomly on first encounter and persists to localStorage so they keep the
 * same variant across visits. Pair with trackExperimentImpression on actual
 * visibility; conversions then auto-attribute via trackEvent/trackConversion.
 */
export function assignExperimentVariant(experimentId: string, variants: string[]): string {
  const existing = getActiveExperimentVariant(experimentId);
  if (existing && variants.includes(existing)) return existing;
  const variant = variants[Math.floor(Math.random() * variants.length)] ?? variants[0];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(experimentStorageKey(experimentId), variant);
    } catch {
      // localStorage unavailable — still return a variant for this render.
    }
  }
  return variant;
}

/** The variant THIS session was exposed to (saw an impression for), or null if
 *  the cue hasn't been seen this session. */
function getSessionExposure(experimentId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(exposureKey(experimentId));
  } catch {
    return null;
  }
}

/**
 * Attach the exposed variant of each running experiment to an event payload —
 * but only for experiments this session was actually exposed to (saw the cue),
 * never merely bucketed into. `dedupeKey` (a conversion/event name) records a
 * per-session marker so the same event is attributed at most once per exposed
 * session, keeping conversion rates bounded and interpretable.
 */
function attachExposedVariants(payload: Record<string, unknown>, dedupeKey?: string): void {
  if (typeof window === "undefined") return;
  for (const experimentId of Object.values(EXPERIMENTS)) {
    const variant = getSessionExposure(experimentId);
    if (!variant) continue; // exposure gate
    if (dedupeKey) {
      const k = `${exposureKey(experimentId)}_attr_${dedupeKey}`;
      try {
        if (sessionStorage.getItem(k)) continue; // already attributed this name this session
        sessionStorage.setItem(k, "1");
      } catch {
        // storage unavailable — fall through and attribute (better than dropping)
      }
    }
    payload[`exp_${experimentId}`] = variant;
  }
}

export function trackExperimentImpression(experimentId: string, variant: string): void {
  // Record exposure for this session so downstream conversions attribute only
  // to visitors who actually SAW the cue (tier 2 of the attribution model).
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(exposureKey(experimentId), variant);
    } catch {
      // sessionStorage unavailable (private mode etc.) — impression still fires.
    }
  }
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

  // Attribute to a variant only if this session was exposed to it; de-dupe per
  // conversion type so each exposed session counts at most once (≤100% rates).
  attachExposedVariants(payload, conversionType);

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

  // Exposure-gated, de-duped per event name (see attachExposedVariants).
  attachExposedVariants(payload, eventName);

  if (window.gtag) window.gtag("event", eventName, payload);
  mirrorToServer(eventName, payload);
}
