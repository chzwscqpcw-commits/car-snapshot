"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PreviewGate from "@/components/preview/PreviewGate";
import ClickMechanicLogo from "@/components/ClickMechanicLogo";
import PartnerCheckWidget from "@/components/preview/PartnerCheckWidget";

const CM = "#3c93f7";

export default function PartnerWidgetPreview() {
  return (
    <PreviewGate>
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-6 rounded-lg border border-amber-700/40 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300">
            Concept for ClickMechanic — a co-branded vehicle-check widget Scott
            could embed on <strong>his own site</strong>. Results show in the widget
            (no redirect away); the CTAs point at <strong>ClickMechanic&apos;s</strong> own
            bookings, so a free check funnels into his work. Quiet &ldquo;powered by
            Free Plate Check&rdquo; for our brand. Sample data only.
          </div>
          <Link
            href="/preview/clickmechanic"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the ClickMechanic mock-ups
          </Link>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: CM }}>
            How it would look on clickmechanic.com
          </p>

          {/* Faux ClickMechanic (light) page, with the widget embedded in it */}
          <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-2xl">
            {/* faux site header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <ClickMechanicLogo className="text-base" />
              <div className="hidden gap-5 text-sm font-medium text-slate-600 sm:flex">
                <span>How it works</span>
                <span>Services</span>
                <span>Help</span>
              </div>
            </div>

            {/* faux page body + the embedded widget */}
            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <h2 className="text-2xl font-bold leading-tight text-slate-900">
                  Know the car before you book the work
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Pop in a reg for a free instant check — MOT, tax, mileage and
                  advisories — then book the right job with our vetted mechanics.
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                  <li>• MOT history &amp; what&apos;s due</li>
                  <li>• Mileage &amp; anomaly check</li>
                  <li>• Last advisories, in plain English</li>
                </ul>
              </div>
              <PartnerCheckWidget />
            </div>
          </div>

          {/* Why this works */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
              <p className="text-sm font-semibold text-white">What ClickMechanic gets</p>
              <p className="mt-1.5 text-sm text-slate-400">
                A genuinely useful free tool that keeps visitors on their page (dwell
                time, SEO) and turns a check into a booking — MOT due → book an MOT;
                advisory → book an inspection or repair. It feeds their work, never
                competes with it.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
              <p className="text-sm font-semibold text-white">What Free Plate Check gets</p>
              <p className="mt-1.5 text-sm text-slate-400">
                Brand awareness on a high-authority site + a backlink, and a deeper
                partnership. No redirect to us and no competing CTAs — it&apos;s their
                tool, quietly powered by us.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-amber-700/30 bg-amber-950/20 p-4 text-sm text-amber-200/90">
            <strong>To confirm before building for real:</strong> our existing public
            embed only ever <em>redirects</em> to our site for results; showing the
            DVLA/DVSA data <em>inside</em> a widget on a third-party commercial site is
            a different data-display context, so we&apos;d check our data-source terms
            allow it first.
          </div>
        </div>
      </main>
    </PreviewGate>
  );
}
