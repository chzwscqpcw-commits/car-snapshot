"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Zap,
  ArrowUpRight,
  ArrowLeft,
  Star,
  ShieldCheck,
  Clock,
  PoundSterling,
  Wifi,
  CheckCircle2,
  Home,
} from "lucide-react";
import PreviewGate from "@/components/preview/PreviewGate";
import ClickMechanicLogo from "@/components/ClickMechanicLogo";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";

const CM = "#3c93f7";

const partner = PARTNER_LINKS.clickMechanic;
const href = partner.url;

// Real ClickMechanic data (clickmechanic.com/ev-charger-installation, Jun 2026).
const MODELS = [
  { brand: "Evec", name: "VEC01", price: "£752", note: "Best value" },
  { brand: "Evec", name: "VEC03", price: "£841", note: "" },
  { brand: "Ohme", name: "ePod", price: "£932", note: "" },
  { brand: "Ohme", name: "HomePro 5M", price: "£970", note: "" },
  { brand: "MyEnergi", name: "Zappi (untethered)", price: "£1,078", note: "Solar-ready" },
  { brand: "Ohme", name: "HomePro 8M", price: "£1,081", note: "" },
];

const STEPS = [
  { n: "1", t: "Instant quote", d: "Enter your property details and get fixed, upfront pricing — no surveyor visit needed first." },
  { n: "2", t: "Pick your charger", d: "Choose from Ohme, Evec or MyEnergi Zappi — all 7kW smart chargers, free fitting included." },
  { n: "3", t: "Choose a day", d: "Book an install slot, Monday–Friday. A certified local installer is assigned to you." },
  { n: "4", t: "Fitted in ~2 hours", d: "The installer arrives in your window, fits and tests it, and you only pay on completion." },
];

const INCLUDED = [
  { Icon: PoundSterling, t: "Free fitting", d: "Installation included in every price — from £752 all-in." },
  { Icon: ShieldCheck, t: "Warranty", d: "1-year workmanship + 36-month manufacturer device warranty." },
  { Icon: Zap, t: "7kW smart charger", d: "7.0–7.4kW, 32A — a full overnight charge for any EV or PHEV." },
  { Icon: Wifi, t: "OZEV-approved", d: "EVHS/WCS-approved devices, compliant with UK smart-charging rules." },
];

const FAQ = [
  {
    q: "How much does a home EV charger cost to install?",
    a: "From £752 all-in with ClickMechanic — that includes the charger and free professional fitting. Prices run to around £1,096 depending on the model (Ohme, Evec or MyEnergi Zappi).",
  },
  {
    q: "How long does installation take?",
    a: "A standard installation takes about 2 hours. A certified installer comes to your home on a weekday slot you choose, fits and tests the unit, and you pay on completion.",
  },
  {
    q: "Is it cheaper than charging in public?",
    a: "Almost always. Charging at home on an EV tariff costs a fraction of public rapid-charging — see our guide to the real cost of running an electric car for the numbers.",
  },
  {
    q: "Which charger should I choose?",
    a: "All are 7kW smart chargers. Ohme and MyEnergi Zappi suit drivers who want tariff and solar integration; Evec is the best-value entry point. The quote tool recommends based on your property.",
  },
];

