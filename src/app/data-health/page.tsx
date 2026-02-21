"use client";

import { useState, useEffect, useCallback, Fragment } from "react";

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

type StatsData = {
  lookups: { last1h: number; last24h: number; last7d: number };
  pageViews: { last24h: number; last7d: number };
  uniqueVisitors: { last24h: number; last7d: number };
  emailSignups: number;
  valuations: number;
};

type DataFileEntry = {
  file: string;
  entries: number;
  lastModified: string;
  daysAgo: number;
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

// ── PIN Gate ───────────────────────────────────────────────────────────────────

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
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
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

// ── Status Dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: "ok" | "warning" | "error" }) {
  const colors = {
    ok: "bg-emerald-400",
    warning: "bg-amber-400",
    error: "bg-red-400 animate-pulse",
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status]} shrink-0`} />;
}

// ── Freshness Status helpers ─────────────────────────────────────────────────

function getFreshnessStatus(daysAgo: number, threshold: number): "ok" | "warning" | "error" {
  if (daysAgo === -1) return "warning"; // unknown age
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
      return { label: "Semi", classes: "bg-violet-950/50 text-violet-300 border-violet-800/50" };
    case "curated":
      return { label: "Manual", classes: "bg-slate-800/50 text-slate-300 border-slate-700/50" };
  }
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
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

  // Check session on mount
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setAuthed(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on auth + auto-refresh every 60s
  useEffect(() => {
    if (!authed) return;
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60_000);
    return () => clearInterval(interval);
  }, [authed, fetchDashboardData]);

  if (!authed) {
    return <PinGate onAuth={() => setAuthed(true)} />;
  }

  const buildDate = dataHealth?.buildTime
    ? new Date(dataHealth.buildTime)
    : null;
  const formattedDate = buildDate
    ? buildDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const formattedTime = buildDate
    ? buildDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";
  const shortCommit =
    dataHealth?.commit === "local"
      ? "local"
      : dataHealth?.commit?.slice(0, 7) ?? "—";

  const unhealthyServices =
    health?.services.filter((s) => s.status === "error") ?? [];

  // Sort files: stale first, then by daysAgo descending
  const sortedFiles = dataHealth?.files
    ? [...dataHealth.files].sort((a, b) => {
        if (a.stale !== b.stale) return a.stale ? -1 : 1;
        return b.daysAgo - a.daysAgo;
      })
    : [];

  // Fuel price freshness
  const fuelDaysOld = fuelPrices?.date
    ? Math.floor((Date.now() - new Date(fuelPrices.date).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const fuelStatus: "ok" | "warning" =
    !fuelPrices?.date || (fuelDaysOld != null && fuelDaysOld > 14) ? "warning" : "ok";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">
              Live system health, usage analytics &amp; data freshness
            </p>
          </div>
          {health && (
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full border ${
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
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* Service Alert Banner */}
            {unhealthyServices.length > 0 && (
              <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 mb-6 flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-semibold text-sm">
                    {unhealthyServices.length} service{unhealthyServices.length > 1 ? "s" : ""} unhealthy
                  </p>
                  <p className="text-red-400/70 text-xs mt-0.5">
                    {unhealthyServices.map((s) => s.name).join(", ")} — check configuration
                  </p>
                </div>
              </div>
            )}

            {/* System Status */}
            {health && (
              <div className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">System Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {health.services.map((service) => (
                    <div
                      key={service.name}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <StatusDot status={service.status} />
                        <span className="text-sm font-semibold text-white">{service.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{service.message}</p>
                      {service.latencyMs != null && (
                        <p className="text-[11px] text-slate-600 mt-1 tabular-nums">{service.latencyMs}ms</p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 mt-2">
                  Last checked {new Date(health.checkedAt).toLocaleTimeString("en-GB")} · Auto-refreshes every 60s
                </p>
              </div>
            )}

            {/* Usage Stats */}
            {stats && (
              <div className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Usage</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Lookups (1h)" value={stats.lookups.last1h} />
                  <StatCard label="Lookups (24h)" value={stats.lookups.last24h} />
                  <StatCard label="Lookups (7d)" value={stats.lookups.last7d} />
                  <StatCard label="Page Views (24h)" value={stats.pageViews.last24h} sub={`${stats.pageViews.last7d.toLocaleString()} last 7d`} />
                  <StatCard label="Unique Visitors (24h)" value={stats.uniqueVisitors.last24h} sub={`${stats.uniqueVisitors.last7d.toLocaleString()} last 7d`} />
                  <StatCard label="Email Signups" value={stats.emailSignups} sub="all time" />
                  <StatCard label="Valuations" value={stats.valuations} sub="all time" />
                  {/* Fuel Prices Card */}
                  {fuelPrices && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">Fuel Prices</p>
                      <div className="flex items-center gap-2">
                        <StatusDot status={fuelStatus} />
                        <p className="text-lg font-bold text-white tabular-nums">
                          {Math.round(fuelPrices.petrol)}p / {Math.round(fuelPrices.diesel)}p
                        </p>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {fuelPrices.date
                          ? `${new Date(fuelPrices.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}${fuelDaysOld != null ? ` (${fuelDaysOld}d ago)` : ""}`
                          : "Using fallback prices"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data Freshness */}
            {dataHealth && (
              <div className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Data Freshness</h2>

                {/* Stale Alert Banner */}
                {dataHealth.staleCount > 0 && (
                  <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-300 font-semibold text-sm">
                        {dataHealth.staleCount} data file{dataHealth.staleCount > 1 ? "s" : ""} past refresh threshold
                      </p>
                      <p className="text-amber-400/70 text-xs mt-0.5">
                        Expand rows for update instructions
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800/50">
                        <th className="w-8 px-3 py-2.5" />
                        <th className="text-left px-3 py-2.5 font-medium">File</th>
                        <th className="text-right px-3 py-2.5 font-medium">Entries</th>
                        <th className="text-center px-3 py-2.5 font-medium">Age</th>
                        <th className="text-center px-3 py-2.5 font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFiles.map((f, i) => {
                        const status = getFreshnessStatus(f.daysAgo, f.threshold);
                        const ageBadge = getAgeBadgeClasses(status);
                        const sourcePill = getSourcePill(f.source);
                        const isExpanded = expandedFile === f.file;

                        return (
                          <Fragment key={f.file}>
                            <tr
                              className={`border-b border-slate-800/30 cursor-pointer ${
                                i % 2 === 0 ? "bg-slate-900" : "bg-slate-900/50"
                              } hover:bg-slate-800/50 transition-colors`}
                              onClick={() => setExpandedFile(isExpanded ? null : f.file)}
                            >
                              <td className="px-3 py-2.5 text-center">
                                <StatusDot status={status} />
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-200 font-mono text-xs">{f.file}</span>
                                  <svg
                                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span className="text-white font-semibold tabular-nums">
                                  {f.entries.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border tabular-nums ${ageBadge}`}>
                                  {f.daysAgo === -1 ? "?" : `${f.daysAgo}d`}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${sourcePill.classes}`}>
                                  {sourcePill.label}
                                </span>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-800/30">
                                <td colSpan={5} className="px-5 py-3">
                                  <div className="text-xs space-y-1.5">
                                    <p className="text-slate-300">
                                      <span className="text-slate-500 font-medium">Last modified:</span>{" "}
                                      {f.lastModified === "unknown" ? "Unknown" : f.lastModified}
                                      <span className="text-slate-500 ml-2">·</span>
                                      <span className="text-slate-500 ml-2">Threshold:</span>{" "}
                                      {f.threshold}d
                                    </p>
                                    <p className="text-slate-300">
                                      <span className="text-slate-500 font-medium">How to refresh:</span>{" "}
                                      {f.refreshHint}
                                    </p>
                                    {f.sourceUrl && (
                                      <p>
                                        <a
                                          href={f.sourceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
                                        >
                                          Open data source &rarr;
                                        </a>
                                      </p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Build Info */}
            {dataHealth && (
              <div className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Build Info</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">Built</p>
                    <p className="text-white font-semibold text-sm">{formattedDate}</p>
                    {formattedTime && <p className="text-slate-400 text-xs">{formattedTime} UTC</p>}
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">Commit</p>
                    <p className="text-white font-mono font-semibold text-sm">{shortCommit}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">Total Entries</p>
                    <p className="text-white font-semibold text-sm">{dataHealth.totalEntries.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs">across {dataHealth.files.length} files</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <p className="text-center text-slate-600 text-xs mt-8">
              This page is not indexed. Auto-refreshes every 60 seconds.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
