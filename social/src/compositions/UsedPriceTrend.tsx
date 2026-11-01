import React from "react";
import { Line } from "../brand/charts";
import type { UsedPriceTrendProps } from "../props";
import { BEAT, Clip } from "./shared";

export const UsedPriceTrend: React.FC<UsedPriceTrendProps> = (p) => (
  <Clip p={p} intro={p.intro} outro={p.outro}>
    <Line points={p.line} top={720} height={620} startFrame={BEAT.data} durationFrames={110} labelEvery={4} yLabel={(y) => String(Math.round(y))} annotations={p.annotations} />
  </Clip>
);
