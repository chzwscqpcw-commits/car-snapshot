/**
 * Site-wide ambient backdrop — fixed-position layers that sit behind every
 * page's content. Lifted from the homepage so /tools, /contact, blog and the
 * rest of the site share the same brand visual depth.
 *
 * Layers (back to front):
 *   1. Cyan dot grid at 7% opacity
 *   2. Three slow-drifting blurred gradient orbs (blue, cyan, violet)
 *   3. A subtle vertical fade at the bottom to anchor the page
 *
 * Server component — no client JS needed; CSS animations only.
 */
export default function SiteBackdrop() {
  return (
    <>
      {/* Dot-grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.07] -z-10"
        aria-hidden="true"
      >
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="siteDotGrid"
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="16" cy="16" r="0.9" fill="#22d3ee" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#siteDotGrid)" />
        </svg>
      </div>

      {/* Ambient gradient orbs + bottom vignette */}
      <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-blue-500/[0.06] to-transparent rounded-full blur-3xl site-orb-1" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-cyan-500/[0.06] to-transparent rounded-full blur-3xl site-orb-2" />
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-gradient-to-br from-purple-500/[0.05] to-transparent rounded-full blur-3xl site-orb-3" />
      </div>

      <style>{`
        @keyframes siteOrbDrift1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, 30px); }
        }
        @keyframes siteOrbDrift2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, -20px); }
        }
        @keyframes siteOrbDrift3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -40px); }
        }
        .site-orb-1 { animation: siteOrbDrift1 32s ease-in-out infinite; }
        .site-orb-2 { animation: siteOrbDrift2 38s ease-in-out infinite; }
        .site-orb-3 { animation: siteOrbDrift3 44s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .site-orb-1, .site-orb-2, .site-orb-3 { animation: none; }
        }
      `}</style>
    </>
  );
}
