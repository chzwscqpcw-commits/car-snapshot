"use client";

import { PoundSterling, ChevronRight, Wrench } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

/**
 * Post-PDF-download promo banner. PDF downloaders are highly engaged, so the
 * moment after a download is prime for a booking nudge. Leads with the cheap-
 * MOT offer (the regulated £54.85-cap angle → BookMyGarage booking) and offers
 * servicing as a secondary. Routes into the /booking wizard (reg pre-filled)
 * with source=pdf_promo so this surface's contribution to BMG bookings is
 * attributable separately. The actual partner_click fires at wizard Step 4;
 * here we record pdf_promo_click as the intent signal.
 *
 * Only rendered for MOT-relevant (3+ year) vehicles after a download — see the
 * showPdfPromo trigger in page.tsx.
 */
export default function PdfPromoBanner({
  regNumber,
  makeModel,
}: {
  regNumber?: string;
  makeModel?: string;
}) {
  const reg = (regNumber ?? "").toUpperCase();

  // NOTE: deliberately does NOT scroll itself into view. The banner appears in
  // Next Steps after a PDF download; auto-scrolling there yanked the user down
  // (and away from the high-value MOT-status banner at the top) the moment they
  // clicked "Free Report". It now waits to be found by natural scrolling.

  function bookingHref(type: "mot" | "full") {
    const qs = new URLSearchParams({ type, source: "pdf_promo" });
    if (reg) qs.set("vrm", reg);
    return `/booking?${qs.toString()}`;
  }

  return (
    <div className="rounded-xl border border-emerald-700/50 bg-gradient-to-br from-emerald-950/60 to-cyan-950/40 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <PoundSterling className="h-6 w-6 shrink-0 text-emerald-400 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-emerald-50 sm:text-lg">
            Report saved — now save on your MOT
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            The legal maximum is <strong className="text-slate-100">&pound;54.85</strong>, but
            many garages charge less{reg ? ` near ${makeModel ? `your ${makeModel}` : reg}` : ""}.
            Compare local prices in seconds &mdash; the test is identical wherever you go.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <a
              href={bookingHref("mot")}
              onClick={() =>
                trackEvent("pdf_promo_click", { service: "mot", has_reg: Boolean(reg) })
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/30 transition-all hover:from-emerald-600 hover:to-cyan-600 active:scale-95 sm:flex-initial"
            >
              Compare MOT prices
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
            <a
              href={bookingHref("full")}
              onClick={() =>
                trackEvent("pdf_promo_click", { service: "full", has_reg: Boolean(reg) })
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-600 hover:text-white sm:flex-initial"
            >
              <Wrench className="h-3.5 w-3.5" />
              Service prices too
            </a>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Free comparison &middot; No booking fee &middot; Free Plate Check may earn a small commission.
          </p>
        </div>
      </div>
    </div>
  );
}
