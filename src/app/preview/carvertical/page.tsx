"use client";

import { useState, useEffect, type FormEvent } from "react";
import CarVerticalReportCTA from "@/components/CarVerticalReportCTA";
import SellingToBuyBridge from "@/components/SellingToBuyBridge";

// Simple shareable password so the mock-up can be shown to carVertical for the
// agreement 1.1 sign-off without exposing the admin PIN. The page is noindexed
// via preview/layout.tsx.
const PREVIEW_PASSWORD = "fpc-preview-2026";
const SESSION_KEY = "fpc_preview_unlocked";

export default function CarVerticalPreviewPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore unlock from sessionStorage after mount (client-only; cannot run during SSR)
      setAuthed(true);
    }
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (pw === PREVIEW_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setErr(false);
    } else {
      setErr(true);
    }
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-lg font-semibold text-white">Preview</h1>
          <p className="mt-1 text-sm text-slate-400">Enter the password to view this mock-up.</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Password"
            autoFocus
            className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {err && <p className="mt-2 text-sm text-red-400">Wrong password. Try again.</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600"
          >
            View mock-up
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 rounded-lg border border-amber-700/40 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300">
          Placements 1 and 2 are live. Placements 3–5 are proposed and not yet
          live — shared here for coordination under clause 1.1 ahead of
          publishing. The carVertical logo is a placeholder wordmark; their
          official asset goes in on launch.
        </div>

        <div className="mb-10 rounded-lg border border-slate-700/60 bg-slate-900/50 p-4 text-sm leading-relaxed text-slate-400">
          <p className="mb-2 font-semibold text-slate-200">Why these three</p>
          <p className="mb-2">
            41% of our visitors land directly on a valuation page, and they are
            overwhelmingly valuing a car they already own — while 57% of all our
            carVertical clicks fire from that same screen, under a CTA that opens
            &ldquo;Buying this car?&rdquo;. That mismatch is the likeliest source of
            the checkout drop-off described on 7 August: a seller clicks out of
            curiosity, meets a paid checkout for a car they own, and leaves.
          </p>
          <p>
            Placement 3 addresses who is actually there. Placement 4 attaches a
            resolution to the one moment where we detect a problem and currently
            offer nothing to resolve it with. Placement 5 catches the same visitor
            at the point their intent flips from selling to buying.
          </p>
        </div>

        {/* Placement 1 — in the vehicle results */}
        <section className="mb-12">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
            Placement 1
          </p>
          <h2 className="mb-1 text-xl font-bold text-white">In the vehicle report</h2>
          <p className="mb-5 text-sm text-slate-400">
            Shown after someone looks up a car they&apos;re considering buying —
            the full free-vs-paid comparison. Appears on the results page and the
            buyer-intent landing pages (/car-check, /mot-check).
          </p>
          <CarVerticalReportCTA preview regNumber="AB12CDE" variant="report" />
        </section>

        {/* Placement 2 — the mileage-check landing page */}
        <section>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
            Placement 2
          </p>
          <h2 className="mb-1 text-xl font-bold text-white">
            On the mileage-check page
          </h2>
          <p className="mb-5 text-sm text-slate-400">
            A clocking-themed prompt for{" "}
            <span className="text-slate-300">freeplatecheck.co.uk/mileage-check</span>{" "}
            — leading with odometer-rollback detection, where carVertical&apos;s
            mileage cross-checks add most over our free MOT-mileage timeline.
          </p>
          <CarVerticalReportCTA
            preview
            regNumber="AB12CDE"
            variant="mileage"
            context="mileage-carvertical"
          />
        </section>

        {/* Placement 3 — the seller reframe on the valuation result */}
        <section className="mt-12">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Placement 3 — proposed
          </p>
          <h2 className="mb-1 text-xl font-bold text-white">
            On the valuation result, framed for sellers
          </h2>
          <p className="mb-5 text-sm text-slate-400">
            Replaces the buyer-framed box currently shown to owners valuing their
            own car. The pitch is the report as proof for the listing, not as
            discovery — for most sellers it will find nothing, and that is the
            thing being sold. We have deliberately kept the copy away from any
            suggestion that an owner is likely to find fraud on their own car,
            since overstating it would earn refunds rather than sales.
          </p>
          <CarVerticalReportCTA
            preview
            regNumber="AB12CDE"
            variant="seller"
            context="valuation-result-seller"
          />
        </section>

        {/* Placement 4 — attached to a detected rollback */}
        <section className="mt-12">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Placement 4 — proposed
          </p>
          <h2 className="mb-1 text-xl font-bold text-white">
            Attached to a detected mileage rollback
          </h2>
          <p className="mb-5 text-sm text-slate-400">
            Our mileage tool already flags rollbacks and implausible jumps, tells
            the visitor the reading is worth investigating, and then offers
            nothing to investigate with. This fires only when a flag is actually
            raised. The claims reuse the wording already published in placement 2
            rather than introducing new ones.
          </p>
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/30 p-5">
            <p className="text-sm font-semibold text-rose-200">
              Mileage anomaly detected
            </p>
            <p className="mt-1 text-xs text-rose-200/80">
              These are signals worth investigating — they can indicate clocking,
              transcription errors, or major repairs.
            </p>
            <p className="mt-3 rounded-lg border border-rose-500/20 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
              <span className="mr-1 font-semibold">Rollback:</span>
              reading fell 14,320 miles between the 2021 and 2022 tests
            </p>
          </div>
          <div className="mt-4">
            <CarVerticalReportCTA
              preview
              regNumber="AB12CDE"
              variant="anomaly"
              context="mileage-anomaly-carvertical"
            />
          </div>
        </section>

        {/* Placement 5 — the seller→buyer bridge */}
        <section className="mt-12">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Placement 5 — proposed
          </p>
          <h2 className="mb-1 text-xl font-bold text-white">
            The selling-to-buying bridge
          </h2>
          <p className="mb-5 text-sm text-slate-400">
            Sits below placement 3. Someone valuing their car is usually weeks
            from buying one, and is already here with the tools open. The free
            route is ours and deliberately listed first — sending them back into
            our own funnel with real buyer intent is the point, since buyer-intent
            volume is the constraint on this partnership rather than conversion
            rate.
          </p>
          <SellingToBuyBridge preview context="valuation-selling-to-buy" />
        </section>
      </div>
    </main>
  );
}
