import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import ConversionWidget from "@/components/stats/ConversionWidget";
import MobileSearchCue from "@/components/MobileSearchCue";
import MotReminderBanner from "@/components/MotReminderBanner";
import ServicingCTA from "@/components/ServicingCTA";
import TempInsuranceCTA from "@/components/TempInsuranceCTA";
import ValuationResult from "@/components/tools/ValuationResult";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";

// Third companion to /car-valuation. This one targets the privacy /
// no-signup intent — users specifically searching to avoid handing over
// personal details. Content angle: explain what other sites do with your
// information, contrast with our approach, anchor on data minimisation.

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Why don't you ask for my email?",
    answer:
      "Because we don't need it to show you a valuation. The reg gives us everything required: make, model, year, fuel, engine, and MOT mileage history. Asking for an email is a lead-capture trick most car-valuation sites use to sell your details onward, not because the email improves the valuation.",
  },
  {
    question: "What data do you collect when I value my car?",
    answer:
      "Only the registration number itself, used to query DVLA and pull MOT records. We hash registrations before caching, so the database can serve repeat lookups quickly without storing the plate in plain text. No email, no phone, no postcode, no name. The reg lookup logs an anonymised IP-hash for spam control — and that's the entire list.",
  },
  {
    question: "How do you make money if it's free and there's no signup?",
    answer:
      "We earn a small commission when users click through to BookMyGarage to compare MOT prices or to Cuvva for short-term insurance, if they choose to. Those affiliate links are visible at the bottom of result pages. We never use the data we collect to drive those clicks — the affiliate offers are visible to everyone, signed-up or not, and the page works fine if you ignore them.",
  },
  {
    question: "Can I really value my car anonymously?",
    answer:
      "Yes. There's no account, no email, no name. The valuation appears on screen and isn't tied to any identity. If you close the tab the only record we have is an IP-hash that can't be reversed back to you personally, and an anonymous lookup count for usage stats. We don't fingerprint, we don't run third-party analytics that track across sites, and we don't sell anything to data brokers.",
  },
  {
    question: "What do other car-valuation sites do with my email?",
    answer:
      "Most of them use it for lead generation. The form goes to a network of car-buying companies (We Buy Any Car competitors, local dealers, finance brokers). They'll call or email you trying to buy the car for less than it's worth, sell you finance, or onward-sell your interest data. The 'free instant valuation' is the bait — your contact details are the product.",
  },
  {
    question: "What's GDPR got to do with car valuations?",
    answer:
      "Under UK GDPR, services have to collect the minimum data necessary for the stated purpose. The stated purpose of a car valuation is producing a value — your name and email aren't necessary to do that. Asking anyway, especially without a clear lawful basis or genuine processing need, is a grey area that most operators rely on you not caring about. We just decided not to play that game.",
  },
  {
    question: "Will I get spam if I check my car here?",
    answer:
      "No. Not because we promise not to spam — but because we have no way to. We don't have your email. We don't have your phone. There's literally no channel through which we could send you marketing if we wanted to. The privacy promise is built into the architecture, not the policy.",
  },
  {
    question: "How can I tell if a 'free' valuation tool is actually free?",
    answer:
      "Two quick tests. (1) Does it show you the number BEFORE asking for anything? If you have to enter an email to see the result, the result isn't really what you're paying with. (2) Does it ask for a phone number? Phone is almost always for lead-resale. A genuinely free tool needs the reg and nothing else.",
  },
];

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export const metadata: Metadata = {
  title: "Car Valuation — No Signup, No Email, No Marketing | Free Plate Check",
  description:
    "Value your car with just a registration number. No signup, no email, no phone number. We collect the minimum data possible — and never sell anything to lead brokers.",
  keywords: [
    "car valuation no signup",
    "car valuation no sign up",
    "free car valuation no signup",
    "free car valuation no sign up",
    "value my car no sign up",
    "value my car free no sign up",
    "car valuation no registration",
    "car valuation no details",
    "anonymous car valuation",
    "car valuation private",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/car-valuation-no-signup",
  },
  openGraph: {
    title: "Car Valuation — No Signup, No Email, No Marketing",
    description:
      "Value your car with just a registration number. No signup, no email, no phone number.",
    url: "https://www.freeplatecheck.co.uk/car-valuation-no-signup",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Valuation — No Signup, No Email, No Marketing",
    description:
      "Value your car with just a registration number. No signup, no email, no phone number.",
  },
};

