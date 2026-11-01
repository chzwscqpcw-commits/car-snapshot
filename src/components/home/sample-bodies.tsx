"use client";

import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Check,
  CircleCheck,
  ClipboardCheck,
  FileText,
  Fuel,
  Gauge,
  History,
  Landmark,
  MapPin,
  Percent,
  PoundSterling,
  Receipt,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Wind,
  Wrench,
} from "lucide-react";
import { CLASSIC_SAMPLE, REF_YEAR, type SampleCar } from "@/components/home/sample-cars";
import {
  COST_COLOURS,
  COST_LABELS,
  CostBar,
  CostSplit,
  DepreciationCurve,
  ExemptionTimeline,
  Headline,
  ListingBars,
  MileageChart,
  MileageChartWide,
  MiniRing,
  MotMarks,
  OkChip,
  RecallBadge,
  Row,
  ScoreRing,
  TaxUlezChips,
  ValueRange,
  VedBar,
  Verdict,
  latestMiles,
  mileageVsAverage,
  milesPerYear,
  motNote,
  pounds,
} from "@/components/home/sample-graphics";

// What each tool's example card shows below the car's name. "check" is the
// homepage's full report and "valuation" is /value-my-car's result; the rest
// each lead with that tool's own fact — the MOT expiry, the tax due date, the
// mileage plot, the ULEZ verdict, the recall match, the exemption date, the
// buyer's red flags, the year's running costs — in the same rows and motion.

export type SampleVariant =
  | "check"
  | "valuation"
  | "mot"
  | "tax"
  | "mileage"
  | "ulez"
  | "recall"
  | "exemption"
  | "buyer"
  | "running-costs";

/** The header's right-hand label and the button under the card, per variant. */
export const VARIANT_COPY: Record<SampleVariant, { label: string; cta: string }> = {
  check: { label: "Example result", cta: "Check your own car, free" },
  valuation: { label: "Example valuation", cta: "Value your own car, free" },
  mot: { label: "Example MOT history", cta: "Check your own MOT history" },
  tax: { label: "Example tax check", cta: "Check your own tax status" },
  mileage: { label: "Example mileage check", cta: "Check your own mileage" },
  ulez: { label: "Example ULEZ check", cta: "Check your own car for ULEZ" },
  recall: { label: "Example recall check", cta: "Check your own car for recalls" },
  exemption: { label: "Example exemption check", cta: "Check your own car's date" },
  buyer: { label: "Example buyer's check", cta: "Check a car you're viewing" },
  "running-costs": { label: "Example running costs", cta: "See your own car's costs" },
};

const UK_PASS_RATE = 72;
const UK_MILES_PER_YEAR = 7400;
const ULEZ_YEAR = 4562; // £12.50 × 365

/** What sits to the right of the car's name: the health ring, or the tool's verdict. */
export function HeaderAside({ variant, car }: { variant: SampleVariant; car: SampleCar }) {
  switch (variant) {
    case "check":
      return (
        <div className="text-center">
          <ScoreRing score={car.score} />
          <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Health</div>
        </div>
      );
    case "valuation":
      return null;
    case "mot":
      return <Verdict tone="good" label="Valid" />;
    case "tax":
      return <Verdict tone="good" label="Taxed" />;
    case "mileage":
      return <Verdict tone="good" label="Consistent" />;
    case "ulez":
      return car.ulez ? <Verdict tone="good" label="Compliant" /> : <Verdict tone="bad" label="Charge applies" />;
    case "recall":
      return car.openRecalls === 0 ? <Verdict tone="good" label="All clear" /> : <Verdict tone="warn" label={`${car.openRecalls} open`} />;
    case "exemption":
      return <Verdict tone="good" label="Exempt" />;
    case "buyer": {
      const asks = car.buyerFlags.filter((f) => f.tone === "warn").length;
      return asks === 0 ? <Verdict tone="good" label="Looks clean" /> : <Verdict tone="warn" label={`${asks} to ask about`} />;
    }
    case "running-costs":
      return <Verdict tone="info" label={`${pounds(Math.round(car.runningCostTotal / 12 / 5) * 5)} a month`} />;
  }
}

