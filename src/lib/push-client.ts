"use client";

import { isStandalone } from "@/components/pwa/pwa-store";

/**
 * The browser's side of web push. Nothing here runs until the visitor has
 * saved a car and tapped "Notify me": permission is never asked on load.
 */

export type PushAvailability =
  | { kind: "ready" }
  /** iPhone/iPad in the browser: push only works from a Home Screen install. */
  | { kind: "ios-install" }
  | { kind: "unsupported" }
  | { kind: "denied" };

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export function pushAvailability(): PushAvailability {
  if (typeof window === "undefined") return { kind: "unsupported" };
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return { kind: "unsupported" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return isIos() && !isStandalone() ? { kind: "ios-install" } : { kind: "unsupported" };
  }
  if (isIos() && !isStandalone()) return { kind: "ios-install" };
  if (Notification.permission === "denied") return { kind: "denied" };
  return { kind: "ready" };
}

function base64UrlToBytes(s: string): Uint8Array {
  const padded = (s + "=".repeat((4 - (s.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const SUBSCRIBE_TIMEOUT_MS = 15_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(null);
      },
    );
  });
}

export interface PushSubscriptionJson {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Ask for permission and subscribe. Returns null when the visitor says no
 * (or the browser does); the card then falls back to email.
 */
export async function subscribeToPush(): Promise<PushSubscriptionJson | null> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  // PwaSetup registers /sw.js on production builds; `ready` waits for it.
  // Subscribing talks to the browser vendor's push service; when that can't
  // be reached (a locked-down network, headless Chrome) it can sit there for
  // a long time, so give it a bounded wait and fall back to email.
  const sub = await withTimeout(
    (async () => {
      const reg = await navigator.serviceWorker.ready;
      return (
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToBytes(key) as BufferSource,
        }))
      );
    })(),
    SUBSCRIBE_TIMEOUT_MS,
  );
  if (!sub) return null;
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
}
