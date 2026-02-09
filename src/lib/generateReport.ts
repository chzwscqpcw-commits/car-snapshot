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

export type ReportInput = {
  data: VehicleData;
  motInsights: MotInsights | null;
  checklist: { owner: string[]; buyer: string[]; seller: string[] };
  ulezResult?: { status: string; confidence: string; reason: string; details: string } | null;
  vedResult?: { estimatedAnnualRate: number | null; band: string | null; details: string } | null;
  fuelEconomy?: { combinedMpg: number; urbanMpg?: number; extraUrbanMpg?: number; estimatedAnnualCost: number } | null;
  ncapRating?: { overallStars: number; adultOccupant?: number; childOccupant?: number; pedestrian?: number; safetyAssist?: number; yearTested: number } | null;
  recalls?: Array<{ recallDate: string; defect: string; remedy: string; recallNumber: string }>;
  valuation?: { rangeLow: number; rangeHigh: number; confidence: string; sources: string[] } | null;
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
  cyan: [34, 211, 238] as RGB,
  yellow: [250, 204, 21] as RGB,
  yellowDark: [66, 32, 6] as RGB,
};

// ── Layout Constants ─────────────────────────────────────────────────────────

const MARGIN = 15;
const CONTENT_W = 180; // A4 width (210) - 2×15 margins
const PAGE_H = 297; // A4 height
const GUTTER = 8;

// Font sizes in points
const FONT = {
  h1: 22,
  h2: 16,
  h3: 13,
  body: 10,
  small: 8,
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
  // Card background
  drawRoundedRect(doc, x, y, w, 26, 3, C.slate800, C.slate700);
  // Accent bar at top
  setFill(doc, accentColor);
  doc.roundedRect(x, y, w, 4, 3, 3, "F");
  // Fill bottom corners the accent bar created
  doc.rect(x, y + 2, w, 2, "F");
  setFill(doc, C.slate800);
  doc.rect(x + 0.5, y + 3.5, w - 1, 1, "F");

  // Label
  doc.setFontSize(FONT.small);
  setTextColor(doc, C.slate400);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + w / 2, y + 11, { align: "center" });

  // Value
  doc.setFontSize(FONT.body);
  setTextColor(doc, C.white);
  doc.setFont("helvetica", "bold");
  doc.text(value, x + w / 2, y + 20, { align: "center" });
}

function drawNumberPlate(doc: jsPDF, x: number, y: number, reg: string) {
  const plateW = 90;
  const plateH = 18;
  const px = x - plateW / 2;
  // Yellow background
  drawRoundedRect(doc, px, y, plateW, plateH, 3, C.yellow);
  // Reg text
  doc.setFontSize(20);
  setTextColor(doc, C.yellowDark);
  doc.setFont("helvetica", "bold");
  doc.text(reg, x, y + 12.5, { align: "center" });
}

