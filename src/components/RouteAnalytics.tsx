"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isInternalTraffic, setInternalTraffic } from "@/lib/tracking";

/**
 * Global first-party page-view tracker. Fires a `page_view` to /api/event on
 * initial load AND on every client-side route change (keyed on pathname), so
 * every page — homepage, landing pages, blog, stats pages — is tracked in
 * Supabase `site_events`, not just the homepage.
 *
 * Referrer policy: we ALWAYS capture document.referrer (the full string) on
 * every page_view rather than only the first hit of a session. Internal
 * navigation would otherwise pollute the "how people got here" view, so the
 * server-side source classifier (see /api/admin/stats) maps same-host
 * referrers to "Internal" and excludes them from the trafficSources output.
 * Always-capture is simpler than a sessionStorage first-hit flag and loses no
 * signal, because the first hit of a session is exactly the one with an
 * external (non-Internal) referrer.
 *
 * Delivery mirrors src/lib/tracking.ts: prefer navigator.sendBeacon (queued at
 * the browser level, survives unload) and fall back to fetch+keepalive.
 */
// Internal/admin path prefixes — the owner's own visits. We never fire a
// page_view from these, and the server-side analytics aggregation excludes
// the same prefixes so historical owner views don't pollute the stats either.
const INTERNAL_PATH_PREFIXES = ["/data-health", "/preview", "/demo"];

function sendPageView(): void {
  if (typeof window === "undefined") return;

  // Skip internal/admin pages (owner's own visits) so they don't pollute stats.
  const pathname = window.location.pathname;
  if (INTERNAL_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return;
  }

  let utmSource: string | undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    // Owner self-exclusion toggle: ?internal=1 sets the flag, ?internal=0
    // clears it. Processed before building the payload so this very page_view
    // is tagged correctly on the hit that flips it on.
    const internalParam = params.get("internal");
    if (internalParam === "1") setInternalTraffic(true);
    else if (internalParam === "0") setInternalTraffic(false);
    utmSource = params.get("utm_source") || undefined;
  } catch {
    utmSource = undefined;
  }

  const payload: Record<string, unknown> = {
    path: window.location.pathname,
    referrer: typeof document !== "undefined" ? document.referrer || "" : "",
  };
  if (utmSource) payload.utm_source = utmSource;
  if (isInternalTraffic()) payload.internal = true;

  const body = JSON.stringify({ type: "page_view", payload });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/event", blob)) return;
    } catch {
      // fall through to fetch
    }
  }

  try {
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Telemetry must never break the user flow.
  }
}

export default function RouteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    sendPageView();
    // Re-fire whenever the path changes (client-side navigation).
  }, [pathname]);

  return null;
}
