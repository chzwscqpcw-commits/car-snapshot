"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary that catches errors in the root layout
 * itself (e.g. SiteNav, SiteFooter, the providers). Replaces the entire
 * document since the layout — and therefore the <html>/<body> chrome
 * we'd normally inherit — has crashed.
 *
 * Kept deliberately minimal: inline styles only (no Tailwind / globals.css
 * because those load via the layout), no imports of components that
 * themselves might be the source of the crash.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#020617",
          color: "#e2e8f0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          {/* Inline bolt mark — no component import, no SVG asset */}
          <div
            style={{
              fontSize: 48,
              color: "#22d3ee",
              filter: "drop-shadow(0 0 18px rgba(34,211,238,0.4))",
              marginBottom: 24,
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            ⚡
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Free Plate Check ran into a problem
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#94a3b8",
              lineHeight: 1.6,
              marginTop: 12,
              marginBottom: 28,
            }}
          >
            A page-level error stopped us loading. Refreshing usually clears it.
            {error.digest && (
              <span
                style={{
                  display: "block",
                  marginTop: 12,
                  fontSize: 11,
                  color: "#475569",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                }}
              >
                error id: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(6, 182, 212, 0.25)",
            }}
          >
            Refresh and try again
          </button>
        </div>
      </body>
    </html>
  );
}
