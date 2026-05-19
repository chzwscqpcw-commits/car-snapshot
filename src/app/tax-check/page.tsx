import type { Metadata } from "next";
import ConversionWidget from "@/components/stats/ConversionWidget";
import LandingHero from "@/components/LandingHero";
import MotReminderBanner from "@/components/MotReminderBanner";
import MOTBookingCTA from "@/components/MOTBookingCTA";
import TaxResult from "@/components/tools/TaxResult";

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export const metadata: Metadata = {
  title: "Free Car Tax Check — Is My Car Taxed? | Free Plate Check",
  description:
    "Check if any UK vehicle is taxed, SORN'd or untaxed. See the expiry date and VED band. Free instant results.",
  keywords: [
    "car tax check",
    "is my car taxed",
    "check vehicle tax",
    "tax check by reg",
    "DVLA tax check",
    "vehicle tax status",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/tax-check",
  },
  openGraph: {
    title: "Free Car Tax Check — Is My Car Taxed?",
    description:
      "Check if any UK vehicle is taxed, SORN'd or untaxed. See the expiry date and VED band. Free and instant.",
    url: "https://www.freeplatecheck.co.uk/tax-check",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Car Tax Check — Is My Car Taxed?",
    description:
      "Check if any UK vehicle is taxed, SORN'd or untaxed. See the expiry date and VED band. Free and instant.",
  },
};

