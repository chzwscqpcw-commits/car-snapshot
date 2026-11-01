import React from "react";
import { Columns } from "../brand/charts";
import type { SeasonDueProps } from "../props";
import { BEAT, Clip } from "./shared";

export const SeasonDue: React.FC<SeasonDueProps> = (p) => (
  <Clip p={p} intro={p.intro} outro={p.outro}>
    <Columns data={p.columns} top={720} height={600} startFrame={BEAT.data} format={(n) => `${(n / 1e6).toFixed(1)}m`} />
  </Clip>
);
