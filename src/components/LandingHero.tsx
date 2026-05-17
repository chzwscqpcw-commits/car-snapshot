import type { ReactNode } from "react";
import MobileSearchCue from "./MobileSearchCue";

interface LandingHeroProps {
  h1: string;
  subtitle: string;
  bullets: string[];
  exampleCard: ReactNode;
  backLinkHref?: string;
  backLinkText?: string;
  badgeText?: string;
}

/**
 * Shared landing-page hero used by /car-check, /tax-check, /mileage-check,
 * /ulez-check, /recall-check. Renders gradient hero with pills (status badge +
 * MOT reminder CTA), H1, subtitle, 3 trust bullets, and an illustrative example
 * card on the right. Mounts the A/B/C MobileSearchCue affordance below the grid
 * on mobile.
 *
 * (/mot-check uses a hand-written hero with the same structure — kept inline
 * there to avoid risk of regression; this component can be retrofitted later.)
 */
export default function LandingHero({
  h1,
  subtitle,
  bullets,
  exampleCard,
  backLinkHref = "/",
  backLinkText = "← Back to Free Plate Check",
  badgeText = "Free · No signup · Official UK data",
}: LandingHeroProps) {
  return (
    <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_60%)]" />
      <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-10">
        <a
          href={backLinkHref}
          className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block"
        >
          {backLinkText}
        </a>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-900/20 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {badgeText}
              </span>
              <a
                href="#mot-reminder"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/60 bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/50 hover:border-emerald-600"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                Set free MOT reminder &rarr;
              </a>
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-slate-100 leading-tight">
              {h1}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              {subtitle}
            </p>

            <ul className="mt-5 space-y-2 text-sm text-slate-400">
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
          </div>

          {/* Example card — scales down on mobile via CSS zoom (collapses bounding box too), full size on desktop. See globals.css .card-zoom-wrapper. */}
          <div className="card-zoom-wrapper mx-auto lg:mx-0">
            {exampleCard}
          </div>
        </div>

        {/* Mobile-only A/B/C affordance pointing to the search input below */}
        <MobileSearchCue />
      </div>
    </div>
  );
}
