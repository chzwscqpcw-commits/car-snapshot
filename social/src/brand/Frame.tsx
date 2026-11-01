import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Bolt } from "./Bolt";
import { ensureFonts } from "./fonts";
import { DOMAIN, FONT, SAFE, T } from "./theme";

ensureFonts();

export interface FrameProps {
  /** Small cyan label above the hook: the audience's strand. */
  eyebrow: string;
  /** "Source · date", bottom of the safe area. */
  source: string;
  music: boolean;
  children: React.ReactNode;
}

/**
 * Everything every clip shares: the slate backdrop with its soft glow and
 * faint grid, the bolt + domain header (on screen for the whole clip), the
 * eyebrow, the source line and the music bed.
 */
export const Frame: React.FC<FrameProps> = ({ eyebrow, source, music, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const drift = Math.sin(frame / (fps * 4)) * 40;
  const headerIn = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: T.bg, fontFamily: FONT.sans, color: T.ink, overflow: "hidden" }}>
      {music ? (
        <Audio
          src={staticFile("audio/track.mp3")}
          volume={(f) =>
            interpolate(f, [0, 24, durationInFrames - 50, durationInFrames - 4], [0, 0.55, 0.55, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      ) : null}

      {/* glow */}
      <div
        style={{
          position: "absolute",
          left: -200 + drift,
          top: -260,
          width: 1200,
          height: 1100,
          background: "radial-gradient(ellipse at center, rgba(37, 99, 235, 0.26) 0%, rgba(7, 11, 20, 0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -300 - drift,
          bottom: -200,
          width: 1000,
          height: 900,
          background: "radial-gradient(ellipse at center, rgba(34, 211, 238, 0.10) 0%, rgba(7, 11, 20, 0) 60%)",
        }}
      />
      {/* grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "90px 90px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.25))",
        }}
      />

      {/* header: always on screen */}
      <div
        style={{
          position: "absolute",
          left: SAFE.x,
          top: SAFE.top,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: headerIn,
        }}
      >
        <Bolt size={34} />
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>{DOMAIN}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE.x,
          top: SAFE.top + 86,
          fontFamily: FONT.mono,
          fontSize: 24,
          letterSpacing: 3,
          color: T.accent,
          textTransform: "uppercase",
          opacity: headerIn,
        }}
      >
        {eyebrow}
      </div>

      {children}

      {/* source line */}
      <div
        style={{
          position: "absolute",
          left: SAFE.x,
          top: SAFE.bottom + 20,
          width: SAFE.w,
          fontSize: 22,
          color: T.dim,
          fontFamily: FONT.mono,
          letterSpacing: 0.5,
          opacity: headerIn,
        }}
      >
        {source}
      </div>
    </AbsoluteFill>
  );
};