export default async function TaxCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ vrm?: string }>;
}) {
  const params = await searchParams;
  const rawVrm = params?.vrm;
  const cleanedVrm = rawVrm ? cleanReg(rawVrm) : null;
  const hasResult = !!cleanedVrm && cleanedVrm.length >= 2 && cleanedVrm.length <= 8;
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
        name: "Car Tax Check",
        item: "https://www.freeplatecheck.co.uk/tax-check",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I tax my car?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can tax your car online at GOV.UK, by phone on 0300 123 4321, or at a Post Office that handles vehicle tax. You will need the V5C logbook (or the green new keeper slip if you have just bought the car) and a valid MOT if the vehicle is over three years old.",
        },
      },
      {
        "@type": "Question",
        name: "Can I drive a SORN'd car to an MOT?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. A SORN'd vehicle cannot be driven on public roads for any reason. You would need to transport it to the test centre on a trailer or flatbed, or tax and insure the vehicle before driving it there.",
        },
      },
      {
        "@type": "Question",
        name: "Do electric cars need road tax?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Electric vehicles registered before 1 April 2025 were exempt from VED. From April 2025, newly registered electric cars pay the standard rate. All electric vehicles must still be registered for tax — even if the rate is zero — to be legal on the road.",
        },
      },
      {
        "@type": "Question",
        name: "What happens if I buy a car that isn't taxed?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Road tax does not transfer when a vehicle is sold. You must tax the vehicle in your own name before driving it away. If the vehicle is not taxed, you can tax it online using the new keeper slip from the V5C logbook.",
        },
      },
      {
        "@type": "Question",
        name: "How much is road tax for my car?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The cost depends on when the vehicle was first registered. Cars registered from April 2017 onwards pay a flat standard rate of £195 per year after the first year. Cars registered before April 2017 are taxed based on CO2 emissions in bands. Enter your registration number on Free Plate Check to see your vehicle's details.",
        },
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Car Tax Check",
    url: "https://www.freeplatecheck.co.uk/tax-check",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Check if any UK vehicle is taxed, SORN'd or untaxed. See the tax expiry date and VED band for free.",
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      {hasResult ? (
        <>
          <TaxResult vrm={cleanedVrm!} />
          {/* Slim trust footer below the result */}
          <div className="border-t border-slate-800/60 bg-slate-900/40">
            <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-slate-500">
              Tax status comes from the DVLA's live VED database. VED rate is
              estimated from current GOV.UK bands — your renewal letter is the
              authoritative figure.
            </div>
          </div>
          <MotReminderBanner />
        </>
      ) : (
        <>
      <LandingHero
        h1="Free Car Tax Check"
        subtitle="Real-time DVLA tax status for any UK vehicle — see if it's taxed, SORN, or due. Plus VED band and annual cost. Free, instant, no signup."
        badgeText="Free · No signup · Real-time DVLA tax data"
        bullets={[
          "Real-time DVLA status — taxed, SORN or untaxed",
          "Annual VED rate based on CO₂ band and registration year",
          "Free email reminders 28 + 7 days before your next MOT",
        ]}
        exampleCard={
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Example</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                DVLA live
              </span>
            </div>
            <p className="text-sm text-slate-400">
              <span className="font-mono uppercase tracking-wider text-slate-200">AB12 CDE</span>
              <span className="mx-1.5 text-slate-600">&middot;</span>
              2018 VW Golf 1.4 TSI
            </p>
            <p className="text-xs text-slate-500">Petrol &middot; 1.4L &middot; CO₂ 121g/km</p>

            <div className="mt-4 rounded-lg border border-emerald-700/30 bg-gradient-to-br from-emerald-900/30 to-slate-900/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Tax status</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  TAXED
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                Expires 30 Aug 2026
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                123 days remaining
              </p>
            </div>

            <p className="mt-4 text-[10px] font-medium uppercase tracking-wider text-slate-500">Annual VED</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">band</p>
                <p className="text-xs font-semibold text-slate-300">Std</p>
              </div>
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">12 month</p>
                <p className="text-xs font-semibold text-emerald-400">&pound;190</p>
              </div>
              <div className="rounded-md bg-slate-800/60 p-2">
                <p className="text-[10px] text-slate-500">6 month</p>
                <p className="text-xs font-semibold text-slate-300">&pound;104.50</p>
              </div>
            </div>

            <p className="mt-3 rounded-md bg-amber-500/10 border border-amber-700/30 px-3 py-2 text-[11px] text-amber-300">
              &#9888; Driving untaxed: fine up to &pound;1,000
            </p>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <ConversionWidget
          headline="Check your vehicle's tax status"
          subtext="Enter any UK reg plate to see current tax status, VED band, and MOT expiry — free and instant."
          reminderHeadline="Never miss your MOT or tax renewal"
          targetPath="/tax-check"
        />

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is a car tax check?</h2>
            <p className="leading-relaxed mb-3">
              Vehicle Excise Duty (VED), commonly called road tax, is required for any vehicle used or parked on public roads in the UK. A tax check shows you the vehicle&apos;s current tax status — whether it&apos;s taxed, when the tax expires, or whether a SORN (Statutory Off Road Notification) has been declared.
            </p>
            <p className="leading-relaxed mb-3">
              Since the physical tax disc was abolished in October 2014, there is no visible way to tell whether a vehicle is taxed just by looking at it. The only way to confirm is to check online — which is exactly what Free Plate Check lets you do, for free, in seconds.
            </p>
            <p className="leading-relaxed">
              You can also see the vehicle&apos;s CO2 emissions and fuel type, which determine the VED band and annual cost. For the full vehicle specification, use our <a href="/car-check" className="text-blue-400 hover:text-blue-300">free car check</a> to see all the details recorded against the registration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How is road tax calculated?</h2>
            <p className="leading-relaxed mb-3">
              The amount you pay for road tax depends on when your vehicle was first registered and its CO2 emissions:
            </p>
            <p className="leading-relaxed mb-3">
              <strong className="text-slate-100">Vehicles registered from 1 April 2017 onwards:</strong> The first year&apos;s tax rate is based on CO2 emissions, with rates ranging from &pound;0 for zero-emission vehicles to over &pound;2,000 for the highest emitters. After the first year, most petrol and diesel cars pay a flat standard rate of &pound;195 per year. Vehicles with a list price over &pound;40,000 when new pay an additional supplement of &pound;425 per year for five years at the standard rate, bringing the total to &pound;620 per year during that period.
            </p>
            <p className="leading-relaxed mb-3">
              <strong className="text-slate-100">Vehicles registered before 1 April 2017:</strong> Road tax is based entirely on CO2 emissions, divided into bands from A (lowest emissions) to M (highest). Rates vary from &pound;0 for Band A to over &pound;600 for the highest band. Lower-emission vehicles pay significantly less.
            </p>
            <p className="leading-relaxed mb-3">
              <strong className="text-slate-100">Electric vehicles:</strong> EVs registered before 1 April 2025 were exempt from road tax. From April 2025, newly registered electric vehicles pay the standard rate. VED rates are reviewed annually in the Budget, so exact figures can change from year to year.
            </p>
            <p className="leading-relaxed">
              You can view your vehicle&apos;s <a href="/car-check" className="text-blue-400 hover:text-blue-300">CO2 emissions and fuel type</a> on Free Plate Check to understand which VED band applies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What does SORN mean?</h2>
            <p className="leading-relaxed mb-3">
              A SORN (Statutory Off Road Notification) declares that a vehicle is being kept off the public road. Once a SORN is in place, the vehicle must not be driven or parked on any public road, even briefly. A SORN stays in place until the vehicle is taxed again, sold, scrapped, or exported.
            </p>
            <p className="leading-relaxed mb-3">
              If you&apos;re buying a vehicle with a SORN, you must tax it before driving it away from the seller&apos;s property. The vehicle must also be insured and, if over three years old, have a valid MOT before it can be driven on public roads.
            </p>
            <p className="leading-relaxed">
              For a detailed explanation of when and how to declare a SORN, read our <a href="/blog/what-is-sorn-and-when-do-you-need-one" className="text-blue-400 hover:text-blue-300">guide to SORN declarations</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What happens if you don&apos;t tax your car?</h2>
            <p className="leading-relaxed mb-3">
              Failing to tax your vehicle can result in an automatic penalty from the DVLA of &pound;80 (reduced to &pound;40 if paid within 28 days). If the matter goes to court, the penalty can rise to &pound;1,000.
            </p>
            <p className="leading-relaxed mb-3">
              The DVLA also has the power to clamp, impound, or ultimately crush untaxed vehicles found on public roads. ANPR cameras across the UK flag untaxed vehicles, and enforcement is largely automated — so the chances of being caught are high.
            </p>
            <p className="leading-relaxed">
              If you don&apos;t need to use the vehicle on the road, make sure to declare a SORN to avoid penalties. You can do this online at GOV.UK or by calling the DVLA on 0300 123 4321.
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">How do I tax my car?</h3>
                <p className="text-sm mt-1">You can tax your car online at GOV.UK, by phone on 0300 123 4321, or at a Post Office that handles vehicle tax. You&apos;ll need the V5C logbook (or the green new keeper slip if you&apos;ve just bought the car) and a valid MOT if the vehicle is over three years old.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Can I drive a SORN&apos;d car to an MOT?</h3>
                <p className="text-sm mt-1">No. A SORN&apos;d vehicle cannot be driven on public roads for any reason. You would need to transport it to the test centre on a trailer or flatbed, or tax and insure the vehicle before driving it there.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Do electric cars need road tax?</h3>
                <p className="text-sm mt-1">Electric vehicles registered before 1 April 2025 were exempt from VED. From April 2025, newly registered electric cars pay the standard rate. All electric vehicles must still be registered for tax — even if the rate is zero — to be legal on the road.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What happens if I buy a car that isn&apos;t taxed?</h3>
                <p className="text-sm mt-1">Road tax does not transfer when a vehicle is sold. You must tax the vehicle in your own name before driving it away. If the vehicle is not taxed, you can tax it online using the new keeper slip from the V5C logbook.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How much is road tax for my car?</h3>
                <p className="text-sm mt-1">The cost depends on when the vehicle was first registered. Cars registered from April 2017 onwards pay a flat standard rate of &pound;195 per year after the first year. Cars registered before April 2017 are taxed based on CO2 emissions in bands. Enter your registration number on Free Plate Check to see your vehicle&apos;s details.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/blog/how-to-tax-a-car-online" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Tax a Car Online</p>
            <p className="text-xs text-slate-500 mt-2">Step-by-step guide to taxing your car with the DVLA, what you need, and what it costs.</p>
          </a>
          <a href="/blog/cheapest-cars-to-tax-uk" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Cheapest Cars to Tax in the UK</p>
            <p className="text-xs text-slate-500 mt-2">Which vehicles pay zero or low road tax, how VED bands work, and how to check.</p>
          </a>
          <a href="/blog/how-to-sorn-a-car" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to SORN a Car Online</p>
            <p className="text-xs text-slate-500 mt-2">When you need a SORN and how to declare one — a quick step-by-step guide.</p>
          </a>
        </div>
      </div>

      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">Home</a>
            <span>&bull;</span>
            <a href="/blog" className="hover:text-slate-300">Guides</a>
            <span>&bull;</span>
            <a href="/privacy" className="hover:text-slate-300">Privacy Policy</a>
            <span>&bull;</span>
            <a href="/terms" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
      <MotReminderBanner />
        </>
      )}
    </div>
  );
}
