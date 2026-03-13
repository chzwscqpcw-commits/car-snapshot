import type { Metadata } from "next";
import { CAZ_ZONES } from "@/data/caz-zones";

export const metadata: Metadata = {
  title: "UK Clean Air Zones — Full List, Charges & Compliance | Free Plate Check",
  description:
    "Complete guide to UK Clean Air Zones. See which cities charge for driving, daily rates, affected vehicles, and how to check if your car is compliant.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/clean-air-zones",
  },
  openGraph: {
    title: "UK Clean Air Zones — Full List, Charges & Compliance",
    description:
      "Complete guide to UK Clean Air Zones. See which cities charge for driving, daily rates, affected vehicles, and how to check if your car is compliant.",
    url: "https://www.freeplatecheck.co.uk/clean-air-zones",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UK Clean Air Zones — Full List, Charges & Compliance",
    description:
      "Complete guide to UK Clean Air Zones. See which cities charge for driving, daily rates, and how to check compliance.",
  },
};

export default function CleanAirZonesPage() {
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
    ],
  };

  const activeZones = CAZ_ZONES.filter((z) => z.status === "active");
  const cancelledZones = CAZ_ZONES.filter((z) => z.status !== "active");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to Free Plate Check
          </a>
          <h1 className="text-3xl font-bold text-slate-100">
            UK Clean Air Zones
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Complete guide to every Clean Air Zone in the UK — charges,
            boundaries, and how to check compliance.
          </p>
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
            Enter any UK registration number to see Euro emission standard and
            Clean Air Zone compliance.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Look up a vehicle
          </a>
        </div>

        <div className="space-y-8 text-slate-300">
          {/* Intro */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              What are Clean Air Zones?
            </h2>
            <p className="leading-relaxed mb-3">
              Clean Air Zones (CAZs) are areas in UK cities where vehicles that
              do not meet minimum emission standards are charged a daily fee to
              drive. They were introduced to reduce nitrogen dioxide (NO2)
              pollution, which has been linked to respiratory illness, heart
              disease, and thousands of premature deaths each year.
            </p>
            <p className="leading-relaxed mb-3">
              The UK government directed local authorities with the worst air
              quality to implement Clean Air Zones or equivalent measures.
              Different cities have chosen different zone classes, which
              determine which vehicle types are charged:
            </p>
            <div className="overflow-x-auto mt-4 mb-4">
              <table className="w-full text-sm border border-slate-700 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-800 text-slate-200">
                    <th className="text-left px-4 py-2.5 font-semibold">
                      Class
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold">
                      Vehicles charged
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  <tr className="bg-slate-900/50">
                    <td className="px-4 py-2.5 font-medium text-slate-100">
                      Class A
                    </td>
                    <td className="px-4 py-2.5">Buses, coaches, and taxis</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-slate-100">
                      Class B
                    </td>
                    <td className="px-4 py-2.5">
                      Buses, coaches, taxis, and HGVs
                    </td>
                  </tr>
                  <tr className="bg-slate-900/50">
                    <td className="px-4 py-2.5 font-medium text-slate-100">
                      Class C
                    </td>
                    <td className="px-4 py-2.5">
                      Buses, coaches, taxis, HGVs, and LGVs/vans
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-slate-100">
                      Class D
                    </td>
                    <td className="px-4 py-2.5">
                      All vehicle types including private cars
                    </td>
                  </tr>
                  <tr className="bg-slate-900/50">
                    <td className="px-4 py-2.5 font-medium text-slate-100">
                      ULEZ
                    </td>
                    <td className="px-4 py-2.5">
                      All vehicle types (London&apos;s own scheme)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="leading-relaxed">
              The emission standards required are the same across all zones:
              petrol vehicles need{" "}
              <strong className="text-slate-100">Euro 4</strong> or later, and
              diesel vehicles need{" "}
              <strong className="text-slate-100">Euro 6</strong> or later.
              Electric and hydrogen vehicles are exempt everywhere.
            </p>
          </section>

          {/* Active zones */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Active Clean Air Zones
            </h2>
            <div className="grid gap-4">
              {activeZones.map((zone) => (
                <a
                  key={zone.slug}
                  href={`/clean-air-zones/${zone.slug}`}
                  className="group block p-5 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                        {zone.city}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {zone.zoneType} &middot; Launched {zone.launchDate.split(" (")[0]}
                      </p>
                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                        {zone.description.slice(0, 160)}...
                      </p>
                    </div>
                    <span className="shrink-0 mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800/40">
                      Active
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {zone.charges
                      .filter((c) => c.dailyCharge !== "Not charged" && c.dailyCharge !== "Not currently charged")
                      .slice(0, 2)
                      .map((c) => (
                        <span
                          key={c.vehicleType}
                          className="text-xs text-slate-400 bg-slate-800/60 px-2 py-1 rounded"
                        >
                          {c.vehicleType}: {c.dailyCharge}
                        </span>
                      ))}
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Cancelled / deferred */}
          {cancelledZones.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Cancelled / Deferred Zones
              </h2>
              <div className="grid gap-4">
                {cancelledZones.map((zone) => (
                  <a
                    key={zone.slug}
                    href={`/clean-air-zones/${zone.slug}`}
                    className="group block p-5 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {zone.city}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {zone.zoneType} &middot; {zone.status === "cancelled" ? "Cancelled" : "Deferred"}
                        </p>
                        <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                          {zone.description.slice(0, 160)}...
                        </p>
                      </div>
                      <span className="shrink-0 mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/40 text-red-400 border border-red-800/40">
                        {zone.status === "cancelled" ? "Cancelled" : "Deferred"}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* How to check */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              How to check if your vehicle is compliant
            </h2>
            <p className="leading-relaxed mb-3">
              The quickest way to check is to enter your registration number on
              our homepage. We will show you the Euro emission standard recorded
              against your vehicle, which is the key factor in determining Clean
              Air Zone compliance.
            </p>
            <p className="leading-relaxed mb-3">
              As a general guide: if your petrol car was registered after January
              2006, it likely meets Euro 4 and is compliant. If your diesel car
              was registered after September 2015, it likely meets Euro 6 and is
              compliant. Electric and hydrogen vehicles are exempt from all UK
              Clean Air Zones.
            </p>
            <p className="leading-relaxed">
              For London specifically, you can use our dedicated{" "}
              <a
                href="/ulez-check"
                className="text-blue-400 hover:text-blue-300"
              >
                free ULEZ check
              </a>{" "}
              page. Each city also has its own official checker — see the
              individual city pages linked above for details.
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
