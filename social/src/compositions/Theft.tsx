import React from "react";
import { T } from "../brand/theme";
import type { TheftProps } from "../props";
import { Clip, RankedBars } from "./shared";

export const Theft: React.FC<TheftProps> = (p) => {
  const marker = p.national > 0 ? { value: p.national, label: p.nationalLabel } : undefined;
  const colour = (_: unknown, i: number) => (p.variant === "least-stolen" ? T.good : i === 0 ? T.risk : undefined);
  return (
    <Clip p={p} intro={p.intro} outro={p.outro}>
      <RankedBars rows={p.rows} marker={marker} colour={colour} rankFrom={p.variant === "by-age" ? undefined : 1} />
    </Clip>
  );
};
