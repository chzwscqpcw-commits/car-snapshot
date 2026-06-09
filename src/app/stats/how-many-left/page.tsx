import type { Metadata } from "next";
import Link from "next/link";
import StatsHeroSection from "@/components/stats/StatsHeroSection";
import StatCallout from "@/components/stats/StatCallout";
import StatsRelated from "@/components/stats/StatsRelated";
import FaqAccordion from "@/components/stats/FaqAccordion";
import CiteThisData from "@/components/stats/CiteThisData";
import HowManyLeftExplorer from "@/components/stats/HowManyLeftExplorer";
import ShareButton from "@/components/stats/ShareButton";
import {
  MostCommonChart,
  EndangeredList,
  MothballedList,
  type CarRow,
  type MothRow,
} from "@/components/stats/HowManyLeftCharts";
import hml from "@/data/how-many-left.json";
import bodyTypes from "@/data/body-types.json";
import newPrices from "@/data/new-prices.json";
import motPass from "@/data/mot-pass-rates.json";
import ncap from "@/data/ncap-ratings.json";

const HML = hml as unknown as Record<string, [number, number]>;

// ── Build a clean CAR make|model set from our curated car datasets (the raw
// licensing data also contains motorbikes, vans and machinery). ──
const CAR_KEYS = new Set<string>();
for (const src of [bodyTypes, newPrices, motPass, ncap] as Record<string, unknown>[]) {
  for (const k of Object.keys(src)) if (k.includes("|")) CAR_KEYS.add(k.toUpperCase());
}
const DENY = new Set(["FORD|TRANSIT", "FORD|TRANSIT CONNECT", "VOLKSWAGEN|TRANSPORTER"]);

const MAKE_FIX: Record<string, string> = {
  BMW: "BMW",
  MG: "MG",
  DS: "DS",
  MINI: "MINI",
  "MERCEDES BENZ": "Mercedes-Benz",
  "LAND ROVER": "Land Rover",
};
function tcTok(t: string): string {
  if (/\d/.test(t)) return t;
  if (t.length <= 3) return t;
  return t[0] + t.slice(1).toLowerCase();
}
function pretty(key: string): string {
  const [make, model] = key.split("|");
  const m = MAKE_FIX[make] ?? make.split(" ").map(tcTok).join(" ");
  return `${m} ${model.split(" ").map(tcTok).join(" ")}`;
}

const carRows = [...CAR_KEYS]
  .filter((k) => HML[k] && !DENY.has(k))
  .map((k) => {
    const [lic, sorn] = HML[k];
    return { key: k, name: pretty(k), licensed: lic, sorn, total: lic + sorn };
  });

const MOST_COMMON: CarRow[] = carRows
  .slice()
  .sort((a, b) => b.licensed - a.licensed)
  .slice(0, 12)
  .map(({ name, licensed, sorn }) => ({ name, licensed, sorn }));

const MOTHBALLED: MothRow[] = carRows
  .filter((r) => r.total > 5000)
  .map((r) => ({ name: r.name, licensed: r.licensed, sornPct: Math.round((r.sorn / r.total) * 100) }))
  .sort((a, b) => b.sornPct - a.sornPct)
  .slice(0, 10);

