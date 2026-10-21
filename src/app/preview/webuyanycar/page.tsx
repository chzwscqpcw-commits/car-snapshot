"use client";

import PreviewGate from "@/components/preview/PreviewGate";
import SellCarCTA from "@/components/SellCarCTA";

/**
 * The We Buy Any Car offer as it will appear once Webgains approves us —
 * SellCarCTA renders nothing on the live pages until then. The link goes to
 * /go/webuyanycar, which sends visitors home while the partner is pending.
 */
export default function WeBuyAnyCarPreviewPage() {
  return (
    <PreviewGate>
      <main className="min-h-screen bg-slate-950 px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-xl font-semibold text-white">We Buy Any Car — preview</h1>
          <p className="text-sm text-slate-400">
            Shown under the carVertical seller box on the valuation tool and the homepage
            valuation, for cars we value. Hidden until the Webgains approval is in.
          </p>
          <SellCarCTA context="valuation-result-wbac" regNumber="AB12CDE" preview />
        </div>
      </main>
    </PreviewGate>
  );
}
