import type { jsPDF } from "jspdf";

// ── Types ────────────────────────────────────────────────────────────────────

type MotTest = {
  completedDate: string;
  testResult: "PASSED" | "FAILED" | "NO DETAILS HELD";
  expiryDate?: string;
  odometer?: { value: number; unit: string };
  motTestNumber?: string;
  rfrAndComments?: Array<{ text: string; type: "COMMENT" | "DEFECT" | "ADVISORY" }>;
};

type VehicleData = {
  registrationNumber: string;
  make?: string;
  model?: string;
  colour?: string;
  fuelType?: string;
  engineCapacity?: number;
  yearOfManufacture?: number;
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
  monthOfFirstRegistration?: string;
  dateOfFirstRegistration?: string;
  dateOfLastV5CIssued?: string;
  markedForExport?: boolean;
  co2Emissions?: number;
  euroStatus?: string;
  realDrivingEmissions?: number;
  wheelplan?: string;
  revenueWeight?: number;
  typeApproval?: string;
  automatedVehicle?: boolean;
  additionalRateEndDate?: string;
  variant?: string;
  motTests?: MotTest[];
  motTestsLastUpdated?: string;
};

type MotInsights = {
  passRate: number;
  passedTests: number;
  totalTests: number;
  avgMilesPerYear: number;
  mileageTrend: string;
  mileageWarnings: string[];
  latestMileage: number | null;
  daysUntilExpiry: number;
  recurringAdvisories: Array<{ text: string; count: number }>;
};

type CleanAirZone = {
  name: string;
  dailyCharge: string;
  url: string;
  carsCharged?: boolean;
};

export type ParsedModelInfo = {
  bodyStyle: string | null;
  trim: string | null;
  driveType: string | null;
  fuelIndicator: string | null;
  transmission: string | null;
  engineDesc: string | null;
};

export type ReportInput = {
  data: VehicleData;
  motInsights: MotInsights | null;
  checklist: { owner: string[]; buyer: string[]; seller: string[] };
  parsedModel?: ParsedModelInfo | null;
  ulezResult?: {
    status: string;
    confidence: string;
    reason: string;
    details: string;
    cleanAirZones?: CleanAirZone[];
  } | null;
  vedResult?: { estimatedAnnualRate: number | null; estimatedSixMonthRate?: number | null; band: string | null; details: string } | null;
  fuelEconomy?: { combinedMpg: number; urbanMpg?: number; extraUrbanMpg?: number; estimatedAnnualCost: number } | null;
  fuelPrices?: { petrol: number; diesel: number; date: string | null } | null;
  ncapRating?: { overallStars: number; adultOccupant?: number; childOccupant?: number; pedestrian?: number; safetyAssist?: number; yearTested: number } | null;
  recalls?: Array<{ recallDate: string; defect: string; remedy: string; recallNumber: string }>;
  rarityResult?: { licensed: number; sorn: number; total: number; category: string } | null;
  colourPopularity?: { rank: number; share: number; label: string; isTopFive: boolean } | null;
  healthScore?: { score: number; grade: string; label: string; breakdown: Array<{ category: string; score: number; maxScore: number; detail: string }> } | null;
  ecoScore?: { grade: string; score: number; label: string; factors: Array<{ name: string; score: number; maxScore: number; detail: string }> } | null;
  motPassRate?: { passRate: number; testCount: number; aboveAverage: boolean; nationalAverage: number; commonFailureReasons?: string[] | null } | null;
  valuation?: {
    rangeLow: number;
    rangeHigh: number;
    confidence: string;
    sources: string[];
    estimatedValue?: number;
    ebayMinPrice?: number | null;
    ebayMaxPrice?: number | null;
    ebayTotalListings?: number | null;
    ebayDominantTransmission?: string | null;
    ebayDominantBodyType?: string | null;
    marketSupply?: "good" | "moderate" | "limited" | null;
    mileageAdjustmentPercent?: number;
    conditionAdjustmentPercent?: number;
    colourAdjustmentPercent?: number;
    disclaimer?: string;
  } | null;
  motReadiness?: {
    score: "green" | "amber" | "red";
    label: string;
    advisoryCount: number;
    daysUntilMot: number;
    totalEstimatedCost: { low: number; high: number };
    riskItems?: Array<{
      risk: "high" | "medium" | "low";
      categoryLabel: string;
      text: string;
      isRecurring: boolean;
      estimatedCost: { low: number; high: number };
    }>;
    disclaimer?: string;
  } | null;
  ownershipCost?: {
    totalAnnual: number;
    costPerMile: number;
    breakdown: { fuel: number | null; ved: number | null; depreciation: number | null; mot: number | null; maintenance: number | null };
    excludedNote: string;
  } | null;
  theftRisk?: {
    theftsPer1000: number;
    rateMultiplier: number;
    riskCategory: "very-high" | "high" | "moderate" | "low" | "very-low";
    theftCount: number;
    registeredCount: number;
    nationalAverage: number;
  } | null;
  evSpecs?: {
    batteryKwh: number;
    rangeWltp: number;
    chargeFast: string | null;
    chargeSlow: string | null;
    motorKw: number | null;
    driveType: string | null;
  } | null;
  negotiation?: {
    suggestedDiscountPercent: { low: number; high: number };
    estimatedSaving: { low: number; high: number };
    reasons: string[];
    confidence: "high" | "medium" | "low";
  } | null;
  vehicleSegment?: string;
  ukAverageCost?: number;
  ukAverageLabel?: string;
  tyreSizes?: {
    sizes: string[];
    boltPattern: string;
    centrebore: string;
  } | null;
  vehicleDimensions?: {
    lengthMm: number;
    widthMm: number;
    heightMm: number;
    wheelbaseMm: number;
    kerbWeightKg: number;
    bootLitres: number;
  } | null;
};

// ── Color Palette (RGB) ─────────────────────────────────────────────────────

type RGB = [number, number, number];

const C = {
  slate900: [15, 23, 42] as RGB,
  slate800: [30, 41, 59] as RGB,
  slate700: [51, 65, 85] as RGB,
  slate400: [148, 163, 184] as RGB,
  slate300: [203, 213, 225] as RGB,
  slate100: [241, 245, 249] as RGB,
  white: [255, 255, 255] as RGB,
  cardBg: [248, 250, 252] as RGB,
  cardBorder: [226, 232, 240] as RGB,
  bodyText: [30, 41, 59] as RGB,
  secondaryText: [100, 116, 139] as RGB,
  labelText: [148, 163, 184] as RGB,
  headingText: [15, 23, 42] as RGB,
  divider: [226, 232, 240] as RGB,
  tableBgAlt: [241, 245, 249] as RGB,
  emerald: [16, 185, 129] as RGB,
  amber: [245, 158, 11] as RGB,
  red: [239, 68, 68] as RGB,
  blue: [59, 130, 246] as RGB,
  blue400: [96, 165, 250] as RGB,
  cyan: [34, 211, 238] as RGB,
  cyan300: [103, 232, 249] as RGB,
  yellow: [250, 204, 21] as RGB,
  yellowDark: [66, 32, 6] as RGB,
};

// ── Layout Constants ─────────────────────────────────────────────────────────

const MARGIN = 12;
const CONTENT_W = 186; // A4 width (210) - 2×12 margins
const PAGE_H = 297;
const FOOTER_H = 9;
const USABLE_H = PAGE_H - FOOTER_H;
const GUTTER = 5;
const SECTION_GAP = 5;
const POST_BREAK_PAD = 6;

const FONT = {
  h1: 18,
  h2: 13,
  h3: 11,
  body: 9,
  small: 7.5,
  tiny: 6,
};

// Insight card internal constants
const CARD_ACCENT_W = 2;
const CARD_PAD_LEFT = CARD_ACCENT_W + 5;
const CARD_LINE_H = 4;
const CARD_TITLE_H = 5.5;
const CARD_PAD_TOP = 3;
const CARD_PAD_BOTTOM = 3;
const CARD_GAP = 2;

// ── Drawing Primitives ───────────────────────────────────────────────────────

function setFill(doc: jsPDF, color: RGB) {
  doc.setFillColor(color[0], color[1], color[2]);
}

function setDraw(doc: jsPDF, color: RGB) {
  doc.setDrawColor(color[0], color[1], color[2]);
}

function setTextColor(doc: jsPDF, color: RGB) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function drawRoundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: RGB,
  borderColor?: RGB,
) {
  setFill(doc, fillColor);
  if (borderColor) {
    setDraw(doc, borderColor);
    doc.roundedRect(x, y, w, h, r, r, "FD");
  } else {
    doc.roundedRect(x, y, w, h, r, r, "F");
  }
}

function drawStatusBadge(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  accentColor: RGB,
) {
  const badgeH = 18;
  drawRoundedRect(doc, x, y, w, badgeH, 3, C.cardBg, C.cardBorder);
  setFill(doc, accentColor);
  doc.roundedRect(x, y, w, 3, 3, 3, "F");
  doc.rect(x, y + 1.5, w, 1.5, "F");
  setFill(doc, C.cardBg);
  doc.rect(x + 0.5, y + 2.5, w - 1, 1, "F");

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.secondaryText);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + w / 2, y + 9, { align: "center" });

  doc.setFontSize(FONT.body);
  setTextColor(doc, C.headingText);
  doc.setFont("helvetica", "bold");
  doc.text(value, x + w / 2, y + 15, { align: "center" });
}

