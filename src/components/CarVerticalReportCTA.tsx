"use client";

import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ShieldCheck, Gauge, Check, Minus, ArrowUpRight, ChevronDown, Tag, BadgeCheck, Clock } from "lucide-react";
import {
  PARTNER_LINKS,
  getPartnerRel,
  isPartnerConfigured,
  CARVERTICAL_PRICING,
  carVerticalDiscountedSingle,
} from "@/config/partners";
import {
  trackPartnerClick,
  trackEvent,
  getSessionRegCount,
  markCarVerticalClick,
} from "@/lib/tracking";
import CarVerticalLogo from "@/components/CarVerticalLogo";
import PartnerTrust from "@/components/PartnerTrust";

/** The shopping signal can't change while this card is on screen. */
const NO_SUBSCRIBE = () => () => {};

type Variant = "report" | "mileage" | "seller" | "anomaly";

interface CarVerticalReportCTAProps {
  /** Vehicle reg, passed through for the affiliate link / clickref. */
  regNumber?: string;
  /** click_context + Awin clickref for attribution. */
  context?: string;
  /** Render even while the partner is still pending — for the password-gated mock-up. */
  preview?: boolean;
  /** Fire a `partner_impression` when this placement is actually scrolled into
   *  view, giving the placement's clicks a denominator.
   *
   *  Opt-in rather than automatic: the valuation placements render on ~2,500
   *  result views a week, and turning impressions on everywhere at once would
   *  multiply event volume for placements whose click counts are already
   *  readable. Switch it on per placement, when the question is "was this ever
   *  seen?" — which for the anomaly CTA is unanswerable without it. */
  trackImpression?: boolean;
  /** `report` = full free-vs-paid box (in-results); `mileage` = clocking-themed
   *  placement for the /mileage-check landing page; `seller` = pre-sale framing
   *  for owners valuing their own car; `anomaly` = resolution CTA attached to a
   *  detected mileage rollback. */
  variant?: Variant;
}

/** Free vs carVertical comparison rows (report variant). `free` = also covered by
 *  Free Plate Check's free check. Keep factual (agreement 3.1); coordinate changes
 *  with carVertical (1.1/1.4). */
const ROWS: { label: string; free: boolean }[] = [
  { label: "MOT history & advisories", free: true },
  { label: "Tax & mileage record", free: true },
  { label: "Recalls & ULEZ", free: true },
  { label: "Valuation & running costs", free: true },
  { label: "Outstanding finance", free: false },
  { label: "Write-off category", free: false },
  { label: "Stolen / cloned check", free: false },
  { label: "Mileage anomalies", free: false },
  { label: "Damage records", free: false },
  { label: "Import / export history", free: false },
];

/** Mileage variant detail. Lead with the mileage/odometer items (highlighted —
 *  what the MOT timeline alone can't cross-check), then list the rest of the
 *  report so it's clear this is a full history check, not a mileage-only tool.
 *  Keep factual (agreement 3.1). */
const MILEAGE_HIGHLIGHT: string[] = [
  "Odometer rollback & anomaly detection",
  "National Mileage Register cross-check",
  "Mileage from European import records",
];
const MILEAGE_ALSO: string[] = [
  "Damage & accident history",
  "Outstanding finance",
  "Insurance write-off category",
  "Stolen / cloned check",
  "Ownership & keeper history",
  "Market value estimate",
];

/** Accent tones. `rose` exists so the anomaly placement reads as the resolution
 *  of the red mileage alert it sits under, rather than an advert parked beside
 *  it. Full class strings — Tailwind can't see interpolated names. */
const TONES = {
  blue: {
    wrap: "border-[#1b54ff]/30 bg-gradient-to-br from-[#1b54ff]/10 to-slate-900/20",
    icon: "text-[#1b54ff]",
    button: "bg-[#1b54ff] hover:bg-[#1746e0]",
  },
  rose: {
    wrap: "border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-slate-900/20",
    icon: "text-rose-400",
    button: "bg-rose-600 hover:bg-rose-500",
  },
} as const;

const VARIANTS: Record<
  Variant,
  {
    Icon: typeof ShieldCheck;
    heading: string;
    value: string;
    cta: string;
    open: string;
    close: string;
    tone: keyof typeof TONES;
    /** Anomaly is a single decisive action — no "compare" affordance. */
    toggle: boolean;
  }
