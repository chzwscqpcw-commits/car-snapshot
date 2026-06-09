"use client";

import { Fragment } from "react";
import { ShieldCheck, Check, Minus, ArrowUpRight } from "lucide-react";
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

/** Free vs carVertical comparison rows. `free` = also covered by Free Plate
 *  Check's free check; the rest are the paid-report extras. Keep factual
 *  (agreement 3.1) and coordinate any change with carVertical (1.1/1.4). */
const ROWS: { label: string; free: boolean }[] = [
  { label: "MOT history & advisories", free: true },
  { label: "Tax status & mileage record", free: true },
  { label: "Safety recalls & ULEZ", free: true },
  { label: "Valuation & running costs", free: true },
  { label: "Outstanding finance", free: false },
  { label: "Insurance write-off category", free: false },
  { label: "Stolen / cloned check", free: false },
  { label: "Mileage anomaly detection", free: false },
  { label: "Damage & accident records", free: false },
  { label: "Import / export & plate history", free: false },
];

/**
 * "Want the full history?" report CTA — a free-vs-paid comparison box that
 * promotes carVertical's paid vehicle-history report at buyer intent. Renders
 * null until the partner is live (isPartnerConfigured), unless `preview`. The
 * copy clearly attributes the report to carVertical (agreement 1.3) and carries
 * an affiliate disclosure.
 */
export default function CarVerticalReportCTA({
  regNumber,
  context = "report-carvertical",
  preview = false,
}: CarVerticalReportCTAProps) {
  const partner = PARTNER_LINKS.carVertical;
  if (!preview && !isPartnerConfigured(partner)) return null;

  const href = partner.buildLink ? partner.buildLink(regNumber ?? "", context) : partner.url;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/70 to-slate-900/20 p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[#1b54ff]" />
        <h3 className="text-base font-semibold text-white sm:text-lg">
          Want the full history on this car?
        </h3>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-slate-400">
        Your free check covers the official record. A{" "}
        <CarVerticalLogo className="text-sm" /> report adds the provenance the
        free check can&apos;t show — before you commit to buying.
      </p>

      {/* Comparison table */}
      <div className="overflow-hidden rounded-xl border border-slate-700/50">
        <div className="grid grid-cols-[1fr_4rem_5.5rem] text-xs">
          <div className="bg-slate-800/70 px-3 py-2.5 font-medium text-slate-300">
            What you get
          </div>
          <div className="bg-slate-800/70 px-2 py-2.5 text-center font-medium text-slate-400">
            Free
          </div>
          <div className="bg-[#1b54ff]/15 px-2 py-2.5 text-center">
            <CarVerticalLogo className="text-[11px]" />
          </div>
          {ROWS.map((r, i) => (
            <Fragment key={r.label}>
              <div className={`px-3 py-2 text-slate-300 ${i % 2 ? "bg-slate-900/40" : ""}`}>
                {r.label}
              </div>
              <div className={`px-2 py-2 text-center ${i % 2 ? "bg-slate-900/40" : ""}`}>
                {r.free ? (
                  <Check className="inline h-4 w-4 text-emerald-400" aria-label="included" />
                ) : (
                  <Minus className="inline h-4 w-4 text-slate-600" aria-label="not included" />
                )}
              </div>
              <div className="bg-[#1b54ff]/10 px-2 py-2 text-center">
                <Check className="inline h-4 w-4 text-[#7da2ff]" aria-label="included" />
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => trackPartnerClick("carVertical", context)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1b54ff] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1746e0]"
        >
          Get a carVertical report <ArrowUpRight className="h-4 w-4" />
        </a>
        <span className="text-xs text-slate-500">Full report · delivered instantly by carVertical</span>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        carVertical provides and sells this report. Free Plate Check may earn a
        commission — it never costs you more.
      </p>
    </div>
  );
}
