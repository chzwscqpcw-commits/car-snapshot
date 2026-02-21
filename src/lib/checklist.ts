// Dynamic vehicle-specific checklist builder
// Pure functions — no React, no side effects

export type ChecklistRole = "owner" | "buyer" | "seller";

export type ChecklistSignals = {
  motStatus: string | undefined;
  taxStatus: string | undefined;
  yearOfManufacture: number | undefined;
  isOver3Years: boolean;
  fuelType: string | undefined;
  motInsights: {
    passRate: number;
    avgMilesPerYear: number;
    mileageWarnings: string[];
    recurringAdvisories: Array<{ text: string; count: number }>;
    daysUntilExpiry: number;
  } | null;
  motReadiness: {
    score: "green" | "amber" | "red";
    advisoryCount: number;
    totalEstimatedCost: { low: number; high: number };
    isMotExempt: boolean;
  } | null;
  ulezResult: { status: string } | null;
  recalls: Array<{ defect: string }>;
  healthScore: { score: number; grade: string } | null;
  ncapRating: { overallStars: number } | null;
  theftRisk: { riskCategory: string } | null;
  valuationResult: { rangeLow: number; rangeHigh: number } | null;
  ownershipCost: { totalAnnual: number } | null;
  fuelEconomy: { combinedMpg: number } | null;
};

const MAX_ITEMS = 15;

function truncateAdvisory(text: string): string {
  if (text.length <= 60) return text;
  return text.substring(0, 57) + "...";
}

function isMotExpired(s: ChecklistSignals): boolean {
  return s.isOver3Years && (!s.motStatus || s.motStatus.toLowerCase() !== "valid");
}

function isMotExpiringSoon(s: ChecklistSignals): { soon: boolean; days: number } {
  const days = s.motInsights?.daysUntilExpiry ?? Infinity;
  return { soon: days > 0 && days <= 30, days };
}

function isSorn(s: ChecklistSignals): boolean {
  return s.taxStatus?.toUpperCase() === "SORN";
}

function isUntaxed(s: ChecklistSignals): boolean {
  const status = s.taxStatus?.toLowerCase() ?? "";
  return status === "untaxed" || status === "not taxed";
}

function hasMileageDiscrepancy(s: ChecklistSignals): boolean {
  return s.motInsights?.mileageWarnings?.some(
    w => w.includes("ALERT") || w.includes("decreased")
  ) ?? false;
}

function formatCost(low: number, high: number): string {
  return `£${Math.round(low).toLocaleString()}–£${Math.round(high).toLocaleString()}`;
}

// ── OWNER ──────────────────────────────────────────────────

function buildOwnerChecklist(s: ChecklistSignals): string[] {
  const items: string[] = [
    "Confirm MOT status is valid",
    "Confirm tax status is current",
    "Service history up to date",
    "Insurance is active and renewed",
  ];

  // MOT expired
  if (isMotExpired(s)) {
    items.push("Book MOT immediately — your vehicle's MOT has expired");
  }

  // MOT expiring soon
  const { soon, days } = isMotExpiringSoon(s);
  if (soon) {
    items.push(`Book MOT soon — expires in ${days} days`);
  }

  // SORN
  if (isSorn(s)) {
    items.push("Vehicle is SORN — tax before driving on public roads");
  }

  // Untaxed
  if (isUntaxed(s)) {
    items.push("Vehicle tax has lapsed — renew before driving");
  }

  // Recalls
  if (s.recalls.length > 0) {
    items.push(`${s.recalls.length} safety recall(s) found — contact your dealer`);
  }

  // ULEZ
  if (s.ulezResult && s.ulezResult.status !== "compliant" && s.ulezResult.status !== "exempt") {
    items.push("Vehicle is not ULEZ compliant — charges apply in London");
  }

  // Advisory cost
  if (s.motReadiness && s.motReadiness.advisoryCount > 0 && !s.motReadiness.isMotExempt) {
    const cost = s.motReadiness.totalEstimatedCost;
    if (cost.high > 0) {
      items.push(
        `Address ${s.motReadiness.advisoryCount} MOT advisories — budget ${formatCost(cost.low, cost.high)} for repairs`
      );
    }
  }

  // Recurring advisories
  if (s.motInsights?.recurringAdvisories) {
    for (const adv of s.motInsights.recurringAdvisories.slice(0, 2)) {
      items.push(`Recurring advisory: ${truncateAdvisory(adv.text)}`);
    }
  }

  // High theft risk
  if (s.theftRisk?.riskCategory === "high" || s.theftRisk?.riskCategory === "very-high") {
    items.push("High theft risk — consider a steering lock or tracker");
  }

  return items.slice(0, MAX_ITEMS);
}

