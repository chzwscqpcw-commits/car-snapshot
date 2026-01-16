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
  Share,
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
  variant?: string;
  motTests?: Array<{
    completedDate: string;
    testResult: "PASSED" | "FAILED" | "NO DETAILS HELD";
    expiryDate?: string;
    odometer?: {
      value: number;
      unit: string;
    };
    motTestNumber?: string;
    rfrAndComments?: Array<{
      text: string;
      type: "COMMENT" | "DEFECT" | "ADVISORY";
    }>;
  }>;
  motTestsLastUpdated?: string;
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
  if (!iso) return "—";
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
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

function daysUntil(iso?: string) {
  const d = parseISODate(iso);
  if (!d) return null;
  const diff = d.getTime() - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getTaxStatusColor(taxStatus?: string, taxDueDate?: string) {
  if (!taxStatus) return "slate";
  if (taxStatus === "Taxed") {
    const days = daysUntil(taxDueDate);
    if (days === null || days > 30) return "emerald"; // Green - good
    if (days > 0) return "amber"; // Amber - warning
    return "red"; // Red - overdue
  }
  if (taxStatus === "Not Taxed") return "red";
  if (taxStatus === "SORN") return "slate"; // SORN = Statutory Off Road Notification
  return "slate";
}

function getMotStatusColor(motStatus?: string, motExpiryDate?: string) {
  if (!motStatus) return "slate";
  if (motStatus === "Valid") {
    const days = daysUntil(motExpiryDate);
    if (days === null || days > 30) return "emerald"; // Green - good
    if (days > 0) return "amber"; // Amber - warning
    return "red"; // Red - expired
  }
  if (motStatus === "Expired") return "red";
  return "slate";
}

function getMotTestResultColor(result?: string): "emerald" | "red" | "slate" {
  if (result === "PASSED") return "emerald";
  if (result === "FAILED") return "red";
  return "slate";
}

function getStatusBgClass(color: string) {
  const bgMap: { [key: string]: string } = {
    emerald: "bg-emerald-950/40 border-emerald-900/40",
    amber: "bg-amber-950/40 border-amber-900/40",
    red: "bg-red-950/40 border-red-900/40",
    slate: "bg-slate-800/50 border-slate-700/50",
  };
  return `border ${bgMap[color] || bgMap.slate}`;
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

// ============================================
// AFFILIATE LINKS CONFIGURATION
// ============================================
// Update these URLs with your AWIN tracking links once approved
const AFFILIATE_LINKS = {
  goCompare: "https://www.awin1.com/cread.php?awinmid=XXXX&awinaffid=XXXX&ued=https%3A%2F%2Fwww.gocompare.com%2Fcar-insurance%2F",
  hpiCheck: "https://www.hpicheck.com/?utm_source=carsnapshot",
  carmoola: "https://www.awin1.com/cread.php?awinmid=XXXX&awinaffid=XXXX&ued=https%3A%2F%2Fwww.carmoola.com%2F",
  racBreakdown: "https://www.awin1.com/cread.php?awinmid=XXXX&awinaffid=XXXX&ued=https%3A%2F%2Fwww.rac.co.uk%2Fbreakdown-cover",
};

export default function Home() {
  const [vrm, setVrm] = useState("");
  const [data, setData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [checklistRole, setChecklistRole] = useState<"owner" | "buyer" | "seller">("owner");
  const [expandedMotTests, setExpandedMotTests] = useState<Set<number>>(new Set());
  const [showAllMotTests, setShowAllMotTests] = useState(false);
  const [email, setEmail] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMsg, setSignupMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [recentLookups, setRecentLookups] = useState<string[]>([]);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<(VehicleData & { savedAt: number })[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [myVehicles, setMyVehicles] = useState<(VehicleData & { addedAt: number })[]>([]);
  const [showFeatureHelp, setShowFeatureHelp] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareReg1, setCompareReg1] = useState<string>("");
  const [compareReg2, setCompareReg2] = useState<string>("");
  const [compareData1, setCompareData1] = useState<VehicleData | null>(null);
  const [compareData2, setCompareData2] = useState<VehicleData | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [insuranceModalVrm, setInsuranceModalVrm] = useState<string>("");
  const [insuranceModalDate, setInsuranceModalDate] = useState<string>("");
  const [vehicleInsuranceDates, setVehicleInsuranceDates] = useState<{ [key: string]: string }>({});

  // Load insurance dates from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("carSnapshotInsuranceDates");
        if (stored) {
          setVehicleInsuranceDates(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load insurance dates:", err);
      }
    }
  }, []);

  // Save insurance dates to localStorage whenever they change
  const saveInsuranceDate = (vrm: string, date: string) => {
    const updated = { ...vehicleInsuranceDates, [vrm]: date };
    setVehicleInsuranceDates(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("carSnapshotInsuranceDates", JSON.stringify(updated));
    }
  };

  const handleInsuranceModalOpen = (vrm: string) => {
    setInsuranceModalVrm(vrm);
    setInsuranceModalDate(vehicleInsuranceDates[vrm] || "");
    setInsuranceModalOpen(true);
  };

  const handleInsuranceModalSave = () => {
    if (insuranceModalDate) {
      saveInsuranceDate(insuranceModalVrm, insuranceModalDate);
    }
    setInsuranceModalOpen(false);
  };

  // Load recent lookups from localStorage on mount
  // Set browser title
  useEffect(() => {
    document.title = "CarScans - UK Vehicle Lookup";
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("carSnapshotRecent");
        if (stored) {
          setRecentLookups(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load recent lookups:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      loadFavorites();
      loadMyVehicles();
    }
  }, []);

  const checklist = useMemo((): string[] => {
    if (!data) return [];

    // OWNER - Checking their own vehicle
    if (checklistRole === "owner") {
      return [
        "MOT status is valid",
        "Tax status is current",
        "Service history up to date",
        "Insurance is active",
        "Check for recalls",
      ];
    }

    // BUYER - Purchasing a vehicle
    if (checklistRole === "buyer") {
      const items = [
        "Service history verified",
        "VIN matches logbook (V5C)",
        "Tyres: tread and wear acceptable",
        "History check: write-offs, theft, finance",
        "Get pre-purchase mechanic inspection",
        "Arrange new insurance quotes",
        "Check warranty or guarantee",
        "Test drive thoroughly",
      ];
      
      // Add MOT warning if 3+ years old and invalid
      if (data.yearOfManufacture) {
        let isOver3Years = false;
        if (data.monthOfFirstRegistration) {
          const [regYear, regMonth] = data.monthOfFirstRegistration.split("-");
          const regDate = new Date(parseInt(regYear), parseInt(regMonth) - 1);
          const threeYearsAgo = new Date();
          threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
          isOver3Years = regDate <= threeYearsAgo;
        } else {
          const currentYear = new Date().getFullYear();
          isOver3Years = currentYear - data.yearOfManufacture > 3;
        }
        
        if (isOver3Years && (!data.motStatus || data.motStatus.toLowerCase() !== "valid")) {
          items.unshift("MOT valid (car is 3+ years old)");
        }
      }
      
      return items;
    }

    // SELLER - Selling a vehicle
    if (checklistRole === "seller") {
      return [
        "MOT status is current",
        "Tax status is current",
        "Gather service history and receipts",
        "Cancel existing insurance",
        "Verify no outstanding finance",
        "Prepare V5C logbook",
        "Get recent valuation",
        "Take clear photos of vehicle",
      ];
    }

    return [];
  }, [data, checklistRole]);

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

    // CO2 Emissions insight
    if (data.co2Emissions !== undefined && data.co2Emissions !== null) {
      if (data.co2Emissions > 180) {
        result.push({
          tone: "warn",
          title: "Higher CO2 emissions",
          detail: `${data.co2Emissions}g/km is above average. Factor in fuel costs and potential future emission regulations.`,
        });
      } else if (data.co2Emissions < 100) {
        result.push({
          tone: "good",
          title: "Low CO2 emissions",
          detail: `${data.co2Emissions}g/km is eco-friendly. Good fuel economy and lower environmental impact.`,
        });
      }
    }

    // Fuel type insights
    if (data.fuelType) {
      const fuelLower = data.fuelType.toLowerCase();
      if (fuelLower.includes("electric")) {
        result.push({
          tone: "good",
          title: "Electric vehicle — zero emissions",
          detail: "Check charging infrastructure in your area and battery health on older EVs.",
        });
      } else if (fuelLower.includes("hybrid")) {
        result.push({
          tone: "good",
          title: "Hybrid — reduced emissions",
          detail: "Good fuel economy with lower emissions. Verify battery health for older hybrids.",
        });
      } else if (fuelLower.includes("diesel")) {
        result.push({
          tone: "info",
          title: "Diesel vehicle",
          detail: "Check maintenance history — diesel engines need regular servicing. Fuel may be slightly cheaper.",
        });
      }
    }

    // Engine size (displacement) alert
    if (data.engineCapacity && data.engineCapacity > 2000) {
      result.push({
        tone: "warn",
        title: "Large engine — higher running costs",
        detail: `${data.engineCapacity}cc engine uses more fuel. Check tax band and insurance quotes.`,
      });
    }

    // Vehicle age and maintenance milestone
    if (data.yearOfManufacture) {
      const age = new Date().getFullYear() - data.yearOfManufacture;
      if (age >= 5 && age < 10) {
        result.push({
          tone: "info",
          title: "5+ year service milestone",
          detail: "Check if a major 5-year service has been completed. Ask seller for full service history.",
        });
      } else if (age >= 10) {
        result.push({
          tone: "warn",
          title: "10+ years old — major maintenance expected",
          detail: "Budget for upcoming maintenance. Get a pre-purchase inspection and check service history carefully.",
        });
      }
    }

    return result;
  }, [data]);

  async function loadComparisonData() {
    if (!compareReg1 || !compareReg2) {
      setError("Please select two vehicles to compare.");
      return;
    }

    if (compareReg1 === compareReg2) {
      setError("Please select two different vehicles.");
      return;
    }

    setCompareLoading(true);
    setError(null);

    try {
      // Fetch both vehicles in parallel
      const [res1, res2] = await Promise.all([
        fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vrm: compareReg1 }),
        }),
        fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vrm: compareReg2 }),
        }),
      ]);

      const json1 = (await res1.json()) as LookupResponse;
      const json2 = (await res2.json()) as LookupResponse;

      // Check if both responses are successful
      if (!json1.ok) {
        setError(`Vehicle 1 error: ${json1.error}`);
        return;
      }
      
      if (!json2.ok) {
        setError(`Vehicle 2 error: ${json2.error}`);
        return;
      }

      setCompareData1(json1.data);
      setCompareData2(json2.data);
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "Could not load comparison data.");
    } finally {
      setCompareLoading(false);
    }
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  }

  // Extract core lookup logic so it can be called with a registration directly
  async function performLookup(cleanedReg: string, skipCache: boolean = false) {
    if (!cleanedReg) {
      setError("Please enter a registration number.");
      return;
    }

    setError(null);
    setData(null);
    setLoading(true);
    setVrm(cleanedReg);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm: cleanedReg, skipCache }),
      });

      const json = (await res.json()) as LookupResponse;

      if (!json.ok) {
        setError(json.error);
        return;
      }

      setData(json.data);
      setCheckedItems(new Set());

      // Save to recent lookups (localStorage)
      if (typeof window !== "undefined") {
        try {
          const updated = [cleanedReg, ...recentLookups.filter((r) => r !== cleanedReg)].slice(0, 5);
          localStorage.setItem("carSnapshotRecent", JSON.stringify(updated));
          setRecentLookups(updated);
        } catch (err) {
          console.error("Failed to save recent lookup:", err);
        }
      }
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "Could not complete lookup.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLookup() {
    let inputVrm = vrm.trim();
    let skipCache = false;

    // Check for * prefix to skip cache
    if (inputVrm.startsWith("*")) {
      skipCache = true;
      inputVrm = inputVrm.substring(1).trim();
    }

    const cleanedReg = cleanReg(inputVrm);
    performLookup(cleanedReg, skipCache);
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

  function generateShareText() {
    if (!data) return "";
    
    const year = data.yearOfManufacture || 0;
    const make = data.make || "Unknown";
    const model = data.model || "";
    const reg = data.registrationNumber || "";
    const fuelType = data.fuelType || "Unknown";
    const taxStatus = data.taxStatus || "Unknown";
    const motStatus = data.motStatus || "Unknown";
    const colour = data.colour || "Unknown";
    const engine = data.engineCapacity ? `${data.engineCapacity}cc` : "Unknown";
    const co2 = data.co2Emissions ? `${data.co2Emissions}g/km` : "N/A";
    const euroStatus = data.euroStatus || "Unknown";
    const taxDueDate = data.taxDueDate ? formatDate(data.taxDueDate) : "Unknown";
    const motExpiryDate = data.motExpiryDate ? formatDate(data.motExpiryDate) : "N/A";
    const firstRegDate = data.dateOfFirstRegistration ? formatDate(data.dateOfFirstRegistration) : (data.monthOfFirstRegistration || "Unknown");
    
    // Calculate vehicle age
    const currentYear = new Date().getFullYear();
    const age = year > 0 ? currentYear - year : 0;
    const ageText = year > 0 ? `${age} years old` : "Unknown age";
    const yearDisplay = year > 0 ? year : "Unknown";
    
    return `🚗 ${make} ${model} (${yearDisplay}) — ${reg}
${ageText}

━━━━━━━━━━━━━━━━━━━━━━━━
📋 VEHICLE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━

Colour: ${colour}
Fuel Type: ${fuelType}
Engine: ${engine}
CO2 Emissions: ${co2}
Euro Status: ${euroStatus}
First Registered: ${firstRegDate}

━━━━━━━━━━━━━━━━━━━━━━━━
✅ COMPLIANCE STATUS
━━━━━━━━━━━━━━━━━━━━━━━━

Tax: ${taxStatus}
Tax Due: ${taxDueDate}
MOT: ${motStatus}
MOT Expires: ${motExpiryDate}

━━━━━━━━━━━━━━━━━━━━━━━━
📍 TOOL & LINK
━━━━━━━━━━━━━━━━━━━━━━━━

Checked with: CarScans
Full details: ${window.location.origin}

Get your own vehicle check at CarScans!`;
  }

  function copyShareLink() {
    try {
      const text = generateShareText();
      navigator.clipboard.writeText(text);
      showToast("Vehicle details copied to clipboard.");
    } catch {
      showToast("Couldn't copy automatically. You can share this page URL from your browser.");
    }
  }

  function shareViaEmail() {
    if (!data) return;
    const subject = `Check out this car: ${data.make} ${data.model || ""} ${data.registrationNumber}`;
    const body = encodeURIComponent(generateShareText());
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
  }

  function shareViaWhatsapp() {
    if (!data) return;
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function shareViaFacebook() {
    if (!data) return;
    const url = window.location.origin;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
  }

  function loadFavorites() {
    const stored = localStorage.getItem("car-snapshot-favorites");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error("Failed to load favorites:", e);
      }
    }
  }

  function saveFavoritesToStorage(faves: (VehicleData & { savedAt: number })[]) {
    try {
      localStorage.setItem("car-snapshot-favorites", JSON.stringify(faves));
    } catch (e) {
      console.error("Failed to save favorites:", e);
      showToast("Could not save favorite (storage full?)");
    }
  }

  function addFavorite() {
    if (!data) return;
    const favorite = { ...data, savedAt: Date.now() };
    const updated = [favorite, ...favorites.filter(f => f.registrationNumber !== data.registrationNumber)];
    setFavorites(updated);
    saveFavoritesToStorage(updated);
    showToast("Added to favorites ❤️");
  }

  function removeFavorite(registrationNumber: string) {
    const updated = favorites.filter(f => f.registrationNumber !== registrationNumber);
    setFavorites(updated);
    saveFavoritesToStorage(updated);
    showToast("Removed from favorites");
  }

  function isFavorited(registrationNumber: string): boolean {
    return favorites.some(f => f.registrationNumber === registrationNumber);
  }

  function clearAllFavorites() {
    if (favorites.length === 0) return;
    if (window.confirm(`Remove all ${favorites.length} favorite(s)?`)) {
      setFavorites([]);
      saveFavoritesToStorage([]);
      showToast("Favorites cleared");
    }
  }

  function loadMyVehicles() {
    const stored = localStorage.getItem("car-snapshot-my-vehicles");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMyVehicles(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error("Failed to load my vehicles:", e);
      }
    }
  }

  function saveMyVehiclesToStorage(vehicles: (VehicleData & { addedAt: number })[]) {
    try {
      localStorage.setItem("car-snapshot-my-vehicles", JSON.stringify(vehicles));
    } catch (e) {
      console.error("Failed to save my vehicles:", e);
      showToast("Could not save vehicle (storage full?)");
    }
  }

  function addToMyVehicles() {
    if (!data) return;
    const vehicle = { ...data, addedAt: Date.now() };
    const updated = [vehicle, ...myVehicles.filter(v => v.registrationNumber !== data.registrationNumber)];
    setMyVehicles(updated);
    saveMyVehiclesToStorage(updated);
    showToast("Added to My Vehicles ✓");
  }

  function removeFromMyVehicles(registrationNumber: string) {
    const updated = myVehicles.filter(v => v.registrationNumber !== registrationNumber);
    setMyVehicles(updated);
    saveMyVehiclesToStorage(updated);
    showToast("Removed from My Vehicles");
  }

  function isMyVehicle(registrationNumber: string): boolean {
    return myVehicles.some(v => v.registrationNumber === registrationNumber);
  }

  function generateCalendarFile() {
    if (myVehicles.length === 0) {
      showToast("Add vehicles first using the 'This is my car' button");
      return;
    }

    // Create calendar with proper .ics format
    const now = new Date();
    const dtstamp = now.toISOString().replace(/[-:.]/g, "").split("Z")[0] + "Z";

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CarScans//CarScans//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:CarScans - MOT, Tax & Insurance Reminders
X-WR-TIMEZONE:UTC
X-WR-CALDESC:MOT, Tax and Insurance renewal reminders for your vehicles
BEGIN:VTIMEZONE
TZID:UTC
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
TZNAME:UTC
END:STANDARD
END:VTIMEZONE
`;

    myVehicles.forEach((vehicle) => {
      // MOT event
      if (vehicle.motExpiryDate) {
        const motDate = vehicle.motExpiryDate; // Format: YYYY-MM or YYYY-MM-DD
        if (motDate && motDate.length >= 7) {
          // Parse date - might be YYYY-MM or YYYY-MM-DD
          let year = motDate.substring(0, 4);
          let month = motDate.substring(5, 7);
          let day = motDate.length > 7 ? motDate.substring(8, 10) : "01";
          
          const dateStr = `${year}${month}${day}`;
          const nextDayNum = parseInt(day) + 1;
          const nextDay = nextDayNum < 10 ? `0${nextDayNum}` : String(nextDayNum);
          const nextDateStr = `${year}${month}${nextDay}`;

          icsContent += `BEGIN:VEVENT
UID:car-snapshot-mot-${vehicle.registrationNumber}-${year}-${month}@carsnapshot.app
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${nextDateStr}
SUMMARY:MOT Due - ${vehicle.registrationNumber} (${vehicle.make})
DESCRIPTION:MOT expires for ${vehicle.make} ${vehicle.model || ""} (${vehicle.registrationNumber})
SEQUENCE:0
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
`;
        }
      }

      // Tax event
      if (vehicle.taxDueDate) {
        const taxDate = vehicle.taxDueDate; // Format: YYYY-MM-DD
        if (taxDate && taxDate.length >= 7) {
          // Parse date
          let year = taxDate.substring(0, 4);
          let month = taxDate.substring(5, 7);
          let day = taxDate.length > 7 ? taxDate.substring(8, 10) : "01";
          
          const dateStr = `${year}${month}${day}`;
          const nextDayNum = parseInt(day) + 1;
          const nextDay = nextDayNum < 10 ? `0${nextDayNum}` : String(nextDayNum);
          const nextDateStr = `${year}${month}${nextDay}`;

          icsContent += `BEGIN:VEVENT
UID:car-snapshot-tax-${vehicle.registrationNumber}-${year}-${month}@carsnapshot.app
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${nextDateStr}
SUMMARY:Tax Due - ${vehicle.registrationNumber} (${vehicle.make})
DESCRIPTION:Vehicle tax expires for ${vehicle.make} ${vehicle.model || ""} (${vehicle.registrationNumber})
SEQUENCE:0
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
`;
        }
      }

      // Insurance Renewal event (7-day window: 27-20 days before expiry)
      const insuranceDate = vehicleInsuranceDates[vehicle.registrationNumber];
      if (insuranceDate && insuranceDate.length >= 10) {
        const insuranceExpiry = new Date(insuranceDate);
        const renewalWindowStart = new Date(insuranceExpiry);
        renewalWindowStart.setDate(renewalWindowStart.getDate() - 27); // Start 27 days before
        const renewalWindowEnd = new Date(insuranceExpiry);
        renewalWindowEnd.setDate(renewalWindowEnd.getDate() - 19); // End 20 days before (7-day window)

        const startYear = renewalWindowStart.getFullYear();
        const startMonth = String(renewalWindowStart.getMonth() + 1).padStart(2, "0");
        const startDay = String(renewalWindowStart.getDate()).padStart(2, "0");
        const startDateStr = `${startYear}${startMonth}${startDay}`;

        const endYear = renewalWindowEnd.getFullYear();
        const endMonth = String(renewalWindowEnd.getMonth() + 1).padStart(2, "0");
        const endDay = String(renewalWindowEnd.getDate()).padStart(2, "0");
        const endDateStr = `${endYear}${endMonth}${endDay}`;

        icsContent += `BEGIN:VEVENT\nUID:car-snapshot-insurance-${vehicle.registrationNumber}-${startYear}-${startMonth}@carsnapshot.app\nDTSTAMP:${dtstamp}\nDTSTART;VALUE=DATE:${startDateStr}\nDTEND;VALUE=DATE:${endDateStr}\nSUMMARY:Insurance Renewal Window - ${vehicle.registrationNumber} (${vehicle.make})\nDESCRIPTION:Best time to renew your car insurance for ${vehicle.make} ${vehicle.model || ""} (${vehicle.registrationNumber}).\\n\\nSweet Spot: Renew 20-27 days BEFORE your policy expires to get the best rates and coverage options. This 7-day window marks the optimal renewal period.\\n\\nPolicy expires: ${formatDate(insuranceDate)}\nSEQUENCE:0\nSTATUS:CONFIRMED\nTRANSP:TRANSPARENT\nEND:VEVENT\n`;
      }
    });

    icsContent += `END:VCALENDAR`;

    // Download the file
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `car-snapshot-calendar-${new Date().getTime()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Calendar file ready! Import into Outlook, Apple Calendar, or Google Calendar.`);
  }

  function clearAllMyVehicles() {
    if (myVehicles.length === 0) return;
    if (window.confirm(`Remove all ${myVehicles.length} vehicle(s) from My Vehicles?`)) {
      setMyVehicles([]);
      saveMyVehiclesToStorage([]);
      showToast("My Vehicles cleared");
    }
  }

  function downloadTXT() {
    if (!data) return;

    // Create a professional text-based report
    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const checklistTitle = 
      checklistRole === "owner" ? "MY CAR CHECKLIST" :
      checklistRole === "buyer" ? "BUYING CHECKLIST" :
      "SELLING CHECKLIST";

    const reportLines = [
      "╔════════════════════════════════════════════════════════════════╗",
      "║            CAR SNAPSHOT - VEHICLE REPORT                       ║",
      "╚════════════════════════════════════════════════════════════════╝",
      "",
      `Generated: ${formattedDate}`,
      `Registration: ${data.registrationNumber}`,
      "",
      "────────────────────────────────────────────────────────────────",
      "VEHICLE INFORMATION",
      "────────────────────────────────────────────────────────────────",
      "",
      `Make & Model:        ${data.make} ${data.model || ""}`,
      `Year:                ${data.yearOfManufacture || "—"}`,
      `Colour:              ${data.colour || "—"}`,
      "",
      "SPECIFICATIONS",
      "────────────────────────────────────────────────────────────────",
      "",
      `Fuel Type:           ${data.fuelType || "—"}`,
      `Engine Capacity:     ${data.engineCapacity ? `${data.engineCapacity}cc` : "—"}`,
      `CO2 Emissions:       ${data.co2Emissions ? `${data.co2Emissions}g/km` : "—"}`,
      `Euro Status:         ${data.euroStatus || "—"}`,
      "",
      "COMPLIANCE STATUS",
      "────────────────────────────────────────────────────────────────",
      "",
      `Tax Status:          ${data.taxStatus || "—"}`,
      `Tax Due Date:        ${formatDate(data.taxDueDate)}`,
      `MOT Status:          ${data.motStatus || "—"}`,
      `MOT Expiry:          ${formatDate(data.motExpiryDate)}`,
      `First Registered:    ${data.monthOfFirstRegistration || data.dateOfFirstRegistration || "—"}`,
      "",
      "KEY INSIGHTS",
      "────────────────────────────────────────────────────────────────",
      "",
      ...insights.slice(0, 5).map((insight, idx) => [
        `${idx + 1}. ${insight.title}`,
        `   ${insight.detail}`,
        "",
      ]).flat(),
      checklistTitle,
      "────────────────────────────────────────────────────────────────",
      "",
      ...checklist.map((item, idx) => `${idx + 1}. ☐ ${item}`),
      "",
      "═════════════════════════════════════════════════════════════════",
      "",
      "Created with CarScans",
      "https://car-snapshot-stephen-gaisfords-projects.vercel.app",
      "",
      "⚠️  Always verify vehicle details with the seller and official",
      "    documents before making any purchase.",
      "",
      "🔒 Privacy: Registration numbers are hashed and not stored.",
      "═════════════════════════════════════════════════════════════════",
    ];

    const reportContent = reportLines.join("\n");

    // Create blob and download
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Car-Snapshot-${data.registrationNumber}-${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Text report downloaded!");
    setDownloadMenuOpen(false);
  }

  async function downloadPDF() {
    if (!data) return;

    try {
      // Dynamically import jsPDF to keep bundle size small
      const { jsPDF } = await import("jspdf");

      const timestamp = new Date();
      const formattedDate = timestamp.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const checklistTitle = 
        checklistRole === "owner" ? "MY CAR CHECKLIST" :
        checklistRole === "buyer" ? "BUYING CHECKLIST" :
        "SELLING CHECKLIST";

      // Create PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 15;

      // Helper function to add text with wrapping
      const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont(doc.getFont().fontName, isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, pageWidth - 20);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 15) {
            doc.addPage();
            yPosition = 15;
          }
          doc.text(line, 10, yPosition);
          yPosition += 6;
        });
      };

      // Title
      doc.setFontSize(18);
      doc.setFont(doc.getFont().fontName, "bold");
      doc.text("CAR SNAPSHOT", 10, yPosition);
      yPosition += 6;
      doc.setFontSize(14);
      doc.text("Vehicle Report", 10, yPosition);
      yPosition += 10;

      // Generated info
      doc.setFontSize(10);
      doc.setFont(doc.getFont().fontName, "normal");
      doc.text(`Generated: ${formattedDate}`, 10, yPosition);
      yPosition += 5;
      doc.text(`Registration: ${data.registrationNumber}`, 10, yPosition);
      yPosition += 9;

      // Vehicle Information Section
      addText("VEHICLE INFORMATION", 13, true);
      yPosition += 2;
      addText(`Make & Model: ${data.make} ${data.model || ""}`);
      addText(`Year: ${data.yearOfManufacture || "—"}`);
      addText(`Colour: ${data.colour || "—"}`);
      yPosition += 2;

      // Specifications Section
      addText("SPECIFICATIONS", 13, true);
      yPosition += 2;
      addText(`Fuel Type: ${data.fuelType || "—"}`);
      addText(`Engine Capacity: ${data.engineCapacity ? `${data.engineCapacity}cc` : "—"}`);
      addText(`CO2 Emissions: ${data.co2Emissions ? `${data.co2Emissions}g/km` : "—"}`);
      addText(`Euro Status: ${data.euroStatus || "—"}`);
      yPosition += 2;

      // Compliance Status Section
      addText("COMPLIANCE STATUS", 13, true);
      yPosition += 2;
      addText(`Tax Status: ${data.taxStatus || "—"}`);
      addText(`Tax Due Date: ${formatDate(data.taxDueDate)}`);
      addText(`MOT Status: ${data.motStatus || "—"}`);
      addText(`MOT Expiry: ${formatDate(data.motExpiryDate)}`);
      addText(`First Registered: ${data.monthOfFirstRegistration || data.dateOfFirstRegistration || "—"}`);
      yPosition += 2;

      // Key Insights Section
      addText("KEY INSIGHTS", 13, true);
      yPosition += 2;
      insights.slice(0, 3).forEach((insight) => {
        addText(`${insight.title}`, 11, true);
        addText(insight.detail);
        yPosition += 0.5;
      });
      yPosition += 1;

      // Buying Checklist Section
      addText(checklistTitle, 13, true);
      yPosition += 2;
      checklist.forEach((item) => {
        addText(`[ ] ${item}`);
      });

      // Footer
      yPosition += 2;
      doc.setFontSize(9);
      doc.setFont(doc.getFont().fontName, "normal");
      addText("Created with CarScans");
      addText("https://car-snapshot-stephen-gaisfords-projects.vercel.app");
      addText("Always verify vehicle details with the seller and official documents.");
      addText("Privacy: Registration numbers are hashed and not stored.");

      // Save PDF
      doc.save(`Car-Snapshot-${data.registrationNumber}-${timestamp.getTime()}.pdf`);
      showToast("PDF report downloaded!");
      setDownloadMenuOpen(false);
    } catch (error) {
      console.error("PDF generation failed:", error);
      showToast("PDF generation failed. Please try the text version.");
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
              CarScans
            </h1>
          </div>
          <p className="text-slate-300 text-lg font-medium">Look up any UK vehicle instantly. Tax, MOT & checklists for owners, buyers & sellers.</p>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xl">
            Your data is private. We don't store registration numbers or track who you are.
          </p>

          {/* RECENT LOOKUPS - Always visible */}
          {recentLookups.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Recent Lookups</p>
                <button
                  onClick={() => {
                    localStorage.removeItem("carSnapshotRecent");
                    setRecentLookups([]);
                    showToast("History cleared");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentLookups.map((reg, idx) => (
                  <button
                    key={idx}
                    onClick={() => performLookup(reg)}
                    className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 rounded-full text-slate-200 text-sm font-medium transition-all flex items-center gap-2 group"
                  >
                    <RotateCcw className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    {reg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MY FAVORITES - Always visible */}
          {favorites.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">❤️ My Favorites ({favorites.length})</p>
                <button
                  onClick={() => clearAllFavorites()}
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {favorites.map((fav, idx) => (
                  <div key={idx} className="relative group">
                    <button
                      onClick={() => performLookup(fav.registrationNumber)}
                      className="px-3 py-1.5 bg-red-900/30 hover:bg-red-800/40 border border-red-700/50 hover:border-red-600 rounded-full text-red-200 text-sm font-medium transition-all flex items-center gap-2"
                    >
                      {fav.registrationNumber}
                    </button>
                    <button
                      onClick={() => removeFavorite(fav.registrationNumber)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from favorites"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MY VEHICLES - Always visible */}
          {myVehicles.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">✓ My Vehicles ({myVehicles.length})</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => generateCalendarFile()}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    title="Export MOT, Tax and Insurance dates to calendar"
                  >
                    📅 Export Calendar
                  </button>
                  <button
                    onClick={() => clearAllMyVehicles()}
                    className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {myVehicles.map((vehicle, idx) => (
                  <div key={idx} className="p-3 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => performLookup(vehicle.registrationNumber)}
                          className="text-sm font-semibold text-emerald-100 hover:text-emerald-50 transition-colors text-left"
                        >
                          {vehicle.make} {vehicle.model || ""} — {vehicle.registrationNumber}
                        </button>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-emerald-200/70">
                          {vehicle.motExpiryDate && (
                            <span>
                              MOT: {formatDate(vehicle.motExpiryDate)}
                            </span>
                          )}
                          {vehicle.taxDueDate && (
                            <span>
                              Tax: {formatDate(vehicle.taxDueDate)}
                            </span>
                          )}
                          {vehicleInsuranceDates[vehicle.registrationNumber] && (
                            <span>
                              Insurance: {formatDate(vehicleInsuranceDates[vehicle.registrationNumber])}
                            </span>
                          )}
                        </div>
                        {!vehicleInsuranceDates[vehicle.registrationNumber] && (
                          <button
                            onClick={() => handleInsuranceModalOpen(vehicle.registrationNumber)}
                            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            + Add insurance date
                          </button>
                        )}
                        {vehicleInsuranceDates[vehicle.registrationNumber] && (
                          <button
                            onClick={() => handleInsuranceModalOpen(vehicle.registrationNumber)}
                            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            ✏️ Edit insurance
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromMyVehicles(vehicle.registrationNumber)}
                        className="text-xs text-emerald-600 hover:text-emerald-500 transition-colors whitespace-nowrap mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* COMPARISON MODE */}
        {comparisonMode && (
          <div className="mb-10 p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                🔄 Compare Vehicles
              </h2>
              <button
                onClick={() => {
                  setComparisonMode(false);
                  setCompareData1(null);
                  setCompareData2(null);
                  setCompareReg1("");
                  setCompareReg2("");
                }}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Vehicle 1</label>
                <select
                  value={compareReg1}
                  onChange={(e) => setCompareReg1(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a vehicle...</option>
                  {recentLookups.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Vehicle 2</label>
                <select
                  value={compareReg2}
                  onChange={(e) => setCompareReg2(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a vehicle...</option>
                  {recentLookups.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={loadComparisonData}
              disabled={!compareReg1 || !compareReg2 || compareLoading}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {compareLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                "Compare Vehicles"
              )}
            </button>
          </div>
        )}

        {/* COMPARISON RESULTS */}
        {compareData1 && compareData2 && comparisonMode && (
          <div className="mb-10 p-6 bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Vehicle 1 */}
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-4">
                  {compareData1.make} {compareData1.model} — {compareData1.registrationNumber}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Year</span>
                    <span className="font-semibold text-slate-100">{compareData1.yearOfManufacture || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Colour</span>
                    <span className="font-semibold text-slate-100">{compareData1.colour || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Fuel Type</span>
                    <span className="font-semibold text-slate-100">{compareData1.fuelType || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Engine</span>
                    <span className="font-semibold text-slate-100">{compareData1.engineCapacity ? `${compareData1.engineCapacity}cc` : "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">CO2</span>
                    <span className="font-semibold text-slate-100">{compareData1.co2Emissions ? `${compareData1.co2Emissions}g/km` : "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Tax Status</span>
                    <span className="font-semibold text-emerald-300">{compareData1.taxStatus || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Tax Due</span>
                    <span className="font-semibold text-slate-100">{formatDate(compareData1.taxDueDate)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">MOT Status</span>
                    <span className="font-semibold text-slate-100">{compareData1.motStatus || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">MOT Expires</span>
                    <span className="font-semibold text-slate-100">{formatDate(compareData1.motExpiryDate)}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle 2 */}
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-4">
                  {compareData2.make} {compareData2.model} — {compareData2.registrationNumber}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Year</span>
                    <span className="font-semibold text-slate-100">{compareData2.yearOfManufacture || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Colour</span>
                    <span className="font-semibold text-slate-100">{compareData2.colour || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Fuel Type</span>
                    <span className="font-semibold text-slate-100">{compareData2.fuelType || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Engine</span>
                    <span className="font-semibold text-slate-100">{compareData2.engineCapacity ? `${compareData2.engineCapacity}cc` : "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">CO2</span>
                    <span className="font-semibold text-slate-100">{compareData2.co2Emissions ? `${compareData2.co2Emissions}g/km` : "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Tax Status</span>
                    <span className="font-semibold text-emerald-300">{compareData2.taxStatus || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Tax Due</span>
                    <span className="font-semibold text-slate-100">{formatDate(compareData2.taxDueDate)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">MOT Status</span>
                    <span className="font-semibold text-slate-100">{compareData2.motStatus || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">MOT Expires</span>
                    <span className="font-semibold text-slate-100">{formatDate(compareData2.motExpiryDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH SECTION */}
        <div className="mb-10 sm:mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="E.g. AB12 CDE"
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

            {recentLookups.length >= 2 && (
              <button
                onClick={() => {
                  setComparisonMode(!comparisonMode);
                  setCompareData1(null);
                  setCompareData2(null);
                }}
                className="px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                🔄 Compare
              </button>
            )}
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
                  <div className="flex-1">
                    <div className="bg-yellow-300 border-2 border-yellow-800 rounded-sm px-2 py-2 mb-4 inline-flex items-center justify-center">
                      <p className="text-lg font-black text-black tracking-widest" style={{ fontFamily: "Arial Black, sans-serif", letterSpacing: "0.08em", width: "fit-content" }}>
                        {data.registrationNumber}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="flex-1 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wide">Make</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-100">{data.make || "—"}</p>
                      </div>
                      <div className="flex-1 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wide">Model</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-100">{data.model || "—"}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-4">DVLA data • {new Date().toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => setShowFeatureHelp(!showFeatureHelp)}
                    className="h-fit px-3 py-2 text-xs font-semibold text-slate-300 hover:text-slate-100 border border-slate-600 hover:border-slate-500 rounded-lg transition-colors bg-slate-700/50 hover:bg-slate-700 whitespace-nowrap"
                    title="Learn what you can do with this vehicle"
                  >
                    💡 What can I do?
                  </button>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShareMenuOpen(!shareMenuOpen)}
                        className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        title="Share vehicle details"
                      >
                        <Share className="w-5 h-5" />
                      </button>
                      
                      {/* Share menu dropdown */}
                      {shareMenuOpen && (
                        <div className="absolute left-0 sm:right-0 sm:left-auto -mt-32 w-48 bg-slate-950 border border-slate-500 rounded-lg shadow-2xl z-50 py-2">
                          <button
                            onClick={() => {
                              copyShareLink();
                              setShareMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 transition-colors flex items-center gap-2"
                          >
                            📋 Copy to clipboard
                          </button>
                          
                          <button
                            onClick={() => {
                              shareViaEmail();
                              setShareMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 transition-colors flex items-center gap-2"
                          >
                            ✉️ Share via Email
                          </button>
                          
                          <button
                            onClick={() => {
                              shareViaWhatsapp();
                              setShareMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 transition-colors flex items-center gap-2"
                          >
                            💬 WhatsApp
                          </button>
                          
                          <button
                            onClick={() => {
                              shareViaFacebook();
                              setShareMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 transition-colors flex items-center gap-2"
                          >
                            👥 Facebook
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={isFavorited(data.registrationNumber) ? () => removeFavorite(data.registrationNumber) : addFavorite}
                      className={`p-2.5 rounded-lg transition-colors ${
                        isFavorited(data.registrationNumber)
                          ? "bg-red-600 hover:bg-red-500"
                          : "bg-slate-700 hover:bg-slate-600"
                      }`}
                      title={isFavorited(data.registrationNumber) ? "Remove from favorites" : "Add to favorites"}
                    >
                      {isFavorited(data.registrationNumber) ? "❤️" : "🤍"}
                    </button>
                    
                    <button
                      onClick={isMyVehicle(data.registrationNumber) ? () => removeFromMyVehicles(data.registrationNumber) : addToMyVehicles}
                      className={`p-2.5 rounded-lg transition-colors ${
                        isMyVehicle(data.registrationNumber)
                          ? "bg-emerald-600 hover:bg-emerald-500"
                          : "bg-slate-700 hover:bg-slate-600"
                      }`}
                      title={isMyVehicle(data.registrationNumber) ? "Remove from My Vehicles" : "Mark as my car"}
                    >
                      {isMyVehicle(data.registrationNumber) ? "✓" : "✔️"}
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                        className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        title="Download report"
                      >
                        📥
                      </button>

                      {/* Download format menu */}
                      {downloadMenuOpen && (
                        <div className="absolute left-0 sm:right-0 sm:left-auto -mt-32 w-40 bg-slate-950 border border-slate-500 rounded-lg shadow-2xl z-50 py-2">
                          <button
                            onClick={() => downloadPDF()}
                            className="w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 transition-colors flex items-center gap-2"
                          >
                            📄 PDF (Recommended)
                          </button>

                          <button
                            onClick={() => downloadTXT()}
                            className="w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 transition-colors flex items-center gap-2"
                          >
                            📋 Text File
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        setData(null);
                        setVrm("");
                        setCheckedItems(new Set());
                        setShareMenuOpen(false);
                      }}
                      className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      title="New lookup"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* FEATURE HELP MODAL */}
                {showFeatureHelp && (
                  <div className="mb-6 p-4 bg-slate-800/80 border border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-100">What can you do?</h3>
                      <button
                        onClick={() => setShowFeatureHelp(false)}
                        className="text-slate-400 hover:text-slate-300 text-2xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-3 text-sm text-slate-300">
                      <div className="flex gap-3">
                        <span className="text-lg">❤️</span>
                        <div>
                          <p className="font-semibold text-slate-100 mb-1">Save to Favorites</p>
                          <p className="text-slate-400">Bookmark vehicles you're interested in. Great for comparing multiple cars side-by-side later.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-lg">✔️</span>
                        <div>
                          <p className="font-semibold text-slate-100 mb-1">Mark as My Car</p>
                          <p className="text-slate-400">Track your own vehicle. Export MOT & tax due dates to Apple Calendar, Google Calendar, or Outlook for automatic reminders.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Share className="w-5 h-5 text-lg flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-100 mb-1">Share Details</p>
                          <p className="text-slate-400">Send vehicle information to friends via email, WhatsApp, or Facebook. Perfect for getting second opinions.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-lg">📥</span>
                        <div>
                          <p className="font-semibold text-slate-100 mb-1">Download Report</p>
                          <p className="text-slate-400">Save the full vehicle analysis as a PDF or text file. Keep records for your records or share with a mechanic.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-lg">🔄</span>
                        <div>
                          <p className="font-semibold text-slate-100 mb-1">Compare Vehicles</p>
                          <p className="text-slate-400">Side-by-side comparison of tax, MOT, specs and more. Works with your recent lookups.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* KEY INSIGHTS */}
                <div className="space-y-2">
                  {insights.slice(0, 2).map((insight, idx) => (
                    <InsightCard key={idx} insight={insight} delay={idx * 100} />
                  ))}
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
                <div 
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: { emerald: "rgba(5, 150, 105, 0.1)", amber: "rgba(217, 119, 6, 0.1)", red: "rgba(220, 38, 38, 0.1)", slate: "rgba(71, 85, 105, 0.2)" }[getTaxStatusColor(data.taxStatus, data.taxDueDate)],
                    borderColor: { emerald: "rgba(5, 150, 105, 0.4)", amber: "rgba(217, 119, 6, 0.4)", red: "rgba(220, 38, 38, 0.4)", slate: "rgba(71, 85, 105, 0.3)" }[getTaxStatusColor(data.taxStatus, data.taxDueDate)],
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5" style={{ color: { emerald: "#10b981", amber: "#f59e0b", red: "#ef4444", slate: "#64748b" }[getTaxStatusColor(data.taxStatus, data.taxDueDate)] }} />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tax Status</span>
                  </div>
                  <p className={`text-xl font-bold leading-tight mb-2 ${{ emerald: "text-emerald-100", amber: "text-amber-100", red: "text-red-100", slate: "text-slate-100" }[getTaxStatusColor(data.taxStatus, data.taxDueDate)]}`}>
                    {data.taxStatus === "Taxed" && daysUntil(data.taxDueDate) !== null
                      ? daysUntil(data.taxDueDate)! > 0
                        ? `Taxed for another ${daysUntil(data.taxDueDate)} days`
                        : "Tax expired"
                      : data.taxStatus === "Not Taxed"
                      ? "Not Taxed"
                      : data.taxStatus === "SORN"
                      ? "Off Road (SORN)"
                      : data.taxStatus ?? "—"}
                  </p>
                  <p className="text-sm text-slate-400">Due: {formatDate(data.taxDueDate)}</p>
                </div>

                <div 
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: { emerald: "rgba(5, 150, 105, 0.1)", amber: "rgba(217, 119, 6, 0.1)", red: "rgba(220, 38, 38, 0.1)", slate: "rgba(71, 85, 105, 0.2)" }[getMotStatusColor(data.motStatus, data.motExpiryDate)],
                    borderColor: { emerald: "rgba(5, 150, 105, 0.4)", amber: "rgba(217, 119, 6, 0.4)", red: "rgba(220, 38, 38, 0.4)", slate: "rgba(71, 85, 105, 0.3)" }[getMotStatusColor(data.motStatus, data.motExpiryDate)],
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5" style={{ color: { emerald: "#10b981", amber: "#f59e0b", red: "#ef4444", slate: "#64748b" }[getMotStatusColor(data.motStatus, data.motExpiryDate)] }} />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">MOT Status</span>
                  </div>
                  <p className={`text-xl font-bold leading-tight mb-2 ${{ emerald: "text-emerald-100", amber: "text-amber-100", red: "text-red-100", slate: "text-slate-100" }[getMotStatusColor(data.motStatus, data.motExpiryDate)]}`}>
                    {data.motStatus === "Valid" && daysUntil(data.motExpiryDate) !== null
                      ? daysUntil(data.motExpiryDate)! > 0
                        ? `Valid for another ${daysUntil(data.motExpiryDate)} days`
                        : "MOT expired"
                      : data.motStatus === "Expired"
                      ? "MOT Expired"
                      : data.motStatus ?? "—"}
                  </p>
                  <p className="text-sm text-slate-400">Expires: {formatDate(data.motExpiryDate)}</p>
                </div>
              </div>
            </DataReveal>

            {data.motTests && data.motTests.length > 0 && (
              <DataReveal delay={250}>
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">MOT Test History</h3>
                  <div className="space-y-3">
                    {data.motTests.slice(0, 3).map((test, idx) => (
                      <div
                        key={idx}
                        className="p-6 rounded-lg border transition-all"
                        style={{
                          backgroundColor: { emerald: "rgba(5, 150, 105, 0.1)", red: "rgba(220, 38, 38, 0.1)", slate: "rgba(71, 85, 105, 0.2)" }[getMotTestResultColor(test.testResult)],
                          borderColor: { emerald: "rgba(5, 150, 105, 0.4)", red: "rgba(220, 38, 38, 0.4)", slate: "rgba(71, 85, 105, 0.3)" }[getMotTestResultColor(test.testResult)],
                        }}
                      >
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Test Date</p>
                            <p className="text-sm font-semibold text-slate-100">{formatDate(test.completedDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Mileage</p>
                            <p className="text-sm font-semibold text-slate-100">{test.odometer?.value ? test.odometer.value.toLocaleString() : "—"} miles</p>
                          </div>
                          {test.expiryDate && (
                            <div>
                              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Valid Until</p>
                              <p className="text-sm font-semibold text-slate-100">{formatDate(test.expiryDate)}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex gap-2 flex-wrap">
                            {test.rfrAndComments?.some(r => r.type === "ADVISORY") && (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/50">
                                {test.rfrAndComments.filter(r => r.type === "ADVISORY").length} Advisor{test.rfrAndComments.filter(r => r.type === "ADVISORY").length !== 1 ? "ies" : "y"}
                              </span>
                            )}
                            {test.rfrAndComments?.some(r => r.type === "DEFECT") && (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-900/40 text-red-300 border border-red-700/50">
                                {test.rfrAndComments.filter(r => r.type === "DEFECT").length} Defect{test.rfrAndComments.filter(r => r.type === "DEFECT").length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: { emerald: "rgba(5, 150, 105, 0.3)", red: "rgba(220, 38, 38, 0.3)", slate: "rgba(71, 85, 105, 0.3)" }[getMotTestResultColor(test.testResult)],
                              color: { emerald: "#10b981", red: "#ef4444", slate: "#94a3b8" }[getMotTestResultColor(test.testResult)],
                            }}
                          >
                            {test.testResult}
                          </span>
                        </div>
                        {test.rfrAndComments && test.rfrAndComments.length > 0 && (
                          <div className="border-t border-slate-700/50 pt-3">
                            <button
                              onClick={() => {
                                const newSet = new Set(expandedMotTests);
                                if (newSet.has(idx)) {
                                  newSet.delete(idx);
                                } else {
                                  newSet.add(idx);
                                }
                                setExpandedMotTests(newSet);
                              }}
                              className="text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1"
                            >
                              <span>{expandedMotTests.has(idx) ? "−" : "+"}</span>
                              <span>Click to view details</span>
                            </button>
                            {expandedMotTests.has(idx) && (
                              <div className="mt-3 space-y-2">
                                {test.rfrAndComments.filter(r => r.type === "DEFECT").map((defect, didx) => (
                                  <p key={`defect-${didx}`} className="text-xs text-red-300 pl-3 border-l border-red-500">
                                    <span className="font-semibold">Defect:</span> {defect.text}
                                  </p>
                                ))}
                                {test.rfrAndComments.filter(r => r.type === "ADVISORY").map((advisory, aidx) => (
                                  <p key={`advisory-${aidx}`} className="text-xs text-amber-300 pl-3 border-l border-amber-500">
                                    <span className="font-semibold">Advisory:</span> {advisory.text}
                                  </p>
                                ))}
                                {test.rfrAndComments.filter(r => r.type === "COMMENT").map((comment, cidx) => (
                                  <p key={`comment-${cidx}`} className="text-xs text-slate-300 pl-3 border-l border-slate-500">
                                    <span className="font-semibold">Note:</span> {comment.text}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {test.rfrAndComments && test.rfrAndComments.length > 0 && (
                          <div className="mt-3 border-t border-slate-700/50 pt-3">
                            <button
                              onClick={() => {
                                const newSet = new Set(expandedMotTests);
                                if (newSet.has(idx)) {
                                  newSet.delete(idx);
                                } else {
                                  newSet.add(idx);
                                }
                                setExpandedMotTests(newSet);
                              }}
                              className="text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1"
                            >
                              <span>{expandedMotTests.has(idx) ? "−" : "+"}</span>
                              <span>
                                {test.rfrAndComments.filter(r => r.type === "DEFECT").length} defect{test.rfrAndComments.filter(r => r.type === "DEFECT").length !== 1 ? "s" : ""},{" "}
                                {test.rfrAndComments.filter(r => r.type === "ADVISORY").length} advisor{test.rfrAndComments.filter(r => r.type === "ADVISORY").length !== 1 ? "ies" : "y"}
                              </span>
                            </button>
                            {expandedMotTests.has(idx) && (
                              <div className="mt-3 space-y-2">
                                {test.rfrAndComments.filter(r => r.type === "DEFECT").map((defect, didx) => (
                                  <p key={`defect-${didx}`} className="text-xs text-red-300 pl-3 border-l border-red-500">
                                    <span className="font-semibold">Defect:</span> {defect.text}
                                  </p>
                                ))}
                                {test.rfrAndComments.filter(r => r.type === "ADVISORY").map((advisory, aidx) => (
                                  <p key={`advisory-${aidx}`} className="text-xs text-amber-300 pl-3 border-l border-amber-500">
                                    <span className="font-semibold">Advisory:</span> {advisory.text}
                                  </p>
                                ))}
                                {test.rfrAndComments.filter(r => r.type === "COMMENT").map((comment, cidx) => (
                                  <p key={`comment-${cidx}`} className="text-xs text-slate-300 pl-3 border-l border-slate-500">
                                    <span className="font-semibold">Note:</span> {comment.text}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {data.motTests.length > 3 && (
                    <button
                      onClick={() => setShowAllMotTests(!showAllMotTests)}
                      className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {showAllMotTests ? "Show less" : `View all ${data.motTests.length} tests`}
                    </button>
                  )}
                  {showAllMotTests && data.motTests.length > 3 && (
                    <div className="mt-4 space-y-3">
                      {data.motTests.slice(3).map((test, idx) => (
                        <div
                          key={idx + 3}
                          className="p-6 rounded-lg border transition-all"
                          style={{
                            backgroundColor: { emerald: "rgba(5, 150, 105, 0.1)", red: "rgba(220, 38, 38, 0.1)", slate: "rgba(71, 85, 105, 0.2)" }[getMotTestResultColor(test.testResult)],
                            borderColor: { emerald: "rgba(5, 150, 105, 0.4)", red: "rgba(220, 38, 38, 0.4)", slate: "rgba(71, 85, 105, 0.3)" }[getMotTestResultColor(test.testResult)],
                          }}
                        >
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Test Date</p>
                              <p className="text-sm font-semibold text-slate-100">{formatDate(test.completedDate)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Mileage</p>
                              <p className="text-sm font-semibold text-slate-100">{test.odometer?.value ? test.odometer.value.toLocaleString() : "—"} miles</p>
                            </div>
                            {test.expiryDate && (
                              <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Valid Until</p>
                                <p className="text-sm font-semibold text-slate-100">{formatDate(test.expiryDate)}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex gap-2 flex-wrap">
                              {test.rfrAndComments?.some(r => r.type === "ADVISORY") && (
                                <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/50">
                                  {test.rfrAndComments.filter(r => r.type === "ADVISORY").length} Advisor{test.rfrAndComments.filter(r => r.type === "ADVISORY").length !== 1 ? "ies" : "y"}
                                </span>
                              )}
                              {test.rfrAndComments?.some(r => r.type === "DEFECT") && (
                                <span className="px-2 py-1 rounded text-xs font-semibold bg-red-900/40 text-red-300 border border-red-700/50">
                                  {test.rfrAndComments.filter(r => r.type === "DEFECT").length} Defect{test.rfrAndComments.filter(r => r.type === "DEFECT").length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                            <span
                              className="px-3 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: { emerald: "rgba(5, 150, 105, 0.3)", red: "rgba(220, 38, 38, 0.3)", slate: "rgba(71, 85, 105, 0.3)" }[getMotTestResultColor(test.testResult)],
                                color: { emerald: "#10b981", red: "#ef4444", slate: "#94a3b8" }[getMotTestResultColor(test.testResult)],
                              }}
                            >
                              {test.testResult}
                            </span>
                          </div>
                          {test.rfrAndComments && test.rfrAndComments.length > 0 && (
                            <div className="mt-3 border-t border-slate-700/50 pt-3">
                              <button
                                onClick={() => {
                                  const newSet = new Set(expandedMotTests);
                                  if (newSet.has(idx + 3)) {
                                    newSet.delete(idx + 3);
                                  } else {
                                    newSet.add(idx + 3);
                                  }
                                  setExpandedMotTests(newSet);
                                }}
                                className="text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1"
                              >
                                <span>{expandedMotTests.has(idx + 3) ? "−" : "+"}</span>
                                <span>Click to view details</span>
                              </button>
                              {expandedMotTests.has(idx + 3) && (
                                <div className="mt-3 space-y-2">
                                  {test.rfrAndComments.filter(r => r.type === "DEFECT").map((defect, didx) => (
                                    <p key={`defect-${didx}`} className="text-xs text-red-300 pl-3 border-l border-red-500">
                                      <span className="font-semibold">Defect:</span> {defect.text}
                                    </p>
                                  ))}
                                  {test.rfrAndComments.filter(r => r.type === "ADVISORY").map((advisory, aidx) => (
                                    <p key={`advisory-${aidx}`} className="text-xs text-amber-300 pl-3 border-l border-amber-500">
                                      <span className="font-semibold">Advisory:</span> {advisory.text}
                                    </p>
                                  ))}
                                  {test.rfrAndComments.filter(r => r.type === "COMMENT").map((comment, cidx) => (
                                    <p key={`comment-${cidx}`} className="text-xs text-slate-300 pl-3 border-l border-slate-500">
                                      <span className="font-semibold">Note:</span> {comment.text}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DataReveal>
            )}

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
                  Official Checks
                </h3>
                
                {/* Official government checks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
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
                </div>

                <hr className="border-slate-700/50 my-6" />

                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  Next Steps: Insurance, Finance & More
                </h3>

                {/* Affiliate partner buttons - more prominent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Insurance - Go Compare */}
                  <a
                    href={AFFILIATE_LINKS.goCompare}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-5 bg-gradient-to-br from-blue-600/30 to-blue-700/30 hover:from-blue-600/50 hover:to-blue-700/50 border border-blue-600/50 hover:border-blue-500/75 rounded-lg text-left transition-all group"
                  >
                    <div className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-100">
                      🛡️ Car Insurance Quotes
                      <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-blue-200/80">Compare quotes instantly. Often 30-40% cheaper.</p>
                  </a>

                  {/* Vehicle History - HPI Check */}
                  <a
                    href={AFFILIATE_LINKS.hpiCheck}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-5 bg-gradient-to-br from-amber-600/30 to-amber-700/30 hover:from-amber-600/50 hover:to-amber-700/50 border border-amber-600/50 hover:border-amber-500/75 rounded-lg text-left transition-all group"
                  >
                    <div className="font-semibold text-sm mb-2 flex items-center gap-2 text-amber-100">
                      🔍 Vehicle History Check
                      <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-amber-200/80">Check for write-offs, theft, finance. Essential before buying.</p>
                  </a>

                  {/* Finance - Carmoola */}
                  <a
                    href={AFFILIATE_LINKS.carmoola}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-5 bg-gradient-to-br from-emerald-600/30 to-emerald-700/30 hover:from-emerald-600/50 hover:to-emerald-700/50 border border-emerald-600/50 hover:border-emerald-500/75 rounded-lg text-left transition-all group"
                  >
                    <div className="font-semibold text-sm mb-2 flex items-center gap-2 text-emerald-100">
                      💳 Finance & Loans
                      <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-emerald-200/80">Find best interest rates. Compare car finance instantly.</p>
                  </a>

                  {/* Breakdown Cover - RAC */}
                  <a
                    href={AFFILIATE_LINKS.racBreakdown}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-5 bg-gradient-to-br from-purple-600/30 to-purple-700/30 hover:from-purple-600/50 hover:to-purple-700/50 border border-purple-600/50 hover:border-purple-500/75 rounded-lg text-left transition-all group"
                  >
                    <div className="font-semibold text-sm mb-2 flex items-center gap-2 text-purple-100">
                      🚗 Breakdown Cover
                      <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-purple-200/80">Essential protection for UK drivers. Peace of mind on the road.</p>
                  </a>
                </div>

                <p className="text-xs text-slate-500 mt-6">All links open in a new tab. We earn a small commission if you proceed, at no extra cost to you.</p>
              </div>
            </DataReveal>

            {/* BUYING CHECKLIST */}
            <DataReveal delay={500}>
              <div className="mb-8 p-6 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                    Helpful Checklist
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {completedCount}/{totalCount}
                  </span>
                </div>

                <div className="mb-4 pb-4 border-b border-slate-700">
                  <p className="text-xs text-slate-400 mb-3">I'm checking this vehicle because I am:</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "owner" as const, label: "The owner" },
                      { value: "buyer" as const, label: "Buying a car" },
                      { value: "seller" as const, label: "Selling a car" },
                    ].map((role) => (
                      <button
                        key={role.value}
                        onClick={() => {
                          setChecklistRole(role.value);
                          setCheckedItems(new Set());
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          checklistRole === role.value
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4">Check off items as you verify them:</p>

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
            Stay Updated
          </h3>
          <p className="text-sm text-slate-300 mb-4">
            We'll let you know about significant updates to CarScans.
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
            Built with DVLA vehicle data. Always verify details with the seller and official documents before making any decisions.
          </p>
        </footer>

        {/* INSURANCE DATE MODAL */}
        {insuranceModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Insurance Policy Expiry Date</h3>
              <p className="text-sm text-slate-400 mb-4">Enter your car insurance policy expiry date. When you export to calendar, we'll show a 7-day renewal window (20-27 days before expiry) — the sweet spot for getting the best renewal rates.</p>
              
              <input
                type="date"
                value={insuranceModalDate}
                onChange={(e) => setInsuranceModalDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setInsuranceModalOpen(false);
                    setInsuranceModalDate("");
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInsuranceModalSave}
                  disabled={!insuranceModalDate}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

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