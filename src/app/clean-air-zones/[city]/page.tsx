import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAZ_ZONES, getCazBySlug, getAllCazSlugs } from "@/data/caz-zones";

type Props = {
  params: Promise<{ city: string }>;
};

export function generateStaticParams() {
  return getAllCazSlugs().map((slug) => ({ city: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const zone = getCazBySlug(city);
  if (!zone) return {};

  const title = `${zone.city} Clean Air Zone | Charges, Map & Compliance Check`;
  const description = zone.metaDescription;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.freeplatecheck.co.uk/clean-air-zones/${zone.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.freeplatecheck.co.uk/clean-air-zones/${zone.slug}`,
      siteName: "Free Plate Check",
      locale: "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CityCleanAirZonePage({ params }: Props) {
  const { city } = await params;
  const zone = getCazBySlug(city);
  if (!zone) notFound();

  const isCancelled = zone.status === "cancelled" || zone.status === "deferred";

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
        name: "Clean Air Zones",
        item: "https://www.freeplatecheck.co.uk/clean-air-zones",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${zone.city} Clean Air Zone`,
        item: `https://www.freeplatecheck.co.uk/clean-air-zones/${zone.slug}`,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: zone.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  // Find other zones for "Other UK zones" section
  const otherZones = CAZ_ZONES.filter((z) => z.slug !== zone.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/clean-air-zones"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; All UK Clean Air Zones
          </a>
          <h1 className="text-3xl font-bold text-slate-100">
            {zone.city} Clean Air Zone
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-slate-400">
              {zone.zoneType}
            </span>
            {isCancelled ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/40 text-red-400 border border-red-800/40">
                {zone.status === "cancelled" ? "Cancelled" : "Deferred"}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800/40">
                Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* CTA */}
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Check your vehicle&apos;s emissions
          </p>
          <p className="text-sm text-slate-400 mb-4">
            {zone.coveredByOurChecker
              ? "Enter any UK registration number to see ULEZ compliance status instantly."
              : "Enter any UK registration number to see Euro emission standard and likely compliance."}
          </p>
          <a
            href={zone.checkUrl}
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            {zone.coveredByOurChecker
              ? "Check ULEZ compliance"
              : "Check your vehicle"}
          </a>
        </div>

        <div className="space-y-8 text-slate-300">
          {/* Zone overview */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Zone overview
            </h2>
            <p className="leading-relaxed mb-4">{zone.description}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Zone type
                </p>
                <p className="text-sm font-medium text-slate-100 mt-1">
                  {zone.zoneType}
                </p>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  {isCancelled ? "Status" : "Launched"}
                </p>
                <p className="text-sm font-medium text-slate-100 mt-1">
                  {isCancelled
                    ? zone.status === "cancelled"
                      ? "Cancelled"
                      : "Deferred"
                    : zone.launchDate}
                </p>
              </div>
              {!isCancelled && (
                <>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Operating hours
                    </p>
                    <p className="text-sm font-medium text-slate-100 mt-1">
                      {zone.operatingHours}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Official website
                    </p>
                    <a
                      href={zone.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-400 hover:text-blue-300 mt-1 inline-block"
                    >
                      Visit official site &rarr;
                    </a>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Boundaries */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Zone boundaries
            </h2>
            <p className="leading-relaxed">{zone.boundaries}</p>
          </section>

          {/* Charges table */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              {isCancelled ? "Proposed charges" : "Daily charges"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-700 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-800 text-slate-200">
                    <th className="text-left px-4 py-2.5 font-semibold">
                      Vehicle type
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold">
                      Daily charge
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {zone.charges.map((charge, i) => (
                    <tr
                      key={charge.vehicleType}
                      className={i % 2 === 0 ? "bg-slate-900/50" : ""}
                    >
                      <td className="px-4 py-2.5 text-slate-100">
                        {charge.vehicleType}
                      </td>
                      <td className="px-4 py-2.5">
                        {charge.dailyCharge === "Not charged" ||
                        charge.dailyCharge === "Not currently charged" ? (
                          <span className="text-emerald-400">
                            {charge.dailyCharge}
                          </span>
                        ) : charge.dailyCharge.includes("N/A") ? (
                          <span className="text-slate-500">
                            {charge.dailyCharge}
                          </span>
                        ) : (
                          <span className="font-medium text-slate-100">
                            {charge.dailyCharge}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Affected vehicles */}
          {!isCancelled && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Which vehicles are affected?
              </h2>
              <p className="leading-relaxed mb-4">
                {zone.affectedVehicles}
              </p>
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-100 mb-3">
                  Emission standards required
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>
                      <strong className="text-slate-100">Petrol vehicles:</strong>{" "}
                      Euro 4 or later (generally registered from January 2006)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>
                      <strong className="text-slate-100">Diesel vehicles:</strong>{" "}
                      Euro 6 or later (generally registered from September 2015)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&#10003;</span>
                    <span>
                      <strong className="text-slate-100">
                        Electric &amp; hydrogen:
                      </strong>{" "}
                      Exempt from all charges
                    </span>
                  </li>
                </ul>
              </div>
            </section>
          )}

          {/* How to check */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              How to check if your vehicle is compliant
            </h2>
            {zone.coveredByOurChecker ? (
              <>
                <p className="leading-relaxed mb-3">
                  Our free{" "}
                  <a
                    href="/ulez-check"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    ULEZ compliance check
                  </a>{" "}
                  shows your vehicle&apos;s Euro emission standard and whether
                  it meets the London ULEZ requirements. Enter your registration
                  number and get an instant result — no signup or payment
                  required.
                </p>
                <p className="leading-relaxed">
                  You can also check directly on the{" "}
                  <a
                    href={zone.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    official TfL ULEZ checker
                  </a>
                  .
                </p>
              </>
            ) : isCancelled ? (
              <p className="leading-relaxed">
                Since the {zone.city} Clean Air Zone was{" "}
                {zone.status === "cancelled" ? "cancelled" : "deferred"}, there
                is no compliance requirement. However, you can still check your
                vehicle&apos;s Euro emission standard on our{" "}
                <a href="/" className="text-blue-400 hover:text-blue-300">
                  homepage
                </a>{" "}
                — useful if you plan to drive in other UK cities with active
                Clean Air Zones.
              </p>
            ) : (
              <>
                <p className="leading-relaxed mb-3">
                  Enter your registration number on our{" "}
                  <a href="/" className="text-blue-400 hover:text-blue-300">
                    homepage
                  </a>{" "}
                  to see your vehicle&apos;s Euro emission standard. This is the
                  key factor that determines whether your vehicle will be charged
                  in the {zone.city} Clean Air Zone.
                </p>
                <p className="leading-relaxed">
                  You can also check on the{" "}
                  <a
                    href={zone.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    official {zone.city} CAZ checker
                  </a>{" "}
                  for a definitive answer specific to this zone.
                </p>
              </>
            )}
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {zone.faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-semibold text-slate-100">
                    {faq.question}
                  </h3>
                  <p className="text-sm mt-1">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Other zones */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Other UK Clean Air Zones
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {otherZones.map((other) => (
                <a
                  key={other.slug}
                  href={`/clean-air-zones/${other.slug}`}
                  className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {other.city}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {other.zoneType} &middot;{" "}
                    {other.status === "active"
                      ? "Active"
                      : other.status === "cancelled"
                        ? "Cancelled"
                        : "Deferred"}
                  </p>
                </a>
              ))}
            </div>
            <p className="text-sm mt-4">
              <a
                href="/clean-air-zones"
                className="text-blue-400 hover:text-blue-300"
              >
                View all UK Clean Air Zones &rarr;
              </a>
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">
              Home
            </a>
            <span>&bull;</span>
            <a href="/blog" className="hover:text-slate-300">
              Guides
            </a>
            <span>&bull;</span>
            <a href="/privacy" className="hover:text-slate-300">
              Privacy Policy
            </a>
            <span>&bull;</span>
            <a href="/terms" className="hover:text-slate-300">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