function drawNumberPlate(doc: jsPDF, x: number, y: number, reg: string) {
  const plateW = 70;
  const plateH = 14;
  const px = x - plateW / 2;
  drawRoundedRect(doc, px, y, plateW, plateH, 3, C.yellow);
  doc.setFontSize(16);
  setTextColor(doc, C.yellowDark);
  doc.setFont("helvetica", "bold");
  doc.text(reg, x, y + 10, { align: "center" });
}

function addNewPage(doc: jsPDF) {
  doc.addPage();
  paintBackground(doc);
}

function paintBackground(doc: jsPDF) {
  setFill(doc, C.white);
  doc.rect(0, 0, 210, PAGE_H, "F");
}

function checkPageBreak(doc: jsPDF, currentY: number, neededHeight: number): number {
  if (currentY + neededHeight > USABLE_H) {
    addNewPage(doc);
    return MARGIN + POST_BREAK_PAD;
  }
  return currentY;
}

function startSection(doc: jsPDF, currentY: number, title: string, minHeight: number = 30): number {
  const headerHeight = 16;
  const needed = headerHeight + minHeight;
  let y = currentY + SECTION_GAP;
  if (y + needed > USABLE_H) {
    addNewPage(doc);
    y = MARGIN + POST_BREAK_PAD;
  }
  setDraw(doc, C.divider);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 5;
  doc.setFontSize(FONT.h2);
  setTextColor(doc, C.headingText);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, y + 4);
  y += 10;
  return y;
}

function formatMileage(n: number | undefined | null): string {
  if (n == null) return "\u2014";
  return n.toLocaleString("en-GB");
}

function formatDate(iso?: string): string {
  if (!iso) return "\u2014";
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "\u2014";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "\u2014";
  }
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function statusColorRGB(colorName: string): RGB {
  switch (colorName) {
    case "emerald": return C.emerald;
    case "amber": return C.amber;
    case "red": return C.red;
    default: return C.slate400;
  }
}

function getTaxStatusColor(taxStatus?: string, taxDueDate?: string): string {
  if (!taxStatus) return "slate";
  if (taxStatus === "Taxed") {
    const days = daysUntil(taxDueDate);
    if (days === null || days > 30) return "emerald";
    if (days > 0) return "amber";
    return "red";
  }
  if (taxStatus === "Not Taxed") return "red";
  return "slate";
}

function getMotStatusColor(motStatus?: string, motExpiryDate?: string): string {
  if (!motStatus) return "slate";
  if (motStatus === "Valid") {
    const days = daysUntil(motExpiryDate);
    if (days === null || days > 30) return "emerald";
    if (days > 0) return "amber";
    return "red";
  }
  if (motStatus === "Expired") return "red";
  return "slate";
}

function stripEmoji(text: string): string {
  return text.replace(/^[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u26A0\uFE0F\u{1F6A8}\u2139\uFE0F\u{1F4C9}\u{2757}]+\s*/u, "").trim();
}

// ── Insight Card: measure + draw ─────────────────────────────────────────────

type InsightCardOptions = {
  x?: number;
  width?: number;
  skipPageBreak?: boolean;
};

/** Measure the height an insight card would occupy without drawing it */
function measureInsightCard(
  doc: jsPDF,
  title: string,
  lines: string[],
  width: number,
): number {
  // Temporarily set font to measure text
  doc.setFontSize(FONT.small);
  doc.setFont("helvetica", "normal");
  let wrappedCount = 0;
  for (const line of lines) {
    const split = doc.splitTextToSize(line, width - CARD_PAD_LEFT - 4);
    wrappedCount += split.length;
  }
  // Title is always 1 line
  void title; // title used for API consistency
  return CARD_PAD_TOP + CARD_TITLE_H + wrappedCount * CARD_LINE_H + CARD_PAD_BOTTOM;
}

/** Draw an insight card. Returns { endY, height }. */
function drawInsightCard(
  doc: jsPDF,
  startY: number,
  accentColor: RGB,
  title: string,
  lines: string[],
  options?: InsightCardOptions,
): { endY: number; height: number } {
  const cardX = options?.x ?? MARGIN;
  const cardW = options?.width ?? CONTENT_W;

  doc.setFontSize(FONT.small);
  doc.setFont("helvetica", "normal");
  let wrappedLines: string[] = [];
  for (const line of lines) {
    const split = doc.splitTextToSize(line, cardW - CARD_PAD_LEFT - 4);
    wrappedLines.push(...split);
  }
  const maxCardH = USABLE_H - MARGIN - POST_BREAK_PAD - 10;
  const maxLines = Math.floor((maxCardH - CARD_PAD_TOP - CARD_TITLE_H - CARD_PAD_BOTTOM) / CARD_LINE_H);
  if (wrappedLines.length > maxLines) {
    wrappedLines = wrappedLines.slice(0, maxLines - 1);
    wrappedLines.push("(See full details at freeplatecheck.co.uk)");
  }
  const cardH = CARD_PAD_TOP + CARD_TITLE_H + wrappedLines.length * CARD_LINE_H + CARD_PAD_BOTTOM;

  if (!options?.skipPageBreak) {
    startY = checkPageBreak(doc, startY, cardH + CARD_GAP);
  }

  drawRoundedRect(doc, cardX, startY, cardW, cardH, 2, C.cardBg, C.cardBorder);

  setFill(doc, accentColor);
  doc.rect(cardX, startY + 1.5, CARD_ACCENT_W, cardH - 3, "F");

  let textY = startY + CARD_PAD_TOP;
  doc.setFontSize(FONT.body);
  setTextColor(doc, C.headingText);
  doc.setFont("helvetica", "bold");
  doc.text(title, cardX + CARD_PAD_LEFT, textY + 2.5);
  textY += CARD_TITLE_H;

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.secondaryText);
  doc.setFont("helvetica", "normal");
  for (const line of wrappedLines) {
    doc.text(line, cardX + CARD_PAD_LEFT, textY + 2.5);
    textY += CARD_LINE_H;
  }

  return { endY: startY + cardH + CARD_GAP, height: cardH };
}

// ── Page Renderers ───────────────────────────────────────────────────────────

