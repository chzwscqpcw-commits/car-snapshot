import Link from "next/link";
import BoltMark from "@/components/BoltMark";

const TOOL_LINKS = [
  { href: "/mot-check", label: "MOT history check" },
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
