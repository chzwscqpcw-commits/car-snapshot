import React from "react";
import { BigNumber } from "../brand/charts";
import { T } from "../brand/theme";
import type { PassByAreaProps } from "../props";
import { BEAT, Clip, RankedBars } from "./shared";

export const PassByArea: React.FC<PassByAreaProps> = (p) => {
  if (p.spotlight) {
    const s = p.spotlight;
    const up = s.passRate >= p.national;
    return (
      <Clip p={p} intro={p.intro} outro={undefined}>
        <BigNumber value={s.passRate} format={(n) => `${n.toFixed(1)}%`} top={690} startFrame={BEAT.data} label={`pass first time in ${s.name} · UK ${p.national.toFixed(1)}%`} size={200} color={up ? T.good : T.warn} />
        <RankedBars rows={p.rows} top={1050} colour={(_, i) => (i === 0 ? T.risk : T.warn)} rankFrom={1} />
      </Clip>
    );
  }
  return (
    <Clip p={p} intro={p.intro} outro={p.outro}>
      <RankedBars rows={p.rows} max={100} marker={{ value: p.national, label: `UK ${p.national.toFixed(1)}%` }} colour={() => (p.variant === "best" ? T.good : T.warn)} />
    </Clip>
  );
};
