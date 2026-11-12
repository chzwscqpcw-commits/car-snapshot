import type { ReportInput } from "@/lib/generateReport";

// What the PDF report says when it was made while the MOT service was not
// answering. Shared by both report engines (the server-rendered one in
// lib/report-v2 and the jsPDF fallback in generateReport.ts) so they cannot
// tell different stories. Without this the report read as a car with "no MOT
// history yet", no mileage, and a health grade marked down for a quarter of
// its score that was simply missing.

/** True when the lookup behind this report got no answer from the MOT service. */
export function reportMotUnavailable(input: ReportInput): boolean {
  return input.data.motUnavailable === true && (input.data.motTests?.length ?? 0) === 0;
}

export const MOT_OUTAGE_TITLE = "MOT history unavailable today";

export const MOT_OUTAGE_BODY =
  "DVSA's MOT service was not answering when this report was made, so it has no test history, recorded mileage or health grade. Check the plate again later for the full report.";

/** The line under a valuation that was worked out on typical mileage for the car's age. */
export function estimatedMileageNote(assumedMileage?: number | null): string {
  const about = assumedMileage && assumedMileage > 0 ? `, about ${Math.round(assumedMileage).toLocaleString("en-GB")} miles` : "";
  return `MOT history was unavailable, so this value assumes typical mileage for its age${about}. Its real mileage could move the figure either way.`;
}

/**
 * The input both engines should render from: during an outage the health
 * score is dropped, because a quarter of it is the MOT history we don't have.
 */
export function withoutMotDependentScores(input: ReportInput): ReportInput {
  return reportMotUnavailable(input) ? { ...input, healthScore: null } : input;
}
