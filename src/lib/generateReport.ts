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
  motPassRate?: { passRate: number; testCount: number; aboveAverage: boolean; nationalAverage: number } | null;
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
  } | null;
  ownershipCost?: {
    totalAnnual: number;
    costPerMile: number;
    breakdown: { fuel: number | null; ved: number | null; depreciation: number | null; mot: number | null };
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

const MARGIN = 15;
const CONTENT_W = 180; // A4 width (210) - 2×15 margins
const PAGE_H = 297; // A4 height
const FOOTER_H = 12; // reserved footer zone
const USABLE_H = PAGE_H - FOOTER_H; // max y before footer
const GUTTER = 8;

// Font sizes in points
const FONT = {
  h1: 22,
  h2: 16,
  h3: 13,
  body: 10,
  small: 8,
  tiny: 6,
};

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
  drawRoundedRect(doc, x, y, w, 26, 3, C.slate800, C.slate700);
  setFill(doc, accentColor);
  doc.roundedRect(x, y, w, 4, 3, 3, "F");
  doc.rect(x, y + 2, w, 2, "F");
  setFill(doc, C.slate800);
  doc.rect(x + 0.5, y + 3.5, w - 1, 1, "F");

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.slate400);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + w / 2, y + 11, { align: "center" });

  doc.setFontSize(FONT.body);
  setTextColor(doc, C.white);
  doc.setFont("helvetica", "bold");
  doc.text(value, x + w / 2, y + 20, { align: "center" });
}

function drawNumberPlate(doc: jsPDF, x: number, y: number, reg: string) {
  const plateW = 90;
  const plateH = 18;
  const px = x - plateW / 2;
  drawRoundedRect(doc, px, y, plateW, plateH, 3, C.yellow);
  doc.setFontSize(20);
  setTextColor(doc, C.yellowDark);
  doc.setFont("helvetica", "bold");
  doc.text(reg, x, y + 12.5, { align: "center" });
}

function addNewPage(doc: jsPDF) {
  doc.addPage();
  paintBackground(doc);
}

function paintBackground(doc: jsPDF) {
  setFill(doc, C.slate900);
  doc.rect(0, 0, 210, PAGE_H, "F");
}

/** Check if content fits on current page; if not, add a new page. Returns the y to draw at. */
function checkPageBreak(doc: jsPDF, currentY: number, neededHeight: number): number {
  if (currentY + neededHeight > USABLE_H) {
    addNewPage(doc);
    return MARGIN + 5;
  }
  return currentY;
}

/**
 * Start a new section with a header. Only adds a page break if the title + minHeight won't fit.
 * Returns the y position after the section header.
 */
function startSection(doc: jsPDF, currentY: number, title: string, minHeight: number = 30): number {
  const headerHeight = 20; // divider + title
  const needed = headerHeight + minHeight;
  let y = currentY + 6; // gap before section
  if (y + needed > USABLE_H) {
    addNewPage(doc);
    y = MARGIN + 5;
  }
  // Divider line
  setDraw(doc, C.slate700);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 6;
  // Title
  doc.setFontSize(FONT.h2);
  setTextColor(doc, C.white);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, y + 5);
  y += 12;
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

/** Strip emoji prefixes from mileage warning strings for clean PDF output */
function stripEmoji(text: string): string {
  return text.replace(/^[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u26A0\uFE0F\u{1F6A8}\u2139\uFE0F\u{1F4C9}\u{2757}]+\s*/u, "").trim();
}

/** Shared insight card drawer used across sections */
function drawInsightCard(
  doc: jsPDF,
  startY: number,
  accentColor: RGB,
  title: string,
  lines: string[],
): number {
  const cardX = MARGIN;
  const cardW = CONTENT_W;
  const accentW = 3;
  const padLeft = accentW + 6;
  const lineH = 4.5;
  const titleH = 6;
  const padTop = 5;
  const padBottom = 5;

  const wrappedLines: string[] = [];
  for (const line of lines) {
    const split = doc.splitTextToSize(line, cardW - padLeft - 6);
    wrappedLines.push(...split);
  }
  const cardH = padTop + titleH + wrappedLines.length * lineH + padBottom;

  startY = checkPageBreak(doc, startY, cardH + 4);

  drawRoundedRect(doc, cardX, startY, cardW, cardH, 3, C.slate800, C.slate700);

  setFill(doc, accentColor);
  doc.rect(cardX, startY + 2, accentW, cardH - 4, "F");

  let textY = startY + padTop;
  doc.setFontSize(FONT.body);
  setTextColor(doc, C.white);
  doc.setFont("helvetica", "bold");
  doc.text(title, cardX + padLeft, textY + 3);
  textY += titleH;

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.slate300);
  doc.setFont("helvetica", "normal");
  for (const line of wrappedLines) {
    doc.text(line, cardX + padLeft, textY + 3);
    textY += lineH;
  }

  return startY + cardH + 4;
}

// ── Page Renderers ───────────────────────────────────────────────────────────

