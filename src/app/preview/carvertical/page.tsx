"use client";

import { useState, useEffect, type FormEvent } from "react";
import CarVerticalReportCTA from "@/components/CarVerticalReportCTA";

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
          Mock-up for review — not live on the site. The carVertical logo is a
          placeholder wordmark; their official asset goes in on launch. Two
          placements are proposed, shown below.
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
      </div>
    </main>
  );
}