export default async function CarValuationNoSignupPage({
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
        name: "Car Valuation — No Signup",
        item: "https://www.freeplatecheck.co.uk/car-valuation-no-signup",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — Car Valuation (No Signup)",
    url: "https://www.freeplatecheck.co.uk/car-valuation-no-signup",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Value your car with just a registration number. No signup, no email, no phone number.",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      {hasResult ? (
        <>
          <ValuationResult vrm={cleanedVrm!} />
          <MotReminderBanner />
        </>
      ) : (
        <>
          {/* --- HERO --- */}
          <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_60%)]" />
            <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-6 lg:pb-10">
              <a
                href="/tools"
                className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block"
              >
                &larr; Back to all tools
              </a>

              {/* MOBILE LAYOUT */}
              <div className="lg:hidden">
                <div className="grid gap-3 grid-cols-[1fr_110px] sm:grid-cols-[1fr_135px] items-start">
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
                      Car valuation — no signup
                    </h1>
                    <p className="mt-2 text-sm font-medium text-emerald-300">
                      No email · No phone · No marketing
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <div className="relative">
                      <Image
                        src="/previews/car-valuation.png"
                        alt="Sample car valuation result"
                        width={110}
                        height={145}
                        className="rounded-lg border border-slate-700/60 shadow-xl shadow-cyan-500/15 -rotate-2 object-cover object-top"
                        style={{ width: 110, height: 145 }}
                      />
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[9px] font-bold uppercase tracking-wider shadow-lg rotate-3">
                        Sample
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-base text-slate-300 leading-relaxed">
                  Most &quot;free&quot; car valuation sites are lead-generation
                  funnels — they gate the number behind an email and sell
                  your details. This one doesn&apos;t. Type your reg, see
                  the value, that&apos;s it.
                </p>
              </div>

              {/* DESKTOP LAYOUT */}
              <div className="hidden lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:items-center">
                <div>
                  {/* Desktop hero — <p> not a 2nd <h1> (mobile layout has the page's single h1) */}
                  <p className="text-5xl font-bold text-slate-100 leading-tight">
                    Car valuation — no signup
                  </p>
                  <p className="mt-3 text-sm font-medium text-emerald-300">
                    No email · No phone · No signup · No marketing calls
                  </p>
                  <p className="mt-4 text-lg text-slate-300 leading-relaxed max-w-xl">
                    Most &quot;free&quot; valuation sites are
                    lead-generation funnels — they gate the number behind a
                    form and sell your details to dealers and car-buying
                    services who&apos;ll then chase you for weeks. We built
                    the opposite: type your reg, see the value, leave.
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                      No account, no email, no phone, no postcode
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                      No data brokers, no lead resale, no marketing emails
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                      Same DVLA data, same live market signals
                    </li>
                  </ul>
                </div>
                <div className="relative w-fit mx-auto lg:mx-0">
                  <Image
                    src="/previews/car-valuation.png"
                    alt="Sample valuation result"
                    width={280}
                    height={365}
                    className="rounded-2xl border border-slate-700/60 shadow-2xl shadow-cyan-500/10 object-cover object-top -rotate-2"
                    style={{ width: 280, height: 365 }}
                  />
                  <span className="absolute -top-3 -right-3 px-2.5 py-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-lg rotate-3">
                    Sample
                  </span>
                </div>
              </div>

              <MobileSearchCue />
            </div>
          </div>

          {/* --- MAIN: Reg lookup --- */}
          <div className="max-w-3xl mx-auto px-4 pt-6 pb-10 sm:py-10">
            <ConversionWidget
              headline="Get your valuation — no details required"
              subtext="Enter any UK registration. You'll see the value, plus MOT history, tax status, ULEZ check and more. No form to fill, no email to give."
              reminderHeadline="Own this car? Free MOT reminder — opt in here only if you want it."
              targetPath="/car-valuation-no-signup"
            />

            <StatCallouts
              stats={[
                { value: "1 field", label: "Registration only", tone: "good" },
                { value: "0", label: "Email / phone fields" },
                { value: "0", label: "Marketing partners", tone: "good" },
              ]}
            />

            {/* --- Long-form copy --- */}
            <div className="mt-12 space-y-8 text-slate-300">
              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Why nearly every &quot;free&quot; valuation site asks for your email
                </h2>
                <p className="leading-relaxed mb-3">
                  Type &quot;free car valuation&quot; into Google. Click any
                  result. Almost all of them follow the same pattern:
                  registration → value-estimate teaser → form gate
                  demanding your email, often a phone number too, before
                  you see the actual figure.
                </p>
                <p className="leading-relaxed mb-3">
                  The reason is simple. The valuation itself is the bait.
                  What the operators are really collecting is qualified
                  sales leads — people who, by their own action, have just
                  told a system &quot;I&apos;m thinking about selling my
                  car.&quot; That&apos;s a £5–£30 lead in the UK lead
                  market, depending on the car&apos;s value and the
                  buyer&apos;s appetite.
                </p>
                <p className="leading-relaxed">
                  Those leads then go to one or more of: dealer groups,
                  We-Buy-Any-Car-style competitors, online car-buying
                  marketplaces, finance brokers offering refinance, or just
                  straight to lead-resellers who&apos;ll mark them up and
                  pass them on again. By the time you&apos;ve clicked
                  &quot;submit&quot; your contact details are typically
                  with three to five third parties, and you&apos;ll get
                  calls and emails for the next 2–6 weeks.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  How we built a no-signup valuation
                </h2>
                <p className="leading-relaxed mb-3">
                  The technical answer: we don&apos;t need an email to
                  produce a value. The valuation comes from:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
                  <li>
                    <strong className="text-slate-100">DVLA vehicle data</strong> — make, model, year, fuel,
                    engine size — keyed off the reg.
                  </li>
                  <li>
                    <strong className="text-slate-100">MOT mileage history</strong> — pulled from the DVSA
                    MOT API, also keyed off the reg.
                  </li>
                  <li>
                    <strong className="text-slate-100">Live market listings</strong> — comparable cars
                    currently advertised in the UK market, matched on
                    make/model/year/mileage band.
                  </li>
                  <li>
                    <strong className="text-slate-100">Depreciation model</strong> — UK-calibrated
                    age × make-retention coefficients.
                  </li>
                </ul>
                <p className="leading-relaxed">
                  None of those inputs need an email address. Adding the
                  email step would only serve one purpose: capturing data
                  to sell on. We chose not to.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  What we actually collect
                </h2>
                <p className="leading-relaxed mb-3">
                  Total list of data tied to your lookup:
                </p>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-3">
                  <table className="w-full text-sm border border-slate-800 rounded-lg overflow-hidden">
                    <thead className="bg-slate-900/80 text-slate-200">
                      <tr>
                        <th className="text-left px-3 py-2 border-b border-slate-800">Data</th>
                        <th className="text-left px-3 py-2 border-b border-slate-800">Why</th>
                        <th className="text-left px-3 py-2 border-b border-slate-800">Retention</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      <tr className="border-b border-slate-800/60">
                        <td className="px-3 py-2 font-mono text-xs">Registration</td>
                        <td className="px-3 py-2">Identifies the vehicle for the DVLA/MOT lookup</td>
                        <td className="px-3 py-2">Hashed before storage; 24-hour cache to serve repeat lookups</td>
                      </tr>
                      <tr className="border-b border-slate-800/60">
                        <td className="px-3 py-2 font-mono text-xs">IP-hash</td>
                        <td className="px-3 py-2">Spam &amp; rate-limit control</td>
                        <td className="px-3 py-2">One-way SHA-256; can&apos;t be reversed back to your IP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-xs">Lookup count</td>
                        <td className="px-3 py-2">Anonymous usage stats (&quot;X+ vehicles checked&quot;)</td>
                        <td className="px-3 py-2">Aggregated, not tied to any identity</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="leading-relaxed">
                  No email. No phone. No name. No postcode. No tracking
                  cookies that follow you across other sites. The IP-hash
                  exists because without it we couldn&apos;t stop someone
                  burning through DVLA quota with a script — it&apos;s a
                  rate-limit token, not a tracking identifier.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Three quick tests for spotting a fake &quot;free&quot; valuation
                </h2>
                <ol className="list-decimal list-inside space-y-2 ml-2 mb-3">
                  <li className="leading-relaxed">
                    <strong className="text-slate-100">
                      Does it show the number before the form?
                    </strong>{" "}
                    A genuinely free tool produces the value first. If you
                    have to enter contact details to see anything, your
                    contact details are the actual product.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-slate-100">
                      Does it ask for your phone number?
                    </strong>{" "}
                    Phone numbers exist almost exclusively to enable
                    outbound calls — i.e. lead resale to buyers/dealers.
                    There&apos;s no technical reason to need a phone number
                    to value a car.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-slate-100">
                      Does the privacy policy mention &quot;sharing with
                      partners&quot;?
                    </strong>{" "}
                    Look specifically for &quot;trusted partners&quot;,
                    &quot;dealer network&quot;, or &quot;car-buying
                    services&quot;. Those phrases are how lead resale is
                    described in legalese. If it&apos;s there, your details
                    will be sold.
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  How we make money
                </h2>
                <p className="leading-relaxed mb-3">
                  Honest answer: affiliate commissions. When you click
                  through to BookMyGarage to compare MOT prices, or to
                  Cuvva for short-term insurance, we earn a small
                  commission if you book. Those links are clearly marked
                  and live at the bottom of result pages.
                </p>
                <p className="leading-relaxed">
                  Critically, we don&apos;t need your personal data to make
                  this work — the affiliate offers display to everyone, and
                  you can ignore them entirely without affecting the
                  valuation. They&apos;re an opt-in revenue stream, not the
                  default cost of using the tool.
                </p>
              </section>

              <section>
                <ServicingCTA context="generic" />
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Frequently asked questions
                </h2>
                <FaqAccordion items={FAQ_ITEMS} />
              </section>
            </div>
          </div>

          {/* Cuvva affiliate */}
          <div className="max-w-3xl mx-auto px-4 mt-12">
            <TempInsuranceCTA
              context="car-valuation-no-signup"
              headline="Buying or selling this car? Sort the test-drive insurance."
              body="Cuvva offers hourly, daily and weekly cover bought in 90 seconds — ideal for the test-drive moment, or for driving a just-bought car home before your annual policy starts."
            />
          </div>

          {/* Related pages */}
          <div className="max-w-3xl mx-auto px-4 mt-16">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">More ways to value your car</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <a href="/car-valuation" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Free car valuation — without email</p>
                <p className="text-xs text-slate-500 mt-2">The main valuation page — same tool, broader query coverage.</p>
              </a>
              <a href="/value-my-car" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Value my car — 30 seconds, no email</p>
                <p className="text-xs text-slate-500 mt-2">Action-led framing of the same tool, with timing-the-market detail.</p>
              </a>
              <a href="/how-much-is-my-car-worth" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How much is my car worth?</p>
                <p className="text-xs text-slate-500 mt-2">Methodology-led answer to the question — explains how the number is calculated.</p>
              </a>
              <Link href="/blog/car-valuation-guide" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Complete car valuation guide</p>
                <p className="text-xs text-slate-500 mt-2">How valuations work, what affects value, and how to get the best price.</p>
              </Link>
            </div>
          </div>
          <MotReminderBanner />
        </>
      )}
    </div>
  );
}
