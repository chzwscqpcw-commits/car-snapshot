import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { pop, rise } from "./motion";
import { FONT, SAFE, T } from "./theme";

/**
 * The hook: the first thing on screen, in the top third, in the report's
 * serif. `em` words render italic cyan — pass the headline as segments.
 */
export const Hook: React.FC<{ segments: Array<string | { em: string }>; size?: number; delay?: number; top?: number }> = ({
  segments,
  size = 108,
  delay = 4,
  top = SAFE.top + 150,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, delay);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.x,
        top,
        width: SAFE.w,
        fontFamily: FONT.display,
        fontSize: size,
        lineHeight: 1.0,
        letterSpacing: -1,
        textWrap: "balance",
        opacity: Math.min(1, p * 1.4),
        transform: `translateY(${(1 - p) * 60}px) scale(${0.96 + p * 0.04})`,
        transformOrigin: "left top",
      }}
    >
      {segments.map((s, i) =>
        typeof s === "string" ? (
          <span key={i}>{s}</span>
        ) : (
          <em key={i} style={{ color: T.accent, fontStyle: "italic" }}>
            {s.em}
          </em>
        ),
      )}
    </div>
  );
};

/** A burned-in caption line: large sans, readable on a phone. */
export const Caption: React.FC<{ children: React.ReactNode; top: number; delay?: number; size?: number; color?: string; width?: number }> = ({
  children,
  top,
  delay = 0,
  size = 44,
  color = T.soft,
  width = SAFE.w,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = rise(frame, fps, delay);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.x,
        top,
        width,
        fontSize: size,
        lineHeight: 1.25,
        color,
        fontWeight: 500,
        textWrap: "pretty",
        opacity: r.opacity,
        transform: `translateY(${r.y}px)`,
      }}
    >
      {children}
    </div>
  );
};

/** A yellow highlight inside a caption: the plate yellow for emphasis. */
export const Mark: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: T.plate, fontWeight: 700 }}>{children}</span>
);