function renderCoverPage(doc: jsPDF, input: ReportInput): number {
  const { data, motInsights } = input;
  paintBackground(doc);

  // ── Header banner (simplified — no SVG icon) ──
  drawRoundedRect(doc, 0, 0, 210, 18, 0, C.slate800);
  setFill(doc, C.blue400);
  doc.rect(0, 0, 210, 1.2, "F");

  doc.setFontSize(FONT.h1);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, C.blue400);
  doc.text("Free Plate Check", 105, 12, { align: "center" });

  // Date below banner
  doc.setFontSize(FONT.small);
  setTextColor(doc, C.labelText);
  doc.setFont("helvetica", "normal");
  const genDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Vehicle Report \u00B7 ${genDate}`, 105, 24, { align: "center" });

  let y = 30;

  // ── Number plate ──
  drawNumberPlate(doc, 105, y, data.registrationNumber);
  y += 20;

  // ── Vehicle description ──
  const parts: string[] = [];
  if (data.yearOfManufacture) parts.push(String(data.yearOfManufacture));
  if (data.make) parts.push(data.make.toUpperCase());
  if (data.model) parts.push(data.model.toUpperCase());
  if (data.variant) parts.push(data.variant.toUpperCase());
  const engineDesc: string[] = [];
  if (data.engineCapacity) engineDesc.push(`${(data.engineCapacity / 1000).toFixed(1)}L`);
  if (data.fuelType) engineDesc.push(data.fuelType);
  if (data.colour) engineDesc.push(data.colour);
  const vehicleLine = parts.join(" ") + (engineDesc.length ? " \u00B7 " + engineDesc.join(" \u00B7 ") : "");

  doc.setFontSize(FONT.h3);
  setTextColor(doc, C.headingText);
  doc.setFont("helvetica", "normal");
  doc.text(vehicleLine, 105, y, { align: "center" });
  y += 10;

  // ── Status badges row ──
  const badgeW = (CONTENT_W - 3 * GUTTER) / 4;
  const motColor = statusColorRGB(getMotStatusColor(data.motStatus, data.motExpiryDate));
  const taxColor = statusColorRGB(getTaxStatusColor(data.taxStatus, data.taxDueDate));

  const totalAdvisories = data.motTests?.[0]?.rfrAndComments?.filter(
    (r) => r.type === "ADVISORY",
  ).length ?? 0;
  const advisoryColor = totalAdvisories > 0 ? C.amber : C.emerald;

  const mileageColor = motInsights
    ? motInsights.mileageTrend === "low" ? C.amber
    : motInsights.mileageTrend === "high" ? C.amber
    : C.emerald
    : C.slate400;

  drawStatusBadge(doc, MARGIN, y, badgeW, "MOT", data.motStatus || "Unknown", motColor);
  drawStatusBadge(doc, MARGIN + badgeW + GUTTER, y, badgeW, "TAX", data.taxStatus || "Unknown", taxColor);
  drawStatusBadge(
    doc,
    MARGIN + 2 * (badgeW + GUTTER),
    y,
    badgeW,
    "MILEAGE",
    motInsights?.latestMileage ? formatMileage(motInsights.latestMileage) : "\u2014",
    mileageColor,
  );
  drawStatusBadge(
    doc,
    MARGIN + 3 * (badgeW + GUTTER),
    y,
    badgeW,
    "ADVISORIES",
    String(totalAdvisories),
    advisoryColor,
  );
  y += 24;

  // ── Key stats: 1×4 row ──
  const statW = (CONTENT_W - 3 * GUTTER) / 4;
  const statH = 14;
  const stats = [
    { label: "Pass Rate", value: motInsights ? `${motInsights.passRate}%` : "\u2014" },
    { label: "Total Tests", value: motInsights ? String(motInsights.totalTests) : "\u2014" },
    { label: "Avg Miles/Yr", value: motInsights?.avgMilesPerYear ? formatMileage(motInsights.avgMilesPerYear) : "\u2014" },
    { label: "Vehicle Age", value: data.yearOfManufacture ? `${new Date().getFullYear() - data.yearOfManufacture} yrs` : "\u2014" },
  ];

  for (let i = 0; i < 4; i++) {
    const cx = MARGIN + i * (statW + GUTTER);
    drawRoundedRect(doc, cx, y, statW, statH, 2, C.cardBg, C.cardBorder);

    doc.setFontSize(FONT.tiny);
    setTextColor(doc, C.secondaryText);
    doc.setFont("helvetica", "normal");
    doc.text(stats[i].label, cx + 3, y + 5);

    doc.setFontSize(FONT.h3);
    setTextColor(doc, C.headingText);
    doc.setFont("helvetica", "bold");
    doc.text(stats[i].value, cx + 3, y + 12);
  }
  y += statH + 6;

  // ── Latest MOT summary (dynamic height) ──
  const motSummaryH = 22;
  y = checkPageBreak(doc, y, motSummaryH + 4);
  drawRoundedRect(doc, MARGIN, y, CONTENT_W, motSummaryH, 3, C.cardBg, C.cardBorder);

  doc.setFontSize(FONT.body);
  setTextColor(doc, C.secondaryText);
  doc.setFont("helvetica", "bold");
  doc.text("Latest MOT", MARGIN + 5, y + 7);

  doc.setFont("helvetica", "normal");
  setTextColor(doc, C.bodyText);

  if (data.motTests && data.motTests.length > 0) {
    const latest = data.motTests[0];
    const resultColor = latest.testResult === "PASSED" ? C.emerald : C.red;
    const advisoryCount = latest.rfrAndComments?.filter((r) => r.type === "ADVISORY").length ?? 0;
    const defectCount = latest.rfrAndComments?.filter((r) => r.type === "DEFECT").length ?? 0;

    doc.setFontSize(FONT.body);
    setTextColor(doc, resultColor);
    doc.setFont("helvetica", "bold");
    doc.text(latest.testResult, MARGIN + 5, y + 14);

    setTextColor(doc, C.bodyText);
    doc.setFont("helvetica", "normal");
    const summaryParts = [
      formatDate(latest.completedDate),
      latest.odometer?.value ? `${formatMileage(latest.odometer.value)} mi` : null,
      advisoryCount > 0 ? `${advisoryCount} advisor${advisoryCount !== 1 ? "ies" : "y"}` : null,
      defectCount > 0 ? `${defectCount} defect${defectCount !== 1 ? "s" : ""}` : null,
    ].filter(Boolean);
    doc.text(summaryParts.join("  \u00B7  "), MARGIN + 5, y + 20);

    if (data.motExpiryDate) {
      const daysLeft = daysUntil(data.motExpiryDate);
      const expiryText = daysLeft !== null && daysLeft < 0
        ? `Expired ${Math.abs(daysLeft)} days ago`
        : daysLeft !== null
          ? `Expires in ${daysLeft} days`
          : `Expires ${formatDate(data.motExpiryDate)}`;
      const expiryColor = daysLeft !== null && daysLeft < 0 ? C.red : daysLeft !== null && daysLeft < 30 ? C.amber : C.emerald;
      doc.setFontSize(FONT.small);
      setTextColor(doc, expiryColor);
      doc.text(expiryText, MARGIN + CONTENT_W - 5, y + 14, { align: "right" });
    }
  } else {
    doc.setFontSize(FONT.body);
    setTextColor(doc, C.secondaryText);
    doc.text("No MOT history available", MARGIN + 5, y + 14);
  }

  y += motSummaryH + 4;
  return y;
}

function renderMileageProgression(doc: jsPDF, input: ReportInput, y: number): number {
  const tests = input.data.motTests;
  if (!tests || tests.length < 2) return y;

  const mileageEntries = [...tests]
    .filter((t) => t.odometer?.value != null)
    .sort((a, b) => new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime());

  if (mileageEntries.length < 2) return y;

  y = startSection(doc, y, "Mileage Progression", 20);

  const colDate = 28;
  const colMileage = 28;
  const colChange = 25;
  const colMPY = 25;
  const rowH = 6;

  function drawTableHeader(startY: number): number {
    drawRoundedRect(doc, MARGIN, startY, CONTENT_W, rowH, 0, C.divider);
    doc.setFontSize(FONT.small);
    setTextColor(doc, C.headingText);
    doc.setFont("helvetica", "bold");
    let hx = MARGIN + 3;
    doc.text("Date", hx, startY + 4.5); hx += colDate;
    doc.text("Mileage", hx, startY + 4.5); hx += colMileage;
    doc.text("Change", hx, startY + 4.5); hx += colChange;
    doc.text("Miles/Yr", hx, startY + 4.5); hx += colMPY;
    doc.text("Notes", hx, startY + 4.5);
    return startY + rowH + 1;
  }

  y = drawTableHeader(y);

  for (let i = 0; i < mileageEntries.length; i++) {
    const entry = mileageEntries[i];
    const mileage = entry.odometer!.value;
    const entryDate = new Date(entry.completedDate);

    let change = "";
    let milesPerYear = "";
    let notes = "";
    let noteColor: RGB = C.bodyText;

    if (i > 0) {
      const prev = mileageEntries[i - 1];
      const prevMileage = prev.odometer!.value;
      const prevDate = new Date(prev.completedDate);
      const diff = mileage - prevMileage;
      const daysBetween = (entryDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      change = diff < 0 ? `-${formatMileage(Math.abs(diff))}` : `+${formatMileage(diff)}`;

      if (daysBetween > 30) {
        const yearFrac = daysBetween / 365.25;
        const mpy = Math.round(diff / yearFrac);
        milesPerYear = formatMileage(mpy);
      }

      if (diff < 0) {
        notes = "MILEAGE DISCREPANCY";
        noteColor = C.red;
      } else if (daysBetween > 30) {
        const yearFrac = daysBetween / 365.25;
        const mpy = diff / yearFrac;
        if (mpy > 20000) {
          notes = "Very high use";
          noteColor = C.amber;
        }
      }
    }

    if (y + rowH > USABLE_H) {
      addNewPage(doc);
      y = MARGIN + POST_BREAK_PAD;
      setDraw(doc, C.divider);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, y - 1, MARGIN + CONTENT_W, y - 1);
      y = drawTableHeader(y);
    }

    const bgColor = i % 2 === 0 ? C.white : C.tableBgAlt;
    setFill(doc, bgColor);
    doc.rect(MARGIN, y, CONTENT_W, rowH, "F");

    doc.setFontSize(FONT.small);
    doc.setFont("helvetica", "normal");
    setTextColor(doc, C.bodyText);

    let cx = MARGIN + 3;
    doc.text(formatDate(entry.completedDate), cx, y + 4.5); cx += colDate;
    doc.text(formatMileage(mileage), cx, y + 4.5); cx += colMileage;

    if (change.startsWith("-")) {
      setTextColor(doc, C.red);
    }
    doc.text(change, cx, y + 4.5); cx += colChange;
    setTextColor(doc, C.bodyText);
    doc.text(milesPerYear, cx, y + 4.5); cx += colMPY;

    if (notes) {
      setTextColor(doc, noteColor);
      doc.setFont("helvetica", "bold");
      doc.text(notes, cx, y + 4.5);
      doc.setFont("helvetica", "normal");
    }

    y += rowH;
  }

  y += 3;
  return y;
}

function renderMotHistory(doc: jsPDF, input: ReportInput, y: number): number {
  const { data } = input;
  const tests = data.motTests;

  y = startSection(doc, y, "MOT History", 15);

  if (!tests || tests.length === 0) {
    doc.setFontSize(FONT.body);
    setTextColor(doc, C.secondaryText);
    doc.setFont("helvetica", "normal");
    doc.text("No MOT history available for this vehicle.", MARGIN, y + 4);
    return y + 8;
  }

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.secondaryText);
  doc.setFont("helvetica", "normal");
  doc.text(`${tests.length} test${tests.length !== 1 ? "s" : ""} on record`, MARGIN, y);
  y += 5;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const items = test.rfrAndComments || [];
    const advisories = items.filter((r) => r.type === "ADVISORY");
    const defects = items.filter((r) => r.type === "DEFECT");
    const comments = items.filter((r) => r.type === "COMMENT");
    const isPassed = test.testResult === "PASSED";
    const accentColor = isPassed ? C.emerald : test.testResult === "FAILED" ? C.red : C.slate400;
    const itemCount = advisories.length + defects.length + comments.length;

    // ── Compact single-line row for clean PASS (0 items) ──
    if (isPassed && itemCount === 0) {
      const compactH = 7;
      y = checkPageBreak(doc, y, compactH + 2);

      drawRoundedRect(doc, MARGIN, y, CONTENT_W, compactH, 2, C.cardBg, C.cardBorder);
      setFill(doc, C.emerald);
      doc.rect(MARGIN, y + 1.5, CARD_ACCENT_W, compactH - 3, "F");

      const badgeText = "PASS";
      doc.setFontSize(FONT.small);
      doc.setFont("helvetica", "bold");
      const badgeW = doc.getTextWidth(badgeText) + 4;
      drawRoundedRect(doc, MARGIN + 5, y + 1.5, badgeW, 4, 1.5, C.emerald);
      setTextColor(doc, C.white);
      doc.text(badgeText, MARGIN + 5 + badgeW / 2, y + 4.5, { align: "center" });

      setTextColor(doc, C.bodyText);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(test.completedDate), MARGIN + 5 + badgeW + 3, y + 4.5);

      if (test.odometer?.value) {
        doc.text(
          `${formatMileage(test.odometer.value)} mi`,
          MARGIN + CONTENT_W - 5,
          y + 4.5,
          { align: "right" },
        );
      }

      if (test.motTestNumber) {
        doc.setFontSize(FONT.tiny);
        setTextColor(doc, C.secondaryText);
        const mileageTextW = test.odometer?.value ? doc.getTextWidth(`${formatMileage(test.odometer.value)} mi`) + 6 : 0;
        doc.text(`Ref: ${test.motTestNumber}`, MARGIN + CONTENT_W - 5 - mileageTextW, y + 4.5, { align: "right" });
      }

      y += compactH + 2;
      continue;
    }

    // ── Full card for tests with items or FAILED ──
    const estimatedHeight = 20 + itemCount * 5 + 5;
    y = checkPageBreak(doc, y, Math.min(estimatedHeight, USABLE_H - MARGIN - 5));

    const cardStartY = y;
    const cardStartPage = doc.getNumberOfPages();
    y += 5;

    doc.setFontSize(FONT.body);
    setTextColor(doc, C.headingText);
    doc.setFont("helvetica", "bold");
    doc.text(formatDate(test.completedDate), MARGIN + 7, y + 3);

    const badgeText = test.testResult === "PASSED" ? "PASS" : test.testResult === "FAILED" ? "FAIL" : "N/A";
    const badgeW = doc.getTextWidth(badgeText) + 5;
    const badgeX = MARGIN + 50;
    drawRoundedRect(doc, badgeX, y - 1, badgeW, 6, 2, accentColor);
    doc.setFontSize(FONT.small);
    setTextColor(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.text(badgeText, badgeX + badgeW / 2, y + 3, { align: "center" });

    setTextColor(doc, C.bodyText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.body);
    if (test.odometer?.value) {
      doc.text(`${formatMileage(test.odometer.value)} miles`, MARGIN + CONTENT_W - 7, y + 3, { align: "right" });
    }

    if (test.motTestNumber) {
      doc.setFontSize(FONT.tiny);
      setTextColor(doc, C.secondaryText);
      doc.text(`Ref: ${test.motTestNumber}`, MARGIN + CONTENT_W - 7, y + 8, { align: "right" });
    }

    y += 9;

    const allItems = [
      ...defects.map((d) => ({ ...d, prefix: "DEFECT", color: C.red })),
      ...advisories.map((a) => ({ ...a, prefix: "ADVISORY", color: C.amber })),
      ...comments.map((c) => ({ ...c, prefix: "NOTE", color: C.secondaryText })),
    ];

    for (const item of allItems) {
      y = checkPageBreak(doc, y, 5);

      doc.setFontSize(FONT.small);
      setTextColor(doc, item.color);
      doc.setFont("helvetica", "bold");
      doc.text(item.prefix, MARGIN + 9, y + 2.5);

      setTextColor(doc, C.bodyText);
      doc.setFont("helvetica", "normal");
      const prefixW = doc.getTextWidth(item.prefix + "  ");
      const maxTextW = CONTENT_W - 16 - prefixW;
      const lines = doc.splitTextToSize(item.text, maxTextW);
      for (let li = 0; li < lines.length; li++) {
        if (li > 0) {
          y += 3.5;
          y = checkPageBreak(doc, y, 4);
        }
        doc.text(lines[li], MARGIN + 9 + prefixW, y + 2.5);
      }
      y += 4.5;
    }

    y += 2;

    const cardEndPage = doc.getNumberOfPages();
    if (cardEndPage === cardStartPage) {
      const cardH = y - cardStartY;
      setDraw(doc, C.cardBorder);
      doc.setLineWidth(0.3);
      doc.roundedRect(MARGIN, cardStartY, CONTENT_W, cardH, 2, 2, "S");

      setFill(doc, accentColor);
      doc.rect(MARGIN, cardStartY + 1.5, CARD_ACCENT_W, cardH - 3, "F");
    }

    y += 2;
  }

  return y;
}

function renderMileageWarnings(doc: jsPDF, input: ReportInput, y: number): number {
  const warnings = input.motInsights?.mileageWarnings;
  if (!warnings || warnings.length === 0) return y;

  y = startSection(doc, y, "Mileage Warnings", 15);

  for (const warning of warnings) {
    const cleaned = stripEmoji(warning);
    const isClocking = cleaned.toUpperCase().includes("ALERT") || cleaned.toUpperCase().includes("DECREASED");
    const accent = isClocking ? C.red : C.amber;
    y = drawInsightCard(doc, y, accent, isClocking ? "Clocking Alert" : "Mileage Anomaly", [cleaned]).endY;
  }

  return y;
}

function renderRecurringAdvisories(doc: jsPDF, input: ReportInput, y: number): number {
  const recurring = input.motInsights?.recurringAdvisories;
  if (!recurring || recurring.length === 0) return y;

  y = startSection(doc, y, "Recurring Advisories", 15);

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.secondaryText);
  doc.setFont("helvetica", "normal");
  doc.text("Advisories appearing on 2 or more MOT tests", MARGIN, y);
  y += 4;

  for (const adv of recurring) {
    // Dynamic height based on text
    doc.setFontSize(FONT.small);
    doc.setFont("helvetica", "normal");
    const countText = `${adv.count}x`;
    doc.setFont("helvetica", "bold");
    const countW = doc.getTextWidth(countText) + 4;
    doc.setFont("helvetica", "normal");
    const maxW = CONTENT_W - 18 - countW;
    const lines = doc.splitTextToSize(adv.text, maxW);
    const cardH = Math.max(12, 6 + lines.length * 3.5 + 2);

    y = checkPageBreak(doc, y, cardH + 2);

    drawRoundedRect(doc, MARGIN, y, CONTENT_W, cardH, 2, C.cardBg, C.cardBorder);

    setFill(doc, C.amber);
    doc.rect(MARGIN, y + 1.5, CARD_ACCENT_W, cardH - 3, "F");

    doc.setFontSize(FONT.small);
    doc.setFont("helvetica", "bold");
    drawRoundedRect(doc, MARGIN + 7, y + 3, countW, 5, 1.5, C.amber);
    setTextColor(doc, C.white);
    doc.text(countText, MARGIN + 7 + countW / 2, y + 6.5, { align: "center" });

    setTextColor(doc, C.bodyText);
    doc.setFont("helvetica", "normal");
    let textY = y + 6.5;
    for (let li = 0; li < lines.length; li++) {
      doc.text(lines[li], MARGIN + 11 + countW, textY);
      textY += 3.5;
    }

    y += cardH + 2;
  }

  return y;
}

function renderHealthScore(doc: jsPDF, input: ReportInput, y: number): number {
  const hs = input.healthScore;
  if (!hs) return y;

  y = startSection(doc, y, "Vehicle Health Score", 30);

  // Dynamic card height: top section (grade + score) + breakdown rows
  const topH = 24;
  const itemsPerRow = 4;
  const rowH = 10;
  const breakdownRows = Math.ceil(hs.breakdown.length / itemsPerRow);
  const cardH = topH + breakdownRows * rowH + 3;

  y = checkPageBreak(doc, y, cardH + 3);
  drawRoundedRect(doc, MARGIN, y, CONTENT_W, cardH, 3, C.cardBg, C.cardBorder);

  // Grade badge
  const gradeColor: RGB = hs.grade === "A" ? C.emerald : hs.grade === "B" ? C.blue : hs.grade === "C" ? C.amber : C.red;
  const badgeSize = 18;
  const badgeX = MARGIN + 6;
  const badgeY = y + 4;
  drawRoundedRect(doc, badgeX, badgeY, badgeSize, badgeSize, 3, gradeColor);
  doc.setFontSize(15);
  setTextColor(doc, C.white);
  doc.setFont("helvetica", "bold");
  doc.text(hs.grade, badgeX + badgeSize / 2, badgeY + 12.5, { align: "center" });

  // Score text
  doc.setFontSize(FONT.h2);
  setTextColor(doc, C.headingText);
  doc.text(`${hs.score}/100`, badgeX + badgeSize + 6, badgeY + 7);
  doc.setFontSize(FONT.body);
  setTextColor(doc, gradeColor);
  doc.text(hs.label, badgeX + badgeSize + 6, badgeY + 14);

  // Breakdown rows (4 items per row, dynamic rows)
  const colW = (CONTENT_W - 12) / itemsPerRow;
  for (let i = 0; i < hs.breakdown.length; i++) {
    const item = hs.breakdown[i];
    const row = Math.floor(i / itemsPerRow);
    const col = i % itemsPerRow;
    const cx = MARGIN + 6 + col * colW;
    const cy = y + topH + row * rowH;

    doc.setFontSize(FONT.tiny);
    setTextColor(doc, C.secondaryText);
    doc.setFont("helvetica", "normal");
    doc.text(item.category, cx, cy);
    const itemColor: RGB = item.score >= item.maxScore * 0.8 ? C.emerald : item.score >= item.maxScore * 0.5 ? C.amber : C.red;
    setTextColor(doc, itemColor);
    doc.setFont("helvetica", "bold");
    doc.text(`${item.score}/${item.maxScore}`, cx, cy + 4);
  }

  y += cardH + 3;
  return y;
}

function renderMotReadiness(doc: jsPDF, input: ReportInput, y: number): number {
  const mr = input.motReadiness;
  if (!mr || mr.advisoryCount <= 0) return y;

  y = startSection(doc, y, "MOT Readiness", 20);

  // Score badge
  const scoreColor: RGB = mr.score === "red" ? C.red : mr.score === "amber" ? C.amber : C.emerald;
  const scoreLabel = mr.score.toUpperCase();

  // Header card with score + advisory count + days until MOT
  const headerH = 14;
  y = checkPageBreak(doc, y, headerH + 4);
  drawRoundedRect(doc, MARGIN, y, CONTENT_W, headerH, 3, C.cardBg, C.cardBorder);
  setFill(doc, scoreColor);
  doc.rect(MARGIN, y + 1.5, CARD_ACCENT_W, headerH - 3, "F");

  // Score badge pill
  doc.setFontSize(FONT.small);
  doc.setFont("helvetica", "bold");
  const badgeW = doc.getTextWidth(scoreLabel) + 6;
  drawRoundedRect(doc, MARGIN + 7, y + 4, badgeW, 6, 2, scoreColor);
  setTextColor(doc, C.white);
  doc.text(scoreLabel, MARGIN + 7 + badgeW / 2, y + 8, { align: "center" });

  // Label and counts
  doc.setFontSize(FONT.body);
  setTextColor(doc, C.headingText);
  doc.setFont("helvetica", "bold");
  doc.text(mr.label, MARGIN + 7 + badgeW + 4, y + 8);

  const rightParts: string[] = [];
  rightParts.push(`${mr.advisoryCount} advisor${mr.advisoryCount !== 1 ? "ies" : "y"}`);
  if (mr.daysUntilMot > 0) rightParts.push(`MOT in ${mr.daysUntilMot} days`);
  doc.setFontSize(FONT.small);
  setTextColor(doc, C.secondaryText);
  doc.setFont("helvetica", "normal");
  doc.text(rightParts.join(" \u00B7 "), MARGIN + CONTENT_W - 5, y + 8, { align: "right" });

  y += headerH + 2;

  // Risk items table
  if (mr.riskItems && mr.riskItems.length > 0) {
    const rowH = 6;

    // Table header
    y = checkPageBreak(doc, y, rowH + 2);
    drawRoundedRect(doc, MARGIN, y, CONTENT_W, rowH, 0, C.divider);
    doc.setFontSize(FONT.small);
    setTextColor(doc, C.headingText);
    doc.setFont("helvetica", "bold");
    doc.text("Risk", MARGIN + 3, y + 4.5);
    doc.text("Category", MARGIN + 22, y + 4.5);
    doc.text("Advisory", MARGIN + 55, y + 4.5);
    doc.text("Est. Cost", MARGIN + CONTENT_W - 5, y + 4.5, { align: "right" });
    y += rowH + 1;

    for (let i = 0; i < mr.riskItems.length; i++) {
      const item = mr.riskItems[i];
      y = checkPageBreak(doc, y, rowH + 1);

      const bgColor = i % 2 === 0 ? C.white : C.tableBgAlt;
      setFill(doc, bgColor);
      doc.rect(MARGIN, y, CONTENT_W, rowH, "F");

      // Risk level badge
      const riskColor: RGB = item.risk === "high" ? C.red : item.risk === "medium" ? C.amber : C.emerald;
      const riskText = item.risk.toUpperCase();
      doc.setFontSize(FONT.tiny);
      doc.setFont("helvetica", "bold");
      const riskW = doc.getTextWidth(riskText) + 3;
      drawRoundedRect(doc, MARGIN + 3, y + 1.5, riskW, 3.5, 1, riskColor);
      setTextColor(doc, C.white);
      doc.text(riskText, MARGIN + 3 + riskW / 2, y + 4, { align: "center" });

      // Category
      doc.setFontSize(FONT.small);
      setTextColor(doc, C.bodyText);
      doc.setFont("helvetica", "normal");
      doc.text(item.categoryLabel, MARGIN + 22, y + 4.5);

      // Advisory text (truncated)
      const maxTextW = CONTENT_W - 90;
      const truncText = doc.splitTextToSize(item.text, maxTextW);
      doc.text(truncText[0], MARGIN + 55, y + 4.5);

      // Cost range
      setTextColor(doc, C.secondaryText);
      doc.text(`\u00A3${item.estimatedCost.low}\u2013\u00A3${item.estimatedCost.high}`, MARGIN + CONTENT_W - 5, y + 4.5, { align: "right" });

      y += rowH;
    }
    y += 2;
  }

  // Total estimated cost
  if (mr.totalEstimatedCost.high > 0) {
    y = checkPageBreak(doc, y, 8);
    drawRoundedRect(doc, MARGIN, y, CONTENT_W, 7, 2, C.cardBg, C.cardBorder);
    doc.setFontSize(FONT.body);
    setTextColor(doc, C.headingText);
    doc.setFont("helvetica", "bold");
    doc.text("Total estimated repair cost", MARGIN + 5, y + 5);
    doc.text(
      `\u00A3${mr.totalEstimatedCost.low.toLocaleString()}\u2013\u00A3${mr.totalEstimatedCost.high.toLocaleString()}`,
      MARGIN + CONTENT_W - 5,
      y + 5,
      { align: "right" },
    );
    y += 9;
  }

  // Disclaimer
  if (mr.disclaimer) {
    y = checkPageBreak(doc, y, 6);
    doc.setFontSize(FONT.tiny);
    setTextColor(doc, C.secondaryText);
    doc.setFont("helvetica", "normal");
    const disclaimerLines = doc.splitTextToSize(mr.disclaimer, CONTENT_W - 4);
    for (const line of disclaimerLines) {
      doc.text(line, MARGIN, y + 2.5);
      y += 3;
    }
    y += 2;
  }

  return y;
}

function renderSafetyRecalls(doc: jsPDF, input: ReportInput, y: number): number {
  const { recalls } = input;
  const hasRecalls = recalls !== undefined;
  if (!hasRecalls) return y;

  y = startSection(doc, y, "Safety Recalls", 15);

  if (recalls!.length === 0) {
    y = drawInsightCard(doc, y, C.emerald, "No Recalls Found", [
      "No known safety recalls found for this vehicle.",
    ]).endY;
  } else {
    // Show ALL recalls with full detail
    doc.setFontSize(FONT.body);
    setTextColor(doc, C.headingText);
    doc.setFont("helvetica", "bold");
    doc.text(`${recalls!.length} recall${recalls!.length !== 1 ? "s" : ""} found`, MARGIN, y + 3);
    y += 7;

    for (const r of recalls!) {
      // Build lines for this recall
      const lines: string[] = [];
      if (r.defect) lines.push(`Defect: ${r.defect}`);
      if (r.remedy) lines.push(`Remedy: ${r.remedy}`);

      const title = `${r.recallDate} \u2014 Recall ${r.recallNumber}`;
      y = drawInsightCard(doc, y, C.red, title, lines).endY;
    }
  }

  return y;
}

function renderUlezCompliance(doc: jsPDF, input: ReportInput, y: number): number {
  const { ulezResult } = input;
  const hasUlez = ulezResult && ulezResult.status !== "unknown";
  if (!hasUlez) return y;

  y = startSection(doc, y, "ULEZ Compliance", 15);

  const isCompliant = ulezResult!.status === "compliant" || ulezResult!.status === "exempt";
  const accent = isCompliant ? C.emerald : ulezResult!.status === "non-compliant" ? C.red : C.secondaryText;
  const statusLabel = ulezResult!.status === "exempt" ? "Exempt" : isCompliant ? "Compliant" : "Non-compliant";
  const lines = [
    ulezResult!.reason,
    `Confidence: ${ulezResult!.confidence}`,
  ];
  if (!isCompliant && ulezResult!.cleanAirZones && ulezResult!.cleanAirZones.length > 0) {
    const carZones = ulezResult!.cleanAirZones.filter(z => z.carsCharged !== false);
    const commercialOnly = ulezResult!.cleanAirZones.filter(z => z.carsCharged === false);
    if (carZones.length > 0) {
      lines.push("", "Zones charging cars:");
      for (const zone of carZones) {
        lines.push(`  ${zone.name}: ${zone.dailyCharge}`);
      }
    }
    if (commercialOnly.length > 0) {
      lines.push("", "Commercial vehicles only (cars exempt):");
      for (const zone of commercialOnly) {
        lines.push(`  ${zone.name}: ${zone.dailyCharge}`);
      }
    }
  }
  y = drawInsightCard(doc, y, accent, `ULEZ: ${statusLabel}`, lines).endY;

  return y;
}

function renderValuation(doc: jsPDF, input: ReportInput, y: number): number {
  const { valuation } = input;
  const hasValuation = valuation && valuation.rangeLow > 0;
  if (!hasValuation) return y;

  y = startSection(doc, y, "Estimated Value", 20);

  // Headline price card
  const headlineH = 16;
  y = checkPageBreak(doc, y, headlineH + 4);
  drawRoundedRect(doc, MARGIN, y, CONTENT_W, headlineH, 3, C.cardBg, C.cardBorder);
  setFill(doc, C.blue);
  doc.rect(MARGIN, y + 1.5, CARD_ACCENT_W, headlineH - 3, "F");

  doc.setFontSize(FONT.h2);
  setTextColor(doc, C.headingText);
  doc.setFont("helvetica", "bold");
  doc.text(`\u00A3${valuation!.rangeLow.toLocaleString()} \u2013 \u00A3${valuation!.rangeHigh.toLocaleString()}`, MARGIN + 8, y + 10);

  // Confidence badge
  const confLabel = valuation!.confidence === "high" ? "High" : valuation!.confidence === "medium" ? "Medium" : "Low";
  const confColor = valuation!.confidence === "high" ? C.emerald : valuation!.confidence === "medium" ? C.amber : C.red;
  doc.setFontSize(FONT.small);
  doc.setFont("helvetica", "bold");
  const confText = `${confLabel} confidence`;
  const confW = doc.getTextWidth(confText) + 4;
  drawRoundedRect(doc, MARGIN + CONTENT_W - 5 - confW, y + 5, confW, 5, 1.5, confColor);
  setTextColor(doc, C.white);
  doc.text(confText, MARGIN + CONTENT_W - 5 - confW / 2, y + 8.5, { align: "center" });

  y += headlineH + 3;

  // Detail grid — 2-column
  const detailLines: string[] = [];
  detailLines.push(`Sources: ${valuation!.sources.join(", ")}`);
  if (valuation!.ebayMinPrice && valuation!.ebayMaxPrice) {
    detailLines.push(`Asking prices: \u00A3${valuation!.ebayMinPrice.toLocaleString()} \u2013 \u00A3${valuation!.ebayMaxPrice.toLocaleString()}`);
  }
  if (valuation!.ebayDominantTransmission || valuation!.ebayDominantBodyType) {
    const specParts: string[] = [];
    if (valuation!.ebayDominantTransmission) specParts.push(valuation!.ebayDominantTransmission);
    if (valuation!.ebayDominantBodyType) specParts.push(valuation!.ebayDominantBodyType);
    detailLines.push(`Common spec: ${specParts.join(", ")}`);
  }
  if (valuation!.marketSupply) {
    const supplyLabel = valuation!.marketSupply === "good" ? "Good" : valuation!.marketSupply === "moderate" ? "Moderate" : "Limited";
    const countSuffix = valuation!.ebayTotalListings ? ` (${valuation!.ebayTotalListings} listings)` : "";
    detailLines.push(`Market supply: ${supplyLabel}${countSuffix}`);
  }
  const adjustments: string[] = [];
  if (valuation!.mileageAdjustmentPercent != null && valuation!.mileageAdjustmentPercent !== 0) {
    adjustments.push(`Mileage ${valuation!.mileageAdjustmentPercent > 0 ? "+" : ""}${valuation!.mileageAdjustmentPercent.toFixed(0)}%`);
  }
  if (valuation!.conditionAdjustmentPercent != null && valuation!.conditionAdjustmentPercent !== 0) {
    adjustments.push(`Condition ${valuation!.conditionAdjustmentPercent > 0 ? "+" : ""}${valuation!.conditionAdjustmentPercent.toFixed(0)}%`);
  }
  if (valuation!.colourAdjustmentPercent != null && valuation!.colourAdjustmentPercent !== 0) {
    adjustments.push(`Colour ${valuation!.colourAdjustmentPercent > 0 ? "+" : ""}${valuation!.colourAdjustmentPercent.toFixed(0)}%`);
  }
  if (adjustments.length > 0) {
    detailLines.push(`Adjustments: ${adjustments.join(", ")}`);
  }

  if (detailLines.length > 0) {
    // Draw as a mini table
    const rowH = 5;
    for (let i = 0; i < detailLines.length; i++) {
      y = checkPageBreak(doc, y, rowH + 1);
      const bgColor = i % 2 === 0 ? C.white : C.tableBgAlt;
      setFill(doc, bgColor);
      doc.rect(MARGIN, y, CONTENT_W, rowH, "F");
      doc.setFontSize(FONT.small);
      setTextColor(doc, C.bodyText);
      doc.setFont("helvetica", "normal");
      doc.text(detailLines[i], MARGIN + 4, y + 3.5);
      y += rowH;
    }
    y += 2;
  }

  return y;
}

function renderRunningCosts(doc: jsPDF, input: ReportInput, y: number): number {
  const { ownershipCost } = input;
  const hasOwnershipCost = ownershipCost && ownershipCost.totalAnnual > 0;
  if (!hasOwnershipCost) return y;

  y = startSection(doc, y, "Annual Running Costs", 15);

  const oc = ownershipCost!;
  const monthly = Math.round(oc.totalAnnual / 12);
  const daily = Math.round((oc.totalAnnual / 365) * 100) / 100;
  const lines: string[] = [
    `\u00A3${oc.totalAnnual.toLocaleString()}/year (\u00A3${monthly.toLocaleString()}/month \u00B7 \u00A3${daily.toFixed(2)}/day)`,
  ];
  const parts: string[] = [];
  if (oc.breakdown.fuel != null) parts.push(`Fuel \u00A3${oc.breakdown.fuel.toLocaleString()}`);
  if (oc.breakdown.ved != null) parts.push(`VED \u00A3${oc.breakdown.ved}`);
  if (oc.breakdown.depreciation != null) parts.push(`Depreciation \u00A3${oc.breakdown.depreciation.toLocaleString()}`);
  if (oc.breakdown.maintenance != null) parts.push(`Maintenance \u00A3${oc.breakdown.maintenance.toLocaleString()}`);
  if (oc.breakdown.mot != null) parts.push(`MOT \u00A3${oc.breakdown.mot}`);
  if (parts.length > 0) lines.push(parts.join(" \u00B7 "));

  // UK average benchmark
  if (input.ukAverageCost && input.ukAverageLabel) {
    const diff = oc.totalAnnual - input.ukAverageCost;
    const comparison = diff > 0
      ? `\u00A3${Math.abs(diff).toLocaleString()} above`
      : diff < 0
        ? `\u00A3${Math.abs(diff).toLocaleString()} below`
        : "equal to";
    lines.push(`vs Typical ${input.ukAverageLabel}: \u00A3${input.ukAverageCost.toLocaleString()}/yr \u2014 ${comparison}`);
  }

  lines.push(oc.excludedNote);
  y = drawInsightCard(doc, y, C.blue, "Annual Running Costs", lines).endY;

  return y;
}

function renderNegotiationHelper(doc: jsPDF, input: ReportInput, y: number): number {
  const { negotiation } = input;
  if (!negotiation) return y;

  y = startSection(doc, y, "Negotiation Helper", 15);

  const neg = negotiation;
  const lines: string[] = [
    `Suggested discount: ${neg.suggestedDiscountPercent.low}\u2013${neg.suggestedDiscountPercent.high}% below asking`,
    `Estimated saving: \u00A3${neg.estimatedSaving.low.toLocaleString()}\u2013\u00A3${neg.estimatedSaving.high.toLocaleString()}`,
    `Confidence: ${neg.confidence}`,
  ];
  for (const reason of neg.reasons) {
    lines.push(`\u2022 ${reason}`);
  }
  y = drawInsightCard(doc, y, C.emerald, "Negotiation Helper", lines).endY;

  return y;
}

function renderEnrichedInsights(doc: jsPDF, input: ReportInput, y: number): number {
  const { vedResult, fuelEconomy, fuelPrices, ncapRating, colourPopularity, theftRisk, evSpecs } = input;

  const hasVed = vedResult && vedResult.estimatedAnnualRate !== null;
  const hasFuel = fuelEconomy && fuelEconomy.combinedMpg > 0;
  const hasFuelPrices = fuelPrices && (fuelPrices.petrol > 0 || fuelPrices.diesel > 0);
  const hasNcap = ncapRating && ncapRating.overallStars > 0;
  const hasRarity = input.rarityResult && input.rarityResult.total > 0;
  const hasColour = colourPopularity && input.data.colour;
  const hasTheftRisk = !!theftRisk;
  const hasEvSpecs = !!evSpecs;

  if (!hasVed && !hasFuel && !hasNcap && !hasRarity && !hasColour && !hasFuelPrices && !hasTheftRisk && !hasEvSpecs && !input.ecoScore && !input.motPassRate) return y;

  y = startSection(doc, y, "Key Insights", 15);

  // Build all cards as data for 2-column layout
  type CardData = { accentColor: RGB; title: string; lines: string[] };
  const cards: CardData[] = [];

  // VED Road Tax
  if (hasVed) {
    const sixMonthText = vedResult!.estimatedSixMonthRate != null ? ` (\u00A3${vedResult!.estimatedSixMonthRate} for 6 months)` : "";
    const lines: string[] = [`Estimated \u00A3${vedResult!.estimatedAnnualRate}/year${sixMonthText}`];
    if (vedResult!.band) lines.push(`Band: ${vedResult!.band}`);
    if (vedResult!.details) {
      const firstSentence = vedResult!.details.split(".")[0];
      if (firstSentence) lines.push(firstSentence + ".");
    }
    cards.push({ accentColor: C.blue, title: "VED Road Tax", lines });
  }

  // Fuel Economy
  if (hasFuel) {
    const lines: string[] = [`${fuelEconomy!.combinedMpg.toFixed(1)} MPG (combined)`];
    if (fuelEconomy!.urbanMpg) lines.push(`Urban: ${fuelEconomy!.urbanMpg.toFixed(1)} MPG`);
    if (fuelEconomy!.extraUrbanMpg) lines.push(`Extra-urban: ${fuelEconomy!.extraUrbanMpg.toFixed(1)} MPG`);
    lines.push(`Est. annual fuel cost: \u00A3${fuelEconomy!.estimatedAnnualCost}`);
    if (hasFuelPrices) {
      lines.push(`${fuelPrices!.petrol.toFixed(1)}p petrol, ${fuelPrices!.diesel.toFixed(1)}p diesel`);
    }
    cards.push({ accentColor: C.blue, title: "Fuel Economy", lines });
  }

  // Current Fuel Prices (only if no fuel economy)
  if (hasFuelPrices && !hasFuel) {
    const dateStr = fuelPrices!.date ? formatDate(fuelPrices!.date) : null;
    cards.push({
      accentColor: C.blue,
      title: "UK Fuel Prices",
      lines: [
        `Petrol: ${fuelPrices!.petrol.toFixed(1)}p/litre`,
        `Diesel: ${fuelPrices!.diesel.toFixed(1)}p/litre`,
        `National average${dateStr ? ` as of ${dateStr}` : ""}`,
      ],
    });
  }

  // NCAP Rating
  if (hasNcap) {
    const lines: string[] = [`${ncapRating!.overallStars}/5 stars (tested ${ncapRating!.yearTested})`];
    const scores: string[] = [];
    if (ncapRating!.adultOccupant != null) scores.push(`Adult ${ncapRating!.adultOccupant}%`);
    if (ncapRating!.childOccupant != null) scores.push(`Child ${ncapRating!.childOccupant}%`);
    if (ncapRating!.pedestrian != null) scores.push(`Pedestrian ${ncapRating!.pedestrian}%`);
    if (ncapRating!.safetyAssist != null) scores.push(`Safety ${ncapRating!.safetyAssist}%`);
    if (scores.length > 0) lines.push(scores.join(" \u00B7 "));
    cards.push({ accentColor: C.cyan, title: "Euro NCAP Safety", lines });
  }

  // UK Road Presence (rarity)
  if (hasRarity) {
    const r = input.rarityResult!;
    const catLabel = r.category === "very-rare" ? "Very Rare" : r.category === "rare" ? "Rare" : r.category === "uncommon" ? "Uncommon" : r.category === "common" ? "Common" : "Very Common";
    const accent = (r.category === "very-rare" || r.category === "rare") ? C.amber : C.blue;
    cards.push({
      accentColor: accent,
      title: "UK Road Presence",
      lines: [
        `${r.licensed.toLocaleString()} licensed in UK`,
        `${r.sorn.toLocaleString()} SORN`,
        `Category: ${catLabel}`,
      ],
    });
  }

  // Environmental Eco Score
  if (input.ecoScore) {
    const eco = input.ecoScore;
    const accent: RGB = eco.grade <= "B" ? C.emerald : eco.grade <= "D" ? C.blue : C.amber;
    const lines: string[] = [
      `Grade ${eco.grade} \u2014 ${eco.label} (${eco.score}/100)`,
      ...eco.factors.map(f => `${f.name}: ${f.detail}`),
    ];
    cards.push({ accentColor: accent, title: "Eco Score", lines });
  }

  // National MOT Pass Rate
  if (input.motPassRate) {
    const mpr = input.motPassRate;
    const accent = mpr.aboveAverage ? C.emerald : C.amber;
    const makeName = input.data.make ?? "";
    const modelName = input.data.model ?? "";
    const diff = mpr.passRate - mpr.nationalAverage;
    const comparison = diff >= 0
      ? `${diff.toFixed(1)}% above`
      : `${Math.abs(diff).toFixed(1)}% below`;
    const lines = [
      `${makeName} ${modelName}: ${mpr.passRate}%`,
      `${comparison} ${mpr.nationalAverage}% UK avg`,
      `${mpr.testCount.toLocaleString()} tests`,
    ];
    if (mpr.commonFailureReasons?.length) {
      lines.push(`Common failures: ${mpr.commonFailureReasons.join(", ")}`);
    }
    cards.push({
      accentColor: accent,
      title: "MOT Pass Rate",
      lines,
    });
  }

  // Colour Popularity
  if (hasColour) {
    const cp = colourPopularity!;
    const accent = cp.isTopFive ? C.emerald : C.blue;
    cards.push({
      accentColor: accent,
      title: "Colour Popularity",
      lines: [
        `${input.data.colour} \u2014 ${cp.label}`,
        `${cp.share}% of new registrations (#${cp.rank})`,
      ],
    });
  }

  // Theft Risk
  if (hasTheftRisk) {
    const tr = theftRisk!;
    const catLabel = tr.riskCategory === "very-high" ? "Very High" : tr.riskCategory === "high" ? "High" : tr.riskCategory === "moderate" ? "Moderate" : tr.riskCategory === "low" ? "Low" : "Very Low";
    const accent = (tr.riskCategory === "very-high" || tr.riskCategory === "high") ? C.red : tr.riskCategory === "moderate" ? C.amber : C.emerald;
    cards.push({
      accentColor: accent,
      title: `Theft Risk: ${catLabel}`,
      lines: [
        `${tr.theftsPer1000}/1,000 vehicles (${tr.rateMultiplier}\u00D7 avg)`,
        `National avg: ${tr.nationalAverage}/1,000`,
      ],
    });
  }

  // EV Specifications
  if (hasEvSpecs) {
    const ev = evSpecs!;
    const lines: string[] = [
      `Battery: ${ev.batteryKwh} kWh`,
      `WLTP Range: ${ev.rangeWltp} miles`,
    ];
    if (ev.chargeFast) lines.push(`Fast: ${ev.chargeFast}`);
    if (ev.chargeSlow) lines.push(`Home: ${ev.chargeSlow}`);
    if (ev.motorKw) lines.push(`${ev.motorKw} kW (${Math.round(ev.motorKw * 1.341)} bhp)`);
    if (ev.driveType) lines.push(`Drive: ${ev.driveType}`);
    cards.push({ accentColor: C.cyan, title: "EV Specifications", lines });
  }

  if (cards.length === 0) return y;

  // ── 2-column rendering algorithm ──
  const COL_W = (CONTENT_W - GUTTER) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + COL_W + GUTTER;
  let leftY = y;
  let rightY = y;

  for (const card of cards) {
    const cardH = measureInsightCard(doc, card.title, card.lines, COL_W);

    // Place in shorter column
    const placeLeft = leftY <= rightY;
    const placeY = placeLeft ? leftY : rightY;
    const placeX = placeLeft ? leftX : rightX;

    // Check if card fits on page. If not, page break both columns
    if (placeY + cardH + CARD_GAP > USABLE_H) {
      addNewPage(doc);
      const newY = MARGIN + POST_BREAK_PAD;
      leftY = newY;
      rightY = newY;
      // Re-evaluate placement after break
      const result = drawInsightCard(doc, newY, card.accentColor, card.title, card.lines, {
        x: leftX,
        width: COL_W,
        skipPageBreak: true,
      });
      leftY = result.endY;
      continue;
    }

    const result = drawInsightCard(doc, placeY, card.accentColor, card.title, card.lines, {
      x: placeX,
      width: COL_W,
      skipPageBreak: true,
    });

    if (placeLeft) {
      leftY = result.endY;
    } else {
      rightY = result.endY;
    }
  }

  return Math.max(leftY, rightY);
}

