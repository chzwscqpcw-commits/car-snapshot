import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, rise } from "../brand/motion";
import { FONT, SAFE, T } from "../brand/theme";
import type { WrongTurnProps } from "../props";
import { BEAT, Clip } from "./shared";

/**
 * A teaser for the 404 game: a night road in one-point perspective, its
 * stripes rolling towards the camera, a gantry sign, and four lines of copy.
 */
export const WrongTurn: React.FC<WrongTurnProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = SAFE.w;
  const h = 560;
  const top = 700;
  const vpX = w / 2;
  const vpY = 110;
  const roadIn = ease(frame, BEAT.data, BEAT.data + 30);
  // stripes march toward the camera: t in [0,1) repeating
  const speed = (frame - BEAT.data) / 26;
  const stripes = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const t = ((i + speed) % 7) / 7; // 0 far → 1 near
    const z = Math.pow(t, 2.2);
    const y = vpY + z * (h - vpY);
    const len = 8 + z * 60;
    const wd = 2 + z * 22;
    return { y, len, wd, o: Math.min(1, z * 3) };
  });
  const signIn = ease(frame, BEAT.data + 40, BEAT.data + 64);
  return (
    <Clip p={p} intro={undefined} outro={undefined}>
      <div style={{ position: "absolute", left: SAFE.x, top, width: w, height: h, opacity: roadIn }}>
        <svg width={w} height={h} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b1220" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(34,211,238,0)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.18)" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={w} height={vpY + 6} fill="url(#horizon)" />
          <polygon points={`${vpX - 10},${vpY} ${vpX + 10},${vpY} ${w + 160},${h} ${-160},${h}`} fill="url(#road)" />
          <polygon points={`${vpX - 12},${vpY} ${vpX - 10},${vpY} ${-120},${h} ${-170},${h}`} fill={T.plate} opacity={0.8} />
          <polygon points={`${vpX + 10},${vpY} ${vpX + 12},${vpY} ${w + 170},${h} ${w + 120},${h}`} fill={T.plate} opacity={0.8} />
          {stripes.map((s, i) => (
            <rect key={i} x={vpX - s.wd / 2} y={s.y - s.len} width={s.wd} height={s.len} fill="#F1F5F9" opacity={s.o * 0.9} rx={s.wd / 4} />
          ))}
          {/* gantry */}
          <g opacity={signIn} transform={`translate(0 ${(1 - signIn) * -30})`}>
            <rect x={vpX - 300} y={vpY + 30} width={600} height={120} rx={14} fill="#0E7490" stroke={T.accent} strokeWidth={4} />
            <text x={vpX} y={vpY + 82} textAnchor="middle" fill="#F1F5F9" fontFamily={FONT.sans} fontWeight={700} fontSize={42}>
              freeplatecheck.co.uk
            </text>
            <text x={vpX} y={vpY + 126} textAnchor="middle" fill={T.plate} fontFamily={FONT.mono} fontSize={26} letterSpacing={3}>
              EXIT ↗  NO U-TURN
            </text>
            <rect x={vpX - 300} y={vpY + 150} width={8} height={h - vpY - 150} fill="#334155" />
            <rect x={vpX + 292} y={vpY + 150} width={8} height={h - vpY - 150} fill="#334155" />
          </g>
          {/* the car: a simple rear view */}
          <g transform={`translate(${vpX} ${h - 40})`}>
            <rect x={-130} y={-120} width={260} height={120} rx={28} fill="#1E293B" stroke="#334155" strokeWidth={4} />
            <rect x={-100} y={-112} width={200} height={54} rx={14} fill="#0b1220" />
            <rect x={-122} y={-50} width={54} height={18} rx={9} fill={T.risk} />
            <rect x={68} y={-50} width={54} height={18} rx={9} fill={T.risk} />
            <rect x={-54} y={-42} width={108} height={30} rx={6} fill={T.plate} />
          </g>
        </svg>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: top + h + 20, width: SAFE.w }}>
        {p.lines.map((line, i) => {
          const r = rise(frame, fps, BEAT.data + 70 + i * 40);
          return (
            <div key={line} style={{ fontSize: 42, fontWeight: 500, color: i === p.lines.length - 1 ? T.plate : T.soft, lineHeight: 1.35, opacity: r.opacity, transform: `translateY(${r.y}px)` }}>
              {line}
            </div>
          );
        })}
      </div>
    </Clip>
  );
};
