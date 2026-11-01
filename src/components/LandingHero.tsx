import MobileSearchCue from "./MobileSearchCue";
import HeroRegSearch from "./HeroRegSearch";
import TrustBar from "./TrustBar";
import ToolSampleCard from "@/components/home/ToolSampleCard";
import type { SampleVariant } from "@/components/home/SampleResultCard";

interface LandingHeroProps {
  h1: string;
  subtitle: string;
  bullets: string[];
  /** Which tool's example result the hero shows (sample-bodies.tsx), live
   *  rather than a screenshot or a hand-written block: beside the hero on
   *  wide screens, once below the reg box on narrower ones. */
  sample: SampleVariant;
  /** The page, for the card's tool_sample_click event: "mot-check"… */
  tool: string;
  backLinkHref?: string;
  backLinkText?: string;
  badgeText?: string;
  /** Where the hero reg box submits to (the tool's own path). When set, a
   *  {@link HeroRegSearch} box renders in the hero (the graduated
   *  valuation_hero_reg_v1 winner) instead of the scroll-down MobileSearchCue. */
  searchTargetPath?: string;
  /** Submit-button label for the hero reg box (e.g. "Check tax status"). */
  searchCtaLabel?: string;
}

/**
 * Shared landing-page hero used by every reg-driven tool lander (/car-check,
 * /mot-check, /tax-check, /mileage-check, /ulez-check, /recall-check,
 * /mot-exemption-check, /check-before-you-buy, /running-costs). Two layouts:
 *  - Mobile: h1 + reminder pill, subtitle, bullets, the reg box, then the
 *    example result once (the homepage's arrangement)
 *  - Desktop: grid [h1 + subtitle + bullets] | [example result], reg box below
 *
 * One <h1> per page: the desktop heading is a <p> (the mobile block, hidden by
 * CSS on desktop, carries the h1).
 */
export default function LandingHero({
  h1,
  subtitle,
  bullets,
  sample,
  tool,
  backLinkHref = "/tools",
  backLinkText = "← Back to all tools",
  searchTargetPath,
  searchCtaLabel,
}: LandingHeroProps) {
  return (
    <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_60%)]" />
      <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-6 lg:pb-10">
        <a
          href={backLinkHref}
          className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block"
        >
          {backLinkText}
        </a>

        {/* ─── MOBILE LAYOUT (<lg) ─── */}
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
            {h1}
          </h1>
          <MotReminderPill className="mt-3" />
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            {subtitle}
          </p>
          <HeroBulletList bullets={bullets} className="mt-4 space-y-1.5" />
        </div>

        {/* ─── DESKTOP LAYOUT (≥lg) ─── */}
        <div className="hidden lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:items-center">
          <div>
            <p className="text-5xl font-bold text-slate-100 leading-tight">
              {h1}
            </p>
            <MotReminderPill className="mt-4" />
            <p className="mt-4 text-lg text-slate-300 leading-relaxed max-w-xl">
              {subtitle}
            </p>
            <HeroBulletList bullets={bullets} className="mt-5 space-y-2" />
          </div>

          {/* The example result, live: the same card the homepage shows
              beside its hero, in this tool's form. */}
          <div className="w-full max-w-[380px] lg:ml-auto">
            <ToolSampleCard variant={sample} tool={tool} placement="rail" />
          </div>
        </div>

        {/* Hero reg box (graduated valuation_hero_reg_v1 winner) when the page
            supplies a target; else the mobile-only scroll cue to the box below. */}
        {searchTargetPath ? (
          <HeroRegSearch
            targetPath={searchTargetPath}
            ctaLabel={searchCtaLabel}
            className="mt-6"
          />
        ) : null}

        <TrustBar className="mt-7 border-t border-slate-800/70 pt-5" />

        <ToolSampleCard variant={sample} tool={tool} placement="inline" wide className="lg:hidden mt-6 max-w-md mx-auto md:max-w-none" />

        {!searchTargetPath && <MobileSearchCue />}
      </div>
    </div>
  );
}

function MotReminderPill({ className = "" }: { className?: string }) {
  return (
    <a
      href="#mot-reminder"
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-700/60 bg-emerald-900/30 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/50 hover:border-emerald-600 ${className}`}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      Set free MOT reminder &rarr;
    </a>
  );
}

function HeroBulletList({
  bullets,
  className,
}: {
  bullets: string[];
  className: string;
}) {
  return (
    <ul className={`text-sm text-slate-400 ${className}`}>
      {bullets.map((bullet, i) => (
        <li key={i} className="flex items-start gap-2">
          <svg
            className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
          {bullet}
        </li>
      ))}
    </ul>
  );
}
