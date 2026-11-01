import React from "react";

/** The site's bolt mark (src/components/BoltMark.tsx), cyan → blue. */
export const Bolt: React.FC<{ size?: number; mono?: boolean }> = ({ size = 40, mono = false }) => (
  <svg width={size} height={(size * 32) / 24} viewBox="0 0 24 32" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="bolt-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <path d="M14.5 1 3 18h8l-2.5 13L21 13h-8z" fill={mono ? "#ffffff" : "url(#bolt-grad)"} />
  </svg>
);
