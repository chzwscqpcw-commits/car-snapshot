"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BoltMark from "@/components/BoltMark";

interface ScanBeamRevealProps {
  /** Reg plate to navigate to when the scan completes. */
  vrm: string;
  /** Button label. */
  label?: string;
  /** Where the full report lives. Defaults to / which is the universal report. */
  destination?: string;
  /** Optional className on the button. */
  className?: string;
  /** Optional sub-label below the main label. */
  subLabel?: string;
}

/**
 * Branded "pull the full DVLA report" CTA.
 *
 * When tapped, a cyan vertical scan beam sweeps down the viewport over ~750ms,
 * then the page navigates to the full-report URL. On mobile devices that
 * support it, a short haptic pulse fires when the beam starts.
 *
 * The beam itself is a fixed-position layer rendered at body level so it
 * sweeps the entire visible page, not just the calling component.
 */
export default function ScanBeamReveal({
  vrm,
  label = "Pull the full DVLA report",
  destination = "/",
  className = "",
  subLabel,
}: ScanBeamRevealProps) {
  const [scanning, setScanning] = useState(false);
  const router = useRouter();
  const startedAt = useRef<number>(0);

  // Prefetch the destination so the navigation feels instant after the scan.
  useEffect(() => {
    router.prefetch(`${destination}?vrm=${encodeURIComponent(vrm)}`);
  }, [router, destination, vrm]);

  const onClick = () => {
    if (scanning) return;
    startedAt.current = performance.now();
    setScanning(true);
    // Light haptic on devices that support it (iOS Safari needs a user gesture)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(12);
      } catch {
        /* ignore */
      }
    }
    // Navigate just before the beam reaches the bottom — feels like the beam
    // "reveals" the new page below it.
    window.setTimeout(() => {
      router.push(`${destination}?vrm=${encodeURIComponent(vrm)}`);
    }, 650);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={scanning}
        className={`group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-90 disabled:cursor-progress ${className}`}
      >
        <BoltMark
          className={`h-4 w-4 ${
            scanning ? "animate-pulse" : "transition-transform group-hover:translate-x-0.5"
          }`}
        />
        <span className="flex flex-col items-start sm:items-center sm:flex-row sm:gap-2">
          <span>{scanning ? "Scanning DVLA & MOT…" : label}</span>
          {subLabel && !scanning && (
            <span className="text-[11px] font-normal text-cyan-100/80 sm:text-cyan-50/70">
              {subLabel}
            </span>
          )}
        </span>
      </button>

      {scanning && <ScanBeam />}
    </>
  );
}

function ScanBeam() {
  return (
    <div
      className="fixed inset-0 z-[80] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Dim wash so the beam reads */}
      <div className="absolute inset-0 bg-slate-950/30 animate-beam-wash" />

      {/* The beam */}
      <div className="absolute left-0 right-0 h-[40vh] -top-[40vh] animate-beam-sweep">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />
        {/* Bright leading edge */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-cyan-300 shadow-[0_0_24px_4px_rgba(34,211,238,0.7)]" />
      </div>

      {/* Side-edge accents */}
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent animate-beam-wash" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent animate-beam-wash" />

      <style jsx>{`
        @keyframes beamSweep {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(140vh);
            opacity: 0;
          }
        }
        @keyframes beamWash {
          0% {
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          80% {
            opacity: 0.7;
          }
          100% {
            opacity: 0;
          }
        }
        :global(.animate-beam-sweep) {
          animation: beamSweep 700ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        :global(.animate-beam-wash) {
          animation: beamWash 700ms ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.animate-beam-sweep),
          :global(.animate-beam-wash) {
            animation-duration: 0.1s !important;
            opacity: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
