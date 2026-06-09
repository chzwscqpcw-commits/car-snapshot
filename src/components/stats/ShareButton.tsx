"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/**
 * Standalone share affordance for shareable stats pages. Uses the native share
 * sheet on mobile, falls back to copy-to-clipboard on desktop.
 */
export default function ShareButton({
  text = "How many of your car are left on UK roads?",
  url,
  label = "Share this",
  className,
}: {
  text?: string;
  url?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const u = url || (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "How Many Left?", text, url: u });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${u}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/20"
      }
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Link copied!" : label}
    </button>
  );
}
