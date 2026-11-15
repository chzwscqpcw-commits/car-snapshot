import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TaxResult from "@/components/tools/TaxResult";
import MotResult from "@/components/tools/MotResult";
import MileageResult from "@/components/tools/MileageResult";
import UlezResult from "@/components/tools/UlezResult";
import RecallResult from "@/components/tools/RecallResult";
import ValuationResult from "@/components/tools/ValuationResult";
import RunningCostsResult from "@/components/tools/RunningCostsResult";
import { PREVIEW_VEHICLE, PREVIEW_TOOL_SLUGS } from "@/lib/preview-data";
import type { LookupVehicle } from "@/components/tools/shared";
import type { WbacTopArm } from "@/lib/wbac-top-test";

/**
 * Internal preview route. Renders a tool's Result component with the
 * fixture vehicle from src/lib/preview-data.ts so we can:
 *   1. Generate marketing screenshots via scripts/generate-previews.ts
 *   2. Eyeball each result UI without doing a real lookup
 *
 * Robots-noindex; not linked from the site. Each result is wrapped in a
 * #screenshot-target div so Puppeteer can find a clean clip region.
 *
 * ?mot=down shows the fixture as /api/lookup returns it when the MOT service
 * did not answer (no tests, no mileage); ?mot=down-new is the same for a car
 * we have never looked up, which has no model either. No lookup is made.
 *
 * /preview/car-valuation?wbac=top draws arm "top" of valuation_wbac_top_v1
 * (We Buy Any Car as a strip inside the valuation card); ?wbac=control, or
 * nothing, draws today's layout. The links under the result switch between
 * them. A preview is never bucketed and records nothing for the test.
 */

export const metadata: Metadata = {
  title: "Preview · Free Plate Check",
  robots: { index: false, follow: false },
};

const RESULT_BY_SLUG: Record<
  (typeof PREVIEW_TOOL_SLUGS)[number],
  React.ComponentType<{ vrm: string; previewVehicle?: typeof PREVIEW_VEHICLE }>
> = {
  "tax-check": TaxResult,
  "mot-check": MotResult,
  "mileage-check": MileageResult,
  "ulez-check": UlezResult,
  "recall-check": RecallResult,
  "car-valuation": ValuationResult,
  "running-costs": RunningCostsResult,
};

/** The fixture with its MOT half missing, as during an MOT service outage. */
function withoutMot(vehicle: LookupVehicle, knownModel: boolean): LookupVehicle {
  const { motTests: _tests, motStatus: _status, motExpiryDate: _expiry, model, ...dvlaOnly } = vehicle;
  return { ...dvlaOnly, ...(knownModel ? { model } : {}), motUnavailable: true };
}

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ tool: string }>;
  searchParams: Promise<{ mot?: string; wbac?: string }>;
}) {
  const { tool } = await params;
  const { mot, wbac } = await searchParams;
  const Result = RESULT_BY_SLUG[tool as (typeof PREVIEW_TOOL_SLUGS)[number]];
  if (!Result) notFound();
  const vehicle =
    mot === "down" || mot === "down-new" ? withoutMot(PREVIEW_VEHICLE, mot === "down") : PREVIEW_VEHICLE;
  const wbacArm: WbacTopArm = wbac === "top" ? "top" : "control";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div
        id="screenshot-target"
        className="mx-auto max-w-md sm:max-w-lg lg:max-w-2xl"
      >
        {tool === "car-valuation" ? (
          <ValuationResult
            vrm={vehicle.registrationNumber}
            previewVehicle={vehicle}
            previewWbacArm={wbacArm}
          />
        ) : (
          <Result vrm={vehicle.registrationNumber} previewVehicle={vehicle} />
        )}
      </div>
      {/* Outside #screenshot-target, so the marketing screenshots never carry it. */}
      {tool === "car-valuation" && (
        <nav
          aria-label="We Buy Any Car position test"
          className="mx-auto flex max-w-md flex-wrap items-center gap-2 px-4 pb-10 text-xs text-slate-400 sm:max-w-lg lg:max-w-2xl"
        >
          <span>We Buy Any Car position test:</span>
          {(
            [
              ["control", "Control (card under the chip)"],
              ["top", "Variant (strip inside the valuation card)"],
            ] as const
          ).map(([arm, label]) => (
            <a
              key={arm}
              href={`?wbac=${arm}${mot ? `&mot=${encodeURIComponent(mot)}` : ""}`}
              aria-current={arm === wbacArm ? "page" : undefined}
              className={`rounded-full border px-3 py-1.5 ${
                arm === wbacArm
                  ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
