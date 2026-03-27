import Link from "next/link";

interface StatsHeroSectionProps {
  title: string;
  subtitle: string;
  breadcrumb: string;
}

export default function StatsHeroSection({
  title,
  subtitle,
  breadcrumb,
}: StatsHeroSectionProps) {
  const jsonLd = {
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
        name: "Statistics",
        item: "https://www.freeplatecheck.co.uk/stats",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: breadcrumb,
      },
    ],
  };

  return (
    <div className="border-b border-[#2a2a2a] bg-[#111111] pb-8 pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4">
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-300 transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/stats"
            className="hover:text-gray-300 transition-colors"
          >
            Statistics
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-400">{breadcrumb}</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-gray-50 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base text-gray-400 max-w-2xl">{subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="#check-vehicle"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-blue-600 hover:text-blue-400"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            Check a vehicle
          </a>
          <a
            href="#mot-reminder"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-emerald-600 hover:text-emerald-400"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            Set MOT reminder
          </a>
        </div>
      </div>
    </div>
  );
}
