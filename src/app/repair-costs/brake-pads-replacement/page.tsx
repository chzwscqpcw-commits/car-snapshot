import type { Metadata } from "next";
import Link from "next/link";
import { Disc, AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import PersonalisedCostLookup from "@/components/PersonalisedCostLookup";

const TITLE = "Brake Pads Replacement Cost UK 2026: £90–£350 Per Axle";
const DESCRIPTION =
  "Brake pads cost £90–£200 per axle in the UK, or £150–£350 with new discs. See exactly what should be included, signs your pads are worn, and how to avoid overpaying.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "brake pads replacement cost UK",
    "brake pad cost",
    "front brake pads price",
    "brake discs and pads cost",
    "how much to replace brake pads",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/repair-costs/brake-pads-replacement",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.freeplatecheck.co.uk/repair-costs/brake-pads-replacement",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brake Pads Replacement Cost UK 2026: £90–£350 Per Axle",
    description: DESCRIPTION,
  },
};

const FAQ = [
  {
    q: "How much does it cost to replace brake pads in the UK?",
    a: "Brake pad replacement typically costs £90–£200 per axle in the UK (pads only). If the discs need replacing at the same time — which is common — the total per axle rises to £150–£350. Premium and performance cars use more expensive parts and labour goes up accordingly.",
  },
  {
    q: "How often should brake pads be replaced?",
    a: "Front brake pads usually need replacing every 30,000–50,000 miles, while rear pads last longer — often 50,000–70,000 miles. Driving style is a huge factor: heavy urban stop-start driving wears pads faster than motorway commuting. Performance cars and EVs (with regen braking) have different wear patterns again.",
  },
  {
    q: "Should I replace discs at the same time as pads?",
    a: "Often yes. Discs typically last for two sets of pads (60,000–100,000 miles depending on driving). If your discs have a noticeable lip on the edge, are scored, are corroded, or are below minimum thickness, they should be replaced with the pads. A reputable garage will measure the discs before quoting.",
  },
  {
    q: "What are the signs my brake pads need replacing?",
    a: "Squealing or grinding noises when braking, longer stopping distances, a brake warning light, vibration through the pedal, or the car pulling to one side when braking. Many cars also have wear sensors that trigger an electronic warning when pads are close to minimum. Don't ignore any of these — brakes are not optional.",
  },
  {
    q: "Can I just replace the front pads and not the rear?",
    a: "Yes, and that's normal. Front brakes do roughly 70% of stopping work, so front pads wear faster. Replacing fronts only is fine — but make sure the garage checks the rear pads too and tells you their remaining thickness so you can plan.",
  },
  {
    q: "Will worn brake pads fail an MOT?",
    a: "Yes. Brakes are the third most common reason for MOT failure in the UK. Pads worn below 1.5mm of material remaining will fail, as will any visible damage or excessive disc wear. The MOT tester also checks brake performance on a rolling road — uneven braking force across an axle will fail too.",
  },
  {
    q: "Do EVs need brake pads replaced?",
    a: "Yes, but far less often than petrol or diesel cars. Regenerative braking does 60–80% of the slowing on most EVs, so the friction pads barely engage in normal driving. Pads commonly last 70,000–100,000 miles on EVs compared with 30,000–50,000 miles on equivalent ICE cars. The catch is that the discs can corrode from underuse — surface rust builds up and pits the metal. On EVs older than three years, disc corrosion is now a common MOT advisory and often the discs need replacing before the pads do.",
  },
  {
    q: "What's the difference between OEM and aftermarket brake pads?",
    a: "OEM (Original Equipment Manufacturer) pads are made to the same specification as the pads fitted at the factory — often by the same supplier, just sold in a different box. OEM-equivalent brands like Brembo, Textar, Ferodo, Bosch and Pagid offer the same quality at lower prices. Cheap unbranded aftermarket pads can be 30–50% cheaper but tend to wear faster, dust more, squeal sooner, and may not match the original friction coefficient — which changes how the car stops in an emergency. Stick with OEM-equivalent at minimum.",
  },
  {
    q: "How long does a brake pad replacement take?",
    a: "Front pads only is typically a 45–90 minute job for a competent technician. Front pads and discs takes 90 minutes to two hours. All four corners including discs is around three to four hours. Add 15–30 minutes per axle if the car has an electronic parking brake, because the rear caliper pistons need winding back with a diagnostic tool rather than a manual G-clamp.",
  },
  {
    q: "Can I drive with worn brake pads?",
    a: "Briefly, but you shouldn't. Pads worn below the minimum thickness reduce braking performance, lengthen stopping distances, and risk metal-on-metal contact that destroys the discs and can overheat the brake fluid. If you hear grinding, the friction material is already gone — drive only as far as the nearest garage and have it on a trailer if possible. Driving on metal backing plates can also fail the MOT immediately and invalidate parts of your insurance in the event of a collision.",
  },
];

