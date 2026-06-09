"use client";

import { Fragment, useState } from "react";
import { ShieldCheck, Gauge, Check, Minus, ArrowUpRight, ChevronDown } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel, isPartnerConfigured } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
import CarVerticalLogo from "@/components/CarVerticalLogo";

type Variant = "report" | "mileage";

interface CarVerticalReportCTAProps {
  /** Vehicle reg, passed through for the affiliate link / clickref. */
  regNumber?: string;
  /** click_context + Awin clickref for attribution. */
  context?: string;
  /** Render even while the partner is still pending — for the password-gated mock-up. */
  preview?: boolean;
  /** `report` = full free-vs-paid box (in-results); `mileage` = clocking-themed
   *  placement for the /mileage-check landing page. */
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

const VARIANTS: Record<
  Variant,
  {
    Icon: typeof ShieldCheck;
    heading: string;
    value: string;
    cta: string;
    open: string;
    close: string;
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
  },
  mileage: {
    Icon: Gauge,
    heading: "Worried this car's been clocked?",
    value:
      "Your free check lists every MOT mileage reading since 2005. carVertical's full history report goes further — cross-checking the National Mileage Register and European import records to flag rollbacks between tests or before import, alongside finance, write-off and theft checks.",
    cta: "Get the full carVertical report",
    open: "What else it covers",
    close: "Hide details",
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
}: CarVerticalReportCTAProps) {
  const [expanded, setExpanded] = useState(false);
  const partner = PARTNER_LINKS.carVertical;
  if (!preview && !isPartnerConfigured(partner)) return null;

  const cfg = VARIANTS[variant];
  const Icon = cfg.Icon;
  const href = partner.buildLink ? partner.buildLink(regNumber ?? "", context) : partner.url;

  return (
    <div className="rounded-xl border border-[#1b54ff]/30 bg-gradient-to-br from-[#1b54ff]/10 to-slate-900/20 p-4 sm:p-5">
      {/* Heading + logo */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-5 w-5 shrink-0 text-[#1b54ff]" />
          <h3 className="truncate text-sm font-semibold text-white sm:text-base">{cfg.heading}</h3>
        </div>
        <CarVerticalLogo className="shrink-0 text-xs" />
      </div>

      {/* One-line value */}
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:text-sm">{cfg.value}</p>

      {/* CTA + toggle */}
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => trackPartnerClick("carVertical", context)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1b54ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1746e0] sm:w-auto"
        >
          {cfg.cta} <ArrowUpRight className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-600/70 bg-slate-800/40 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white sm:w-auto"
        >
          {expanded ? cfg.close : cfg.open}
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Expandable detail */}
      {expanded && variant === "report" && (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-700/50">
          <div className="grid grid-cols-[1fr_3.5rem_5rem] text-xs">
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
