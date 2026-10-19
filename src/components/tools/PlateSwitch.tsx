"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { usePlate } from "@/lib/plate-url";
import MotReminderBanner from "@/components/MotReminderBanner";
import CarVerticalReportCTA from "@/components/CarVerticalReportCTA";

// Each result loads only on the page that shows it — a static import of all
// nine here would put every tool's code on every tool page.
const MotResult = dynamic(() => import("@/components/tools/MotResult"));
const MileageResult = dynamic(() => import("@/components/tools/MileageResult"));
const TaxResult = dynamic(() => import("@/components/tools/TaxResult"));
const UlezResult = dynamic(() => import("@/components/tools/UlezResult"));
const RecallResult = dynamic(() => import("@/components/tools/RecallResult"));
const ValuationResult = dynamic(() => import("@/components/tools/ValuationResult"));
const RunningCostsResult = dynamic(() => import("@/components/tools/RunningCostsResult"));
const ExemptionResult = dynamic(() => import("@/components/tools/ExemptionResult"));
const BuyerReport = dynamic(() => import("@/components/buyer/BuyerReport"));

const FOOTER = "border-t border-slate-800/60 bg-slate-900/40";
const FOOTER_TEXT = "mx-auto max-w-3xl px-4 py-6 text-center text-xs text-slate-500";

/** What each tool page shows for a plate — moved from the pages' old
 *  server-side `?vrm=` branches unchanged. */
const RESULTS = {
  mot: (vrm: string) => (
    <>
      <MotResult vrm={vrm} />
      <MotReminderBanner />
    </>
  ),
  mileage: (vrm: string) => (
    <>
      <MileageResult vrm={vrm} />
      {/* High-intent: they've just seen the mileage records — offer the full
          history check (clocking/rollback) right here. */}
      <div className="mx-auto max-w-3xl px-4 -mt-2 pb-10">
        <CarVerticalReportCTA variant="mileage" context="mileage-result-carvertical" regNumber={vrm} />
      </div>
      <MotReminderBanner />
    </>
  ),
  tax: (vrm: string) => (
    <>
      <TaxResult vrm={vrm} />
      <div className={FOOTER}>
        <div className={FOOTER_TEXT}>
          Tax status comes from the DVLA&#39;s live VED database. VED rate is estimated from current
          GOV.UK bands — your renewal letter is the authoritative figure.
        </div>
      </div>
      <MotReminderBanner />
    </>
  ),
  ulez: (vrm: string) => (
    <>
      <UlezResult vrm={vrm} />
      <MotReminderBanner />
    </>
  ),
  recall: (vrm: string) => (
    <>
      <RecallResult vrm={vrm} />
      <MotReminderBanner />
    </>
  ),
  valuation: (vrm: string) => (
    <>
      <ValuationResult vrm={vrm} />
      <MotReminderBanner />
    </>
  ),
  runningCosts: (vrm: string) => <RunningCostsResult vrm={vrm} />,
  exemption: (vrm: string) => (
    <>
      <ExemptionResult vrm={vrm} />
      <div className={FOOTER}>
        <div className={FOOTER_TEXT}>
          Dates are calculated from the DVLA build year and first-registration date. Whether a
          vehicle has been substantially changed is a self-declaration on form V112 — check GOV.UK
          if you&apos;re unsure.
        </div>
      </div>
    </>
  ),
  buyer: (vrm: string) => <BuyerReport vrm={vrm} />,
} satisfies Record<string, (vrm: string) => ReactNode>;

export type PlateTool = keyof typeof RESULTS;

/**
 * A tool page's two faces. With a plate in the address (#vrm=, or a legacy
 * ?vrm= link) it shows that tool's result; without one, the server-rendered
 * landing content passed as children. The landing stays in the server HTML
 * either way — crawlers and the no-JS case always get it — and is hidden by
 * CSS before first paint when a plate is present (see the head script in
 * layout.tsx), so a result link doesn't flash the landing page first.
 */
export default function PlateSwitch({ tool, children }: { tool: PlateTool; children: ReactNode }) {
  const vrm = usePlate();
  if (vrm) return RESULTS[tool](vrm);
  return <div data-plate-landing="">{children}</div>;
}
