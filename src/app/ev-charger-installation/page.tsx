import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Zap,
  Star,
  ShieldCheck,
  Clock,
  PoundSterling,
  Wifi,
  CheckCircle2,
  Home,
  Plug,
  BatteryCharging,
} from "lucide-react";
import ClickMechanicLogo from "@/components/ClickMechanicLogo";
import ClickMechanicCTA from "@/components/ClickMechanicCTA";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";

const CM = "#3c93f7"; // ClickMechanic brand blue (cleared for use by Scott, 2026-06-17)
const URL = "https://www.freeplatecheck.co.uk/ev-charger-installation";

export const metadata: Metadata = {
  title: "EV Charger Installation — 7kW Home Charger Fitted from £752 | Free Plate Check",
  description:
    "Get a 7kW smart EV charger installed at home from £752 with free fitting. Certified installers, OZEV-approved chargers, fixed-price quote in under a minute.",
  keywords: [
    "EV charger installation",
    "home EV charger",
    "7kW charger install",
    "EV charger cost",
    "install home EV charger",
    "Ohme charger installation",
    "Zappi installation",
    "electric car charger fitted",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: "EV Charger Installation — 7kW Home Charger Fitted from £752",
    description:
      "A certified installer fits a 7kW smart charger at home in about two hours — fixed price, free fitting. Get an instant quote.",
    url: URL,
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EV Charger Installation — 7kW Home Charger Fitted from £752",
    description:
      "A certified installer fits a 7kW smart charger at home in about two hours — fixed price, free fitting. Get an instant quote.",
  },
};

// A selection of the chargers ClickMechanic installs — names only; CM owns the
// pricing on their own pages (clickmechanic.com/ev-charger-installation).
const CHARGERS = [
  { brand: "Ohme", name: "HomePro", tag: "Smart tariff control" },
  { brand: "Ohme", name: "ePod", tag: "Compact design" },
  { brand: "MyEnergi", name: "Zappi", tag: "Solar-ready" },
  { brand: "Evec", name: "VEC Series", tag: "Great value" },
];

const STEPS = [
  { n: "1", t: "Instant quote", d: "Enter your property details for fixed, upfront pricing — no surveyor visit needed first." },
  { n: "2", t: "Pick your charger", d: "Choose from Ohme, Evec or MyEnergi Zappi — all 7kW smart chargers, free fitting included." },
  { n: "3", t: "Choose a day", d: "Book an install slot, Monday–Friday. A certified local installer is assigned to you." },
  { n: "4", t: "Fitted in ~2 hours", d: "The installer arrives in your window, fits and tests it, and you pay on completion." },
];

const INCLUDED = [
  { Icon: PoundSterling, t: "Free fitting", d: "Professional installation included — nothing extra to pay on the day." },
  { Icon: ShieldCheck, t: "Warranty", d: "1-year workmanship + 36-month manufacturer device warranty." },
  { Icon: Zap, t: "7kW smart charger", d: "7.0–7.4kW, 32A — a full overnight charge for any EV or PHEV." },
  { Icon: Wifi, t: "OZEV-approved", d: "Certified devices, compliant with UK smart-charging rules." },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How much does a home EV charger cost to install?",
    answer:
      "From £752 all-in with ClickMechanic — that includes the charger and free professional fitting. You'll see the exact price for each model when you get your instant quote.",
  },
  {
    question: "How long does installation take?",
    answer:
      "A standard installation takes about 2 hours. A certified installer comes to your home on a weekday slot you choose, fits and tests the unit, and you pay on completion.",
  },
  {
    question: "Is it cheaper than charging in public?",
    answer:
      "Almost always. Charging at home on an EV night tariff costs a fraction of public rapid-charging — see our guide to the real cost of running an electric car for the numbers.",
  },
  {
    question: "Which charger should I choose?",
    answer:
      "All are 7kW smart chargers. Ohme and MyEnergi Zappi suit drivers who want tariff and solar integration; Evec is a great-value choice. The quote tool recommends one based on your property.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: CM }}>
      {children}
    </p>
  );
}

