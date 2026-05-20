"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import BoltMark from "@/components/BoltMark";
import { useCommandPalette } from "@/components/CommandPalette";
import { useHomeResult } from "@/components/HomeResultContext";
import { PRIMARY_NAV, SITE_ITEMS } from "@/lib/site-index";

/**
 * Hides the nav while scrolling down past a small threshold; reveals it
 * the moment any upward movement is detected. Always visible near the
 * page top. Returns true when the nav should be hidden.
 *
 * Simpler than a delta-accumulator approach: per-frame direction-of-
 * change is enough, and matches what every iOS user instinctively
 * expects ("I'm scrolling up at all → bring it back").
 */
function useHideOnScrollDown({ hideAfter = 60 }: { hideAfter?: number } = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      if (y < hideAfter) {
        setHidden(false);
      } else if (y > lastY.current) {
        setHidden(true);
      } else if (y < lastY.current) {
        setHidden(false);
      }
      lastY.current = y;
      rafId.current = 0;
    };

    const onScroll = () => {
      if (rafId.current) return;
      rafId.current = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current) window.cancelAnimationFrame(rafId.current);
    };
  }, [hideAfter]);

  return hidden;
}

/**
 * Persistent, glass-blurred top nav. Visible on every route.
 *
 * Desktop: BoltMark + wordmark on the left, primary links centred-left,
 * ⌘K search chip on the right.
 *
 * Mobile: BoltMark + wordmark on the left, search icon + hamburger on the
 * right. The hamburger opens a right-slide drawer with every destination,
 * grouped by category.
 */
export default function SiteNav() {
  const pathname = usePathname() || "/";
  const { open, isOpen: paletteOpen } = useCommandPalette();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrolledHidden = useHideOnScrollDown();

  // Keep nav visible when the drawer or command palette is open — feels
  // wrong for the bar to slide out from under a focused overlay.
  const hidden = scrolledHidden && !drawerOpen && !paletteOpen;

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer open
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Flow spacer — keeps page content from sliding under the fixed
          header. Matches the header's height at each breakpoint. */}
      <div className="h-12 sm:h-14" aria-hidden="true" />
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-slate-950/60 transition-transform duration-200 ease-out will-change-transform ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 px-3 sm:h-14 sm:px-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 group"
            aria-label="Free Plate Check — home"
          >
            <BoltMark className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:-translate-y-px" />
            {/*
              On the homepage the page-level hero already shows the
              "Free Plate Check" wordmark. Repeating it here creates a
              stacked-logo look. Drop the wordmark on / in entry state
              (bolt only). Once a result has loaded, the page hero is
              hidden — bring the wordmark back so the nav becomes the
              sole brand surface.
            */}
            <ShowWordmark pathname={pathname} />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {PRIMARY_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-cyan-300"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          {/* ⌘K — desktop chip */}
          <button
            type="button"
            onClick={open}
            className="hidden md:inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors min-w-[200px]"
            aria-label="Open search (⌘K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left text-xs">Search anything…</span>
            <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-800 border border-slate-700 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Mobile: search icon */}
          <button
            type="button"
            onClick={open}
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <MobileDrawer
          onClose={() => setDrawerOpen(false)}
          onOpenPalette={() => {
            setDrawerOpen(false);
            open();
          }}
          pathname={pathname}
        />
      )}
    </>
  );
}

function MobileDrawer({
  onClose,
  onOpenPalette,
  pathname,
}: {
  onClose: () => void;
  onOpenPalette: () => void;
  pathname: string;
}) {
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const checks = SITE_ITEMS.filter((i) => i.category === "check");
  const tools = SITE_ITEMS.filter(
    (i) => i.category === "tool" || i.category === "action"
  );
  const stats = SITE_ITEMS.filter((i) => i.category === "stats");
  const guides = SITE_ITEMS.filter((i) => i.category === "guide");
  const site = SITE_ITEMS.filter((i) => i.category === "site");

  return (
    <div
      className="fixed inset-0 z-[60] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
    >
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-drawer-fade"
      />
      <aside className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-drawer-slide">
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BoltMark className="h-5 w-5" />
            <span className="text-sm font-bold tracking-tight text-white">
              Free Plate Check
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-8">
          {/* Search trigger */}
          <div className="p-3">
            <button
              type="button"
              onClick={onOpenPalette}
              className="w-full inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900 px-3 py-3 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search anything…</span>
            </button>
          </div>

          {/* Big-ticket top-level links surface first */}
          <div className="px-3 pb-2 grid grid-cols-3 gap-2">
            <PrimaryTile href="/tools" label="Tools" isActive={isActive} />
            <PrimaryTile href="/stats" label="Stats" isActive={isActive} />
            <PrimaryTile href="/blog" label="Guides" isActive={isActive} />
          </div>

          <DrawerSection label="Checks" items={checks} isActive={isActive} />
          <DrawerSection label="Tools" items={tools} isActive={isActive} />
          <DrawerSection label="Stats" items={stats} isActive={isActive} />
          <DrawerSection label="Guides" items={guides} isActive={isActive} />
          <DrawerSection label="Site" items={site} isActive={isActive} />
        </div>
      </aside>

      <style jsx>{`
        @keyframes drawerFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes drawerSlide {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        :global(.animate-drawer-fade) {
          animation: drawerFade 0.15s ease-out;
        }
        :global(.animate-drawer-slide) {
          animation: drawerSlide 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

function PrimaryTile({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: (href: string) => boolean;
}) {
  const active = isActive(href);
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition-colors ${
        active
          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
          : "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-700 hover:bg-slate-800/60"
      }`}
    >
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}

function DrawerSection({
  label,
  items,
  isActive,
}: {
  label: string;
  items: { title: string; href: string; subtitle?: string }[];
  isActive: (href: string) => boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="px-2 py-2">
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="flex flex-col">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-lg transition-colors ${
              isActive(item.href)
                ? "bg-slate-800 text-cyan-300"
                : "text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <span className="text-sm font-medium">{item.title}</span>
            {item.subtitle && (
              <span className="text-xs text-slate-500">{item.subtitle}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Wordmark visibility: hidden on the homepage entry state (where the
 * page-level hero shows the brand), shown everywhere else — including
 * the homepage *after* a result has loaded (when the page hero hides).
 */
function ShowWordmark({ pathname }: { pathname: string }) {
  const { hasResult } = useHomeResult();
  const visible = pathname !== "/" || hasResult;
  if (!visible) return null;
  return (
    <span className="text-[14px] sm:text-[15px] font-bold tracking-tight text-white">
      Free Plate Check
    </span>
  );
}