export default function BrakePadsPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Repair Costs", item: "https://www.freeplatecheck.co.uk/repair-costs" },
      { "@type": "ListItem", position: 3, name: "Brake Pads Replacement Cost", item: "https://www.freeplatecheck.co.uk/repair-costs/brake-pads-replacement" },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-8">
          <Link href="/repair-costs" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            &larr; All repair cost guides
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-700/40 bg-red-900/20 px-3 py-1 text-xs font-medium text-red-300">
            <Disc className="h-3 w-3" />
            UK price guide · Updated 2026
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
            Brake pads replacement cost UK
          </h1>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Brake pads wear is the third most common cause of MOT failure in
            the UK. Replacing them on time is one of the cheapest ways to
            avoid both a failure and a serious accident. Here&apos;s what to
            expect to pay.
          </p>

          <div className="mt-5 inline-block rounded-xl border border-red-700/40 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Typical UK price</p>
            <p className="mt-1 text-3xl font-bold text-red-400">£90 &ndash; £350</p>
            <p className="mt-1 text-xs text-slate-500">
              Pads only: £90–£200 per axle · Pads + discs: £150–£350 per axle
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 text-slate-300">
        <PersonalisedCostLookup
          slug="brake-pads-replacement"
          jobName="brake pads replacement"
          partner="bookMyGarageRepair"
        />

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Cost by job type</h2>
          <p className="leading-relaxed mb-4">
            What you actually pay depends on what wears out together. Pads
            alone is the cheapest scenario; pads, discs and sometimes
            sensors on both axles is the most expensive.
          </p>

          <div className="space-y-4 mt-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Front pads only</h3>
                <span className="text-lg font-bold text-emerald-400">£90–£180</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Most common job. Front pads do most of the work and wear
                fastest. Small cars at the lower end, performance saloons
                higher.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Front pads + discs</h3>
                <span className="text-lg font-bold text-amber-400">£150–£300</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Standard when the discs are at or near minimum thickness.
                Replacing pads onto worn discs causes uneven wear and
                squealing — avoid the false economy.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Rear pads only</h3>
                <span className="text-lg font-bold text-emerald-400">£90–£180</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Last longer than front pads. Cars with electronic parking
                brakes (most post-2015 cars) cost slightly more due to the
                wind-back tool needed.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">All four corners (pads + discs)</h3>
                <span className="text-lg font-bold text-red-400">£300–£600+</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Comprehensive brake refresh. Often makes sense if you&apos;ve
                bought a high-mileage used car or you&apos;re keeping a car
                long-term and want to reset everything at once.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Cost by car category</h2>
          <p className="leading-relaxed mb-4">
            Brake parts scale with vehicle weight, calliper size and how much
            heat the system has to dissipate. A supermini and a large SUV both
            have four wheels, but the SUV is shedding two-and-a-half times the
            kinetic energy on every stop — so the discs, pads and labour all
            cost more. Here&apos;s how the typical UK pricing breaks down by
            segment.
          </p>

          <div className="space-y-4 mt-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Small petrol</h3>
                <span className="text-sm font-bold text-emerald-400">£80&ndash;£220</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Ford Fiesta, VW Polo, Hyundai i10, Toyota Aygo, Vauxhall Corsa
              </p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Pads alone £80&ndash;£140 per axle, pads and discs £130&ndash;£220 per
                axle. The cheapest cars to brake. Pads are commodity parts,
                discs are small and light, and the labour is straightforward
                because the calliper bolts are easy to reach.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Medium petrol and diesel</h3>
                <span className="text-sm font-bold text-emerald-400">£100&ndash;£280</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                VW Golf, Ford Focus, Audi A3, Vauxhall Astra, BMW 1 Series, Toyota Corolla
              </p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Pads alone £100&ndash;£170 per axle, pads and discs £160&ndash;£280
                per axle. The biggest segment of the UK car parc. Prices
                cluster tightly around the middle of the range because the
                parts catalogues are huge and competition is fierce.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Large and SUV</h3>
                <span className="text-sm font-bold text-amber-400">£140&ndash;£420</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Range Rover, BMW X5, Mercedes GLE, Audi Q7, Volvo XC90, Land Rover Discovery
              </p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Pads alone £140&ndash;£240 per axle, pads and discs
                £230&ndash;£420 per axle. Larger calipers, vented discs front
                and rear, and on many models electronic parking brakes that
                need a diagnostic tool to retract. Heavy SUVs also tend to eat
                their front pads in 25,000&ndash;35,000 miles rather than the
                40,000+ of a family hatchback.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Premium and performance</h3>
                <span className="text-sm font-bold text-red-400">£200&ndash;£700+</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                BMW M3, Audi RS, Mercedes-AMG, Porsche 911, Jaguar F-Type
              </p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Pads alone £200&ndash;£400 per axle, pads and discs
                £350&ndash;£700 and up per axle. Multi-piston callipers,
                lightweight floating discs and high-friction pad compounds all
                cost real money. Cars with carbon-ceramic discs are an
                entirely different bracket — a single front disc can be
                £2,500&ndash;£5,000.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Electric vehicles</h3>
                <span className="text-sm font-bold text-amber-400">£120&ndash;£320</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Tesla Model 3, MG4, Nissan Leaf, VW ID.3, Kia e-Niro, Hyundai Ioniq 5
              </p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Pads alone £120&ndash;£200 per axle, pads and discs
                £200&ndash;£320 per axle when they are eventually needed. The
                twist with EVs is that the discs usually need replacing
                <em> before</em> the pads, because regen braking leaves the
                friction surfaces underused. Surface rust builds up, pits the
                metal, and the disc can no longer be skimmed clean. Budget for
                discs first, pads possibly later.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">How brake pads wear on EVs vs petrol and diesel</h2>
          <p className="leading-relaxed mb-3">
            Electric and plug-in hybrid cars brake very differently to a petrol
            or diesel car. When you lift off the accelerator or press the
            brake pedal lightly, the motor reverses and acts as a generator,
            slowing the car and feeding energy back into the battery. On most
            modern EVs this regenerative system handles
            <strong className="text-slate-100"> 60&ndash;80% of all deceleration</strong>,
            with the friction brakes only engaging for harder stops, low-speed
            crawls and emergencies.
          </p>
          <p className="leading-relaxed mb-3">
            The practical effect is that EV brake pads last a very long time.
            It is common to see EVs go
            <strong className="text-slate-100"> 70,000&ndash;100,000 miles</strong>
            on the original pads, compared with 30,000&ndash;50,000 miles for
            an equivalent petrol or diesel. Taxi-spec EVs running one-pedal
            driving routinely hit higher figures still. Many fleet operators
            now skip the routine pad change at 40,000 miles because there is
            simply nothing to replace.
          </p>
          <p className="leading-relaxed mb-3">
            The flip side is disc corrosion. Brake discs are made of cast iron
            and they rely on being scrubbed clean by the pads every few miles.
            On an EV that hardly uses its friction brakes, the discs sit damp
            and unused, surface rust forms, and over time the rust pits the
            metal so badly it cannot be cleaned. Disc corrosion is now one of
            the more common MOT advisories on EVs older than three years.
            <strong className="text-slate-100"> Pre-2021 Tesla Model S and Model 3</strong>
            cars are particularly noted for it — Tesla has since revised its
            service guidance to include an annual brake clean and lubricate.
          </p>
          <p className="leading-relaxed">
            If you drive an EV, it is worth checking your MOT history before
            assuming the brakes are fine. Any advisory mentioning corrosion,
            pitting or lipping on discs is the early warning. You can pull up
            your full MOT history in seconds with our{" "}
            <Link href="/mot-check" className="text-blue-400 hover:text-blue-300">free MOT check</Link> —
            it lists every advisory and failure DVSA has recorded against the
            car.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Signs of worn brake pads</h2>
          <ul className="space-y-2 text-sm">
            {[
              "High-pitched squeal when braking (wear-indicator metal tab touching the disc)",
              "Grinding noise when braking — pads have worn through, metal-on-metal contact",
              "Brake warning light on the dashboard (some cars have wear sensors)",
              "Longer stopping distances or a 'spongy' pedal feel",
              "Pulling to one side under braking (uneven wear, or sticking caliper)",
              "Visible thickness — peer through the wheel spokes, pad material should be at least 3mm",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed">
            Grinding is the &ldquo;you should have done this last week&rdquo;
            noise. By that point pads have worn down to the metal backing
            plate, which scores the disc and forces a disc replacement on top
            of the pads.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Should I do this myself?</h2>
          <p className="leading-relaxed mb-3">
            Front brake pads are one of the more approachable DIY jobs on a
            modern car. A competent home mechanic with a trolley jack, axle
            stands, a torque wrench and a couple of hours can absolutely
            tackle them. The parts alone for fronts on a typical family car
            are{" "}
            <strong className="text-slate-100">£40&ndash;£90 for OEM-equivalent pads</strong>
            from a parts factor, against a garage bill of £100&ndash;£170 for
            the same job. Add discs and you are looking at another £50&ndash;£120
            in parts.
          </p>
          <p className="leading-relaxed mb-3">
            Rears are where it gets harder. On most cars built since 2015 the
            rear callipers have an
            <strong className="text-slate-100"> electronic parking brake</strong>
            (EPB) — there is a small motor on each calliper that drives the
            piston in and out. To replace the pads you have to put the
            calliper into service mode using a diagnostic tool, otherwise the
            piston will not retract and you cannot fit the new (thicker) pads.
            A basic OBD2 tool that can talk to the EPB is £60&ndash;£150, and
            some marques (notably some VAG and Volvo models) need a
            brand-specific tool or paid software subscription.
          </p>
          <p className="leading-relaxed mb-3">
            One thing people forget: brake pad and disc disposal is regulated.
            Old pads contain brake dust laced with copper and other metals and
            they
            <strong className="text-slate-100"> must go to a council recycling centre</strong>,
            not the household bin. Most centres have a dedicated &ldquo;car
            parts and oil&rdquo; bay. Discs go to the same place for metal
            recycling.
          </p>
          <p className="leading-relaxed mb-3">
            Honestly, we would recommend a professional install if any of
            these apply:
          </p>
          <ul className="space-y-2 text-sm mb-3">
            {[
              "Your car has an electronic parking brake — without the right tool you can damage the calliper motor",
              "Your car is still under manufacturer warranty — a DIY brake job can void warranty cover on related parts",
              "You plan to sell the car within 6 months — buyers want garage stamps and an invoice for safety-critical work",
              "You have any doubt at all about torque settings or bedding-in — brakes are not a job to learn on the fly",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="leading-relaxed">
            For everyone else with a pre-2015 car and the right tools, fronts
            are a sensible Saturday-morning job that can save £60&ndash;£100 in
            labour.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">What a good brake job includes</h2>
          <ul className="space-y-2 text-sm">
            {[
              "Measurement of remaining disc thickness vs manufacturer minimum",
              "Replacement of pad anti-rattle clips and shims",
              "Cleaning and lubrication of slider pins (sticking pins cause uneven wear)",
              "Brake fluid level check, top up if needed",
              "Brake pedal bedding-in instruction (gentle braking for first 200 miles)",
              "Quote in writing before any work starts",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Choosing a garage</h2>
          <p className="leading-relaxed mb-4">
            Brake work is one of the easier places for a garage to cut corners
            because most customers never see what was done. A few specific
            questions before the work starts will tell you whether you are
            dealing with a careful workshop or a quick fitter trying to clear
            the ramp.
          </p>
          <ul className="space-y-3 text-sm leading-relaxed mb-4">
            <li>
              <strong className="text-slate-100">Do you measure disc thickness with a vernier?</strong>{" "}
              The minimum thickness is stamped on the edge of every disc. A
              careful garage uses a vernier or micrometer and writes the
              measurement on the invoice. &ldquo;Looked fine by eye&rdquo; is
              not a measurement and means new pads may end up on discs that
              are already at the limit.
            </li>
            <li>
              <strong className="text-slate-100">Are you fitting OEM-equivalent pads?</strong>{" "}
              Ask for the brand. Brembo, Textar, Ferodo, Bosch, Pagid, ATE,
              Delphi and Mintex are the names you want to hear. If the answer
              is a brand you have never heard of or &ldquo;our standard
              fitment&rdquo;, push back — cheap pads dust more, squeal sooner
              and wear unevenly.
            </li>
            <li>
              <strong className="text-slate-100">Will you bleed the brake fluid if the pads were below 20%?</strong>{" "}
              When pads get very thin, the piston has pushed out a long way
              and the fluid that has been sitting near the hot calliper has
              absorbed moisture and lost performance. A fluid bleed adds
              £30&ndash;£50 but restores the pedal feel. Many garages skip it
              by default — ask.
            </li>
            <li>
              <strong className="text-slate-100">Will you record the new pad thickness on the invoice?</strong>{" "}
              A proper job sheet lists the brand of pads fitted and the
              starting thickness in millimetres. That gives the next mechanic
              a baseline to measure against and proves the parts were
              actually new rather than reclaimed.
            </li>
            <li>
              <strong className="text-slate-100">Will you clean and lubricate the calliper slider pins?</strong>{" "}
              Seized slider pins are the single most common cause of
              premature and uneven pad wear. The fix is five minutes with
              copper grease and a wire brush. Any garage that skips it is
              storing up a return visit.
            </li>
          </ul>
          <p className="leading-relaxed">
            Rather than ring round five garages yourself, our{" "}
            <Link href="/booking" className="text-blue-400 hover:text-blue-300">booking wizard</Link>{" "}
            collects quotes from vetted local garages for brake work, services
            and diagnostic checks — typically three to five quotes in the same
            morning, with reviews and prices side by side. It is the fastest
            way to find a fair price without spending your day on the phone.
          </p>
        </section>

        <div className="my-8 rounded-xl border border-blue-800/40 bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-slate-900/60 p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <Wrench className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-white">
                Get a brake diagnosis and quote in one go
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Brake noises, vibration or a warning light usually need a
                proper inspection before anyone can quote accurately. Our
                booking wizard routes you to local garages set up for brake
                diagnostics and repair, with quotes back the same day.
              </p>

              <Link
                href="/booking?type=diagnostic&source=brake-pads-page"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-cyan-500/20"
              >
                Start the booking wizard
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
              </Link>

              <p className="mt-2 text-xs text-slate-500">
                Free quotes from local garages &middot; No obligation &middot; Takes about 60 seconds
              </p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-slate-100 mb-4">FAQ</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-slate-100">{f.q}</h3>
                <p className="text-sm mt-1 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/repair-costs/car-battery-replacement" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Car battery replacement cost UK</p>
              <p className="text-xs text-slate-500 mt-2">Another routine job — typical £80–£250.</p>
            </Link>
            <Link href="/blog/most-common-mot-failures" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Most common MOT failures</p>
              <p className="text-xs text-slate-500 mt-2">Brakes are #3. Lights and suspension are even worse offenders.</p>
            </Link>
            <Link href="/blog/how-to-prepare-car-for-mot" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to prepare your car for an MOT</p>
              <p className="text-xs text-slate-500 mt-2">A pre-MOT brake check could save you a retest.</p>
            </Link>
            <Link href="/mot-reminder" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
              <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">Set a free MOT reminder</p>
              <p className="text-xs text-slate-500 mt-2">Never get caught out — email reminders 28 and 7 days before expiry.</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
