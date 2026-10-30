"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Share, SquarePlus, X } from "lucide-react";
import BoltMark from "@/components/BoltMark";
import { trackEvent } from "@/lib/tracking";
import { getDeferredPrompt, installPlatform, setDeferredPrompt, subscribeInstall, type InstallPlatform } from "@/components/pwa/pwa-store";

const DISMISS_KEY = "fpc_install_dismissed";
const DISMISS_DAYS = 30;

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

/** What to offer this visitor: nothing on desktop, once installed, or soon after a "Not now". */
function offer(): InstallPlatform {
  if (typeof window === "undefined") return "none";
  if (!window.matchMedia?.("(pointer: coarse)").matches) return "none";
  if (recentlyDismissed()) return "none";
  return installPlatform();
}

/**
 * "Add Free Plate Check to your home screen", shown in the results on phones.
 * Android/Chrome gets a one-tap install (the browser's own prompt); iPhone
 * gets the Share → Add to Home Screen steps, since iOS has no prompt to call.
 */
export default function InstallCard({ className = "" }: { className?: string }) {
  const platform = useSyncExternalStore(subscribeInstall, offer, () => "none" as InstallPlatform);
  const [closed, setClosed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(false);

  const visible = platform !== "none" && !closed;

  useEffect(() => {
    const el = ref.current;
    if (!visible || !el || seen.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !seen.current) {
          seen.current = true;
          trackEvent("pwa_prompt_shown", { platform });
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, platform]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Storage blocked: it just comes back next visit.
    }
    trackEvent("pwa_prompt_dismiss", { platform });
    setClosed(true);
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
    if (outcome === "accepted") setClosed(true);
  };

  return (
    <div
      ref={ref}
      className={`relative rounded-xl border border-cyan-800/40 bg-gradient-to-br from-cyan-950/30 to-slate-900/40 p-4 ${className}`}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="absolute top-2.5 right-2.5 p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-11 h-11 shrink-0 rounded-[12px] bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 flex items-center justify-center">
          <BoltMark className="w-4 h-6" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">Keep Free Plate Check on your home screen</h3>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-400">
            Opens like an app for your next check. No app store, nothing to sign up for.
          </p>
        </div>
      </div>

      {showSteps ? (
        <ol className="mt-3 grid gap-2 text-[13px] text-slate-300">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 shrink-0 rounded-full bg-slate-800 text-[11px] font-semibold text-cyan-300 flex items-center justify-center">1</span>
            Tap <Share className="w-4 h-4 text-cyan-400" aria-label="Share" /> <span className="font-medium text-white">Share</span> in your browser
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 shrink-0 rounded-full bg-slate-800 text-[11px] font-semibold text-cyan-300 flex items-center justify-center">2</span>
            Choose <SquarePlus className="w-4 h-4 text-cyan-400" aria-hidden="true" /> <span className="font-medium text-white">Add to Home Screen</span>
          </li>
        </ol>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={install}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors"
          >
            <SquarePlus className="w-4 h-4" />
            Add to home screen
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/60 transition-colors"
          >
            Not now
          </button>
        </div>
      )}
    </div>
  );
}