function renderCoverPage(doc: jsPDF, input: ReportInput): number {
  const { data, motInsights } = input;
  paintBackground(doc);

  let y = 0;

  // ── Header banner (dark branded banner matching website) ──
  drawRoundedRect(doc, 0, 0, 210, 24, 0, C.slate800);
  setFill(doc, C.blue400);
  doc.rect(0, 0, 210, 1.5, "F"); // accent line matching title

  // Measure title for horizontal centering
  const titleText = "Free Plate Check";
  doc.setFontSize(FONT.h1);
  doc.setFont("helvetica", "bold");
  const titleW = doc.getTextWidth(titleText);

  // Zap icon — exact lucide-react SVG path from 24×24 viewBox:
  // M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02
  // A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46
  // l1.92-6.02A1 1 0 0 0 11 14z
  // Bounding box: x∈[3.22,20.78] y∈[2.17,21.83] → 17.56 × 19.66 units
  const zapScale = 0.4;                    // mm per SVG unit
  const zapPathW = 17.56 * zapScale;       // 7.02 mm
  const zapPathH = 19.66 * zapScale;       // 7.86 mm
  const zapStrokeW = 2 * zapScale;         // 0.80 mm (SVG stroke-width="2")
  const zapGap = 2.5;                      // space between icon and text

  // Horizontal: icon + gap + title, centred on page
  const compositeW = zapPathW + zapStrokeW + zapGap + titleW;
  const compositeX = (210 - compositeW) / 2;

  // Vertical: both icon and text visually centred in banner
  const bannerMid = (1.5 + 24) / 2;       // 12.75 mm
  const zapTopY = bannerMid - zapPathH / 2;

  // SVG path starts at M4,14 → offset from path bbox origin (3.22, 2.17)
  const zapStartX = compositeX + zapStrokeW / 2 + (4 - 3.22) * zapScale;
  const zapStartY = zapTopY + (14 - 2.17) * zapScale;

  setDraw(doc, C.blue400);
  doc.setLineWidth(zapStrokeW);
  doc.setLineCap("round");
  doc.setLineJoin("round");

  // Exact path vertices as relative movements (matches lucide SVG)
  doc.lines(
    [
      [-0.78, -1.63],   // arc → left-middle
      [9.9, -10.2],     // line → top
      [0.86, 0.46],     // arc → rounded top
      [-1.92, 6.02],    // line → back down
      [0.94, 1.35],     // arc → middle junction
      [7, 0],           // line → far right
      [0.78, 1.63],     // arc → rounded right
      [-9.9, 10.2],     // line → bottom
      [-0.86, -0.46],   // arc → rounded bottom
      [1.92, -6.02],    // line → back up
      [-0.94, -1.35],   // arc → middle junction
      [-7, 0],          // close → left
    ],
    zapStartX, zapStartY,
    [zapScale, zapScale],
    "S",   // stroke only — no fill, matching lucide fill="none"
    true,  // closed path
  );

  // Title text with gradient: blue-400 → cyan-300 (matches website bg-gradient-to-r)
  const textX = compositeX + zapPathW + zapStrokeW + zapGap;
  const textY = bannerMid + 2; // baseline offset for visual centering
  const gradFrom: RGB = C.blue400;   // [96, 165, 250]
  const gradTo: RGB = C.cyan300;     // [103, 232, 249]
  const chars = titleText.split("");
  let charX = textX;
  for (let i = 0; i < chars.length; i++) {
    const t = chars.length > 1 ? i / (chars.length - 1) : 0;
    const r = Math.round(gradFrom[0] + (gradTo[0] - gradFrom[0]) * t);
    const g = Math.round(gradFrom[1] + (gradTo[1] - gradFrom[1]) * t);
    const b = Math.round(gradFrom[2] + (gradTo[2] - gradFrom[2]) * t);
    doc.setTextColor(r, g, b);
    doc.text(chars[i], charX, textY);
    charX += doc.getTextWidth(chars[i]);
  }

  // ── Subtitle and date below the banner ──
  doc.setFontSize(FONT.h3);
  setTextColor(doc, C.slate300);
  doc.setFont("helvetica", "normal");
  doc.text("Vehicle Report", 105, 30, { align: "center" });

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.slate400);
  const genDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Generated ${genDate}`, 105, 36, { align: "center" });

  y = 44;

  // ── Number plate ──
  drawNumberPlate(doc, 105, y, data.registrationNumber);
  y += 26;

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
  setTextColor(doc, C.slate100);
  doc.setFont("helvetica", "normal");
  doc.text(vehicleLine, 105, y, { align: "center" });
  y += 14;

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
  y += 34;

  // ── Key stats grid (2×2) ──
  const cellW = (CONTENT_W - GUTTER) / 2;
  const cellH = 22;
  const stats = [
    {
      label: "Pass Rate",
      value: motInsights ? `${motInsights.passRate}%` : "\u2014",
    },
    {
      label: "Total Tests",
      value: motInsights ? String(motInsights.totalTests) : "\u2014",
    },
    {
      label: "Avg Miles/Year",
      value: motInsights?.avgMilesPerYear ? formatMileage(motInsights.avgMilesPerYear) : "\u2014",
    },
    {
      label: "Vehicle Age",
      value: data.yearOfManufacture
        ? `${new Date().getFullYear() - data.yearOfManufacture} years`
        : "\u2014",
    },
  ];

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = MARGIN + col * (cellW + GUTTER);
    const cy = y + row * (cellH + 4);

    drawRoundedRect(doc, cx, cy, cellW, cellH, 3, C.slate800, C.slate700);

    doc.setFontSize(FONT.small);
    setTextColor(doc, C.slate400);
    doc.setFont("helvetica", "normal");
    doc.text(stats[i].label, cx + 6, cy + 9);

    doc.setFontSize(FONT.h3);
    setTextColor(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.text(stats[i].value, cx + 6, cy + 18);
  }
  y += 2 * (cellH + 4) + 8;

  // ── Latest MOT summary ──
  y = checkPageBreak(doc, y, 40);
  drawRoundedRect(doc, MARGIN, y, CONTENT_W, 34, 3, C.slate800, C.slate700);

  doc.setFontSize(FONT.body);
  setTextColor(doc, C.slate300);
  doc.setFont("helvetica", "bold");
  doc.text("Latest MOT", MARGIN + 6, y + 10);

  doc.setFont("helvetica", "normal");
  setTextColor(doc, C.slate100);

  if (data.motTests && data.motTests.length > 0) {
    const latest = data.motTests[0];
    const resultColor = latest.testResult === "PASSED" ? C.emerald : C.red;
    const advisoryCount = latest.rfrAndComments?.filter((r) => r.type === "ADVISORY").length ?? 0;
    const defectCount = latest.rfrAndComments?.filter((r) => r.type === "DEFECT").length ?? 0;

    doc.setFontSize(FONT.body);
    setTextColor(doc, resultColor);
    doc.setFont("helvetica", "bold");
    doc.text(latest.testResult, MARGIN + 6, y + 18);

    setTextColor(doc, C.slate100);
    doc.setFont("helvetica", "normal");
    const summaryParts = [
      formatDate(latest.completedDate),
      latest.odometer?.value ? `${formatMileage(latest.odometer.value)} miles` : null,
      advisoryCount > 0 ? `${advisoryCount} advisor${advisoryCount !== 1 ? "ies" : "y"}` : null,
      defectCount > 0 ? `${defectCount} defect${defectCount !== 1 ? "s" : ""}` : null,
    ].filter(Boolean);
    doc.text(summaryParts.join("  \u00B7  "), MARGIN + 6, y + 26);

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
      doc.text(expiryText, MARGIN + CONTENT_W - 6, y + 18, { align: "right" });
    }
  } else {
    doc.setFontSize(FONT.body);
    setTextColor(doc, C.slate400);
    doc.text("No MOT history available", MARGIN + 6, y + 20);
  }

  y += 38;
  return y;
}

function renderMileageProgression(doc: jsPDF, input: ReportInput, y: number): number {
  const tests = input.data.motTests;
  if (!tests || tests.length < 2) return y;

  // Build sorted mileage entries (oldest first)
  const mileageEntries = [...tests]
    .filter((t) => t.odometer?.value != null)
    .sort((a, b) => new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime());

  if (mileageEntries.length < 2) return y;

  y = startSection(doc, y, "Mileage Progression", 30);

  // Column widths
  const colDate = 28;
  const colMileage = 28;
  const colChange = 25;
  const colMPY = 25;
  const rowH = 7;

  // Draw table header
  function drawTableHeader(startY: number): number {
    drawRoundedRect(doc, MARGIN, startY, CONTENT_W, rowH, 0, C.slate700);
    doc.setFontSize(FONT.small);
    setTextColor(doc, C.slate300);
    doc.setFont("helvetica", "bold");
    let hx = MARGIN + 3;
    doc.text("Date", hx, startY + 5); hx += colDate;
    doc.text("Mileage", hx, startY + 5); hx += colMileage;
    doc.text("Change", hx, startY + 5); hx += colChange;
    doc.text("Miles/Yr", hx, startY + 5); hx += colMPY;
    doc.text("Notes", hx, startY + 5);
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
    let noteColor: RGB = C.slate300;

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

    // Check for page break and redraw header if needed
    if (y + rowH > USABLE_H) {
      addNewPage(doc);
      y = MARGIN + 5;
      y = drawTableHeader(y);
    }

    const bgColor = i % 2 === 0 ? C.slate800 : C.slate900;
    setFill(doc, bgColor);
    doc.rect(MARGIN, y, CONTENT_W, rowH, "F");

    doc.setFontSize(FONT.small);
    doc.setFont("helvetica", "normal");
    setTextColor(doc, C.slate300);

    let cx = MARGIN + 3;
    doc.text(formatDate(entry.completedDate), cx, y + 5); cx += colDate;
    doc.text(formatMileage(mileage), cx, y + 5); cx += colMileage;

    if (change.startsWith("-")) {
      setTextColor(doc, C.red);
    }
    doc.text(change, cx, y + 5); cx += colChange;
    setTextColor(doc, C.slate300);
    doc.text(milesPerYear, cx, y + 5); cx += colMPY;

    if (notes) {
      setTextColor(doc, noteColor);
      doc.setFont("helvetica", "bold");
      doc.text(notes, cx, y + 5);
      doc.setFont("helvetica", "normal");
    }

    y += rowH;
  }

  y += 4;
  return y;
}

function renderMotHistory(doc: jsPDF, input: ReportInput, y: number): number {
  const { data } = input;
  const tests = data.motTests;

  y = startSection(doc, y, "MOT History", 20);

  if (!tests || tests.length === 0) {
    doc.setFontSize(FONT.body);
    setTextColor(doc, C.slate400);
    doc.setFont("helvetica", "normal");
    doc.text("No MOT history available for this vehicle.", MARGIN, y + 5);
    return y + 10;
  }

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.slate400);
  doc.setFont("helvetica", "normal");
  doc.text(`${tests.length} test${tests.length !== 1 ? "s" : ""} on record`, MARGIN, y);
  y += 6;

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
      const compactH = 8;
      y = checkPageBreak(doc, y, compactH + 2);

      // Background row
      drawRoundedRect(doc, MARGIN, y, CONTENT_W, compactH, 2, C.slate800, C.slate700);
      // Green accent stripe
      setFill(doc, C.emerald);
      doc.rect(MARGIN, y + 1.5, 3, compactH - 3, "F");

      // PASS badge
      const badgeText = "PASS";
      doc.setFontSize(FONT.small);
      doc.setFont("helvetica", "bold");
      const badgeW = doc.getTextWidth(badgeText) + 5;
      drawRoundedRect(doc, MARGIN + 6, y + 1.5, badgeW, 5, 1.5, C.emerald);
      setTextColor(doc, C.white);
      doc.text(badgeText, MARGIN + 6 + badgeW / 2, y + 5, { align: "center" });

      // Date
      setTextColor(doc, C.slate300);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(test.completedDate), MARGIN + 6 + badgeW + 4, y + 5.5);

      // Mileage right-aligned
      if (test.odometer?.value) {
        doc.text(
          `${formatMileage(test.odometer.value)} mi`,
          MARGIN + CONTENT_W - 6,
          y + 5.5,
          { align: "right" },
        );
      }

      // MOT test number
      if (test.motTestNumber) {
        doc.setFontSize(FONT.tiny);
        setTextColor(doc, C.slate400);
        const mileageTextW = test.odometer?.value ? doc.getTextWidth(`${formatMileage(test.odometer.value)} mi`) + 8 : 0;
        doc.text(`Ref: ${test.motTestNumber}`, MARGIN + CONTENT_W - 6 - mileageTextW, y + 5.5, { align: "right" });
      }

      y += compactH + 2;
      continue;
    }

    // ── Full card for tests with items or FAILED ──
    const estimatedHeight = 24 + itemCount * 5.5 + 6;
    y = checkPageBreak(doc, y, Math.min(estimatedHeight, USABLE_H - MARGIN - 5));

    const cardStartY = y;
    const cardStartPage = doc.getNumberOfPages();
    y += 6; // top padding

    // Test header row
    doc.setFontSize(FONT.body);
    setTextColor(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.text(formatDate(test.completedDate), MARGIN + 8, y + 4);

    // Result badge
    const badgeText = test.testResult === "PASSED" ? "PASS" : test.testResult === "FAILED" ? "FAIL" : "N/A";
    const badgeW = doc.getTextWidth(badgeText) + 6;
    const badgeX = MARGIN + 55;
    drawRoundedRect(doc, badgeX, y - 1, badgeW, 7, 2, accentColor);
    doc.setFontSize(FONT.small);
    setTextColor(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.text(badgeText, badgeX + badgeW / 2, y + 4, { align: "center" });

    // Mileage
    setTextColor(doc, C.slate300);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.body);
    if (test.odometer?.value) {
      doc.text(`${formatMileage(test.odometer.value)} miles`, MARGIN + CONTENT_W - 8, y + 4, { align: "right" });
    }

    // MOT test number reference
    if (test.motTestNumber) {
      doc.setFontSize(FONT.tiny);
      setTextColor(doc, C.slate400);
      doc.text(`Ref: ${test.motTestNumber}`, MARGIN + CONTENT_W - 8, y + 9, { align: "right" });
    }

    y += 10;

    // Advisory/defect items
    const allItems = [
      ...defects.map((d) => ({ ...d, prefix: "DEFECT", color: C.red })),
      ...advisories.map((a) => ({ ...a, prefix: "ADVISORY", color: C.amber })),
      ...comments.map((c) => ({ ...c, prefix: "NOTE", color: C.slate400 })),
    ];

    for (const item of allItems) {
      y = checkPageBreak(doc, y, 6);

      doc.setFontSize(FONT.small);
      setTextColor(doc, item.color);
      doc.setFont("helvetica", "bold");
      doc.text(item.prefix, MARGIN + 10, y + 3);

      setTextColor(doc, C.slate300);
      doc.setFont("helvetica", "normal");
      const prefixW = doc.getTextWidth(item.prefix + "  ");
      const maxTextW = CONTENT_W - 18 - prefixW;
      const lines = doc.splitTextToSize(item.text, maxTextW);
      for (let li = 0; li < lines.length; li++) {
        if (li > 0) {
          y += 4;
          y = checkPageBreak(doc, y, 5);
        }
        doc.text(lines[li], MARGIN + 10 + prefixW, y + 3);
      }
      y += 5;
    }

    y += 3; // bottom padding

    // Draw card outline and accent stripe — only if card didn't span pages
    const cardEndPage = doc.getNumberOfPages();
    if (cardEndPage === cardStartPage) {
      const cardH = y - cardStartY;
      setDraw(doc, C.slate700);
      doc.setLineWidth(0.3);
      doc.roundedRect(MARGIN, cardStartY, CONTENT_W, cardH, 3, 3, "S");

      setFill(doc, accentColor);
      doc.rect(MARGIN, cardStartY + 2, 3, cardH - 4, "F");
    }

    y += 4; // gap between cards
  }

  return y;
}

function renderMileageWarnings(doc: jsPDF, input: ReportInput, y: number): number {
  const warnings = input.motInsights?.mileageWarnings;
  if (!warnings || warnings.length === 0) return y;

  y = startSection(doc, y, "Mileage Warnings", 20);

  for (const warning of warnings) {
    const cleaned = stripEmoji(warning);
    const isClocking = cleaned.toUpperCase().includes("ALERT") || cleaned.toUpperCase().includes("DECREASED");
    const accent = isClocking ? C.red : C.amber;
    y = drawInsightCard(doc, y, accent, isClocking ? "Clocking Alert" : "Mileage Anomaly", [cleaned]);
  }

  return y;
}

function renderRecurringAdvisories(doc: jsPDF, input: ReportInput, y: number): number {
  const recurring = input.motInsights?.recurringAdvisories;
  if (!recurring || recurring.length === 0) return y;

  y = startSection(doc, y, "Recurring Advisories", 20);

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.slate400);
  doc.setFont("helvetica", "normal");
  doc.text("Advisories appearing on 2 or more MOT tests", MARGIN, y);
  y += 5;

  for (const adv of recurring) {
    const cardH = 14;
    y = checkPageBreak(doc, y, cardH + 3);

    drawRoundedRect(doc, MARGIN, y, CONTENT_W, cardH, 3, C.slate800, C.slate700);

    // Left accent stripe
    setFill(doc, C.amber);
    doc.rect(MARGIN, y + 2, 3, cardH - 4, "F");

    // Count badge
    const countText = `${adv.count}x`;
    doc.setFontSize(FONT.small);
    doc.setFont("helvetica", "bold");
    const countW = doc.getTextWidth(countText) + 5;
    drawRoundedRect(doc, MARGIN + 8, y + 4, countW, 6, 2, C.amber);
    setTextColor(doc, C.white);
    doc.text(countText, MARGIN + 8 + countW / 2, y + 8.5, { align: "center" });

    // Advisory text
    setTextColor(doc, C.slate300);
    doc.setFont("helvetica", "normal");
    const maxW = CONTENT_W - 20 - countW;
    const lines = doc.splitTextToSize(adv.text, maxW);
    doc.text(lines[0], MARGIN + 12 + countW, y + 8.5);
    if (lines.length > 1) {
      doc.setFontSize(FONT.tiny);
      doc.text(lines[1] + (lines.length > 2 ? "..." : ""), MARGIN + 12 + countW, y + 12);
    }

    y += cardH + 2;
  }

  return y;
}

function renderHealthScore(doc: jsPDF, input: ReportInput, y: number): number {
  const hs = input.healthScore;
  if (!hs) return y;

  y = startSection(doc, y, "Vehicle Health Score", 40);

  const cardH = 45;
  y = checkPageBreak(doc, y, cardH + 4);
  drawRoundedRect(doc, MARGIN, y, CONTENT_W, cardH, 3, C.slate800, C.slate700);

  // Grade badge
  const gradeColor: RGB = hs.grade === "A" ? C.emerald : hs.grade === "B" ? C.blue : hs.grade === "C" ? C.amber : C.red;
  const badgeSize = 22;
  const badgeX = MARGIN + 8;
  const badgeY = y + 6;
  drawRoundedRect(doc, badgeX, badgeY, badgeSize, badgeSize, 4, gradeColor);
  doc.setFontSize(18);
  setTextColor(doc, C.white);
  doc.setFont("helvetica", "bold");
  doc.text(hs.grade, badgeX + badgeSize / 2, badgeY + 15, { align: "center" });

  // Score text
  doc.setFontSize(FONT.h2);
  setTextColor(doc, C.white);
  doc.text(`${hs.score}/100`, badgeX + badgeSize + 8, badgeY + 9);
  doc.setFontSize(FONT.body);
  setTextColor(doc, gradeColor);
  doc.text(hs.label, badgeX + badgeSize + 8, badgeY + 17);

  // Breakdown row
  const breakdownY = y + 32;
  const colCount = Math.min(hs.breakdown.length, 4);
  const colW = (CONTENT_W - 16) / colCount;
  for (let i = 0; i < colCount; i++) {
    const item = hs.breakdown[i];
    const cx = MARGIN + 8 + i * colW;
    doc.setFontSize(FONT.tiny);
    setTextColor(doc, C.slate400);
    doc.setFont("helvetica", "normal");
    doc.text(item.category, cx, breakdownY);
    const itemColor: RGB = item.score >= item.maxScore * 0.8 ? C.emerald : item.score >= item.maxScore * 0.5 ? C.amber : C.red;
    setTextColor(doc, itemColor);
    doc.setFont("helvetica", "bold");
    doc.text(`${item.score}/${item.maxScore}`, cx, breakdownY + 4);
  }
  // Second row of breakdown items
  if (hs.breakdown.length > 4) {
    const row2Y = breakdownY + 10;
    for (let i = 4; i < hs.breakdown.length; i++) {
      const item = hs.breakdown[i];
      const cx = MARGIN + 8 + (i - 4) * colW;
      doc.setFontSize(FONT.tiny);
      setTextColor(doc, C.slate400);
      doc.setFont("helvetica", "normal");
      doc.text(item.category, cx, row2Y);
      const itemColor: RGB = item.score >= item.maxScore * 0.8 ? C.emerald : item.score >= item.maxScore * 0.5 ? C.amber : C.red;
      setTextColor(doc, itemColor);
      doc.setFont("helvetica", "bold");
      doc.text(`${item.score}/${item.maxScore}`, cx, row2Y + 4);
    }
  }

  y += cardH + 4;
  return y;
}

function renderEnrichedInsights(doc: jsPDF, input: ReportInput, y: number): number {
  const { ulezResult, vedResult, fuelEconomy, fuelPrices, ncapRating, recalls, valuation, colourPopularity, motReadiness, ownershipCost, theftRisk, evSpecs, negotiation } = input;

  const hasUlez = ulezResult && ulezResult.status !== "unknown";
  const hasVed = vedResult && vedResult.estimatedAnnualRate !== null;
  const hasFuel = fuelEconomy && fuelEconomy.combinedMpg > 0;
  const hasFuelPrices = fuelPrices && (fuelPrices.petrol > 0 || fuelPrices.diesel > 0);
  const hasNcap = ncapRating && ncapRating.overallStars > 0;
  const hasRecalls = recalls !== undefined;
  const hasRarityEarly = input.rarityResult && input.rarityResult.total > 0;
  const hasValuation = valuation && valuation.rangeLow > 0;
  const hasColour = colourPopularity && input.data.colour;
  const hasMotReadiness = motReadiness && motReadiness.advisoryCount > 0;
  const hasOwnershipCost = ownershipCost && ownershipCost.totalAnnual > 0;
  const hasTheftRisk = !!theftRisk;
  const hasEvSpecs = !!evSpecs;
  const hasNegotiation = !!negotiation;

  if (!hasUlez && !hasVed && !hasFuel && !hasNcap && !hasRecalls && !hasRarityEarly && !hasValuation && !hasColour && !hasFuelPrices && !hasMotReadiness && !hasOwnershipCost && !hasTheftRisk && !hasEvSpecs && !hasNegotiation) return y;

  y = startSection(doc, y, "Vehicle Insights", 20);

  // ULEZ Compliance
  if (hasUlez) {
    const isCompliant = ulezResult!.status === "compliant" || ulezResult!.status === "exempt";
    const accent = isCompliant ? C.emerald : ulezResult!.status === "non-compliant" ? C.red : C.slate400;
    const statusLabel = ulezResult!.status === "exempt" ? "Exempt" : isCompliant ? "Compliant" : "Non-compliant";
    const lines = [
      ulezResult!.reason,
      `Confidence: ${ulezResult!.confidence}`,
    ];
    // Add clean air zone daily charges for non-compliant vehicles
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
    y = drawInsightCard(doc, y, accent, `ULEZ: ${statusLabel}`, lines);
  }

  // VED Road Tax
  if (hasVed) {
    const sixMonthText = vedResult!.estimatedSixMonthRate != null ? ` (\u00A3${vedResult!.estimatedSixMonthRate} for 6 months)` : "";
    const lines: string[] = [`Estimated \u00A3${vedResult!.estimatedAnnualRate}/year${sixMonthText}`];
    if (vedResult!.band) lines.push(`Band: ${vedResult!.band}`);
    if (vedResult!.details) {
      const firstSentence = vedResult!.details.split(".")[0];
      if (firstSentence) lines.push(firstSentence + ".");
    }
    y = drawInsightCard(doc, y, C.blue, "VED Road Tax", lines);
  }

  // Fuel Economy
  if (hasFuel) {
    const lines: string[] = [`${fuelEconomy!.combinedMpg.toFixed(1)} MPG (combined)`];
    if (fuelEconomy!.urbanMpg) lines.push(`Urban: ${fuelEconomy!.urbanMpg.toFixed(1)} MPG`);
    if (fuelEconomy!.extraUrbanMpg) lines.push(`Extra-urban: ${fuelEconomy!.extraUrbanMpg.toFixed(1)} MPG`);
    lines.push(`Estimated annual fuel cost: \u00A3${fuelEconomy!.estimatedAnnualCost}`);
    if (hasFuelPrices) {
      lines.push(`Based on ${fuelPrices!.petrol.toFixed(1)}p/litre petrol, ${fuelPrices!.diesel.toFixed(1)}p/litre diesel`);
    }
    y = drawInsightCard(doc, y, C.blue, "Fuel Economy", lines);
  }

  // Current Fuel Prices
  if (hasFuelPrices && !hasFuel) {
    const dateStr = fuelPrices!.date ? formatDate(fuelPrices!.date) : null;
    y = drawInsightCard(doc, y, C.blue, "Current UK Fuel Prices", [
      `Petrol: ${fuelPrices!.petrol.toFixed(1)}p/litre \u00B7 Diesel: ${fuelPrices!.diesel.toFixed(1)}p/litre`,
      `National average pump prices${dateStr ? ` as of ${dateStr}` : ""}`,
    ]);
  }

  // NCAP Rating
  if (hasNcap) {
    const lines: string[] = [
      `${ncapRating!.overallStars}/5 stars (tested ${ncapRating!.yearTested})`,
    ];
    const scores: string[] = [];
    if (ncapRating!.adultOccupant != null) scores.push(`Adult ${ncapRating!.adultOccupant}%`);
    if (ncapRating!.childOccupant != null) scores.push(`Child ${ncapRating!.childOccupant}%`);
    if (ncapRating!.pedestrian != null) scores.push(`Pedestrian ${ncapRating!.pedestrian}%`);
    if (ncapRating!.safetyAssist != null) scores.push(`Safety Assist ${ncapRating!.safetyAssist}%`);
    if (scores.length > 0) lines.push(scores.join(" \u00B7 "));
    y = drawInsightCard(doc, y, C.cyan, "Euro NCAP Safety Rating", lines);
  }

  // UK Road Presence (rarity)
  const hasRarity = input.rarityResult && input.rarityResult.total > 0;
  if (hasRarity) {
    const r = input.rarityResult!;
    const catLabel = r.category === "very-rare" ? "Very Rare" : r.category === "rare" ? "Rare" : r.category === "uncommon" ? "Uncommon" : r.category === "common" ? "Common" : "Very Common";
    const accent = (r.category === "very-rare" || r.category === "rare") ? C.amber : C.blue;
    const lines: string[] = [
      `${r.licensed.toLocaleString()} currently licensed in the UK`,
      `${r.sorn.toLocaleString()} declared SORN`,
      `Category: ${catLabel}`,
    ];
    y = drawInsightCard(doc, y, accent, "UK Road Presence", lines);
  }

  // Environmental Eco Score
  if (input.ecoScore) {
    const eco = input.ecoScore;
    const accent: RGB = eco.grade <= "B" ? C.emerald : eco.grade <= "D" ? C.blue : C.amber;
    const lines: string[] = [
      `Grade ${eco.grade} \u2014 ${eco.label} (${eco.score}/100)`,
      ...eco.factors.map(f => `${f.name}: ${f.detail}`),
    ];
    y = drawInsightCard(doc, y, accent, "Environmental Eco Score", lines);
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
    y = drawInsightCard(doc, y, accent, "National MOT Pass Rate", [
      `${makeName} ${modelName}: ${mpr.passRate}% pass rate`,
      `${comparison} the ${mpr.nationalAverage}% UK average`,
      `Based on ${mpr.testCount.toLocaleString()} MOT tests`,
    ]);
  }

  // Colour Popularity
  if (hasColour) {
    const cp = colourPopularity!;
    const accent = cp.isTopFive ? C.emerald : C.blue;
    y = drawInsightCard(doc, y, accent, "Colour Popularity", [
      `${input.data.colour} \u2014 ${cp.label}`,
      `${cp.share}% of new UK registrations (ranked #${cp.rank})`,
    ]);
  }

  // Estimated Value (expanded with market snapshot)
  if (hasValuation) {
    const confLabel = valuation!.confidence === "high" ? "High confidence" : valuation!.confidence === "medium" ? "Medium confidence" : "Estimate only";
    const lines: string[] = [
      `\u00A3${valuation!.rangeLow.toLocaleString()} \u2013 \u00A3${valuation!.rangeHigh.toLocaleString()}`,
      `Confidence: ${confLabel}`,
      `Sources: ${valuation!.sources.join(", ")}`,
    ];
    // Market snapshot
    if (valuation!.ebayMinPrice && valuation!.ebayMaxPrice) {
      lines.push(`Asking prices: \u00A3${valuation!.ebayMinPrice.toLocaleString()} \u2013 \u00A3${valuation!.ebayMaxPrice.toLocaleString()}`);
    }
    if (valuation!.ebayDominantTransmission || valuation!.ebayDominantBodyType) {
      const specParts: string[] = [];
      if (valuation!.ebayDominantTransmission) specParts.push(valuation!.ebayDominantTransmission);
      if (valuation!.ebayDominantBodyType) specParts.push(valuation!.ebayDominantBodyType);
      lines.push(`Most common spec: ${specParts.join(", ")}`);
    }
    if (valuation!.marketSupply) {
      const supplyLabel = valuation!.marketSupply === "good" ? "Good" : valuation!.marketSupply === "moderate" ? "Moderate" : "Limited";
      const countSuffix = valuation!.ebayTotalListings ? ` (${valuation!.ebayTotalListings} listings)` : "";
      lines.push(`Market supply: ${supplyLabel}${countSuffix}`);
    }
    // Adjustment breakdown
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
      lines.push(`Adjustments: ${adjustments.join(", ")}`);
    }
    y = drawInsightCard(doc, y, C.blue, "Estimated Value", lines);
  }

  // MOT Readiness
  if (hasMotReadiness) {
    const mr = motReadiness!;
    const accent: RGB = mr.score === "red" ? C.red : mr.score === "amber" ? C.amber : C.emerald;
    const lines: string[] = [
      `${mr.advisoryCount} advisory item${mr.advisoryCount !== 1 ? "s" : ""} — ${mr.label}`,
    ];
    if (mr.daysUntilMot > 0) {
      lines.push(`Next MOT due in ${mr.daysUntilMot} days`);
    }
    if (mr.totalEstimatedCost.high > 0) {
      lines.push(`Estimated repair costs: \u00A3${mr.totalEstimatedCost.low}\u2013\u00A3${mr.totalEstimatedCost.high}`);
    }
    y = drawInsightCard(doc, y, accent, "MOT Readiness", lines);
  }

  // Annual Running Costs
  if (hasOwnershipCost) {
    const oc = ownershipCost!;
    const lines: string[] = [
      `\u00A3${oc.totalAnnual.toLocaleString()}/year (${oc.costPerMile.toFixed(0)}p/mile)`,
    ];
    const parts: string[] = [];
    if (oc.breakdown.fuel != null) parts.push(`Fuel \u00A3${oc.breakdown.fuel.toLocaleString()}`);
    if (oc.breakdown.ved != null) parts.push(`VED \u00A3${oc.breakdown.ved}`);
    if (oc.breakdown.depreciation != null) parts.push(`Depreciation \u00A3${oc.breakdown.depreciation.toLocaleString()}`);
    if (oc.breakdown.mot != null) parts.push(`MOT \u00A3${oc.breakdown.mot}`);
    if (parts.length > 0) lines.push(parts.join(" \u00B7 "));
    lines.push(oc.excludedNote);
    y = drawInsightCard(doc, y, C.blue, "Annual Running Costs", lines);
  }

  // Safety Recalls
  if (hasRecalls) {
    if (recalls!.length === 0) {
      y = drawInsightCard(doc, y, C.emerald, "Safety Recalls", [
        "No known safety recalls found for this vehicle.",
      ]);
    } else {
      const lines: string[] = [
        `${recalls!.length} recall${recalls!.length !== 1 ? "s" : ""} found`,
      ];
      for (let i = 0; i < Math.min(3, recalls!.length); i++) {
        const r = recalls![i];
        lines.push(`${r.recallDate}: ${r.defect.substring(0, 100)}${r.defect.length > 100 ? "..." : ""}`);
      }
      if (recalls!.length > 3) {
        lines.push(`...and ${recalls!.length - 3} more`);
      }
      y = drawInsightCard(doc, y, C.red, "Safety Recalls", lines);
    }
  }

  // Theft Risk
  if (hasTheftRisk) {
    const tr = theftRisk!;
    const catLabel = tr.riskCategory === "very-high" ? "Very High" : tr.riskCategory === "high" ? "High" : tr.riskCategory === "moderate" ? "Moderate" : tr.riskCategory === "low" ? "Low" : "Very Low";
    const accent = (tr.riskCategory === "very-high" || tr.riskCategory === "high") ? C.red : tr.riskCategory === "moderate" ? C.amber : C.emerald;
    y = drawInsightCard(doc, y, accent, `Theft Risk: ${catLabel}`, [
      `${tr.theftsPer1000} thefts per 1,000 vehicles (${tr.rateMultiplier}\u00D7 national average)`,
      `National average: ${tr.nationalAverage} per 1,000 registered vehicles`,
    ]);
  }

  // EV Specifications
  if (hasEvSpecs) {
    const ev = evSpecs!;
    const lines: string[] = [
      `Battery: ${ev.batteryKwh} kWh \u00B7 WLTP Range: ${ev.rangeWltp} miles`,
    ];
    if (ev.chargeFast) lines.push(`Fast charge: ${ev.chargeFast}`);
    if (ev.chargeSlow) lines.push(`Home charge: ${ev.chargeSlow}`);
    if (ev.motorKw) lines.push(`Motor: ${ev.motorKw} kW (${Math.round(ev.motorKw * 1.341)} bhp)`);
    if (ev.driveType) lines.push(`Drive type: ${ev.driveType}`);
    y = drawInsightCard(doc, y, C.cyan, "EV Specifications", lines);
  }

  // Negotiation Helper
  if (hasNegotiation) {
    const neg = negotiation!;
    const lines: string[] = [
      `Suggested discount: ${neg.suggestedDiscountPercent.low}\u2013${neg.suggestedDiscountPercent.high}% below asking`,
      `Estimated saving: \u00A3${neg.estimatedSaving.low.toLocaleString()}\u2013\u00A3${neg.estimatedSaving.high.toLocaleString()}`,
      `Confidence: ${neg.confidence}`,
    ];
    for (const reason of neg.reasons) {
      lines.push(`\u2022 ${reason}`);
    }
    y = drawInsightCard(doc, y, C.emerald, "Negotiation Helper", lines);
  }

  return y;
}

