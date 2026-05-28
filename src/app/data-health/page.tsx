"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Calculator,
  ChevronDown,
  Database,
  Eye,
  Filter,
  Fuel,
  Lock,
  Mail,
  MousePointerClick,
  RefreshCw,
  Search,
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
type CaptureTrigger = { trigger_variant: string; count: number };
type PartnerContextCount = { context: string; count: number };
type SectionReach = { section_id: string; count: number; pct: number };

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
  uniqueVisitors: { last24h: number; last7d: number };
  emailSignups: number;
  valuations: number;
  motReminders: number;
  contactMessages: { today: number; last7d: number; allTime: number };
  motRemindersLast7d: number;
  topMakesToday: TopMake[];
  funnel: {
    searchesToday: number;
    resultsViewsToday: number;
    reminderViewsToday: number;
    reminderSignupsToday: number;
  };
  captureByTriggerLast7d: CaptureTrigger[];
  partnerClicks: {
    today: number;
    last7d: number;
    byContextToday: PartnerContextCount[];
  };
  sectionReachToday: {
    resultsViews: number;
    sections: SectionReach[];
  };
  reminderFormToday: {
    views: number;
    attempts: number;
    successes: number;
    validationErrors: number;
    submitErrors: { duplicate: number; server: number; network: number };
  };
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

type DataHealthData = {
  buildTime: string;
  commit: string;
  totalEntries: number;
  staleCount: number;
  files: DataFileEntry[];
};

type FuelPriceData = {
  petrol: number;
  diesel: number;
  date: string | null;
};

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

// ── Funnel helpers ────────────────────────────────────────────────────────────

function pct(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 100);
}

function prettifyTriggerVariant(v: string): string {
  // Make trigger_variant slugs readable in the UI without losing the
  // underlying values you'd search GA4 for. e.g. "results_due_soon" → "Results · Due soon".
  if (!v || v === "(not set)") return v || "(not set)";
  if (v === "homepage") return "Homepage form";
  if (v === "reminder_page") return "/mot-reminder page";
  if (v === "blog_footer") return "Blog footer";
  if (v === "post_pdf") return "After PDF download";
  if (v === "widget") return "Inline lookup widget";
  if (v.startsWith("results_")) {
    const tail = v.slice("results_".length).replace(/_/g, " ");
    return `Results · ${tail.replace(/\b\w/g, (c) => c.toUpperCase())}`;
  }
  return v;
}

function prettifySectionId(id: string): string {
  if (id === "section-health") return "Health & Safety";
  if (id === "section-money") return "Financial Picture";
  if (id === "section-facts") return "Key Insights";
  if (id === "section-mot") return "MOT History";
  if (id === "section-next") return "Next Steps";
  return id;
}

