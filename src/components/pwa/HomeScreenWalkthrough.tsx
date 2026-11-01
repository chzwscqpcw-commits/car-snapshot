"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AlignLeft, Bookmark, BookOpen, ChevronLeft, ChevronRight, Copy, Ellipsis, Layers, Pause, Play, Share, SquarePlus, Star } from "lucide-react";
import BoltMark from "@/components/BoltMark";
import { trackEvent } from "@/lib/tracking";
import { shareLayout, type IosBrowser, type ShareLayout } from "@/components/pwa/ios-browser";

/**
 * A looping, six-second walkthrough of adding Free Plate Check to an iPhone
 * Home Screen: a stylised phone, a finger that taps Share (or ••• then Share
 * on iOS 26), the share sheet sliding up, a scroll to "Add to Home Screen",
 * the confirm, and the icon landing on the Home Screen.
 *
 * Why it exists: web push on iPhone only works from a Home Screen install, a
 * page can't trigger that step, and the step is hard to find — more so since
 * iOS 26 moved Share under the ••• button. The text steps stay beside the
 * animation (they double as its captions), so screen readers and anyone who
 * prefers reduced motion get the same instructions; reduced motion shows the
 * final still instead of the loop. Tap the phone to pause.
 *
 * Built from HTML/CSS (no video, no new dependency) so it ships light and
 * stays sharp on any screen. Fires `pwa_steps_shown { platform, layout }` once
 * when it opens.
 */

type Phase = "page" | "dots" | "menu" | "share" | "sheet" | "scroll" | "tap" | "confirm" | "home" | "hold";

const TIMELINES: Record<ShareLayout, [Phase, number][]> = {
  toolbar: [["page", 900], ["share", 650], ["sheet", 900], ["scroll", 850], ["tap", 550], ["confirm", 700], ["home", 1400], ["hold", 400]],
  "address-bar": [["page", 900], ["share", 650], ["sheet", 900], ["scroll", 850], ["tap", 550], ["confirm", 700], ["home", 1400], ["hold", 400]],
  menu: [["page", 800], ["dots", 550], ["menu", 550], ["share", 600], ["sheet", 850], ["scroll", 800], ["tap", 550], ["confirm", 650], ["home", 1300], ["hold", 350]],
};

/** Phone screen size, in px; everything inside is positioned against it. */
const SW = 134;
const SH = 252;
const SHEET_TOP = 64;
const SCROLL_BY = 82;

const PRESSING: Phase[] = ["dots", "share", "tap", "confirm"];

/** Where the fingertip sits in each phase (screen coordinates). */
function fingerAt(phase: Phase, layout: ShareLayout): { x: number; y: number; hidden?: boolean } {
  switch (phase) {
    case "page":
      return { x: 112, y: 232, hidden: true };
    case "dots":
      return { x: 118, y: 226 };
    case "menu":
      return { x: 112, y: 206 };
    case "share":
      if (layout === "menu") return { x: 67, y: 151 };
      if (layout === "address-bar") return { x: 116, y: 32 };
      return { x: 67, y: 236 };
    case "sheet":
      return { x: 67, y: 202 };
    case "scroll":
      return { x: 67, y: 124 };
    case "tap":
      return { x: 67, y: 176 };
    case "confirm":
      return { x: 118, y: 84 };
    default:
      return { x: 112, y: 232, hidden: true };
  }
}