export default function EvChargerInstallationPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk/" },
      { "@type": "ListItem", position: 2, name: "EV charger installation", item: URL },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* HERO */}
        <section className="relative grid items-center gap-8 sm:grid-cols-2">
          <div
            className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: `radial-gradient(circle, ${CM}, transparent 70%)` }}
            aria-hidden
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300">
              <Zap className="h-3.5 w-3.5" style={{ color: CM }} /> Home EV charging ·
              Installed by <ClickMechanicLogo className="text-xs" />
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Charge at home,{" "}
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                wake up full.
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              A certified installer fits a 7kW smart charger on your driveway in about
              two hours — fixed price, free fitting, no fuss.
            </p>

            <div
              className="mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
              style={{ borderColor: `${CM}55`, backgroundColor: `${CM}14` }}
            >
              <BatteryCharging className="h-4 w-4" style={{ color: CM }} />
              <span className="font-semibold text-white">From £752</span>
              <span className="text-slate-400">· free fitting included</span>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ClickMechanicCTA context="ev-charger-hero" label="Get an instant quote" />
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-200">4.8</span> · 24,000+
                Trustpilot reviews
              </div>
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Free fitting ·
              7kW smart charger · OZEV-approved
            </p>
          </div>

          <div className="relative mx-auto aspect-[5/4] w-full max-w-[260px] overflow-hidden rounded-3xl border border-slate-800 shadow-2xl ring-1 ring-white/5 sm:aspect-square sm:max-w-none">
            <Image
              src="/woman-charging-car.webp"
              alt="Driver charging an electric car on their home driveway"
              fill
              sizes="(max-width: 640px) 80vw, 40vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg"
              style={{ backgroundColor: CM }}
            >
              From £752
            </div>
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur">
              Installed by <ClickMechanicLogo className="text-xs" />
            </div>
          </div>
        </section>

        {/* SAVINGS STRIP */}
        <section className="mt-10 sm:mt-12 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/30 p-5 sm:p-7">
          <div className="grid items-center gap-6 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Eyebrow>The home-charging difference</Eyebrow>
              <p className="mt-2 text-lg font-bold text-white">
                Pennies a mile, not pounds.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Overnight on an EV tariff vs public rapid charging.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:col-span-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-center">
                <p className="text-xs text-slate-500">Home, night tariff</p>
                <p className="mt-1 text-3xl font-extrabold" style={{ color: CM }}>~2p</p>
                <p className="text-xs text-slate-500">per mile*</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-center">
                <p className="text-xs text-slate-500">Public rapid</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-300">~20p</p>
                <p className="text-xs text-slate-500">per mile*</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-slate-600">
            *Illustrative. Actual cost depends on your tariff and car — see our{" "}
            <Link href="/blog/real-cost-owning-electric-car-uk" className="text-slate-400 underline hover:text-slate-200">
              real cost of owning an EV
            </Link>{" "}
            guide.
          </p>
        </section>

        {/* WHY HOME CHARGING */}
        <section className="mt-10 sm:mt-14">
          <Eyebrow>Why fit one</Eyebrow>
          <h2 className="mt-1 text-2xl font-bold text-white">The case for a home charger</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { Icon: PoundSterling, t: "Far cheaper per mile", d: "Overnight home charging on an EV tariff costs pennies next to public rapid chargers." },
              { Icon: Clock, t: "Wake up full", d: "Plug in at night, leave with 100%. No detours, no queues at the forecourt." },
              { Icon: Home, t: "Adds to your home", d: "A fitted 7kW point is a feature buyers increasingly look for." },
            ].map(({ Icon, t, d }) => (
              <div
                key={t}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-slate-700"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${CM}1f` }}
                >
                  <Icon className="h-5 w-5" style={{ color: CM }} />
                </span>
                <p className="mt-3 font-semibold text-white">{t}</p>
                <p className="mt-1 text-sm text-slate-400">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CHARGERS WE INSTALL — no pricing */}
        <section className="mt-10 sm:mt-14">
          <Eyebrow>The kit</Eyebrow>
          <h2 className="mt-1 text-2xl font-bold text-white">Chargers we install</h2>
          <p className="mt-1 text-sm text-slate-400">
            A selection of 7kW smart chargers — tethered or untethered, app-controlled.
            You&apos;ll pick the right one when you get your quote.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {CHARGERS.map((c) => (
              <div
                key={`${c.brand}-${c.name}`}
                className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:-translate-y-0.5 hover:border-slate-600"
              >
                <Plug className="h-5 w-5" style={{ color: CM }} />
                <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">{c.brand}</p>
                <p className="text-lg font-bold text-white">{c.name}</p>
                <span
                  className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `${CM}1f`, color: CM }}
                >
                  {c.tag}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            All fitted from £752 including installation. Full model pricing is shown
            when you get your instant quote on ClickMechanic.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-10 sm:mt-14">
          <Eyebrow>Start to finish</Eyebrow>
          <h2 className="mt-1 text-2xl font-bold text-white">How it works</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: CM }}
                >
                  {s.n}
                </div>
                <p className="mt-3 font-semibold text-white">{s.t}</p>
                <p className="mt-1 text-sm text-slate-400">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INCLUDED */}
        <section className="mt-10 sm:mt-14 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-5 sm:p-8">
          <Eyebrow>Every install</Eyebrow>
          <h2 className="mt-1 text-2xl font-bold text-white">What you get</h2>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
            {INCLUDED.map(({ Icon, t, d }) => (
              <div key={t}>
                <Icon className="h-6 w-6" style={{ color: CM }} />
                <p className="mt-2 font-semibold text-white">{t}</p>
                <p className="mt-1 text-sm text-slate-400">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10 sm:mt-14">
          <Eyebrow>Good to know</Eyebrow>
          <h2 className="mt-1 text-2xl font-bold text-white">Common questions</h2>
          <div className="mt-5">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative mt-10 sm:mt-14 overflow-hidden rounded-3xl border p-6 text-center sm:p-8" style={{ borderColor: `${CM}55` }}>
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(circle at 50% 0%, ${CM}, transparent 60%)` }}
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white">Ready to charge at home?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
              Get a fixed quote in under a minute — free fitting, certified installers,
              from £752.
            </p>
            <div className="mt-6 flex justify-center">
              <ClickMechanicCTA context="ev-charger-final" label="Get an instant quote" className="px-7" />
            </div>
            <p className="mt-5 text-[11px] text-slate-500">
              EV charger supply &amp; installation is provided by ClickMechanic. Free
              Plate Check may earn a commission — it never costs you more.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
