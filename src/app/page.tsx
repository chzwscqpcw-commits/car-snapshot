"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Fuel,
  Gauge,
  Calendar,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Share2,
  RotateCcw,
  Search,
  Bell,
  ExternalLink,
  CheckSquare,
  Square,
  Zap,
} from "lucide-react";

type VehicleData = {
  registrationNumber: string;
  make?: string;
  model?: string;
  colour?: string;
  fuelType?: string;
  engineCapacity?: number;
  yearOfManufacture?: number;
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
  monthOfFirstRegistration?: string;
  dateOfFirstRegistration?: string;
  dateOfLastV5CIssued?: string;
  markedForExport?: boolean;
  co2Emissions?: number;
  euroStatus?: string;
  realDrivingEmissions?: number;
  wheelplan?: string;
  revenueWeight?: number;
  typeApproval?: string;
  automatedVehicle?: boolean;
  additionalRateEndDate?: string;
};

type LookupResponse =
  | {
      ok: true;
      data: VehicleData;
      source: string;
      cached: boolean;
      vrmHash?: string | null;
    }
  | {
      ok: false;
      error: string;
    };

type InsightTone = "good" | "warn" | "risk" | "info";
type Insight = { tone: InsightTone; title: string; detail: string };

function cleanReg(s: string) {
  return s.replace(/\s+/g, "").toUpperCase();
}

function looksLikeEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

function formatDate(iso?: string) {
  return iso ? iso : "—";
}

function parseISODate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysSince(iso?: string) {
  const d = parseISODate(iso);
  if (!d) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function addYearsToYearMonth(ym: string, years: number) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!year || !month) return null;
  const outYear = year + years;
  const outMonth = String(month).padStart(2, "0");
  return `${outYear}-${outMonth}`;
}

function extractEuroNumber(euroStatus?: string) {
  if (!euroStatus) return null;
  const m = /EURO\s*([0-9]+)/i.exec(euroStatus);
  return m ? Number(m[1]) : null;
}

// Loading animation component
function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* Animated search/car icon */}
      <div className="relative w-16 h-16">
        <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="140" strokeLinecap="round" />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <Search className="absolute inset-0 w-8 h-8 m-auto text-blue-400 animate-pulse" />
      </div>
      
      {/* Loading text */}
      <div className="text-center">
        <p className="text-slate-300 font-medium">Fetching from DVLA</p>
        <p className="text-xs text-slate-500 mt-1">Retrieving vehicle details...</p>
      </div>
      
      {/* Progress dots */}
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg w-2/3"></div>
      <div className="space-y-3">
        <div className="h-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg"></div>
        <div className="h-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg"></div>
        <div className="h-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg"></div>
        <div className="h-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg"></div>
        <div className="h-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg"></div>
      </div>
    </div>
  );
}

// Animated data reveal component
function DataReveal({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  return (
    <div
      className="animate-fadeInUp opacity-0"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards",
      }}
    >
      {children}
    </div>
  );
}

// Icon badge for vehicle attributes
function IconBadge({ icon: Icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="text-slate-400">{Icon}</div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold text-slate-100 text-center">{value}</div>
    </div>
  );
}

// Insight card with color-coded tone
function InsightCard({ insight, delay = 0 }: { insight: Insight; delay?: number }) {
  const toneStyles = {
    good: "border-emerald-900/40 bg-emerald-950/40 text-emerald-100",
    warn: "border-amber-900/40 bg-amber-950/40 text-amber-100",
    risk: "border-red-900/40 bg-red-950/40 text-red-100",
    info: "border-blue-900/40 bg-blue-950/40 text-blue-100",
  };

  const toneIcons = {
    good: <CheckCircle2 className="w-5 h-5" />,
    warn: <AlertTriangle className="w-5 h-5" />,
    risk: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <DataReveal delay={delay}>
      <div className={`border rounded-lg p-4 flex gap-3 transition-all hover:border-opacity-100 ${toneStyles[insight.tone]}`}>
        <div className="flex-shrink-0 mt-0.5">{toneIcons[insight.tone]}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
          <p className="text-sm opacity-90">{insight.detail}</p>
        </div>
      </div>
    </DataReveal>
  );
}