/** Which caption a phase belongs to (0 = find Share, 1 = Add to Home Screen, 2 = Add). */
function stepFor(phase: Phase): number {
  if (phase === "page" || phase === "dots" || phase === "menu" || phase === "share") return 0;
  if (phase === "sheet" || phase === "scroll" || phase === "tap") return 1;
  return 2;
}

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function HomeScreenWalkthrough({
  browser,
  source,
  track = true,
  className = "",
}: {
  browser: IosBrowser;
  /** Where it opened from; rides on the pwa_steps_shown event. */
  source: "toast" | "save-card";
  /** Off on the /preview page, so looking at it never counts as a visitor opening the steps. */
  track?: boolean;
  className?: string;
}) {
  const layout = shareLayout(browser);
  const reduced = useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const [index, setIndex] = useState(0);
  const [loop, setLoop] = useState(0);
  const [paused, setPaused] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !track) return;
    tracked.current = true;
    trackEvent("pwa_steps_shown", { platform: "ios", layout: browser === "other" ? "other" : layout, source });
  }, [browser, layout, source, track]);

  const timeline = TIMELINES[layout];
  const running = !reduced && !paused && browser !== "other";

  useEffect(() => {
    if (!running) return;
    const [, ms] = timeline[index];
    const t = setTimeout(() => {
      if (index + 1 < timeline.length) {
        setIndex(index + 1);
      } else {
        setIndex(0);
        setLoop((l) => l + 1);
      }
    }, ms);
    return () => clearTimeout(t);
  }, [running, index, timeline]);

  if (browser === "other") {
    return (
      <p className={`text-[13px] leading-relaxed text-slate-300 ${className}`}>
        This browser can&apos;t add it as an app. Open <span className="font-medium text-white">freeplatecheck.co.uk</span> in{" "}
        <span className="font-medium text-white">Safari</span>, then Share → Add to Home Screen.
      </p>
    );
  }

  // Reduced motion: the finished state, no timers, every step shown plainly.
  const phase: Phase = reduced ? "hold" : timeline[index][0];
  const active = reduced ? -1 : stepFor(phase);

  return (
    <div className={`flex flex-wrap items-start gap-x-3 gap-y-3 ${className}`}>
      <div className="shrink-0">
        {reduced ? (
          <Phone phase="hold" layout={layout} loop={0} />
        ) : (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? "Play the walkthrough" : "Pause the walkthrough"}
            className="group relative block rounded-[24px] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            <Phone phase={phase} layout={layout} loop={loop} />
            <span
              className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-[24px] bg-slate-950/50 transition-opacity duration-200 ${
                paused ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg">
                <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
        {!reduced && (
          <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-slate-500">
            {paused ? <Play className="h-2.5 w-2.5" /> : <Pause className="h-2.5 w-2.5" />}
            {paused ? "Tap to play" : "Tap to pause"}
          </p>
        )}
      </div>
      <IosInstallSteps browser={browser} active={active} className="min-w-[9.5rem] flex-1" />
    </div>
  );
}

/**
 * The text steps, written for each layout. `active` highlights the one the
 * animation is on (-1 for none, which is the reduced-motion and plain-list
 * form). Always in the DOM, so this is also what a screen reader gets.
 */
export function IosInstallSteps({ browser, active = -1, className = "" }: { browser: IosBrowser; active?: number; className?: string }) {
  const strong = (t: string) => <span className="font-medium text-white">{t}</span>;
  const icon = (I: typeof Share) => <I className="inline h-4 w-4 align-[-3px] text-cyan-400" aria-hidden="true" />;
  const first =
    browser === "chrome" ? (
      <>
        Tap {icon(Share)} {strong("Share")} in the address bar
      </>
    ) : browser === "safari-new" ? (
      <>
        Tap the {icon(AlignLeft)} or {icon(Ellipsis)} button by the address bar, then {strong("Share")}
      </>
    ) : (
      <>
        Tap {icon(Share)} {strong("Share")} at the bottom of the screen
      </>
    );
  const steps: ReactNode[] = [
    first,
    <>
      Choose {icon(SquarePlus)} {strong("Add to Home Screen")} <span className="text-slate-500">(scroll the list if it&apos;s hidden)</span>
    </>,
    <>
      Tap {strong("Add")} — it opens like an app from your Home Screen, with alerts
    </>,
  ];
  return (
    <ol className={`grid gap-2 text-[13px] text-slate-300 ${className}`}>
      {steps.map((body, i) => {
        const on = i === active;
        return (
          <li key={i} className={`flex items-start gap-2 transition-opacity duration-300 ${active >= 0 && !on ? "opacity-55" : ""}`}>
            <span
              className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors duration-300 ${
                on ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-cyan-300"
              }`}
            >
              {i + 1}
            </span>
            <span className="leading-snug">{body}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ----------------------------------------------------------------------------
 * The phone. Pure presentation: given a phase it positions every layer; CSS
 * transitions carry the motion between phases.
 * ------------------------------------------------------------------------- */

function Phone({ phase, layout, loop }: { phase: Phase; layout: ShareLayout; loop: number }) {
  const menuOpen = layout === "menu" && (phase === "menu" || phase === "share");
  const sheetUp = phase === "sheet" || phase === "scroll" || phase === "tap" || phase === "confirm";
  const scrolled = phase === "scroll" || phase === "tap" || phase === "confirm";
  const home = phase === "home" || phase === "hold";
  const finger = fingerAt(phase, layout);
  const pressing = PRESSING.includes(phase);
  const shareHot = phase === "share";
  const dotsHot = phase === "dots";

  return (
    <div
      aria-hidden="true"
      className="relative rounded-[24px] border border-slate-600/80 bg-slate-950 p-[5px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.04)]"
      style={{ width: SW + 10, height: SH + 10 }}
    >
      <div className="relative overflow-hidden rounded-[19px] bg-slate-900" style={{ width: SW, height: SH }}>
        {/* Status bar + island */}
        <div className="absolute inset-x-0 top-0 z-30 flex h-5 items-center justify-between px-3 text-[7px] font-semibold text-slate-300">
          <span>9:41</span>
          <span className="absolute left-1/2 top-1.5 h-2.5 w-8 -translate-x-1/2 rounded-full bg-black" />
          <span className="flex items-center gap-0.5">
            <span className="h-1.5 w-2.5 rounded-[2px] border border-slate-400" />
          </span>
        </div>

        {/* The site, as seen in the browser */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${home ? "opacity-0" : "opacity-100"}`}>
          {layout === "address-bar" && (
            <div className="absolute inset-x-2 top-6 flex h-6 items-center gap-1.5 rounded-full bg-slate-800 px-2 text-[7px] text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
              <span className="flex-1 truncate">freeplatecheck.co.uk</span>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${shareHot ? "bg-cyan-400 text-slate-950" : "text-cyan-300"}`}>
                <Share className="h-2.5 w-2.5" />
              </span>
            </div>
          )}
          <div className={`absolute inset-x-3 ${layout === "address-bar" ? "top-[58px]" : "top-8"}`}>
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-slate-800">
                <BoltMark className="h-2.5 w-2" />
              </span>
              <span className="text-[7px] font-semibold text-slate-200">Free Plate Check</span>
            </div>
            <div className="mt-3 flex h-7 items-center justify-center rounded-[4px] border border-yellow-500/60 bg-[#FFD400] font-mono text-[10px] font-bold tracking-wider text-slate-950 shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]">
              <span className="mr-1 h-5 w-1.5 rounded-sm bg-blue-700" />
              AB12 CDE
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2.5px] border-cyan-400 text-[9px] font-bold text-white">86</span>
              <div className="flex-1 space-y-1.5">
                <span className="block h-1.5 w-full rounded bg-slate-700" />
                <span className="block h-1.5 w-4/5 rounded bg-slate-700/80" />
                <span className="block h-1.5 w-3/5 rounded bg-slate-700/60" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <span className="block h-1.5 w-full rounded bg-slate-800" />
              <span className="block h-1.5 w-11/12 rounded bg-slate-800" />
              <span className="block h-1.5 w-2/3 rounded bg-slate-800" />
            </div>
          </div>

          {layout === "toolbar" && (
            <div className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-around border-t border-slate-700/70 bg-slate-800/95 px-1 text-slate-400">
              <ChevronLeft className="h-3.5 w-3.5" />
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              <span className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${shareHot ? "bg-cyan-400 text-slate-950" : "text-cyan-300"}`}>
                <Share className="h-3.5 w-3.5" />
              </span>
              <BookOpen className="h-3.5 w-3.5" />
              <Layers className="h-3.5 w-3.5" />
            </div>
          )}

          {layout === "menu" && (
            <>
              <div className="absolute inset-x-2 bottom-3.5 flex h-6 items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 pl-2 pr-1 text-[7px] text-slate-300 shadow-lg">
                <span className="flex-1 truncate">freeplatecheck.co.uk</span>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${dotsHot ? "bg-cyan-400 text-slate-950" : "text-slate-200"}`}>
                  <Ellipsis className="h-3 w-3" />
                </span>
              </div>
              <div
                className={`absolute inset-x-3 origin-bottom-right rounded-lg border border-slate-700 bg-slate-800 text-[8px] text-slate-200 shadow-xl transition-all duration-200 ${
                  menuOpen ? "scale-100 opacity-100" : "scale-75 opacity-0"
                }`}
                style={{ top: 140 }}
              >
                <div className={`flex h-[22px] items-center justify-between rounded-t-lg px-2 transition-colors ${shareHot ? "bg-cyan-400/20 text-white" : ""}`}>
                  <span className="font-medium">Share</span>
                  <Share className={`h-2.5 w-2.5 ${shareHot ? "text-cyan-300" : "text-slate-400"}`} />
                </div>
                <div className="flex h-[22px] items-center justify-between border-t border-slate-700/80 px-2 text-slate-400">
                  <span>Add to Reading List</span>
                  <BookOpen className="h-2.5 w-2.5" />
                </div>
                <div className="flex h-[22px] items-center justify-between border-t border-slate-700/80 px-2 text-slate-400">
                  <span>Find on Page</span>
                  <span className="text-[8px]">⌕</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Scrim behind the sheet */}
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${sheetUp ? "opacity-100" : "pointer-events-none opacity-0"}`} />

        {/* Share sheet */}
        <div
          className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t-xl bg-slate-800 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ height: SH - SHEET_TOP, transform: sheetUp ? "translateY(0)" : "translateY(104%)" }}
        >
          {phase === "confirm" ? (
            <div className="fact-enter h-full">
              <div className="flex h-10 items-center justify-between whitespace-nowrap px-2 text-[7px]">
                <span className="text-slate-400">Cancel</span>
                <span className="font-semibold text-slate-100">Add to Home Screen</span>
                <span className="rounded-full bg-cyan-400 px-1.5 py-0.5 text-[7.5px] font-semibold text-slate-950">Add</span>
              </div>
              <div className="mx-2.5 flex items-center gap-2 rounded-lg bg-slate-700/60 p-2">
                <AppIcon size={26} />
                <div className="min-w-0 flex-1">
                  <div className="text-[8px] font-medium text-slate-100">Free Plate Check</div>
                  <div className="truncate text-[7px] text-slate-400">freeplatecheck.co.uk</div>
                </div>
              </div>
              <p className="mx-2.5 mt-2 text-[6.5px] leading-snug text-slate-500">An icon will be added to your Home Screen so you can quickly access this website.</p>
            </div>
          ) : (
            <>
              <div className="mx-auto mt-1 h-1 w-7 rounded-full bg-slate-600" />
              <div className="flex h-10 items-center gap-2 px-2.5">
                <AppIcon size={22} />
                <div className="min-w-0 flex-1">
                  <div className="text-[8px] font-medium text-slate-100">Free Plate Check</div>
                  <div className="truncate text-[7px] text-slate-400">freeplatecheck.co.uk</div>
                </div>
              </div>
              <div className="flex h-9 items-center gap-2.5 border-y border-slate-700/70 px-3">
                {["bg-emerald-500", "bg-sky-500", "bg-indigo-400", "bg-slate-500"].map((c) => (
                  <span key={c} className={`h-5 w-5 rounded-full ${c}`} />
                ))}
              </div>
              {/* The list scrolls under the header, as the real sheet's does. */}
              <div className="overflow-hidden" style={{ height: SH - SHEET_TOP - 84 }}>
                <div className="transition-transform duration-[650ms] ease-in-out" style={{ transform: scrolled ? `translateY(-${SCROLL_BY}px)` : "translateY(0)" }}>
                  <SheetRow label="Copy" icon={Copy} />
                  <SheetRow label="Add to Reading List" icon={BookOpen} />
                  <SheetRow label="Add Bookmark" icon={Bookmark} />
                  <SheetRow label="Add to Favourites" icon={Star} />
                  <SheetRow label="Add to Home Screen" icon={SquarePlus} hot={phase === "tap" || phase === "scroll"} pressed={phase === "tap"} />
                  <SheetRow label="Markup" icon={Layers} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Home Screen */}
        <div className={`absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,#164e63_0%,#0f172a_55%,#020617_100%)] transition-opacity duration-300 ${home ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <div className="absolute inset-x-3 top-8 grid grid-cols-4 gap-x-2.5 gap-y-3">
            {Array.from({ length: 12 }, (_, i) =>
              i === 5 ? (
                <div key={`fpc-${loop}`} className="flex flex-col items-center gap-1">
                  <div className={home ? "hsw-land" : "opacity-0"}>
                    <AppIcon size={22} />
                  </div>
                  <span className="whitespace-nowrap text-[5.5px] font-medium text-white">Plate Check</span>
                </div>
              ) : (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`h-[22px] w-[22px] rounded-[6px] ${TILE_TONES[i % TILE_TONES.length]}`} />
                  <span className="h-[5px] w-4 rounded bg-white/25" />
                </div>
              ),
            )}
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
            <span className="h-1 w-1 rounded-full bg-white/80" />
            <span className="h-1 w-1 rounded-full bg-white/30" />
          </div>
        </div>

        {/* The finger */}
        <div
          className="absolute left-0 top-0 z-40 transition-[transform,opacity] duration-[450ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ transform: `translate(${finger.x - 11}px, ${finger.y - 11}px)`, opacity: finger.hidden ? 0 : 1 }}
        >
          {pressing && <span key={`${phase}-${loop}`} className="hsw-tap absolute inset-0 rounded-full border-2 border-cyan-300/80" />}
          <span className={`block h-[22px] w-[22px] rounded-full border border-white/70 bg-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.5)] backdrop-blur-[1px] transition-transform duration-150 ${pressing ? "scale-90" : "scale-100"}`} />
        </div>
      </div>
    </div>
  );
}

const TILE_TONES = ["bg-slate-600", "bg-emerald-700", "bg-sky-700", "bg-slate-700", "bg-rose-700/80", "bg-slate-600", "bg-amber-700/80", "bg-slate-700", "bg-violet-700/80", "bg-slate-600", "bg-teal-700"];

function SheetRow({ label, icon: I, hot = false, pressed = false }: { label: string; icon: typeof Copy; hot?: boolean; pressed?: boolean }) {
  return (
    <div
      className={`mx-2.5 flex h-6 items-center justify-between border-b border-slate-700/60 px-1.5 text-[8px] transition-colors duration-300 ${
        pressed ? "rounded bg-cyan-400/25 text-white" : hot ? "text-white" : "text-slate-300"
      }`}
    >
      <span className={hot ? "font-semibold" : ""}>{label}</span>
      <I className={`h-2.5 w-2.5 ${hot ? "text-cyan-300" : "text-slate-500"}`} />
    </div>
  );
}

/** The app icon as it lands: plate yellow, the bolt in slate. */
function AppIcon({ size }: { size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[22%] bg-[#FFD400] shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 32" className="h-[62%] w-[48%]" aria-hidden="true">
        <path d="M 15 0 L 5 17 L 12 17 L 10 32 L 19 15 L 12 15 Z" fill="#0f172a" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