function renderVehicleDetails(doc: jsPDF, input: ReportInput, y: number): number {
  const { data } = input;

  y = startSection(doc, y, "Vehicle Details", 20);

  const fields: Array<[string, string]> = [];
  const add = (label: string, value: string | number | boolean | undefined | null) => {
    if (value == null || value === "") return;
    fields.push([label, String(value)]);
  };

  add("Registration", data.registrationNumber);
  add("Make", data.make);
  add("Model", data.model);
  add("Variant", data.variant);
  if (input.parsedModel?.bodyStyle) add("Body Style", input.parsedModel.bodyStyle);
  if (input.parsedModel?.trim) add("Trim Level", input.parsedModel.trim);
  if (input.parsedModel?.driveType) add("Drive Type", input.parsedModel.driveType);
  add("Colour", data.colour);
  add("Year of Manufacture", data.yearOfManufacture);
  add("First Registered", data.monthOfFirstRegistration || data.dateOfFirstRegistration);
  add("Fuel Type", data.fuelType);
  add("Engine Capacity", data.engineCapacity ? `${data.engineCapacity}cc` : undefined);
  add("CO2 Emissions", data.co2Emissions ? `${data.co2Emissions} g/km` : undefined);
  add("Euro Status", data.euroStatus);
  add("Real Driving Emissions", data.realDrivingEmissions != null ? `RDE2 Step ${data.realDrivingEmissions}` : undefined);
  add("Tax Status", data.taxStatus);
  add("Tax Due Date", formatDate(data.taxDueDate));
  add("Additional Rate End", formatDate(data.additionalRateEndDate));
  add("MOT Status", data.motStatus);
  add("MOT Expiry Date", formatDate(data.motExpiryDate));
  add("MOT Data Last Updated", formatDate(data.motTestsLastUpdated));
  add("Wheelplan", data.wheelplan);
  add("Revenue Weight", data.revenueWeight ? `${data.revenueWeight} kg` : undefined);
  add("Type Approval", data.typeApproval);
  add("Automated Vehicle", data.automatedVehicle != null ? (data.automatedVehicle ? "Yes" : "No") : undefined);
  add("Last V5C Issued", formatDate(data.dateOfLastV5CIssued));
  add("Marked for Export", data.markedForExport != null ? (data.markedForExport ? "Yes" : "No") : undefined);
  // Tyre sizes
  if (input.tyreSizes) {
    add("Tyre Sizes", input.tyreSizes.sizes.join(", "));
    add("Bolt Pattern", input.tyreSizes.boltPattern);
    add("Centre Bore", input.tyreSizes.centrebore);
  }
  // Vehicle dimensions
  if (input.vehicleDimensions) {
    const dim = input.vehicleDimensions;
    add("Length", `${dim.lengthMm.toLocaleString()} mm`);
    add("Width", `${dim.widthMm.toLocaleString()} mm`);
    add("Height", `${dim.heightMm.toLocaleString()} mm`);
    add("Wheelbase", `${dim.wheelbaseMm.toLocaleString()} mm`);
    add("Kerb Weight", `${dim.kerbWeightKg.toLocaleString()} kg`);
    add("Boot Capacity", `${dim.bootLitres} litres`);
  }

  const rowH = 7;
  const colW = (CONTENT_W - 4) / 2;
  const labelW = 38;
  const totalRows = Math.ceil(fields.length / 2);

  for (let row = 0; row < totalRows; row++) {
    y = checkPageBreak(doc, y, rowH + 1);

    const bgColor = row % 2 === 0 ? C.white : C.tableBgAlt;
    setFill(doc, bgColor);
    doc.rect(MARGIN, y, CONTENT_W, rowH, "F");

    const leftIdx = row;
    if (leftIdx < fields.length) {
      doc.setFontSize(FONT.small);
      setTextColor(doc, C.secondaryText);
      doc.setFont("helvetica", "normal");
      doc.text(fields[leftIdx][0], MARGIN + 3, y + 5);

      setTextColor(doc, C.headingText);
      doc.setFont("helvetica", "bold");
      const valueText = doc.splitTextToSize(fields[leftIdx][1], colW - labelW - 2);
      doc.text(valueText[0], MARGIN + labelW, y + 5);
    }

    const rightIdx = row + totalRows;
    if (rightIdx < fields.length) {
      const rightX = MARGIN + colW + 4;
      doc.setFontSize(FONT.small);
      setTextColor(doc, C.secondaryText);
      doc.setFont("helvetica", "normal");
      doc.text(fields[rightIdx][0], rightX, y + 5);

      setTextColor(doc, C.headingText);
      doc.setFont("helvetica", "bold");
      const valueText = doc.splitTextToSize(fields[rightIdx][1], colW - labelW - 2);
      doc.text(valueText[0], rightX + labelW, y + 5);
    }

    y += rowH;
  }

  y += 3;
  return y;
}

