"use client";

import { useState } from "react";

/**
 * Preview gallery for plate-style reg treatments. Not linked from anywhere
 * — visit /preview/plate to compare designs. Once a variant is picked it
 * gets extracted into src/components/RegPlate.tsx and wired into the
 * loading skeleton + results header. Remove this page after that.
 */
export default function PlatePreviewPage() {
  const [reg, setReg] = useState("P7 SJG");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Plate-style preview gallery
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Five directions for showing the reg during loading + on the results header. Type any reg below to see them all update in real time. Pick the one that feels right and we&apos;ll wire it in.
          </p>
        </div>

        <div className="mb-10 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
            Test reg
          </label>
          <input
            type="text"
            value={reg}
            onChange={(e) => setReg(e.target.value.toUpperCase())}
            placeholder="AB12 CDE"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-lg tracking-[0.18em] focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/40"
          />
        </div>

        <div className="space-y-8">
          <Variant label="A — Authentic yellow" sub="Real UK rear-plate styling. Yellow background, bold black text, subtle inner shadow for depth.">
            <PlateA reg={reg} />
          </Variant>

          <Variant label="B — Frosted glass" sub="Frosted backdrop-blur over a cyan glow. Modern, minimal, very on-brand for the existing dark/cyan aesthetic.">
            <PlateB reg={reg} />
          </Variant>

          <Variant label="C — Embossed dark" sub="Slate gradient with inner highlight + shadow that gives a sense of physical depth, but in the site's dark palette.">
            <PlateC reg={reg} />
          </Variant>

          <Variant label="D — Neon glow" sub="Pure black background, cyan text with strong text-shadow glow. Cyberpunk / arcade vibe.">
            <PlateD reg={reg} />
          </Variant>

          <Variant label="E — Holographic shift" sub="Dark plate with an iridescent gradient that shifts between cyan and magenta. Most distinctive — like an ID hologram.">
            <PlateE reg={reg} />
          </Variant>
        </div>

        <p className="mt-12 text-xs text-slate-500">
          Once you&apos;ve picked, tell me which letter (A–E) and I&apos;ll wire it into the loading skeleton + the results header. This page will then be removed.
        </p>
      </div>
    </div>
  );
}

function Variant({
  label,
  sub,
  children,
}: {
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 flex items-center justify-center min-h-[140px]">
        {children}
      </div>
    </div>
  );
}

// ────────── Variant A — Authentic yellow ──────────
function PlateA({ reg }: { reg: string }) {
  return (
    <div
      className="inline-flex items-center rounded-[6px] px-5 sm:px-7 py-2.5 sm:py-3 shadow-lg"
      style={{
        background: "linear-gradient(180deg, #FCD34D 0%, #EAB308 100%)",
        boxShadow:
          "inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <span
        className="font-mono text-2xl sm:text-3xl font-black tracking-[0.12em] text-black select-none"
        style={{ textShadow: "0 1px 0 rgba(255,255,255,0.3)" }}
      >
        {reg || "AB12 CDE"}
      </span>
    </div>
  );
}

// ────────── Variant B — Frosted glass ──────────
function PlateB({ reg }: { reg: string }) {
  return (
    <div className="relative">
      <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 blur-2xl rounded-3xl" />
      <div className="relative inline-flex items-center rounded-xl border border-cyan-500/40 bg-slate-900/40 backdrop-blur-xl px-5 sm:px-7 py-3 sm:py-4 shadow-xl">
        <span className="font-mono text-2xl sm:text-3xl font-bold tracking-[0.18em] text-cyan-100 select-none">
          {reg || "AB12 CDE"}
        </span>
      </div>
    </div>
  );
}

// ────────── Variant C — Embossed dark ──────────
function PlateC({ reg }: { reg: string }) {
  return (
    <div
      className="inline-flex items-center rounded-lg px-5 sm:px-7 py-3 sm:py-4"
      style={{
        background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)",
        border: "1px solid rgba(34,211,238,0.2)",
      }}
    >
      <span
        className="font-mono text-2xl sm:text-3xl font-bold tracking-[0.18em] select-none"
        style={{
          color: "#22d3ee",
          textShadow: "0 1px 0 rgba(0,0,0,0.6)",
        }}
      >
        {reg || "AB12 CDE"}
      </span>
    </div>
  );
}

// ────────── Variant D — Neon glow ──────────
function PlateD({ reg }: { reg: string }) {
  return (
    <div className="inline-flex items-center rounded-md border border-cyan-400/40 bg-black px-5 sm:px-7 py-3 sm:py-4">
      <span
        className="font-mono text-2xl sm:text-3xl font-bold tracking-[0.18em] select-none"
        style={{
          color: "#67e8f9",
          textShadow:
            "0 0 8px rgba(34,211,238,0.8), 0 0 16px rgba(34,211,238,0.5), 0 0 24px rgba(34,211,238,0.3)",
        }}
      >
        {reg || "AB12 CDE"}
      </span>
    </div>
  );
}

// ────────── Variant E — Holographic shift ──────────
function PlateE({ reg }: { reg: string }) {
  return (
    <div
      className="relative inline-flex items-center rounded-lg px-5 sm:px-7 py-3 sm:py-4 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="absolute inset-0 opacity-40 plate-holo-sweep"
        style={{
          background:
            "linear-gradient(110deg, transparent 30%, rgba(34,211,238,0.4) 45%, rgba(168,85,247,0.4) 55%, transparent 70%)",
          backgroundSize: "200% 100%",
        }}
      />
      <span
        className="relative font-mono text-2xl sm:text-3xl font-bold tracking-[0.18em] text-white select-none"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
      >
        {reg || "AB12 CDE"}
      </span>
      <style jsx>{`
        @keyframes plateHoloSweep {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .plate-holo-sweep {
          animation: plateHoloSweep 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
