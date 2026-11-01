import React from "react";
import type { ColoursProps } from "../props";
import { Clip, RankedBars } from "./shared";

export const Colours: React.FC<ColoursProps> = (p) => (
  <Clip p={p} intro={p.intro} outro={p.outro}>
    <RankedBars rows={p.rows} colour={(_, i) => p.rows[i].swatch} />
  </Clip>
);