function FunnelStep({
  label,
  value,
  conversionPct,
  icon: Icon,
}: {
  label: string;
  value: number;
  conversionPct?: number | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        {conversionPct != null && (
          <span className="text-[10px] font-semibold text-cyan-300 tabular-nums">
            {conversionPct}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 leading-tight">
        {label}
      </p>
      <p className="mt-0.5 text-xl sm:text-2xl font-bold text-white tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

type BarItem = { label: string; count: number; suffix?: string; mono?: boolean };

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
              className={`relative text-sm font-medium text-slate-200 truncate ${
                item.mono ? "font-mono" : ""
              }`}
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

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
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
    const interval = setInterval(fetchDashboardData, 60_000);
    return () => clearInterval(interval);
  }, [authed, fetchDashboardData]);

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
                  label="Lookups today"
                  value={stats.lookups.today}
                  delta={
                    <Delta current={stats.lookups.today} prior={stats.lookups.yesterday} />
                  }
                  sub={`${stats.lookups.last7d.toLocaleString()} last 7d`}
                  tone="cyan"
                />
                <KpiCard
                  icon={Users}
                  label="Visitors today"
                  value={stats.uniqueVisitors.last24h}
                  delta={
                    <Delta
                      current={stats.pageViews.today}
                      prior={stats.pageViews.yesterday}
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
                  icon={Mail}
                  label="Contact msgs"
                  value={stats.contactMessages.today}
                  delta={
                    stats.contactMessages.last7d > 0 ? (
                      <span className="text-amber-400">
                        {stats.contactMessages.last7d} this week
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )
                  }
                  sub={`${stats.contactMessages.allTime} all time`}
                  tone="amber"
                />
              </div>
            )}

            {/* ── TODAY'S CONVERSION FUNNEL ── */}
            {stats && (
              <Section
                title="Today's conversion funnel"
                hint="Per-user actions · resets at 00:00 UTC"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <FunnelStep
                    icon={Search}
                    label="Searches"
                    value={stats.funnel.searchesToday}
                  />
                  <FunnelStep
                    icon={Eye}
                    label="Results viewed"
                    value={stats.funnel.resultsViewsToday}
                    conversionPct={pct(
                      stats.funnel.resultsViewsToday,
                      stats.funnel.searchesToday,
                    )}
                  />
                  <FunnelStep
                    icon={Bell}
                    label="Reminder offered"
                    value={stats.funnel.reminderViewsToday}
                    conversionPct={pct(
                      stats.funnel.reminderViewsToday,
                      stats.funnel.resultsViewsToday,
                    )}
                  />
                  <FunnelStep
                    icon={TrendingUp}
                    label="Reminder signups"
                    value={stats.funnel.reminderSignupsToday}
                    conversionPct={pct(
                      stats.funnel.reminderSignupsToday,
                      stats.funnel.reminderViewsToday,
                    )}
                  />
                </div>
              </Section>
            )}

            {/* ── CAPTURE TRIGGER PERFORMANCE ── */}
            {stats && (
              <Section
                title="Capture trigger performance"
                hint={`Reminder signups by trigger · last 7d`}
              >
                <BarList
                  items={stats.captureByTriggerLast7d.map((t) => ({
                    label: prettifyTriggerVariant(t.trigger_variant),
                    count: t.count,
                  }))}
                  emptyMessage="No reminder signups in the last 7 days yet — data starts populating with new traffic."
                />
              </Section>
            )}

            {/* ── PARTNER CLICKS ── */}
            {stats && (
              <Section
                title="Partner clicks today"
                hint={`${stats.partnerClicks.last7d.toLocaleString()} last 7d · total ${stats.partnerClicks.today.toLocaleString()}`}
              >
                <BarList
                  items={stats.partnerClicks.byContextToday.map((c) => ({
                    label: c.context,
                    count: c.count,
                    mono: true,
                  }))}
                  emptyMessage="No partner clicks yet today."
                />
              </Section>
            )}

            {/* ── SECTION REACH ── */}
            {stats && (
              <Section
                title="Section reach today"
                hint={
                  stats.sectionReachToday.resultsViews > 0
                    ? `% of ${stats.sectionReachToday.resultsViews} result views`
                    : "Awaiting result views"
                }
              >
                <BarList
                  items={stats.sectionReachToday.sections.map((s) => ({
                    label: prettifySectionId(s.section_id),
                    count: s.count,
                    suffix: `${s.pct}%`,
                  }))}
                  emptyMessage="No section visibility events yet today."
                />
              </Section>
            )}

            {/* ── REMINDER FORM DROP-OFF ── */}
            {stats && (
              <Section title="Reminder form funnel today" hint="Views → attempts → successes">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <FunnelStep
                    icon={Eye}
                    label="Form views"
                    value={stats.reminderFormToday.views}
                  />
                  <FunnelStep
                    icon={MousePointerClick}
                    label="Submit attempts"
                    value={stats.reminderFormToday.attempts}
                    conversionPct={pct(
                      stats.reminderFormToday.attempts,
                      stats.reminderFormToday.views,
                    )}
                  />
                  <FunnelStep
                    icon={TrendingUp}
                    label="Successes"
                    value={stats.reminderFormToday.successes}
                    conversionPct={pct(
                      stats.reminderFormToday.successes,
                      stats.reminderFormToday.attempts,
                    )}
                  />
                  <FunnelStep
                    icon={Filter}
                    label="Validation errors"
                    value={stats.reminderFormToday.validationErrors}
                  />
                </div>

                {(stats.reminderFormToday.submitErrors.duplicate > 0 ||
                  stats.reminderFormToday.submitErrors.server > 0 ||
                  stats.reminderFormToday.submitErrors.network > 0) && (
                  <div className="mt-3 rounded-xl border border-amber-800/40 bg-amber-950/20 p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                        Submit errors today
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Duplicate
                        </p>
                        <p className="text-sm font-bold text-white tabular-nums">
                          {stats.reminderFormToday.submitErrors.duplicate}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Server
                        </p>
                        <p className="text-sm font-bold text-white tabular-nums">
                          {stats.reminderFormToday.submitErrors.server}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Network
                        </p>
                        <p className="text-sm font-bold text-white tabular-nums">
                          {stats.reminderFormToday.submitErrors.network}
                        </p>
                      </div>
                    </div>
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
                  {health.services.map((service) => (
                    <div
                      key={service.name}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3.5"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusDot status={service.status} />
                        <span className="text-sm font-semibold text-white">
                          {service.name}
                        </span>
                        {service.latencyMs != null && (
                          <span className="text-[10px] text-slate-500 ml-auto tabular-nums">
                            {service.latencyMs}ms
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {service.message}
                      </p>
                    </div>
                  ))}
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
                  <MiniStat
                    label="Email signups"
                    value={stats.emailSignups}
                    sub="all time"
                    icon={Mail}
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
