import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Search,
  Star,
  Wrench,
  ClipboardCheck,
  Car,
  ShieldCheck,
  FileText,
} from "lucide-react";
import ClickMechanicLogo from "@/components/ClickMechanicLogo";
import ClickMechanicCTA from "@/components/ClickMechanicCTA";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";

const CM = "#3c93f7"; // ClickMechanic brand blue (cleared for use by Scott, 2026-06-17)
const URL = "https://www.freeplatecheck.co.uk/pre-purchase-inspection";

export const metadata: Metadata = {
  title: "Pre-Purchase Car Inspection from £79 — Mechanic Comes to the Car | Free Plate Check",
  description:
    "Book a pre-purchase car inspection from £79. A vetted mechanic travels to the car, road-tests it and sends a full written report — so you buy, haggle or walk away knowing the truth.",
  keywords: [
    "pre-purchase inspection",
    "used car inspection",
    "car inspection before buying",
    "mobile mechanic inspection",
    "pre purchase car check",
    "mechanic inspect used car",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: "Pre-Purchase Car Inspection from £79 — Mechanic Comes to the Car",
    description:
      "A vetted mechanic travels to the car, road-tests it and sends a full written report before you buy. From £79.",
    url: URL,
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pre-Purchase Car Inspection from £79 — Mechanic Comes to the Car",
    description:
      "A vetted mechanic travels to the car, road-tests it and sends a full written report before you buy. From £79.",
  },
};

const CHECKS = [
  { Icon: Wrench, t: "Under the bonnet", d: "Engine, fluids, belts, leaks and signs of past trouble." },
  { Icon: Car, t: "Road test", d: "A qualified mechanic drives it — gearbox, brakes, steering, noises." },
  { Icon: ClipboardCheck, t: "Bodywork & structure", d: "Panel gaps, paint, corrosion and crash-repair tell-tales." },
  { Icon: ShieldCheck, t: "Electrics & safety", d: "Warning lights, electronics, tyres and safety items." },
];

const STEPS = [
  { n: "1", t: "Book online", d: "Enter the car's details and your location — fixed price from £79." },
  { n: "2", t: "Mechanic travels to the car", d: "A vetted local mechanic visits the seller's address — you don't have to be there." },
  { n: "3", t: "You get a full report", d: "A written inspection report so you can buy, negotiate, or walk away with confidence." },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How much does a pre-purchase car inspection cost?",
    answer:
      "From £79 with ClickMechanic. The exact price depends on the inspection level and the car — you'll see it when you book. A vetted mechanic travels to wherever the car is.",
  },
  {
    question: "Do I need to be there for the inspection?",
    answer:
      "No. The mechanic visits the seller's address and carries out the inspection, then sends you a written report — so you can arrange it even if the car is the other end of the country.",
  },
  {
    question: "Is an inspection worth it on top of a history check?",
    answer:
      "They cover different things. A free vehicle check and a history report show the paperwork — MOT, mileage, finance, write-offs. An inspection shows the physical, mechanical condition a paper trail can't. Together they give you the full picture.",
  },
  {
    question: "What does the mechanic check?",
    answer:
      "Engine and under-bonnet condition, a road test, bodywork and crash-repair signs, plus brakes, tyres, electrics and safety items — summarised in a written report.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: CM }}>
      {children}
    </p>
  );
}

export default function PrePurchaseInspectionPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk/" },
      { "@type": "ListItem", position: 2, name: "Pre-purchase inspection", item: URL },
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
              <Search className="h-3.5 w-3.5" style={{ color: CM }} /> Pre-purchase
              inspection · by <ClickMechanicLogo className="text-xs" />
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Don&apos;t buy a used car{" "}
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                blind.
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              A qualified mechanic travels to the car and checks it over before you
              hand any money across — then sends you a full written report.
            </p>

            <div
              className="mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
              style={{ borderColor: `${CM}55`, backgroundColor: `${CM}14` }}
            >
              <Search className="h-4 w-4" style={{ color: CM }} />
              <span className="font-semibold text-white">From £79</span>
              <span className="text-slate-400">· a mechanic comes to the car</span>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ClickMechanicCTA context="inspection-hero" label="Book an inspection" />
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-200">4.8</span> · 24,000+
                Trustpilot reviews
              </div>
            </div>
          </div>

          {/* Hero photo */}
          <div className="relative mx-auto aspect-[3/2] w-full overflow-hidden rounded-3xl border border-slate-800 shadow-2xl ring-1 ring-white/5">
            <Image
              src="/mechanic.webp"
              alt="A mechanic inspecting a used car on a home driveway"
              fill
              sizes="(max-width: 640px) 90vw, 45vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur">
              Carried out by <ClickMechanicLogo className="text-xs" />
            </div>
          </div>
        </section>

        {/* THE PAIRING — history + inspection */}
        <section className="mt-10 sm:mt-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <Eyebrow>The complete buyer&apos;s check</Eyebrow>
          <h2 className="mt-1 text-xl font-bold text-white">
            Paper history tells half the story. This is the other half.
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <FileText className="h-5 w-5 text-cyan-400" />
              <p className="mt-2 font-semibold text-white">History check</p>
              <p className="mt-1 text-sm text-slate-400">
                Finance, write-offs, mileage and theft markers — the paper trail. Start
                with our{" "}
                <Link href="/car-check" className="text-cyan-400 underline hover:text-cyan-300">
                  free car check
                </Link>
                .
              </p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: `${CM}55`, backgroundColor: `${CM}10` }}>
              <Wrench className="h-5 w-5" style={{ color: CM }} />
              <p className="mt-2 font-semibold text-white">Physical inspection</p>
              <p className="mt-1 text-sm text-slate-400">
                What the paperwork can&apos;t show — the actual mechanical condition,
                checked in person by a mechanic.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT THEY CHECK */}
        <section className="mt-10 sm:mt-12">
          <Eyebrow>The inspection</Eyebrow>
          <h2 className="mt-1 text-xl font-bold text-white">What the mechanic checks</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {CHECKS.map(({ Icon, t, d }) => (
              <div key={t} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <Icon className="h-5 w-5" style={{ color: CM }} />
                <p className="mt-2 font-semibold text-white">{t}</p>
                <p className="mt-1 text-sm text-slate-400">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-10 sm:mt-12">
          <Eyebrow>Start to finish</Eyebrow>
          <h2 className="mt-1 text-xl font-bold text-white">How it works</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

        {/* FAQ */}
        <section className="mt-10 sm:mt-12">
          <Eyebrow>Good to know</Eyebrow>
          <h2 className="mt-1 text-xl font-bold text-white">Common questions</h2>
          <div className="mt-4">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mt-10 sm:mt-12 rounded-2xl border p-6 text-center" style={{ borderColor: `${CM}55`, backgroundColor: `${CM}14` }}>
          <h2 className="text-2xl font-bold text-white">A £79 check can save you thousands</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            Before you buy your next used car, let a mechanic look it over first.
          </p>
          <div className="mt-5 flex justify-center">
            <ClickMechanicCTA context="inspection-final" label="Book an inspection" />
          </div>
          <p className="mt-4 text-[11px] text-slate-500">
            Inspections are carried out by ClickMechanic. Free Plate Check may earn a
            commission — it never costs you more.
          </p>
        </section>
      </div>
    </main>
  );
}
