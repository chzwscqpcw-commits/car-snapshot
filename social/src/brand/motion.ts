import { interpolate, spring } from "remotion";

/** A settled, slightly over-damped spring: confident, never bouncy. */
export const CALM = { damping: 200, stiffness: 120, mass: 1 } as const;
/** A touch of overshoot for the hook headline and the big number. */
export const SNAP = { damping: 14, stiffness: 160, mass: 0.9 } as const;

export function rise(frame: number, fps: number, delay = 0, config = CALM): { opacity: number; y: number } {
  const p = spring({ frame: frame - delay, fps, config, durationInFrames: 30 });
  return { opacity: interpolate(p, [0, 1], [0, 1]), y: interpolate(p, [0, 1], [40, 0]) };
}

export function pop(frame: number, fps: number, delay = 0): number {
  return spring({ frame: frame - delay, fps, config: SNAP, durationInFrames: 36 });
}

/** 0 → 1 between two frames with an ease-out cubic. */
export function ease(frame: number, from: number, to: number): number {
  const t = interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return 1 - Math.pow(1 - t, 3);
}

/** Fades out over the last `n` frames of a span. */
export function fadeOut(frame: number, end: number, n = 12): number {
  return interpolate(frame, [end - n, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}
