"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

interface RevealProps {
  /** Always-visible preview content (the "signal") shown in the trigger row. */
  summary: ReactNode;
  /** Collapsible detail. Stays in the DOM when collapsed (SEO / in-page-find safe). */
  children: ReactNode;
  /** Right-aligned action text when collapsed. */
  closedLabel?: string;
  /** Right-aligned action text when expanded. */
  openLabel?: string;
  /** Start expanded (e.g. for risk/warn sections that should never be buried). */
  defaultOpen?: boolean;
  /** Fire this analytics event once, on first expand (de-duped per mount). */
  eventName?: string;
  eventMeta?: Record<string, unknown>;
  className?: string;
}

/**
 * Progressive-disclosure primitive (Phase 2 of the usability redesign).
 *
 * A 44px tappable trigger row previews the signal; the detail collapses
 * underneath. The panel animates via a `grid-template-rows` 0fr→1fr transition
 * (reduced-motion aware) and — crucially — KEEPS ITS CONTENT IN THE DOM when
 * collapsed, so search engines and in-page find still see it. Collapsed content
 * is marked `inert` so it stays out of the tab order and the accessibility tree.
 */
export default function Reveal({
  summary,
  children,
  closedLabel = "Show more",
  openLabel = "Show less",
  defaultOpen = false,
  eventName,
  eventMeta,
  className = "",
}: RevealProps) {
  const [open, setOpen] = useState(defaultOpen);
  const firedRef = useRef(false);
  const panelId = `reveal-${useId()}`;

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next && eventName && !firedRef.current) {
        firedRef.current = true;
        trackEvent(eventName, eventMeta);
      }
      return next;
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70 transition-colors text-left"
      >
        <span className="min-w-0 text-sm">{summary}</span>
        <span className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-slate-400">
          {open ? openLabel : closedLabel}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden" inert={!open || undefined}>
          {children}
        </div>
      </div>
    </div>
  );
}
