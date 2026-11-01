import React from "react";
import { FONT, T } from "./theme";

/**
 * The yellow plate. Shows a made-up sample plate (src/components/home/
 * sample-cars.ts) or, with no text, a blank plate. Never a real registration.
 */
export const Plate: React.FC<{ text?: string; scale?: number; style?: React.CSSProperties }> = ({ text, scale = 1, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "stretch",
      background: T.plate,
      borderRadius: 18 * scale,
      overflow: "hidden",
      boxShadow: "0 24px 70px rgba(245, 197, 24, 0.22)",
      ...style,
    }}
  >
    <div
      style={{
        width: 54 * scale,
        background: "#1D4ED8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 14 * scale,
        color: "#FFFFFF",
        fontFamily: FONT.sans,
        fontWeight: 700,
        fontSize: 22 * scale,
        letterSpacing: 1,
      }}
    >
      <div
        style={{
          width: 22 * scale,
          height: 22 * scale,
          borderRadius: "50%",
          border: `${2 * scale}px solid rgba(255,255,255,0.75)`,
          marginBottom: 10 * scale,
        }}
      />
      UK
    </div>
    <div
      style={{
        padding: `${22 * scale}px ${48 * scale}px`,
        color: T.plateInk,
        fontFamily: FONT.sans,
        fontWeight: 700,
        fontSize: 96 * scale,
        lineHeight: 1,
        letterSpacing: 4 * scale,
        minWidth: text ? undefined : 480 * scale,
        display: "flex",
        alignItems: "center",
      }}
    >
      {text ?? ""}
    </div>
  </div>
);
