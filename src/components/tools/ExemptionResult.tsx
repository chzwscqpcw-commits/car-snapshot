"use client";

import { useMemo } from "react";
import { ShieldCheck, Clock, CalendarDays, AlertTriangle, Wrench } from "lucide-react";
import {
  useVehicleLookup,
  LookupSkeleton,
  LookupError,
  ToolResultLayout,
  type LookupVehicle,
} from "@/components/tools/shared";
import { getHistoricStatus, isApproachingExemption, type HistoricStatus } from "@/lib/historic-vehicle";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
import WarrantyCTA from "@/components/WarrantyCTA";
import Button from "@/components/Button";

function fmt(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function ExemptionResult({
  vrm,
  previewVehicle,
}: {
  vrm: string;
  previewVehicle?: LookupVehicle;
}) {
  const state = useVehicleLookup(previewVehicle ? "" : vrm);
  if (previewVehicle) return <Loaded vrm={vrm} vehicle={previewVehicle} />;
  if (state.kind === "loading") return <LookupSkeleton vrm={vrm} hint="Checking the vehicle's age…" />;
  if (state.kind === "error")
    return <LookupError vrm={vrm} message={state.message} backHref="/mot-exemption-check" />;
  return <Loaded vrm={vrm} vehicle={state.vehicle} />;
}

function Loaded({ vrm, vehicle }: { vrm: string; vehicle: LookupVehicle }) {
  const status = useMemo(() => getHistoricStatus(vehicle), [vehicle]);
  const approaching = isApproachingExemption(status);

  return (
    <ToolResultLayout
      vrm={vrm}
      vehicle={vehicle}
      excludePill="mot-exemption"
      revealPitch="Exemption is one question — the full check adds MOT history, tax, mileage, recalls and a valuation."
    >
      <Hero status={status} approaching={approaching} />
      <Milestones status={status} />
      {status.daysInExemptionGap !== null && <GapCallout status={status} />}
      <SubstantialChanges eligible={status.motExemptEligible} />
      {status.motExemptEligible && <ServicingHook vrm={vrm} />}
      {(status.motExemptEligible || approaching) && (
        <div className="mt-4">
          <WarrantyCTA layout="inline" variant="classic" context="exemption-classic" />
        </div>
      )}
    </ToolResultLayout>
  );
}

function Hero({ status, approaching }: { status: HistoricStatus; approaching: boolean }) {
  if (status.buildYear === null) {
    return (
      <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">Age unknown</h2>
        <p className="mt-1 text-sm text-slate-400">
          DVLA didn&apos;t return a build year or first-registration date for this vehicle, so we
          can&apos;t work out its exemption dates.
        </p>
      </section>
    );
  }

  const exempt = status.motExemptEligible;
  return (
    <section
      className={`mt-4 rounded-2xl border p-5 sm:p-6 ${
        exempt
          ? "border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/70 to-slate-900"
          : approaching
            ? "border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/70 to-slate-900"
            : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <div className="flex items-start gap-3">
        {exempt ? (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
        ) : (
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            {exempt
              ? "Eligible for MOT exemption"
              : approaching
                ? `MOT exempt in ${status.yearsUntilMotExempt} year${status.yearsUntilMotExempt === 1 ? "" : "s"}`
                : "Not exempt — this car still needs an MOT"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            {exempt ? (
              <>
                Built in {status.buildYear}, so it passed 40 years old on{" "}
                <strong className="text-slate-100">{fmt(status.motExemptFrom)}</strong>. Vehicles
                over 40 don&apos;t need an annual MOT — <em>provided</em> they haven&apos;t been
                substantially changed.
              </>
            ) : (
              <>
                Built in {status.buildYear}. It reaches 40 years old on{" "}
                <strong className="text-slate-100">{fmt(status.motExemptFrom)}</strong>, which is
                when MOT exemption becomes available.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

/** The two dates side by side — they are different rules and different dates. */
function Milestones({ status }: { status: HistoricStatus }) {
  if (status.buildYear === null) return null;
  const items = [
    {
      label: "MOT exemption",
      date: status.motExemptFrom,
      done: status.motExemptEligible,
      note: "40th birthday",
    },
    {
      label: "Historic tax class",
      date: status.vedHistoricFrom,
      done: status.vedHistoricEligible,
      note: "1 April after the build-year test",
    },
  ];
  return (
    <section className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((i) => (
        <div
          key={i.label}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className={`h-4 w-4 ${i.done ? "text-emerald-400" : "text-slate-500"}`} />
            <span className="text-sm font-semibold text-slate-100">{i.label}</span>
          </div>
          <p className={`mt-2 text-lg font-bold ${i.done ? "text-emerald-300" : "text-slate-300"}`}>
            {fmt(i.date)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {i.done ? "Available now" : "Not yet"} &middot; {i.note}
          </p>
        </div>
      ))}
    </section>
  );
}

/**
 * The genuinely useful bit. An owner who reads "my car is 40, it's exempt"
 * usually assumes tax stops too. It doesn't — the tax class runs on a different
 * clock and can lag by more than a year.
 */
function GapCallout({ status }: { status: HistoricStatus }) {
  const months = Math.round((status.daysInExemptionGap ?? 0) / 30.44);
  return (
    <section className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <div>
          <h3 className="text-sm font-semibold text-white">
            Careful — you still have to tax it
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            The two 40-year rules run on different clocks. This car is old enough to skip the MOT,
            but the historic tax class isn&apos;t claimable until{" "}
            <strong className="text-slate-100">{fmt(status.vedHistoricFrom)}</strong> — about{" "}
            {months} month{months === 1 ? "" : "s"} away. Until then it must be taxed as normal,
            even with no MOT.
          </p>
        </div>
      </div>
    </section>
  );
}

function SubstantialChanges({ eligible }: { eligible: boolean }) {
  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-slate-100">
        {eligible ? "One condition you have to meet yourself" : "The condition to know about"}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
        Exemption only applies if the vehicle hasn&apos;t been{" "}
        <strong className="text-slate-200">substantially changed</strong> in the last 30 years —
        broadly, a replaced chassis or monocoque, altered axles or running gear, or an engine swap
        beyond what was offered in period. DVLA hold no field for this, so we can&apos;t check it
        and neither can any other site: it&apos;s a declaration <em>you</em> make on form V112 when
        you tax the vehicle.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Exempt or not, the car must still be roadworthy. Driving an unroadworthy vehicle is an
        offence whether or not it needs a test — and plenty of owners keep testing voluntarily for
        exactly that reason.
      </p>
    </section>
  );
}

/** MOT-exempt cars still need servicing — and BMG's MOT product no longer applies. */
function ServicingHook({ vrm }: { vrm: string }) {
  const partner = PARTNER_LINKS.bookMyGarageService;
  const href = partner.buildLink?.(vrm, "exemption-servicing") ?? partner.url;
  return (
    <section className="mt-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900/70 to-slate-900 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">No MOT due — but it still needs servicing</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Losing the annual test also loses the annual once-over that used to catch things early.
            Compare local servicing prices — your reg is pre-loaded, no booking fee.
          </p>
          <Button
            href={href}
            target="_blank"
            rel={getPartnerRel(partner)}
            onClick={() => trackPartnerClick("bookMyGarageService", "exemption-servicing")}
            size="sm"
            className="mt-3"
          >
            Compare servicing prices
          </Button>
        </div>
      </div>
    </section>
  );
}
