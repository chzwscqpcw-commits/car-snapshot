"use client";

import { useState, useEffect, type MouseEvent } from "react";
import { Bell, X } from "lucide-react";

/**
 * Slim, dismissible bottom banner that slides up after 25% scroll.
 * Always routes to the dedicated /mot-reminder page in ONE click (the richest
 * reminder experience — email + no-email calendar). Previously it scrolled to
 * an in-page #mot-reminder widget where one existed, which read as needing two
 * clicks to actually reach the reminder page. Dismissal stored in sessionStorage.
 */
export default function MotReminderBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("mot-banner-dismissed")) {
      // Reads sessionStorage (browser-only) to honour a prior dismissal.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(true);
      return;
    }

    function onScroll() {
      const scrollPercent =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.25) {
        setVisible(true);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("mot-banner-dismissed", "1");
  }

  // Carry the last-looked-up reg through (read at click time) so /mot-reminder
  // pre-fills it — saves the user retyping a reg they just searched.
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    handleDismiss();
    let reg: string | null = null;
    try {
      const arr = JSON.parse(localStorage.getItem("fpcRecent") || "null");
      if (Array.isArray(arr) && typeof arr[0] === "string" && arr[0]) reg = arr[0];
    } catch {
      /* ignore */
    }
    e.preventDefault();
    window.location.href = reg ? `/mot-reminder?vrm=${encodeURIComponent(reg)}` : "/mot-reminder";
  }

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 transition-transform duration-500 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="border-t border-emerald-800/50 bg-slate-900/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Bell className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            <p className="text-sm text-slate-300">
              <span className="hidden sm:inline">Your MOT could be due soon &mdash; </span>
              <a
                href="/mot-reminder"
                onClick={handleClick}
                className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Set a free reminder
              </a>
              <span className="hidden sm:inline text-slate-500 text-xs ml-2">
                (up to &pound;1,000 fine for driving without)
              </span>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded p-1 text-slate-500 transition-colors hover:text-slate-300"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
