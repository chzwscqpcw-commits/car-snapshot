import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Receipt,
  Gauge,
  Wind,
  AlertTriangle,
  PoundSterling,
  GitCompare,
  Bell,
  Calculator,
  Wrench,
  Code,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import BoltMark from "@/components/BoltMark";

export const metadata: Metadata = {
  title: "Free UK Vehicle Tools — MOT, Tax, Valuation & More | Free Plate Check",
  description:
    "Every free UK vehicle tool in one place: MOT check, tax check, mileage check, ULEZ compliance, recall lookup, free valuation, repair-cost calculators and the free MOT reminder service. No signup, no fees.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/tools",
  },
  openGraph: {
    title: "Free UK Vehicle Tools — Everything in one place",
    description:
      "Every free UK vehicle tool: MOT, tax, mileage, ULEZ, recalls, valuation, repair costs, and free MOT reminders.",
    url: "https://www.freeplatecheck.co.uk/tools",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
};

interface Tool {
  title: string;
  blurb: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const CHECKS: Tool[] = [
  {
    title: "MOT check",
    blurb: "Pass/fail history, expiry date, advisories and a clocking-check on mileage.",
    href: "/mot-check",
    icon: ShieldCheck,
    badge: "Most popular",
  },
  {
    title: "Tax check",
    blurb: "Current tax status, expiry date and the annual VED rate for your reg.",
    href: "/tax-check",
    icon: Receipt,
  },
  {
    title: "Mileage check",
    blurb: "Every MOT mileage reading plotted — spot clocking and inconsistencies.",
    href: "/mileage-check",
    icon: Gauge,
  },
  {
    title: "ULEZ check",
    blurb: "Instant compliance check for London ULEZ and every UK clean-air zone.",
    href: "/ulez-check",
    icon: Wind,
  },
  {
    title: "Recall check",
    blurb: "Match your vehicle against every open DVSA safety recall.",
    href: "/recall-check",
    icon: AlertTriangle,
  },
  {
    title: "Car valuation",
    blurb: "Live market valuation built from real eBay listings and depreciation models.",
    href: "/car-valuation",
    icon: PoundSterling,
  },
  {
    title: "Compare two cars",
    blurb: "Side-by-side report for two saved vehicles — perfect for shortlisting.",
    href: "/compare",
    icon: GitCompare,
  },
];

const UTILITIES: Tool[] = [
  {
    title: "Free MOT reminder",
    blurb: "We email you 28 and 7 days before expiry. No signup, no spam.",
    href: "/mot-reminder",
    icon: Bell,
  },
  {
    title: "Running cost calculator",
    blurb: "Annual fuel, tax, insurance and servicing for any UK car.",
    href: "/running-costs",
    icon: Calculator,
  },
  {
    title: "Repair cost calculators",
    blurb: "Personalised price ranges for common repairs — based on your car.",
    href: "/repair-costs",
    icon: Wrench,
  },
  {
    title: "Servicing & repair guides",
    blurb: "What each service includes, when it's due, and what it typically costs.",
    href: "/servicing",
    icon: Wrench,
  },
  {
    title: "Embed widget",
    blurb: "Drop a free vehicle-check box on your own site in two lines of HTML.",
    href: "/embed",
    icon: Code,
  },
];

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
    { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.freeplatecheck.co.uk/tools" },
  ],
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-slate-950">
        <div className="absolute inset-0 opacity-30 pointer-events-none [background-image:radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.18),transparent_50%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl px-4 pt-12 pb-10 sm:pt-16 sm:pb-14">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-400 mb-3">
            <BoltMark className="h-3.5 w-3.5" />
            Tools
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Everything you can do with a UK reg plate.
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
            One reg, one tap, one focused answer. Each tool below tells you exactly
            what its title promises — and offers to pull the full DVLA report when
            you want everything in one go.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Free · no signup
            </span>
            <span>Real-time DVLA &amp; MOT data</span>
            <span>Privacy-first — no reg numbers stored</span>
          </div>
        </div>
      </section>

      {/* Checks */}
      <Section
        eyebrow="Checks"
        title="Focused vehicle checks"
        subtitle="Each check gives you the exact answer it promises — nothing buried, nothing bloated."
      >
        <ToolGrid tools={CHECKS} accent="cyan" />
      </Section>

      {/* Utilities */}
      <Section
        eyebrow="Utilities"
        title="Calculators &amp; helpers"
        subtitle="Built around the same DVLA + MOT data. Designed to save you money or time."
      >
        <ToolGrid tools={UTILITIES} accent="blue" />
      </Section>

      {/* CTA strip */}
      <section className="border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900/40">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950 p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <BoltMark className="h-6 w-6 mb-3" glow />
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Want everything in one go?
              </h2>
              <p className="mt-2 max-w-xl text-sm sm:text-base text-slate-400">
                The full Free Plate Check report combines every tool above into one
                comprehensive view — MOT, tax, mileage, recalls, ULEZ, valuation,
                running costs and more, all from a single reg.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-cyan-500/20"
              >
                Run the full check
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <div className="mb-6 sm:mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-400">
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}

function ToolGrid({
  tools,
  accent,
}: {
  tools: Tool[];
  accent: "cyan" | "blue";
}) {
  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((t) => (
        <ToolCard key={t.href} tool={t} accent={accent} />
      ))}
    </div>
  );
}

function ToolCard({ tool, accent }: { tool: Tool; accent: "cyan" | "blue" }) {
  const Icon = tool.icon;
  const accentRing =
    accent === "cyan"
      ? "group-hover:border-cyan-500/40 group-hover:shadow-cyan-500/10"
      : "group-hover:border-blue-500/40 group-hover:shadow-blue-500/10";
  const accentIcon =
    accent === "cyan"
      ? "from-cyan-500 to-blue-500"
      : "from-blue-500 to-indigo-500";
  return (
    <Link
      href={tool.href}
      className={`group relative flex flex-col gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 transition-all hover:bg-slate-900/70 hover:shadow-xl ${accentRing}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${accentIcon} text-white shadow-md shadow-cyan-500/10`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {tool.badge && (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {tool.badge}
          </span>
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-white">{tool.title}</h3>
        <p className="mt-1 text-sm text-slate-400 leading-relaxed">{tool.blurb}</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 group-hover:text-cyan-300 transition-colors">
        Open tool
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
