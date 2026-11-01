import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Bolt } from "./Bolt";
import { pop, rise } from "./motion";
import { Plate } from "./Plate";
import { DOMAIN, FONT, T } from "./theme";

/**
 * The sign-off: the yellow plate, the domain and one line of what to do.
 * Sits in its own Sequence over the last seconds of every clip.
 */
export const Closing: React.FC<{ cta: string; plate: string }> = ({ cta, plate }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const p = pop(frame, fps, 6);
  const l1 = rise(frame, fps, 18);
  const l2 = rise(frame, fps, 26);
  const l3 = rise(frame, fps, 34);
  return (
    <AbsoluteFill style={{ background: `rgba(7, 11, 20, ${bg * 0.97})`, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40, marginTop: -120 }}>
        <div style={{ transform: `scale(${0.7 + p * 0.3}) rotate(${(1 - p) * -4}deg)`, opacity: p }}>
          <Plate text={plate} scale={1.05} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: l1.opacity, transform: `translateY(${l1.y}px)`, marginTop: 20 }}>
          <Bolt size={44} />
          <div style={{ fontFamily: FONT.display, fontSize: 92, letterSpacing: -1, color: T.ink }}>{DOMAIN}</div>
        </div>
        <div style={{ fontSize: 46, color: T.soft, fontWeight: 500, textAlign: "center", maxWidth: 860, lineHeight: 1.25, opacity: l2.opacity, transform: `translateY(${l2.y}px)` }}>
          {cta}
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 28, letterSpacing: 3, color: T.accent, textTransform: "uppercase", opacity: l3.opacity, transform: `translateY(${l3.y}px)` }}>
          Free · No sign-up
        </div>
      </div>
    </AbsoluteFill>
  );
};
