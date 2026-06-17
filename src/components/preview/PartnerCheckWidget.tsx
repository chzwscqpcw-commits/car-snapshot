"use client";

import { useState } from "react";
import {
  Calendar,
  Receipt,
  Gauge,
  AlertTriangle,
  Wind,
  ArrowRight,
  Wrench,
  CheckCircle2,
} from "lucide-react";

// MOCK-UP of a co-branded vehicle-check widget ClickMechanic could embed on
// their own (light) site. Results show IN the widget (no redirect away), and the
// CTAs point at ClickMechanic's OWN services — so a free check funnels into his
// bookings rather than sending traffic off-site. Quiet "powered by Free Plate
// Check" for our brand awareness. Sample data only (clearly a demo).
const CM = "#3c93f7";

function Bolt({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 32" width={(size * 24) / 32} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="pcw-bolt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path d="M 15 0 L 5 17 L 12 17 L 10 32 L 19 15 L 12 15 Z" fill="url(#pcw-bolt)" />
    </svg>
  );
}

const ROWS = [
  { Icon: Calendar, label: "MOT", value: "Due in 3 weeks", sub: "expires 4 Jul 2026", tone: "warn" as const },
  { Icon: Receipt, label: "Tax", value: "Taxed", sub: "£190/yr", tone: "ok" as const },
  { Icon: Gauge, label: "Mileage", value: "62,300", sub: "no anomalies", tone: "neutral" as const },
  { Icon: Wind, label: "ULEZ", value: "Compliant", sub: "", tone: "ok" as const },
  { Icon: AlertTriangle, label: "Last MOT", value: "1 advisory", sub: "front brake pads wearing", tone: "warn" as const },
];

const toneColor: Record<string, string> = {
  ok: "#059669",
  warn: "#d97706",
  neutral: "#0f172a",
};

export default function PartnerCheckWidget() {
  const [reg, setReg] = useState("VN23 BCD");
  const [shown, setShown] = useState(true); // demo defaults to results shown

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      {/* header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: CM }}>
          Free vehicle check
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          powered by <Bolt size={13} /> <span className="font-semibold text-slate-500">Free Plate Check</span>
        </span>
      </div>

      <div className="p-5">
        {/* reg input row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShown(true);
          }}
          className="flex gap-2"
        >
          <div className="flex flex-1 overflow-hidden rounded-lg border-2 border-slate-900">
            <span className="flex items-center bg-[#2563eb] px-2 font-mono text-xs font-bold text-white">UK</span>
            <input
              value={reg}
              onChange={(e) => {
                setReg(e.target.value.toUpperCase());
                setShown(false);
              }}
              placeholder="ENTER REG"
              className="w-full bg-[#fbbf24] px-3 py-2.5 font-mono text-lg font-bold tracking-widest text-slate-900 placeholder:text-slate-700/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-lg px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: CM }}
          >
            Check
          </button>
        </form>

        {/* results — shown IN the widget, no redirect */}
        {shown && (
          <div className="mt-4">
            <p className="text-sm font-bold text-slate-900">Ford Focus 1.0 EcoBoost · 2018</p>
            <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {ROWS.map(({ Icon, label, value, sub, tone }) => (
                <div key={label} className="flex items-center gap-3 px-3.5 py-2.5">
                  <Icon className="h-4 w-4 shrink-0" style={{ color: tone === "neutral" ? "#94a3b8" : toneColor[tone] }} />
                  <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                  <span className="flex-1 text-right text-sm font-semibold" style={{ color: toneColor[tone] }}>
                    {value}
                    {sub && <span className="ml-1.5 font-normal text-slate-400">· {sub}</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs → ClickMechanic's OWN services (this is on their site) */}
            <div className="mt-4 space-y-2">
              <a
                href="#"
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: CM }}
              >
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> MOT due soon — book your MOT
                </span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50"
                style={{ borderColor: `${CM}40`, color: CM }}
              >
                <span className="inline-flex items-center gap-2">
                  <Wrench className="h-4 w-4" /> Advisory found — get it checked
                </span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Vehicle data from DVLA &amp; DVSA, via Free Plate Check.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
