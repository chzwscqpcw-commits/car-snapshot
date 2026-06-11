"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Bell,
  Calculator,
  ChevronDown,
  Database,
  Download,
  ExternalLink,
  Eye,
  Fuel,
  Gauge,
  Globe,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceStatus = {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  latencyMs?: number;
};

type HealthData = {
  status: "healthy" | "degraded" | "unhealthy";
  checkedAt: string;
  services: ServiceStatus[];
};

type TopMake = { make: string; count: number };
type PartnerContextCount = { context: string; count: number };
type AffiliateStat = {
  key: string;
  name: string;
  today: number;
  last7d: number;
  topContexts: PartnerContextCount[];
};
type OtherPartnerStat = { partner: string; today: number; last7d: number };

/** camelCase partner_id → readable label, e.g. "weBuyAnyCar" → "We Buy Any Car". */
function formatPartnerName(p: string): string {
  return p
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
type TopPage = { path: string; views: number };
type TrafficSource = { source: string; visits24h: number; visits7d: number };
type ReminderTriggerFunnel = {
  trigger: string;
  views: number;
  attempts: number;
  signups: number;
};

type StatsData = {
  lookups: {
    last1h: number;
    last24h: number;
    last7d: number;
    today: number;
    yesterday: number;
  };
  pageViews: {
    last24h: number;
    last7d: number;
    today: number;
    yesterday: number;
  };
  uniqueVisitors: {
    last24h: number;
    last7d: number;
    today: number;
    yesterday: number;
  };
  valuations: number;
  motReminders: number;
  motRemindersLast7d: number;
  topMakesToday: TopMake[];
  partnerClicks: {
    today: number;
    last7d: number;
    byContextToday: PartnerContextCount[];
    byContextLast7d: PartnerContextCount[];
  };
  affiliates: AffiliateStat[];
  otherPartners: OtherPartnerStat[];
  newEventsLast7d: {
    pdfDownloads: number;
    pdfErrors: number;
    pdfChunkErrors: number;
    motHistoryExpands: number;
    vehiclesSaved: number;
    outboundClicks: number;
    scrollDepth: { threshold_pct: number; count: number }[];
  };
  topPages: TopPage[];
  trafficSources: TrafficSource[];
  reminderByTrigger: ReminderTriggerFunnel[];
};

type DataFileEntry = {
  file: string;
  entries: number;
  lastModified: string;
  daysAgo: number;
  productionDaysAgo: number | null;
  productionUpdatedAt: string | null;
  effectiveDaysAgo: number;
  threshold: number;
  stale: boolean;
  source: "auto" | "semi-auto" | "curated";
  refreshHint: string;
  sourceUrl: string | null;
};

type MarketCheckUsage = {
  enabled: boolean;
  month: string;
  calls: number;
  limit: number;
  percent: number;
  remaining: number;
  estSpendGbp: number;
  cacheTtlDays: number;
  cacheEntries: number | null;
};

type DataHealthData = {
  buildTime: string;
  commit: string;
  totalEntries: number;
  staleCount: number;
  files: DataFileEntry[];
  marketcheck?: MarketCheckUsage;
};

type FuelPriceData = {
  petrol: number;
  diesel: number;
  date: string | null;
};

type InsightsData =
  | { status: "ok"; summary: string; generatedAt: string; cached: boolean }
  | { status: "no_key"; summary: null }
  | { status: "error"; summary: null };

// ── PIN Gate (unchanged behaviour, brushed-up visuals) ───────────────────────

const PIN = "4533";
const SESSION_KEY = "fpc_admin_pin";

function PinGate({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === PIN) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onAuth();
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Enter PIN to continue</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setError(false);
              setPin(e.target.value.replace(/\D/g, ""));
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-center text-2xl font-mono text-white tracking-[0.5em] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-base"
            placeholder="PIN"
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm text-center mt-2">Wrong PIN. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full mt-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Small reusable bits ───────────────────────────────────────────────────────

function StatusDot({ status }: { status: "ok" | "warning" | "error" }) {
  const colors = {
    ok: "bg-emerald-400",
    warning: "bg-amber-400",
    error: "bg-red-400 animate-pulse",
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status]} shrink-0`} />;
}

// Latency thresholds. Tuned for our typical mix: Supabase usually <300ms,
// DVLA/MOT/eBay 100-400ms. 500ms is "something's slow", 2000ms is "user
// will notice / risk of timeout cascade".
function latencyStatus(ms?: number): "ok" | "warning" | "error" {
  if (ms == null) return "ok";
  if (ms >= 2000) return "error";
  if (ms >= 500) return "warning";
  return "ok";
}

// Combine explicit service status with latency-based status; whichever is
// worse wins. Lets a fully-responding-but-slow Supabase show as amber even
// though /api/admin/health reports it as ok.
function effectiveServiceStatus(
  explicit: "ok" | "warning" | "error",
  ms?: number,
): "ok" | "warning" | "error" {
  const order = { ok: 0, warning: 1, error: 2 } as const;
  const lat = latencyStatus(ms);
  return order[lat] > order[explicit] ? lat : explicit;
}

function latencyTextColor(ms?: number): string {
  const s = latencyStatus(ms);
  if (s === "error") return "text-red-300";
  if (s === "warning") return "text-amber-300";
  return "text-slate-500";
}

function getFreshnessStatus(daysAgo: number, threshold: number): "ok" | "warning" | "error" {
  if (daysAgo === -1) return "warning";
  if (daysAgo >= threshold) return "error";
  if (daysAgo >= threshold * 0.75) return "warning";
  return "ok";
}

function getAgeBadgeClasses(status: "ok" | "warning" | "error"): string {
  switch (status) {
    case "ok":
      return "bg-emerald-950/50 text-emerald-300 border-emerald-800/50";
    case "warning":
      return "bg-amber-950/50 text-amber-300 border-amber-800/50";
    case "error":
      return "bg-red-950/50 text-red-300 border-red-800/50";
  }
}

function getSourcePill(source: "auto" | "semi-auto" | "curated") {
  switch (source) {
    case "auto":
      return { label: "Auto", classes: "bg-sky-950/50 text-sky-300 border-sky-800/50" };
    case "semi-auto":
      return {
        label: "Semi-auto",
        classes: "bg-violet-950/50 text-violet-300 border-violet-800/50",
      };
    case "curated":
      return { label: "Manual", classes: "bg-slate-800/50 text-slate-300 border-slate-700/50" };
  }
}

function Delta({ current, prior, label }: { current: number; prior: number; label?: string }) {
  if (prior === 0 && current === 0) {
    return <span className="text-slate-600">{label ?? "no data"}</span>;
  }
  if (prior === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400">
        <TrendingUp className="h-3 w-3" />
        new
      </span>
    );
  }
  const diff = current - prior;
  if (diff === 0) {
    return <span className="text-slate-500">flat</span>;
  }
  const pct = Math.round((diff / prior) * 100);
  const positive = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${
        positive ? "text-emerald-400" : "text-amber-400"
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

// ── Bar list ──────────────────────────────────────────────────────────────────

type BarItem = { label: string; count: number; suffix?: string; mono?: boolean; highlight?: boolean };

function BarList({ items, emptyMessage }: { items: BarItem[]; emptyMessage: string }) {
  if (items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-6 text-center">
        <p className="text-xs text-slate-500">{emptyMessage}</p>
      </div>
    );
  }
  const max = Math.max(...items.map((i) => i.count));
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {items.map((item, i) => {
        const pctWidth = max > 0 ? (item.count / max) * 100 : 0;
        return (
          <div
            key={item.label}
            className={`relative px-4 py-2.5 flex items-center justify-between gap-3 ${
              i < items.length - 1 ? "border-b border-slate-800/60" : ""
            }`}
          >
            <div
              className="absolute inset-y-0 left-0 bg-cyan-500/5 pointer-events-none"
              style={{ width: `${pctWidth}%` }}
            />
            <span
              className={`relative text-sm font-medium truncate ${
                item.highlight ? "text-cyan-300" : "text-slate-200"
              } ${item.mono ? "font-mono" : ""}`}
            >
              {item.label}
            </span>
            <span className="relative flex items-center gap-2 flex-shrink-0">
              {item.suffix && (
                <span className="text-[11px] text-cyan-300 tabular-nums">{item.suffix}</span>
              )}
              <span className="text-sm text-slate-400 tabular-nums">{item.count}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}


// ── Hero KPI card ─────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  sub,
  tone = "slate",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  delta?: React.ReactNode;
  sub?: string;
  tone?: "slate" | "cyan" | "emerald" | "amber" | "violet";
}) {
  const toneClasses = {
    slate: "border-slate-800 bg-slate-900",
    cyan: "border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900",
    emerald:
      "border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900",
    amber:
      "border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900",
    violet:
      "border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900",
  } as const;
  const iconColour = {
    slate: "text-slate-400",
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    violet: "text-violet-300",
  } as const;
  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-4 w-4 ${iconColour[tone]}`} />
        {delta && <div className="text-[11px] font-medium">{delta}</div>}
      </div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl sm:text-3xl font-bold text-white tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400 leading-tight">{sub}</p>}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </h2>
        {hint && <p className="text-[11px] text-slate-600">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// MarketCheck monthly spend-cap gauge — a horizontal % bar plus the key
// numbers (calls used / limit, estimated spend, cache size). Colour shifts
// amber→rose as the cap fills so an approaching limit is obvious at a glance.
function MarketCheckGauge({ usage }: { usage: MarketCheckUsage }) {
  const { enabled, calls, limit, percent, remaining, estSpendGbp, cacheTtlDays, cacheEntries } = usage;
  const tone =
    percent >= 90
      ? { bar: "bg-rose-500", text: "text-rose-300", ring: "border-rose-500/30 bg-rose-500/5" }
      : percent >= 70
      ? { bar: "bg-amber-500", text: "text-amber-300", ring: "border-amber-500/30 bg-amber-500/5" }
      : { bar: "bg-emerald-500", text: "text-emerald-300", ring: "border-emerald-500/25 bg-emerald-500/5" };

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${tone.ring}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Gauge className={`h-4 w-4 ${tone.text}`} />
          <span className="text-sm font-semibold text-slate-100">Live API calls this month</span>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            enabled
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-slate-600/60 bg-slate-700/40 text-slate-400"
          }`}
        >
          {enabled ? "Live" : "Disabled"}
        </span>
      </div>

      {/* Percentage bar */}
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={`text-2xl font-bold tabular-nums ${tone.text}`}>{percent}%</span>
        <span className="text-xs text-slate-400 tabular-nums">
          {calls.toLocaleString()} / {limit.toLocaleString()} calls
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${tone.bar}`}
          style={{ width: `${Math.max(percent, calls > 0 ? 2 : 0)}%` }}
        />
      </div>

      {/* Numbers */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GaugeStat label="Remaining" value={remaining.toLocaleString()} sub="calls left" />
        <GaugeStat label="Est. spend" value={`£${estSpendGbp.toFixed(2)}`} sub="≈ £0.0010/call" />
        <GaugeStat
          label="Cache"
          value={cacheEntries == null ? "—" : cacheEntries.toLocaleString()}
          sub={`${cacheTtlDays}d TTL`}
        />
        <GaugeStat label="Resets" value="1st" sub="of each month" />
      </div>

      {percent >= 90 && (
        <p className="mt-3 text-[11px] text-rose-300/90">
          Near the cap — new lookups fall back to depreciation + eBay until the month resets or you raise
          MARKETCHECK_MONTHLY_CALL_LIMIT.
        </p>
      )}
    </div>
  );
}

function GaugeStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-slate-100 tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-600">{sub}</p>
    </div>
  );
}

// ── AI activity summary ───────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "just now";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function ActivitySummaryCard({
  insights,
  loading,
  onRefresh,
}: {
  insights: InsightsData | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const showInitialSpinner = loading && !insights;

  return (
    <div className="mb-5 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-violet-300 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-100">Activity summary</span>
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-300">
            AI-generated
          </span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/40 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-slate-600 hover:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Regenerate the AI summary"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh analysis
        </button>
      </div>

      {showInitialSpinner && (
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-800" />
        </div>
      )}

      {!showInitialSpinner && insights?.status === "no_key" && (
        <p className="text-xs text-slate-500 leading-relaxed">
          Add a free <code className="font-mono text-slate-400">GROQ_API_KEY</code> in Vercel to
          enable AI summaries.
        </p>
      )}

      {!showInitialSpinner && insights?.status === "error" && (
        <p className="text-xs text-amber-300/90 leading-relaxed">
          Couldn&apos;t generate a summary just now — try again.
        </p>
      )}

      {!showInitialSpinner && insights?.status === "ok" && (
        <>
          <div className="space-y-2.5">
            {insights.summary.split(/\n\n+/).map((para, i) => (
              <p key={i} className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {para.trim()}
              </p>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-600">
            Generated {relativeTime(insights.generatedAt)}
            {insights.cached ? " · cached" : ""}
          </p>
        </>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function DataHealthPage() {
  const [authed, setAuthed] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [dataHealth, setDataHealth] = useState<DataHealthData | null>(null);
  const [fuelPrices, setFuelPrices] = useState<FuelPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  // AI activity summary — fetched once on mount; refresh button passes force=1.
  const fetchInsights = useCallback(async (force = false) => {
    setInsightsLoading(true);
    try {
      const res = await fetch(`/api/admin/insights${force ? "?force=1" : ""}`)
        .then((r) => r.json())
        .catch(() => null);
      if (res) setInsights(res as InsightsData);
      else setInsights({ status: "error", summary: null });
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [healthRes, statsRes, dataRes, fuelRes] = await Promise.all([
        fetch("/api/admin/health").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/stats").then((r) => r.json()).catch(() => null),
        fetch("/api/data-health").then((r) => r.json()).catch(() => null),
        fetch("/api/fuel-prices").then((r) => r.json()).catch(() => null),
      ]);
      if (healthRes) setHealth(healthRes);
      if (statsRes) setStats(statsRes);
      if (dataRes) setDataHealth(dataRes);
      if (fuelRes) setFuelPrices(fuelRes);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchDashboardData();
    fetchInsights();
    const interval = setInterval(fetchDashboardData, 60_000);
    return () => clearInterval(interval);
  }, [authed, fetchDashboardData, fetchInsights]);

  if (!authed) return <PinGate onAuth={() => setAuthed(true)} />;

  // ── Build helpers ─────────────────────────────────────────────────────────
  const buildDate = dataHealth?.buildTime ? new Date(dataHealth.buildTime) : null;
  const formattedDate = buildDate
    ? buildDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const formattedTime = buildDate
    ? buildDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";
  const shortCommit =
    dataHealth?.commit === "local" ? "local" : dataHealth?.commit?.slice(0, 7) ?? "—";

  const unhealthyServices = health?.services.filter((s) => s.status === "error") ?? [];

  const sortedFiles = dataHealth?.files
    ? [...dataHealth.files].sort((a, b) => {
        if (a.stale !== b.stale) return a.stale ? -1 : 1;
        return b.effectiveDaysAgo - a.effectiveDaysAgo;
      })
    : [];

  const fuelDaysOld = fuelPrices?.date
    ? Math.floor((Date.now() - new Date(fuelPrices.date).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const fuelStatus: "ok" | "warning" =
    !fuelPrices?.date || (fuelDaysOld != null && fuelDaysOld > 14) ? "warning" : "ok";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              Admin Dashboard
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Live system health, usage analytics &amp; data freshness
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {health && (
              <span
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                  health.status === "healthy"
                    ? "bg-emerald-950/50 border-emerald-800/50 text-emerald-300"
                    : health.status === "degraded"
                      ? "bg-amber-950/50 border-amber-800/50 text-amber-300"
                      : "bg-red-950/50 border-red-800/50 text-red-300"
                }`}
              >
                {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
              </span>
            )}
            <button
              type="button"
              onClick={fetchDashboardData}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              aria-label="Refresh"
              title="Refresh now"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-xl h-20 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* ── AI ACTIVITY SUMMARY ── */}
            <ActivitySummaryCard
              insights={insights}
              loading={insightsLoading}
              onRefresh={() => fetchInsights(true)}
            />

            {/* Service alert */}
            {unhealthyServices.length > 0 && (
              <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 mb-5 flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-red-300 font-semibold text-sm">
                    {unhealthyServices.length} service
                    {unhealthyServices.length > 1 ? "s" : ""} unhealthy
                  </p>
                  <p className="text-red-400/70 text-xs mt-0.5 leading-relaxed">
                    {unhealthyServices.map((s) => s.name).join(", ")} — check configuration
                  </p>
                </div>
              </div>
            )}

            {/* ── HERO KPI GRID ── */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <KpiCard
                  icon={Search}
                  label="API lookups today"
                  value={stats.lookups.today}
                  delta={
                    <Delta current={stats.lookups.today} prior={stats.lookups.yesterday} />
                  }
                  sub={`${stats.lookups.last7d.toLocaleString()} last 7d · per-call`}
                  tone="cyan"
                />
                <KpiCard
                  icon={Users}
                  label="Visitors today"
                  value={stats.uniqueVisitors.today}
                  delta={
                    <Delta
                      current={stats.uniqueVisitors.today}
                      prior={stats.uniqueVisitors.yesterday}
                    />
                  }
                  sub={`${stats.uniqueVisitors.last7d.toLocaleString()} last 7d`}
                  tone="emerald"
                />
                <KpiCard
                  icon={Bell}
                  label="MOT reminders"
                  value={stats.motReminders}
                  delta={
                    stats.motRemindersLast7d > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-400">
                        <TrendingUp className="h-3 w-3" />
                        {stats.motRemindersLast7d} this week
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )
                  }
                  sub="active subscribers"
                  tone="violet"
                />
                <KpiCard
                  icon={Eye}
                  label="Page views today"
                  value={stats.pageViews.today}
                  delta={
                    <Delta current={stats.pageViews.today} prior={stats.pageViews.yesterday} />
                  }
                  sub={`${stats.pageViews.last7d.toLocaleString()} last 7d`}
                  tone="amber"
                />
              </div>
            )}

            {/* ── HOW PEOPLE GOT HERE ── */}
            {stats && (
              <Section
                title="How people got here"
                hint="Traffic sources · 24h / 7d · excludes internal nav"
              >
                {stats.trafficSources.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-6 text-center">
                    <p className="text-xs text-slate-500">
                      No external traffic recorded yet — populates as new visits land with a
                      referrer or utm_source.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {(() => {
                      const max = Math.max(...stats.trafficSources.map((s) => s.visits7d));
                      return stats.trafficSources.map((s, i) => {
                        const w = max > 0 ? (s.visits7d / max) * 100 : 0;
                        return (
                          <div
                            key={s.source}
                            className={`relative px-4 py-2.5 flex items-center justify-between gap-3 ${
                              i < stats.trafficSources.length - 1
                                ? "border-b border-slate-800/60"
                                : ""
                            }`}
                          >
                            <div
                              className="absolute inset-y-0 left-0 bg-cyan-500/5 pointer-events-none"
                              style={{ width: `${w}%` }}
                            />
                            <div className="relative flex items-center gap-2.5 min-w-0">
                              <Globe className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-slate-200 truncate">
                                {s.source}
                              </span>
                            </div>
                            <span className="relative flex items-baseline gap-3 flex-shrink-0 tabular-nums">
                              <span className="text-[11px] text-cyan-300">
                                {s.visits24h} <span className="text-slate-600">24h</span>
                              </span>
                              <span className="text-sm text-slate-300">
                                {s.visits7d} <span className="text-slate-600 text-[11px]">7d</span>
                              </span>
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </Section>
            )}

            {/* ── TOP PAGES (7d) ── */}
            {stats && (
              <Section title="Top pages" hint="By page views · last 7d">
                <BarList
                  items={stats.topPages.map((p) => ({
                    label: p.path,
                    count: p.views,
                    mono: true,
                    highlight: p.path === "/stats/how-many-left",
                  }))}
                  emptyMessage="No page views in the last 7 days yet."
                />
              </Section>
            )}

            {/* ── ERRORS & JOBS ── */}
            {stats && (
              <Section title="Errors & jobs" hint="PDF errors + CI · last 7d">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <MiniStat
                    label="PDF downloads"
                    value={stats.newEventsLast7d.pdfDownloads}
                    icon={Download}
                  />
                  <MiniStat
                    label="PDF errors"
                    value={stats.newEventsLast7d.pdfErrors}
                  />
                  <MiniStat
                    label="Stale-chunk"
                    value={stats.newEventsLast7d.pdfChunkErrors}
                    sub="benign"
                  />
                  <MiniStat
                    label="Real PDF faults"
                    value={Math.max(
                      0,
                      stats.newEventsLast7d.pdfErrors - stats.newEventsLast7d.pdfChunkErrors,
                    )}
                    sub="needs attention"
                  />
                </div>
                {/* Live CI status — GitHub Actions badge auto-updates green/red. */}
                <a
                  href="https://github.com/chzwscqpcw-commits/car-snapshot/actions/workflows/ci.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 hover:border-slate-700 transition-colors"
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                    Continuous Integration
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element -- external GH badge SVG, not a local asset */}
                  <img
                    src="https://github.com/chzwscqpcw-commits/car-snapshot/actions/workflows/ci.yml/badge.svg"
                    alt="CI status"
                    className="h-[18px]"
                  />
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </Section>
            )}

            {/* ── AFFILIATE PARTNERS (carVertical / BMG / ClickMechanic) ── */}
            {stats && stats.affiliates && (
              <Section
                title="Affiliate partners"
                hint="clicks · today / last 7d · by placement"
              >
                <div className="space-y-3">
                  {stats.affiliates.map((a) => (
                    <div
                      key={a.key}
                      className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-200">{a.name}</span>
                        <span className="text-xs text-slate-400 tabular-nums">
                          {a.today.toLocaleString()} today · {a.last7d.toLocaleString()} last 7d
                        </span>
                      </div>
                      <BarList
                        items={a.topContexts.slice(0, 6).map((c) => ({
                          label: c.context,
                          count: c.count,
                          mono: true,
                        }))}
                        emptyMessage="No clicks in the last 7 days."
                      />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── OTHER PARTNER LINKS (non-affiliate long tail) ── */}
            {stats && stats.otherPartners && (
              <Section
                title="Other partner links"
                hint="non-affiliate · today / last 7d"
              >
                {stats.otherPartners.length > 0 ? (
                  <div className="space-y-1.5">
                    {stats.otherPartners.map((o) => (
                      <div
                        key={o.partner}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-slate-300">{formatPartnerName(o.partner)}</span>
                        <span className="text-xs text-slate-400 tabular-nums">
                          {o.today.toLocaleString()} today · {o.last7d.toLocaleString()} last 7d
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No non-affiliate partner clicks in the last 7 days.
                  </p>
                )}
              </Section>
            )}

            {/* ── REMINDER FUNNEL BY PLACEMENT ── */}
            {stats && (
              <Section
                title="Reminder funnel by placement"
                hint="views · attempts · signups · rate · last 7d"
              >
                {!stats.reminderByTrigger || stats.reminderByTrigger.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-6 text-center">
                    <p className="text-xs text-slate-500">
                      No reminder-form events in the last 7 days yet.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 border-b border-slate-800/60 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                      <span>Placement</span>
                      <span className="text-right tabular-nums w-12">Views</span>
                      <span className="text-right tabular-nums w-12">Attempt</span>
                      <span className="text-right tabular-nums w-12">Signup</span>
                      <span className="text-right tabular-nums w-12">Rate</span>
                    </div>
                    {stats.reminderByTrigger.map((r, i) => {
                      const rate = r.views > 0 ? (r.signups / r.views) * 100 : 0;
                      const rateLabel = r.views > 0 ? `${rate.toFixed(1)}%` : "—";
                      return (
                        <div
                          key={r.trigger}
                          className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 items-center ${
                            i < stats.reminderByTrigger.length - 1
                              ? "border-b border-slate-800/60"
                              : ""
                          }`}
                        >
                          <span className="font-mono text-xs text-slate-200 truncate">
                            {r.trigger}
                          </span>
                          <span className="text-right text-sm text-slate-300 tabular-nums w-12">
                            {r.views}
                          </span>
                          <span className="text-right text-sm text-slate-400 tabular-nums w-12">
                            {r.attempts}
                          </span>
                          <span className="text-right text-sm text-slate-200 tabular-nums w-12">
                            {r.signups}
                          </span>
                          <span
                            className={`text-right text-xs tabular-nums w-12 ${
                              r.signups > 0 ? "text-emerald-300" : "text-slate-500"
                            }`}
                          >
                            {rateLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>
            )}

            {/* ── SYSTEM STATUS ── */}
            {health && (
              <Section
                title="System status"
                hint={`Checked ${new Date(health.checkedAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {health.services.map((service) => {
                    const effective = effectiveServiceStatus(service.status, service.latencyMs);
                    return (
                      <div
                        key={service.name}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <StatusDot status={effective} />
                          <span className="text-sm font-semibold text-white">
                            {service.name}
                          </span>
                          {service.latencyMs != null && (
                            <span
                              className={`text-[10px] ml-auto tabular-nums ${latencyTextColor(service.latencyMs)}`}
                            >
                              {service.latencyMs}ms
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {service.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── USAGE DETAIL ── */}
            {stats && (
              <Section title="Usage detail">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  <MiniStat label="Lookups (1h)" value={stats.lookups.last1h} />
                  <MiniStat label="Lookups (24h)" value={stats.lookups.last24h} />
                  <MiniStat label="Page views (24h)" value={stats.pageViews.last24h} />
                  <MiniStat label="Page views (7d)" value={stats.pageViews.last7d} />
                  <MiniStat label="Visitors (24h)" value={stats.uniqueVisitors.last24h} />
                  <MiniStat label="Visitors (7d)" value={stats.uniqueVisitors.last7d} />
                  <MiniStat
                    label="Valuations"
                    value={stats.valuations}
                    sub="all time"
                    icon={Calculator}
                  />
                </div>
                {fuelPrices && (
                  <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Fuel className="h-4 w-4 text-amber-300 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                          Fuel prices
                        </p>
                        <p className="text-sm font-semibold text-white tabular-nums">
                          {Math.round(fuelPrices.petrol)}p /{" "}
                          {Math.round(fuelPrices.diesel)}p
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <StatusDot status={fuelStatus} />
                      <p className="text-[10px] text-slate-500 mt-1">
                        {fuelPrices.date
                          ? `${new Date(fuelPrices.date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })} (${fuelDaysOld}d ago)`
                          : "fallback"}
                      </p>
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* ── TOP MAKES TODAY ── */}
            {stats && stats.topMakesToday.length > 0 && (
              <Section title="Top makes searched today">
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  {stats.topMakesToday.map((m, i) => {
                    const max = stats.topMakesToday[0].count;
                    const pct = (m.count / max) * 100;
                    return (
                      <div
                        key={m.make}
                        className={`relative px-4 py-2.5 flex items-center justify-between gap-3 ${
                          i < stats.topMakesToday.length - 1
                            ? "border-b border-slate-800/60"
                            : ""
                        }`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-cyan-500/5 pointer-events-none"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative flex items-center gap-2.5 min-w-0">
                          <span className="text-[10px] font-mono text-slate-600 tabular-nums w-4 text-right">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-slate-200">
                            {m.make}
                          </span>
                        </div>
                        <span className="relative text-sm text-slate-400 tabular-nums">
                          {m.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── MARKETCHECK SPEND CAP ── */}
            {dataHealth?.marketcheck && (
              <Section
                title="MarketCheck usage"
                hint={`Monthly spend cap · ${dataHealth.marketcheck.month} (UTC)`}
              >
                <MarketCheckGauge usage={dataHealth.marketcheck} />
              </Section>
            )}

            {/* ── DATA FRESHNESS ── */}
            {dataHealth && (
              <Section
                title="Data freshness"
                hint={`${dataHealth.files.length} files · ${dataHealth.totalEntries.toLocaleString()} entries`}
              >
                {dataHealth.staleCount > 0 && (
                  <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3.5 mb-3 flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="text-amber-300 font-semibold text-sm leading-tight">
                        {dataHealth.staleCount} data file
                        {dataHealth.staleCount > 1 ? "s" : ""} past refresh threshold
                      </p>
                      <p className="text-amber-400/70 text-xs mt-0.5 leading-relaxed">
                        Tap a card for refresh instructions and source link.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {sortedFiles.map((f) => {
                    const status = getFreshnessStatus(f.effectiveDaysAgo, f.threshold);
                    const ageBadge = getAgeBadgeClasses(status);
                    const sourcePill = getSourcePill(f.source);
                    const isExpanded = expandedFile === f.file;
                    const hasProd = f.productionDaysAgo !== null;

                    return (
                      <div
                        key={f.file}
                        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFile(isExpanded ? null : f.file)}
                          className="w-full px-3.5 py-3 text-left hover:bg-slate-800/40 transition-colors"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex items-center gap-3">
                            <StatusDot status={status} />
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-xs text-slate-200 truncate">
                                {f.file}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {f.entries.toLocaleString()} entries · threshold{" "}
                                {f.threshold}d
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border tabular-nums ${ageBadge}`}
                              >
                                {f.effectiveDaysAgo === -1
                                  ? "?"
                                  : `${f.effectiveDaysAgo}d`}
                              </span>
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${sourcePill.classes}`}
                              >
                                {sourcePill.label}
                              </span>
                            </div>
                            <ChevronDown
                              className={`h-3.5 w-3.5 text-slate-500 transition-transform flex-shrink-0 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/60 space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <p className="text-slate-500 uppercase tracking-wider text-[9px] font-semibold">
                                  File mtime
                                </p>
                                <p className="text-slate-300 tabular-nums">
                                  {f.daysAgo === -1 ? "unknown" : `${f.daysAgo} days ago`}
                                </p>
                                <p className="text-slate-600 text-[10px]">
                                  {f.lastModified}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500 uppercase tracking-wider text-[9px] font-semibold">
                                  Production
                                </p>
                                {hasProd ? (
                                  <>
                                    <p className="text-slate-300 tabular-nums">
                                      {f.productionDaysAgo} days ago
                                    </p>
                                    <p className="text-slate-600 text-[10px]">
                                      {f.productionUpdatedAt
                                        ? new Date(f.productionUpdatedAt).toLocaleDateString(
                                            "en-GB",
                                          )
                                        : ""}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-slate-500">same as file</p>
                                    <p className="text-slate-600 text-[10px]">
                                      no cron cache
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-slate-500 uppercase tracking-wider text-[9px] font-semibold mb-0.5">
                                How to refresh
                              </p>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {f.refreshHint}
                              </p>
                            </div>
                            {f.sourceUrl && (
                              <a
                                href={f.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2"
                              >
                                Open data source →
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── BUILD INFO ── */}
            {dataHealth && (
              <Section title="Build">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <MiniStat
                    label="Built"
                    value={formattedDate}
                    sub={formattedTime ? `${formattedTime} UTC` : undefined}
                  />
                  <MiniStat
                    label="Commit"
                    value={shortCommit}
                    sub="git"
                    mono
                  />
                  <MiniStat
                    label="Total entries"
                    value={dataHealth.totalEntries.toLocaleString()}
                    sub={`across ${dataHealth.files.length} files`}
                    icon={Database}
                  />
                </div>
              </Section>
            )}

            <p className="text-center text-slate-600 text-[11px] mt-8 flex items-center justify-center gap-1.5">
              <Activity className="h-3 w-3" />
              Not indexed · Auto-refreshes every 60s
              {lastRefreshed && (
                <span className="text-slate-700">
                  · last {lastRefreshed.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Compact stat tile ─────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  sub,
  icon: Icon,
  mono,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  mono?: boolean;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-0.5">
        {Icon && <Icon className="h-3 w-3 text-slate-500" />}
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
      </div>
      <p
        className={`text-base sm:text-lg font-bold text-white tabular-nums ${
          mono ? "font-mono" : ""
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
