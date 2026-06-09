"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Calendar, Gauge, Lightbulb } from "lucide-react";
import PreviewGate from "@/components/preview/PreviewGate";
import BuyerInspectionWidget from "@/components/BuyerInspectionWidget";

const CM = "#3c93f7";

export default function InlineWidgetPreview() {
  return (
    <PreviewGate>
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6 rounded-lg border border-amber-700/40 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300">
            Mock-up for review — how the inspection offer would sit inside a real
            results page. Try the buttons: the offer only reveals for buyers.
          </div>
          <Link
            href="/preview/clickmechanic"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the ClickMechanic mock-ups
          </Link>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: CM }}>
            In-results widget
          </p>

          {/* Faux results context */}
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-4 sm:p-5">
            {/* Vehicle header */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div>
                <span className="inline-block rounded bg-yellow-300 px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-black">
                  AB12 CDE
                </span>
                <p className="mt-1.5 text-sm text-slate-300">2018 Volkswagen Golf 1.4 TSI</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                MOT valid
              </span>
            </div>

            {/* A couple of faux result rows */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { Icon: ShieldCheck, t: "Health", v: "Good" },
                { Icon: Calendar, t: "MOT due", v: "Jan 2027" },
                { Icon: Gauge, t: "Mileage", v: "56,400" },
              ].map(({ Icon, t, v }) => (
                <div key={t} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                  <Icon className="mx-auto h-4 w-4 text-slate-500" />
                  <p className="mt-1 text-slate-500">{t}</p>
                  <p className="font-semibold text-slate-200">{v}</p>
                </div>
              ))}
            </div>

            {/* THE WIDGET — woven in among the results */}
            <BuyerInspectionWidget preview regNumber="AB12CDE" />

            {/* hint that the report continues */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>…the rest of your report continues below</span>
            </div>
          </div>

          {/* Rationale note */}
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">Why a question, not just a banner</p>
            <p className="mt-1.5">
              The results page serves both owners and buyers. Asking{" "}
              <span className="text-slate-200">&ldquo;thinking of buying this car?&rdquo;</span>{" "}
              means owners are never pestered with an inspection pitch, and the offer
              lands only on real buyer intent — better for the visitor and for
              conversion. It also tags the session as a buyer, which we can later use to
              surface a history check too.
            </p>
          </div>
        </div>
      </main>
    </PreviewGate>
  );
}
