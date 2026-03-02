"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnsubscribeContent() {
  const params = useSearchParams();
  const status = params.get("status");

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === "success" && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-8">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Unsubscribed</h1>
            <p className="text-slate-400 text-sm mb-6">
              You&apos;ve been removed from MOT reminders for this vehicle. You won&apos;t receive any more emails.
            </p>
            <a
              href="/"
              className="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2"
            >
              Back to Free Plate Check
            </a>
          </div>
        )}

        {status === "not-found" && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-8">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Already unsubscribed</h1>
            <p className="text-slate-400 text-sm mb-6">
              This reminder has already been cancelled, or the link has expired.
            </p>
            <a
              href="/"
              className="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2"
            >
              Back to Free Plate Check
            </a>
          </div>
        )}

        {(status === "invalid" || status === "error" || !status) && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-8">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Invalid link</h1>
            <p className="text-slate-400 text-sm mb-6">
              This unsubscribe link is invalid or has expired. If you&apos;re still receiving emails, please check your vehicle on our site and sign up again with a new reminder.
            </p>
            <a
              href="/"
              className="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2"
            >
              Back to Free Plate Check
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
