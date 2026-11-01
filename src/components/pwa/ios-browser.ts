"use client";

/**
 * Which iPhone browser the visitor is in, so the add-to-Home-Screen steps
 * (and the walkthrough animation) match what's on their screen.
 *
 * - "safari-new": Safari on iOS 26+, where Share sits under the ••• (or ≡)
 *   button beside the address bar.
 * - "safari": Safari up to iOS 18, Share in the bottom toolbar.
 * - "chrome": Chrome on iOS, Share in the address bar.
 * - "other": Brave (whose user agent is identical to Safari's, but which
 *   exposes navigator.brave), Firefox, Edge, DuckDuckGo, the Google app —
 *   none can make a proper Home Screen app, so they're sent to Safari.
 */
export type IosBrowser = "safari-new" | "safari" | "chrome" | "other";

export function iosBrowser(): IosBrowser {
  if (typeof navigator === "undefined") return "safari";
  const ua = navigator.userAgent;
  if ((navigator as Navigator & { brave?: unknown }).brave) return "other";
  if (/CriOS/.test(ua)) return "chrome";
  if (/FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA\//.test(ua)) return "other";
  const safari = ua.match(/Version\/(\d+)/);
  if (!safari) return "other";
  return Number(safari[1]) >= 26 ? "safari-new" : "safari";
}

/** Where the Share button lives, which is what the animation draws. */
export type ShareLayout = "toolbar" | "menu" | "address-bar";

export function shareLayout(browser: IosBrowser): ShareLayout {
  if (browser === "safari-new") return "menu";
  if (browser === "chrome") return "address-bar";
  return "toolbar";
}
