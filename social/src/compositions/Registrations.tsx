import React from "react";
import { Columns, Line } from "../brand/charts";
import type { RegistrationsProps } from "../props";
import { BEAT, Clip } from "./shared";

export const Registrations: React.FC<RegistrationsProps> = (p) => (
  <Clip p={p} intro={p.intro} outro={p.outro}>
    {p.variant === "total" ? (
      <Columns data={p.columns} top={720} height={600} startFrame={BEAT.data} format={(n) => `${(n / 1000).toFixed(2)}m`} />
    ) : (
      <Line points={p.line} top={720} height={620} startFrame={BEAT.data} durationFrames={90} yLabel={(y) => `${y}%`} labelEvery={2} />
    )}
  </Clip>
);
