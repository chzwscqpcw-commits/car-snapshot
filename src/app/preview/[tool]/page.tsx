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

/**
 * Internal preview route. Renders a tool's Result component with the
 * fixture vehicle from src/lib/preview-data.ts so we can:
 *   1. Generate marketing screenshots via scripts/generate-previews.ts
 *   2. Eyeball each result UI without doing a real lookup
 *
 * Robots-noindex; not linked from the site. Each result is wrapped in a
 * #screenshot-target div so Puppeteer can find a clean clip region.
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

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const Result = RESULT_BY_SLUG[tool as (typeof PREVIEW_TOOL_SLUGS)[number]];
  if (!Result) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div
        id="screenshot-target"
        className="mx-auto max-w-md sm:max-w-lg lg:max-w-2xl"
      >
        <Result
          vrm={PREVIEW_VEHICLE.registrationNumber}
          previewVehicle={PREVIEW_VEHICLE}
        />
      </div>
    </div>
  );
}
