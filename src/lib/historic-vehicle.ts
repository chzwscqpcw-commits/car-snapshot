/**
 * Historic-vehicle status: the two 40-year exemptions, which are NOT the same
 * rule and are routinely conflated.
 *
 *   MOT exemption  — applies from the vehicle's 40th birthday (rolling, since
 *                    20 May 2018). Conditional on no "substantial changes" in
 *                    the last 30 years.
 *   Historic VED   — applies from 1 APRIL, and only once the vehicle was built
 *                    before 1 January of the year 40 years prior. So a car can
 *                    be MOT-exempt for up to ~15 months before it stops paying
 *                    vehicle tax.
 *
 * That gap is the single most useful thing this tool tells an owner, and the
 * thing every "is my car exempt?" forum thread gets wrong.
 *
 * NOTE ON NAMING: `isMotExempt` in mot-readiness.ts is a DIFFERENT concept — it
 * means "under 3 years old, hasn't needed its first MOT yet". Opposite end of
 * the age range. Don't wire the two together.
 *
 * We cannot determine "substantial changes" from DVLA data — it is a
 * self-declaration the keeper makes on form V112 — so every result here is
 * phrased as ELIGIBILITY, never as a confirmed exemption.
 */

export type HistoricStatus = {
  /** Year the vehicle was built (or first registered, if build year is absent). */
  buildYear: number | null;
  /** True once the 40th anniversary has passed. */
  motExemptEligible: boolean;
  /** The 40th anniversary itself. */
  motExemptFrom: Date | null;
  /** Whole years until MOT exemption; 0 or negative once eligible. */
  yearsUntilMotExempt: number | null;
  /** True once the applicable 1 April has passed AND the build-year test is met. */
  vedHistoricEligible: boolean;
  /** The 1 April on which the historic tax class becomes claimable. */
  vedHistoricFrom: Date | null;
  /** Days between the two milestones, while the vehicle sits in the gap. */
  daysInExemptionGap: number | null;
};

const MOT_EXEMPT_AGE_YEARS = 40;

/**
 * Prefer the first-registration date (DVLA gives month precision) and fall back
 * to year of manufacture at 1 January. Registration is what DVLA's own records
 * key on, and for the overwhelming majority of vehicles the two agree.
 */
function referenceDate(v: {
  yearOfManufacture?: number | null;
  monthOfFirstRegistration?: string | null;
}): { date: Date; year: number } | null {
  const m = v.monthOfFirstRegistration;
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    if (y > 1800 && mo >= 1 && mo <= 12) return { date: new Date(y, mo - 1, 1), year: y };
  }
  const y = v.yearOfManufacture;
  if (y && y > 1800) return { date: new Date(y, 0, 1), year: y };
  return null;
}

export function getHistoricStatus(
  vehicle: { yearOfManufacture?: number | null; monthOfFirstRegistration?: string | null },
  now: Date = new Date(),
): HistoricStatus {
  const ref = referenceDate(vehicle);
  if (!ref) {
    return {
      buildYear: null,
      motExemptEligible: false,
      motExemptFrom: null,
      yearsUntilMotExempt: null,
      vedHistoricEligible: false,
      vedHistoricFrom: null,
      daysInExemptionGap: null,
    };
  }

  // ── MOT: the 40th anniversary of the reference date.
  const motExemptFrom = new Date(ref.date);
  motExemptFrom.setFullYear(motExemptFrom.getFullYear() + MOT_EXEMPT_AGE_YEARS);
  const motExemptEligible = now >= motExemptFrom;

  // ── VED: "built before 1 January (Y − 40)" becomes claimable on 1 April of Y.
  // Solving for the first qualifying Y gives Y = buildYear + 41. Worked example:
  // a 1985 car satisfies "before 1 Jan 1986" for Y = 2026, so 1 April 2026 —
  // and 1985 + 41 = 2026.
  const vedHistoricFrom = new Date(ref.year + MOT_EXEMPT_AGE_YEARS + 1, 3, 1);
  const vedHistoricEligible = now >= vedHistoricFrom;

  const msPerDay = 86_400_000;
  const yearsUntilMotExempt = Math.ceil(
    (motExemptFrom.getTime() - now.getTime()) / (msPerDay * 365.25),
  );

  // Only meaningful while the vehicle sits between the two milestones.
  const daysInExemptionGap =
    motExemptEligible && !vedHistoricEligible
      ? Math.ceil((vedHistoricFrom.getTime() - now.getTime()) / msPerDay)
      : null;

  return {
    buildYear: ref.year,
    motExemptEligible,
    motExemptFrom,
    yearsUntilMotExempt: motExemptEligible ? 0 : yearsUntilMotExempt,
    vedHistoricEligible,
    vedHistoricFrom,
    daysInExemptionGap,
  };
}

/** Approaching = within 5 years, which is when planning starts to matter. */
export function isApproachingExemption(s: HistoricStatus): boolean {
  return (
    !s.motExemptEligible &&
    s.yearsUntilMotExempt !== null &&
    s.yearsUntilMotExempt > 0 &&
    s.yearsUntilMotExempt <= 5
  );
}
