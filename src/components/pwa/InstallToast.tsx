"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Ellipsis, Share, SquarePlus, X } from "lucide-react";
import BoltMark from "@/components/BoltMark";
import { trackEvent } from "@/lib/tracking";
import { getDeferredPrompt, installPlatform, setDeferredPrompt, subscribeInstall, type InstallPlatform } from "@/components/pwa/pwa-store";

/** What this visitor can install with: phones only, and nothing once installed. */
function offer(): InstallPlatform {
  if (typeof window === "undefined") return "none";
  if (!window.matchMedia?.("(pointer: coarse)").matches) return "none";
  return installPlatform();
}

/** "prompt" (Android/Chrome), "ios" (Share sheet steps) or "none" (desktop, installed). */
export function useInstallOffer(): InstallPlatform {
  return useSyncExternalStore(subscribeInstall, offer, () => "none" as InstallPlatform);
}

/**
 * The scroll-triggered bottom prompt on results, for phones that can install
 * the site (it replaces the share ask there; desktop keeps sharing). Android
 * gets the browser's own install prompt; iPhone gets the Share-sheet steps,
 * written for both Safari layouts (Share in the toolbar, or under ••• since
 * iOS 26).
 */
export default function InstallToast({
  platform,
  onDismiss,
  className = "",
}: {
  platform: Exclude<InstallPlatform, "none">;
  onDismiss: () => void;
  className?: string;
}) {
  const [showSteps, setShowSteps] = useState(false);
  const seen = useRef(false);

  useEffect(() => {
    if (seen.current) return;
    seen.current = true;
    trackEvent("pwa_prompt_shown", { platform });
  }, [platform]);

  const dismiss = () => {
    trackEvent("pwa_prompt_dismiss", { platform });
    onDismiss();
  };

  const install = async () => {
    trackEvent("pwa_prompt_click", { platform });
    if (platform === "ios") {
      setShowSteps(true);
      return;
    }
    const e = getDeferredPrompt();
    if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    trackEvent("pwa_prompt_result", { outcome });
    setDeferredPrompt(null); // the browser only lets us prompt once
    onDismiss();
  };

  return (
    <div className={`fixed left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:max-w-md z-50 animate-slideUpIn ${className}`}>
      <div className="p-4 bg-slate-900 border border-cyan-800/50 rounded-lg shadow-lg shadow-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-[10px] bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 flex items-center justify-center">
            <BoltMark className="w-3.5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200">Add Free Plate Check to your home screen</p>
            <p className="text-xs text-slate-400 mt-0.5">Opens like an app. No app store needed.</p>
          </div>
          {!showSteps && (
            <button
              type="button"
              onClick={install}
              className="px-3.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold rounded-full transition-colors whitespace-nowrap"
            >
              {platform === "ios" ? "Show me" : "Add"}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="text-slate-500 hover:text-slate-400 transition-colors p-1 -mr-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showSteps && (
          <ol className="mt-3 grid gap-2 text-[13px] text-slate-300">
            <li className="flex items-center gap-2 flex-wrap">
              <span className="w-5 h-5 shrink-0 rounded-full bg-slate-800 text-[11px] font-semibold text-cyan-300 flex items-center justify-center">1</span>
              Tap <Share className="w-4 h-4 text-cyan-400" aria-hidden="true" /> <span className="font-medium text-white">Share</span>
              <span className="text-slate-500">or</span>
              <Ellipsis className="w-4 h-4 text-cyan-400" aria-hidden="true" /> then <span className="font-medium text-white">Share</span>
            </li>
            <li className="flex items-center gap-2 flex-wrap">
              <span className="w-5 h-5 shrink-0 rounded-full bg-slate-800 text-[11px] font-semibold text-cyan-300 flex items-center justify-center">2</span>
              Choose <SquarePlus className="w-4 h-4 text-cyan-400" aria-hidden="true" /> <span className="font-medium text-white">Add to Home Screen</span>
              <span className="text-slate-500">(scroll the list if it&apos;s hidden)</span>
            </li>
          </ol>
        )}
      </div>
    </div>
  );
}
