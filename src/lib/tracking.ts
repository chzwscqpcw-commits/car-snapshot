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
  // valuation_hero_reg_v1 CONCLUDED 2026-06-21 — treatment "b" (reg box in the
  // hero, above the fold) beat control "a" decisively: reg_search conversion
  // 39.0% → 52.8% (+35% relative, z=4.74, n=1,181 exposures). Variant b was
  // graduated to the permanent HeroRegSearch layout on /car-valuation AND
  // rolled out to /value-my-car. Historical events stay in Supabase.
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
/* ── Session shopping-signal helpers ─────────────────────────────────────────
 *
 * Two facts about carVertical clickers, measured over 307 clicks:
 *   · 31% had searched more than one registration BEFORE clicking.
 *   · 49% of those who bounced back searched a DIFFERENT car within minutes;
 *     none re-searched the one they had just clicked about.
 *
 * Someone comparing several cars is the only cohort on the site showing genuine
 * buying behaviour, and carVertical price for them explicitly — a single report
 * is £37.99, three are £20.99 each. These helpers let a placement notice that
 * pattern and pitch the pack instead of a single report.
 *
 * sessionStorage, not localStorage: this is about the shopping trip happening
 * right now, not a visitor who once looked at two cars in June.
 */
const SESSION_REGS_KEY = "session_regs_seen";
const CV_CLICK_KEY = "carvertical_clicked_at";

/** Record a registration the visitor has looked up this session (de-duped). */
export function recordSessionReg(vrm: string): void {
  if (typeof window === "undefined") return;
  const plate = (vrm ?? "").replace(/\s+/g, "").toUpperCase();
  if (!plate) return;
  try {
    const raw = sessionStorage.getItem(SESSION_REGS_KEY);
    const seen: string[] = raw ? JSON.parse(raw) : [];
    if (seen.includes(plate)) return;
    seen.push(plate);
    // Cap it — a bot or a very long session shouldn't grow this unbounded.
    sessionStorage.setItem(SESSION_REGS_KEY, JSON.stringify(seen.slice(-12)));
  } catch {
    /* storage disabled — the pack pitch simply never fires */
  }
}

/** How many DISTINCT registrations this session has looked up. */
export function getSessionRegCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(SESSION_REGS_KEY);
    return raw ? (JSON.parse(raw) as string[]).length : 0;
  } catch {
    return 0;
  }
}

/** Stamp the moment a visitor clicks out to carVertical. */
export function markCarVerticalClick(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CV_CLICK_KEY, String(Date.now()));
  } catch {
    /* no-op */
  }
}

/**
 * The raw click-out stamp, or null. Deliberately NOT "milliseconds since" —
 * this is read through useSyncExternalStore, whose snapshot has to be stable
 * between calls or React re-renders forever. Callers do their own arithmetic.
 *
 * Median real-world gap before the visitor reappears is ~72 seconds: they see
 * the £37.99 checkout and come straight back.
 */
export function getCarVerticalClickStamp(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(CV_CLICK_KEY);
  } catch {
    return null;
  }
}

/** Clear the stamp once the return prompt has been shown and acted on. */
export function clearCarVerticalClick(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CV_CLICK_KEY);
  } catch {
    /* no-op */
  }
}

export function trackConversion(
  conversionType: ConversionType,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;

  const payload: Record<string, unknown> = {
    conversion_type: conversionType,
    ...metadata,
  };

  // Every reg lookup on the site funnels through here, so this is the one place
  // the session's distinct-plate count can be kept without touching six
  // callsites (hero, homepage, compare, cost lookup, stats widget).
  if (conversionType === "reg_search" && typeof metadata?.vrm === "string") {
    recordSessionReg(metadata.vrm);
  }

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

/**
 * Record what the valuation tool actually told a user.
 *
 * WHY THIS EXISTS: the pipeline stored every INPUT to a valuation — the
 * depreciation estimate, the eBay median, the listing counts — in
 * `vehicle_valuations`, but never the OUTPUT. `combineValuationLayers` runs
 * client-side, so the server that wrote the row never saw the final figure,
 * and `combined_low`/`combined_high` were accepted by `writeCache` and never
 * passed. Result: 0 of 10,302 rows recorded what was shown to anyone, which is
 * why a systematic 1.85x overvaluation went unnoticed for six months.
 *
 * Emitting from the client is what closes that gap, since the client is where
 * the number is produced. Fire-and-forget via the standard beacon path, so a
 * telemetry failure can never affect the valuation the user sees.
 *
 * `conditionProvided` is the important field for analysis: filter to `false`
 * to measure the MODEL's output, uncontaminated by the user's own flattering
 * self-report of service history and bodywork.
 */
export function trackValuationResult(input: {
  surface: "tool" | "report";
  make?: string;
  model?: string;
  year?: number;
  age: number | null;
  mileage: number | null;
  newPrice: number | null;
  depEstimate: number | null;
  estimatedValue: number;
  rangeLow: number;
  rangeHigh: number;
  confidence: string;
  conditionProvided: boolean;
  ebayMedian: number | null;
  ebayListingCount: number;
  cacheMedian: number | null;
  marketcheckMedian: number | null;
  sources: string[];
}): void {
  trackEvent("valuation_result", {
    ...input,
    sources: input.sources.join(","),
    // Precomputed so the bias query is a plain average rather than a join:
    // >1 means the depreciation model read above the live market signal.
    dep_vs_market:
      input.depEstimate && input.ebayMedian
        ? Math.round((input.depEstimate / input.ebayMedian) * 100) / 100
        : null,
  });
}
