import React from "react";
import { T } from "../brand/theme";
import type { PassByModelProps } from "../props";
import { Clip, RankedBars } from "./shared";

export const PassByModel: React.FC<PassByModelProps> = (p) => (
  <Clip p={p} intro={p.intro} outro={p.outro}>
    <RankedBars
      rows={p.rows}
      max={100}
      marker={{ value: p.national, label: `UK ${p.national.toFixed(1)}%` }}
      colour={(r) => (r.value >= p.national ? T.good : T.warn)}
    />
  </Clip>
);
