"use client";

import { useMemo, useState, useRef, useEffect } from "react";

// MOT Insights calculation
function calculateMotInsights(motTests: any[]) {
  if (!motTests || motTests.length === 0) {
    return null;
  }

  const sortedTests = [...motTests].sort((a, b) => 
    new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime()
  );

  const passedTests = motTests.filter(t => t.testResult === "PASSED").length;
  const passRate = Math.round((passedTests / motTests.length) * 100);

  const mileageTests = sortedTests.filter(t => t.odometer?.value).map(t => ({
    date: new Date(t.completedDate),
    mileage: t.odometer.value,
    test: t
  }));

  let avgMilesPerYear = 0;
  let mileageWarnings: string[] = [];
  let mileageTrend = "normal";

  if (mileageTests.length >= 2) {
    const oldest = mileageTests[0];
    const newest = mileageTests[mileageTests.length - 1];
    const yearsSpan = (newest.date.getTime() - oldest.date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const totalMiles = newest.mileage - oldest.mileage;

    avgMilesPerYear = Math.round(totalMiles / yearsSpan);

    if (avgMilesPerYear < 4000) {
      mileageWarnings.push("⚠️ Unusually low annual mileage (under 4,000 miles/year) - verify vehicle usage or check for odometer issues");
      mileageTrend = "low";
    } else if (avgMilesPerYear > 15000) {
      mileageWarnings.push("ℹ️ High annual mileage (over 15,000 miles/year) - vehicle has seen heavy use");
      mileageTrend = "high";
    }

    for (let i = 1; i < mileageTests.length; i++) {
      const prev = mileageTests[i - 1];
      const curr = mileageTests[i];
      const daysBetween = (curr.date.getTime() - prev.date.getTime()) / (1000 * 60 * 60 * 24);
      const milesDifference = curr.mileage - prev.mileage;

      if (milesDifference < 0) {
        mileageWarnings.push(`🚨 ALERT: Mileage decreased by ${Math.abs(milesDifference).toLocaleString()} miles between ${prev.date.toLocaleDateString()} and ${curr.date.toLocaleDateString()} - possible odometer tamper`);
      } else if (daysBetween > 0) {
        const milesPerDay = milesDifference / daysBetween;
        const expectedMilesPerDay = avgMilesPerYear / 365;
        
        if (milesPerDay > expectedMilesPerDay * 2 && daysBetween < 365) {
          const percentageAbove = Math.round(((milesPerDay / expectedMilesPerDay) - 1) * 100);
          mileageWarnings.push(`ℹ️ Unusual mileage increase of ${milesDifference.toLocaleString()} miles in ${Math.round(daysBetween)} days (${percentageAbove}% above average)`);
        }
      }
    }
  }

  const allAdvisories: { [key: string]: number } = {};
  motTests.forEach(test => {
    test.rfrAndComments?.forEach((item: any) => {
      if (item.type === "ADVISORY") {
        const key = item.text.substring(0, 50);
        allAdvisories[key] = (allAdvisories[key] || 0) + 1;
      }
    });
  });

  const recurringAdvisories = Object.entries(allAdvisories)
    .filter(([_, count]) => count >= 2)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Days until next MOT - use the FIRST test (newest) not the last
  const latestTest = motTests[0];
  let daysUntilExpiry = 0;
  if (latestTest.expiryDate) {
    const expiryDate = new Date(latestTest.expiryDate);
    const today = new Date();
    daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    passRate,
    passedTests,
    totalTests: motTests.length,
    avgMilesPerYear,
    mileageWarnings,
    mileageTrend,
    recurringAdvisories,
    daysUntilExpiry,
    latestMileage: mileageTests[mileageTests.length - 1]?.mileage
  };
}
import {
  Fuel,
  Gauge,
  Calendar,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Search,
  Bell,
  ExternalLink,
  CheckSquare,
  Square,
  Zap,
  RotateCcw,
  Heart,
  Car,
  FileText,
  ArrowLeftRight,
  Shield,
  Star,
  Leaf,
  PoundSterling,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
import { triggerShare, isMobileDevice } from "@/lib/share";
import { calculateUlezCompliance, type UlezResult } from "@/lib/ulez";
import { calculateVed } from "@/lib/ved";
import { lookupNcap, type NcapRating } from "@/lib/ncap";
import { type Recall } from "@/lib/recalls";
import { type FuelEconomyResult } from "@/lib/fuel-economy";
import { getMakeLogoPath } from "@/lib/make-logo";
import { parseModel, expandBaseModelForLookup, type ParsedModel } from "@/lib/model-parser";
import { lookupBodyType } from "@/lib/body-type";
import {
  lookupNewPrice,
  calculateDepreciationBaseline,
  getMileageAdjustment,
  getConditionAdjustment,
  getColourAdjustment,
  combineValuationLayers,
  type ValuationResult,
  type ConditionInputs,
} from "@/lib/valuation";

import newPricesData from "@/data/new-prices.json";

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
function DataReveal({ delay = 0, children, className }: { delay?: number; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`animate-fadeInUp opacity-0${className ? ` ${className}` : ""}`}
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

// Action prompt card — contextual CTA with variant-based styling
function ActionPrompt({
  variant,
  icon,
  title,
  description,
  linkText,
  linkHref,
  partnerId,
  trackingContext,
  secondaryLink,
  delay = 0,
}: {
  variant: "urgent" | "warning" | "info" | "subtle";
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
  partnerId: string;
  trackingContext: string;
  secondaryLink?: { text: string; href: string; partnerId: string; trackingContext: string };
  delay?: number;
}) {
  const variantStyles = {
    urgent: "bg-red-950/30 border-red-800/50",
    warning: "bg-amber-950/30 border-amber-800/50",
    info: "bg-slate-800/50 border-slate-700/50",
    subtle: "bg-slate-800/30 border-slate-700/30",
  };
  const linkStyles = {
    urgent: "bg-red-600/30 hover:bg-red-600/50 border-red-600/50 text-red-100",
    warning: "bg-amber-600/30 hover:bg-amber-600/50 border-amber-600/50 text-amber-100",
    info: "bg-slate-700/50 hover:bg-slate-700/80 border-slate-600/50 text-slate-200",
    subtle: "bg-slate-700/30 hover:bg-slate-700/50 border-slate-600/30 text-slate-400 hover:text-slate-200",
  };
  const titleStyles = {
    urgent: "text-red-200",
    warning: "text-amber-200",
    info: "text-slate-200",
    subtle: "text-slate-300",
  };
  const descStyles = {
    urgent: "text-red-300/70",
    warning: "text-amber-300/70",
    info: "text-slate-400",
    subtle: "text-slate-500",
  };

  const partner = PARTNER_LINKS[partnerId as keyof typeof PARTNER_LINKS];
  const rel = partner ? getPartnerRel(partner) : "noopener noreferrer";

  return (
    <DataReveal delay={delay}>
      <div className={`p-4 border rounded-lg ${variantStyles[variant]}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{icon}</div>
          <div>
            <p className={`text-sm font-medium ${titleStyles[variant]}`}>{title}</p>
            <p className={`text-xs mt-1 ${descStyles[variant]}`}>{description}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <a
                href={linkHref}
                target="_blank"
                rel={rel}
                onClick={() => trackPartnerClick(partnerId, trackingContext)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-medium transition-colors ${linkStyles[variant]}`}
              >
                {linkText}
                <ExternalLink className="w-3 h-3" />
              </a>
              {secondaryLink && (
                <a
                  href={secondaryLink.href}
                  target="_blank"
                  rel={PARTNER_LINKS[secondaryLink.partnerId as keyof typeof PARTNER_LINKS] ? getPartnerRel(PARTNER_LINKS[secondaryLink.partnerId as keyof typeof PARTNER_LINKS]) : "noopener noreferrer"}
                  onClick={() => trackPartnerClick(secondaryLink.partnerId, secondaryLink.trackingContext)}
                  className={`text-xs underline underline-offset-2 transition-colors ${descStyles[variant]} hover:${titleStyles[variant]}`}
                >
                  {secondaryLink.text}
                </a>
              )}
            </div>
          </div>
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
  const [checklistRole, setChecklistRole] = useState<"owner" | "buyer" | "seller">("owner");
  const [expandedMotTests, setExpandedMotTests] = useState<Set<number>>(new Set([0, 1, 2]));
  const [showAllMotTests, setShowAllMotTests] = useState(false);
  const [email, setEmail] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMsg, setSignupMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [recentLookups, setRecentLookups] = useState<string[]>([]);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<(VehicleData & { savedAt: number })[]>([]);
  const [myVehicles, setMyVehicles] = useState<(VehicleData & { addedAt: number })[]>([]);
  const [confirmingClear, setConfirmingClear] = useState<string | null>(null);
  const confirmClearTimeout = useRef<NodeJS.Timeout | null>(null);
  const [activeVehicleTab, setActiveVehicleTab] = useState<"recent" | "saved" | "mycars">("recent");
  const [shareToastVisible, setShareToastVisible] = useState(false);
  const [shareToastDismissing, setShareToastDismissing] = useState(false);
  const [downloadSharePrompt, setDownloadSharePrompt] = useState(false);
  const [sharePromptDismissed, setSharePromptDismissed] = useState(false);
  const [downloadShareCopied, setDownloadShareCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareToastTimer = useRef<NodeJS.Timeout | null>(null);
  const shareSentinelMidRef = useRef<HTMLDivElement | null>(null);
  const shareSentinelBottomRef = useRef<HTMLDivElement | null>(null);
  const [showLogoReveal, setShowLogoReveal] = useState(false);
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
  const [recentGuides, setRecentGuides] = useState<{ slug: string; title: string; description: string; date: string; readingTime: number }[]>([]);
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [fuelEconomy, setFuelEconomy] = useState<FuelEconomyResult | null>(null);
  const [valuationServerData, setValuationServerData] = useState<{ ebayMedian: number | null; ebayListingCount: number; ebayMinPrice: number | null; ebayMaxPrice: number | null; ebayTotalListings: number | null; ebayDominantTransmission: string | null; ebayDominantBodyType: string | null; ebayYearWidened: boolean; cacheMedian: number | null; cacheEntryCount: number; sources: string[] } | null>(null);
  const [valuationCondition, setValuationCondition] = useState<ConditionInputs | null>(null);
  const [showConditionForm, setShowConditionForm] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Load recent guides
  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => setRecentGuides(data))
      .catch(() => {});
  }, []);

  // Show full-screen logo reveal when vehicle data arrives
  useEffect(() => {
    if (data?.make && getMakeLogoPath(data.make)) {
      setShowLogoReveal(true);
      const t = setTimeout(() => setShowLogoReveal(false), 3500);
      return () => clearTimeout(t);
    }
    setShowLogoReveal(false);
  }, [data]);

  // Parsed model string
  const parsedModel = useMemo((): ParsedModel | null => {
    if (!data?.model) return null;
    return parseModel(data.model, data.make);
  }, [data?.model, data?.make]);

  const lookupModel = useMemo((): string | null => {
    if (!parsedModel) return data?.model ?? null;
    return expandBaseModelForLookup(data?.make ?? "", parsedModel);
  }, [data?.model, data?.make, parsedModel]);

  // Parse the VCA matched model for additional variant info
  const vcaParsedModel = useMemo((): ParsedModel | null => {
    if (!fuelEconomy?.matchedModel) return null;
    return parseModel(fuelEconomy.matchedModel, data?.make);
  }, [fuelEconomy?.matchedModel, data?.make]);

  // Body style — from DVLA parser, then VCA match, then static fallback
  const bodyStyle = useMemo((): string | null => {
    if (parsedModel?.bodyStyle) return parsedModel.bodyStyle;
    if (vcaParsedModel?.bodyStyle) return vcaParsedModel.bodyStyle;
    if (!data?.make) return null;
    return lookupBodyType(data.make, parsedModel?.baseModel || data.model);
  }, [data?.make, data?.model, parsedModel, vcaParsedModel]);

  // Fetch recalls when vehicle data changes
  useEffect(() => {
    if (!data?.make) {
      setRecalls([]);
      return;
    }
    const params = new URLSearchParams({ make: data.make });
    if (lookupModel) params.set("model", lookupModel);
    else if (data.model) params.set("model", data.model);
    if (data.yearOfManufacture) params.set("year", String(data.yearOfManufacture));
    fetch(`/api/recalls?${params}`)
      .then((res) => res.json())
      .then((results) => setRecalls(Array.isArray(results) ? results : []))
      .catch(() => setRecalls([]));
  }, [data?.make, data?.model, data?.yearOfManufacture, lookupModel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch fuel economy when vehicle data changes
  useEffect(() => {
    if (!data?.make || !data?.model) {
      setFuelEconomy(null);
      return;
    }
    const model = lookupModel || data.model;
    const params = new URLSearchParams({ make: data.make, model });
    if (data.engineCapacity) params.set("engine", String(data.engineCapacity));
    if (data.fuelType) params.set("fuel", data.fuelType);
    if (parsedModel?.bodyStyle) params.set("bodyStyle", parsedModel.bodyStyle);
    fetch(`/api/fuel-economy?${params}`)
      .then((res) => res.json())
      .then((result) => setFuelEconomy(result))
      .catch(() => setFuelEconomy(null));
  }, [data?.make, data?.model, data?.engineCapacity, data?.fuelType, lookupModel, parsedModel?.bodyStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch valuation server data (eBay + cache) when vehicle data changes
  useEffect(() => {
    if (!data?.make || !data?.model || !data?.yearOfManufacture) {
      setValuationServerData(null);
      setValuationCondition(null);
      setShowConditionForm(false);
      return;
    }
    const newPrice = lookupNewPrice(newPricesData, data.make, lookupModel || data.model);
    if (!newPrice) {
      setValuationServerData(null);
      return;
    }
    const latestMileage = data.motTests?.[data.motTests.length - 1]?.odometer?.value
      ?? data.motTests?.[0]?.odometer?.value
      ?? null;
    const vehicleAge = new Date().getFullYear() - data.yearOfManufacture;
    const depEst = calculateDepreciationBaseline(newPrice, vehicleAge, data.make, data.model, latestMileage);

    const params = new URLSearchParams({
      make: data.make,
      model: data.model,
      year: String(data.yearOfManufacture),
      depreciationEstimate: String(depEst),
      newPrice: String(newPrice),
    });
    if (data.fuelType) params.set("fuelType", data.fuelType);
    if (data.engineCapacity) params.set("engineCapacity", String(data.engineCapacity));
    if (latestMileage) params.set("mileage", String(latestMileage));
    if (data.colour) params.set("colour", String(getColourAdjustment(data.colour)));

    fetch(`/api/valuation?${params}`)
      .then((res) => res.json())
      .then((result) => setValuationServerData(result))
      .catch(() => setValuationServerData(null));
  }, [data?.make, data?.model, data?.yearOfManufacture, data?.fuelType, data?.motTests]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dynamic meta for vehicle results
  useEffect(() => {
    if (data) {
      const make = data.make || "Vehicle";
      const model = [data.model, data.variant].filter(Boolean).join(" ") || "";
      const year = data.yearOfManufacture || "";
      document.title = `${make} ${model} (${year}) — Free Vehicle Check | Free Plate Check`;

      let desc = document.querySelector('meta[name="description"]');
      if (!desc) {
        desc = document.createElement("meta");
        desc.setAttribute("name", "description");
        document.head.appendChild(desc);
      }
      const parts = [
        `${make} ${model}`.trim(),
        year ? `${year}` : "",
        data.colour || "",
        data.fuelType || "",
        data.engineCapacity ? `${data.engineCapacity}cc` : "",
        data.taxStatus ? `Tax: ${data.taxStatus}` : "",
        data.motStatus ? `MOT: ${data.motStatus}` : "",
      ].filter(Boolean);
      desc.setAttribute("content", `Free check for ${parts.join(" · ")}. View full MOT history, mileage records and more on Free Plate Check.`);

      // noindex for results state (safety measure — reg not in URL but prevents any cached snapshots)
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, follow");
    } else {
      document.title = "Free Plate Check — Free UK Vehicle Check | MOT History, Tax Status & More";
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.setAttribute("content", "index, follow");
    }
  }, [data]);

  // Show share toast on first successful lookup (one-time only)
  useEffect(() => {
    if (!data || typeof window === "undefined") return;
    if (localStorage.getItem("fpc_first_share_shown")) return;

    const timer = setTimeout(() => {
      localStorage.setItem("fpc_first_share_shown", "1");
      setShareToastVisible(true);
      // Auto-dismiss after 10 seconds
      shareToastTimer.current = setTimeout(() => dismissShareToast(), 10000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load insurance dates from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("fpcInsuranceDates");
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
      localStorage.setItem("fpcInsuranceDates", JSON.stringify(updated));
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
    document.title = "Free Plate Check - UK Vehicle Lookup";
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("fpcRecent");
        if (stored) {
          setRecentLookups(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load recent lookups:", err);
      }
    }
  }, []);

  // Auto-lookup from ?vrm= query param (used by 404 page)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const reg = params.get("vrm");
      if (reg) {
        const cleaned = reg.replace(/\s/g, "").toUpperCase();
        if (cleaned) {
          setVrm(cleaned);
          performLookup(cleaned);
          window.history.replaceState({}, "", "/");
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window !== "undefined") {
      loadFavorites();
      loadMyVehicles();
      const savedTab = localStorage.getItem("fpc-active-tab");
      if (savedTab === "recent" || savedTab === "saved" || savedTab === "mycars") {
        setActiveVehicleTab(savedTab);
      }
    }
  }, []);

  // Show floating share prompt when user scrolls into mid-results or bottom
  useEffect(() => {
    if (!data || sharePromptDismissed) return;
    const targets = [shareSentinelMidRef.current, shareSentinelBottomRef.current].filter(Boolean) as HTMLDivElement[];
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !sharePromptDismissed) {
            setDownloadSharePrompt(true);
          }
        }
      },
      { threshold: 0.1 },
    );
    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, [data, sharePromptDismissed]);

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

  // Shared computed values — deduplicate isOver3Years calculation
  const isOver3Years = useMemo(() => {
    if (!data?.yearOfManufacture) return false;
    if (data.monthOfFirstRegistration) {
      const [regYear, regMonth] = data.monthOfFirstRegistration.split("-");
      const regDate = new Date(parseInt(regYear), parseInt(regMonth) - 1);
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      return regDate <= threeYearsAgo;
    }
    return new Date().getFullYear() - data.yearOfManufacture > 3;
  }, [data]);

  const motDaysUntilExpiry = useMemo(() => {
    return daysUntil(data?.motExpiryDate) ?? 0;
  }, [data]);

  const latestAdvisoryCount = useMemo(() => {
    const latest = data?.motTests?.[0];
    if (!latest?.rfrAndComments) return 0;
    return latest.rfrAndComments.filter(r => r.type === "ADVISORY").length;
  }, [data]);

  // ULEZ compliance
  const ulezResult = useMemo((): UlezResult | null => {
    if (!data) return null;
    return calculateUlezCompliance({
      fuelType: data.fuelType,
      euroStatus: data.euroStatus,
      monthOfFirstRegistration: data.monthOfFirstRegistration,
      co2Emissions: data.co2Emissions,
      yearOfManufacture: data.yearOfManufacture,
    });
  }, [data]);

  // VED road tax
  const vedResult = useMemo(() => {
    if (!data) return null;
    return calculateVed({
      co2Emissions: data.co2Emissions,
      engineCapacity: data.engineCapacity,
      fuelType: data.fuelType,
      monthOfFirstRegistration: data.monthOfFirstRegistration,
    });
  }, [data]);

  // NCAP rating
  const ncapRating = useMemo((): NcapRating | null => {
    if (!data) return null;
    return lookupNcap(data.make, lookupModel ?? data.model);
  }, [data, lookupModel]);

  // Vehicle valuation
  const valuationResult = useMemo((): ValuationResult | null => {
    if (!data?.make || !data?.model || !data?.yearOfManufacture) return null;

    const newPrice = lookupNewPrice(newPricesData, data.make, lookupModel || data.model);
    if (!newPrice) return null;

    const vehicleAge = new Date().getFullYear() - data.yearOfManufacture;
    // Get latest mileage from MOT tests (sorted oldest first, so last element is latest)
    const sortedTests = data.motTests ? [...data.motTests].sort(
      (a, b) => new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime()
    ) : [];
    const latestMileage = sortedTests.length > 0
      ? sortedTests[sortedTests.length - 1]?.odometer?.value ?? null
      : null;

    const depBaseline = calculateDepreciationBaseline(newPrice, vehicleAge, data.make, data.model, latestMileage);
    const mileageAdj = getMileageAdjustment(latestMileage, vehicleAge);

    const advisoryCount = data.motTests?.[0]?.rfrAndComments?.filter(
      (r) => r.type === "ADVISORY"
    ).length ?? 0;
    const recentFailure = data.motTests?.[0]?.testResult === "FAILED";
    const { total: condAdj, motAuto } = getConditionAdjustment(valuationCondition, advisoryCount, recentFailure);
    const colourAdj = getColourAdjustment(data.colour);

    const result = combineValuationLayers(
      depBaseline,
      valuationServerData?.ebayMedian ?? null,
      valuationServerData?.ebayListingCount ?? 0,
      valuationServerData?.cacheMedian ?? null,
      valuationServerData?.cacheEntryCount ?? 0,
      condAdj,
      colourAdj,
      valuationServerData?.ebayTotalListings ?? null,
      valuationServerData?.ebayMinPrice ?? null,
      valuationServerData?.ebayMaxPrice ?? null,
      valuationServerData?.ebayDominantTransmission ?? null,
      valuationServerData?.ebayDominantBodyType ?? null,
      valuationServerData?.ebayYearWidened ?? false,
    );

    if (result) {
      result.mileageAdjustmentPercent = mileageAdj;
      result.motAutoAdjustmentPercent = motAuto;
    }

    return result;
  }, [data, valuationServerData, valuationCondition, lookupModel]);

  type ActionPromptVariant = "urgent" | "warning" | "info" | "subtle";
  type ActionPromptConfig = {
    variant: ActionPromptVariant;
    icon: React.ReactNode;
    title: string;
    description: string;
    linkText: string;
    linkHref: string;
    partnerId: string;
    trackingContext: string;
    secondaryLink?: { text: string; href: string; partnerId: string; trackingContext: string };
  };

  const actionPrompts = useMemo((): ActionPromptConfig[] => {
    if (!data) return [];
    const prompts: ActionPromptConfig[] = [];

    const motExpired = isOver3Years && motDaysUntilExpiry < 0;
    const motExpiringSoon = isOver3Years && !motExpired && motDaysUntilExpiry >= 0 && motDaysUntilExpiry <= 30;
    const isSornOrUntaxed = data.taxStatus === "SORN" || data.taxStatus === "Not Taxed";
    const hasAdvisories = isOver3Years && !motExpired && latestAdvisoryCount > 0;
    const bmgLink = PARTNER_LINKS.bookMyGarage.buildLink?.(data.registrationNumber) ?? PARTNER_LINKS.bookMyGarage.url;

    // 1. MOT expired
    if (motExpired) {
      prompts.push({
        variant: "urgent",
        icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
        title: "MOT expired — this vehicle cannot legally be driven",
        description: "Book an MOT test as soon as possible. Driving without a valid MOT risks a fine of up to £1,000.",
        linkText: "Book MOT — BookMyGarage",
        linkHref: bmgLink,
        partnerId: "bookMyGarage",
        trackingContext: "action-mot-expired",
        secondaryLink: {
          text: "Find MOT centres on GOV.UK",
          href: PARTNER_LINKS.govMotCentres.url,
          partnerId: "govMotCentres",
          trackingContext: "action-mot-expired-gov",
        },
      });
    }

    // 2. MOT expiring soon
    if (motExpiringSoon) {
      prompts.push({
        variant: "warning",
        icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
        title: `MOT expires in ${motDaysUntilExpiry} day${motDaysUntilExpiry !== 1 ? "s" : ""}`,
        description: "Book up to 28 days early without losing your current expiry date.",
        linkText: "Compare MOT prices — BookMyGarage",
        linkHref: bmgLink,
        partnerId: "bookMyGarage",
        trackingContext: "action-mot-expiring",
      });
    }

    // 3. Tax SORN/Untaxed
    if (isSornOrUntaxed) {
      prompts.push({
        variant: "warning",
        icon: <Info className="w-5 h-5 text-amber-400" />,
        title: `Vehicle is ${data.taxStatus === "SORN" ? "SORN'd" : "untaxed"}`,
        description: "This vehicle cannot be driven or parked on public roads without valid tax.",
        linkText: "Tax this vehicle on GOV.UK",
        linkHref: PARTNER_LINKS.govTaxVehicle.url,
        partnerId: "govTaxVehicle",
        trackingContext: "action-sorn-untaxed",
      });
    }

    // 4. Has advisories (only if MOT not expired)
    if (hasAdvisories) {
      prompts.push({
        variant: "info",
        icon: <Info className="w-5 h-5 text-blue-400" />,
        title: `${latestAdvisoryCount} MOT advisor${latestAdvisoryCount !== 1 ? "ies" : "y"} on record`,
        description: "Advisories aren't failures, but may need attention before your next test.",
        linkText: "Find a garage — BookMyGarage",
        linkHref: bmgLink,
        partnerId: "bookMyGarage",
        trackingContext: "action-advisories",
      });
    }

    // 5. Insurance group lookup (low priority — only if space)
    if (prompts.length < 3) {
      const makeModel = data.make && data.model ? `${data.make} ${data.model}` : "";
      const parkersQuery = makeModel ? encodeURIComponent(makeModel.toLowerCase()) : "";
      prompts.push({
        variant: "subtle",
        icon: <Shield className="w-5 h-5 text-slate-400" />,
        title: "Check your insurance group",
        description: "Insurance groups (1–50) affect your premium. Look up this vehicle's group rating for free.",
        linkText: "Check insurance group — Parkers",
        linkHref: `https://www.parkers.co.uk/car-insurance/insurance-groups/${parkersQuery ? `?q=${parkersQuery}` : ""}`,
        partnerId: "parkersInsurance",
        trackingContext: "action-insurance-group",
      });
    }

    return prompts.slice(0, 3);
  }, [data, isOver3Years, motDaysUntilExpiry, latestAdvisoryCount]);

  const insights = useMemo((): Insight[] => {
    if (!data) return [];

    const result: Insight[] = [];

    const isUnder3Years = !isOver3Years && !!data.yearOfManufacture;

    if (isUnder3Years) {
      result.push({
        tone: "good",
        title: "Under 3 years old — no MOT required yet",
        detail: `First MOT due around ${addYearsToYearMonth(data.monthOfFirstRegistration ?? "", 3) ?? "?"} (month/year only—check V5C for exact date).`,
      });
    }

    // ULEZ insight — only for non-compliant (the ULEZ card handles compliant/exempt display)
    if (ulezResult && ulezResult.status === "non-compliant") {
      result.push({
        tone: "risk",
        title: "Likely not ULEZ compliant",
        detail: `${ulezResult.reason}. Daily charges apply in London and other Clean Air Zones.`,
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

    // VED road tax insight
    if (vedResult && vedResult.estimatedAnnualRate !== null) {
      const sixMonthText = vedResult.estimatedSixMonthRate !== null ? ` (£${vedResult.estimatedSixMonthRate} for 6 months)` : "";
      result.push({
        tone: "info",
        title: `Estimated road tax: £${vedResult.estimatedAnnualRate}/year${sixMonthText}`,
        detail: vedResult.band ? `${vedResult.band}. ${vedResult.details.split(".")[0]}.` : vedResult.details,
      });
    }

    // Fuel economy insight
    if (fuelEconomy) {
      const parts: string[] = [`Combined: ${fuelEconomy.combinedMpg.toFixed(1)} MPG`];
      if (fuelEconomy.urbanMpg) parts.push(`Urban: ${fuelEconomy.urbanMpg.toFixed(1)} MPG`);
      if (fuelEconomy.extraUrbanMpg) parts.push(`Extra-urban: ${fuelEconomy.extraUrbanMpg.toFixed(1)} MPG`);
      parts.push(`~£${fuelEconomy.estimatedAnnualCost}/year fuel`);
      result.push({
        tone: fuelEconomy.combinedMpg >= 50 ? "good" : fuelEconomy.combinedMpg < 35 ? "warn" : "info",
        title: `Estimated ${fuelEconomy.combinedMpg.toFixed(1)} MPG (combined)`,
        detail: `${parts.join(" · ")}${fuelEconomy.matchType !== "exact" ? ". Estimate based on similar model." : ""}`,
      });
    }

    // NCAP safety rating insight
    if (ncapRating) {
      const starText = ncapRating.overallStars === 5 ? "Top safety rating" : ncapRating.overallStars >= 4 ? "Good safety rating" : ncapRating.overallStars >= 3 ? "Average safety rating" : "Below-average safety rating";
      result.push({
        tone: ncapRating.overallStars >= 4 ? "good" : ncapRating.overallStars >= 3 ? "info" : "warn",
        title: `Euro NCAP: ${ncapRating.overallStars} star${ncapRating.overallStars !== 1 ? "s" : ""} (${ncapRating.yearTested})`,
        detail: `${starText}. Adult ${ncapRating.adultOccupant}%, Child ${ncapRating.childOccupant}%, Pedestrian ${ncapRating.pedestrian}%, Safety Assist ${ncapRating.safetyAssist}%.`,
      });
    }

    // Recalls insight
    if (recalls.length > 0) {
      result.push({
        tone: "risk",
        title: `${recalls.length} safety recall${recalls.length !== 1 ? "s" : ""} found`,
        detail: "Check the Safety Recalls section below for details. Recall repairs are always free at authorised dealers.",
      });
    }

    // Valuation insight
    if (valuationResult) {
      result.push({
        tone: "info",
        title: `Estimated value: £${valuationResult.rangeLow.toLocaleString()} – £${valuationResult.rangeHigh.toLocaleString()}`,
        detail: `Based on ${valuationResult.sources.join(", ")}. See the full valuation breakdown below.`,
      });
    }

    return result;
  }, [data, isOver3Years, ulezResult, vedResult, fuelEconomy, ncapRating, recalls, valuationResult]);

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

  function dismissShareToast() {
    if (shareToastTimer.current) clearTimeout(shareToastTimer.current);
    setShareToastDismissing(true);
    setTimeout(() => {
      setShareToastVisible(false);
      setShareToastDismissing(false);
    }, 200);
  }

  async function handleShareToastClick() {
    if (isMobileDevice()) {
      await triggerShare();
      dismissShareToast();
    } else {
      const ok = await triggerShare();
      if (ok) {
        setShareCopied(true);
        setTimeout(() => {
          setShareCopied(false);
          dismissShareToast();
        }, 2000);
      }
    }
  }

  function dismissSharePrompt() {
    setDownloadSharePrompt(false);
    setSharePromptDismissed(true);
  }

  async function handleDownloadShare() {
    if (isMobileDevice()) {
      await triggerShare();
      dismissSharePrompt();
    } else {
      const ok = await triggerShare();
      if (ok) {
        setDownloadShareCopied(true);
        setTimeout(() => {
          setDownloadShareCopied(false);
          dismissSharePrompt();
        }, 2000);
      }
    }
  }

  async function handleFooterShare() {
    if (isMobileDevice()) {
      await triggerShare();
    } else {
      const ok = await triggerShare();
      if (ok) showToast("Link copied to clipboard");
    }
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
    setSharePromptDismissed(false);
    setDownloadSharePrompt(false);

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
          localStorage.setItem("fpcRecent", JSON.stringify(updated));
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

  function loadFavorites() {
    const stored = localStorage.getItem("fpc-favorites");
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
      localStorage.setItem("fpc-favorites", JSON.stringify(faves));
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
    setFavorites([]);
    saveFavoritesToStorage([]);
    showToast("Favorites cleared");
  }

  function loadMyVehicles() {
    const stored = localStorage.getItem("fpc-my-vehicles");
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
      localStorage.setItem("fpc-my-vehicles", JSON.stringify(vehicles));
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
PRODID:-//FreePlateCheck//FreePlateCheck//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Free Plate Check - MOT, Tax & Insurance Reminders
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
UID:fpc-mot-${vehicle.registrationNumber}-${year}-${month}@freeplatecheck.co.uk
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${nextDateStr}
SUMMARY:MOT Due - ${vehicle.registrationNumber} (${vehicle.make})
DESCRIPTION:MOT expires for ${vehicle.make} ${[vehicle.model, vehicle.variant].filter(Boolean).join(" ")} (${vehicle.registrationNumber})
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
UID:fpc-tax-${vehicle.registrationNumber}-${year}-${month}@freeplatecheck.co.uk
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${nextDateStr}
SUMMARY:Tax Due - ${vehicle.registrationNumber} (${vehicle.make})
DESCRIPTION:Vehicle tax expires for ${vehicle.make} ${[vehicle.model, vehicle.variant].filter(Boolean).join(" ")} (${vehicle.registrationNumber})
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

        icsContent += `BEGIN:VEVENT\nUID:fpc-insurance-${vehicle.registrationNumber}-${startYear}-${startMonth}@freeplatecheck.co.uk\nDTSTAMP:${dtstamp}\nDTSTART;VALUE=DATE:${startDateStr}\nDTEND;VALUE=DATE:${endDateStr}\nSUMMARY:Insurance Renewal Window - ${vehicle.registrationNumber} (${vehicle.make})\nDESCRIPTION:Best time to renew your car insurance for ${vehicle.make} ${[vehicle.model, vehicle.variant].filter(Boolean).join(" ")} (${vehicle.registrationNumber}).\\n\\nSweet Spot: Renew 20-27 days BEFORE your policy expires to get the best rates and coverage options. This 7-day window marks the optimal renewal period.\\n\\nPolicy expires: ${formatDate(insuranceDate)}\nSEQUENCE:0\nSTATUS:CONFIRMED\nTRANSP:TRANSPARENT\nEND:VEVENT\n`;
      }
    });

    icsContent += `END:VCALENDAR`;

    // Download the file
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `free-plate-check-calendar-${new Date().getTime()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Calendar file ready! Import into Outlook, Apple Calendar, or Google Calendar.`);
  }

  function clearAllMyVehicles() {
    if (myVehicles.length === 0) return;
    setMyVehicles([]);
    saveMyVehiclesToStorage([]);
    showToast("My Vehicles cleared");
  }

  function handleClearConfirm(section: string) {
    if (confirmingClear === section) {
      // Second click — perform the clear
      if (confirmClearTimeout.current) clearTimeout(confirmClearTimeout.current);
      setConfirmingClear(null);
      if (section === "favorites") clearAllFavorites();
      else if (section === "mycars") clearAllMyVehicles();
      else if (section === "recent") {
        localStorage.removeItem("fpcRecent");
        setRecentLookups([]);
        showToast("History cleared");
      }
    } else {
      // First click — enter confirming state
      if (confirmClearTimeout.current) clearTimeout(confirmClearTimeout.current);
      setConfirmingClear(section);
      confirmClearTimeout.current = setTimeout(() => setConfirmingClear(null), 4000);
    }
  }

  function downloadTXT() {
    if (!data) return;

    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const dateStr = new Date().toISOString().slice(0, 10);
    const motInsightsData = data.motTests ? calculateMotInsights(data.motTests) : null;

    const sep = "────────────────────────────────────────────────────────────────";
    const dblSep = "═════════════════════════════════════════════════════════════════";

    const lines: string[] = [
      "╔════════════════════════════════════════════════════════════════╗",
      "║          FREE PLATE CHECK - VEHICLE REPORT                    ║",
      "╚════════════════════════════════════════════════════════════════╝",
      "",
      `Generated: ${formattedDate}`,
      `Registration: ${data.registrationNumber}`,
      "",

      // ── VEHICLE DETAILS ──
      sep, "VEHICLE DETAILS", sep, "",
      `Make & Model:        ${data.make} ${[data.model, data.variant].filter(Boolean).join(" ")}`,
      `Year:                ${data.yearOfManufacture || "—"}`,
      `Colour:              ${data.colour || "—"}`,
      `Fuel Type:           ${data.fuelType || "—"}`,
      `Engine Capacity:     ${data.engineCapacity ? `${data.engineCapacity}cc` : "—"}`,
      `CO2 Emissions:       ${data.co2Emissions ? `${data.co2Emissions}g/km` : "—"}`,
      `Euro Status:         ${data.euroStatus || "—"}`,
      `Real Driving Emissions: ${data.realDrivingEmissions != null ? `RDE2 Step ${data.realDrivingEmissions}` : "—"}`,
      `Wheelplan:           ${data.wheelplan || "—"}`,
      `Revenue Weight:      ${data.revenueWeight ? `${data.revenueWeight} kg` : "—"}`,
      `Type Approval:       ${data.typeApproval || "—"}`,
      `Automated Vehicle:   ${data.automatedVehicle != null ? (data.automatedVehicle ? "Yes" : "No") : "—"}`,
      "",

      // ── COMPLIANCE STATUS ──
      sep, "COMPLIANCE STATUS", sep, "",
      `Tax Status:          ${data.taxStatus || "—"}`,
      `Tax Due Date:        ${formatDate(data.taxDueDate)}`,
      `Additional Rate End: ${formatDate(data.additionalRateEndDate)}`,
      `MOT Status:          ${data.motStatus || "—"}`,
      `MOT Expiry:          ${formatDate(data.motExpiryDate)}`,
      `MOT Data Updated:    ${formatDate(data.motTestsLastUpdated)}`,
      `First Registered:    ${data.monthOfFirstRegistration || data.dateOfFirstRegistration || "—"}`,
      `Last V5C Issued:     ${formatDate(data.dateOfLastV5CIssued)}`,
      `Marked for Export:   ${data.markedForExport != null ? (data.markedForExport ? "Yes" : "No") : "—"}`,
      "",
    ];

    // ── ULEZ ──
    if (ulezResult && ulezResult.status !== "unknown") {
      lines.push(sep, "ULEZ COMPLIANCE", sep, "");
      const statusLabel = ulezResult.status === "exempt" ? "Exempt" : ulezResult.status === "compliant" ? "Compliant" : "Non-compliant";
      lines.push(`Status:              ${statusLabel}`);
      lines.push(`Reason:              ${ulezResult.reason}`);
      lines.push(`Confidence:          ${ulezResult.confidence}`);
      if (ulezResult.status === "non-compliant" && ulezResult.cleanAirZones && ulezResult.cleanAirZones.length > 0) {
        lines.push("", "Clean Air Zone Daily Charges:");
        for (const zone of ulezResult.cleanAirZones) {
          lines.push(`  ${zone.name}: ${zone.dailyCharge}`);
        }
      }
      lines.push("");
    }

    // ── VED ──
    if (vedResult && vedResult.estimatedAnnualRate !== null) {
      lines.push(sep, "VED ROAD TAX", sep, "");
      lines.push(`Estimated:           £${vedResult.estimatedAnnualRate}/year${vedResult.estimatedSixMonthRate != null ? ` (£${vedResult.estimatedSixMonthRate} for 6 months)` : ""}`);
      if (vedResult.band) lines.push(`Band:                ${vedResult.band}`);
      lines.push("");
    }

    // ── FUEL ECONOMY ──
    if (fuelEconomy) {
      lines.push(sep, "FUEL ECONOMY", sep, "");
      lines.push(`Combined:            ${fuelEconomy.combinedMpg.toFixed(1)} MPG`);
      if (fuelEconomy.urbanMpg) lines.push(`Urban:               ${fuelEconomy.urbanMpg.toFixed(1)} MPG`);
      if (fuelEconomy.extraUrbanMpg) lines.push(`Extra-urban:         ${fuelEconomy.extraUrbanMpg.toFixed(1)} MPG`);
      lines.push(`Est. Annual Cost:    £${fuelEconomy.estimatedAnnualCost}`);
      lines.push("");
    }

    // ── NCAP ──
    if (ncapRating) {
      lines.push(sep, "EURO NCAP SAFETY RATING", sep, "");
      lines.push(`Overall:             ${ncapRating.overallStars}/5 stars (tested ${ncapRating.yearTested})`);
      if (ncapRating.adultOccupant != null) lines.push(`Adult Occupant:      ${ncapRating.adultOccupant}%`);
      if (ncapRating.childOccupant != null) lines.push(`Child Occupant:      ${ncapRating.childOccupant}%`);
      if (ncapRating.pedestrian != null) lines.push(`Pedestrian:          ${ncapRating.pedestrian}%`);
      if (ncapRating.safetyAssist != null) lines.push(`Safety Assist:       ${ncapRating.safetyAssist}%`);
      lines.push("");
    }

    // ── VALUATION ──
    if (valuationResult) {
      lines.push(sep, "VEHICLE VALUATION", sep, "");
      lines.push(`Estimated Range:     £${valuationResult.rangeLow.toLocaleString()} – £${valuationResult.rangeHigh.toLocaleString()}`);
      const confLabel = valuationResult.confidence === "high" ? "High" : valuationResult.confidence === "medium" ? "Medium" : "Low";
      lines.push(`Confidence:          ${confLabel}`);
      lines.push(`Sources:             ${valuationResult.sources.join(", ")}`);
      if (valuationResult.ebayMinPrice && valuationResult.ebayMaxPrice) {
        lines.push(`Asking Prices:       £${valuationResult.ebayMinPrice.toLocaleString()} – £${valuationResult.ebayMaxPrice.toLocaleString()}`);
      }
      if (valuationResult.marketSupply) {
        const supplyLabel = valuationResult.marketSupply === "good" ? "Good" : valuationResult.marketSupply === "moderate" ? "Moderate" : "Limited";
        const countSuffix = valuationResult.ebayTotalListings ? ` (${valuationResult.ebayTotalListings} listings)` : "";
        lines.push(`Market Supply:       ${supplyLabel}${countSuffix}`);
      }
      lines.push("");
    }

    // ── SAFETY RECALLS ──
    lines.push(sep, "SAFETY RECALLS", sep, "");
    if (recalls.length === 0) {
      lines.push("No known safety recalls found for this vehicle.");
    } else {
      lines.push(`${recalls.length} recall${recalls.length !== 1 ? "s" : ""} found:`);
      lines.push("");
      for (const r of recalls) {
        lines.push(`  Date:    ${r.recallDate}`);
        lines.push(`  Ref:     ${r.recallNumber}`);
        lines.push(`  Defect:  ${r.defect}`);
        lines.push(`  Remedy:  ${r.remedy}`);
        lines.push("");
      }
    }
    lines.push("");

    // ── KEY INSIGHTS (all) ──
    lines.push(sep, "KEY INSIGHTS", sep, "");
    insights.forEach((insight, idx) => {
      lines.push(`${idx + 1}. ${insight.title}`);
      lines.push(`   ${insight.detail}`);
      lines.push("");
    });

    // ── MILEAGE WARNINGS ──
    if (motInsightsData && motInsightsData.mileageWarnings.length > 0) {
      lines.push(sep, "MILEAGE WARNINGS", sep, "");
      for (const w of motInsightsData.mileageWarnings) {
        lines.push(`  ${w}`);
      }
      lines.push("");
    }

    // ── MOT HISTORY ──
    if (data.motTests && data.motTests.length > 0) {
      lines.push(sep, "MOT HISTORY", sep, "");
      lines.push(`${data.motTests.length} test${data.motTests.length !== 1 ? "s" : ""} on record`);
      if (motInsightsData) {
        lines.push(`Pass rate: ${motInsightsData.passRate}% (${motInsightsData.passedTests}/${motInsightsData.totalTests})`);
        if (motInsightsData.avgMilesPerYear > 0) {
          lines.push(`Avg miles/year: ${motInsightsData.avgMilesPerYear.toLocaleString()}`);
        }
      }
      lines.push("");

      for (const test of data.motTests) {
        const mileage = test.odometer?.value ? `${test.odometer.value.toLocaleString()} miles` : "—";
        lines.push(`  ${formatDate(test.completedDate)}  ${test.testResult}  ${mileage}${test.motTestNumber ? `  Ref: ${test.motTestNumber}` : ""}`);
        const items = test.rfrAndComments || [];
        for (const item of items) {
          lines.push(`    [${item.type}] ${item.text}`);
        }
        if (items.length > 0) lines.push("");
      }
      lines.push("");
    }

    // ── CHECKLISTS ──
    const checklistTitle =
      checklistRole === "owner" ? "MY CAR CHECKLIST" :
      checklistRole === "buyer" ? "BUYING CHECKLIST" :
      "SELLING CHECKLIST";

    lines.push(sep, checklistTitle, sep, "");
    checklist.forEach((item, idx) => {
      lines.push(`${idx + 1}. [ ] ${item}`);
    });
    lines.push("");

    // ── FOOTER ──
    lines.push(dblSep, "");
    lines.push("Created with Free Plate Check");
    lines.push("https://freeplatecheck.co.uk");
    lines.push("");
    lines.push("Always verify vehicle details with the seller and official");
    lines.push("documents before making any purchase.");
    lines.push("");
    lines.push("Privacy: Registration numbers are hashed and not stored.");
    lines.push(dblSep);

    const reportContent = lines.join("\n");

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const reg = data.registrationNumber.replace(/\s+/g, "");
    link.download = `FPC-Report-${reg}-${dateStr}.txt`;
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
      const { generateVehicleReport } = await import("@/lib/generateReport");

      // Build checklists for all three roles
      const ownerItems = [
        "MOT status is valid",
        "Tax status is current",
        "Service history up to date",
        "Insurance is active",
        "Check for recalls",
      ];

      const buyerItems = [
        "Service history verified",
        "VIN matches logbook (V5C)",
        "Tyres: tread and wear acceptable",
        "History check: write-offs, theft, finance",
        "Get pre-purchase mechanic inspection",
        "Arrange new insurance quotes",
        "Check warranty or guarantee",
        "Test drive thoroughly",
      ];
      if (isOver3Years && (!data.motStatus || data.motStatus.toLowerCase() !== "valid")) {
        buyerItems.unshift("MOT valid (car is 3+ years old)");
      }

      const sellerItems = [
        "MOT status is current",
        "Tax status is current",
        "Gather service history and receipts",
        "Cancel existing insurance",
        "Verify no outstanding finance",
        "Prepare V5C logbook",
        "Get recent valuation",
        "Take clear photos of vehicle",
      ];

      const blob = await generateVehicleReport({
        data,
        motInsights: data.motTests ? calculateMotInsights(data.motTests) : null,
        checklist: { owner: ownerItems, buyer: buyerItems, seller: sellerItems },
        parsedModel: (parsedModel || vcaParsedModel) ? {
          bodyStyle: bodyStyle,
          trim: parsedModel?.trim || vcaParsedModel?.trim || null,
          driveType: parsedModel?.driveType || vcaParsedModel?.driveType || null,
          fuelIndicator: parsedModel?.fuelIndicator || vcaParsedModel?.fuelIndicator || null,
          transmission: parsedModel?.transmission || vcaParsedModel?.transmission || fuelEconomy?.transmission || null,
          engineDesc: parsedModel?.engineDesc || vcaParsedModel?.engineDesc || null,
        } : null,
        ulezResult,
        vedResult,
        fuelEconomy,
        ncapRating,
        recalls,
        valuation: valuationResult ? {
          rangeLow: valuationResult.rangeLow,
          rangeHigh: valuationResult.rangeHigh,
          confidence: valuationResult.confidence,
          sources: valuationResult.sources,
          estimatedValue: valuationResult.estimatedValue,
          ebayMinPrice: valuationResult.ebayMinPrice,
          ebayMaxPrice: valuationResult.ebayMaxPrice,
          ebayTotalListings: valuationResult.ebayTotalListings,
          ebayDominantTransmission: valuationResult.ebayDominantTransmission,
          ebayDominantBodyType: valuationResult.ebayDominantBodyType,
          marketSupply: valuationResult.marketSupply,
          mileageAdjustmentPercent: valuationResult.mileageAdjustmentPercent,
          conditionAdjustmentPercent: valuationResult.conditionAdjustmentPercent,
          colourAdjustmentPercent: valuationResult.colourAdjustmentPercent,
          disclaimer: valuationResult.disclaimer,
        } : null,
      });

      const reg = data.registrationNumber.replace(/\s+/g, "");
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `FPC-Report-${reg}-${dateStr}.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });

      // Best path: Web Share API with file support (iOS 15+, Android Chrome)
      // Opens native share sheet — user can "Save to Files", AirDrop, etc.
      // Stays on the current page — no tab navigation.
      if (isMobileDevice() && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (shareErr: unknown) {
          // User cancelled the share sheet — not an error
          if (shareErr instanceof Error && shareErr.name !== "AbortError") {
            console.error("Share failed:", shareErr);
          }
        }
      } else {
        // Desktop fallback: programmatic <a> download
        const blobUrl = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }

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
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Is this car check really free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, completely free. Free Plate Check lets you look up any UK vehicle at no cost — no signup, no account, no hidden charges. We use official DVLA and MOT data to show you tax status, MOT history, mileage records and vehicle details."
              }
            },
            {
              "@type": "Question",
              "name": "What information does a free plate check show?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You'll see the vehicle's make, model, colour, fuel type, engine size, CO2 emissions, year of manufacture, current tax and MOT status, full MOT history with advisories and failures, and mileage recorded at each MOT test. You also get checklists tailored to buyers, sellers and owners."
              }
            },
            {
              "@type": "Question",
              "name": "How do I check my car's MOT history?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Enter your registration number on Free Plate Check and you'll see every MOT test result since 2005 — including pass/fail outcomes, advisories, failures, mileage readings and the next MOT due date. It's free, instant and works for any UK-registered vehicle."
              }
            },
            {
              "@type": "Question",
              "name": "Do you store my registration number?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. We do not store registration numbers or any information that identifies which vehicles you look up. Your search is sent directly to the DVLA and MOT APIs, and nothing is saved on our servers. Recent lookups are stored only in your browser's local storage, which you can clear at any time."
              }
            }
          ]
        }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Free Plate Check",
          "url": "https://www.freeplatecheck.co.uk",
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "Web",
          "featureList": "MOT History Check, Tax Status Check, Mileage Check, ULEZ Compliance Check, Safety Recall Check, VED Road Tax Calculator, Fuel Economy Lookup, Euro NCAP Ratings, Vehicle Valuation Estimator, Vehicle Comparison, PDF Report Download",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "GBP"
          }
        }) }}
      />

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

      {/* Full-screen logo reveal overlay */}
      {showLogoReveal && data?.make && getMakeLogoPath(data.make) && (
        <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
          <img
            src={getMakeLogoPath(data.make)!}
            alt=""
            className="w-[60vw] h-[60vh] sm:w-[50vw] sm:h-[50vh] max-w-none max-h-none object-contain animate-logoReveal"
            aria-hidden="true"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

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
        @keyframes slideUpIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDownOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(16px);
          }
        }
        .animate-slideUpIn {
          animation: slideUpIn 0.25s ease-out forwards;
        }
        .animate-slideDownOut {
          animation: slideDownOut 0.2s ease-in forwards;
        }
        @keyframes logoReveal {
          0% { opacity: 0; transform: scale(0.9); filter: grayscale(1) brightness(1.5) blur(8px); }
          15% { opacity: 0.12; transform: scale(1); filter: grayscale(1) brightness(1.5) blur(4px); }
          40% { opacity: 0.08; transform: scale(1.03); filter: grayscale(1) brightness(1.5) blur(6px); }
          100% { opacity: 0; transform: scale(1.08); filter: grayscale(1) brightness(1.5) blur(12px); }
        }
        .animate-logoReveal {
          animation: logoReveal 3.5s ease-out forwards;
        }
      `}</style>

      <div className="mx-auto w-full max-w-3xl px-5 sm:px-7 py-8 sm:py-12 safe-area-inset relative z-10">
        {/* HEADER WITH BRAND */}
        <header className="mb-10 sm:mb-12">
          <div className="flex items-baseline gap-2 mb-4">
            <Zap className="w-6 h-6 text-blue-400" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Free Plate Check
            </h1>
          </div>
          <p className="text-slate-300 text-lg font-medium">Look up any UK vehicle instantly. Tax, MOT & checklists for owners, buyers & sellers.</p>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xl">
            Your data is private. We don't store registration numbers or track who you are.
          </p>
          <div className="mt-3">
            <a href="/blog" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Guides &amp; Tips</a>
          </div>

{/* OUR PARTNERS */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Our Partners</span>
            <span className="text-slate-700">·</span>
            <a href={PARTNER_LINKS.bookMyGarage.url} target="_blank" rel={getPartnerRel(PARTNER_LINKS.bookMyGarage)} onClick={() => trackPartnerClick("bookMyGarage", "header")} className="inline-flex items-center opacity-70 hover:opacity-100 transition-opacity" title={PARTNER_LINKS.bookMyGarage.description}>
              <img src="/bmg-logo.png" alt="BookMyGarage" className="h-5" loading="lazy" />
            </a>
          </div>

          {/* TABBED SECTION: Recent / Saved / My Cars */}
          {(recentLookups.length > 0 || favorites.length > 0 || myVehicles.length > 0) && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              {/* Tab bar */}
              <div className="flex gap-1 mb-4 border-b border-slate-700/50">
                <button
                  onClick={() => { setActiveVehicleTab("recent"); localStorage.setItem("fpc-active-tab", "recent"); }}
                  className={`pb-2 px-3 py-2 text-sm font-medium transition-colors ${activeVehicleTab === "recent" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-500 hover:text-slate-400"}`}
                >
                  Recent
                </button>
                <button
                  onClick={() => { setActiveVehicleTab("saved"); localStorage.setItem("fpc-active-tab", "saved"); }}
                  className={`pb-2 px-3 py-2 text-sm font-medium transition-colors ${activeVehicleTab === "saved" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-500 hover:text-slate-400"}`}
                >
                  Saved{favorites.length > 0 ? ` (${favorites.length})` : ""}
                </button>
                <button
                  onClick={() => { setActiveVehicleTab("mycars"); localStorage.setItem("fpc-active-tab", "mycars"); }}
                  className={`pb-2 px-3 py-2 text-sm font-medium transition-colors ${activeVehicleTab === "mycars" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-500 hover:text-slate-400"}`}
                >
                  My Cars{myVehicles.length > 0 ? ` (${myVehicles.length})` : ""}
                </button>
              </div>

              {/* Recent tab */}
              {activeVehicleTab === "recent" && (
                <div>
                  {recentLookups.length > 0 ? (
                    <>
                      <div className="flex items-center justify-end mb-3">
                        <button
                          onClick={() => handleClearConfirm("recent")}
                          className={`text-xs transition-colors ${confirmingClear === "recent" ? "text-red-400 font-semibold" : "text-slate-500 hover:text-slate-400"}`}
                        >
                          {confirmingClear === "recent" ? "Confirm?" : "Clear"}
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
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Your recent lookups will appear here</p>
                  )}
                </div>
              )}

              {/* Saved tab */}
              {activeVehicleTab === "saved" && (
                <div>
                  {favorites.length > 0 ? (
                    <>
                      <div className="flex items-center justify-end mb-3">
                        <button
                          onClick={() => handleClearConfirm("favorites")}
                          className={`text-xs transition-colors ${confirmingClear === "favorites" ? "text-red-400 font-semibold" : "text-slate-500 hover:text-slate-400"}`}
                        >
                          {confirmingClear === "favorites" ? "Confirm?" : "Clear All"}
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
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Save vehicles from results to compare later</p>
                  )}
                </div>
              )}

              {/* My Cars tab */}
              {activeVehicleTab === "mycars" && (
                <div>
                  {myVehicles.length > 0 ? (
                    <>
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <button
                          onClick={() => generateCalendarFile()}
                          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Export MOT, Tax and Insurance dates to calendar"
                        >
                          Export Calendar
                        </button>
                        <button
                          onClick={() => handleClearConfirm("mycars")}
                          className={`text-xs transition-colors ${confirmingClear === "mycars" ? "text-red-400 font-semibold" : "text-slate-500 hover:text-slate-400"}`}
                        >
                          {confirmingClear === "mycars" ? "Confirm?" : "Clear"}
                        </button>
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
                                  {vehicle.make} {[vehicle.model, vehicle.variant].filter(Boolean).join(" ")} — {vehicle.registrationNumber}
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
                                    Edit insurance
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
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Mark a vehicle as yours to track MOT & tax dates</p>
                  )}
                </div>
              )}
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
                  {compareData1.make} {[compareData1.model, compareData1.variant].filter(Boolean).join(" ")} — {compareData1.registrationNumber}
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
                  {compareData2.make} {[compareData2.model, compareData2.variant].filter(Boolean).join(" ")} — {compareData2.registrationNumber}
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
            {/* VEHICLE JSON-LD */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Car",
                "name": [data.make, data.model, data.variant].filter(Boolean).join(" "),
                "manufacturer": data.make || undefined,
                "model": data.model || undefined,
                "vehicleConfiguration": data.fuelType || undefined,
                "color": data.colour || undefined,
                "vehicleEngine": data.engineCapacity ? {
                  "@type": "EngineSpecification",
                  "engineDisplacement": {
                    "@type": "QuantitativeValue",
                    "value": data.engineCapacity,
                    "unitCode": "CMQ"
                  }
                } : undefined,
                "dateVehicleFirstRegistered": data.dateOfFirstRegistration || undefined,
                "modelDate": data.yearOfManufacture ? `${data.yearOfManufacture}` : undefined,
                "fuelType": data.fuelType || undefined,
              }) }}
            />

            {/* VEHICLE HEADER */}
            <DataReveal delay={0} className="relative z-20">
              <div className="mb-8 p-6 bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 rounded-lg backdrop-blur relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="mb-4">
                      <div className="bg-yellow-300 border-2 border-yellow-800 rounded-sm px-2 py-2 inline-flex items-center justify-center">
                        <p className="text-lg font-black text-black tracking-widest" style={{ fontFamily: "Arial Black, sans-serif", letterSpacing: "0.08em", width: "fit-content" }}>
                          {data.registrationNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="flex-1 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wide">Make</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-100">{data.make || "—"}</p>
                      </div>
                      <div className="flex-1 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wide">Model</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-100">
                          {data.model || "—"}
                          {data.variant && (
                            <span className="text-lg font-medium text-slate-300 ml-2">{data.variant}</span>
                          )}
                        </p>
                        {(bodyStyle || parsedModel?.trim || vcaParsedModel?.trim || parsedModel?.driveType || vcaParsedModel?.driveType) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {bodyStyle && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600/50 text-slate-300 border border-slate-500/50">{bodyStyle}</span>
                            )}
                            {(parsedModel?.trim || vcaParsedModel?.trim) && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600/50 text-slate-300 border border-slate-500/50">{parsedModel?.trim || vcaParsedModel?.trim}</span>
                            )}
                            {(parsedModel?.driveType || vcaParsedModel?.driveType) && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600/50 text-slate-300 border border-slate-500/50">{parsedModel?.driveType || vcaParsedModel?.driveType}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-4">DVLA data • {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 overflow-visible">
                    {/* Save button */}
                    <button
                      onClick={isFavorited(data.registrationNumber) ? () => removeFavorite(data.registrationNumber) : addFavorite}
                      className={`border rounded-lg px-3 py-2.5 text-sm transition-colors flex items-center gap-2 min-h-[44px] ${
                        isFavorited(data.registrationNumber)
                          ? "border-red-500/50 bg-red-500/10 text-red-400"
                          : "border-slate-600 hover:border-slate-500 bg-transparent hover:bg-slate-700/50 text-slate-300 hover:text-slate-100"
                      }`}
                      title={isFavorited(data.registrationNumber) ? "Remove from saved vehicles" : "Bookmark this vehicle to review later"}
                    >
                      <Heart className="w-4 h-4" fill={isFavorited(data.registrationNumber) ? "currentColor" : "none"} />
                      Save
                    </button>

                    {/* My Car button */}
                    <button
                      onClick={isMyVehicle(data.registrationNumber) ? () => removeFromMyVehicles(data.registrationNumber) : addToMyVehicles}
                      className={`border rounded-lg px-3 py-2.5 text-sm transition-colors flex items-center gap-2 min-h-[44px] ${
                        isMyVehicle(data.registrationNumber)
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-600 hover:border-slate-500 bg-transparent hover:bg-slate-700/50 text-slate-300 hover:text-slate-100"
                      }`}
                      title={isMyVehicle(data.registrationNumber) ? "Remove from My Vehicles" : "Mark as your car to track MOT & tax reminders"}
                    >
                      <Car className="w-4 h-4" />
                      {isMyVehicle(data.registrationNumber) ? "My Car ✓" : "My Car"}
                    </button>

                    {/* Report button */}
                    <div className="relative">
                      <button
                        onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                        className="w-full border border-slate-600 hover:border-slate-500 bg-transparent hover:bg-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:text-slate-100 transition-colors flex items-center gap-2 min-h-[44px]"
                        title="Download the full vehicle report as PDF or text"
                      >
                        <FileText className="w-4 h-4" />
                        Report
                      </button>

                      {downloadMenuOpen && (
                        <div className="absolute left-0 bottom-full mb-1 w-40 bg-slate-950 border border-slate-500 rounded-lg shadow-2xl z-50 py-2">
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

                    {/* Compare button */}
                    <button
                      onClick={() => {
                        if (recentLookups.length >= 2) {
                          setComparisonMode(true);
                          setCompareData1(null);
                          setCompareData2(null);
                        } else {
                          showToast("Look up another vehicle to compare");
                        }
                      }}
                      className="border border-slate-600 hover:border-slate-500 bg-transparent hover:bg-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:text-slate-100 transition-colors flex items-center gap-2 min-h-[44px]"
                      title="Compare this vehicle side-by-side with another recent lookup"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      Compare
                    </button>
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
                  {bodyStyle && (
                    <IconBadge icon={<Car className="w-5 h-5" />} label="Body" value={bodyStyle} />
                  )}
                  {fuelEconomy?.enginePowerPS && (
                    <IconBadge icon={<Zap className="w-5 h-5" />} label="Power" value={`${fuelEconomy.enginePowerPS} PS${fuelEconomy.enginePowerKW ? ` (${fuelEconomy.enginePowerKW} kW)` : ""}`} />
                  )}
                </div>

                {/* Collapsible Technical Details */}
                {(() => {
                  const techRows: { label: string; value: string; warn?: boolean }[] = [];
                  if (parsedModel?.trim || vcaParsedModel?.trim) techRows.push({ label: "Trim", value: (parsedModel?.trim || vcaParsedModel?.trim)! });
                  if (parsedModel?.driveType || vcaParsedModel?.driveType) techRows.push({ label: "Drive Type", value: (parsedModel?.driveType || vcaParsedModel?.driveType)! });
                  if (parsedModel?.fuelIndicator || vcaParsedModel?.fuelIndicator) techRows.push({ label: "Engine Type", value: (parsedModel?.fuelIndicator || vcaParsedModel?.fuelIndicator)! });
                  if (fuelEconomy?.enginePowerPS) techRows.push({ label: "Engine Power", value: `${fuelEconomy.enginePowerPS} PS${fuelEconomy.enginePowerKW ? ` / ${fuelEconomy.enginePowerKW} kW` : ""}` });
                  if (fuelEconomy?.transmission) techRows.push({ label: "Transmission", value: fuelEconomy.transmission });
                  else if (parsedModel?.transmission || vcaParsedModel?.transmission) techRows.push({ label: "Transmission", value: (parsedModel?.transmission || vcaParsedModel?.transmission)! });
                  if (data.co2Emissions != null) techRows.push({ label: "CO2 Emissions", value: `${data.co2Emissions} g/km` });
                  if (data.euroStatus) techRows.push({ label: "Euro Status", value: data.euroStatus });
                  if (data.realDrivingEmissions != null) techRows.push({ label: "Real Driving Emissions", value: `RDE2 Step ${data.realDrivingEmissions}` });
                  if (data.monthOfFirstRegistration) techRows.push({ label: "First Registered", value: formatDate(data.monthOfFirstRegistration + "-01") ?? data.monthOfFirstRegistration });
                  if (data.dateOfLastV5CIssued) techRows.push({ label: "Last V5C Issued", value: formatDate(data.dateOfLastV5CIssued) ?? "—" });
                  if (data.wheelplan) techRows.push({ label: "Wheelplan", value: data.wheelplan });
                  if (data.typeApproval) techRows.push({ label: "Type Approval", value: data.typeApproval });
                  if (data.revenueWeight) techRows.push({ label: "Revenue Weight", value: `${data.revenueWeight.toLocaleString()} kg` });
                  if (data.markedForExport) techRows.push({ label: "Marked for Export", value: "Yes", warn: true });
                  if (data.automatedVehicle) techRows.push({ label: "Automated Vehicle", value: "Yes" });

                  if (techRows.length === 0) return null;

                  return (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {showTechnicalDetails ? "Hide" : "Show"} technical details
                      </button>
                      {showTechnicalDetails && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                          {techRows.map((row) => (
                            <div key={row.label} className="flex justify-between text-sm py-1 border-b border-slate-800">
                              <span className="text-slate-400">{row.label}</span>
                              <span className={row.warn ? "text-amber-400 font-medium" : "text-slate-200"}>{row.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </DataReveal>

            {/* STATUS DASHBOARD */}
            <DataReveal delay={100}>
              <div className="mb-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* MOT Badge */}
                  <div className={`p-3 rounded-lg text-center ${getStatusBgClass(getMotStatusColor(data.motStatus, data.motExpiryDate))}`}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">MOT</p>
                    <p className={`text-sm font-bold leading-tight ${{ emerald: "text-emerald-300", amber: "text-amber-300", red: "text-red-300", slate: "text-slate-300" }[getMotStatusColor(data.motStatus, data.motExpiryDate)]}`}>
                      {data.motStatus === "Valid" && motDaysUntilExpiry > 0
                        ? `${motDaysUntilExpiry}d left`
                        : data.motStatus === "Valid" && motDaysUntilExpiry <= 0
                        ? "Expired"
                        : data.motStatus ?? "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">{formatDate(data.motExpiryDate)}</p>
                  </div>

                  {/* Tax Badge */}
                  <div className={`p-3 rounded-lg text-center ${getStatusBgClass(getTaxStatusColor(data.taxStatus, data.taxDueDate))}`}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Tax</p>
                    <p className={`text-sm font-bold leading-tight ${{ emerald: "text-emerald-300", amber: "text-amber-300", red: "text-red-300", slate: "text-slate-300" }[getTaxStatusColor(data.taxStatus, data.taxDueDate)]}`}>
                      {data.taxStatus === "Taxed" && daysUntil(data.taxDueDate) !== null && daysUntil(data.taxDueDate)! > 0
                        ? `${daysUntil(data.taxDueDate)}d left`
                        : data.taxStatus === "Taxed"
                        ? "Overdue"
                        : data.taxStatus === "SORN"
                        ? "SORN"
                        : data.taxStatus ?? "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">{formatDate(data.taxDueDate)}</p>
                  </div>

                  {/* Mileage Badge */}
                  <div className={`p-3 rounded-lg text-center ${getStatusBgClass("slate")}`}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Mileage</p>
                    <p className="text-sm font-bold text-slate-300 leading-tight">
                      {data.motTests?.[0]?.odometer?.value
                        ? data.motTests[0].odometer.value.toLocaleString()
                        : "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">latest MOT</p>
                  </div>

                  {/* Advisories Badge */}
                  <div className={`p-3 rounded-lg text-center ${getStatusBgClass(latestAdvisoryCount > 0 ? "amber" : "emerald")}`}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Advisories</p>
                    <p className={`text-sm font-bold leading-tight ${latestAdvisoryCount > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                      {latestAdvisoryCount > 0 ? latestAdvisoryCount : "Clean"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">latest test</p>
                  </div>
                </div>
              </div>
            </DataReveal>

            {/* ULEZ COMPLIANCE CARD */}
            {ulezResult && ulezResult.status !== "unknown" && (
              <DataReveal delay={120}>
                <div className={`mb-8 p-5 rounded-lg border ${
                  ulezResult.status === "exempt" || ulezResult.status === "compliant"
                    ? "bg-emerald-950/30 border-emerald-800/40"
                    : "bg-red-950/30 border-red-800/40"
                }`}>
                  <div className="flex items-start gap-3">
                    <Leaf className={`w-5 h-5 mt-0.5 ${
                      ulezResult.status === "exempt" || ulezResult.status === "compliant"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-100">ULEZ / Clean Air Zone</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          ulezResult.status === "exempt"
                            ? "bg-emerald-900/50 text-emerald-300"
                            : ulezResult.status === "compliant"
                            ? "bg-emerald-900/50 text-emerald-300"
                            : "bg-red-900/50 text-red-300"
                        }`}>
                          {ulezResult.status === "exempt" ? "Exempt" : ulezResult.status === "compliant" ? "Compliant" : "Non-compliant"}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        ulezResult.status === "exempt" || ulezResult.status === "compliant"
                          ? "text-emerald-200/80"
                          : "text-red-200/80"
                      }`}>
                        {ulezResult.reason}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">{ulezResult.details}</p>
                      {ulezResult.confidence === "estimated" && (
                        <p className="text-xs text-slate-500 mt-1 italic">Estimated from registration date — verify on the TfL checker.</p>
                      )}
                      {ulezResult.cleanAirZones && ulezResult.cleanAirZones.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-red-800/30">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Daily charges in affected zones</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {ulezResult.cleanAirZones.map((zone) => (
                              <div key={zone.name} className="text-xs text-red-300/80">
                                <span className="font-medium">{zone.name}</span>: {zone.dailyCharge}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        <a
                          href="https://tfl.gov.uk/modes/driving/check-your-vehicle/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Check on TfL
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-2">ULEZ compliance calculated using DVLA emission data and published TfL emission standards.</p>
                    </div>
                  </div>
                </div>
              </DataReveal>
            )}

            {/* ACTION PROMPTS */}
            {actionPrompts.length > 0 && (
              <DataReveal delay={150}>
                <div className="mb-8 space-y-3">
                  {actionPrompts.map((prompt, idx) => (
                    <ActionPrompt key={idx} {...prompt} delay={idx * 50} />
                  ))}
                  <p className="text-[11px] text-slate-600">Some links are affiliate links — we may earn a small commission at no extra cost to you.</p>
                </div>
              </DataReveal>
            )}

            {/* KEY INSIGHTS */}
            {insights.length > 0 && (
              <DataReveal delay={200}>
                <div className="mb-8 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Key Insights</h3>
                  {insights.map((insight, idx) => (
                    <InsightCard key={idx} insight={insight} delay={idx * 80} />
                  ))}
                </div>
              </DataReveal>
            )}

            {/* PDF REPORT CTA */}
            <DataReveal delay={250}>
              <div className="mb-8 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Save this report</p>
                  <p className="text-xs text-slate-400 mt-0.5">Download a PDF with all vehicle details, MOT history and mileage records.</p>
                </div>
                <button
                  onClick={() => downloadPDF()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Download PDF
                </button>
              </div>
            </DataReveal>

            {/* VEHICLE VALUATION ESTIMATE */}
            {valuationResult && (
              <DataReveal delay={270}>
                <div className="mb-8 p-5 rounded-lg border border-blue-800/40 bg-gradient-to-r from-blue-900/30 to-cyan-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PoundSterling className="w-5 h-5 text-blue-400" />
                      <h3 className="text-sm font-semibold text-slate-200">Estimated Value</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      valuationResult.confidence === "high" ? "bg-emerald-900/40 text-emerald-300" :
                      valuationResult.confidence === "medium" ? "bg-blue-900/40 text-blue-300" :
                      "bg-amber-900/40 text-amber-300"
                    }`}>
                      {valuationResult.confidence === "high" ? "High confidence" :
                       valuationResult.confidence === "medium" ? "Medium confidence" :
                       "Low confidence"}
                    </span>
                  </div>

                  <p className="text-3xl font-bold text-slate-100 mb-1">
                    £{valuationResult.rangeLow.toLocaleString()} – £{valuationResult.rangeHigh.toLocaleString()}
                  </p>

                  <p className="text-xs text-slate-400 mb-1">
                    Based on: {valuationResult.sources.join(", ")}
                  </p>

                  {/* Market Snapshot */}
                  {(valuationResult.ebayMinPrice || valuationResult.marketSupply) && (
                    <div className="mb-4 mt-3 p-3 rounded-md bg-slate-900/50 border border-slate-800/50">
                      <p className="text-xs font-semibold text-slate-300 mb-2">Market Snapshot</p>
                      <div className="space-y-1">
                        {valuationResult.ebayMinPrice && valuationResult.ebayMaxPrice && (
                          <p className="text-xs text-slate-400">
                            Asking prices: £{valuationResult.ebayMinPrice.toLocaleString()} – £{valuationResult.ebayMaxPrice.toLocaleString()}
                          </p>
                        )}
                        {(valuationResult.ebayDominantTransmission || valuationResult.ebayDominantBodyType) && (
                          <p className="text-xs text-slate-400">
                            Most common spec: {[data?.fuelType?.charAt(0).toUpperCase() + (data?.fuelType?.slice(1).toLowerCase() || ""), valuationResult.ebayDominantTransmission, valuationResult.ebayDominantBodyType].filter(Boolean).join(", ")}
                          </p>
                        )}
                        {valuationResult.marketSupply && (
                          <p className="text-xs text-slate-400">
                            Market supply: {valuationResult.marketSupply === "good" ? "Good" : valuationResult.marketSupply === "moderate" ? "Moderate" : "Limited"}
                            {valuationResult.ebayTotalListings && ` (${valuationResult.ebayTotalListings}+ available)`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Adjustment factors */}
                  {(valuationResult.mileageAdjustmentPercent !== 0 || valuationResult.conditionAdjustmentPercent !== 0 || valuationResult.colourAdjustmentPercent !== 0) && (
                    <p className="text-[11px] text-slate-500 mb-3">
                      Factors:
                      {valuationResult.mileageAdjustmentPercent !== 0 && (
                        <span> Mileage {valuationResult.mileageAdjustmentPercent > 0 ? "+" : ""}{valuationResult.mileageAdjustmentPercent}%</span>
                      )}
                      {valuationResult.conditionAdjustmentPercent !== 0 && (
                        <span> · Condition {valuationResult.conditionAdjustmentPercent > 0 ? "+" : ""}{valuationResult.conditionAdjustmentPercent}%</span>
                      )}
                      {valuationResult.colourAdjustmentPercent !== 0 && data?.colour && (
                        <span> · Colour ({data.colour.charAt(0).toUpperCase() + data.colour.slice(1).toLowerCase()}) {valuationResult.colourAdjustmentPercent}%</span>
                      )}
                    </p>
                  )}

                  {/* Condition refinement toggle */}
                  <button
                    onClick={() => setShowConditionForm(!showConditionForm)}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mb-2"
                  >
                    {showConditionForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Refine with vehicle condition
                  </button>

                  {showConditionForm && (
                    <div className="mt-3 pt-3 border-t border-blue-800/30 space-y-3">
                      {/* Service History */}
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-1.5">Service History</p>
                        <div className="flex gap-2">
                          {(["full", "partial", "none"] as const).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setValuationCondition((prev) => ({ serviceHistory: opt, bodywork: prev?.bodywork ?? "good", interior: prev?.interior ?? "good", owners: prev?.owners ?? "2-3", accidents: prev?.accidents ?? "none" }))}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                valuationCondition?.serviceHistory === opt
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              {opt === "full" ? "Full" : opt === "partial" ? "Partial" : "None"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bodywork */}
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-1.5">Bodywork</p>
                        <div className="flex gap-2 flex-wrap">
                          {(["excellent", "good", "fair", "poor"] as const).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setValuationCondition((prev) => ({ serviceHistory: prev?.serviceHistory ?? "partial", bodywork: opt, interior: prev?.interior ?? "good", owners: prev?.owners ?? "2-3", accidents: prev?.accidents ?? "none" }))}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                valuationCondition?.bodywork === opt
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interior */}
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-1.5">Interior</p>
                        <div className="flex gap-2">
                          {(["excellent", "good", "worn"] as const).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setValuationCondition((prev) => ({ serviceHistory: prev?.serviceHistory ?? "partial", bodywork: prev?.bodywork ?? "good", interior: opt, owners: prev?.owners ?? "2-3", accidents: prev?.accidents ?? "none" }))}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                valuationCondition?.interior === opt
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Owners */}
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-1.5">Previous Owners</p>
                        <div className="flex gap-2">
                          {(["1", "2-3", "4+"] as const).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setValuationCondition((prev) => ({ serviceHistory: prev?.serviceHistory ?? "partial", bodywork: prev?.bodywork ?? "good", interior: prev?.interior ?? "good", owners: opt, accidents: prev?.accidents ?? "none" }))}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                valuationCondition?.owners === opt
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Accidents */}
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-1.5">Accident History</p>
                        <div className="flex gap-2">
                          {(["none", "minor", "significant"] as const).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setValuationCondition((prev) => ({ serviceHistory: prev?.serviceHistory ?? "partial", bodywork: prev?.bodywork ?? "good", interior: prev?.interior ?? "good", owners: prev?.owners ?? "2-3", accidents: opt }))}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                valuationCondition?.accidents === opt
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        MOT advisories ({latestAdvisoryCount} noted): {valuationResult.motAutoAdjustmentPercent === 0 ? "no impact on value" : `${valuationResult.motAutoAdjustmentPercent > 0 ? "+" : ""}${valuationResult.motAutoAdjustmentPercent}% auto-applied`}
                      </p>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600 mt-3">{valuationResult.disclaimer}</p>
                </div>
              </DataReveal>
            )}

            {/* MOT HISTORY + MOT INSIGHTS (merged) */}
            {/* Share prompt sentinel — mid-results */}
            <div ref={shareSentinelMidRef} className="h-0" aria-hidden="true" />

            {data.motTests && data.motTests.length > 0 && (
              <DataReveal delay={300}>
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">MOT History &amp; Insights</h3>

                  {/* MOT Insights grid — above test cards */}
                  {(() => {
                    const motInsights = calculateMotInsights(data.motTests);
                    if (!motInsights) return null;

                    return (
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg border border-emerald-500/50 bg-emerald-950/20">
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Pass Rate</p>
                            <p className="text-2xl font-bold text-emerald-400">{motInsights.passRate}%</p>
                            <p className="text-xs text-slate-300 mt-1">{motInsights.passedTests} of {motInsights.totalTests} tests passed</p>
                          </div>

                          <div className={`p-4 rounded-lg border ${
                            motInsights.mileageTrend === "low" ? "border-amber-500/50 bg-amber-950/20" :
                            motInsights.mileageTrend === "high" ? "border-blue-500/50 bg-blue-950/20" :
                            "border-emerald-500/50 bg-emerald-950/20"
                          }`}>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
                              {motInsights.mileageTrend === "low" ? "Low Annual Mileage" :
                               motInsights.mileageTrend === "high" ? "High Annual Mileage" :
                               "Normal Annual Mileage"}
                            </p>
                            <p className="text-2xl font-bold text-slate-100">{motInsights.avgMilesPerYear.toLocaleString()}</p>
                            <p className="text-xs text-slate-300 mt-1">miles per year (UK avg: 8,000-12,000)</p>
                          </div>

                          <div className="p-4 rounded-lg border border-cyan-500/50 bg-cyan-950/20">
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Next MOT Due</p>
                            <p className={`text-2xl font-bold ${motInsights.daysUntilExpiry < 60 ? "text-amber-400" : "text-cyan-400"}`}>
                              {motInsights.daysUntilExpiry} days
                            </p>
                            <p className="text-xs text-slate-300 mt-1">
                              {motInsights.daysUntilExpiry < 0 ? "MOT expired" : motInsights.daysUntilExpiry < 30 ? "Due soon" : ""}
                            </p>
                          </div>

                          <div className="p-4 rounded-lg border border-slate-500/50 bg-slate-900/20">
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Current Mileage</p>
                            <p className="text-2xl font-bold text-slate-100">{motInsights.latestMileage?.toLocaleString() || "—"}</p>
                            <p className="text-xs text-slate-300 mt-1">from latest MOT test</p>
                          </div>
                        </div>

                        {motInsights.mileageWarnings.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {motInsights.mileageWarnings.map((warning, widx) => (
                              <div key={widx} className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20">
                                <p className="text-xs text-amber-300">{warning}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {motInsights.recurringAdvisories.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">Recurring Advisories</p>
                            <div className="space-y-2">
                              {motInsights.recurringAdvisories.map((advisory, aidx) => (
                                <div key={aidx} className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20">
                                  <div className="flex items-start justify-between">
                                    <p className="text-xs text-amber-300 flex-1">{advisory.text}</p>
                                    <span className="ml-2 px-2 py-1 rounded text-xs font-semibold bg-amber-900/40 text-amber-300 whitespace-nowrap">
                                      {advisory.count}x
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Test cards — first 3 expanded by default */}
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
                      </div>
                    ))}
                  </div>

                  {/* Inline partner link after most recent test */}
                  {data.motTests[0] && (data.motTests[0].testResult === "FAILED" || data.motTests[0].rfrAndComments?.some(r => r.type === "ADVISORY" || r.type === "DEFECT")) && (
                    <p className="mt-3 text-xs text-slate-400">
                      Get these checked — <a href={PARTNER_LINKS.bookMyGarage.buildLink?.(data.registrationNumber) ?? PARTNER_LINKS.bookMyGarage.url} target="_blank" rel={getPartnerRel(PARTNER_LINKS.bookMyGarage)} onClick={() => trackPartnerClick("bookMyGarage", "mot-history-inline")} className="text-blue-400 hover:text-blue-300 transition-colors">compare garage prices on BookMyGarage <ExternalLink className="w-3 h-3 inline" /></a>
                    </p>
                  )}

                  {/* Show earlier MOT history toggle */}
                  {data.motTests.length > 3 && (
                    <button
                      onClick={() => setShowAllMotTests(!showAllMotTests)}
                      className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {showAllMotTests ? "Hide earlier tests" : `Show earlier MOT history (${data.motTests.length - 3} more)`}
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

            {/* SAFETY RECALLS */}
            {recalls.length > 0 && (
              <DataReveal delay={320}>
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    Safety Recalls
                  </h3>
                  <div className="space-y-3">
                    {recalls.map((recall, idx) => (
                      <div key={idx} className="p-4 rounded-lg border border-red-800/40 bg-red-950/20">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-sm font-semibold text-red-200">{recall.defect}</p>
                          <span className="text-xs text-slate-500 whitespace-nowrap">{recall.recallNumber}</span>
                        </div>
                        <p className="text-xs text-slate-300 mb-2"><span className="font-medium text-slate-400">Remedy:</span> {recall.remedy}</p>
                        <p className="text-xs text-slate-500">
                          Recall date: {new Date(recall.recallDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          {" · "}Affects: {recall.models.join(", ")}
                          {" · "}Build dates: {new Date(recall.buildDateStart).getFullYear()}–{new Date(recall.buildDateEnd).getFullYear()}
                        </p>
                        <p className="text-xs text-emerald-400/80 mt-1.5">Recall repairs are always free at any authorised dealer.</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-3">
                    Recall data is matched by make, model, and year of manufacture. Individual vehicle recall status may differ — a recall may have already been completed on this specific vehicle. For vehicle-specific recall status, check at{" "}
                    <a href="https://www.check-vehicle-recalls.service.gov.uk" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-400">check-vehicle-recalls.service.gov.uk</a>
                    {" "}or contact your manufacturer&apos;s dealer. Recall repairs are always free.
                  </p>
                </div>
              </DataReveal>
            )}

            {/* No recalls — positive signal */}
            {data && recalls.length === 0 && data.make && (
              <DataReveal delay={320}>
                <div className="mb-8 p-4 rounded-lg border border-emerald-800/30 bg-emerald-950/15">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-emerald-200">No known safety recalls</p>
                      <p className="text-xs text-slate-400 mt-0.5">No matching recalls found in our database. Check with the manufacturer for a complete record.</p>
                    </div>
                  </div>
                </div>
              </DataReveal>
            )}

            {/* BUYING CHECKLIST */}
            <DataReveal delay={400}>
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

            {/* WHAT TO CHECK NEXT */}
            <DataReveal delay={450}>
            <div className="mb-8">
              <h3 className="text-base font-semibold text-slate-100 mb-4">What to check next</h3>
              <div className="space-y-3">
                {data.motTests?.some(t => t.rfrAndComments?.some(r => r.type === "ADVISORY")) && (
                  <a href="/blog/what-does-mot-advisory-mean" className="block p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">What Does an MOT Advisory Mean?</p>
                    <p className="text-xs text-slate-500 mt-1">This vehicle has MOT advisories — learn what they mean and when to act.</p>
                  </a>
                )}
                {(data.taxStatus === "SORN" || data.taxStatus === "Untaxed") && (
                  <a href="/blog/what-is-sorn-and-when-do-you-need-one" className="block p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">What Is a SORN and When Do You Need One?</p>
                    <p className="text-xs text-slate-500 mt-1">This vehicle is {data.taxStatus === "SORN" ? "SORN'd" : "untaxed"} — understand the rules.</p>
                  </a>
                )}
                {ulezResult && ulezResult.status === "non-compliant" && (
                  <a href="/blog/is-my-car-ulez-compliant" className="block p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Is My Car ULEZ Compliant?</p>
                    <p className="text-xs text-slate-500 mt-1">This vehicle may not be ULEZ compliant — learn about charges, exemptions and your options.</p>
                  </a>
                )}
                {recalls.length > 0 && (
                  <a href="/blog/car-safety-recalls-guide" className="block p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Car Safety Recalls: What You Need to Know</p>
                    <p className="text-xs text-slate-500 mt-1">This vehicle has {recalls.length} matching recall{recalls.length !== 1 ? "s" : ""} — learn how to get free repairs.</p>
                  </a>
                )}
                <a href="/blog/how-to-read-mot-history" className="block p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
                  <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">How to Read MOT History</p>
                  <p className="text-xs text-slate-500 mt-1">Understand what the test results, mileage and advisories mean.</p>
                </a>
                <a href="/blog/how-to-check-if-a-car-is-taxed" className="block p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
                  <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">How to Check if a Car Is Taxed</p>
                  <p className="text-xs text-slate-500 mt-1">Everything you need to know about vehicle tax status in the UK.</p>
                </a>
                <a href="/blog/used-car-checks-before-buying" className="block p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
                  <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">10 Essential Checks Before Buying a Used Car</p>
                  <p className="text-xs text-slate-500 mt-1">A practical checklist to protect yourself when buying second-hand.</p>
                </a>
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
            We'll let you know about significant updates to Free Plate Check.
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

        {/* WHAT CAN YOU CHECK? */}
        <div className="mt-10">
          {/* Share prompt sentinel — bottom of results */}
          <div ref={shareSentinelBottomRef} className="h-0" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-100 mb-6">What Can You Check?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="/mot-check" className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">MOT History Check</h3>
              </div>
              <p className="text-sm text-slate-400">See every MOT result, advisory and failure since 2005.</p>
            </a>
            <a href="/car-check" className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free Car Check</h3>
              </div>
              <p className="text-sm text-slate-400">Look up make, model, colour, engine size and fuel type from DVLA data.</p>
            </a>
            <a href="/tax-check" className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Car Tax Check</h3>
              </div>
              <p className="text-sm text-slate-400">See if a vehicle is taxed, SORN&apos;d or untaxed, plus the expiry date.</p>
            </a>
            <a href="/mileage-check" className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <Gauge className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Mileage Check</h3>
              </div>
              <p className="text-sm text-slate-400">Track odometer readings across MOT tests to spot clocking.</p>
            </a>
            <a href="/ulez-check" className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <Leaf className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">ULEZ Check</h3>
              </div>
              <p className="text-sm text-slate-400">Find out if a vehicle is ULEZ compliant and see Clean Air Zone charges.</p>
            </a>
            <a href="/recall-check" className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Recall Check</h3>
              </div>
              <p className="text-sm text-slate-400">Check for safety recalls on any UK car model. Free repairs at dealers.</p>
            </a>
            <a href="/car-valuation" className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <PoundSterling className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Car Valuation</h3>
              </div>
              <p className="text-sm text-slate-400">Get a free instant car valuation. No signup required — just enter a reg.</p>
            </a>
          </div>
        </div>

        {/* HELPFUL GUIDES */}
        {recentGuides.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Helpful Guides</h2>
            <div className="space-y-4">
              {recentGuides.map((guide) => (
                <a
                  key={guide.slug}
                  href={`/blog/${guide.slug}`}
                  className="block p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group"
                >
                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">{guide.description}</p>
                  <span className="inline-block mt-2 text-xs text-blue-400 group-hover:text-blue-300 transition-colors">
                    Read more &rarr;
                  </span>
                </a>
              ))}
            </div>
            <div className="mt-4 text-center">
              <a href="/blog" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                See all guides &rarr;
              </a>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-12 pt-8 border-t border-slate-700/50 text-center text-xs text-slate-500 space-y-2">
          <p>
            Built with DVLA vehicle data. Always verify details with the seller and official documents before making any decisions.
          </p>
          <p className="text-slate-600">
            Free Plate Check may earn a commission from partner links. This doesn't affect our recommendations or the data we show.
          </p>
          <div className="flex justify-center py-1">
            <a
              href="https://www.saashub.com/free-plate-check?utm_source=badge&utm_campaign=badge&utm_content=free-plate-check&badge_variant=color&badge_kind=approved"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://cdn-b.saashub.com/img/badges/approved-color.png?v=1"
                alt="Free Plate Check - Approved on SaaSHub"
                className="max-w-[120px] opacity-70 hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
          <p>
            <button
              onClick={handleFooterShare}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Share this tool
            </button>
            <span className="mx-1.5">·</span>
            <a href="/terms" className="hover:text-slate-400 transition-colors">Terms</a>
            <span className="mx-1.5">·</span>
            <a href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</a>
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

      {/* SHARE TOAST — first lookup (Moment A) */}
      {shareToastVisible && (
        <div className={`fixed bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:max-w-md z-50 ${shareToastDismissing ? "animate-slideDownOut" : "animate-slideUpIn"}`}>
          <div className="p-4 bg-slate-900 border border-slate-700/80 rounded-lg shadow-lg flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">Know someone buying a car?</p>
              <p className="text-xs text-slate-400 mt-0.5">Share Free Plate Check</p>
            </div>
            <button
              onClick={handleShareToastClick}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-full transition-all whitespace-nowrap"
            >
              {shareCopied ? "Copied!" : (isMobileDevice() ? "Share" : "Copy Link")}
            </button>
            <button
              onClick={dismissShareToast}
              className="text-slate-500 hover:text-slate-400 transition-colors p-1 -mr-1"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* DOWNLOAD SHARE PROMPT (Moment B) */}
      {downloadSharePrompt && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:max-w-md z-50 animate-slideUpIn">
          <div className="p-4 bg-slate-900 border border-slate-700/80 rounded-lg shadow-lg flex items-center gap-3">
            <p className="flex-1 text-sm text-slate-300">
              {isMobileDevice() ? "Finding this useful? Share with a friend!" : "Finding this useful? Know someone buying a car?"}
            </p>
            <button
              onClick={handleDownloadShare}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-full transition-all whitespace-nowrap"
            >
              {downloadShareCopied ? "Copied!" : (isMobileDevice() ? "Share" : "Copy Link")}
            </button>
            <button
              onClick={dismissSharePrompt}
              className="text-slate-500 hover:text-slate-400 transition-colors p-1 -mr-1"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}