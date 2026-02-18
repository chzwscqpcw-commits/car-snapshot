// Environmental Eco Score — composite A-F grade for environmental impact

export type EcoGrade = "A" | "B" | "C" | "D" | "E" | "F";

export type EcoFactor = {
  name: string;
  score: number;
  maxScore: number;
  detail: string;
};

export type EcoScoreResult = {
  grade: EcoGrade;
  score: number;
  label: string;
  factors: EcoFactor[];
};

function gradeFromScore(score: number): EcoGrade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  if (score >= 25) return "E";
  return "F";
}

function labelFromGrade(grade: EcoGrade): string {
  switch (grade) {
    case "A": return "Very Clean";
    case "B": return "Clean";
    case "C": return "Moderate";
    case "D": return "Above Average Emissions";
    case "E": return "High Emissions";
    case "F": return "Very High Emissions";
  }
}

function extractEuroNumber(euroStatus?: string): number | null {
  if (!euroStatus) return null;
  const m = /EURO\s*([0-9]+)/i.exec(euroStatus);
  return m ? Number(m[1]) : null;
}

export function calculateEcoScore(params: {
  co2Emissions?: number;
  euroStatus?: string;
  fuelType?: string;
  combinedMpg?: number;
  ulezCompliant?: boolean;
}): EcoScoreResult | null {
  const { co2Emissions, euroStatus, fuelType, combinedMpg, ulezCompliant } = params;
  const fuelLower = (fuelType ?? "").toLowerCase();

  // Need at least one data point to calculate
  if (co2Emissions == null && !euroStatus && !fuelType) return null;

  const factors: EcoFactor[] = [];
  let weightedTotal = 0;
  let totalWeight = 0;

  // 1. CO2 Emissions: 30%
  if (co2Emissions != null) {
    let co2Score: number;
    if (co2Emissions === 0) co2Score = 100;
    else if (co2Emissions < 100) co2Score = 100;
    else if (co2Emissions <= 150) co2Score = 75;
    else if (co2Emissions <= 200) co2Score = 50;
    else co2Score = 25;
    factors.push({
      name: "CO2 Emissions",
      score: co2Score,
      maxScore: 100,
      detail: co2Emissions === 0 ? "Zero emissions" : `${co2Emissions} g/km`,
    });
    weightedTotal += co2Score * 30;
    totalWeight += 30;
  }

  // 2. Euro Standard: 25%
  const euroNum = extractEuroNumber(euroStatus);
  if (euroNum != null) {
    let euroScore: number;
    // Check for Euro 6d variants
    const is6d = euroStatus?.toUpperCase().includes("6D") || euroStatus?.toUpperCase().includes("6DG");
    if (is6d) euroScore = 100;
    else if (euroNum >= 6) euroScore = 80;
    else if (euroNum === 5) euroScore = 50;
    else if (euroNum === 4) euroScore = 25;
    else euroScore = 10;
    factors.push({
      name: "Euro Standard",
      score: euroScore,
      maxScore: 100,
      detail: euroStatus ?? `Euro ${euroNum}`,
    });
    weightedTotal += euroScore * 25;
    totalWeight += 25;
  }

  // 3. Fuel Type: 20%
  if (fuelType) {
    let fuelScore: number;
    if (fuelLower.includes("electric")) fuelScore = 100;
    else if (fuelLower.includes("hybrid")) fuelScore = 80;
    else if (fuelLower.includes("petrol") || fuelLower.includes("gas")) fuelScore = 50;
    else if (fuelLower.includes("diesel")) fuelScore = 40;
    else fuelScore = 50;
    factors.push({
      name: "Fuel Type",
      score: fuelScore,
      maxScore: 100,
      detail: fuelType,
    });
    weightedTotal += fuelScore * 20;
    totalWeight += 20;
  }

  // 4. Fuel Economy: 15%
  if (combinedMpg != null && combinedMpg > 0) {
    let mpgScore: number;
    if (combinedMpg >= 60) mpgScore = 100;
    else if (combinedMpg >= 45) mpgScore = 75;
    else if (combinedMpg >= 35) mpgScore = 50;
    else mpgScore = 25;
    factors.push({
      name: "Fuel Economy",
      score: mpgScore,
      maxScore: 100,
      detail: `${combinedMpg.toFixed(1)} MPG`,
    });
    weightedTotal += mpgScore * 15;
    totalWeight += 15;
  }

  // 5. ULEZ Compliance: 10%
  if (ulezCompliant != null) {
    const ulezScore = ulezCompliant ? 100 : 0;
    factors.push({
      name: "ULEZ",
      score: ulezScore,
      maxScore: 100,
      detail: ulezCompliant ? "Compliant" : "Non-compliant",
    });
    weightedTotal += ulezScore * 10;
    totalWeight += 10;
  }

  if (totalWeight === 0) return null;

  const score = Math.round(weightedTotal / totalWeight);
  const grade = gradeFromScore(score);

  return {
    grade,
    score,
    label: labelFromGrade(grade),
    factors,
  };
}
