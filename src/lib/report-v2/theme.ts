// Colour tokens for the server-rendered report. Two editions of the same pages:
// "dark" for reading on a screen, "light" for printing (white paper, no large
// dark areas, accents darkened so text keeps ≥4.5:1 contrast and the page still
// reads in greyscale). Values match the approved mockups (Oct 2026).

export type ReportTheme = "dark" | "light";

export type ThemeTokens = {
  bg: string;
  ink: string;
  soft: string;
  muted: string;
  rule: string;
  ruleStrong: string;
  track: string;
  accent: string;
  good: string;
  warn: string;
  risk: string;
  /** Cover bolt: outline opacity and fill opacity. */
  boltStroke: number;
  boltFill: number;
  plateShadow: string;
};

export const THEMES: Record<ReportTheme, ThemeTokens> = {
  dark: {
    bg: "#070B14",
    ink: "#F1F5F9",
    soft: "#CBD5E1",
    muted: "#94A3B8",
    rule: "#1E293B",
    ruleStrong: "#334155",
    track: "#162033",
    accent: "#22D3EE",
    good: "#34D399",
    warn: "#FBBF24",
    risk: "#F87171",
    boltStroke: 0.55,
    boltFill: 0.06,
    plateShadow: "0 18px 50px rgba(245, 197, 24, 0.18)",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#0B1220",
    soft: "#334155",
    muted: "#475569",
    rule: "#E2E8F0",
    ruleStrong: "#94A3B8",
    track: "#E2E8F0",
    accent: "#0E7490",
    good: "#047857",
    warn: "#B45309",
    risk: "#B91C1C",
    boltStroke: 0.5,
    boltFill: 0,
    plateShadow: "none",
  },
};

export function isReportTheme(v: unknown): v is ReportTheme {
  return v === "dark" || v === "light";
}