export default function Home() {
  const [vrm, setVrm] = useState("");
  const [data, setData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [email, setEmail] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMsg, setSignupMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const checklist = useMemo((): string[] => {
    const baseItems = [
      "Ask for full service history and receipts.",
      "Confirm the VIN on the car matches the V5C/logbook.",
      "Check tyres (tread + uneven wear) and look for warning lights.",
    ];

    // Only add MOT item if vehicle is 3+ years old AND MOT is not valid/missing
    if (data && data.yearOfManufacture) {
      let isOver3Years = false;
      
      // If we have month of first registration, use it for accuracy
      if (data.monthOfFirstRegistration) {
        const [regYear, regMonth] = data.monthOfFirstRegistration.split("-");
        const regDate = new Date(parseInt(regYear), parseInt(regMonth) - 1);
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
        isOver3Years = regDate <= threeYearsAgo;
      } else {
        // Fallback: only count it as 3+ if it's from previous years
        const currentYear = new Date().getFullYear();
        isOver3Years = currentYear - data.yearOfManufacture > 3;
      }
      
      // Only warn about MOT if car is 3+ years old AND MOT is not valid
      if (isOver3Years && (!data.motStatus || data.motStatus.toLowerCase() !== "valid")) {
        baseItems.push("MOT is not shown as valid: clarify why before viewing.");
      }
    }

    return baseItems;
  }, [data?.yearOfManufacture, data?.monthOfFirstRegistration, data?.motStatus]);

  const insights = useMemo((): Insight[] => {
    if (!data) return [];

    const result: Insight[] = [];

    const yearOfCar = data.yearOfManufacture;
    let isUnder3Years = false;
    
    if (yearOfCar) {
      // If we have month of first registration, use it for accuracy
      if (data.monthOfFirstRegistration) {
        const [regYear, regMonth] = data.monthOfFirstRegistration.split("-");
        const regDate = new Date(parseInt(regYear), parseInt(regMonth) - 1);
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
        isUnder3Years = regDate > threeYearsAgo;
      } else {
        // Fallback: be conservative, count as under 3 only if same year or next year
        const currentYear = new Date().getFullYear();
        isUnder3Years = currentYear - yearOfCar <= 3;
      }
      
      if (isUnder3Years) {
        result.push({
          tone: "good",
          title: "Under 3 years old — no MOT required yet",
          detail: `First MOT due around ${addYearsToYearMonth(data.monthOfFirstRegistration ?? "", 3) ?? "?"} (month/year only—check V5C for exact date).`,
        });
      }
    }

    const euroNum = extractEuroNumber(data.euroStatus);
    if (euroNum && euroNum >= 6) {
      result.push({
        tone: "good",
        title: "Likely ULEZ / Clean Air compliant (London)",
        detail: `Euro ${euroNum} petrol usually meets the standard—still verify on the TfL checker.`,
      });
    }

    const taxDays = daysSince(data.taxDueDate);
    if (taxDays !== null) {
      if (taxDays > 0) {
        result.push({
          tone: "risk",
          title: "Tax is overdue",
          detail: `Tax expired ${taxDays} days ago. Verify with seller before viewing.`,
        });
      } else if (taxDays > -30) {
        result.push({
          tone: "warn",
          title: "Tax expiring soon",
          detail: `Renewal due in ${Math.abs(taxDays)} days. Factor in cost if you buy.`,
        });
      }
    }

    // Only check MOT if vehicle is 3+ years old
    if (!isUnder3Years) {
      const motDays = daysSince(data.motExpiryDate);
      if (motDays !== null) {
        if (motDays > 0) {
          result.push({
            tone: "risk",
            title: "MOT is overdue",
            detail: `MOT expired ${motDays} days ago. Not legal to drive. Clarify repair costs.`,
          });
        } else if (motDays > -60) {
          result.push({
            tone: "warn",
            title: "MOT expiring soon",
            detail: `Renewal due in ${Math.abs(motDays)} days. Check MOT history for failures.`,
          });
        }
      }
    }

    if (!result.length) {
      result.push({
        tone: "info",
        title: "No immediate flags",
        detail: "Tax and MOT look fine. Always verify details with the seller and official documents.",
      });
    }

    return result;
  }, [data]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  }

  async function handleLookup() {
    const cleanedReg = cleanReg(vrm);
    if (!cleanedReg) {
      setError("Please enter a registration number.");
      return;
    }

    setError(null);
    setData(null);
    setLoading(true);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm: cleanedReg }),
      });

      const json = (await res.json()) as LookupResponse;

      if (!json.ok) {
        setError(json.error);
        return;
      }

      setData(json.data);
      setCheckedItems(new Set());
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "Could not complete lookup.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    if (!looksLikeEmail(email)) {
      setSignupMsg("Please enter a valid email.");
      return;
    }

    setSignupLoading(true);
    setSignupMsg("");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          taxDueDate: data?.taxDueDate ?? null,
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        setSignupMsg(json?.error || "Could not save email.");
        return;
      }

      if (json?.status === "updated") {
        setSignupMsg("You're already on the list.");
      } else {
        setSignupMsg("Saved. We'll keep you posted.");
      }

      setEmail("");
    } catch (err: any) {
      setSignupMsg(err?.message ? String(err.message) : "Could not save email.");
    } finally {
      setSignupLoading(false);
    }
  }

  function copyShareLink() {
    try {
      const url = window.location.origin;
      const text = `UK Car Snapshot — DVLA basics + buying checklist.\n${url}\nTip: check tax/MOT before you view a car.`;
      navigator.clipboard.writeText(text);
      showToast("Copied share text to clipboard.");
    } catch {
      showToast("Couldn't copy automatically. You can share this page URL from your browser.");
    }
  }

  function openMotHistoryPrefilled() {
    if (!data?.registrationNumber) return;
    const reg = cleanReg(data.registrationNumber);
    const url = `https://www.check-mot.service.gov.uk/results?registration=${encodeURIComponent(reg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function openTflWithCopiedReg() {
    const reg = cleanReg(data?.registrationNumber ?? "");
    if (!reg) return;
    window.open("https://tfl.gov.uk/modes/driving/check-your-vehicle/", "_blank", "noopener,noreferrer");

    try {
      await navigator.clipboard.writeText(reg);
      showToast(`Copied ${reg} to clipboard. Paste it in the TfL checker.`);
    } catch {
      showToast(`Couldn't auto-copy. Your reg is: ${reg}`);
    }
  }

  function toggleChecklistItem(index: number) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  const completedCount = checkedItems.size;
  const totalCount = checklist.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {/* Road lines */}
          <defs>
            <pattern id="roadLines" x="0" y="0" width="200" height="600" patternUnits="userSpaceOnUse">
              <line x1="100" y1="0" x2="100" y2="600" stroke="#fff" strokeWidth="2" strokeDasharray="40,20" />
            </pattern>
          </defs>
          <rect width="1200" height="800" fill="url(#roadLines)" />
          
          {/* Car silhouettes - scattered */}
          <g opacity="0.15">
            <text x="100" y="150" fontSize="120" fill="#fff">🚗</text>
            <text x="900" y="300" fontSize="140" fill="#fff">🚙</text>
            <text x="400" y="650" fontSize="110" fill="#fff">🚕</text>
            <text x="1000" y="600" fontSize="100" fill="#fff">🚗</text>
          </g>
        </svg>
      </div>

      {/* Gradient overlays for depth */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-cyan-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>

      <div className="mx-auto w-full max-w-3xl px-5 sm:px-7 py-8 sm:py-12 safe-area-inset relative z-10">
        {/* HEADER WITH BRAND */}
        <header className="mb-10 sm:mb-12">
          <div className="flex items-baseline gap-2 mb-4">
            <Zap className="w-6 h-6 text-blue-400" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Car Snapshot
            </h1>
          </div>
          <p className="text-slate-300 text-lg font-medium">Vehicle basics + buying checklist</p>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xl">
            Privacy first. Registration numbers stay private—we don't store them in URLs and use hashing to protect your lookups.
          </p>
        </header>

        {/* SEARCH SECTION */}
        <div className="mb-10 sm:mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="E.g. P7 SJG"
                value={vrm}
                onChange={(e) => {
                  setVrm(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLookup();
                }}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={loading}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all transform active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Look up
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-950/40 border border-red-900/40 rounded-lg text-red-100 text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* RESULTS SECTION */}
        {loading && (
          <div className="mb-10">
            <LoadingAnimation />
          </div>
        )}

        {data && !loading && (
          <>
            {/* VEHICLE HEADER */}
            <DataReveal delay={0}>
              <div className="mb-8 p-6 bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 rounded-lg backdrop-blur">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                      {data.make} {data.model && `${data.model}`} — {data.registrationNumber}
                    </h2>
                    <p className="text-sm text-slate-400">DVLA data • {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyShareLink}
                      className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setData(null);
                        setVrm("");
                        setCheckedItems(new Set());
                      }}
                      className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      title="New lookup"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* KEY INSIGHTS */}
                <div className="space-y-2">
                  {insights.slice(0, 2).map((insight, idx) => (
                    <InsightCard key={idx} insight={insight} delay={idx * 100} />
                  ))}
                </div>
              </div>
            </DataReveal>

            {/* VEHICLE SPECS GRID */}
            <DataReveal delay={100}>
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">Vehicle Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <IconBadge
                    icon={<Calendar className="w-5 h-5" />}
                    label="Year"
                    value={String(data.yearOfManufacture ?? "—")}
                  />
                  <IconBadge icon={<Fuel className="w-5 h-5" />} label="Fuel" value={data.fuelType ?? "—"} />
                  <IconBadge
                    icon={<Gauge className="w-5 h-5" />}
                    label="Engine"
                    value={`${data.engineCapacity ?? "—"} cc`}
                  />
                  <IconBadge icon={<div>🎨</div>} label="Colour" value={data.colour ?? "—"} />
                </div>
              </div>
            </DataReveal>

            {/* TAX & MOT STATUS */}
            <DataReveal delay={200}>
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tax Status</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-100 mb-1">{data.taxStatus ?? "—"}</p>
                  <p className="text-sm text-slate-400">Due: {formatDate(data.taxDueDate)}</p>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">MOT Status</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-100 mb-1">{data.motStatus ?? "—"}</p>
                  <p className="text-sm text-slate-400">Expires: {formatDate(data.motExpiryDate)}</p>
                </div>
              </div>
            </DataReveal>

            {/* ALL INSIGHTS */}
            {insights.length > 2 && (
              <DataReveal delay={300}>
                <div className="mb-8 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">More Insights</h3>
                  {insights.slice(2).map((insight, idx) => (
                    <InsightCard key={idx} insight={insight} delay={idx * 100} />
                  ))}
                </div>
              </DataReveal>
            )}

            {/* NEXT STEPS */}
            <DataReveal delay={400}>
              <div className="mb-8 p-6 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  Next Steps
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={openMotHistoryPrefilled}
                    className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-all group"
                  >
                    <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                      Check MOT history
                      <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-slate-400">Past failures + advisories</p>
                  </button>

                  <button
                    onClick={openTflWithCopiedReg}
                    className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-all group"
                  >
                    <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                      Check ULEZ / Clean Air
                      <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-slate-400">TfL checker + copy reg</p>
                  </button>

                  <button
                    onClick={() => setExpandedSection(expandedSection === "report" ? null : "report")}
                    className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-all group"
                  >
                    <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                      Full history report
                      <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-slate-400">Coming soon</p>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-4">Opens official sites in a new tab.</p>
              </div>
            </DataReveal>

            {/* BUYING CHECKLIST */}
            <DataReveal delay={500}>
              <div className="mb-8 p-6 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                    Buying Checklist
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {completedCount}/{totalCount}
                  </span>
                </div>

                <div className="space-y-2">
                  {checklist.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleChecklistItem(idx)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors text-left group"
                    >
                      {checkedItems.has(idx) ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5 group-hover:text-slate-500" />
                      )}
                      <span
                        className={`text-sm flex-1 ${
                          checkedItems.has(idx) ? "text-slate-400 line-through" : "text-slate-200"
                        }`}
                      >
                        {item}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </DataReveal>
          </>
        )}

        {/* EMAIL SIGNUP */}
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg backdrop-blur">
          <h3 className="text-lg font-semibold text-slate-100 mb-2 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Get Updates
          </h3>
          <p className="text-sm text-slate-300 mb-4">
            Leave your email for new features: MOT alerts, tax reminders, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSignup();
              }}
              className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleSignup}
              disabled={signupLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-all whitespace-nowrap disabled:cursor-not-allowed"
            >
              {signupLoading ? "Saving..." : "Notify me"}
            </button>
          </div>
          {signupMsg && <p className="mt-2 text-sm text-blue-200">{signupMsg}</p>}
        </div>

        {/* FOOTER */}
        <footer className="mt-12 pt-8 border-t border-slate-700/50 text-center text-xs text-slate-500">
          <p>
            Built with DVLA vehicle data. Always verify details with the seller and official documents.
          </p>
          <p className="mt-2">Privacy: registration numbers are hashed—we don't store or identify owners.</p>
        </footer>

        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 max-w-sm p-4 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm shadow-lg animate-fadeInUp">
            {toastMsg}
          </div>
        )}
      </div>
    </main>
  );
}