// Curated, recognisable endangered models (display names fixed; counts pulled
// from the data, skipping any not present).
// Curated, recognisable endangered models with a representative period photo
// (Wikimedia Commons, free-licensed — credits rendered on the page). Counts are
// pulled from the data; any not present are skipped.
const ENDANGERED: CarRow[] = (
  [
    { key: "MG|MAESTRO", name: "MG Maestro", img: "mg_maestro", credit: "Vauxford (CC BY-SA 4.0)" },
    { key: "FIAT|UNO", name: "Fiat Uno", img: "fiat_uno", credit: "Rutger van der Maar (CC BY 2.0)" },
    { key: "TRIUMPH|ACCLAIM", name: "Triumph Acclaim", img: "triumph_acclaim", credit: "Charles01 (CC BY-SA 3.0)" },
    { key: "CITROEN|AX", name: "Citroën AX", img: "citroen_ax", credit: "Rudolf Stricker (CC BY-SA 3.0)" },
    { key: "AUSTIN|METRO", name: "Austin Metro", img: "austin_metro", credit: "Charles01 (CC BY-SA 4.0)" },
    { key: "NISSAN|SUNNY", name: "Nissan Sunny", img: "nissan_sunny", credit: "TTTNIS (public domain)" },
    { key: "MORRIS|MARINA", name: "Morris Marina", img: "morris_marina", credit: "Vauxford (CC BY-SA 4.0)" },
    { key: "DAEWOO|MATIZ", name: "Daewoo Matiz", img: "daewoo_matiz", credit: "Vauxford (CC BY-SA 4.0)" },
    { key: "TOYOTA|CARINA", name: "Toyota Carina", img: "toyota_carina", credit: "Mr.choppers (CC BY-SA 4.0)" },
    { key: "VAUXHALL|NOVA", name: "Vauxhall Nova", img: "vauxhall_nova", credit: "Elstro (CC BY 3.0)" },
    { key: "RENAULT|5", name: "Renault 5", img: "renault_5", credit: "Charlie (CC BY 2.0)" },
    { key: "FORD|SIERRA", name: "Ford Sierra", img: "ford_sierra", credit: "Norbert Schnitzler (CC BY-SA 3.0)" },
  ] as { key: string; name: string; img: string; credit: string }[]
)
  .filter((e) => HML[e.key])
  .map((e) => {
    const [lic, sorn] = HML[e.key];
    return { name: e.name, licensed: lic, sorn, img: e.img, credit: e.credit };
  })
  .sort((a, b) => a.licensed - b.licensed);

const TOTAL_MODELS = Object.keys(HML).length;
const TOP = MOST_COMMON[0];
const RAREST = ENDANGERED[0];

export const metadata: Metadata = {
  title: "How Many Are Left? UK Car Survivors by Reg | Free Plate Check",
  description:
    "Enter your reg and find out how many of your car are left on UK roads — from 1.3 million Ford Fiestas to models down to single figures. The survivors, the rarities and the cars fading from Britain's roads.",
  alternates: { canonical: "https://www.freeplatecheck.co.uk/stats/how-many-left" },
  openGraph: {
    title: "How Many Are Left? UK Car Survivors",
    description:
      "Enter your reg and find out how many of your car are still on UK roads. The survivors, the rarities, and the cars fading away.",
    url: "https://www.freeplatecheck.co.uk/stats/how-many-left",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How Many Are Left? UK Car Survivors",
    description: "Enter your reg and find out how many of your car are still on UK roads.",
  },
};

const faqItems = [
  {
    question: "How many of my car are left on UK roads?",
    answer:
      "Enter your registration above and we'll show how many examples of your exact make and model are currently licensed (on the road) in the UK, plus how many are declared off-road (SORN). The figures come from DVLA vehicle-licensing statistics.",
  },
  {
    question: "What does SORN mean?",
    answer:
      "SORN stands for Statutory Off Road Notification — a car the keeper has declared off the road, so it isn't taxed or insured for road use. A high SORN share often means a model is being mothballed in garages rather than scrapped, and some return to the road later.",
  },
  {
    question: "What is the most common car on UK roads?",
    answer: TOP
      ? `The ${TOP.name} is the UK's most common car, with around ${TOP.licensed.toLocaleString()} still licensed and on the road.`
      : "The Ford Fiesta has long been the UK's most common car.",
  },
  {
    question: "Which cars are nearly extinct?",
    answer: RAREST
      ? `Some once-common models have all but vanished — there are only around ${RAREST.licensed.toLocaleString()} ${RAREST.name}s left on the road, for example. Older British models from the 1980s and 90s have fallen the hardest.`
      : "Many 1980s and 90s models have fallen to just a few hundred survivors.",
  },
  {
    question: "Where does the data come from?",
    answer:
      "Survivor counts are based on DVLA vehicle-licensing statistics (the same data behind DfT's published vehicle figures), matched to make and model. Counts are a snapshot and rounded to whole vehicles.",
  },
];