function renderChecklist(doc: jsPDF, input: ReportInput, y: number): number {
  y = startSection(doc, y, "Vehicle Checklists", 15);

  const sections: Array<{ title: string; items: string[] }> = [
    { title: "Owner Checklist", items: input.checklist.owner },
    { title: "Buyer Checklist", items: input.checklist.buyer },
    { title: "Seller Checklist", items: input.checklist.seller },
  ];

  for (const section of sections) {
    if (section.items.length === 0) continue;

    y = checkPageBreak(doc, y, 14);

    doc.setFontSize(FONT.h3);
    setTextColor(doc, C.cyan);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, MARGIN, y + 3);
    y += 8;

    const colW = (CONTENT_W - 6) / 2;
    const itemH = 5;
    const totalRows = Math.ceil(section.items.length / 2);

    for (let row = 0; row < totalRows; row++) {
      y = checkPageBreak(doc, y, itemH + 1);

      const leftIdx = row * 2;
      if (leftIdx < section.items.length) {
        setDraw(doc, C.secondaryText);
        doc.setLineWidth(0.3);
        doc.rect(MARGIN + 2, y, 3, 3, "S");

        doc.setFontSize(FONT.small);
        setTextColor(doc, C.bodyText);
        doc.setFont("helvetica", "normal");
        const leftText = doc.splitTextToSize(section.items[leftIdx], colW - 8);
        doc.text(leftText[0], MARGIN + 7, y + 2.5);
      }

      const rightIdx = row * 2 + 1;
      if (rightIdx < section.items.length) {
        const rightX = MARGIN + colW + 6;
        setDraw(doc, C.secondaryText);
        doc.setLineWidth(0.3);
        doc.rect(rightX, y, 3, 3, "S");

        doc.setFontSize(FONT.small);
        setTextColor(doc, C.bodyText);
        doc.setFont("helvetica", "normal");
        const rightText = doc.splitTextToSize(section.items[rightIdx], colW - 8);
        doc.text(rightText[0], rightX + 5, y + 2.5);
      }

      y += itemH;
    }

    y += 3;
  }

  return y;
}

