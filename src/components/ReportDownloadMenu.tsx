"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Monitor, Printer } from "lucide-react";
import type { ReportTheme } from "@/lib/report-v2/theme";

// The PDF report comes in two editions: dark, to read on a screen, and light,
// to print. Every download button on the results page opens this small menu
// so the choice is made at the point of download, not buried in one card.
//
// The menu is portalled to <body> with fixed positioning taken from the
// trigger: the floating QuickNav bar scrolls sideways (overflow-x: auto),
// which would clip a menu drawn inside it.

type TriggerProps = {
  onClick: (e: MouseEvent<HTMLElement>) => void;
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
  "aria-controls": string;
};

const OPTIONS: Array<{ theme: ReportTheme; title: string; text: string; Icon: typeof Monitor }> = [
  { theme: "dark", title: "Digital", text: "Dark, to read on a screen", Icon: Monitor },
  { theme: "light", title: "Print", text: "White, ink-friendly", Icon: Printer },
];

export default function ReportDownloadMenu({
  id,
  onPick,
  renderTrigger,
  placement = "down",
  align = "end",
  closeOnScroll = true,
}: {
  /** Unique per placement, for aria-controls. */
  id: string;
  onPick: (theme: ReportTheme) => void;
  renderTrigger: (props: TriggerProps) => ReactNode;
  /** Open below the trigger, or above it (the floating bottom bar). */
  placement?: "down" | "up";
  align?: "end" | "center";
  /** False for a trigger that doesn't move when the page scrolls (the fixed QuickNav bar). */
  closeOnScroll?: boolean;
}) {
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const open = style !== null;
  const wrap = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const firstItem = useRef<HTMLButtonElement>(null);

  // Positioned from the clicked trigger itself (event, not a ref, so nothing
  // reads a ref during render).
  function toggle(e: MouseEvent<HTMLElement>) {
    if (open) return setStyle(null);
    const r = e.currentTarget.getBoundingClientRect();
    const W = 256;
    const left = align === "center" ? r.left + r.width / 2 - W / 2 : r.right - W;
    setStyle({
      position: "fixed",
      width: W,
      left: Math.max(8, Math.min(left, window.innerWidth - W - 8)),
      ...(placement === "up" ? { bottom: window.innerHeight - r.top + 8 } : { top: r.bottom + 8 }),
    });
  }

  useEffect(() => {
    if (!open) return;
    firstItem.current?.focus();
    const close = () => setStyle(null);
    // The menu is fixed where its trigger was, so close once the page has
    // genuinely moved. Not on any scroll event: a smooth scroll still settling,
    // or momentum on a phone, would shut it the moment it opened.
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 40) close();
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!wrap.current?.contains(t) && !menu.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    if (closeOnScroll) window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", close);
    };
  }, [open, closeOnScroll]);

  return (
    <div ref={wrap} className="relative">
      {renderTrigger({
        onClick: toggle,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": id,
      })}
      {open && createPortal(
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label="Choose a report edition"
          style={style}
          className="z-[70] rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-xl shadow-black/40"
        >
          {OPTIONS.map(({ theme, title, text, Icon }, i) => (
            <button
              key={theme}
              ref={i === 0 ? firstItem : undefined}
              type="button"
              role="menuitem"
              onClick={() => {
                setStyle(null);
                onPick(theme);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-800 focus:bg-slate-800 focus:outline-none"
            >
              <Icon className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-slate-100">{title}</span>
                <span className="text-xs text-slate-400">{text}</span>
              </span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
