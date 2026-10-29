"use client";

import PreviewGate from "@/components/preview/PreviewGate";
import InsuranceCTA from "@/components/InsuranceCTA";
import TempInsuranceCTA from "@/components/TempInsuranceCTA";

/**
 * The insurance cards before any insurer is live (prepared 29 Oct 2026 for
 * RVU: confused.com / Uswitch / Tempcover). Shown with each slot's first-choice
 * partner; the buttons go nowhere here.
 */
export default function InsurancePreviewPage() {
  return (
    <PreviewGate>
      <main className="min-h-screen bg-slate-950 px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-xl font-semibold text-white">Insurance placements: preview</h1>
          <p className="text-sm text-slate-400">
            Nothing here is live yet. Each card switches on when its insurer&apos;s link is added, and shows that
            insurer&apos;s name. Brand names are placeholders until RVU confirms which brand covers which product.
          </p>

          <h2 className="pt-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Car: homepage, under running costs</h2>
          <InsuranceCTA context="money-insurance" kind="car" vehicleName="Ford Focus" preview />

          <h2 className="pt-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Van: same slots, for vans</h2>
          <InsuranceCTA context="running-costs-insurance" kind="van" vehicleName="Ford Transit Custom" preview />

          <h2 className="pt-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Motorbike</h2>
          <InsuranceCTA context="running-costs-insurance" kind="motorbike" vehicleName="Honda CB500F" preview />

          <h2 className="pt-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Temporary cover: buyer&apos;s checklist, step 4</h2>
          <TempInsuranceCTA context="buyer-check-temp-cover" headline="Insured for the test drive?" preview />
        </div>
      </main>
    </PreviewGate>
  );
}
