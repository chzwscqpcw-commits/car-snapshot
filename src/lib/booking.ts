/**
 * Booking-flow domain logic. Pure functions over the service-price JSON;
 * no React, no client state, no I/O. Imported by both the booking wizard
 * components and the smart-recommendation logic.
 */

import priceData from "@/data/service-prices.json";

// ── Types ────────────────────────────────────────────────────────────────────

export type ServiceType = "mot" | "interim" | "full" | "diagnostic";

export type VehicleCategory =
  | "small_petrol"
  | "small_diesel"
  | "medium_petrol"
  | "medium_diesel"
  | "large_petrol"
  | "large_diesel"
  | "premium"
  | "premium_large"
  | "ev_small"
  | "ev_medium"
  | "ev_premium";

export type FlexibilityChip = "asap" | "within_week" | "within_two_weeks" | "browsing";

export interface VehicleBasics {
  make?: string;
  model?: string;
  fuelType?: string;
  engineCapacity?: number;
  yearOfManufacture?: number;
}

export interface PriceRange {
  min: number;
  max: number;
  median?: number;
}

export interface RegionInfo {
  key: string;
  label: string;
  multiplier: number;
}

export interface ServiceMeta {
  summary: string;
  durationMins: number;
  includes: string[];
}

// ── Vehicle categorisation ───────────────────────────────────────────────────

const PREMIUM_MAKES = new Set(
  (priceData.categoryRules.premiumMakes as string[]).map((m) => m.toUpperCase()),
);
const LARGE_PREMIUM_MODELS = (priceData.categoryRules.largePremiumModels as string[]).map(
  (m) => m.toUpperCase(),
);
const EV_FUEL_TYPES = new Set(
  (priceData.categoryRules.evFuelTypes as string[]).map((f) => f.toUpperCase()),
);
const SMALL_MAX_CC = priceData.categoryRules.engineThresholds.smallMaxCc;
const LARGE_MIN_CC = priceData.categoryRules.engineThresholds.largeMinCc;

function isPremiumMake(make: string): boolean {
  return PREMIUM_MAKES.has(make.toUpperCase());
}

function isLargePremiumModel(make: string, model: string): boolean {
  const m = `${model}`.toUpperCase();
  // Model string from DVLA often contains the trim/variant — match against any
  // known large-premium token. Order: longest token first to prefer e.g.
  // "RANGE ROVER" over "ROVER".
  return LARGE_PREMIUM_MODELS.some((tok) => m.includes(tok));
}

export function categoriseVehicle(v: VehicleBasics): VehicleCategory {
  const fuel = (v.fuelType ?? "").toUpperCase();
  const make = (v.make ?? "").toUpperCase();
  const model = (v.model ?? "").toUpperCase();
  const cc = v.engineCapacity ?? 0;

  const isEv = EV_FUEL_TYPES.has(fuel);
  const isDiesel = fuel === "DIESEL";
  const isPremium = make ? isPremiumMake(make) : false;
  const isLargePremium = isPremium && make ? isLargePremiumModel(make, model) : false;

  if (isEv) {
    if (isPremium) return "ev_premium";
    if (cc > 0 && cc >= LARGE_MIN_CC) return "ev_medium"; // shouldn't really happen for EVs
    if (cc > 0 && cc <= SMALL_MAX_CC) return "ev_small";
    return "ev_medium";
  }

  if (isLargePremium) return "premium_large";
  if (isPremium) return "premium";

  if (cc > 0 && cc <= SMALL_MAX_CC) return isDiesel ? "small_diesel" : "small_petrol";
  if (cc > 0 && cc >= LARGE_MIN_CC) return isDiesel ? "large_diesel" : "large_petrol";
  return isDiesel ? "medium_diesel" : "medium_petrol";
}

// ── Region resolution from postcode ──────────────────────────────────────────

/**
 * Extract the alphabetic outcode prefix from a UK postcode (everything before
 * the first digit of the outcode). e.g. "SW1A 1AA" → "SW", "B33 8TH" → "B",
 * "EH1 2NG" → "EH". Tolerant of spacing and case.
 */
export function extractOutcodeArea(postcode: string): string {
  const cleaned = (postcode ?? "").trim().toUpperCase();
  const match = cleaned.match(/^([A-Z]{1,2})/);
  return match ? match[1] : "";
}

