"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Receipt,
  Gauge,
  Wind,
  AlertTriangle,
  PoundSterling,
  GitCompare,
  Bell,
  CalendarCheck,
  ArrowRight,
  Compass,
} from "lucide-react";
import BoltMark from "@/components/BoltMark";

/**
 * 404 page — designed to get a lost user back into action fast.
 *
 * Structure: friendly-but-confident hero → primary reg lookup (still
 * the headline action on every page) → flagship booking wizard card →
 * 8-tile tools grid (the same set surfaced by the site nav, so a
 * confused user sees every entry point at once) → MOT reminder
 * recovery card → footer.
 *
 * No corporate "404: NOT FOUND" stare-at-the-wall. Bare-minimum
 * apology in the hero, every byte below it is a way forward.
 */
export default function NotFound() {
  const [vrm, setVrm] = useState("");
  const router = useRouter();

  function handleLookup() {
    const cleaned = vrm.replace(/\s/g, "").toUpperCase();
    if (!cleaned) return;
    router.push(`/?vrm=${encodeURIComponent(cleaned)}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-slate-800/60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 opacity-30 pointer-events-none [background-image:radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.14),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-4 pt-12 pb-10 sm:pt-16 sm:pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300 mb-5">
            <Compass className="h-3.5 w-3.5" />
            Page not found
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1]">
            Took a wrong turn.
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            We can&apos;t find the page you&apos;re after — it might have moved, or the link could be old. Pick up where you left off below.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* PRIMARY ACTION: REG LOOKUP */}
        <section>
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-cyan-500/10 blur-2xl rounded-3xl opacity-70 pointer-events-none" />
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400 mb-3">
                <BoltMark className="h-3.5 w-3.5" />
                Quick lookup
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                Check any UK reg in seconds
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                MOT, tax, valuation, ULEZ, recalls — pull the full DVLA report from a single registration.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/70 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="AB12 CDE"
                    value={vrm}
                    onChange={(e) => setVrm(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLookup();
                    }}
                    autoFocus
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-700/70 rounded-xl text-slate-100 placeholder:text-slate-600 placeholder:tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/40 transition-all font-mono text-lg tracking-[0.2em]"
                  />
                </div>
                <button
                  onClick={handleLookup}
                  className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-cyan-500/20"
                >
                  Look up
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FLAGSHIP: BOOKING WIZARD */}
        <section>
          <Link
            href="/booking?source=not_found_hero"
            className="group block rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/30 via-slate-900/80 to-slate-950 p-5 sm:p-6 transition-all hover:border-emerald-500/50 hover:translate-y-[-1px]"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3">
                <CalendarCheck className="h-6 w-6 text-emerald-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                  Book it
                </div>
                <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                  Book an MOT or service
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  Compare prices from local garages — pre-fill once, no email needed.
                </p>
              </div>
              <ArrowRight className="hidden sm:block h-5 w-5 text-emerald-400 shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </section>

        {/* TOOLS GRID */}
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
            Popular checks
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <ToolTile href="/mot-check" icon={ShieldCheck} title="MOT check" sub="Pass/fail history" accent="cyan" />
            <ToolTile href="/tax-check" icon={Receipt} title="Tax check" sub="Status & due date" accent="blue" />
            <ToolTile href="/mileage-check" icon={Gauge} title="Mileage check" sub="Clocking signs" accent="cyan" />
            <ToolTile href="/ulez-check" icon={Wind} title="ULEZ check" sub="Clean-air zones" accent="blue" />
            <ToolTile href="/recall-check" icon={AlertTriangle} title="Recall check" sub="Safety alerts" accent="cyan" />
            <ToolTile href="/car-valuation" icon={PoundSterling} title="Car valuation" sub="Live market value" accent="blue" />
          </div>
        </section>

        {/* MOT REMINDER + COMPARE */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/mot-reminder"
            className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-slate-700"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-2.5">
                <Bell className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Free MOT reminder</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Email alerts before it&apos;s due — you choose when
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors mt-0.5 shrink-0" />
            </div>
          </Link>
          <Link
            href="/compare"
            className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-slate-700"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/30 p-2.5">
                <GitCompare className="h-4 w-4 text-blue-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Compare two cars</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Side-by-side specs &amp; history
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors mt-0.5 shrink-0" />
            </div>
          </Link>
        </section>

        {/* GUIDES */}
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
            Or read a guide
          </h2>
          <div className="space-y-2">
            <GuideRow href="/blog/used-car-checks-before-buying" title="10 essential checks before buying a used car" />
            <GuideRow href="/blog/what-does-mot-advisory-mean" title="What does an MOT advisory mean?" />
            <GuideRow href="/blog/how-to-check-if-a-car-is-taxed" title="How to check if a car is taxed" />
            <Link
              href="/blog"
              className="block text-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors pt-2"
            >
              See all guides →
            </Link>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-800 bg-slate-900/40">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-slate-500 text-xs">
          <p>Free Plate Check &copy; 2026</p>
          <div className="mt-2 space-x-3">
            <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
            <span aria-hidden="true">·</span>
            <Link href="/tools" className="hover:text-slate-300 transition-colors">All tools</Link>
            <span aria-hidden="true">·</span>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <span aria-hidden="true">·</span>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToolTileProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  accent: "cyan" | "blue";
}

function ToolTile({ href, icon: Icon, title, sub, accent }: ToolTileProps) {
  const iconBg =
    accent === "cyan"
      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
      : "bg-blue-500/10 border-blue-500/30 text-blue-300";
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 sm:p-4 transition-all hover:border-slate-700 hover:bg-slate-900/80 hover:translate-y-[-1px]"
    >
      <div className={`inline-flex rounded-lg border p-2 ${iconBg}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2.5 text-sm font-semibold text-white">{title}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
    </Link>
  );
}

function GuideRow({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 transition-colors hover:border-slate-700"
    >
      <p className="text-sm text-slate-200 group-hover:text-white transition-colors">{title}</p>
      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
    </Link>
  );
}
