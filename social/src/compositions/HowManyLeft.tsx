import React from "react";
import { useCurrentFrame } from "remotion";
import { BigNumber } from "../brand/charts";
import { ease } from "../brand/motion";
import { FONT, SAFE, T } from "../brand/theme";
import { fmtInt } from "../format";
import type { HowManyLeftProps } from "../props";
import { BEAT, Clip } from "./shared";

export const HowManyLeft: React.FC<HowManyLeftProps> = (p) => {
  const frame = useCurrentFrame();
  const total = p.licensed + p.sorn;
  const share = total > 0 ? p.licensed / total : 0;
  const grow = ease(frame, BEAT.data + 50, BEAT.data + 100);
  const tagIn = ease(frame, BEAT.data + 110, BEAT.data + 126);
  return (
    <Clip p={p} intro={`Still on UK roads, licensed, or kept off the road on SORN.`} outro={p.outro}>
      <BigNumber value={p.licensed} format={fmtInt} top={690} startFrame={BEAT.data} label="still licensed" size={210} durationFrames={50} />
      <BigNumber value={p.sorn} format={fmtInt} top={990} startFrame={BEAT.data + 30} label="on SORN, off the road" size={120} color={T.plate} durationFrames={40} />
      <div style={{ position: "absolute", left: SAFE.x, top: 1210, width: SAFE.w }}>
        <div style={{ display: "flex", height: 28, borderRadius: 14, overflow: "hidden", background: T.track }}>
          <div style={{ width: `${share * 100 * grow}%`, background: `linear-gradient(90deg, ${T.accentDeep}, ${T.accent})` }} />
          <div style={{ width: `${(1 - share) * 100 * grow}%`, background: T.plate }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontFamily: FONT.mono, fontSize: 26, color: T.muted, opacity: grow }}>
          <span>{Math.round(share * 100)}% licensed</span>
          <span>{Math.round((1 - share) * 100)}% SORN</span>
        </div>
        <div
          style={{
            marginTop: 26,
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 999,
            border: `2px solid ${T.accent}`,
            color: T.accent,
            fontFamily: FONT.mono,
            fontSize: 28,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: tagIn,
            transform: `scale(${0.9 + tagIn * 0.1})`,
          }}
        >
          {p.category} · {fmtInt(total)} survive
        </div>
      </div>
    </Clip>
  );
};