export function resolveRegion(postcode: string): RegionInfo {
  const area = extractOutcodeArea(postcode);
  if (area) {
    for (const [key, region] of Object.entries(priceData.regions)) {
      const r = region as { multiplier: number; label: string; outcodes: string[] };
      if (r.outcodes.includes(area)) {
        return { key, label: r.label, multiplier: r.multiplier };
      }
    }
  }
  // Default fallback when postcode is empty or unmatched. Multiplier 1.00.
  return { key: "default", label: "UK average", multiplier: 1.0 };
}

// ── Garage density estimate (Step 3 social proof) ────────────────────────────

export function estimateGarageDensity(postcode: string): { label: string; tier: "high" | "medium" | "low" } {
  const area = extractOutcodeArea(postcode);
  const density = priceData.garageDensity;
  if (area) {
    if (density.high.outcodePrefixes.includes(area)) return { label: density.high.label, tier: "high" };
    if (density.medium.outcodePrefixes.includes(area)) return { label: density.medium.label, tier: "medium" };
    if (density.low.outcodePrefixes.includes(area)) return { label: density.low.label, tier: "low" };
  }
  return { label: density.medium.label, tier: "medium" };
}

// ── Price calculation ───────────────────────────────────────────────────────

function applyMultiplier(range: PriceRange, mult: number): PriceRange {
  return {
    min: Math.round(range.min * mult),
    max: Math.round(range.max * mult),
    median: range.median != null ? Math.round(range.median * mult) : undefined,
  };
}

export function priceRangeFor(
  service: ServiceType,
  category: VehicleCategory,
  region: RegionInfo,
): PriceRange {
  if (service === "mot") {
    // MOT is regulated to £54.85 max — don't multiply by region; instead use
    // the band as published.
    return {
      min: priceData.mot.min,
      max: priceData.mot.max,
      median: priceData.mot.median,
    };
  }

  if (service === "diagnostic") {
    return applyMultiplier(
      { min: priceData.diagnostic.min, max: priceData.diagnostic.max, median: priceData.diagnostic.median },
      region.multiplier,
    );
  }

  const dataset =
    service === "interim" ? priceData.interimService.byCategory : priceData.fullService.byCategory;
  const categoryPrice = (dataset as Record<string, PriceRange>)[category];
  // Defensive default if a new category appears that's not in the data
  const base = categoryPrice ?? { min: 100, max: 200 };
  return applyMultiplier(base, region.multiplier);
}

// ── Service metadata ────────────────────────────────────────────────────────

export function serviceMeta(service: ServiceType): ServiceMeta {
  switch (service) {
    case "mot":
      return {
        summary: priceData.mot.summary,
        durationMins: priceData.mot.durationMins,
        includes: priceData.mot.includes,
      };
    case "interim":
      return {
        summary: priceData.interimService.summary,
        durationMins: priceData.interimService.durationMins,
        includes: priceData.interimService.includes,
      };
    case "full":
      return {
        summary: priceData.fullService.summary,
        durationMins: priceData.fullService.durationMins,
        includes: priceData.fullService.includes,
      };
    case "diagnostic":
      return {
        summary: priceData.diagnostic.summary,
        durationMins: priceData.diagnostic.durationMins,
        includes: priceData.diagnostic.includes,
      };
  }
}

// ── Smart recommendation ────────────────────────────────────────────────────

export interface RecommendationContext {
  motExpiryDate?: string; // ISO date or DD/MM/YYYY
  motStatus?: string;
  lastMotPassDate?: string; // ISO date
  recentAdvisoryCount?: number;
  recentFailureCount?: number;
  isOver3Years?: boolean;
}

/**
 * Pick the most relevant service type for the user based on the vehicle's
 * MOT history. Rule-based; no ML. Falls back to "full" as the safest
 * recommendation for anyone with a 3+ year-old car.
 */
