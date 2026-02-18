// MOT Readiness Score — advisory categorisation, risk scoring, and estimated repair costs

export type RiskLevel = "high" | "medium" | "low";

export type AdvisoryCategory =
  | "brakes"
  | "tyres"
  | "steering"
  | "suspension"
  | "exhaust"
  | "bodywork"
  | "drivetrain"
  | "lights"
  | "wipers-washers"
  | "other";

type CategoryDef = {
  label: string;
  risk: RiskLevel;
  costLow: number;
  costHigh: number;
  keywords: string[];
};

const CATEGORIES: Record<AdvisoryCategory, CategoryDef> = {
  brakes: {
    label: "Brakes",
    risk: "high",
    costLow: 100,
    costHigh: 350,
    keywords: ["brake", "disc", "pad", "caliper", "handbrake", "abs"],
  },
  tyres: {
    label: "Tyres",
    risk: "high",
    costLow: 60,
    costHigh: 150,
    keywords: ["tyre", "tread", "legal limit", "worn close", "sidewall"],
  },
  steering: {
    label: "Steering",
    risk: "high",
    costLow: 100,
    costHigh: 350,
    keywords: ["steering", "track rod", "rack", "wheel bearing"],
  },
  suspension: {
    label: "Suspension",
    risk: "medium",
    costLow: 80,
    costHigh: 300,
    keywords: ["suspension", "shock absorber", "spring", "bush", "ball joint", "wishbone", "drop link"],
  },
  exhaust: {
    label: "Exhaust",
    risk: "medium",
    costLow: 80,
    costHigh: 400,
    keywords: ["exhaust", "catalytic", "lambda", "silencer"],
  },
  bodywork: {
    label: "Bodywork / Structure",
    risk: "medium",
    costLow: 100,
    costHigh: 500,
    keywords: ["corrosion", "rust", "sill", "subframe", "structural", "chassis"],
  },
  drivetrain: {
    label: "Drivetrain",
    risk: "medium",
    costLow: 80,
    costHigh: 300,
    keywords: ["driveshaft", "cv joint", "cv boot", "gaiter", "clutch"],
  },
  lights: {
    label: "Lights",
    risk: "low",
    costLow: 15,
    costHigh: 60,
    keywords: ["lamp", "light", "headlamp", "indicator", "bulb", "reflector"],
  },
  "wipers-washers": {
    label: "Wipers & Washers",
    risk: "low",
    costLow: 10,
    costHigh: 30,
    keywords: ["wiper", "washer", "windscreen"],
  },
  other: {
    label: "Other",
    risk: "low",
    costLow: 30,
    costHigh: 100,
    keywords: [],
  },
};

export type RiskItem = {
  category: AdvisoryCategory;
  categoryLabel: string;
  text: string;
  risk: RiskLevel;
  isRecurring: boolean;
  estimatedCost: { low: number; high: number };
};

export type MotReadinessResult = {
  score: "green" | "amber" | "red";
  label: string;
  advisoryCount: number;
  riskItems: RiskItem[];
  totalEstimatedCost: { low: number; high: number };
  daysUntilMot: number;
  isMotExempt: boolean;
  disclaimer: string;
};

function categoriseAdvisory(text: string): AdvisoryCategory {
  const lower = text.toLowerCase();
  for (const [cat, def] of Object.entries(CATEGORIES) as [AdvisoryCategory, CategoryDef][]) {
    if (cat === "other") continue;
    if (def.keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "other";
}

function promoteRisk(risk: RiskLevel): RiskLevel {
  if (risk === "low") return "medium";
  if (risk === "medium") return "high";
  return "high";
}

export function calculateMotReadiness(params: {
  latestAdvisories: string[];
  recurringAdvisories: Array<{ text: string; count: number }>;
  daysUntilExpiry: number;
  isOver3Years: boolean;
}): MotReadinessResult {
  const { latestAdvisories, recurringAdvisories, daysUntilExpiry, isOver3Years } = params;

  const disclaimer =
    "Estimated repair costs are rough UK averages for guidance only. " +
    "Actual costs vary by garage, location, and vehicle. " +
    "Always get a professional quote before committing to repairs.";

  if (!isOver3Years) {
    return {
      score: "green",
      label: "MOT exempt",
      advisoryCount: 0,
      riskItems: [],
      totalEstimatedCost: { low: 0, high: 0 },
      daysUntilMot: 0,
      isMotExempt: true,
      disclaimer,
    };
  }

  const recurringTexts = new Set(
    recurringAdvisories.map((r) => r.text.substring(0, 50).toLowerCase()),
  );

  const riskItems: RiskItem[] = latestAdvisories.map((text) => {
    const cat = categoriseAdvisory(text);
    const def = CATEGORIES[cat];
    const isRecurring = recurringTexts.has(text.substring(0, 50).toLowerCase());
    const risk = isRecurring ? promoteRisk(def.risk) : def.risk;

    return {
      category: cat,
      categoryLabel: def.label,
      text,
      risk,
      isRecurring,
      estimatedCost: { low: def.costLow, high: def.costHigh },
    };
  });

  // Sort: high first, then medium, then low
  const riskOrder: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };
  riskItems.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

  const highCount = riskItems.filter((r) => r.risk === "high").length;
  const mediumCount = riskItems.filter((r) => r.risk === "medium").length;
  const total = riskItems.length;
  const hasHighAndRecurring = riskItems.some((r) => r.risk === "high" && r.isRecurring);

  let score: "green" | "amber" | "red";
  let label: string;

  if (highCount >= 2 || total >= 5 || hasHighAndRecurring) {
    score = "red";
    label = "Attention required";
  } else if (highCount >= 1 || mediumCount >= 2 || total >= 2) {
    score = "amber";
    label = "Some attention needed";
  } else {
    score = "green";
    label = "Ready";
  }

  const totalEstimatedCost = riskItems.reduce(
    (acc, item) => ({
      low: acc.low + item.estimatedCost.low,
      high: acc.high + item.estimatedCost.high,
    }),
    { low: 0, high: 0 },
  );

  return {
    score,
    label,
    advisoryCount: total,
    riskItems,
    totalEstimatedCost,
    daysUntilMot: daysUntilExpiry,
    isMotExempt: false,
    disclaimer,
  };
}
