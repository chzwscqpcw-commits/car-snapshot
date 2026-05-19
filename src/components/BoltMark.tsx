import { useId } from "react";

interface BoltMarkProps {
  className?: string;
  variant?: "filled" | "outlined";
  glow?: boolean;
}

/**
 * Free Plate Check brand mark — a custom geometric lightning bolt.
 *
 * Design notes:
 * - Asymmetric, forward-leaning polygon (sharper than Lucide's Zap).
 * - Cyan → electric-blue gradient. Solid white in monochrome contexts.
 * - Single path scales cleanly from 16x16 favicon to large hero sizes.
 */
export default function BoltMark({
  className = "",
  variant = "filled",
  glow = false,
}: BoltMarkProps) {
  const uid = useId();
  const gradientId = `boltmark-${uid}`;
  const glowId = `boltmark-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        {glow && (
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <path
        d="M 15 0 L 5 17 L 12 17 L 10 32 L 19 15 L 12 15 Z"
        fill={variant === "filled" ? `url(#${gradientId})` : "none"}
        stroke={variant === "outlined" ? `url(#${gradientId})` : "none"}
        strokeWidth={variant === "outlined" ? 1.5 : 0}
        strokeLinejoin="round"
        filter={glow ? `url(#${glowId})` : undefined}
      />
    </svg>
  );
}
