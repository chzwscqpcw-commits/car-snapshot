import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { rise } from "../brand/motion";
import { FONT, SAFE, T } from "../brand/theme";
import type { FailReasonsProps } from "../props";
import { BEAT, Clip, RankedBars } from "./shared";

/** A numbered list for a model's fail areas (the data has an order, not counts). */
const Numbered: React.FC<{ rows: FailReasonsProps["rows"] }> = ({ rows }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: SAFE.x, top: 720, width: SAFE.w }}>
      {rows.map((r, i) => {
        const a = rise(frame, fps, BEAT.data + i * 9);
        return (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              padding: "22px 0",
              borderTop: `2px solid ${T.rule}`,
              opacity: a.opacity,
              transform: `translateY(${a.y}px)`,
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 18,
                background: i === 0 ? T.plate : T.surface,
                color: i === 0 ? T.plateInk : T.accent,
                fontFamily: FONT.mono,
                fontSize: 44,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontSize: 50, fontWeight: 600, color: i === 0 ? T.ink : T.soft }}>{r.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export const FailReasons: React.FC<FailReasonsProps> = (p) => (
  <Clip p={p} intro={p.intro} outro={p.outro}>
    {p.ranked ? <Numbered rows={p.rows} /> : <RankedBars rows={p.rows} colour={(_, i) => (i === 0 ? T.risk : T.warn)} />}
  </Clip>
);
