"use client";

import { useState } from "react";
import {
  Calendar,
  Receipt,
  Gauge,
  AlertTriangle,
  ArrowRight,
  Wrench,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// WORKING co-branded vehicle-check widget ClickMechanic could embed on their
// own (light) site. It calls our free-gov-data endpoint (/api/lookup → DVSA MOT
// + DVLA tax; NO paid MarketCheck valuation), shows results IN the widget (no
// redirect away), and the CTAs point at ClickMechanic's OWN bookings — so a free
// check funnels into his work. Quiet "powered by Free Plate Check" for our
// brand. (A real third-party embed would call a CORS'd endpoint; here it runs
// same-origin on our preview domain.)
const CM = "#3c93f7";

type LookupData = {
  make?: string;
  model?: string;
  yearOfManufacture?: number;
  taxStatus?: string;
  motStatus?: string;
  motExpiryDate?: string;
  motTests?: Array<{
    expiryDate?: string;
    testResult?: string;
    odometerValue?: { value: number; unit?: string };
    rfrAndComments?: Array<{ text: string; type: string }>;
  }>;
};

type Tone = "ok" | "warn" | "risk" | "neutral";
const toneColor: Record<Tone, string> = {
  ok: "#059669",
  warn: "#d97706",
  risk: "#dc2626",
  neutral: "#0f172a",
};

type View = {
  vehicle: string;
  mot: { value: string; sub?: string; tone: Tone; due: boolean };
  tax: { value: string; tone: Tone };
  mileage: string;
  advisories: string;
  needsLook: boolean;
};

const titleCase = (s?: string) =>
  (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Derived in the fetch handler (not during render — keeps render pure / Date.now OK here).
function deriveView(data: LookupData): View {
  const latest = data.motTests?.[0];
  const expiry = latest?.expiryDate || data.motExpiryDate;
  const mot: View["mot"] = { value: data.motStatus ? titleCase(data.motStatus) : "—", tone: "neutral", due: false };
  if (expiry) {
    const d = new Date(expiry);
    if (!Number.isNaN(d.getTime())) {
      const days = Math.round((d.getTime() - Date.now()) / 86_400_000);
      mot.sub = "expires " + d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      if (days < 0) Object.assign(mot, { value: "Expired", tone: "risk", due: true });
      else if (days < 60) Object.assign(mot, { value: "Due soon", tone: "warn", due: true });
      else Object.assign(mot, { value: "Valid", tone: "ok" });
    }
  }
  const taxed = (data.taxStatus || "").toLowerCase().includes("tax");
  const odo = latest?.odometerValue;
  const mileage = odo?.value != null ? odo.value.toLocaleString("en-GB") + (odo.unit === "KM" ? " km" : "") : "—";
  const advisoryCount = (latest?.rfrAndComments || []).filter((c) => c.type === "ADVISORY").length;
  const failed = latest?.testResult === "FAILED";
  return {
    vehicle: `${titleCase(data.make)} ${titleCase(data.model)}${data.yearOfManufacture ? ` · ${data.yearOfManufacture}` : ""}`.trim(),
    mot,
    tax: { value: data.taxStatus ? titleCase(data.taxStatus) : "—", tone: taxed ? "ok" : "warn" },
    mileage,
    advisories: advisoryCount > 0 ? `${advisoryCount} at last MOT` : failed ? "Last test: fail" : "None",
    needsLook: advisoryCount > 0 || failed,
  };
}

function Bolt({ size = 13 }: { size?: number }) {
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

function Row({ Icon, label, value, sub, tone }: { Icon: typeof Calendar; label: string; value: string; sub?: string; tone: Tone }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5">
      <Icon className="h-4 w-4 shrink-0" style={{ color: tone === "neutral" ? "#94a3b8" : toneColor[tone] }} />
      <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="flex-1 text-right text-sm font-semibold" style={{ color: toneColor[tone] }}>
        {value}
        {sub && <span className="ml-1.5 font-normal text-slate-400">· {sub}</span>}
      </span>
    </div>
  );
}

export default function PartnerCheckWidget() {
  const [reg, setReg] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [view, setView] = useState<View | null>(null);
  const [errMsg, setErrMsg] = useState("");

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const vrm = reg.replace(/\s+/g, "").toUpperCase();
    if (!vrm) return;
    setStatus("loading");
    setView(null);
    setErrMsg("");
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm }),
      });
      const json = await res.json();
      if (!json.ok || !json.data) {
        setErrMsg(json.error || "Couldn't find that registration — try another.");
        setStatus("error");
        return;
      }
      setView(deriveView(json.data as LookupData));
      setStatus("done");
    } catch {
      setErrMsg("Something went wrong — please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      {/* header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: CM }}>
          Free vehicle check
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          powered by <Bolt /> <span className="font-semibold text-slate-500">Free Plate Check</span>
        </span>
      </div>

      <div className="p-5">
        {/* reg input */}
        <form onSubmit={check} className="flex gap-2">
          <div className="flex flex-1 overflow-hidden rounded-lg border-2 border-slate-900">
            <span className="flex items-center bg-[#2563eb] px-2 font-mono text-xs font-bold text-white">UK</span>
            <input
              value={reg}
              onChange={(e) => {
                setReg(e.target.value.toUpperCase());
                if (status !== "idle") setStatus("idle");
              }}
              placeholder="ENTER REG"
              aria-label="Vehicle registration"
              className="w-full bg-[#fbbf24] px-3 py-2.5 font-mono text-lg font-bold tracking-widest text-slate-900 placeholder:text-slate-700/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading" || !reg.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: CM }}
          >
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
          </button>
        </form>

        {status === "error" && <p className="mt-3 text-sm text-red-600">{errMsg}</p>}

        {/* live results — shown IN the widget, no redirect */}
        {status === "done" && view && (
          <div className="mt-4">
            <p className="text-sm font-bold text-slate-900">{view.vehicle}</p>
            <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
              <Row Icon={Calendar} label="MOT" value={view.mot.value} sub={view.mot.sub} tone={view.mot.tone} />
              <Row Icon={Receipt} label="Tax" value={view.tax.value} tone={view.tax.tone} />
              <Row Icon={Gauge} label="Mileage" value={view.mileage} sub={view.mileage !== "—" ? "latest MOT" : undefined} tone="neutral" />
              <Row Icon={AlertTriangle} label="Advisories" value={view.advisories} tone={view.needsLook ? "warn" : "ok"} />
            </div>

            {/* CTAs → ClickMechanic's OWN services */}
            <div className="mt-4 space-y-2">
              <a
                href="#"
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: CM }}
              >
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {view.mot.due ? "MOT due soon — book your MOT" : "Book an MOT or service"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50"
                style={{ borderColor: `${CM}40`, color: CM }}
              >
                <span className="inline-flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  {view.needsLook ? "Advisory found — get it checked" : "Book a pre-purchase inspection"}
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

        {status === "idle" && (
          <p className="mt-3 text-center text-xs text-slate-400">Enter any UK reg for a free instant check.</p>
        )}
      </div>
    </div>
  );
}
