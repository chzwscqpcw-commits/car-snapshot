import Link from "next/link";
import BoltMark from "@/components/BoltMark";

const TOOL_LINKS = [
  { href: "/mot-check", label: "MOT history check" },
  { href: "/cheap-mot", label: "Cheap MOT prices" },
  { href: "/tax-check", label: "Tax check" },
  { href: "/car-check", label: "Free car check" },
  { href: "/car-valuation", label: "Car valuation" },
  { href: "/mileage-check", label: "Mileage check" },
  { href: "/ulez-check", label: "ULEZ check" },
  { href: "/recall-check", label: "Recall check" },
  { href: "/running-costs", label: "Running costs" },
  { href: "/mot-reminder", label: "Free MOT reminder" },
];

const GUIDE_LINKS = [
  { href: "/blog", label: "All guides" },
  { href: "/cars", label: "Cars by make" },
  { href: "/clean-air-zones", label: "Clean Air Zones" },
  { href: "/repair-costs", label: "Repair costs" },
  { href: "/servicing", label: "Servicing" },
];

const SITE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "All tools" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

// Social handles — keep in sync with the actual @freeplatecheck accounts.
const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/freeplatecheck", label: "Instagram" },
  { href: "https://www.tiktok.com/@freeplatecheck", label: "TikTok" },
  { href: "https://www.facebook.com/freeplatecheck", label: "Facebook" },
];

/**
 * Site-wide footer rendered by app/layout.tsx so every route gets it
 * (replacing the per-page inline footers that had drifted out of sync).
 * Brand strip at the top, three columns of links, fine-print strip below.
 */
export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-800/60 bg-slate-950/60">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-7 sm:py-12">
        {/* Brand row */}
        <div className="mb-8 flex items-start gap-3">
          <BoltMark className="h-9 w-7 shrink-0 mt-1" glow />
          <div>
            <p className="text-lg font-bold text-slate-100">Free Plate Check</p>
            <p className="mt-1 max-w-md text-sm leading-snug text-slate-400">
              Everything DVLA knows about any UK car — instant, free, no signup. MOT, tax, valuation, ULEZ, recalls and more.
            </p>
            <div className="mt-4 flex items-center gap-4">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Free Plate Check on ${s.label}`}
                  className="text-slate-400 transition-colors hover:text-cyan-300"
                >
                  <SocialIcon name={s.label} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Link grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 text-sm sm:grid-cols-3">
          <FooterColumn title="Tools" links={TOOL_LINKS} />
          <FooterColumn title="Guides" links={GUIDE_LINKS} />
          <FooterColumn title="Site" links={SITE_LINKS} />
        </div>

        {/* Disclaimers + trust signals */}
        <div className="mt-10 border-t border-slate-800/60 pt-6 space-y-3 text-xs text-slate-500">
          <p>
            Built with official DVLA and MOT data. Always verify details with the seller and official documents before making any decisions.
          </p>
          <p className="text-slate-600">
            Free Plate Check may earn a commission from partner links. This doesn&apos;t affect our recommendations or the data we show.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3">
            <p>&copy; 2026 Free Plate Check. All rights reserved.</p>
            <p className="text-slate-600">
              Data: DVLA · DVSA · VCA · Euro NCAP · DfT · DESNZ
            </p>
            <a
              href="https://www.saashub.com/free-plate-check?utm_source=badge&utm_campaign=badge&utm_content=free-plate-check&badge_variant=color&badge_kind=approved"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
              aria-label="Approved on SaaSHub"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://cdn-b.saashub.com/img/badges/approved-color.png?v=1"
                alt="Free Plate Check — Approved on SaaSHub"
                width={120}
                height={40}
                className="max-w-[120px] opacity-70 hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
          <p className="text-slate-600 pt-1">Made in 🇬🇧</p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: string }) {
  if (name === "Instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (name === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.08 24 18.09 24 12.07z" />
      </svg>
    );
  }
  // TikTok brand mark (monochrome, currentColor)
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M16.5 0h-3.1v15.7a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12V9.95a5.7 5.7 0 0 0-.78-.05A5.7 5.7 0 1 0 16.5 15.6V7.4a7.1 7.1 0 0 0 4.3 1.45V5.65a4.3 4.3 0 0 1-4.3-4.3V0z" />
    </svg>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-slate-300 transition-colors hover:text-cyan-300"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
