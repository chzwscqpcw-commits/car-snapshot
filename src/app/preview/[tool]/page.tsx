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
  searchParams: Promise<{ mot?: string }>;
}) {
  const { tool } = await params;
  const { mot } = await searchParams;
  const Result = RESULT_BY_SLUG[tool as (typeof PREVIEW_TOOL_SLUGS)[number]];
  if (!Result) notFound();
  const vehicle =
    mot === "down" || mot === "down-new" ? withoutMot(PREVIEW_VEHICLE, mot === "down") : PREVIEW_VEHICLE;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div
        id="screenshot-target"
        className="mx-auto max-w-md sm:max-w-lg lg:max-w-2xl"
      >
        <Result vrm={vehicle.registrationNumber} previewVehicle={vehicle} />
      </div>
    </div>
  );
}