> = {
  report: {
    Icon: ShieldCheck,
    heading: "Buying this car? Get the full history",
    value:
      "Outstanding finance, write-offs, stolen markers & mileage anomalies your free check can't show.",
    cta: "Get a carVertical report",
    open: "Compare with free",
    close: "Hide comparison",
    tone: "blue",
    toggle: true,
  },
  /** Pre-sale framing for owners. 41% of our visitors land straight on a
   *  valuation page and are overwhelmingly valuing a car they already own — the
   *  `report` variant asks "Buying this car?" of exactly the wrong person, which
   *  is the checkout drop-off carVertical described on 2026-08-07.
   *
   *  Copy discipline (agreement 1.1, "not to act against carVertical
   *  interests"): promise proof and no surprises, never imply the owner is
   *  likely to find fraud on their own car. For most sellers the report finds
   *  nothing, and "nothing to find, in writing" is the thing being sold.
   *  Overstating it buys refunds, which costs carVertical more than a low
   *  conversion rate does. */
  seller: {
    Icon: BadgeCheck,
    heading: "Selling this car? See what a buyer will find",
    value:
      "Serious buyers run a history check before they commit. Knowing what yours shows — a settled finance agreement still sitting on the register, an old damage marker, a mileage flag — means no surprise mid-sale, and evidence behind your asking price.",
    cta: "See your car's record",
    open: "What a buyer sees",
    close: "Hide details",
    tone: "blue",
    toggle: true,
  },
  /** Attached to a detected rollback. Claims here deliberately reuse the wording
   *  already published in the `mileage` variant (National Mileage Register,
   *  European import records) rather than introducing new ones. */
  anomaly: {
    Icon: Clock,
    heading: "Find out which it is",
    value:
      "A drop between MOT tests is either a recording error or a car that's been clocked — the MOT record alone can't tell you which. carVertical's full history report cross-checks the National Mileage Register and European import records to trace rollbacks between tests or before import.",
    cta: "Trace this discrepancy",
    open: "",
    close: "",
    tone: "rose",
    toggle: false,
  },
  mileage: {
    Icon: Gauge,
    heading: "Worried this car's been clocked?",
    value:
      "Your free check lists every MOT mileage reading since 2005. carVertical's full history report goes further — cross-checking the National Mileage Register and European import records to flag rollbacks between tests or before import, alongside finance, write-off and theft checks.",
    cta: "Get the full carVertical report",
    open: "What else it covers",
    close: "Hide details",
    tone: "blue",
    toggle: true,
  },
};

/**
 * carVertical paid-report CTA, shown at buyer intent. Two variants:
 *  - `report` (default): the full free-vs-paid comparison box for the vehicle
 *    results page.
 *  - `mileage`: a clocking-themed placement for the /mileage-check landing page,
 *    leading with odometer-rollback detection (carVertical's flagship feature).
 * Slim by default; supporting detail sits behind a toggle to stay mobile-sleek.
 * Clear carVertical attribution (agreement 1.3) + affiliate disclosure. Renders
 * null until live unless `preview`.
 */