// ── BUYER ──────────────────────────────────────────────────

function buildBuyerChecklist(s: ChecklistSignals): string[] {
  const items: string[] = [
    "Verify full service history with the seller",
    "Check VIN matches logbook (V5C)",
    "Inspect all tyres for tread depth and wear",
    "Run a history check: write-offs, theft, outstanding finance",
    "Get a pre-purchase mechanic inspection",
    "Test drive thoroughly",
  ];

  // MOT expired
  if (isMotExpired(s)) {
    items.push("MOT has expired — insist on a fresh MOT before purchase");
  }

  // MOT expiring soon
  const { soon, days } = isMotExpiringSoon(s);
  if (soon) {
    items.push(`MOT expires in ${days} days — negotiate a fresh MOT`);
  }

  // SORN
  if (isSorn(s)) {
    items.push("Vehicle is SORN — cannot be driven, needs taxing");
  }

  // Untaxed
  if (isUntaxed(s)) {
    items.push("Tax has lapsed — factor in renewal cost");
  }

  // Mileage discrepancy
  if (hasMileageDiscrepancy(s)) {
    items.push("Mileage discrepancy detected — possible odometer tampering");
  }

  // Recurring advisories
  if (s.motInsights?.recurringAdvisories) {
    for (const adv of s.motInsights.recurringAdvisories.slice(0, 2)) {
      items.push(`Recurring MOT advisory: ${truncateAdvisory(adv.text)}`);
    }
  }

  // Advisory repair cost
  if (s.motReadiness && s.motReadiness.advisoryCount > 0 && !s.motReadiness.isMotExempt) {
    const cost = s.motReadiness.totalEstimatedCost;
    if (cost.high > 0) {
      items.push(
        `Budget ${formatCost(cost.low, cost.high)} for ${s.motReadiness.advisoryCount} MOT advisory repairs`
      );
    }
  }

  // Recalls
  if (s.recalls.length > 0) {
    items.push(`${s.recalls.length} safety recall(s) — ask dealer for proof of completion`);
  }

  // ULEZ
  if (s.ulezResult && s.ulezResult.status !== "compliant" && s.ulezResult.status !== "exempt") {
    items.push("Not ULEZ compliant — £12.50/day to drive in London");
  }

  // NCAP < 3 stars
  if (s.ncapRating && s.ncapRating.overallStars < 3) {
    items.push(`Euro NCAP safety rating is ${s.ncapRating.overallStars} stars — below average`);
  }

  // High theft risk
  if (s.theftRisk?.riskCategory === "high" || s.theftRisk?.riskCategory === "very-high") {
    items.push("High theft risk — factor in tracker or higher insurance");
  }

  // Health score D/F
  if (s.healthScore && (s.healthScore.grade === "D" || s.healthScore.grade === "F")) {
    items.push(`Vehicle health score is ${s.healthScore.grade} — review concerns carefully`);
  }

  // Running costs > £3,500
  if (s.ownershipCost && s.ownershipCost.totalAnnual > 3500) {
    items.push(
      `Estimated annual running cost: £${Math.round(s.ownershipCost.totalAnnual).toLocaleString()} — budget accordingly`
    );
  }

  // Low MPG (non-EV)
  const isEV = s.fuelType?.toLowerCase().includes("electric");
  if (!isEV && s.fuelEconomy && s.fuelEconomy.combinedMpg < 35) {
    items.push(`Fuel economy is ${Math.round(s.fuelEconomy.combinedMpg)} mpg — below average`);
  }

  // Age ≥ 10 years
  if (s.yearOfManufacture) {
    const age = new Date().getFullYear() - s.yearOfManufacture;
    if (age >= 10) {
      items.push(`Vehicle is ${age} years old — check for rust and worn parts`);
    }
  }

  return items.slice(0, MAX_ITEMS);
}

