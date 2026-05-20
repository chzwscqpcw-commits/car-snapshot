import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, Snowflake, Disc, BatteryCharging, Cog, Filter, Gauge, AlertTriangle, ShieldCheck, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Car Repair Costs UK — Free Price Guides & Local Quotes | Free Plate Check",
  description:
    "Free price guides for the most common UK car repairs — cambelt, DPF, aircon regas, brake pads, battery and clutch. See the typical cost, what affects price, and how to compare quotes from local garages.",
  keywords: [
    "car repair costs UK",
    "how much does car repair cost",
    "UK garage prices",
    "car service prices UK",
    "common car repair prices",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/repair-costs",
  },
  openGraph: {
    title: "Car Repair Costs UK — Free Price Guides & Local Quotes",
    description:
      "Free price guides for the most common UK car repairs. Compare quotes from local garages with no booking fee.",
    url: "https://www.freeplatecheck.co.uk/repair-costs",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Repair Costs UK — Free Price Guides",
    description:
      "Free price guides for the most common UK car repairs.",
  },
};

interface CostGuide {
  slug: string;
  title: string;
  blurb: string;
  range: string;
  Icon: typeof Wrench;
  iconColor: string;
}

const COST_GUIDES: CostGuide[] = [
  {
    slug: "aircon-regas",
    title: "Aircon regas",
    blurb: "When your air-con blows warm. Cost depends on refrigerant type — R134A is much cheaper than the newer R1234YF.",
    range: "£60 – £200",
    Icon: Snowflake,
    iconColor: "text-cyan-400",
  },
  {
    slug: "cambelt-replacement",
    title: "Cambelt replacement",
    blurb: "A snapped cambelt can destroy an engine. Most need replacing every 5 years or 50,000 miles — check your handbook.",
    range: "£300 – £950",
    Icon: Cog,
    iconColor: "text-amber-400",
  },
  {
    slug: "dpf-cleaning",
    title: "DPF cleaning",
    blurb: "Diesel particulate filter blockages cause warning lights, limp mode and loss of power. Cleaning saves you the £1,000+ replacement.",
    range: "£150 – £500",
    Icon: Filter,
    iconColor: "text-slate-300",
  },
  {
    slug: "brake-pads-replacement",
    title: "Brake pads replacement",
    blurb: "Worn brake pads are the third most common MOT failure. Replacing front-only is cheaper than all four corners.",
    range: "£90 – £350",
    Icon: Disc,
    iconColor: "text-red-400",
  },
  {
    slug: "car-battery-replacement",
    title: "Car battery replacement",
    blurb: "Most batteries last 4–5 years. Modern cars with stop-start need specific AGM or EFB batteries which cost more.",
    range: "£80 – £250",
    Icon: BatteryCharging,
    iconColor: "text-emerald-400",
  },
  {
    slug: "clutch-replacement",
    title: "Clutch replacement",
    blurb: "Slipping, juddering or a high biting point all signal clutch wear. A big bill, but unavoidable on manual cars.",
    range: "£400 – £1,200",
    Icon: Gauge,
    iconColor: "text-purple-400",
  },
];

interface TrustGuide {
  slug: string;
  title: string;
  blurb: string;
  Icon: typeof Wrench;
  iconColor: string;
}

const TRUST_GUIDES: TrustGuide[] = [
  {
    slug: "/blog/dashboard-warning-lights",
    title: "Dashboard warning lights — what they mean and what they cost",
    blurb: "Red vs amber vs green, the 12 lights you'll actually see, and the cost band to expect for each.",
    Icon: AlertTriangle,
    iconColor: "text-amber-400",
  },
  {
    slug: "/blog/mot-vs-service",
    title: "MOT vs service — what's the difference?",
    blurb: "Why you need both, what each covers, and whether it's worth combining them in one visit.",
    Icon: BookOpen,
    iconColor: "text-blue-400",
  },
  {
    slug: "/blog/how-to-spot-garage-overcharging",
    title: "How to spot a garage that's overcharging you",
    blurb: "Red flags, written quotes, asking for the old parts back, and what to do if you've already been stung.",
    Icon: ShieldCheck,
    iconColor: "text-emerald-400",
  },
];

export default function RepairCostsHub() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.freeplatecheck.co.uk",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Car Repair Costs",
        item: "https://www.freeplatecheck.co.uk/repair-costs",
      },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "UK Car Repair Cost Guides",
    description:
      "Free price guides for the most common UK car repairs.",
    url: "https://www.freeplatecheck.co.uk/repair-costs",
    hasPart: COST_GUIDES.map((g) => ({
      "@type": "WebPage",
      name: g.title,
      url: `https://www.freeplatecheck.co.uk/repair-costs/${g.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.10),_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-10">
          <Link href="/tools" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
            &larr; Back to all tools
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-900/20 px-3 py-1 text-xs font-medium text-emerald-300">
            <Wrench className="h-3 w-3" />
            Honest UK repair pricing
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold leading-tight">
            Car repair costs UK
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
            Free price guides for the most common UK car repairs. See the
            typical cost range, what makes the price go up or down, and compare
            real quotes from local garages — no booking fee.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3 max-w-md">
            <div>
              <p className="text-2xl font-bold text-emerald-400">6</p>
              <p className="text-xs text-slate-500">price guides</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">No&nbsp;signup</p>
              <p className="text-xs text-slate-500">just enter your reg</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">Live</p>
              <p className="text-xs text-slate-500">garage quotes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Cost guide grid */}
        <h2 className="text-xl font-bold text-slate-100 mb-2">Price guides</h2>
        <p className="text-sm text-slate-400 mb-6">
          Tap any guide for a typical UK price range, what affects the cost, and
          how to compare quotes from trusted local garages.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COST_GUIDES.map(({ slug, title, blurb, range, Icon, iconColor }) => (
            <Link
              key={slug}
              href={`/repair-costs/${slug}`}
              className="group block rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-colors hover:border-emerald-700/50"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-6 w-6 ${iconColor}`} />
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                  {title}
                </h3>
              </div>
              <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">Typical range</p>
              <p className="text-2xl font-bold text-emerald-400">{range}</p>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">{blurb}</p>
              <p className="mt-4 text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                See full guide &rarr;
              </p>
            </Link>
          ))}
        </div>

        {/* Trust / consumer-protection */}
        <h2 className="text-xl font-bold text-slate-100 mt-14 mb-2">
          Buyer beware
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Knowing the typical price is only half the battle. These guides cover
          how to spot dodgy quotes, what warning lights actually mean, and the
          difference between an MOT and a service.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {TRUST_GUIDES.map(({ slug, title, blurb, Icon, iconColor }) => (
            <Link
              key={slug}
              href={slug}
              className="group block rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-colors hover:border-blue-700/50"
            >
              <Icon className={`h-6 w-6 ${iconColor}`} />
              <h3 className="mt-3 text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                {title}
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{blurb}</p>
            </Link>
          ))}
        </div>

        {/* About */}
        <div className="mt-14 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-slate-100">
            Why we built this
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            UK garage bills can feel like a black box. Quotes vary wildly
            between garages for the same job — sometimes by hundreds of pounds.
            These guides exist to give you an honest, neutral starting point so
            you can walk into any garage knowing roughly what you should pay.
          </p>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Every guide is free, doesn&apos;t require signup, and links out to
            BookMyGarage so you can compare real local quotes. We earn a small
            commission from BookMyGarage at no cost to you — that&apos;s how we
            keep the site free.
          </p>
        </div>
      </div>
    </div>
  );
}
