"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/tracking";
import { isStandalone, setDeferredPrompt, type InstallPromptEvent } from "@/components/pwa/pwa-store";

/**
 * Site-wide PWA plumbing, mounted once in the layout. Registers the service
 * worker (production only, so local dev never caches anything), holds on to
 * Chrome's install prompt for InstallCard, and records installs and launches
 * from the home screen. Renders nothing.
 */
export default function PwaSetup() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // we show our own card, after a lookup
      setDeferredPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      trackEvent("pwa_installed");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // An install aid only; the site works the same without it.
      });
    }

    // Once per session: how many visits start from the home-screen icon.
    try {
      if (isStandalone() && !sessionStorage.getItem("fpc_pwa_launch")) {
        sessionStorage.setItem("fpc_pwa_launch", "1");
        trackEvent("pwa_launch");
      }
    } catch {
      // sessionStorage blocked: skip the count.
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
