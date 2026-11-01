import React from "react";
import { T } from "../brand/theme";
import type { ValueTableProps } from "../props";
import { Clip, RankedBars } from "./shared";

export const ValueTable: React.FC<ValueTableProps> = (p) => (
  <Clip p={p} intro={p.intro} outro={p.outro}>
    <RankedBars rows={p.rows} max={100} colour={() => (p.variant === "holders" ? T.good : T.warn)} />
  </Clip>
);
