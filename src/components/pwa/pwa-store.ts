"use client";

// Shared install state for the PWA pieces. Chrome/Android fires
// `beforeinstallprompt` once, early, on whatever page the visitor lands on;
// PwaSetup (in the layout) catches it here so InstallCard can use it later,
// on the result page. iOS never fires it: there, installing is Share → Add to
// Home Screen, so the card shows instructions instead.

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "prompt" | "ios" | "none";

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function setDeferredPrompt(e: InstallPromptEvent | null) {
  deferred = e;
  listeners.forEach((l) => l());
}

export function getDeferredPrompt(): InstallPromptEvent | null {
  return deferred;
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Already running from the home screen? */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch points give it away.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/** How this visitor could install, right now. */
export function installPlatform(): InstallPlatform {
  if (typeof window === "undefined" || isStandalone()) return "none";
  if (deferred) return "prompt";
  if (isIos()) return "ios";
  return "none";
}