export function VariantBody({ variant, car, wide }: { variant: SampleVariant; car: SampleCar; wide: boolean }) {
  switch (variant) {
    case "check":
      return <CheckBody car={car} wide={wide} />;
    case "valuation":
      return <ValuationBody car={car} wide={wide} />;
    case "mot":
      return <MotBody car={car} wide={wide} />;
    case "tax":
      return <TaxBody car={car} wide={wide} />;
    case "mileage":
      return <MileageBody car={car} wide={wide} />;
    case "ulez":
      return <UlezBody car={car} wide={wide} />;
    case "recall":
      return <RecallBody car={car} wide={wide} />;
    case "exemption":
      return <ExemptionBody wide={wide} />;
    case "buyer":
      return <BuyerBody car={car} />;
    case "running-costs":
      return <RunningCostsBody car={car} wide={wide} />;
  }
}

/** Two columns of rows from md up when the card is the wide inline copy. */
function Rows({ wide, children }: { wide: boolean; children: React.ReactNode }) {
  return <div className={`mt-3 ${wide ? "md:grid md:grid-cols-2 md:gap-x-6" : ""}`}>{children}</div>;
}

function CheckBody({ car, wide }: { car: SampleCar; wide: boolean }) {
  return (
    <Rows wide={wide}>
      <Row icon={<Check className="w-4 h-4 text-emerald-400" />} label="MOT" value={`Valid until ${car.motUntil}`} note={motNote(car.mot)} delay={150} extra={<MotMarks results={car.mot} />} />
      <Row icon={<Gauge className="w-4 h-4 text-cyan-400" />} label="Mileage" value={latestMiles(car)} note={car.mileageNote} delay={250} extra={<MileageChart mileage={car.mileage} />} />
      <Row icon={<PoundSterling className="w-4 h-4 text-amber-400" />} label="Value" value={car.value} note="Private sale, from market data" delay={350} extra={<ValueRange pos={car.valuePos} />} />
      <Row
        icon={<Wind className="w-4 h-4 text-sky-400" />}
        label="Tax & ULEZ"
        value={car.ulez ? "Taxed · ULEZ compliant" : "Taxed · Fails ULEZ"}
        note={car.taxNote}
        delay={450}
        extra={<TaxUlezChips ulez={car.ulez} />}
      />
      <Row
        icon={<ShieldCheck className={`w-4 h-4 ${car.openRecalls === 0 ? "text-emerald-400" : "text-amber-400"}`} />}
        label="Recalls"
        value={car.openRecalls === 0 ? "None outstanding" : `${car.openRecalls} outstanding`}
        note={car.openRecalls === 0 ? "Checked with DVSA" : "Free fix at a dealer"}
        delay={550}
        extra={<RecallBadge open={car.openRecalls} />}
      />
      <Row icon={<Wrench className="w-4 h-4 text-violet-400" />} label="Running costs" value={car.runningCost} note="Fuel, insurance and more" delay={650} extra={<CostSplit split={car.costSplit} />} />
    </Rows>
  );
}

