"use client";

import PreviewGate from "@/components/preview/PreviewGate";
import SellCarCTA from "@/components/SellCarCTA";

/**
 * The We Buy Any Car offer as it appears on the live valuation pages (Rakuten
 * Advertising, live 28 Oct 2026). The link goes to /go/webuyanycar.
 */
export default function WeBuyAnyCarPreviewPage() {
  return (
    <PreviewGate>
      <main className="min-h-screen bg-slate-950 px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-xl font-semibold text-white">We Buy Any Car — preview</h1>
          <p className="text-sm text-slate-400">
            Shown under the carVertical seller box on the valuation tool and the homepage
            valuation, for cars we value. Never shown for vans.
          </p>
          <SellCarCTA context="valuation-result-wbac" regNumber="AB12CDE" isVan={false} vehicleName="Ford Focus" preview />
        </div>
      </main>
    </PreviewGate>
  );
}