function renderFinalPage(doc: jsPDF, y: number): number {
  y = startSection(doc, y, "Disclaimer & Data Sources", 20);

  // Condensed: 4 paragraphs → 2
  const paragraphs = [
    {
      heading: "Data Sources & Disclaimer",
      text: "This report contains data from the DVLA and MOT testing service. It is provided for informational purposes only. Free Plate Check does not guarantee the accuracy, completeness, or timeliness of the information. Vehicle data may be subject to delays in government database updates.",
    },
    {
      heading: "Limitations & Usage",
      text: "This report does not cover outstanding finance, insurance write-off history, stolen vehicle checks, or private sale history. It should not be used as the sole basis for purchasing a vehicle. Always conduct a physical inspection, verify documents, and consider a professional mechanic's assessment.",
    },
  ];

  for (const para of paragraphs) {
    y = checkPageBreak(doc, y, 20);

    doc.setFontSize(FONT.h3);
    setTextColor(doc, C.headingText);
    doc.setFont("helvetica", "bold");
    doc.text(para.heading, MARGIN, y + 3);
    y += 7;

    doc.setFontSize(FONT.body);
    setTextColor(doc, C.bodyText);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(para.text, CONTENT_W - 4);
    for (const line of lines) {
      y = checkPageBreak(doc, y, 4);
      doc.text(line, MARGIN, y + 2.5);
      y += 4;
    }
    y += 4;
  }

  // Timestamp & branding (compact)
  y = checkPageBreak(doc, y, 24);
  y += 3;
  drawRoundedRect(doc, MARGIN, y, CONTENT_W, 20, 3, C.slate800, C.slate700);

  doc.setFontSize(FONT.body);
  setTextColor(doc, C.cyan);
  doc.setFont("helvetica", "bold");
  doc.text("Free Plate Check", MARGIN + 5, y + 7);

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.slate300);
  doc.setFont("helvetica", "normal");
  doc.text("freeplatecheck.co.uk", MARGIN + 5, y + 13);

  const ts = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Report generated: ${ts}`, MARGIN + 5, y + 18);

  return y + 22;
}

function addFooterPass(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    setFill(doc, C.slate800);
    doc.rect(0, PAGE_H - 7, 210, 7, "F");
    setDraw(doc, C.slate700);
    doc.setLineWidth(0.2);
    doc.line(0, PAGE_H - 7, 210, PAGE_H - 7);

    doc.setFontSize(FONT.small);
    setTextColor(doc, C.slate400);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${totalPages}`, 105, PAGE_H - 2.5, { align: "center" });

    setTextColor(doc, C.slate400);
    doc.text("freeplatecheck.co.uk", MARGIN, PAGE_H - 2.5);

    doc.text("Free Plate Check", MARGIN + CONTENT_W, PAGE_H - 2.5, { align: "right" });
  }
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export async function generateVehicleReport(input: ReportInput): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Page 1: Cover
  let y = renderCoverPage(doc, input);

  // Vehicle Details table
  y = renderVehicleDetails(doc, input, y);

  // Health Score
  y = renderHealthScore(doc, input, y);

  // MOT Readiness
  y = renderMotReadiness(doc, input, y);

  // Safety Recalls
  y = renderSafetyRecalls(doc, input, y);

  // ULEZ Compliance
  y = renderUlezCompliance(doc, input, y);

  // Vehicle Valuation
  y = renderValuation(doc, input, y);

  // Annual Running Costs
  y = renderRunningCosts(doc, input, y);

  // Negotiation Helper
  y = renderNegotiationHelper(doc, input, y);

  // Key Insights (2-column)
  y = renderEnrichedInsights(doc, input, y);

  // Mileage Progression
  y = renderMileageProgression(doc, input, y);

  // MOT History
  y = renderMotHistory(doc, input, y);

  // Mileage Warnings
  y = renderMileageWarnings(doc, input, y);

  // Recurring Advisories
  y = renderRecurringAdvisories(doc, input, y);

  // Checklists
  y = renderChecklist(doc, input, y);

  // Disclaimer & Data Sources
  renderFinalPage(doc, y);

  // Global footer pass
  addFooterPass(doc);

  return doc.output("blob");
}
