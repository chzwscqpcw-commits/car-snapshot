"use client";

import { Fragment, useState } from "react";
import { ShieldCheck, Check, Minus, ArrowUpRight, ChevronDown } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel, isPartnerConfigured } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
import CarVerticalLogo from "@/components/CarVerticalLogo";

interface CarVerticalReportCTAProps {
  /** Vehicle reg, passed through for the affiliate link / clickref. */
  regNumber?: string;
  /** click_context + Awin clickref for attribution. */
  context?: string;
  /** Render even while the partner is still pending — for the password-gated mock-up. */
  preview?: boolean;
}

/** Free vs carVertical comparison rows (shown only when the user expands the
 *  compact CTA). `free` = also covered by Free Plate Check's free check. Keep
 *  factual (agreement 3.1); coordinate changes with carVertical (1.1/1.4). */
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

/**
 * Compact "full history report" CTA promoting carVertical's paid report at
 * buyer intent. Slim by default (heading + logo + one-line value + button); the
 * full free-vs-paid comparison table sits behind a "Free vs full check" toggle
 * to keep it short and mobile-sleek. Clear carVertical attribution (agreement
 * 1.3) + affiliate disclosure. Renders null until live unless `preview`.
 */
export default function CarVerticalReportCTA({
  regNumber,
  context = "report-carvertical",
  preview = false,
}: CarVerticalReportCTAProps) {
  const [showCompare, setShowCompare] = useState(false);
  const partner = PARTNER_LINKS.carVertical;
  if (!preview && !isPartnerConfigured(partner)) return null;

  const href = partner.buildLink ? partner.buildLink(regNumber ?? "", context) : partner.url;

  return (
    <div className="rounded-xl border border-[#1b54ff]/30 bg-gradient-to-br from-[#1b54ff]/10 to-slate-900/20 p-4 sm:p-5">
      {/* Heading + logo */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#1b54ff]" />
          <h3 className="truncate text-sm font-semibold text-white sm:text-base">
            Buying this car? Get the full history
          </h3>
        </div>
        <CarVerticalLogo className="shrink-0 text-xs" />
      </div>

      {/* One-line value */}
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
        Outstanding finance, write-offs, stolen markers &amp; mileage anomalies
        your free check can&apos;t show.
      </p>

      {/* CTA + compare toggle */}
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => trackPartnerClick("carVertical", context)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1b54ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1746e0] sm:w-auto"
        >
          Get a carVertical report <ArrowUpRight className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={() => setShowCompare((v) => !v)}
          aria-expanded={showCompare}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-600/70 bg-slate-800/40 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white sm:w-auto"
        >
          {showCompare ? "Hide comparison" : "Compare with free"}
          <ChevronDown className={`h-4 w-4 transition-transform ${showCompare ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Collapsible comparison table */}
      {showCompare && (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-700/50">
          <div className="grid grid-cols-[1fr_3.5rem_5rem] text-xs">
            <div className="bg-slate-800/70 px-3 py-2 font-medium text-slate-300">What you get</div>
            <div className="bg-slate-800/70 px-1 py-2 text-center font-medium text-slate-400">Free</div>
            <div className="bg-[#1b54ff]/15 px-1 py-2 text-center">
              <CarVerticalLogo className="text-[10px]" />
            </div>
            {ROWS.map((r, i) => (
              <Fragment key={r.label}>
                <div className={`px-3 py-1.5 text-slate-300 ${i % 2 ? "bg-slate-900/40" : ""}`}>{r.label}</div>
                <div className={`px-1 py-1.5 text-center ${i % 2 ? "bg-slate-900/40" : ""}`}>
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
            ))}
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
