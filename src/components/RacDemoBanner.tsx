"use client";

/**
 * RAC Placement Demo — banner components.
 * Only render when the fpc_demo=rac cookie is set (via useRacDemo).
 * All banners use RAC-provided creative only — no custom marketing copy (FCA compliance).
 */

import { useRacDemo } from "./RacDemoContext";

/* ── shared annotation wrapper ── */
function DemoAnnotation({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative border-2 border-dashed border-orange-500 rounded-xl overflow-hidden bg-slate-900/50">
      <span className="absolute top-0 left-4 bg-orange-500 text-black text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-b-lg z-10">
        {label}
      </span>
      <div className="pt-7 px-4 pb-2 flex justify-center">{children}</div>
      <div className="text-center text-slate-500 text-xs italic py-2 bg-orange-500/5 border-t border-orange-500/20">
        {caption}
      </div>
    </div>
  );
}

/* ── Placement 1: inline 300×250 ── */
export function RacDemoInlineBanner() {
  const { isRacDemo } = useRacDemo();
  if (!isRacDemo) return null;

  return (
    <div className="my-8">
      <DemoAnnotation
        label="AD PLACEMENT 1 — INLINE"
        caption="Shown after vehicle status summary — highest intent placement"
      >
        <a href="#" onClick={(e) => e.preventDefault()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/demo/rac/rac-300x250.jpg"
            alt="RAC Breakdown Cover"
            width={300}
            height={250}
            className="rounded-lg"
          />
        </a>
      </DemoAnnotation>
    </div>
  );
}

/* ── Placement 2: sidebar 400×400 ── */
export function RacDemoSidebarBanner() {
  const { isRacDemo } = useRacDemo();
  if (!isRacDemo) return null;

  return (
    <div className="my-8">
      <DemoAnnotation
        label="AD PLACEMENT 2 — SIDEBAR"
        caption="Persistent sidebar placement alongside vehicle results"
      >
        <a href="#" onClick={(e) => e.preventDefault()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/demo/rac/rac-400x400.jpg"
            alt="RAC Breakdown Cover"
            width={400}
            height={400}
            className="rounded-lg max-w-full"
          />
        </a>
      </DemoAnnotation>
    </div>
  );
}

/* ── Floating badge — top-right corner ── */
export function RacDemoFloatingBadge() {
  const { isRacDemo } = useRacDemo();
  if (!isRacDemo) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-orange-500 text-black font-mono font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-full shadow-lg">
      RAC PLACEMENT DEMO
    </div>
  );
}

/* ── Bottom bar with explanation + exit ── */
export function RacDemoBottomBar() {
  const { isRacDemo, exitDemo } = useRacDemo();
  if (!isRacDemo) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t-2 border-orange-500 px-4 py-2.5 flex items-center justify-between gap-4">
      <p className="text-xs text-slate-400 leading-snug">
        <span className="text-orange-400 font-semibold">Demo mode</span> — You&apos;re viewing
        the RAC ad placement demo. Banners shown are RAC-approved from the Awin toolkit. All
        placements use only pre-approved creative — no custom copy.
      </p>
      <button
        onClick={exitDemo}
        className="flex-shrink-0 px-4 py-1.5 text-xs font-semibold bg-orange-500 text-black rounded-lg hover:bg-orange-400 transition-colors"
      >
        Exit Demo
      </button>
    </div>
  );
}