function addSectionHeader(doc: jsPDF, y: number, title: string): number {
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

function checkPageBreak(doc: jsPDF, currentY: number, neededHeight: number): number {
  if (currentY + neededHeight > PAGE_H - 20) {
    addNewPage(doc);
    return MARGIN + 5;
  }
  return currentY;
}

function addNewPage(doc: jsPDF) {
  doc.addPage();
  paintBackground(doc);
}

function paintBackground(doc: jsPDF) {
  setFill(doc, C.slate900);
  doc.rect(0, 0, 210, PAGE_H, "F");
}

function formatMileage(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString("en-GB");
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
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

// ── Page Renderers ───────────────────────────────────────────────────────────

function renderCoverPage(doc: jsPDF, input: ReportInput) {
  const { data, motInsights } = input;
  paintBackground(doc);

  let y = 0;

  // ── Header banner ──
  drawRoundedRect(doc, 0, 0, 210, 42, 0, C.slate800);
  // Brand accent line at very top
  setFill(doc, C.cyan);
  doc.rect(0, 0, 210, 2, "F");

  doc.setFontSize(FONT.h1);
  setTextColor(doc, C.white);
  doc.setFont("helvetica", "bold");
  doc.text("FREE PLATE CHECK", 105, 18, { align: "center" });

  doc.setFontSize(FONT.h3);
  setTextColor(doc, C.cyan);
  doc.setFont("helvetica", "normal");
  doc.text("Vehicle Report", 105, 28, { align: "center" });

  doc.setFontSize(FONT.small);
  setTextColor(doc, C.slate400);
  const genDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Generated ${genDate}`, 105, 37, { align: "center" });

  y = 52;

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
  const advisoryColor = totalAdvisories > 3 ? C.amber : totalAdvisories > 0 ? C.blue : C.emerald;

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
    motInsights?.latestMileage ? formatMileage(motInsights.latestMileage) : "—",
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
      value: motInsights ? `${motInsights.passRate}%` : "—",
    },
    {
      label: "Total Tests",
      value: motInsights ? String(motInsights.totalTests) : "—",
    },
    {
      label: "Avg Miles/Year",
      value: motInsights?.avgMilesPerYear ? formatMileage(motInsights.avgMilesPerYear) : "—",
    },
    {
      label: "Vehicle Age",
      value: data.yearOfManufacture
        ? `${new Date().getFullYear() - data.yearOfManufacture} years`
        : "—",
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

    // MOT expiry info on right side
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
}

function renderMotHistory(doc: jsPDF, input: ReportInput) {
  const { data } = input;
  const tests = data.motTests;

  addNewPage(doc);
  let y = MARGIN + 5;
  y = addSectionHeader(doc, y, "MOT History");

  if (!tests || tests.length === 0) {
    doc.setFontSize(FONT.body);
    setTextColor(doc, C.slate400);
    doc.setFont("helvetica", "normal");
    doc.text("No MOT history available for this vehicle.", MARGIN, y + 5);
    return;
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

    // Estimate card height: header (16) + items (5 each, wrapped lines extra) + padding (8)
    const itemCount = advisories.length + defects.length + comments.length;
    const estimatedHeight = 24 + itemCount * 5.5 + 6;
    y = checkPageBreak(doc, y, Math.min(estimatedHeight, PAGE_H - 40));

    // Card background
    const isPassed = test.testResult === "PASSED";
    const accentColor = isPassed ? C.emerald : test.testResult === "FAILED" ? C.red : C.slate400;

    // We don't know final card height yet, so draw background after measuring.
    // For now, record start y.
    const cardStartY = y;

    // Left accent stripe (drawn later)
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

    // Now draw the card background behind everything
    const cardH = y - cardStartY;
    // We need to draw the background behind the text, so we use a trick:
    // jsPDF draws in order, so we can't go back. Instead, let's draw the card
    // with a slight re-approach: draw a border-only rect
    setDraw(doc, C.slate700);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, cardStartY, CONTENT_W, cardH, 3, 3, "S");

    // Left accent stripe
    setFill(doc, accentColor);
    doc.rect(MARGIN, cardStartY + 2, 3, cardH - 4, "F");

    y += 4; // gap between cards
  }
}

function renderEnrichedInsights(doc: jsPDF, input: ReportInput) {
  const { ulezResult, vedResult, fuelEconomy, ncapRating, recalls, valuation } = input;

  // Only render if at least one enrichment has data
  const hasUlez = ulezResult && ulezResult.status !== "unknown";
  const hasVed = vedResult && vedResult.estimatedAnnualRate !== null;
  const hasFuel = fuelEconomy && fuelEconomy.combinedMpg > 0;
  const hasNcap = ncapRating && ncapRating.overallStars > 0;
  const hasRecalls = recalls !== undefined; // show section even if empty (to confirm no recalls)
  const hasValuation = valuation && valuation.rangeLow > 0;

  if (!hasUlez && !hasVed && !hasFuel && !hasNcap && !hasRecalls && !hasValuation) return;

  addNewPage(doc);
  let y = MARGIN + 5;
  y = addSectionHeader(doc, y, "Vehicle Insights");

  const cardX = MARGIN;
  const cardW = CONTENT_W;
  const accentW = 3;
  const padLeft = accentW + 6;

  // Helper to draw a card with left accent bar
  function drawInsightCard(
    startY: number,
    accentColor: RGB,
    title: string,
    lines: string[],
  ): number {
    const lineH = 4.5;
    const titleH = 6;
    const padTop = 5;
    const padBottom = 5;
    // Wrap lines to fit card
    const wrappedLines: string[] = [];
    for (const line of lines) {
      const split = doc.splitTextToSize(line, cardW - padLeft - 6);
      wrappedLines.push(...split);
    }
    const cardH = padTop + titleH + wrappedLines.length * lineH + padBottom;

    startY = checkPageBreak(doc, startY, cardH + 4);

    // Card background
    drawRoundedRect(doc, cardX, startY, cardW, cardH, 3, C.slate800, C.slate700);

    // Accent bar
    setFill(doc, accentColor);
    doc.rect(cardX, startY + 2, accentW, cardH - 4, "F");

    // Title
    let textY = startY + padTop;
    doc.setFontSize(FONT.body);
    setTextColor(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.text(title, cardX + padLeft, textY + 3);
    textY += titleH;

    // Content lines
    doc.setFontSize(FONT.small);
    setTextColor(doc, C.slate300);
    doc.setFont("helvetica", "normal");
    for (const line of wrappedLines) {
      doc.text(line, cardX + padLeft, textY + 3);
      textY += lineH;
    }

    return startY + cardH + 4;
  }

  // ULEZ Compliance
  if (hasUlez) {
    const isCompliant = ulezResult!.status === "compliant" || ulezResult!.status === "exempt";
    const accent = isCompliant ? C.emerald : ulezResult!.status === "non-compliant" ? C.red : C.slate400;
    const statusLabel = ulezResult!.status === "exempt" ? "Exempt" : isCompliant ? "Compliant" : "Non-compliant";
    y = drawInsightCard(y, accent, `ULEZ: ${statusLabel}`, [
      ulezResult!.reason,
      `Confidence: ${ulezResult!.confidence}`,
    ]);
  }

  // VED Road Tax
  if (hasVed) {
    const lines: string[] = [`Estimated £${vedResult!.estimatedAnnualRate}/year`];
    if (vedResult!.band) lines.push(`Band: ${vedResult!.band}`);
    if (vedResult!.details) {
      const firstSentence = vedResult!.details.split(".")[0];
      if (firstSentence) lines.push(firstSentence + ".");
    }
    y = drawInsightCard(y, C.blue, "VED Road Tax", lines);
  }

  // Fuel Economy
  if (hasFuel) {
    const lines: string[] = [`${fuelEconomy!.combinedMpg.toFixed(1)} MPG (combined)`];
    if (fuelEconomy!.urbanMpg) lines.push(`Urban: ${fuelEconomy!.urbanMpg.toFixed(1)} MPG`);
    if (fuelEconomy!.extraUrbanMpg) lines.push(`Extra-urban: ${fuelEconomy!.extraUrbanMpg.toFixed(1)} MPG`);
    lines.push(`Estimated annual fuel cost: £${fuelEconomy!.estimatedAnnualCost}`);
    y = drawInsightCard(y, C.blue, "Fuel Economy", lines);
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
    if (scores.length > 0) lines.push(scores.join(" · "));
    y = drawInsightCard(y, C.cyan, "Euro NCAP Safety Rating", lines);
  }

  // Estimated Value
  if (hasValuation) {
    const confLabel = valuation!.confidence === "high" ? "High confidence" : valuation!.confidence === "medium" ? "Medium confidence" : "Estimate only";
    const lines: string[] = [
      `£${valuation!.rangeLow.toLocaleString()} – £${valuation!.rangeHigh.toLocaleString()}`,
      `Confidence: ${confLabel}`,
      `Sources: ${valuation!.sources.join(", ")}`,
    ];
    y = drawInsightCard(y, C.blue, "Estimated Value", lines);
  }

  // Safety Recalls
  if (hasRecalls) {
    if (recalls!.length === 0) {
      y = drawInsightCard(y, C.emerald, "Safety Recalls", [
        "No known safety recalls found for this vehicle.",
      ]);
    } else {
      const lines: string[] = [
        `${recalls!.length} recall${recalls!.length !== 1 ? "s" : ""} found`,
      ];
      // Show up to 3 recall summaries
      for (let i = 0; i < Math.min(3, recalls!.length); i++) {
        const r = recalls![i];
        lines.push(`${r.recallDate}: ${r.defect.substring(0, 100)}${r.defect.length > 100 ? "..." : ""}`);
      }
      if (recalls!.length > 3) {
        lines.push(`...and ${recalls!.length - 3} more`);
      }
      y = drawInsightCard(y, C.red, "Safety Recalls", lines);
    }
  }
}

function renderVehicleDetails(doc: jsPDF, input: ReportInput) {
  const { data } = input;

  addNewPage(doc);
  let y = MARGIN + 5;
  y = addSectionHeader(doc, y, "Vehicle Details");

  const fields: Array<[string, string]> = [];
  const add = (label: string, value: string | number | boolean | undefined | null) => {
    if (value == null || value === "") return;
    fields.push([label, String(value)]);
  };

  add("Registration", data.registrationNumber);
  add("Make", data.make);
  add("Model", data.model);
  add("Variant", data.variant);
  add("Colour", data.colour);
  add("Year of Manufacture", data.yearOfManufacture);
  add("First Registered", data.monthOfFirstRegistration || data.dateOfFirstRegistration);
  add("Fuel Type", data.fuelType);
  add("Engine Capacity", data.engineCapacity ? `${data.engineCapacity}cc` : undefined);
  add("CO2 Emissions", data.co2Emissions ? `${data.co2Emissions} g/km` : undefined);
  add("Euro Status", data.euroStatus);
  add("Tax Status", data.taxStatus);
  add("Tax Due Date", formatDate(data.taxDueDate));
  add("MOT Status", data.motStatus);
  add("MOT Expiry Date", formatDate(data.motExpiryDate));
  add("Wheelplan", data.wheelplan);
  add("Revenue Weight", data.revenueWeight ? `${data.revenueWeight} kg` : undefined);
  add("Type Approval", data.typeApproval);
  add("Last V5C Issued", formatDate(data.dateOfLastV5CIssued));
  add("Marked for Export", data.markedForExport != null ? (data.markedForExport ? "Yes" : "No") : undefined);

  const rowH = 8;
  const labelW = 60;

  for (let i = 0; i < fields.length; i++) {
    y = checkPageBreak(doc, y, rowH + 1);

    const isAlt = i % 2 === 0;
    const bgColor = isAlt ? C.slate800 : C.slate900;
    setFill(doc, bgColor);
    doc.rect(MARGIN, y, CONTENT_W, rowH, "F");

    doc.setFontSize(FONT.body);
    setTextColor(doc, C.slate400);
    doc.setFont("helvetica", "normal");
    doc.text(fields[i][0], MARGIN + 4, y + 5.5);

    setTextColor(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.text(fields[i][1], MARGIN + labelW, y + 5.5);

    y += rowH;
  }
}

function renderChecklist(doc: jsPDF, input: ReportInput) {
  addNewPage(doc);
  let y = MARGIN + 5;
  y = addSectionHeader(doc, y, "Vehicle Checklists");

  const sections: Array<{ title: string; items: string[] }> = [
    { title: "Owner Checklist", items: input.checklist.owner },
    { title: "Buyer Checklist", items: input.checklist.buyer },
    { title: "Seller Checklist", items: input.checklist.seller },
  ];

  for (const section of sections) {
    if (section.items.length === 0) continue;

    y = checkPageBreak(doc, y, 20);

    // Sub-header
    doc.setFontSize(FONT.h3);
    setTextColor(doc, C.cyan);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, MARGIN, y + 4);
    y += 10;

    for (const item of section.items) {
      y = checkPageBreak(doc, y, 8);

      // Checkbox square
      setDraw(doc, C.slate400);
      doc.setLineWidth(0.3);
      doc.rect(MARGIN + 2, y, 4, 4, "S");

      // Item text
      doc.setFontSize(FONT.body);
      setTextColor(doc, C.slate100);
      doc.setFont("helvetica", "normal");
      doc.text(item, MARGIN + 10, y + 3.5);

      y += 7;
    }

    y += 6; // gap between sections
  }
}

function renderFinalPage(doc: jsPDF) {
  addNewPage(doc);
  let y = MARGIN + 5;
  y = addSectionHeader(doc, y, "Disclaimer & Data Sources");

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
}

function addFooterPass(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer background bar
    setFill(doc, C.slate800);
    doc.rect(0, PAGE_H - 10, 210, 10, "F");
    setDraw(doc, C.slate700);
    doc.setLineWidth(0.2);
    doc.line(0, PAGE_H - 10, 210, PAGE_H - 10);

    // Page number
    doc.setFontSize(FONT.small);
    setTextColor(doc, C.slate400);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${totalPages}`, 105, PAGE_H - 4, { align: "center" });

    // Website on left
    setTextColor(doc, C.slate400);
    doc.text("freeplatecheck.co.uk", MARGIN, PAGE_H - 4);

    // Free Plate Check on right
    doc.text("Free Plate Check", MARGIN + CONTENT_W, PAGE_H - 4, { align: "right" });
  }
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export async function generateVehicleReport(input: ReportInput): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Page 1: Cover
  renderCoverPage(doc, input);

  // Page 2+: MOT History
  renderMotHistory(doc, input);

  // Vehicle Insights (ULEZ, VED, fuel economy, NCAP, recalls)
  renderEnrichedInsights(doc, input);

  // Vehicle Details
  renderVehicleDetails(doc, input);

  // Checklists
  renderChecklist(doc, input);

  // Final page: Disclaimer
  renderFinalPage(doc);

  // Global footer pass
  addFooterPass(doc);

  // Save
  const reg = input.data.registrationNumber.replace(/\s+/g, "");
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`FPC-Report-${reg}-${dateStr}.pdf`);
}