export default function CarVerticalReportCTA({
  regNumber,
  context = "report-carvertical",
  preview = false,
  variant = "report",
  trackImpression = false,
}: CarVerticalReportCTAProps) {
  const [expanded, setExpanded] = useState(false);

  // Is this visitor comparison-shopping? sessionStorage is client-only, so the
  // server snapshot is `false` and the single-report price is what renders until
  // hydration — the safe copy either way. useSyncExternalStore rather than
  // setState-in-an-effect so no lint rule needs suppressing; the value can't
  // change while the card is mounted, hence the no-op subscribe.
  const shopper = useSyncExternalStore(
    NO_SUBSCRIBE,
    () => getSessionRegCount() >= 2,
    () => false,
  );

  // Fire `partner_impression` once, when the card is 50% visible — the same
  // seen-not-just-mounted standard the experiment framework holds exposure to,
  // so an impression means a real chance to click rather than "rendered
  // somewhere below the fold". Never fires on the password-gated preview page,
  // which would otherwise pollute the denominator with our own review traffic.
  //
  // Hooks sit ABOVE the not-configured early return below — moving them under
  // it would make them conditional and break the rules of hooks.
  const cardRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(false);
  useEffect(() => {
    if (!trackImpression || preview || seenRef.current) return;
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seenRef.current) {
            seenRef.current = true;
            // `click_context` (not `impression_context`) on purpose: it's the
            // same key `partner_click` writes, so clicks and impressions group
            // and join on one field with no special-casing downstream.
            trackEvent("partner_impression", {
              partner_id: "carVertical",
              click_context: context,
              variant,
            });
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [trackImpression, preview, context, variant]);

  const partner = PARTNER_LINKS.carVertical;
  if (!preview && !isPartnerConfigured(partner)) return null;

  const cfg = VARIANTS[variant];
  const Icon = cfg.Icon;
  const tone = TONES[cfg.tone];
  const href = partner.buildLink ? partner.buildLink(regNumber ?? "", context) : partner.url;

  return (
    <div ref={cardRef} className={`rounded-xl border p-4 sm:p-5 ${tone.wrap}`}>
      {/* Heading + logo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon}`} />
          <h3 className="text-sm font-semibold text-white sm:text-base">{cfg.heading}</h3>
        </div>
        <CarVerticalLogo className="shrink-0 text-xs" />
      </div>

      {/* One-line value */}
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:text-sm">{cfg.value}</p>

      {/* PRICE, stated before the click.
          307 clicks analysed 2026-08-25: median 72 seconds between clicking out
          and reappearing here — long enough to see a checkout, not to buy. There
          was no price anywhere in this component, so every click was blind and
          £37.99 landed as a shock. We are paid per SALE, never per click, so
          losing the visitors who would never pay costs nothing.

          When the session has looked up two or more cars, the pack price leads
          instead: that visitor is comparison-shopping, and carVertical price for
          exactly them (£20.99/report in a three-pack vs £37.99 for one). */}
      <p className="mt-2.5 text-xs text-slate-300 sm:text-[13px]">
        {shopper ? (
          <>
            Checking a few cars?{" "}
            <strong className="font-semibold text-white">
              £{CARVERTICAL_PRICING.packOf3PerReport.toFixed(2)} per report
            </strong>{" "}
            in a three-report pack, or £{CARVERTICAL_PRICING.single.toFixed(2)} for a single
            car.
          </>
        ) : (
          <>
            <strong className="font-semibold text-white">
              £{CARVERTICAL_PRICING.single.toFixed(2)}
            </strong>{" "}
            for one report — {carVerticalDiscountedSingle()} with your code. Cheaper per car
            in a pack (£{CARVERTICAL_PRICING.packOf3PerReport.toFixed(2)} each for three).
          </>
        )}
      </p>

      {/* Discount badge — the freeplatecheck voucher (20% off) auto-applies via the
          tracking link AND is shown as a visible code, so it still credits us on
          direct / word-of-mouth visits and survives ad-blockers that strip click
          tracking (coupon attributes either way — confirmed by carVertical 2026-06-12). */}
      <p className="mt-2 inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
        <Tag className="h-3 w-3 shrink-0" aria-hidden />
        {CARVERTICAL_PRICING.discountPct}% off with code
        <span className="font-mono font-bold tracking-wide text-emerald-200">freeplatecheck</span>
        — applied automatically via our link
      </p>

      {/* CTA + toggle */}
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => {
            markCarVerticalClick();
            trackPartnerClick("carVertical", context);
          }}
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors sm:w-auto ${tone.button}`}
        >
          {cfg.cta} <ArrowUpRight className="h-4 w-4" />
        </a>
        {cfg.toggle && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-600/70 bg-slate-800/40 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white sm:w-auto"
          >
            {expanded ? cfg.close : cfg.open}
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <PartnerTrust partner="carVertical" className="mt-2.5" />

      {/* Expandable detail */}
      {/* Seller reuses the report's comparison table unchanged — it's already
          coordinated copy (agreement 1.1), and "what's in the paid report" is
          the same answer whichever side of the sale you're on. */}
      {expanded && (variant === "report" || variant === "seller") && (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-700/50">
          <div className="grid grid-cols-[1fr_3.5rem_6rem] text-xs">
            <div className="bg-slate-800/70 px-3 py-2 font-medium text-slate-300">What you get</div>
            <div className="bg-slate-800/70 px-1 py-2 text-center font-medium text-slate-400">Free</div>
            <div className="bg-[#1b54ff]/15 px-1 py-2 text-center">
              <CarVerticalLogo className="text-[10px]" />
            </div>
            {ROWS.map((r, i) => {
              const firstExtra = !r.free && (ROWS[i - 1]?.free ?? false);
              const rowBg = r.free ? (i % 2 ? "bg-slate-900/40" : "") : "bg-[#1b54ff]/[0.07]";
              return (
                <Fragment key={r.label}>
                  {firstExtra && (
                    <div className="col-span-3 border-t border-[#1b54ff]/25 bg-[#1b54ff]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#7da2ff]">
                      Only in the full report
                    </div>
                  )}
                  <div className={`px-3 py-1.5 ${r.free ? "text-slate-400" : "font-medium text-slate-100"} ${rowBg}`}>{r.label}</div>
                  <div className={`px-1 py-1.5 text-center ${rowBg}`}>
                    {r.free ? (
                      <Check className="inline h-3.5 w-3.5 text-emerald-400" aria-label="included" />
                    ) : (
                      <Minus className="inline h-3.5 w-3.5 text-slate-600" aria-label="not included" />
                    )}
                  </div>
                  <div className="bg-[#1b54ff]/10 px-1 py-1.5 text-center">
                    <Check className="inline h-3.5 w-3.5 text-[#7da2ff]" aria-label="included" />
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}

      {expanded && variant === "mileage" && (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-700/50">
          {/* Highlighted — the mileage/odometer cross-checks */}
          <div className="bg-[#1b54ff]/[0.10] p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#7da2ff]">
              Mileage &amp; odometer
            </p>
            <ul className="space-y-1.5">
              {MILEAGE_HIGHLIGHT.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs font-medium text-slate-100">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7da2ff]" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          {/* The rest of the report */}
          <div className="border-t border-slate-700/50 bg-slate-900/30 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Plus everything else in the report
            </p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {MILEAGE_ALSO.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className="mt-2.5 text-[11px] text-slate-500">
        carVertical provides and sells this report. We may earn a commission — it
        never costs you more.
      </p>
    </div>
  );
}