function renderVehicleDetails(doc: jsPDF, input: ReportInput, y: number): number {
  const { data } = input;

  y = startSection(doc, y, "Vehicle Details", 24);

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

  // Two-column layout
  const rowH = 8;
  const colW = (CONTENT_W - 4) / 2; // 4mm gap between columns
  const labelW = 42;
  const totalRows = Math.ceil(fields.length / 2);

  for (let row = 0; row < totalRows; row++) {
    y = checkPageBreak(doc, y, rowH + 1);

    const bgColor = row % 2 === 0 ? C.slate800 : C.slate900;
    setFill(doc, bgColor);
    doc.rect(MARGIN, y, CONTENT_W, rowH, "F");

    // Left column
    const leftIdx = row;
    if (leftIdx < fields.length) {
      doc.setFontSize(FONT.small);
      setTextColor(doc, C.slate400);
      doc.setFont("helvetica", "normal");
      doc.text(fields[leftIdx][0], MARGIN + 3, y + 5.5);

      setTextColor(doc, C.white);
      doc.setFont("helvetica", "bold");
      const valueText = doc.splitTextToSize(fields[leftIdx][1], colW - labelW - 2);
      doc.text(valueText[0], MARGIN + labelW, y + 5.5);
    }

    // Right column
    const rightIdx = row + totalRows;
    if (rightIdx < fields.length) {
      const rightX = MARGIN + colW + 4;
      doc.setFontSize(FONT.small);
      setTextColor(doc, C.slate400);
      doc.setFont("helvetica", "normal");
      doc.text(fields[rightIdx][0], rightX, y + 5.5);

      setTextColor(doc, C.white);
      doc.setFont("helvetica", "bold");
      const valueText = doc.splitTextToSize(fields[rightIdx][1], colW - labelW - 2);
      doc.text(valueText[0], rightX + labelW, y + 5.5);
    }

    y += rowH;
  }

  y += 4;
  return y;
}

