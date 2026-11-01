import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import { Closing } from "../brand/Closing";
import { Frame } from "../brand/Frame";
import { Bars, type BarDatum } from "../brand/charts";
import { Caption, Hook } from "../brand/Text";
import { SAFE, T } from "../brand/theme";
import type { Common, RankRow } from "../props";

/** Where the beats land, in frames at 30 fps. */
export const BEAT = {
  hook: 4,
  intro: 36,
  data: 70,
  outro: 350,
  closing: 470,
} as const;

/** Hook size by length, so long headlines still fit the top third. */
export function hookSize(hook: Common["hook"]): number {
  const n = hook.map((s) => (typeof s === "string" ? s : s.em)).join("").length;
  return n > 40 ? 84 : n > 30 ? 94 : 104;
}

/**
 * The shape of most clips: frame, hook, intro line, a data area, an outro
 * line, then the closing card. Compositions put their data area in `children`.
 */
export const Clip: React.FC<{ p: Common; intro?: string; outro?: string; children: React.ReactNode }> = ({ p, intro, outro, children }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <Frame eyebrow={p.eyebrow} source={p.source} music={p.music}>
      <Sequence from={0} durationInFrames={BEAT.closing + 12} layout="none">
        <Hook segments={p.hook} size={hookSize(p.hook)} delay={BEAT.hook} />
        {intro ? (
          <Caption top={560} delay={BEAT.intro} size={40} color={T.muted}>
            {intro}
          </Caption>
        ) : null}
        {children}
        {outro ? (
          <Caption top={SAFE.bottom - 110} delay={BEAT.outro} size={40} color={T.soft}>
            {outro}
          </Caption>
        ) : null}
      </Sequence>
      <Sequence from={BEAT.closing} durationInFrames={durationInFrames - BEAT.closing} layout="none">
        <Closing cta={p.cta} plate={p.plate} />
      </Sequence>
    </Frame>
  );
};

/** Ranked bars, the data area of the list-shaped clips. */
export const RankedBars: React.FC<{
  rows: RankRow[];
  marker?: { value: number; label: string };
  max?: number;
  colour?: (row: RankRow, i: number) => string | undefined;
  top?: number;
  rankFrom?: number;
}> = ({ rows, marker, max, colour, top = 700, rankFrom = 1 }) => {
  const available = SAFE.bottom - 130 - top;
  const rowHeight = Math.min(118, Math.floor(available / rows.length));
  const data: BarDatum[] = rows.map((r, i) => ({ label: r.label, value: r.value, display: r.display, sub: r.sub, color: colour?.(r, i) }));
  return <Bars data={data} top={top} startFrame={BEAT.data} marker={marker} max={max} rowHeight={rowHeight} rankFrom={rankFrom} />;
};