export function recommendService(ctx: RecommendationContext): {
  service: ServiceType;
  reason: string;
} {
  if (!ctx.isOver3Years) {
    return { service: "interim", reason: "Modern car — a 6-month interim service keeps the warranty intact." };
  }

  // MOT urgency takes priority
  if (ctx.motStatus && ctx.motStatus !== "Valid") {
    return { service: "mot", reason: "Your MOT has expired — driving without one is illegal." };
  }

  if (ctx.motExpiryDate) {
    const expiry = new Date(ctx.motExpiryDate);
    if (!Number.isNaN(expiry.getTime())) {
      const daysUntil = Math.round((expiry.getTime() - Date.now()) / 86_400_000);
      if (daysUntil <= 30) {
        return { service: "mot", reason: `MOT due in ${Math.max(daysUntil, 0)} days — book it now to avoid lapsing.` };
      }
    }
  }

  if ((ctx.recentFailureCount ?? 0) > 0) {
    return {
      service: "diagnostic",
      reason: "Recent MOT failure — a diagnostic check pinpoints what needs fixing.",
    };
  }

  if ((ctx.recentAdvisoryCount ?? 0) >= 3) {
    return {
      service: "full",
      reason: `${ctx.recentAdvisoryCount} recent advisories — a full service typically addresses these.`,
    };
  }

  // Fallback: full service for the typical "responsible older car owner."
  return { service: "full", reason: "Annual full service is the standard recommendation for cars 3+ years old." };
}

// ── Utility: format a price range as a string ────────────────────────────────

export function formatPriceRange(p: PriceRange): string {
  return `£${p.min}–£${p.max}`;
}

// ── The saving ───────────────────────────────────────────────────────────────

export interface SavingsInfo {
  /** Cheapest typical quote. */
  min: number;
  /** Dearest typical quote — for the MOT this is the DVSA legal cap. */
  max: number;
  /** max − min: what shopping around is actually worth on this job. */
  spread: number;
  /** True only for the MOT, whose ceiling is set in law rather than by market. */
  isLegalCap: boolean;
}

/**
 * What comparing is worth, in pounds.
 *
 * The wizard has always shown a *range* and never named the *gap*, which is
 * the thing the page is actually selling. "£175–£295" asks the reader to do
 * the subtraction; "£120 between the cheapest and dearest quote" is the offer.
 *
 * Worth knowing which number to lead with: the MOT's spread is £19.85 against
 * a full service's £120, and at BookMyGarage's 5.06% the service is also worth
 * 4–5x the commission. The bigger saving and the better-paying job happen to be
 * the same one, which is a rare piece of luck — the honest pitch and the
 * profitable pitch point the same way.
 */
export function savingsFor(
  service: ServiceType,
  category: VehicleCategory,
  region: RegionInfo,
): SavingsInfo {
  const range = priceRangeFor(service, category, region);
  // Guard against float drift on the MOT's £54.85 cap.
  const spread = Math.round((range.max - range.min) * 100) / 100;
  return {
    min: range.min,
    max: range.max,
    spread,
    isLegalCap: service === "mot",
  };
}

/** "£120" / "£19.85" — pennies only when the figure genuinely has them. */
export function formatSaving(amount: number): string {
  return Number.isInteger(amount) ? `£${amount}` : `£${amount.toFixed(2)}`;
}

/**
 * One sentence naming the saving, phrased for the job in hand.
 *
 * The MOT gets its own wording because its ceiling is a legal maximum, not a
 * market high — saying "the legal maximum is £54.85 and garages start at £35"
 * is both more useful and more trustworthy than treating the cap as though it
 * were just an expensive garage.
 */
export function savingSentence(info: SavingsInfo): string {
  const spread = formatSaving(info.spread);
  if (info.isLegalCap) {
    return `The legal maximum is ${formatSaving(info.max)} — garages routinely charge from ${formatSaving(
      info.min,
    )}. Comparing is worth up to ${spread}.`;
  }
  return `${spread} between the cheapest and dearest typical quote for this job. Comparing is the only way to find out which you're being offered.`;
}

// ── Utility: human-readable flexibility ──────────────────────────────────────

export function flexibilityLabel(f: FlexibilityChip): string {
  switch (f) {
    case "asap":
      return "ASAP";
    case "within_week":
      return "Within a week";
    case "within_two_weeks":
      return "Within 2 weeks";
    case "browsing":
      return "Just browsing";
  }
}

// ── Utility: format service-type for human display ───────────────────────────

export function serviceLabel(s: ServiceType): string {
  switch (s) {
    case "mot":
      return "MOT test";
    case "interim":
      return "Interim service";
    case "full":
      return "Full service";
    case "diagnostic":
      return "Diagnostic check";
  }
}