function renderChecklist(doc: jsPDF, input: ReportInput, y: number): number {
  y = startSection(doc, y, "Vehicle Checklists", 20);

  const sections: Array<{ title: string; items: string[] }> = [
    { title: "Owner Checklist", items: input.checklist.owner },
    { title: "Buyer Checklist", items: input.checklist.buyer },
    { title: "Seller Checklist", items: input.checklist.seller },
  ];

  for (const section of sections) {
    if (section.items.length === 0) continue;

    y = checkPageBreak(doc, y, 16);

    // Sub-header
    doc.setFontSize(FONT.h3);
    setTextColor(doc, C.cyan);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, MARGIN, y + 4);
    y += 10;

    // Two-column layout
    const colW = (CONTENT_W - 6) / 2;
    const itemH = 6;
    const totalRows = Math.ceil(section.items.length / 2);

    for (let row = 0; row < totalRows; row++) {
      y = checkPageBreak(doc, y, itemH + 1);

      // Left column
      const leftIdx = row * 2;
      if (leftIdx < section.items.length) {
        setDraw(doc, C.slate400);
        doc.setLineWidth(0.3);
        doc.rect(MARGIN + 2, y, 3.5, 3.5, "S");

        doc.setFontSize(FONT.small);
        setTextColor(doc, C.slate100);
        doc.setFont("helvetica", "normal");
        const leftText = doc.splitTextToSize(section.items[leftIdx], colW - 10);
        doc.text(leftText[0], MARGIN + 8, y + 3);
      }

      // Right column
      const rightIdx = row * 2 + 1;
      if (rightIdx < section.items.length) {
        const rightX = MARGIN + colW + 6;
        setDraw(doc, C.slate400);
        doc.setLineWidth(0.3);
        doc.rect(rightX, y, 3.5, 3.5, "S");

        doc.setFontSize(FONT.small);
        setTextColor(doc, C.slate100);
        doc.setFont("helvetica", "normal");
        const rightText = doc.splitTextToSize(section.items[rightIdx], colW - 10);
        doc.text(rightText[0], rightX + 6, y + 3);
      }

      y += itemH;
    }

    y += 4; // gap between checklist sections
  }

  return y;
}

