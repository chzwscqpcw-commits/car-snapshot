"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import BoltMark from "@/components/BoltMark";

/**
 * Caught client-side error boundary for route segments below the root
 * layout. Replaces the default Next.js error overlay with something
 * on-brand and actionable: "try again" (calls reset) or "go home".
 *
 * Catches: render errors, effect errors, async errors in event handlers,
 * and stale-bundle hydration mismatches after a deploy.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console so the digest is recoverable from devtools. Vercel
    // also captures uncaught errors with this digest server-side.
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <BoltMark glow className="h-10 w-8 mx-auto mb-6" />
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-700/60 bg-amber-900/20 px-3 py-1 text-xs font-medium text-amber-200 mb-5">
          <AlertTriangle className="h-3 w-3" />
          Something went wrong
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">
          We hit a snag rendering this page
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed mb-7">
          Most often this happens right after we ship an update — refreshing fetches the latest version and clears the error.
          {error.digest && (
            <span className="mt-3 block text-xs text-slate-600 font-mono">
              error id: {error.digest}
            </span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