// ── SELLER ─────────────────────────────────────────────────

function buildSellerChecklist(s: ChecklistSignals): string[] {
  const items: string[] = [
    "Gather full service history and receipts",
    "Prepare V5C logbook for transfer",
    "Take clear, well-lit photos of the vehicle",
    "Cancel or transfer insurance after sale completes",
  ];

  // MOT expired
  if (isMotExpired(s)) {
    items.push("Get a fresh MOT before listing — buyers expect valid MOT");
  }

  // MOT expiring soon
  const { soon, days } = isMotExpiringSoon(s);
  if (soon) {
    items.push(`MOT expires in ${days} days — consider renewing before listing`);
  }

  // SORN
  if (isSorn(s)) {
    items.push("Vehicle is SORN — disclose this in your listing");
  }

  // Untaxed
  if (isUntaxed(s)) {
    items.push("Tax has lapsed — be upfront with buyers");
  }

  // Recalls
  if (s.recalls.length > 0) {
    items.push(`${s.recalls.length} recall(s) — contact dealer to resolve before listing`);
  }

  // Advisory cost
  if (s.motReadiness && s.motReadiness.advisoryCount > 0 && !s.motReadiness.isMotExempt) {
    const cost = s.motReadiness.totalEstimatedCost;
    if (cost.high > 0) {
      items.push(
        `Fix ${s.motReadiness.advisoryCount} advisories (${formatCost(cost.low, cost.high)}) to strengthen your asking price`
      );
    }
  }

  // Recurring advisories
  if (s.motInsights?.recurringAdvisories) {
    for (const adv of s.motInsights.recurringAdvisories.slice(0, 2)) {
      items.push(`Be ready for questions about recurring advisory: ${truncateAdvisory(adv.text)}`);
    }
  }

  // ULEZ compliant — positive selling point
  if (s.ulezResult && (s.ulezResult.status === "compliant" || s.ulezResult.status === "exempt")) {
    items.push("Highlight ULEZ compliance in your listing — it adds value");
  }

  // ULEZ non-compliant
  if (s.ulezResult && s.ulezResult.status !== "compliant" && s.ulezResult.status !== "exempt") {
    items.push("Disclose ULEZ non-compliance — affects London-area buyers");
  }

  // Valuation available
  if (s.valuationResult) {
    items.push(
      `Estimated market value: ${formatCost(s.valuationResult.rangeLow, s.valuationResult.rangeHigh)} — price competitively`
    );
  }

  return items.slice(0, MAX_ITEMS);
}

// ── PUBLIC API ─────────────────────────────────────────────

export function buildChecklist(role: ChecklistRole, signals: ChecklistSignals): string[] {
  switch (role) {
    case "owner":  return buildOwnerChecklist(signals);
    case "buyer":  return buildBuyerChecklist(signals);
    case "seller": return buildSellerChecklist(signals);
  }
}

export function buildAllChecklists(signals: ChecklistSignals): {
  owner: string[];
  buyer: string[];
  seller: string[];
} {
  return {
    owner:  buildOwnerChecklist(signals),
    buyer:  buildBuyerChecklist(signals),
    seller: buildSellerChecklist(signals),
  };
}
