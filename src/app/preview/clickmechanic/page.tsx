"use client";

import Link from "next/link";
import { Zap, Search, MousePointerClick, Code2, ArrowRight, PoundSterling } from "lucide-react";
import PreviewGate from "@/components/preview/PreviewGate";
import ClickMechanicLogo from "@/components/ClickMechanicLogo";

const CM = "#3c93f7";

const PAGES = [
  {
    href: "/preview/clickmechanic/ev-charger",
    Icon: Zap,
    tag: "Co-branded landing page",
    title: "EV Charger Installation",
    desc: "A Free Plate Check-hosted, SEO-able landing page for home EV charger installs (from £752, ~£40 commission each) — our brand, CM woven in, funnelling to ClickMechanic.",
    cta: "View the EV charger page",
  },
  {
    href: "/preview/clickmechanic/inspection",
    Icon: Search,
    tag: "Co-branded landing page",
    title: "Pre-Purchase Inspection",
    desc: "The buyer's-toolkit play — pairs with a carVertical history check. A mobile mechanic inspects the car before you pay (from £79). The product BMG can't offer.",
    cta: "View the inspection page",
  },
  {
    href: "/preview/clickmechanic/inline-widget",
    Icon: MousePointerClick,
    tag: "In-results widget",
    title: "“Buying this car?” reveal",
    desc: "How the inspection offer sits inside a real results page — a one-tap question that reveals the ClickMechanic offer only for buyers, never owners.",
    cta: "Try the widget",
  },
  {
    href: "/preview/clickmechanic/partner-widget",
    Icon: Code2,
    tag: "Widget for ClickMechanic's site",
    title: "Co-branded checker widget",
    desc: "A free vehicle-check widget Scott embeds on clickmechanic.com — results show in the widget, CTAs go to his own bookings (MOT due → book MOT; advisory → inspection). Keeps his visitors on-page; brand awareness + a backlink for us.",
    cta: "View the widget concept",
  },
];

export default function ClickMechanicPreviewHub() {
  return (
    <PreviewGate>
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="mb-6 rounded-lg border border-amber-700/40 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300">
            Mock-ups for review — not live. Uses ClickMechanic&apos;s own logo and
            brand blue; swap for any final approved creative on launch.
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: CM }}>
            Partnership proposal
          </p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-white">
            Free Plate Check <span className="text-slate-600">×</span>{" "}
            <ClickMechanicLogo className="text-2xl" />
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            How we&apos;d expand ClickMechanic beyond the single pre-purchase-inspection
            CTA that&apos;s already live. The focus is the two products where
            ClickMechanic is strongest and there&apos;s no overlap with our existing
            MOT-booking partner: <strong className="text-white">EV charger installs</strong>{" "}
            and <strong className="text-white">pre-purchase inspections</strong> — each
            on its own Free Plate Check-hosted, co-branded page.
          </p>

          <div className="mt-8 space-y-4">
            {PAGES.map(({ href, Icon, tag, title, desc, cta }) => (
              <Link
                key={href}
                href={href}
                className="group block rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:border-slate-600"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${CM}1f` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: CM }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{tag}</p>
                    <h2 className="mt-0.5 text-lg font-bold text-white">{title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-200 group-hover:gap-2 transition-all">
                      {cta} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-400">
            <p className="flex items-center gap-2 font-semibold text-slate-200">
              <PoundSterling className="h-4 w-4" style={{ color: CM }} /> Why these two
              first
            </p>
            <p className="mt-1.5">
              EV installs carry the highest order value (~£950, so ~£40 per completed
              job at 4%). Inspections are the natural companion to a buyer&apos;s history
              check. Neither competes with our established MOT-booking partner — so we
              grow in clean lanes rather than cannibalising.
            </p>
          </div>
        </div>
      </main>
    </PreviewGate>
  );
}