function renderFinalPage(doc: jsPDF, y: number): number {
  y = startSection(doc, y, "Disclaimer & Data Sources", 25);

  const paragraphs = [
    {
      heading: "Data Sources",
      text: "This report contains data sourced from the Driver and Vehicle Licensing Agency (DVLA) and the MOT testing service. Vehicle details, tax status, and MOT history are retrieved from official government databases.",
    },
    {
      heading: "Disclaimer",
      text: "This report is provided for informational purposes only. Free Plate Check does not guarantee the accuracy, completeness, or timeliness of the information contained in this report. Vehicle data may be subject to delays in government database updates.",
    },
    {
      heading: "Limitations",
      text: "This report does not cover: outstanding finance, insurance write-off history, stolen vehicle checks, or private sale history. For a comprehensive vehicle history, consider using an official HPI or vehicle history check service.",
    },
    {
      heading: "Usage",
      text: "This report should not be used as the sole basis for purchasing a vehicle. Always conduct a thorough physical inspection, verify documents with the seller, and consider obtaining a professional mechanic's assessment.",
    },
  ];

  for (const para of paragraphs) {
    y = checkPageBreak(doc, y, 25);

    doc.setFontSize(FONT.h3);
    setTextColor(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.text(para.heading, MARGIN, y + 4);
    y += 8;

    doc.setFontSize(FONT.body);
    setTextColor(doc, C.slate300);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(para.text, CONTENT_W - 4);
    for (const line of lines) {
      y = checkPageBreak(doc, y, 5);
      doc.text(line, MARGIN, y + 3);
      y += 5;
    }
    y += 6;
  }

  // Timestamp & branding
  y = checkPageBreak(doc, y, 30);
  y += 6;
  drawRoundedRect(doc, MARGIN, y, CONTENT_W, 28, 3, C.slate800, C.slate700);

  doc.setFontSize(FONT.body);
  setTextColor(doc, C.cyan);
  doc.setFont("helvetica", "bold");
  doc.text("Free Plate Check", MARGIN + 6, y + 10);

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.slate300);
  doc.setFont("helvetica", "normal");
  doc.text("freeplatecheck.co.uk", MARGIN + 6, y + 17);

  const ts = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Report generated: ${ts}`, MARGIN + 6, y + 23);

  return y + 30;
}

function addFooterPass(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    setFill(doc, C.slate800);
    doc.rect(0, PAGE_H - 10, 210, 10, "F");
    setDraw(doc, C.slate700);
    doc.setLineWidth(0.2);
    doc.line(0, PAGE_H - 10, 210, PAGE_H - 10);

    doc.setFontSize(FONT.small);
    setTextColor(doc, C.slate400);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${totalPages}`, 105, PAGE_H - 4, { align: "center" });

    setTextColor(doc, C.slate400);
    doc.text("freeplatecheck.co.uk", MARGIN, PAGE_H - 4);

    doc.text("Free Plate Check", MARGIN + CONTENT_W, PAGE_H - 4, { align: "right" });
  }
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export async function generateVehicleReport(input: ReportInput): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Page 1: Cover
  let y = renderCoverPage(doc, input);

  // Mileage Progression Table
  y = renderMileageProgression(doc, input, y);

  // MOT History
  y = renderMotHistory(doc, input, y);

  // Mileage Warnings
  y = renderMileageWarnings(doc, input, y);

  // Recurring Advisories
  y = renderRecurringAdvisories(doc, input, y);

  // Vehicle Insights (ULEZ, VED, fuel economy, NCAP, valuation, recalls)
  // Health Score
  y = renderHealthScore(doc, input, y);

  y = renderEnrichedInsights(doc, input, y);

  // Vehicle Details (two-column)
  y = renderVehicleDetails(doc, input, y);

  // Checklists (two-column)
  y = renderChecklist(doc, input, y);

  // Disclaimer
  renderFinalPage(doc, y);

  // Global footer pass
  addFooterPass(doc);

  // Return blob for caller to handle download (mobile vs desktop)
  return doc.output("blob");
}
