import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, rise } from "../brand/motion";
import { FONT, SAFE, T } from "../brand/theme";
import { fmtGbp } from "../format";
import type { WorthAfterProps } from "../props";
import { BEAT, Clip } from "./shared";

/** New price on the left, then the guide value stepping down by age. */
export const WorthAfter: React.FC<WorthAfterProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols = [{ age: 0, value: p.newPrice }, ...p.points];
  const max = p.newPrice;
  const top = 720;
  const height = 620;
  const labelH = 70;
  const gap = 22;
  const colW = (SAFE.w - gap * (cols.length - 1)) / cols.length;
  return (
    <Clip p={p} intro={p.intro} outro={p.outro}>
      <div style={{ position: "absolute", left: SAFE.x, top, width: SAFE.w, height, display: "flex", alignItems: "flex-end", gap }}>
        {cols.map((c, i) => {
          const start = BEAT.data + i * 14;
          const g = ease(frame, start, start + 26);
          const r = rise(frame, fps, start);
          const h = (c.value / max) * (height - labelH - 80) * g;
          const isThree = c.age === 3;
          const pct = Math.round((c.value / p.newPrice) * 100);
          return (
            <div key={c.age} style={{ width: colW, height, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: isThree ? 40 : 30, fontWeight: 700, color: isThree ? T.plate : c.age === 0 ? T.ink : T.accent, marginBottom: 12, opacity: r.opacity, whiteSpace: "nowrap" }}>
                {fmtGbp(c.value, c.age === 0 ? 100 : 50)}
              </div>
              {c.age > 0 ? (
                <div style={{ fontFamily: FONT.mono, fontSize: 24, color: T.muted, marginBottom: 10, opacity: g }}>{pct}%</div>
              ) : null}
              <div
                style={{
                  width: "100%",
                  height: Math.max(6, h),
                  borderRadius: 12,
                  background: isThree ? `linear-gradient(180deg, ${T.plate}, #d9a90f)` : c.age === 0 ? `linear-gradient(180deg, ${T.soft}, ${T.muted})` : `linear-gradient(180deg, ${T.accent}, ${T.accentDeep})`,
                  boxShadow: isThree ? "0 0 60px rgba(245,197,24,0.25)" : undefined,
                }}
              />
              <div style={{ height: labelH, display: "flex", alignItems: "flex-end", paddingTop: 12, fontSize: 30, fontWeight: 600, color: isThree ? T.plate : T.muted, opacity: r.opacity }}>
                {c.age === 0 ? "New" : `${c.age} yr${c.age > 1 ? "s" : ""}`}
              </div>
            </div>
          );
        })}
      </div>
    </Clip>
  );
};