export default function HowManyLeftPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Dataset",
              name: "How Many Cars Are Left on UK Roads",
              description:
                "UK car survivor counts by make and model — how many of each are still licensed (on the road) versus declared off-road (SORN), based on DVLA vehicle-licensing data.",
              url: "https://www.freeplatecheck.co.uk/stats/how-many-left",
              creator: { "@type": "Organization", name: "Free Plate Check", url: "https://www.freeplatecheck.co.uk" },
              spatialCoverage: "United Kingdom",
              variableMeasured: "Number of vehicles licensed and SORN by make and model",
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ]),
        }}
      />
      <StatsHeroSection
        title="How Many Are Left?"
        subtitle="From 1.3 million Ford Fiestas to models down to a handful — find out how many of your car survive on Britain's roads, and whether yours is a rarity."
        breadcrumb="How Many Left"
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* The star — reg-driven explorer */}
        <HowManyLeftExplorer />

        {/* Always-visible share affordance */}
        <div className="mt-5 flex justify-center">
          <ShareButton
            text="How many of your car are left on UK roads? Check yours:"
            url="https://www.freeplatecheck.co.uk/stats/how-many-left"
            label="Share with a friend"
          />
        </div>

        {/* Callouts */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatCallout value={TOTAL_MODELS.toLocaleString()} label="Models tracked" color="emerald" />
          {TOP && <StatCallout value={`${(TOP.licensed / 1e6).toFixed(2)}M`} label={`${TOP.name} (most common)`} color="emerald" />}
          {RAREST && <StatCallout value={RAREST.licensed.toLocaleString()} label={`${RAREST.name} left (near-extinct)`} color="amber" />}
        </div>

        {/* Most common */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-100">Britain&apos;s most common cars</h2>
          <p className="mt-1 mb-5 text-sm text-slate-400">By number currently licensed and on UK roads.</p>
          <MostCommonChart rows={MOST_COMMON} />
        </section>

        {/* Endangered */}
        <section className="mt-14">
          <h2 className="text-xl font-bold text-gray-100">Endangered: Britain&apos;s vanishing cars</h2>
          <p className="mt-1 mb-5 text-sm text-slate-400">
            Once a common sight, now clinging on. Survivors still licensed for the road.
          </p>
          <EndangeredList rows={ENDANGERED} />
        </section>

        {/* Mothballed */}
        <section className="mt-14">
          <h2 className="text-xl font-bold text-gray-100">Mothballed Britain</h2>
          <p className="mt-1 mb-5 text-sm text-slate-400">
            The cars most likely to be sitting in a garage — share of survivors declared off-road (SORN).
          </p>
          <MothballedList rows={MOTHBALLED} />
        </section>

        <p className="mt-6 text-xs text-slate-500">
          Figures are based on DVLA vehicle-licensing data, matched to make and model. &ldquo;Licensed&rdquo;
          means taxed for road use; &ldquo;SORN&rdquo; means declared off-road. Counts are a snapshot.
        </p>

        <CiteThisData title="How Many Cars Are Left on UK Roads" url="https://www.freeplatecheck.co.uk/stats/how-many-left" />

        {/* Insight copy */}
        <div className="my-10 space-y-4 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-gray-100">Survivors and the vanishing</h2>
          <p>
            Britain&apos;s roads are dominated by a familiar few. The {TOP?.name ?? "Ford Fiesta"} alone
            accounts for over a million cars still licensed, with the Golf, Corsa and Focus close behind —
            the supermini and small-family staples that have sold in their millions for decades. At the
            other end sit the forgotten ones: workaday models that were everywhere in their day and have
            quietly slipped towards extinction as they aged out, rusted, or simply became uneconomic to keep
            on the road.
          </p>
          <p>
            The saddest stories are the once-ubiquitous British cars. Models that filled supermarket car
            parks in the 1980s and 90s now number in the hundreds, or fewer — kept alive by enthusiasts
            rather than everyday drivers. Many more sit in the &ldquo;mothballed&rdquo; category, declared off-road on
            a SORN: not quite gone, but waiting in garages and on driveways, their futures uncertain.
          </p>
          <p>
            Curious where your own car sits? Pop your reg in at the top — and if it&apos;s a rarity, it&apos;s
            worth knowing the full picture before it changes hands.
          </p>
        </div>

        <FaqAccordion items={faqItems} />

        {/* Inline CTA back to the tool */}
        <div className="my-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
          <h2 className="text-lg font-bold text-white">Check any car by reg</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
            MOT history, tax, mileage, valuation, recalls and rarity — free, no signup.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
          >
            Run a free car check
          </Link>
        </div>

        <StatsRelated exclude="how-many-left" />
      </div>
    </>
  );
}