export default function ClickMechanicEvPreview() {
  return (
    <PreviewGate>
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* Mock-up banner */}
          <div className="mb-6 rounded-lg border border-amber-700/40 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300">
            Mock-up for review — a <strong>Free Plate Check-hosted</strong> page that
            funnels to ClickMechanic, using their own logo and brand blue. Hero is our
            own image.
          </div>
          <Link
            href="/preview/clickmechanic"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the ClickMechanic mock-ups
          </Link>

          {/* HERO */}
          <section className="grid items-center gap-8 sm:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300">
                <Zap className="h-3.5 w-3.5" style={{ color: CM }} /> Home EV charging · Installed by{" "}
                <ClickMechanicLogo className="text-xs" />
              </div>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
                Get a home EV charger fitted{" "}
                <span style={{ color: CM }}>from £752</span>
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-300">
                Fixed upfront pricing, free fitting, and a certified installer at your
                door in about two hours. Charge overnight for a fraction of public
                rates.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={href}
                  target="_blank"
                  rel={getPartnerRel(partner)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: CM }}
                >
                  Get an instant quote <ArrowUpRight className="h-4 w-4" />
                </a>
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-200">4.8</span> · 24,000+
                  Trustpilot reviews
                </div>
              </div>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Free fitting ·
                7kW smart charger · OZEV-approved
              </p>
            </div>

            {/* Hero photo — masked + gradient-overlaid so it reads as design */}
            <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-slate-800 sm:max-w-none">
              <Image
                src="/woman-charging-car.png"
                alt="Driver charging an electric car on their home driveway"
                fill
                sizes="(max-width: 640px) 80vw, 40vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
              <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur">
                Installed by <ClickMechanicLogo className="text-xs" />
              </div>
            </div>
          </section>

          {/* WHY HOME CHARGING */}
          <section className="mt-14">
            <h2 className="text-xl font-bold text-white">Why fit a charger at home?</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { Icon: PoundSterling, t: "Far cheaper per mile", d: "Overnight home charging on an EV tariff costs pennies next to public rapid chargers." },
                { Icon: Clock, t: "Wake up full", d: "Plug in at night, leave with 100%. No detours, no queues at the forecourt." },
                { Icon: Home, t: "Adds to your home", d: "A fitted 7kW point is a selling point buyers increasingly look for." },
              ].map(({ Icon, t, d }) => (
                <div key={t} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <Icon className="h-5 w-5" style={{ color: CM }} />
                  <p className="mt-2 font-semibold text-white">{t}</p>
                  <p className="mt-1 text-sm text-slate-400">{d}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              See the full sums in our guide to{" "}
              <Link href="/blog/real-cost-owning-electric-car-uk" className="text-blue-400 hover:text-blue-300">
                the real cost of owning an electric car
              </Link>
              .
            </p>
          </section>

          {/* MODELS */}
          <section className="mt-14">
            <h2 className="text-xl font-bold text-white">Chargers &amp; pricing</h2>
            <p className="mt-1 text-sm text-slate-400">
              All 7kW smart chargers. Every price includes the unit{" "}
              <span className="text-slate-200">and</span> free professional fitting.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MODELS.map((m) => (
                <div key={m.name} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">{m.brand}</p>
                    <p className="font-semibold text-white">{m.name}</p>
                    {m.note && (
                      <span className="mt-1 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                        {m.note}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold" style={{ color: CM }}>{m.price}</p>
                </div>
              ))}
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="mt-14">
            <h2 className="text-xl font-bold text-white">How it works</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white"
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
          <section className="mt-14 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white">What you get</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <section className="mt-14">
            <h2 className="text-xl font-bold text-white">Common questions</h2>
            <div className="mt-4 divide-y divide-slate-800 rounded-2xl border border-slate-800">
              {FAQ.map((f) => (
                <details key={f.q} className="group p-4">
                  <summary className="cursor-pointer list-none font-medium text-slate-100 marker:content-none">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="mt-14 rounded-2xl border p-6 text-center" style={{ borderColor: `${CM}55`, backgroundColor: `${CM}14` }}>
            <h2 className="text-2xl font-bold text-white">Ready to charge at home?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
              Get a fixed quote in under a minute — free fitting, certified installers,
              from £752.
            </p>
            <a
              href={href}
              target="_blank"
              rel={getPartnerRel(partner)}
              className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: CM }}
            >
              Get an instant quote <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="mt-4 text-[11px] text-slate-500">
              EV charger supply &amp; installation is provided by ClickMechanic. Free
              Plate Check may earn a commission — it never costs you more.
            </p>
          </section>
        </div>
      </main>
    </PreviewGate>
  );
}
