// Shared chart colour/config constants for stats pages

export const chartColors = {
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  sky: "#38bdf8",
  purple: "#a78bfa",
  rose: "#fb7185",
  cyan: "#22d3ee",
  lime: "#84cc16",
  orange: "#f97316",
  indigo: "#818cf8",
} as const;

export const statsSurface = {
  bg: "#111111",
  surface: "#1a1a1a",
  elevated: "#222222",
  border: "#2a2a2a",
} as const;

export const chartConfig = {
  grid: { stroke: "#2a2a2a", strokeDasharray: "3 3" },
  axis: { stroke: "#6b7280", fontSize: 12 },
  tooltip: { bg: "#1f2937", border: "#374151" },
  dot: { r: 3, strokeWidth: 2 },
  activeDot: { r: 5, strokeWidth: 2 },
  curveType: "monotone" as const,
  animationDuration: 800,
} as const;

// Shared annotation label config for ReferenceLine components.
// Staggers labels vertically so adjacent annotations don't overlap.
export function annotationLabel(text: string, index: number) {
  return {
    value: text,
    position: "insideTopLeft" as const,
    fill: "#9ca3af",
    fontSize: 10,
    dy: index % 2 === 0 ? 12 : 28,
  };
}

// Standard props for charts that contain annotation ReferenceLines
export const annotatedChartProps = {
  style: { overflow: "visible" as const },
};

// Palette array for multi-series charts
export const seriesPalette = [
  chartColors.emerald,
  chartColors.amber,
  chartColors.sky,
  chartColors.rose,
  chartColors.purple,
  chartColors.cyan,
  chartColors.lime,
  chartColors.orange,
  chartColors.indigo,
  chartColors.red,
];
