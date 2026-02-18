// Vehicle Health Score — composite 0-100 with letter grade A-F

export type HealthGrade = "A" | "B" | "C" | "D" | "F";

export type HealthBreakdown = {
  category: string;
  score: number;
  maxScore: number;
  detail: string;
};

export type HealthScoreResult = {
  score: number;
  grade: HealthGrade;
  label: string;
  breakdown: HealthBreakdown[];
};

function gradeFromScore(score: number): HealthGrade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function labelFromGrade(grade: HealthGrade): string {
  switch (grade) {
    case "A": return "Excellent";
    case "B": return "Good";
    case "C": return "Fair";
    case "D": return "Below Average";
    case "F": return "Poor";
  }
}

export function calculateHealthScore(params: {
  passRate?: number;
  totalTests?: number;
  latestAdvisoryCount?: number;
  hasMileageDiscrepancy?: boolean;
  avgMilesPerYear?: number;
  vehicleAge?: number;
  ncapStars?: number;
  recallCount?: number;
  taxCurrent?: boolean;
  motCurrent?: boolean;
  ulezCompliant?: boolean;
}): HealthScoreResult {
  const breakdown: HealthBreakdown[] = [];
  let total = 0;

  // Cars under 3 years old don't require MOT — award full marks for MOT-dependent categories
  const motExempt = params.vehicleAge != null && params.vehicleAge <= 3;

  // 1. MOT History: 25 pts (pass rate scaled)
  const maxMot = 25;
  let motScore = 0;
  if (motExempt) {
    motScore = maxMot;
    breakdown.push({ category: "MOT History", score: motScore, maxScore: maxMot, detail: "Under 3 years — MOT not yet required" });
  } else if (params.passRate != null && params.totalTests != null && params.totalTests > 0) {
    motScore = Math.round((params.passRate / 100) * maxMot);
    breakdown.push({
      category: "MOT History",
      score: motScore,
      maxScore: maxMot,
      detail: `${params.passRate}% pass rate (${params.totalTests} tests)`,
    });
  } else {
    breakdown.push({ category: "MOT History", score: 0, maxScore: maxMot, detail: "No MOT data available" });
  }
  total += motScore;

  // 2. Current Advisories: 20 pts
  const maxAdv = 20;
  let advScore = 0;
  if (motExempt) {
    advScore = maxAdv;
    breakdown.push({ category: "Advisories", score: advScore, maxScore: maxAdv, detail: "No MOT advisories (too new)" });
  } else {
    const advCount = params.latestAdvisoryCount ?? 0;
    if (advCount === 0) advScore = 20;
    else if (advCount <= 2) advScore = 15;
    else if (advCount <= 5) advScore = 10;
    else advScore = 5;
    breakdown.push({
      category: "Advisories",
      score: advScore,
      maxScore: maxAdv,
      detail: advCount === 0 ? "No current advisories" : `${advCount} current advisor${advCount !== 1 ? "ies" : "y"}`,
    });
  }
  total += advScore;

  // 3. Mileage Consistency: 15 pts
  const maxMileage = 15;
  let mileageScore: number;
  if (motExempt) {
    mileageScore = maxMileage;
    breakdown.push({ category: "Mileage Consistency", score: mileageScore, maxScore: maxMileage, detail: "No MOT mileage records yet" });
  } else {
    mileageScore = params.hasMileageDiscrepancy ? 0 : 15;
    breakdown.push({
      category: "Mileage Consistency",
      score: mileageScore,
      maxScore: maxMileage,
      detail: params.hasMileageDiscrepancy ? "Mileage discrepancy detected" : "No mileage discrepancies",
    });
  }
  total += mileageScore;

  // 4. Age-Adjusted Mileage: 10 pts
  const maxAgeMileage = 10;
  let ageMileageScore = 10;
  if (motExempt) {
    breakdown.push({ category: "Annual Mileage", score: ageMileageScore, maxScore: maxAgeMileage, detail: "New vehicle" });
  } else if (params.avgMilesPerYear != null && params.avgMilesPerYear > 0) {
    if (params.avgMilesPerYear >= 5000 && params.avgMilesPerYear <= 12000) {
      ageMileageScore = 10;
    } else if (params.avgMilesPerYear > 12000 && params.avgMilesPerYear <= 20000) {
      ageMileageScore = 7;
    } else if (params.avgMilesPerYear < 5000) {
      ageMileageScore = 7; // suspiciously low
    } else {
      ageMileageScore = 3; // extreme
    }
    breakdown.push({
      category: "Annual Mileage",
      score: ageMileageScore,
      maxScore: maxAgeMileage,
      detail: `~${params.avgMilesPerYear.toLocaleString()} miles/year`,
    });
  } else {
    breakdown.push({ category: "Annual Mileage", score: 0, maxScore: maxAgeMileage, detail: "No mileage data" });
    ageMileageScore = 0;
  }
  total += ageMileageScore;

  // 5. NCAP Safety: 10 pts (stars × 2)
  const maxNcap = 10;
  let ncapScore = 0;
  if (params.ncapStars != null) {
    ncapScore = params.ncapStars * 2;
    breakdown.push({
      category: "Safety Rating",
      score: ncapScore,
      maxScore: maxNcap,
      detail: `${params.ncapStars}/5 Euro NCAP stars`,
    });
  } else {
    breakdown.push({ category: "Safety Rating", score: 0, maxScore: maxNcap, detail: "No NCAP data" });
  }
  total += ncapScore;

  // 6. Recalls: 10 pts
  const maxRecalls = 10;
  let recallScore = 10;
  const rc = params.recallCount ?? 0;
  if (rc === 0) recallScore = 10;
  else if (rc <= 2) recallScore = 6;
  else recallScore = 2;
  breakdown.push({
    category: "Recalls",
    score: recallScore,
    maxScore: maxRecalls,
    detail: rc === 0 ? "No safety recalls" : `${rc} recall${rc !== 1 ? "s" : ""} found`,
  });
  total += recallScore;

  // 7. Tax & MOT Currency: 5 pts
  const maxCurrency = 5;
  let currencyScore = 0;
  // Cars under 3 years don't need MOT — treat as effectively "current"
  const effectiveMotCurrent = params.motCurrent || motExempt;
  if (params.taxCurrent && effectiveMotCurrent) currencyScore = 5;
  else if (params.taxCurrent || effectiveMotCurrent) currencyScore = 3;
  const currencyDetail = motExempt
    ? (params.taxCurrent ? "Tax current, MOT not yet required" : "Tax expired, MOT not yet required")
    : (params.taxCurrent && params.motCurrent ? "Both current" : !params.taxCurrent && !params.motCurrent ? "Both expired or unknown" : params.taxCurrent ? "Tax current, MOT expired" : "MOT current, tax expired");
  breakdown.push({
    category: "Tax & MOT",
    score: currencyScore,
    maxScore: maxCurrency,
    detail: currencyDetail,
  });
  total += currencyScore;

  // 8. ULEZ Compliance: 5 pts
  const maxUlez = 5;
  const ulezScore = params.ulezCompliant ? 5 : 0;
  breakdown.push({
    category: "ULEZ",
    score: ulezScore,
    maxScore: maxUlez,
    detail: params.ulezCompliant ? "ULEZ compliant" : "Not ULEZ compliant or unknown",
  });
  total += ulezScore;

  const grade = gradeFromScore(total);
  return {
    score: total,
    grade,
    label: labelFromGrade(grade),
    breakdown,
  };
}
