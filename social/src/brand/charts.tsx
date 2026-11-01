import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, rise } from "./motion";
import { FONT, SAFE, T } from "./theme";

export interface BarDatum {
  label: string;
  value: number;
  /** The text shown at the end of the bar (defaults to the value). */
  display?: string;
  color?: string;
  /** A second line under the label, small and muted. */
  sub?: string;
}

/**
 * Horizontal bars that grow in one after another. `max` sets the full width;
 * a `marker` draws a dashed line (the national average, say).
 */
/** The bar's colour for its number, unless it is too dark to read on slate. */
function readable(color: string | undefined): string {
  if (!color) return T.accent;
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = parseInt(m[1], 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum < 0.35 ? T.ink : color;
}

/** Frames between one bar starting and the next. */
const STAGGER = 18;

export const Bars: React.FC<{
  data: BarDatum[];
  top: number;
  startFrame: number;
  max?: number;
  rowHeight?: number;
  marker?: { value: number; label: string };
  rankFrom?: number;
}> = ({ data, top, startFrame, max, rowHeight = 118, marker, rankFrom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const full = max ?? Math.max(...data.map((d) => d.value), marker?.value ?? 0) * 1.05;
  const labelW = 0;
  const barMax = SAFE.w - labelW;
  const markerIn = ease(frame, startFrame + data.length * STAGGER + 20, startFrame + data.length * STAGGER + 36);
  const sweepStart = startFrame + data.length * STAGGER + 70;
  const sweep = interpolate(frame, [sweepStart, sweepStart + 50], [-0.4, 1.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: SAFE.x, top, width: SAFE.w }}>
      <div
        style={{
          position: "absolute",
          left: `${sweep * 100}%`,
          top: -10,
          width: 180,
          height: data.length * rowHeight,
          background: "linear-gradient(90deg, rgba(241,245,249,0) 0%, rgba(241,245,249,0.10) 50%, rgba(241,245,249,0) 100%)",
          transform: "skewX(-18deg)",
          pointerEvents: "none",
        }}
      />
      {data.map((d, i) => {
        const delay = startFrame + i * STAGGER;
        const r = rise(frame, fps, delay);
        const grow = ease(frame, delay + 6, delay + 40);
        const w = Math.max(8, (d.value / full) * barMax * grow);
        return (
          <div key={d.label} style={{ height: rowHeight, opacity: r.opacity, transform: `translateY(${r.y}px)` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <div style={{ fontSize: 38, fontWeight: 600, color: T.ink, display: "flex", gap: 14, alignItems: "baseline" }}>
                {rankFrom != null ? (
                  <span style={{ fontFamily: FONT.mono, color: T.muted, fontSize: 28 }}>{rankFrom + i}</span>
                ) : null}
                <span>{d.label}</span>
                {d.sub ? <span style={{ fontSize: 26, color: T.muted, fontWeight: 500 }}>{d.sub}</span> : null}
              </div>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 36,
                  fontWeight: 600,
                  color: readable(d.color),
                  opacity: grow,
                  background: "rgba(7, 11, 20, 0.85)",
                  padding: "0 10px",
                  marginRight: -10,
                  borderRadius: 8,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {d.display ?? String(d.value)}
              </div>
            </div>
            <div style={{ position: "relative", height: 22, borderRadius: 11, background: T.track, overflow: "visible" }}>
              <div
                style={{
                  width: w,
                  height: 22,
                  borderRadius: 11,
                  background: `linear-gradient(90deg, ${d.color ?? T.accentDeep}, ${d.color ?? T.accent})`,
                }}
              />
              {marker ? (
                <div
                  style={{
                    position: "absolute",
                    left: (marker.value / full) * barMax - 2,
                    top: -8,
                    width: 4,
                    height: 38,
                    borderRadius: 2,
                    background: T.plate,
                    opacity: markerIn,
                  }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
      {marker ? (
        <div
          style={{
            position: "absolute",
            left: (marker.value / full) * barMax,
            top: data.length * rowHeight - (rowHeight - 70) + 8,
            transform: (marker.value / full) * barMax > SAFE.w / 2 ? "translateX(-100%)" : "none",
            fontFamily: FONT.mono,
            fontSize: 24,
            color: T.plate,
            whiteSpace: "nowrap",
            letterSpacing: 1,
            opacity: markerIn,
          }}
        >
          {marker.label}
        </div>
      ) : null}
    </div>
  );
};

/** A big number that counts up. */
export const BigNumber: React.FC<{
  value: number;
  format: (n: number) => string;
  top: number;
  startFrame: number;
  label?: string;
  size?: number;
  color?: string;
  durationFrames?: number;
}> = ({ value, format, top, startFrame, label, size = 220, color = T.ink, durationFrames = 40 }) => {
  const frame = useCurrentFrame();
  const t = ease(frame, startFrame, startFrame + durationFrames);
  const o = interpolate(frame, [startFrame, startFrame + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: SAFE.x, top, width: SAFE.w, opacity: o }}>
      <div style={{ fontFamily: FONT.display, fontSize: size, lineHeight: 0.95, letterSpacing: -2, color, fontVariantNumeric: "tabular-nums" }}>
        {format(value * t)}
      </div>
      {label ? <div style={{ marginTop: 18, fontSize: 40, color: T.muted, fontWeight: 500 }}>{label}</div> : null}
    </div>
  );
};

export interface LinePoint {
  x: string;
  y: number;
}

/** A line that draws itself, with a soft area under it and a dot at the end. */
export const Line: React.FC<{
  points: LinePoint[];
  top: number;
  height: number;
  startFrame: number;
  durationFrames?: number;
  color?: string;
  labelEvery?: number;
  yLabel?: (y: number) => string;
  annotations?: Array<{ index: number; text: string }>;
}> = ({ points, top, height, startFrame, durationFrames = 60, color = T.accent, labelEvery = 1, yLabel, annotations = [] }) => {
  const frame = useCurrentFrame();
  const w = SAFE.w;
  const padL = 0;
  const padB = 60;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const px = (i: number) => padL + (i / (points.length - 1)) * (w - padL);
  const py = (y: number) => 30 + (1 - (y - min) / span) * (height - padB - 30);
  const t = ease(frame, startFrame, startFrame + durationFrames);
  const shown = Math.max(1, t * (points.length - 1));
  const idx = Math.floor(shown);
  const frac = shown - idx;
  const path: string[] = [];
  for (let i = 0; i <= idx && i < points.length; i++) path.push(`${i === 0 ? "M" : "L"}${px(i)},${py(points[i].y)}`);
  let endX = px(Math.min(idx, points.length - 1));
  let endY = py(points[Math.min(idx, points.length - 1)].y);
  if (idx < points.length - 1 && frac > 0) {
    endX = px(idx) + (px(idx + 1) - px(idx)) * frac;
    endY = py(points[idx].y) + (py(points[idx + 1].y) - py(points[idx].y)) * frac;
    path.push(`L${endX},${endY}`);
  }
  const d = path.join(" ");
  const area = `${d} L${endX},${height - padB} L${px(0)},${height - padB} Z`;
  return (
    <div style={{ position: "absolute", left: SAFE.x, top, width: w, height }}>
      <svg width={w} height={height} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={w} y1={30 + g * (height - padB - 30)} y2={30 + g * (height - padB - 30)} stroke={T.rule} strokeWidth={2} />
        ))}
        <path d={area} fill="url(#line-area)" />
        <path d={d} fill="none" stroke={color} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={endX} cy={endY} r={16} fill={T.bg} stroke={color} strokeWidth={8} />
        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text key={p.x} x={px(i)} y={height - 14} fill={T.muted} fontSize={24} fontFamily={FONT.mono} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}>
              {p.x}
            </text>
          ) : null,
        )}
        {yLabel ? (
          <text x={endX} y={endY - 34} fill={color} fontSize={36} fontFamily={FONT.mono} fontWeight={600} textAnchor={endX > w * 0.7 ? "end" : "middle"} opacity={t}>
            {yLabel(points[Math.min(idx, points.length - 1)].y)}
          </text>
        ) : null}
        {annotations.map((a) => {
          const vis = shown >= a.index ? 1 : 0;
          const ax = px(a.index);
          const ay = py(points[a.index].y);
          return (
            <g key={a.index} opacity={vis}>
              <circle cx={ax} cy={ay} r={10} fill={T.plate} />
              <text x={ax} y={ay - 28} fill={T.plate} fontSize={26} fontFamily={FONT.sans} fontWeight={600} textAnchor={ax > w * 0.7 ? "end" : ax < w * 0.3 ? "start" : "middle"}>
                {a.text}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/** Vertical columns, one per month or year, with one highlighted. */
export const Columns: React.FC<{
  data: Array<{ label: string; value: number; highlight?: boolean }>;
  top: number;
  height: number;
  startFrame: number;
  format?: (n: number) => string;
}> = ({ data, top, height, startFrame, format }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...data.map((d) => d.value));
  const gap = 14;
  const colW = (SAFE.w - gap * (data.length - 1)) / data.length;
  const labelH = 50;
  return (
    <div style={{ position: "absolute", left: SAFE.x, top, width: SAFE.w, height, display: "flex", alignItems: "flex-end", gap }}>
      {data.map((d, i) => {
        const g = ease(frame, startFrame + i * 3, startFrame + i * 3 + 24);
        const h = (d.value / max) * (height - labelH - 60) * g;
        return (
          <div key={d.label} style={{ width: colW, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height }}>
            {d.highlight && format ? (
              <div style={{ fontFamily: FONT.mono, fontSize: 30, color: T.plate, fontWeight: 600, marginBottom: 10, opacity: g, whiteSpace: "nowrap" }}>{format(d.value)}</div>
            ) : null}
            <div
              style={{
                width: "100%",
                height: h,
                borderRadius: 8,
                background: d.highlight ? `linear-gradient(180deg, ${T.plate}, #d9a90f)` : `linear-gradient(180deg, ${T.accent}, ${T.accentDeep})`,
                opacity: d.highlight ? 1 : 0.75,
              }}
            />
            <div style={{ height: labelH, display: "flex", alignItems: "flex-end", fontFamily: FONT.mono, fontSize: 24, color: d.highlight ? T.plate : T.muted, paddingTop: 10 }}>
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
