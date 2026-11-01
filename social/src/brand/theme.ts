/**
 * The site's look, as the clips use it. Values are the PDF report's dark
 * edition (src/lib/report-v2/theme.ts) plus the plate yellow and the
 * slate surfaces from globals.css.
 */
export const T = {
  bg: "#070B14",
  bgLift: "#0B1220",
  surface: "#111A2B",
  surfaceEdge: "#1E293B",
  ink: "#F1F5F9",
  soft: "#CBD5E1",
  muted: "#94A3B8",
  dim: "#64748B",
  rule: "#1E293B",
  ruleStrong: "#334155",
  track: "#162033",
  accent: "#22D3EE",
  accentDeep: "#0E7490",
  blue: "#3B82F6",
  plate: "#F5C518",
  plateInk: "#111111",
  good: "#34D399",
  warn: "#FBBF24",
  risk: "#F87171",
} as const;

export const FONT = {
  display: "'Instrument Serif', Georgia, serif",
  sans: "'Geist', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
} as const;

/** 1080 × 1920 portrait, 30 fps, 20 seconds. */
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  seconds: 20,
  get frames() {
    return this.fps * this.seconds;
  },
} as const;

/**
 * Safe area. TikTok/Reels draw their own caption and buttons over the lowest
 * ~400 px and the right-hand ~150 px below the middle; the status bar takes
 * the top ~110 px. Everything the viewer must read sits inside this box.
 */
export const SAFE = {
  x: 72,
  w: 1080 - 72 * 2,
  top: 150,
  bottom: 1500,
} as const;

export const DOMAIN = "freeplatecheck.co.uk";