/** The valuation card's headline: the figure, its range, and the band it sits in. */
function ValueHeadline({ car }: { car: SampleCar }) {
  const high = car.listings >= 40;
  return (
    <div className="sample-row mt-3 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-900/25 via-slate-900/80 to-slate-950 p-4" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Sparkles className="h-3 w-3 text-cyan-400" />
        Estimated market value
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-3xl font-bold text-white tracking-tight tabular-nums">£{car.valueMid.toLocaleString("en-GB")}</span>
        <span
          className={`sample-pop inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
            high ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
          }`}
          style={{ animationDelay: "700ms" }}
        >
          <CircleCheck className="h-3 w-3" />
          {high ? "High" : "Medium"} confidence
        </span>
      </div>
      <div className="mt-0.5 text-xs text-slate-400">
        Typical range <span className="font-semibold text-slate-200 tabular-nums">{car.value}</span>
      </div>
      <div className="relative mt-3 h-2 w-full rounded-full bg-slate-700/80">
        <div
          className="sample-grow-x absolute inset-y-0 rounded-full bg-gradient-to-r from-amber-500/70 to-amber-300"
          style={{ left: "22%", width: "56%", animationDelay: "500ms" }}
        />
        <span
          className="sample-pop absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 -ml-[7px] rounded-full bg-white border-2 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
          style={{ left: `${22 + car.valuePos * 56}%`, animationDelay: "900ms" }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500 tabular-nums">
        <span>Trade offer</span>
        <span>Private sale</span>
      </div>
    </div>
  );
}

function ValuationBody({ car, wide }: { car: SampleCar; wide: boolean }) {
  return (
    <>
      <ValueHeadline car={car} />
      <Rows wide={wide}>
        <Row icon={<Gauge className="w-4 h-4 text-cyan-400" />} label="Mileage" value={latestMiles(car)} note={mileageVsAverage(car)} delay={250} extra={<MileageChart mileage={car.mileage} />} />
        <Row
          icon={<TrendingDown className="w-4 h-4 text-amber-400" />}
          label="Since new"
          value={`£${car.newPrice.toLocaleString("en-GB")} new · ${Math.round((car.valueMid / car.newPrice) * 100)}% kept`}
          note={`${REF_YEAR - car.year} years on its curve`}
          delay={350}
          extra={<DepreciationCurve car={car} />}
        />
        <Row icon={<BarChart3 className="w-4 h-4 text-cyan-300" />} label="Market data" value={`${car.listings} live listings`} note="Asking prices, adjusted to sale" delay={450} extra={<ListingBars bars={car.listingBars} />} />
        <Row icon={<Check className="w-4 h-4 text-emerald-400" />} label="MOT" value={`Valid until ${car.motUntil}`} note={motNote(car.mot)} delay={550} extra={<MotMarks results={car.mot} />} />
      </Rows>
    </>
  );
}

function MotBody({ car, wide }: { car: SampleCar; wide: boolean }) {
  const n = car.advisories.length;
  return (
    <>
      <Headline
        tone="emerald"
        eyebrow={
          <>
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            MOT status
          </>
        }
        value={`Valid until ${car.motUntil}`}
        note={`${car.mot.length} tests on record since ${car.year + 3}`}
      />
      <Rows wide={wide}>
        <Row icon={<History className="w-4 h-4 text-emerald-400" />} label="History" value={`${car.mot.length} MOTs`} note={motNote(car.mot).replace(/^\d+ tests? · /, "").replace(/^\w/, (c) => c.toUpperCase())} delay={250} extra={<MotMarks results={car.mot} />} />
        <Row
          icon={<FileText className={`w-4 h-4 ${n === 0 ? "text-emerald-400" : "text-amber-400"}`} />}
          label="Advisories"
          value={n === 0 ? "None on the last test" : `${n} on the last test`}
          note={n === 0 ? "Nothing flagged by the tester" : car.advisories[0]}
          delay={350}
          extra={<RecallBadge open={n} caption="adv" />}
        />
        <Row icon={<Gauge className="w-4 h-4 text-cyan-400" />} label="Mileage at last test" value={latestMiles(car)} note={car.mileageNote} delay={450} extra={<MileageChart mileage={car.mileage} />} />
        <Row
          icon={<Percent className="w-4 h-4 text-violet-400" />}
          label="This model's pass rate"
          value={`${car.modelPassRate}% first time`}
          note={`UK average is about ${UK_PASS_RATE}%`}
          delay={550}
          extra={<MiniRing pct={car.modelPassRate} />}
        />
      </Rows>
    </>
  );
}

function TaxBody({ car, wide }: { car: SampleCar; wide: boolean }) {
  return (
    <>
      <Headline
        tone="emerald"
        eyebrow={
          <>
            <Receipt className="h-3 w-3 text-emerald-400" />
            Tax status
          </>
        }
        value={`Taxed until ${car.taxUntil}`}
        note="Live from DVLA · not SORN"
      />
      <Rows wide={wide}>
        <Row
          icon={<PoundSterling className="w-4 h-4 text-emerald-400" />}
          label="Annual VED"
          value={`${pounds(car.vedAnnual)} a year`}
          note={car.vedBasis}
          delay={250}
          extra={<VedBar ved={car.vedAnnual} />}
        />
        <Row icon={<Check className="w-4 h-4 text-emerald-400" />} label="MOT" value={`Valid until ${car.motUntil}`} note={motNote(car.mot)} delay={350} extra={<MotMarks results={car.mot} />} />
        <Row
          icon={<Wind className="w-4 h-4 text-sky-400" />}
          label="ULEZ"
          value={car.ulez ? "Compliant" : "Not compliant"}
          note={car.taxNote}
          delay={450}
          extra={<OkChip label={car.ulez ? "CLEAN" : "CHARGE"} ok={car.ulez} delay={800} />}
        />
      </Rows>
    </>
  );
}

function MileageBody({ car, wide }: { car: SampleCar; wide: boolean }) {
  const perYear = milesPerYear(car);
  return (
    <>
      <Headline
        tone="cyan"
        eyebrow={
          <>
            <Gauge className="h-3 w-3 text-cyan-400" />
            Latest reading
          </>
        }
        value={latestMiles(car)}
        note={`${car.mileageNote} · ${mileageVsAverage(car).toLowerCase()}`}
      >
        <MileageChartWide car={car} />
      </Headline>
      <Rows wide={wide}>
        <Row
          icon={<Calendar className="w-4 h-4 text-cyan-400" />}
          label="A year"
          value={`${perYear.toLocaleString("en-GB")} miles`}
          note={`UK average is about ${UK_MILES_PER_YEAR.toLocaleString("en-GB")}`}
          delay={550}
          extra={<CostBar share={Math.min(100, (perYear / 16000) * 100)} colour="bg-cyan-400" delay={850} />}
        />
        <Row
          icon={<Check className="w-4 h-4 text-emerald-400" />}
          label="Readings"
          value={`${car.mileage.length} MOT readings`}
          note="Each one higher than the last"
          delay={650}
          extra={<OkChip label="CONSISTENT" ok delay={950} />}
        />
      </Rows>
    </>
  );
}

function UlezBody({ car, wide }: { car: SampleCar; wide: boolean }) {
  const ok = car.ulez;
  return (
    <>
      <Headline
        tone={ok ? "emerald" : "red"}
        eyebrow={
          <>
            <Wind className={`h-3 w-3 ${ok ? "text-emerald-400" : "text-red-400"}`} />
            London ULEZ
          </>
        }
        value={ok ? "No daily charge" : "£12.50 a day"}
        note={ok ? `${car.euroStandard} — meets the standard` : `${car.euroStandard} diesel — the zone needs Euro 6`}
      />
      <Rows wide={wide}>
        <Row
          icon={<MapPin className={`w-4 h-4 ${ok ? "text-emerald-400" : "text-amber-400"}`} />}
          label="Other clean air zones"
          value={ok ? "Compliant in all four" : "Charged in Birmingham & Bristol"}
          note={ok ? "Birmingham, Bath, Bristol, Sheffield" : "Bath and Sheffield don't charge cars"}
          delay={250}
          extra={<OkChip label={ok ? "4 ZONES" : "2 CHARGE"} ok={ok} delay={750} />}
        />
        <Row
          icon={<PoundSterling className={`w-4 h-4 ${ok ? "text-emerald-400" : "text-red-400"}`} />}
          label="If you drive in daily"
          value={ok ? "£0 a year" : `${pounds(ULEZ_YEAR)} a year`}
          note={ok ? "Nothing to pay in any zone" : "Every day of the year in London"}
          delay={350}
          extra={<CostBar share={ok ? 0 : 100} colour="bg-red-400" delay={850} />}
        />
        <Row icon={<Receipt className="w-4 h-4 text-sky-400" />} label="Tax" value={`Taxed until ${car.taxUntil}`} note={`${pounds(car.vedAnnual)} a year`} delay={450} extra={<OkChip label="TAXED" ok delay={950} />} />
      </Rows>
    </>
  );
}

function RecallBody({ car, wide }: { car: SampleCar; wide: boolean }) {
  const open = car.openRecalls > 0;
  return (
    <>
      <Headline
        tone={open ? "amber" : "emerald"}
        eyebrow={
          <>
            <AlertTriangle className={`h-3 w-3 ${open ? "text-amber-400" : "text-emerald-400"}`} />
            Outstanding recalls
          </>
        }
        value={open ? `${car.openRecalls} open` : "All clear"}
        note={open ? car.openRecallTitle : "Nothing outstanding for this make and model"}
      />
      <Rows wide={wide}>
        <Row
          icon={<ShieldCheck className={`w-4 h-4 ${open ? "text-amber-400" : "text-emerald-400"}`} />}
          label="Open recall"
          value={open ? (car.openRecallTitle ?? "1 open") : "None"}
          note={open ? "Free fix at any dealer, no time limit" : "Checked against the DVSA database"}
          delay={250}
          extra={<RecallBadge open={car.openRecalls} />}
        />
        <Row
          icon={<ClipboardCheck className="w-4 h-4 text-cyan-400" />}
          label="Completed"
          value={car.pastRecalls === 0 ? "No past recalls" : `${car.pastRecalls} on record`}
          note={car.pastRecalls === 0 ? "A clean sheet so far" : "Already fixed under recall"}
          delay={350}
          extra={car.pastRecalls > 0 ? <OkChip label="DONE" ok delay={800} /> : undefined}
        />
        <Row icon={<Check className="w-4 h-4 text-emerald-400" />} label="MOT" value={`Valid until ${car.motUntil}`} note={motNote(car.mot)} delay={450} extra={<MotMarks results={car.mot} />} />
      </Rows>
    </>
  );
}

function ExemptionBody({ wide }: { wide: boolean }) {
  const c = CLASSIC_SAMPLE;
  return (
    <>
      <Headline
        tone="emerald"
        eyebrow={
          <>
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            MOT exemption
          </>
        }
        value={`Since ${c.exemptFrom}`}
        note={`40 years from first registration on ${c.firstRegistered}`}
      >
        <ExemptionTimeline year={c.year} exemptFrom={c.exemptFrom} historicTaxFrom={c.historicTaxFrom} />
      </Headline>
      <Rows wide={wide}>
        <Row
          icon={<Landmark className="w-4 h-4 text-amber-400" />}
          label="Historic tax class"
          value={`From ${c.historicTaxFrom}`}
          note="Still taxed at the normal rate until then"
          delay={550}
          extra={<OkChip label="NOT YET" ok={false} warn delay={850} />}
        />
        <Row icon={<Wrench className="w-4 h-4 text-emerald-400" />} label="Substantial changes" value="None declared" note="So the exemption holds" delay={650} extra={<OkChip label="KEPT" ok delay={950} />} />
        <Row icon={<History className="w-4 h-4 text-cyan-400" />} label="Last MOT" value={c.lastMot} note={`${c.lastMotAdvisories} advisories · tests are optional now`} delay={750} />
      </Rows>
    </>
  );
}

function BuyerBody({ car }: { car: SampleCar }) {
  const style = {
    ok: "border-emerald-500/30 bg-emerald-950/30 text-emerald-100",
    warn: "border-amber-500/30 bg-amber-950/30 text-amber-100",
    ask: "border-slate-700 bg-slate-900/60 text-slate-400",
  };
  const mark = { ok: "✓", warn: "!", ask: "?" };
  return (
    <>
      <ul className="mt-3 space-y-2 text-xs">
        {car.buyerFlags.map((f, i) => (
          <li key={i} className={`sample-row flex items-start gap-2 rounded-lg border px-3 py-2 ${style[f.tone]}`} style={{ animationDelay: `${150 + i * 120}ms` }}>
            <span className="w-3 shrink-0 font-bold">{mark[f.tone]}</span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Row icon={<ClipboardCheck className="w-4 h-4 text-cyan-400" />} label="On the day" value="A viewing checklist for this model" note="Tyres, panel gaps, paperwork, the test drive" delay={700} />
      </div>
    </>
  );
}

function RunningCostsBody({ car, wide }: { car: SampleCar; wide: boolean }) {
  const total = car.runningCostTotal;
  const icons = [
    <Fuel key="fuel" className="w-4 h-4 text-cyan-400" />,
    <ShieldCheck key="ins" className="w-4 h-4 text-violet-400" />,
    <Wrench key="svc" className="w-4 h-4 text-amber-400" />,
    <Receipt key="tax" className="w-4 h-4 text-sky-300" />,
  ];
  return (
    <>
      <Headline
        tone="cyan"
        eyebrow={
          <>
            <PoundSterling className="h-3 w-3 text-cyan-400" />
            Running costs
          </>
        }
        value={`${pounds(total)} a year`}
        note="Fuel, insurance, servicing and tax, for your mileage"
      >
        <div className="mt-3">
          <CostSplit split={car.costSplit} wide delay={500} />
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
            {COST_LABELS.map((l, i) => (
              <span key={l} className="inline-flex items-center gap-1">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${COST_COLOURS[i]}`} />
                {l}
              </span>
            ))}
          </div>
        </div>
      </Headline>
      <Rows wide={wide}>
        {car.costSplit.map((share, i) => (
          <Row
            key={COST_LABELS[i]}
            icon={icons[i]}
            label={COST_LABELS[i]}
            value={`${pounds(Math.round((total * share) / 100 / 10) * 10)} a year`}
            note={`${share}% of the total`}
            delay={550 + i * 100}
            extra={<CostBar share={share} colour={COST_COLOURS[i]} delay={800 + i * 100} />}
          />
        ))}
      </Rows>
    </>
  );
}
