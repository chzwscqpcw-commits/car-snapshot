"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlignLeft, Copy, Ellipsis, Share, SquarePlus, X } from "lucide-react";
import BoltMark from "@/components/BoltMark";
import { trackEvent } from "@/lib/tracking";
import { getDeferredPrompt, installPlatform, setDeferredPrompt, subscribeInstall, type InstallPlatform } from "@/components/pwa/pwa-store";

/** What this visitor can install with: phones only, and nothing once installed. */
function offer(): InstallPlatform {
  if (typeof window === "undefined") return "none";
  if (!window.matchMedia?.("(pointer: coarse)").matches) return "none";
  return installPlatform();
}

type IosBrowser = "safari-new" | "safari" | "chrome" | "other";

/**
 * Which iPhone browser, so the steps match what's on screen. Safari 26 moved
 * Share behind the menu button by the address bar; Chrome keeps it in the
 * address bar; Brave (whose user agent is identical to Safari's, but which
 * exposes navigator.brave), Firefox and the rest can't make a proper
 * home-screen app, so they're sent to Safari.
 */
function iosBrowser(): IosBrowser {
  const ua = navigator.userAgent;
  if ((navigator as Navigator & { brave?: unknown }).brave) return "other";
  if (/CriOS/.test(ua)) return "chrome";
  if (/FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA\//.test(ua)) return "other";
  const safari = ua.match(/Version\/(\d+)/);
  if (!safari) return "other";
  return Number(safari[1]) >= 26 ? "safari-new" : "safari";
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
  const [browser, setBrowser] = useState<IosBrowser>("safari");
  const [copied, setCopied] = useState(false);
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
      setBrowser(iosBrowser());
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

  // Safari can open its share sheet straight from the page, sparing the hunt
  // for the Share button (whether "Add to Home Screen" is offered there is
  // what pwa_share_sheet measures).
  const canShareSheet = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const openShareSheet = async () => {
    trackEvent("pwa_share_sheet", { browser });
    try {
      await navigator.share({ title: "Free Plate Check", url: location.origin + "/" });
    } catch {
      // Closed without choosing: nothing to do.
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.origin + "/");
      setCopied(true);
      trackEvent("pwa_copy_for_safari");
    } catch {
      // Clipboard refused: the address is shown on screen to copy by hand.
    }
  };

  const step = (n: number, body: React.ReactNode) => (
    <li className="flex items-center gap-2 flex-wrap">
      <span className="w-5 h-5 shrink-0 rounded-full bg-slate-800 text-[11px] font-semibold text-cyan-300 flex items-center justify-center">{n}</span>
      {body}
    </li>
  );
  const strong = (t: string) => <span className="font-medium text-white">{t}</span>;
  const addStep = step(
    2,
    <>
      Choose <SquarePlus className="w-4 h-4 text-cyan-400" aria-hidden="true" /> {strong("Add to Home Screen")}
      <span className="text-slate-500">(scroll the list if it&apos;s hidden)</span>
    </>,
  );

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

        {showSteps && browser === "other" && (
          <div className="mt-3 grid gap-2 text-[13px] text-slate-300">
            <p>
              This browser can&apos;t add it as an app. Open {strong("freeplatecheck.co.uk")} in {strong("Safari")}, then
              add it from there.
            </p>
            <button
              type="button"
              onClick={copyLink}
              className="justify-self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Link copied" : "Copy link for Safari"}
            </button>
          </div>
        )}

        {showSteps && browser !== "other" && (
          <ol className="mt-3 grid gap-2 text-[13px] text-slate-300">
            {canShareSheet && browser !== "chrome"
              ? step(
                  1,
                  <>
                    <button
                      type="button"
                      onClick={openShareSheet}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                    >
                      <Share className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                      Open the share menu
                    </button>
                    <span className="text-slate-500">or</span>
                    {browser === "safari-new" ? (
                      <>
                        tap <AlignLeft className="w-4 h-4 text-cyan-400" aria-label="the menu button" /> or{" "}
                        <Ellipsis className="w-4 h-4 text-cyan-400" aria-hidden="true" /> by the address bar, then {strong("Share")}
                      </>
                    ) : (
                      <>
                        tap <Share className="w-4 h-4 text-cyan-400" aria-hidden="true" /> {strong("Share")} at the bottom
                      </>
                    )}
                  </>,
                )
              : step(
                  1,
                  browser === "chrome" ? (
                    <>
                      Tap <Share className="w-4 h-4 text-cyan-400" aria-hidden="true" /> {strong("Share")} in the address bar
                    </>
                  ) : browser === "safari-new" ? (
                    <>
                      Tap <AlignLeft className="w-4 h-4 text-cyan-400" aria-label="the menu button" /> or{" "}
                      <Ellipsis className="w-4 h-4 text-cyan-400" aria-hidden="true" /> by the address bar, then {strong("Share")}
                    </>
                  ) : (
                    <>
                      Tap <Share className="w-4 h-4 text-cyan-400" aria-hidden="true" /> {strong("Share")} at the bottom of the screen
                    </>
                  ),
                )}
            {addStep}
          </ol>
        )}
      </div>
    </div>
  );
}
