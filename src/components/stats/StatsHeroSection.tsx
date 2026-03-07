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
      </div>
    </div>
  );
}
